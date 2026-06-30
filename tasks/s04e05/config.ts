/**
 * S04E05 foodwarehouse episode configuration.
 */

import { join } from "node:path";

export {
  AI_API_KEY,
  AI_PROVIDER,
  EXTRA_API_HEADERS,
  RESPONSES_API_ENDPOINT,
  resolveModelForProvider,
} from "../config.js";

export {
  HUB_VERIFY_URL,
  HUB_API_KEY,
  PLANNING_MAX_OUTPUT_TOKENS,
} from "../boilerplate/config.js";

function posInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const episodeRoot = import.meta.dir;

/** Cached city demand JSON (gitignored). */
export const DEMAND_LOCAL_PATH = join(episodeRoot, "data", "food4cities.json");

export const FOOD4CITIES_URL =
  process.env["FOOD4CITIES_URL"]?.trim() ??
  "https://hub.ag3nts.org/dane/food4cities.json";

/** ReAct iteration cap — explore + 8 cities + done retries. */
export const AGENT_MAX_ITERATIONS = posInt("AGENT_MAX_ITERATIONS", 45);

/**
 * Large enough for database query results and done missing arrays.
 * Override via AGENT_MAX_OUTPUT_TOKENS in tasks/.env.
 */
export const AGENT_MAX_OUTPUT_TOKENS = posInt("AGENT_MAX_OUTPUT_TOKENS", 4096);

/** Echo cap for tool results in LLM context. */
export const AGENT_MAX_TOOL_OUTPUT_CHARS = posInt(
  "AGENT_MAX_TOOL_OUTPUT_CHARS",
  12_000,
);

/** Default LLM — cost/quality sweet spot. */
export const DEFAULT_AGENT_MODEL =
  process.env["AGENT_MODEL"]?.trim() ?? "gpt-4o";

export const TRACING_SERVICE_NAME =
  process.env["TRACING_SERVICE_NAME"]?.trim() ?? "@ai-devs/s04e05";
