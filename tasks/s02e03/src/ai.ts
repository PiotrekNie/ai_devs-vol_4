/**
 * AI provider client — calls the Responses API (OpenAI / OpenRouter).
 *
 * Handles the request/response cycle and text extraction.
 * Provider/key selection is handled by the root config.js.
 */

import {
  AI_API_KEY,
  EXTRA_API_HEADERS,
  RESPONSES_API_ENDPOINT,
} from "../../config.js";
import { logScript } from "./log.js";

type OutputItem = { type?: string; content?: Array<{ type?: string; text?: string }> };

const REASONING_EFFORTS = new Set([
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
]);

/** Optional Responses API `reasoning` body. Set `S02E03_REASONING_EFFORT=off` to omit. Default effort `medium`. */
export function resolveReasoningForRequest():
  | Record<string, unknown>
  | undefined {
  const raw = process.env.S02E03_REASONING_EFFORT?.trim().toLowerCase();
  if (raw === "" || raw === "off" || raw === "false" || raw === "0") {
    return undefined;
  }
  const effort =
    raw && REASONING_EFFORTS.has(raw)
      ? raw
      : "medium";
  return { effort };
}

function stringifyReasoningItem(item: Record<string, unknown>): string {
  if (typeof item.summary === "string") {
    return item.summary;
  }
  if (Array.isArray(item.summary)) {
    return item.summary.map((x) => String(x)).join(" ");
  }
  if (typeof item.text === "string") {
    return item.text;
  }
  const content = item.content;
  if (Array.isArray(content)) {
    const parts = content
      .map((c) =>
        typeof c === "object" &&
          c !== null &&
          "text" in c &&
          typeof (c as { text?: string }).text === "string"
          ? (c as { text: string }).text
          : "",
      )
      .filter(Boolean);
    if (parts.length) {
      return parts.join("\n");
    }
  }
  try {
    return JSON.stringify(item).slice(0, 2000);
  } catch {
    return "[reasoning]";
  }
}

/** Logs reasoning / thought output items from a Responses API success payload (stderr). */
export function logReasoningFromResponse(data: unknown): void {
  if (typeof data !== "object" || data === null) {
    return;
  }
  const output = (data as { output?: unknown[] }).output;
  if (!Array.isArray(output)) {
    return;
  }
  for (const item of output) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const o = item as Record<string, unknown>;
    const t = o.type;
    if (t !== "reasoning" && t !== "thought") {
      continue;
    }
    const summary = stringifyReasoningItem(o);
    logScript("reasoning", {
      type: String(t),
      summary: summary.slice(0, 4000),
    });
  }
}

// The Responses API returns text in two possible locations
const extractResponseText = (data: unknown): string => {
  if (typeof data !== "object" || data === null) return "";
  const d = data as { output_text?: unknown; output?: OutputItem[] };
  if (typeof d.output_text === "string") {
    return d.output_text.trim();
  }

  const message = d.output?.find((o) => o?.type === "message");
  const part = message?.content?.find((c) => c?.type === "output_text");
  return typeof part?.text === "string" ? part.text.trim() : "";
};

/**
 * Sends a chat request to the Responses API.
 * Returns the raw response (caller extracts tool calls or text).
 */
export type ChatParams = {
  model: string;
  input?: unknown[];
  tools?: unknown[];
  toolChoice?: "auto" | "none" | "required";
  instructions?: string;
  /** OpenAI Responses API reasoning control (ignored by models that do not support it). */
  reasoning?: Record<string, unknown>;
  /** Caps completion reservation (frees context for input on 128k models). */
  maxOutputTokens?: number;
};

/** Successful Responses API JSON body (fields used by this client). */
export type ResponsesApiSuccess = Record<string, unknown> & {
  output?: unknown[];
};

export const chat = async ({
  model,
  input,
  tools,
  toolChoice,
  instructions,
  reasoning,
  maxOutputTokens,
}: ChatParams) => {
  const body: Record<string, unknown> = { model, input };
  if (tools?.length) {
    body.tools = tools as unknown[] | undefined;
    body.tool_choice = toolChoice;
  }
  if (instructions) body.instructions = instructions;
  if (reasoning && Object.keys(reasoning).length > 0) {
    body.reasoning = reasoning;
  }
  if (maxOutputTokens !== undefined && maxOutputTokens > 0) {
    body.max_output_tokens = maxOutputTokens;
  }

  const response = await fetch(RESPONSES_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
      ...EXTRA_API_HEADERS,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok || data.error) {
    console.error("[ai] Responses API error body:", JSON.stringify(data));
    const err = data.error;
    const errMsg =
      typeof err === "string"
        ? err
        : (typeof err === "object" &&
            err !== null &&
            "message" in err &&
            typeof (err as { message?: unknown }).message === "string"
            ? (err as { message: string }).message
            : `API request failed (${response.status})`);
    const errExtra =
      err && typeof err === "object"
        ? JSON.stringify({
            code: (err as { code?: unknown }).code,
            type: (err as { type?: unknown }).type,
            param: (err as { param?: unknown }).param,
          })
        : "";
    const full = errExtra ? `${errMsg} ${errExtra}` : errMsg;
    throw new Error(full);
  }

  logReasoningFromResponse(data);

  return data as ResponsesApiSuccess;
};

export type FunctionToolCall = {
  type: "function_call";
  name: string;
  arguments: string;
  call_id: string;
};

export const extractToolCalls = (response: unknown): FunctionToolCall[] => {
  if (typeof response !== "object" || response === null) return [];
  const output = (response as { output?: unknown[] }).output;
  const items = Array.isArray(output) ? output : [];
  return items.filter((item): item is FunctionToolCall => {
    if (typeof item !== "object" || item === null) return false;
    const o = item as Record<string, unknown>;
    return (
      o.type === "function_call" &&
      typeof o.name === "string" &&
      typeof o.arguments === "string" &&
      typeof o.call_id === "string"
    );
  });
};

export const extractText = (response: unknown) => {
  const t = extractResponseText(response);
  return t || null;
};
