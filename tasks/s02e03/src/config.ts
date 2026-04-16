function parsePositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Maximum number of tokens allowed in a prompt. */
export const MAX_PROMPT_TOKENS = parsePositiveInt("MAX_PROMPT_TOKENS", 1500);
