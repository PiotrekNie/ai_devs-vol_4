/**
 * Boilerplate runtime configuration.
 *
 * Re-exports shared provider config from tasks/config.js and adds
 * boilerplate-specific constants sourced from environment variables.
 */

export {
  AI_API_KEY,
  AI_PROVIDER,
  EXTRA_API_HEADERS,
  RESPONSES_API_ENDPOINT,
  resolveModelForProvider,
} from '../config.js';

function posInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function nonNegInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Default LLM model for agent reasoning. */
export const DEFAULT_AGENT_MODEL =
  process.env['AGENT_MODEL']?.trim() ?? 'gpt-4o';

/** Vision model for the analyze_image_vision MCP tool. */
export const AGENT_VISION_MODEL =
  process.env['AGENT_VISION_MODEL']?.trim() ?? 'gpt-4o-mini';

/** Maximum ReAct loop iterations before the agent gives up. */
export const MAX_ITERATIONS = posInt('AGENT_MAX_ITERATIONS', 500);

/** Max output tokens for planning turn 0 (outside MAX_ITERATIONS). */
export const PLANNING_MAX_OUTPUT_TOKENS = posInt(
  'AGENT_PLANNING_MAX_OUTPUT_TOKENS',
  1024,
);

/** Max tokens per ReAct LLM turn (avoids truncated thoughts before tool calls). */
export const AGENT_MAX_OUTPUT_TOKENS = posInt('AGENT_MAX_OUTPUT_TOKENS', 4096);

/**
 * Maximum characters echoed back per tool result.
 * Large outputs are truncated to prevent context overflow.
 */
export const MAX_TOOL_OUTPUT_CHARS = Math.max(
  8_000,
  posInt('AGENT_MAX_TOOL_OUTPUT_CHARS', 24_000),
);

/**
 * Maximum characters returned by the read_file tool.
 * Files larger than this are chunked; use offset + limit params.
 */
export const MAX_FILE_READ_CHARS = posInt('AGENT_MAX_FILE_READ_CHARS', 50_000);

/** Base delay (ms) between retry attempts (doubles each attempt). */
export const RETRY_BASE_DELAY_MS = nonNegInt(
  'AGENT_RETRY_BASE_DELAY_MS',
  1_000,
);

/** Maximum number of retry attempts for 429/503 errors. */
export const MAX_RETRY_ATTEMPTS = posInt('AGENT_MAX_RETRY_ATTEMPTS', 5);

/** Default course hub verification endpoint. */
export const HUB_VERIFY_URL =
  process.env['HUB_VERIFY_URL']?.trim() ?? 'https://hub.ag3nts.org/verify';

/** Course hub API key (required for submit_to_hub). */
export const HUB_API_KEY = process.env['HUB_API_KEY']?.trim() ?? '';

/**
 * AI Devs zmail API (course mailbox). Same `apikey` as hub unless overridden.
 * @see docs/context/s02e04.md
 */
export const ZMAIL_API_URL =
  process.env['ZMAIL_API_URL']?.trim() ?? 'https://hub.ag3nts.org/api/zmail';

/**
 * When estimated conversation tokens exceed this, middle messages are dropped
 * (first user message + tail kept). Tunable for long mailbox runs.
 */
export const MAILBOX_MEMORY_TRIM_TOKEN_EST = posInt(
  'MAILBOX_MEMORY_TRIM_TOKEN_EST',
  14_000,
);

/** Items retained at end of conversation after trim (plus first message). */
export const MAILBOX_MEMORY_KEEP_TAIL_ITEMS = posInt(
  'MAILBOX_MEMORY_KEEP_TAIL_ITEMS',
  28,
);

/** Token estimate threshold for Observer pass (chars / 4 ≈ tokens). */
export const OBSERVER_THRESHOLD_TOKENS = posInt(
  'OBSERVER_THRESHOLD_TOKENS',
  30_000,
);

/** Token estimate threshold for Reflector pass (journal compression). */
export const REFLECTOR_THRESHOLD_TOKENS = posInt(
  'REFLECTOR_THRESHOLD_TOKENS',
  60_000,
);
