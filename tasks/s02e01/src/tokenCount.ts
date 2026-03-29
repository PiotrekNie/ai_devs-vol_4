/**
 * Approximate token count for short English prompts (GPT-like; lesson references GPT-5.2-style limits).
 * For exact counts use tiktokenizer; this is sufficient for staying under hub limits.
 */
export function countTokens(text: string): number {
  const t = text.trim();
  if (t.length === 0) {
    return 0;
  }
  // ~4 chars/token for English; slightly conservative for safety
  return Math.ceil(t.length / 3.5);
}
