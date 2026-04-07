export const HUB_VERIFY_URL = "https://hub.ag3nts.org/verify";
export const TASK_NAME = "electricity" as const;

/** Public reference image from the task brief (solved layout). */
export const DEFAULT_REFERENCE_SOLVED_IMAGE =
  "https://hub.ag3nts.org/i/solved_electricity.png";

/**
 * Docelowy układ „Plan połączeń elektrycznych” (N=1, E=2, S=4, W=8).
 * Zgodny z materiałem zadania / solved_electricity.png; nadpisz przez `ELECTRICITY_TARGET_MASKS`.
 * Gdy hub zmieni grafikę rozwiązania, uruchom z katalogu pakietu: `bun run verify-target` (patrz `scripts/verify-target-masks.ts`).
 */
export const REFERENCE_SOLVED_MASKS: readonly (readonly number[])[] = [
  [6, 14, 10],
  [5, 7, 14],
  [11, 9, 3],
];

/** OpenRouter OpenAI-compatible API base (no trailing slash). */
export const OPENROUTER_API_V1_BASE = "https://openrouter.ai/api/v1";

function parsePositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const ELECTRICITY_MAX_ITERATIONS = parsePositiveInt(
  "ELECTRICITY_MAX_ITERATIONS",
  12,
);

export const ELECTRICITY_AGENT_MAX_STEPS = parsePositiveInt(
  "ELECTRICITY_AGENT_MAX_STEPS",
  32,
);

export const ELECTRICITY_AGENT_MAX_OUTPUT_TOKENS = parsePositiveInt(
  "ELECTRICITY_AGENT_MAX_OUTPUT_TOKENS",
  4096,
);

/**
 * How many times to repeat "pair read until match" before tie-breaking with a third read.
 * 0 = single vision read (no consensus). Default 2.
 */
export function electricityVisionConsensusRounds(): number {
  const raw = process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS?.trim();
  if (!raw) {
    return 2;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return 2;
  }
  return n;
}

/** Inset from each cell edge when cutting tiles (avoids grid line artifacts). */
export const TILE_PADDING_PX = 12;

/**
 * Optional extra per-tile crop (fraction of tile width/height per side) before per-tile vision.
 * Set `ELECTRICITY_TILE_VISION_INSET_FRAC` e.g. `0.025`–`0.03` if neighbor wires bleed into crops.
 */
export function electricityTileVisionInsetFrac(): number {
  const raw = process.env.ELECTRICITY_TILE_VISION_INSET_FRAC?.trim();
  if (!raw) {
    return 0;
  }
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0 || n > 0.45) {
    return 0;
  }
  return n;
}

/** OpenRouter slug for the tool-calling agent (or `ELECTRICITY_AGENT_MODEL`). */
export function electricityAgentModel(): string {
  return (
    process.env.ELECTRICITY_AGENT_MODEL?.trim()
    ?? "openai/gpt-4o-mini"
  );
}

/** Vision model for board PNGs / per-tile edge analysis (structured JSON → NESW masks). */
export function electricityVisionModel(): string {
  return (
    process.env.ELECTRICITY_VISION_MODEL?.trim()
    ?? "google/gemini-3-flash-preview"
  );
}

export function hubApiKey(): string {
  const key = process.env.HUB_API_KEY?.trim() ?? "";
  if (!key) {
    throw new Error("HUB_API_KEY is not set");
  }
  return key;
}

export function openRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim() ?? "";
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set");
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

export function boardPngUrl(apiKey?: string): string {
  return `https://hub.ag3nts.org/data/${apiKey ?? hubApiKey()}/electricity.png`;
}
