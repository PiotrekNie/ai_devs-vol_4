import {
  RATED_POWER_KW,
  STORM_CUTOFF_WIND_MS,
} from "../../config.js";
import type { PowerDeficit } from "./types.js";

/** Hub documentation yield curve (midpoints). */
export function windYieldFraction(windMs: number): number {
  if (windMs > STORM_CUTOFF_WIND_MS) return 0;
  if (windMs >= 12) return 1;
  if (windMs >= 10) return 0.95;
  if (windMs >= 8) return 0.65;
  if (windMs >= 6) return 0.35;
  if (windMs >= 4) return 0.125;
  return 0;
}

export function pitchYieldFraction(pitchAngle: number): number {
  if (pitchAngle === 0) return 1;
  if (pitchAngle === 45) return 0.65;
  return 0;
}

/** Estimated instantaneous power (kW) for planning. */
export function estimatePowerKw(windMs: number, pitchAngle = 0): number {
  return (
    RATED_POWER_KW *
    windYieldFraction(windMs) *
    pitchYieldFraction(pitchAngle)
  );
}

/** Parse hub strings like `"3-4"` or `"2-3"`. */
export function parsePowerDeficitKw(raw: unknown): PowerDeficit {
  const matches = String(raw ?? "").match(/(\d+(?:\.\d+)?)/g);
  if (!matches?.length) {
    return { minKw: 3, maxKw: 4 };
  }
  const values = matches.map(Number);
  return {
    minKw: Math.min(...values),
    maxKw: Math.max(...values),
  };
}
