/**
 * S04E02 episode configuration.
 */

export {
  HUB_VERIFY_URL,
  HUB_API_KEY,
} from "../boilerplate/config.js";

/** Hub task identifier. */
export const WINDPOWER_TASK_NAME = "windpower";

/** Service window after `start` (hub allows ~40 s). */
export const SERVICE_WINDOW_MS = 39_500;

/** Parallel `getResult` polls per batch. */
export const POLL_PARALLEL = 48;

/** Wind speed above this (m/s) requires storm protection (idle, pitch 90°). */
export const STORM_CUTOFF_WIND_MS = 14;

/** Rated turbine output (kW) from hub documentation. */
export const RATED_POWER_KW = 14;

export const HUB_LABEL = "\x1b[36m[Hub]\x1b[0m";
