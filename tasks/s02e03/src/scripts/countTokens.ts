/**
 * Token count via tiktoken (`js-tiktoken`), encoding `o200k_base` (GPT-4o / recent OpenAI chat models).
 */
import { getEncoding } from "js-tiktoken";

const enc = getEncoding("o200k_base");

export function countTokens(text: string): number {
  const t = text.trim();
  if (t.length === 0) {
    return 0;
  }
  return enc.encode(t).length;
}
