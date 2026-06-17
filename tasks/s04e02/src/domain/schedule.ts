import { STORM_CUTOFF_WIND_MS } from "../../config.js";
import { estimatePowerKw } from "./power.js";
import type { ForecastEntry, ScheduleSlot } from "./types.js";
import type { PowerDeficit } from "./types.js";

/** Normalize API timestamp to `YYYY-MM-DD HH:00:00`. */
export function normalizeHourSlot(timestamp: string): string {
  const [date, time] = timestamp.split(" ");
  const hour = time?.split(":")[0] ?? "00";
  return `${date} ${hour}:00:00`;
}

function stormSlots(forecast: ForecastEntry[]): ScheduleSlot[] {
  return forecast
    .filter((entry) => entry.windMs > STORM_CUTOFF_WIND_MS)
    .map((entry) => ({
      timestamp: normalizeHourSlot(entry.timestamp),
      pitchAngle: 90 as const,
      turbineMode: "idle" as const,
      windMs: entry.windMs,
    }));
}

function findProductionSlot(
  forecast: ForecastEntry[],
  deficit: PowerDeficit,
): ScheduleSlot | null {
  for (const entry of forecast) {
    if (entry.windMs > STORM_CUTOFF_WIND_MS) continue;
    if (estimatePowerKw(entry.windMs, 0) >= deficit.maxKw) {
      return {
        timestamp: normalizeHourSlot(entry.timestamp),
        pitchAngle: 0,
        turbineMode: "production",
        windMs: entry.windMs,
      };
    }
  }

  const candidates = forecast.filter(
    (entry) => entry.windMs <= STORM_CUTOFF_WIND_MS,
  );
  if (candidates.length === 0) return null;

  const best = candidates.reduce((a, b) => (a.windMs >= b.windMs ? a : b));
  return {
    timestamp: normalizeHourSlot(best.timestamp),
    pitchAngle: 0,
    turbineMode: "production",
    windMs: best.windMs,
  };
}

/** Build unique schedule slots (storms + first production window). */
export function buildSchedule(
  forecast: ForecastEntry[],
  deficit: PowerDeficit,
): ScheduleSlot[] {
  const byTime = new Map<string, ScheduleSlot>();

  for (const slot of stormSlots(forecast)) {
    byTime.set(slot.timestamp, slot);
  }

  const production = findProductionSlot(forecast, deficit);
  if (!production) {
    throw new Error("No production slot found in weather forecast");
  }
  byTime.set(production.timestamp, production);

  return [...byTime.values()].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
}
