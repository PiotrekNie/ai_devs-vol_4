import type { Evaluator } from "@langfuse/client";
import { toCaseInput } from "../helpers.js";

const ISO_PATTERN = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const GREETING_PATTERNS =
  /\b(hello|hi|hey|howdy|greetings|good\s+(morning|afternoon|evening|day)|welcome)\b/i;

function extractNumbers(text: string): number[] {
  const matches = text.match(/-?\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map(Number).filter(Number.isFinite);
}

function scoreExactNumber(
  response: string,
  expected: number,
): { value: number; comment: string } {
  const numbers = extractNumbers(response);
  const found = numbers.some((n) => Math.abs(n - expected) < 0.01);
  return found
    ? { value: 1, comment: `Found expected value ${expected}` }
    : { value: 0, comment: `Expected ${expected}, found [${numbers.join(", ")}]` };
}

function scoreTimestamp(response: string): { value: number; comment: string } {
  return ISO_PATTERN.test(response)
    ? { value: 1, comment: "Contains ISO timestamp" }
    : { value: 0, comment: "No ISO timestamp" };
}

function scoreRelevance(
  response: string,
  topic: string,
): { value: number; comment: string } {
  const topicLower = topic.toLowerCase();
  if (topicLower === "greeting" || topicLower.includes("greeting")) {
    return GREETING_PATTERNS.test(response)
      ? { value: 1, comment: "Greeting detected" }
      : { value: 0, comment: "No greeting" };
  }
  const normalized = response.toLowerCase();
  const keywords = topicLower.split(/\s+/);
  const matched = keywords.filter((k) => normalized.includes(k));
  return matched.length > 0
    ? { value: 1, comment: `Matched keywords: ${matched.join(", ")}` }
    : { value: 0, comment: `Topic "${topic}" not reflected` };
}

export const responseCorrectnessEvaluator: Evaluator = async ({
  input,
  output,
  expectedOutput,
}) => {
  const inputCase = toCaseInput(input);
  const response =
    typeof output === "object" &&
    output != null &&
    "response" in output &&
    typeof (output as { response?: unknown }).response === "string"
      ? (output as { response: string }).response
      : typeof output === "string"
        ? output
        : JSON.stringify(output);

  if (typeof expectedOutput !== "object" || expectedOutput == null) {
    return [{ name: "response_correctness", value: 0, comment: "Bad expect" }];
  }

  const expect = expectedOutput as { type?: string; value?: number; topic?: string };
  let scored: { value: number; comment: string };

  switch (expect.type) {
    case "exact_number":
      scored = scoreExactNumber(response, expect.value ?? 0);
      break;
    case "contains_iso_timestamp":
      scored = scoreTimestamp(response);
      break;
    case "relevance":
      scored = scoreRelevance(response, expect.topic ?? "");
      break;
    default:
      scored = { value: 0, comment: `Unknown expect type: ${expect.type}` };
  }

  return [
    {
      name: "response_correctness",
      value: scored.value,
      comment: `[${inputCase.id}] ${scored.comment}`,
    },
  ];
};
