export const HUB_VERIFY_URL = "https://hub.ag3nts.org/verify";
export const TASK_NAME = "categorize" as const;

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function parsePositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const v = raw.toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") {
    return false;
  }
  if (v === "1" || v === "true" || v === "yes" || v === "on") {
    return true;
  }
  return fallback;
}

/** Total prompt budget per hub request (rules + id + description), GPT-style token estimate. */
export const CATEGORIZE_MAX_PROMPT_TOKENS = parsePositiveInt(
  "CATEGORIZE_MAX_PROMPT_TOKENS",
  100,
);

/** Set CATEGORIZE_REPAIR=0 to disable OpenRouter-based prefix repair after soft hub errors. */
export const CATEGORIZE_REPAIR_ENABLED = parseBool("CATEGORIZE_REPAIR", true);

/** Max repair retries per CSV row (each retry = one OpenRouter call + repeated POST). */
export const CATEGORIZE_REPAIR_PER_ROW = parsePositiveInt(
  "CATEGORIZE_REPAIR_PER_ROW",
  3,
);

/**
 * OpenRouter model slug for rewriting telegraphic rules (Option A).
 * Must be a valid id from https://openrouter.ai/models (e.g. anthropic/claude-sonnet-4).
 */
export const CATEGORIZE_REPAIR_MODEL =
  process.env.CATEGORIZE_REPAIR_MODEL?.trim()
  ?? "anthropic/claude-sonnet-4";

/** Max characters accepted from repair LLM before shorten (safety cap). */
export const CATEGORIZE_REPAIR_MAX_CHARS = parsePositiveInt(
  "CATEGORIZE_REPAIR_MAX_CHARS",
  6000,
);

/** Full CSV→verify passes; each failure triggers `reset` in main(). */
export const CATEGORIZE_OUTER_ATTEMPTS = parsePositiveInt(
  "CATEGORIZE_OUTER_ATTEMPTS",
  5,
);

export function hubApiKey(): string {
  const key = process.env.HUB_API_KEY?.trim() ?? "";
  if (!key) {
    throw new Error("HUB_API_KEY is not set");
  }
  return key;
}

export function openRouterHeaders(): Record<string, string> | undefined {
  const referer = process.env.OPENROUTER_HTTP_REFERER?.trim();
  const title = process.env.OPENROUTER_APP_NAME?.trim();
  if (!referer && !title) {
    return undefined;
  }
  return {
    ...(referer ? { "HTTP-Referer": referer } : {}),
    ...(title ? { "X-Title": title } : {}),
  };
}

export function getOpenRouterApiKeyForRepair(): string {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set (required when CATEGORIZE_REPAIR is enabled)",
    );
  }
  return apiKey;
}
