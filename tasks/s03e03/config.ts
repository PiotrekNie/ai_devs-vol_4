/**
 * S03E03 reactor episode configuration.
 */

export { HUB_VERIFY_URL, HUB_API_KEY } from "../boilerplate/config.js";

function posInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const REACTOR_TASK_NAME = "reactor";

/** Maximum hub commands after `start` before aborting. */
export const REACTOR_MAX_STEPS = posInt("REACTOR_MAX_STEPS", 200);

/** BFS depth limit for shortest-path search. */
export const REACTOR_BFS_MAX_DEPTH = posInt("REACTOR_BFS_MAX_DEPTH", 40);

/** Grid dimensions (1-indexed rows/cols in API). */
export const REACTOR_ROWS = 5;
export const REACTOR_COLS = 7;

/** Logger label for hub HTTP calls. */
export const HUB_LABEL = "\x1b[36m[Hub]\x1b[0m";
