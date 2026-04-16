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

type OutputItem = { type?: string; content?: Array<{ type?: string; text?: string }> };

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
}: ChatParams) => {
  const body: Record<string, unknown> = { model, input };
  if (tools?.length) {
    body.tools = tools as unknown[] | undefined;
    body.tool_choice = toolChoice;
  }
  if (instructions) body.instructions = instructions;

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
