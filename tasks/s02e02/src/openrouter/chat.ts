/**
 * OpenRouter Chat Completions API (OpenAI-compatible) via fetch.
 */
import {
  openRouterApiKey,
  openRouterHeaders,
  OPENROUTER_API_V1_BASE,
} from "../config.ts";

export type ChatContentPart =
  | { type: "text"; text: string }
  | {
      type: "image_url";
      image_url: { url: string; detail?: "auto" | "low" | "high" };
    };

export type ChatCompletionToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

/** Messages for POST /chat/completions (subset used by this project). */
export type ChatCompletionMessageParam =
  | { role: "system"; content: string }
  | { role: "user"; content: string | ChatContentPart[] }
  | {
      role: "assistant";
      content: string | ChatContentPart[] | null;
      tool_calls?: ChatCompletionToolCall[];
    }
  | { role: "tool"; tool_call_id: string; content: string };

export type OpenAiFunctionTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | ChatContentPart[] | null;
      tool_calls?: ChatCompletionToolCall[];
    };
    finish_reason?: string;
  }>;
  error?: { message?: string };
};

function buildAuthHeaders(): Record<string, string> {
  const extra = openRouterHeaders();
  const h: Record<string, string> = {
    Authorization: `Bearer ${openRouterApiKey()}`,
    "Content-Type": "application/json",
    ...(extra ?? {}),
  };
  return h;
}

/**
 * POST https://openrouter.ai/api/v1/chat/completions
 */
export async function postChatCompletion(
  body: Record<string, unknown>,
): Promise<ChatCompletionResponse> {
  const url = `${OPENROUTER_API_V1_BASE}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: ChatCompletionResponse;
  try {
    json = JSON.parse(text) as ChatCompletionResponse;
  } catch {
    throw new Error(`OpenRouter: non-JSON response (HTTP ${res.status}): ${text.slice(0, 400)}`);
  }
  if (!res.ok) {
    const err = json.error?.message ?? text.slice(0, 500);
    throw new Error(`OpenRouter HTTP ${res.status}: ${err}`);
  }
  return json;
}

/**
 * Normalize assistant `content` (string or multimodal parts) to plain text.
 */
export function assistantMessageToText(message: {
  content?: string | ChatContentPart[] | null;
}): string {
  const c = message.content;
  if (c == null || c === "") {
    return "";
  }
  if (typeof c === "string") {
    return c;
  }
  if (Array.isArray(c)) {
    return c
      .filter((p): p is { type: "text"; text: string } => p?.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

export function getFirstChoiceMessage(response: ChatCompletionResponse): {
  role?: string;
  content?: string | ChatContentPart[] | null;
  tool_calls?: ChatCompletionToolCall[];
} | undefined {
  return response.choices?.[0]?.message;
}
