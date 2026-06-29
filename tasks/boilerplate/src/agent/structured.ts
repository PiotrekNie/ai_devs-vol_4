/**
 * Structured Outputs — single-shot LLM calls with json_schema (outside ReAct).
 *
 * Uses the same Responses API endpoint and retry policy as chat() in ai.ts.
 * Contract: research s01e01-llm-interaction §11.
 */

import { z } from "zod";
import {
  AI_API_KEY,
  EXTRA_API_HEADERS,
  RESPONSES_API_ENDPOINT,
} from "../../config.js";
import type { TokenUsage } from "../types/index.js";
import {
  extractResponseText,
  fetchWithRetry,
  parseTokenUsage,
} from "./ai.js";

// ── Errors ────────────────────────────────────────────────────────────────────

export type StructuredOutputErrorCode =
  | "invalid_params"
  | "api_error"
  | "parse_error"
  | "validation_error";

export class StructuredOutputError extends Error {
  readonly code: StructuredOutputErrorCode;

  constructor(code: StructuredOutputErrorCode, message: string) {
    super(message);
    this.name = "StructuredOutputError";
    this.code = code;
  }
}

export class StructuredOutputApiError extends StructuredOutputError {
  readonly status: number;
  readonly bodySnippet: string;

  constructor(status: number, message: string, bodySnippet: string) {
    super("api_error", message);
    this.name = "StructuredOutputApiError";
    this.status = status;
    this.bodySnippet = bodySnippet;
  }
}

export class StructuredOutputParseError extends StructuredOutputError {
  readonly rawText?: string;

  constructor(message: string, rawText?: string) {
    super("parse_error", message);
    this.name = "StructuredOutputParseError";
    this.rawText = rawText;
  }
}

export class StructuredOutputValidationError extends StructuredOutputError {
  readonly zodError: z.ZodError;
  readonly parsed: unknown;
  readonly rawText?: string;

  constructor(zodError: z.ZodError, parsed: unknown, rawText?: string) {
    super(
      "validation_error",
      `Structured output failed Zod validation: ${zodError.message}`,
    );
    this.name = "StructuredOutputValidationError";
    this.zodError = zodError;
    this.parsed = parsed;
    this.rawText = rawText;
  }
}

// ── Types ───────────────────────────────────────────────────────────────────

/** JSON Schema subset for OpenAI Structured Outputs (manual override). */
export type OpenAiJsonSchema = Record<string, unknown>;

const SCHEMA_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export type ChatStructuredParams<T> = {
  model: string;
  schema: z.ZodType<T>;
  schemaName: string;
  input?: unknown[];
  instructions?: string;
  reasoning?: Record<string, unknown>;
  maxOutputTokens?: number;
  temperature?: number;
  /** Default true — provider guarantees response shape. */
  strict?: boolean;
  /** Bypass Zod→JSON conversion; schema still used for safeParse. */
  jsonSchema?: OpenAiJsonSchema;
};

export type ChatStructuredOptions = {
  retryDelayBaseMs?: number;
  maxOutputTokens?: number;
  tracingMetadata?: Record<string, unknown>;
  includeRawText?: boolean;
};

export type ChatStructuredResult<T> = {
  data: T;
  usage?: TokenUsage;
  rawText?: string;
};

export interface StructuredAIAdapter {
  generateObject<T>(
    params: Omit<ChatStructuredParams<T>, "model">,
    options?: ChatStructuredOptions,
  ): Promise<ChatStructuredResult<T>>;
}

// ── Zod → JSON Schema ─────────────────────────────────────────────────────────

function assertJsonSchemaRoot(schema: OpenAiJsonSchema): void {
  const rootType = schema["type"];
  if (rootType !== "object" && rootType !== "array") {
    throw new StructuredOutputError(
      "invalid_params",
      'jsonSchema root must have type "object" or "array"',
    );
  }
}

/**
 * Converts a Zod schema to OpenAI Structured Outputs JSON Schema (strict subset).
 * Uses Zod 4 built-in toJSONSchema(); strips $schema metadata.
 */
export function zodToOpenAiJsonSchema(
  schema: z.ZodType<unknown>,
  _options?: { name?: string },
): OpenAiJsonSchema {
  const raw = schema.toJSONSchema() as OpenAiJsonSchema;
  const { $schema: _s, ...rest } = raw;
  assertJsonSchemaRoot(rest);
  return rest;
}

function resolveJsonSchema(params: ChatStructuredParams<unknown>): OpenAiJsonSchema {
  if (params.jsonSchema) {
    assertJsonSchemaRoot(params.jsonSchema);
    return params.jsonSchema;
  }
  return zodToOpenAiJsonSchema(params.schema);
}

function validateParams<T>(params: ChatStructuredParams<T>): void {
  if (!SCHEMA_NAME_PATTERN.test(params.schemaName)) {
    throw new StructuredOutputError(
      "invalid_params",
      `schemaName must match ${SCHEMA_NAME_PATTERN.source}`,
    );
  }
  if (!params.model.trim()) {
    throw new StructuredOutputError("invalid_params", "model is required");
  }
}

function formatApiError(
  response: Response,
  data: Record<string, unknown>,
): StructuredOutputApiError {
  const err = data["error"];
  const errMsg =
    typeof err === "string"
      ? err
      : typeof err === "object" &&
          err !== null &&
          "message" in err &&
          typeof (err as { message?: unknown }).message === "string"
        ? (err as { message: string }).message
        : `API request failed (${response.status})`;
  const errExtra =
    err && typeof err === "object"
      ? JSON.stringify({
          code: (err as { code?: unknown }).code,
          type: (err as { type?: unknown }).type,
          param: (err as { param?: unknown }).param,
        })
      : "";
  const bodyHint = JSON.stringify(data).slice(0, 1_200);
  const message = errExtra ? `${errMsg} ${errExtra}` : errMsg;
  return new StructuredOutputApiError(
    response.status,
    `${message} | body: ${bodyHint}`,
    bodyHint,
  );
}

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * Single-shot LLM call with Structured Outputs (json_schema, strict by default).
 * No tools — use createAgent for ReAct + function calling.
 */
export async function chatStructured<T>(
  params: ChatStructuredParams<T>,
  options: ChatStructuredOptions = {},
): Promise<ChatStructuredResult<T>> {
  validateParams(params);

  const strict = params.strict ?? true;
  const jsonSchema = resolveJsonSchema(
    params as ChatStructuredParams<unknown>,
  );
  const maxOutputTokens =
    options.maxOutputTokens ?? params.maxOutputTokens;

  const body: Record<string, unknown> = {
    model: params.model,
    input: params.input ?? [],
    text: {
      format: {
        type: "json_schema",
        name: params.schemaName,
        strict,
        schema: jsonSchema,
      },
    },
  };

  if (params.instructions) body["instructions"] = params.instructions;
  if (params.reasoning && Object.keys(params.reasoning).length > 0) {
    body["reasoning"] = params.reasoning;
  }
  if (maxOutputTokens !== undefined && maxOutputTokens > 0) {
    body["max_output_tokens"] = maxOutputTokens;
  }
  if (params.temperature !== undefined) {
    body["temperature"] = params.temperature;
  }

  const response = await fetchWithRetry(
    RESPONSES_API_ENDPOINT,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
        ...EXTRA_API_HEADERS,
      },
      body: JSON.stringify(body),
    },
    options.retryDelayBaseMs,
  );

  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok || data["error"]) {
    throw formatApiError(response, data);
  }

  const rawText = extractResponseText(data);
  if (!rawText) {
    throw new StructuredOutputParseError("empty structured response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    throw new StructuredOutputParseError(
      "response is not valid JSON",
      rawText,
    );
  }

  const result = params.schema.safeParse(parsed);
  if (!result.success) {
    throw new StructuredOutputValidationError(
      result.error,
      parsed,
      options.includeRawText ? rawText : undefined,
    );
  }

  const usage = parseTokenUsage(data);
  return {
    data: result.data,
    usage,
    ...(options.includeRawText ? { rawText } : {}),
  };
}

/** Factory bound to a model — mirror of createAIAdapter for structured calls. */
export function createStructuredAIAdapter(cfg: {
  model: string;
  maxOutputTokens?: number;
  temperature?: number;
  reasoning?: Record<string, unknown>;
}): StructuredAIAdapter {
  return {
    generateObject<T>(
      params: Omit<ChatStructuredParams<T>, "model">,
      options?: ChatStructuredOptions,
    ): Promise<ChatStructuredResult<T>> {
      return chatStructured(
        {
          ...params,
          model: cfg.model,
          maxOutputTokens: params.maxOutputTokens ?? cfg.maxOutputTokens,
          temperature: params.temperature ?? cfg.temperature,
          reasoning: params.reasoning ?? cfg.reasoning,
        },
        options,
      );
    },
  };
}
