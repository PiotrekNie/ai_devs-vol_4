import {
  AI_API_KEY,
  EXTRA_API_HEADERS,
  RESPONSES_API_ENDPOINT,
} from "../../../config.js";

type ResponseOutputItem = {
  type: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string;
  content?: { type: string; text?: string }[];
};

const extractResponseText = (data: {
  output_text?: string;
  output?: ResponseOutputItem[];
}): string => {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const messages = Array.isArray(data?.output)
    ? data.output.filter((item) => item?.type === "message")
    : [];

  const textPart = messages
    .flatMap((message) => (Array.isArray(message?.content) ? message.content : []))
    .find((part) => part?.type === "output_text" && typeof part?.text === "string");

  return textPart?.text ?? "";
};

export const chat = async ({
  model,
  input,
  tools,
  toolChoice = "auto",
  instructions,
  maxOutputTokens = 8192,
}: {
  model: string;
  input: unknown[];
  tools?: unknown[];
  toolChoice?: "auto" | "none" | "required";
  instructions?: string;
  maxOutputTokens?: number;
}) => {
  const body: Record<string, unknown> = { model, input };

  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = toolChoice;
  }
  if (instructions) body.instructions = instructions;
  if (maxOutputTokens) body.max_output_tokens = maxOutputTokens;

  const response = await fetch(RESPONSES_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
      ...EXTRA_API_HEADERS,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    usage?: unknown;
  };

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Responses API failed (${response.status})`);
  }

  return data as {
    output?: ResponseOutputItem[];
    usage?: unknown;
  };
};

export const extractToolCalls = (response: {
  output?: ResponseOutputItem[];
}) =>
  (response.output ?? []).filter((item) => item.type === "function_call");

export const extractText = (response: {
  output?: ResponseOutputItem[];
  output_text?: string;
}) => extractResponseText(response) || null;
