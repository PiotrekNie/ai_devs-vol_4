/**
 * S04E03 episode configuration.
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

/** ReAct iteration cap — domatowo needs many hub actions. */
export const DOMATOWO_MAX_ITERATIONS = posInt("AGENT_MAX_ITERATIONS", 40);

/**
 * Cap per ReAct turn — keep low for OpenRouter credit limits (HTTP 402).
 * OpenRouter reserves budget from max_output_tokens; afford shrinks as context grows.
 */
export const AGENT_MAX_OUTPUT_TOKENS = posInt("AGENT_MAX_OUTPUT_TOKENS", 512);

/** Echo cap for tool results in LLM context (getMap JSON is large). */
export const DOMATOWO_MAX_TOOL_OUTPUT_CHARS = posInt(
  "AGENT_MAX_TOOL_OUTPUT_CHARS",
  6_000,
);

/** Reasoning model recommended for multi-step mission planning. */
export const DEFAULT_AGENT_MODEL =
  process.env["AGENT_MODEL"]?.trim() ?? "anthropic/claude-sonnet-4-6";

export const TRACING_SERVICE_NAME =
  process.env["TRACING_SERVICE_NAME"]?.trim() ?? "@ai-devs/s04e03";
