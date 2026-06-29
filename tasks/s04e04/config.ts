/**
 * S04E04 filesystem episode configuration.
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
  MAX_ITERATIONS,
  PLANNING_MAX_OUTPUT_TOKENS,
} from "../boilerplate/config.js";

function posInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const episodeRoot = import.meta.dir;

/** Cached Natan notes directory (gitignored). */
export const NOTES_DIR = join(episodeRoot, "data", "natan_notes");

/** Downloaded zip path. */
export const NOTES_ZIP_PATH = join(episodeRoot, "data", "natan_notes.zip");

export const NOTES_URL =
  process.env["NATAN_NOTES_URL"]?.trim() ??
  "https://hub.ag3nts.org/dane/natan_notes.zip";

/** ReAct iteration cap — enough for read + batch + done retries. */
export const FILESYSTEM_MAX_ITERATIONS = posInt("AGENT_MAX_ITERATIONS", 15);

/**
 * Large enough for one fs_batch with many createFile entries.
 * Override via AGENT_MAX_OUTPUT_TOKENS in tasks/.env.
 */
export const AGENT_MAX_OUTPUT_TOKENS = posInt("AGENT_MAX_OUTPUT_TOKENS", 4096);

/** Default LLM — cost/quality sweet spot (research §8). */
export const DEFAULT_AGENT_MODEL =
  process.env["AGENT_MODEL"]?.trim() ?? "gpt-4o";

export const TRACING_SERVICE_NAME =
  process.env["TRACING_SERVICE_NAME"]?.trim() ?? "@ai-devs/s04e04";
