import { chat, extractText } from "../ai.js";
import { parseJsonObjectFromText } from "./parseModelJson.js";

const minimizeMessageInstructions = [
  "You compress one log message into an ultra-short summary.",
  "Return ONLY JSON with exactly this shape:",
  '{"data":[{"id":"string","message":"string"}]}',
  "The data array must contain exactly one object (one minimized message for the single input line).",
  "Rules:",
  "1) Keep ONLY 1-2 short facts, remove filler.",
  "2) Prefer format: '<critical fact>.'.",
  "3) Max 8 words per sentence.",
].join("\n");

function minimizedMessageFromParsed(parsed: unknown, rawText: string): string {
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(
      `Invalid model response: not an object. Raw: ${rawText.slice(0, 500)}`,
    );
  }
  const data = (parsed as { data?: unknown }).data;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(
      `Invalid model response: missing or empty data. Raw: ${rawText.slice(0, 500)}`,
    );
  }
  const first = data[0];
  if (typeof first !== "object" || first === null) {
    throw new Error(
      `Invalid model response: data[0] is not an object. Raw: ${rawText.slice(0, 500)}`,
    );
  }
  const msg = (first as { message?: unknown }).message;
  if (typeof msg !== "string") {
    throw new Error(
      `Invalid model response: data[0].message is not a string. Raw: ${rawText.slice(0, 500)}`,
    );
  }
  return msg;
}

export const minimizeMessage = async (message: string) => {
  const ID_REGEX = /\b[A-Z]{2,}\d+[A-Z0-9-]*\b/g;
  const response = await chat({
    model: "gpt-4o-mini",
    instructions: minimizeMessageInstructions,
    input: [
      {
        role: "user",
        content: [
          "Minimize this single log entry. Input JSON:",
          JSON.stringify({ data: [message] }),
        ].join("\n"),
      },
    ],
  });
  const text = extractText(response);
  if (!text) {
    throw new Error("Empty model response");
  }
  const parsed = parseJsonObjectFromText(text);
  const minimized = minimizedMessageFromParsed(parsed, text);
  const ids = [...new Set(message.match(ID_REGEX) ?? [])];

  if (ids.length > 0) {
    return `${ids.join(", ")} ${minimized}`;
  }

  return minimized;
};
