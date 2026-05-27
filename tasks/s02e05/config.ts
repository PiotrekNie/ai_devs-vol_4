/**
 * S02E05 episode configuration.
 *
 * Re-exports shared provider config from tasks/config.js and boilerplate
 * constants; adds drone-specific URLs from environment variables.
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
} from "@ai-devs/agent-boilerplate/config.js";

function posInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Default LLM model for agent reasoning. */
export const DEFAULT_AGENT_MODEL =
  process.env["AGENT_MODEL"]?.trim() ?? "gpt-5.4";

/** Vision model for the analyze_image_vision MCP tool. */
export const AGENT_VISION_MODEL =
  process.env["AGENT_VISION_MODEL"]?.trim() ?? "google/gemini-3-flash-preview";

/** Maximum ReAct loop iterations before the agent gives up. */
export const MAX_ITERATIONS = posInt("AGENT_MAX_ITERATIONS", 50);

/** Max tokens per ReAct LLM turn. */
export const AGENT_MAX_OUTPUT_TOKENS = posInt("AGENT_MAX_OUTPUT_TOKENS", 4096);

/** Live API documentation (agent must fetch via http_request). */
export const DRONE_DOCS_URL =
  process.env["DRONE_DOCS_URL"]?.trim() ??
  "https://hub.ag3nts.org/dane/drone.html";

/**
 * Map PNG URL (set in tasks/.env from course platform).
 * Prefetched to DRONE_MAP_LOCAL_PATH before the agent starts.
 */
export const DRONE_MAP_URL = process.env["DRONE_MAP_URL"]?.trim() ?? "";

/** Local path where bootstrap saves the prefetched map (relative to episode cwd). */
export const DRONE_MAP_LOCAL_PATH =
  process.env["DRONE_MAP_LOCAL_PATH"]?.trim() ?? "data/map.png";
