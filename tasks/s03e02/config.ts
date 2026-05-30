/**
 * S03E02 episode configuration.
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

export const SHELL_API_URL =
  process.env["SHELL_API_URL"]?.trim() ?? "https://hub.ag3nts.org/api/shell";

/** ReAct iteration cap — firmware needs many sequential shell commands. */
export const FIRMWARE_MAX_ITERATIONS = posInt("AGENT_MAX_ITERATIONS", 30);

export const AGENT_MAX_OUTPUT_TOKENS = posInt("AGENT_MAX_OUTPUT_TOKENS", 4096);

/** Reasoning model recommended by course homework spec. */
export const DEFAULT_AGENT_MODEL =
  process.env["AGENT_MODEL"]?.trim() ?? "anthropic/claude-sonnet-4-6";

export const TRACING_SERVICE_NAME =
  process.env["TRACING_SERVICE_NAME"]?.trim() ?? "@ai-devs/s03e02";
