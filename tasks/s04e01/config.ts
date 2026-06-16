/**
 * S04E01 episode configuration.
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
  PLANNING_MAX_OUTPUT_TOKENS,
} from "../boilerplate/config.js";

function posInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** ReAct iteration cap — okoeditor: few updates + done retries. */
export const OKOEDITOR_MAX_ITERATIONS = posInt("AGENT_MAX_ITERATIONS", 20);

export const AGENT_MAX_OUTPUT_TOKENS = posInt("AGENT_MAX_OUTPUT_TOKENS", 4096);

export const DEFAULT_AGENT_MODEL =
  process.env["AGENT_MODEL"]?.trim() ?? "gpt-4o-mini";

export const TRACING_SERVICE_NAME =
  process.env["TRACING_SERVICE_NAME"]?.trim() ?? "@ai-devs/s04e01";

export const OKOEDITOR_TASK_NAME = "okoeditor";
