/**
 * S03E01 episode configuration.
 */

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
  MAX_ITERATIONS,
  DEFAULT_AGENT_MODEL,
  PLANNING_MAX_OUTPUT_TOKENS,
} from "../boilerplate/config.js";

function posInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const AGENT_MAX_OUTPUT_TOKENS = posInt("AGENT_MAX_OUTPUT_TOKENS", 4096);

/** Directory with sensor JSON files (relative to episode cwd). */
export const DEFAULT_SENSORS_DIR =
  process.env["S03E01_SENSORS_DIR"]?.trim() ?? "sensors";

/** Model for batch operator_notes classification (minimal output). */
export const NOTE_CLASSIFIER_MODEL =
  process.env["S03E01_NOTE_MODEL"]?.trim() ?? "gpt-4o-mini";

/** Langfuse service name for this episode. */
export const TRACING_SERVICE_NAME =
  process.env["TRACING_SERVICE_NAME"]?.trim() ?? "@ai-devs/s03e01";
