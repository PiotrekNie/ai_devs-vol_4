/**
 * AI adapter — OpenAI Responses API with exponential backoff on 429/503.
 *
 * Implements the AIAdapter interface defined in src/types/index.ts.
 * Provider/key selection is handled by config.ts → tasks/config.js.
 */

import {
  AI_API_KEY,
  EXTRA_API_HEADERS,
  RESPONSES_API_ENDPOINT,
  RETRY_BASE_DELAY_MS,
  MAX_RETRY_ATTEMPTS,
} from "../../config.js";
import type { ModelResponse, ToolCall } from "../types/index.js";

// ── Retry / backoff ───────────────────────────────────────────────────────────

const RETRYABLE_STATUS_CODES = new Set([429, 503]);

/**
 * Wraps fetch with exponential backoff on retryable HTTP status codes.
 *
 * @param delayOverrideMs Pass 0 in tests to skip real waits.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  delayOverrideMs?: number,
): Promise<Response> {
  const baseDelay = delayOverrideMs ?? RETRY_BASE_DELAY_MS;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const response = await fetch(url, options);

    if (!RETRYABLE_STATUS_CODES.has(response.status)) {
      return response;
    }

    const isLastAttempt = attempt === MAX_RETRY_ATTEMPTS - 1;
    if (isLastAttempt) {
      return response;
    }

    const delay = baseDelay * Math.pow(2, attempt);
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("fetchWithRetry: unreachable");
}

// ── Response parsing ──────────────────────────────────────────────────────────

type OutputItem = {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
};

function extractResponseText(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as { output_text?: unknown; output?: OutputItem[] };

  if (typeof d.output_text === "string" && d.output_text.trim()) {
    return d.output_text.trim();
  }

  const message = d.output?.find((o) => o?.type === "message");
  const part = message?.content?.find((c) => c?.type === "output_text");
  return typeof part?.text === "string" && part.text.trim()
    ? part.text.trim()
    : null;
}

/**
 * Filters reasoning/thought items from Responses API output so they are not
 * replayed on every subsequent turn (significant context saving).
 */
function compactOutputItems(output: unknown[] | undefined): unknown[] {
  if (!Array.isArray(output)) return [];
  return output.filter((item) => {
    if (typeof item !== "object" || item === null) return true;
    const t = (item as { type?: unknown }).type;
    return t !== "reasoning" && t !== "thought";
  });
}

function extractToolCalls(output: unknown[] | undefined): ToolCall[] {
  if (!Array.isArray(output)) return [];
  return output.filter((item): item is ToolCall => {
    if (typeof item !== "object" || item === null) return false;
    const o = item as Record<string, unknown>;
    return (
      o["type"] === "function_call" &&
      typeof o["name"] === "string" &&
      typeof o["arguments"] === "string" &&
      typeof o["call_id"] === "string"
    );
  });
}

// ── Chat params ───────────────────────────────────────────────────────────────

export type ChatParams = {
  model: string;
  input?: unknown[];
  tools?: unknown[];
  toolChoice?: "auto" | "none" | "required";
  instructions?: string;
  reasoning?: Record<string, unknown>;
  maxOutputTokens?: number;
};

export type ChatOptions = {
  /** Override retry base delay in ms. Pass 0 in tests. */
  retryDelayBaseMs?: number;
  toolChoice?: "auto" | "none" | "required";
  maxOutputTokens?: number;
};

// ── AIAdapter interface ───────────────────────────────────────────────────────

export interface AIAdapter {
  generateResponse(
    messages: unknown[],
    tools: unknown[],
    instructions?: string,
    options?: ChatOptions,
  ): Promise<ModelResponse>;
}

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * Calls the Responses API and returns a parsed ModelResponse.
 * Retries on 429 and 503 with exponential backoff.
 */
export async function chat(
  params: ChatParams,
  options: ChatOptions = {},
): Promise<ModelResponse> {
  const body: Record<string, unknown> = {
    model: params.model,
    input: params.input ?? [],
  };
  if (params.tools?.length) {
    body["tools"] = params.tools;
    body["tool_choice"] = params.toolChoice ?? "auto";
  }
  if (params.instructions) body["instructions"] = params.instructions;
  if (params.reasoning && Object.keys(params.reasoning).length > 0) {
    body["reasoning"] = params.reasoning;
  }
  if (params.maxOutputTokens !== undefined && params.maxOutputTokens > 0) {
    body["max_output_tokens"] = params.maxOutputTokens;
  }

  const delayOverride = options.retryDelayBaseMs;
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
    delayOverride,
  );

  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok || data["error"]) {
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
    throw new Error(
      [errExtra ? `${errMsg} ${errExtra}` : errMsg, bodyHint].join(" | body: "),
    );
  }

  const output = (data["output"] as unknown[] | undefined) ?? [];
  const toolCalls = extractToolCalls(output);
  const rawOutputItems = compactOutputItems(output);
  const content = extractResponseText(data);

  return { content, toolCalls, rawOutputItems };
}

/**
 * Factory that creates an AIAdapter bound to a specific model and options.
 * Pass optional `reasoning` or `maxOutputTokens` for extended control.
 */
export function createAIAdapter(cfg: {
  model: string;
  reasoning?: Record<string, unknown>;
  maxOutputTokens?: number;
}): AIAdapter {
  return {
    generateResponse(
      messages,
      tools,
      instructions,
      options,
    ): Promise<ModelResponse> {
      return chat(
        {
          model: cfg.model,
          input: messages,
          tools,
          instructions,
          reasoning: cfg.reasoning,
          toolChoice: options?.toolChoice,
          maxOutputTokens: options?.maxOutputTokens ?? cfg.maxOutputTokens,
        },
        options,
      );
    },
  };
}
