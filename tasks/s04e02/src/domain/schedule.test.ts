import { describe, expect, test } from "bun:test";
import { estimatePowerKw, parsePowerDeficitKw } from "./power.js";
import { buildSchedule, normalizeHourSlot } from "./schedule.js";
import type { ForecastEntry } from "./types.js";
import {
  parseSubmitToHubText,
  scheduleSlotToUnlockKey,
  unlockSlotKey,
} from "./windpower_client.js";

describe("normalizeHourSlot", () => {
  test("zeroes minutes and seconds", () => {
    expect(normalizeHourSlot("2026-06-18 18:30:45")).toBe(
      "2026-06-18 18:00:00",
    );
  });
});

describe("parsePowerDeficitKw", () => {
  test("parses range strings", () => {
    expect(parsePowerDeficitKw("3-4")).toEqual({ minKw: 3, maxKw: 4 });
    expect(parsePowerDeficitKw("2-3")).toEqual({ minKw: 2, maxKw: 3 });
  });
});

describe("estimatePowerKw", () => {
  test("returns zero above storm cutoff", () => {
    expect(estimatePowerKw(25)).toBe(0);
  });

  test("returns positive power at moderate wind", () => {
    expect(estimatePowerKw(6.6, 0)).toBeCloseTo(4.9, 1);
  });
});

describe("buildSchedule", () => {
  const forecast: ForecastEntry[] = [
    { timestamp: "2026-06-18 16:00:00", windMs: 2.6 },
    { timestamp: "2026-06-18 18:00:00", windMs: 25 },
    { timestamp: "2026-06-18 20:00:00", windMs: 6.6 },
    { timestamp: "2026-06-21 18:00:00", windMs: 22 },
  ];

  test("adds storm protection and production slots", () => {
    const schedule = buildSchedule(forecast, { minKw: 3, maxKw: 4 });
    expect(schedule).toHaveLength(3);

    const storm = schedule.filter((slot) => slot.turbineMode === "idle");
    expect(storm).toHaveLength(2);
    expect(storm.every((slot) => slot.pitchAngle === 90)).toBe(true);

    const production = schedule.find((slot) => slot.turbineMode === "production");
    expect(production?.timestamp).toBe("2026-06-18 20:00:00");
    expect(production?.pitchAngle).toBe(0);
  });

  test("falls back to best non-storm wind when yield below deficit", () => {
    const calm: ForecastEntry[] = [
      { timestamp: "2026-06-18 18:00:00", windMs: 25 },
      { timestamp: "2026-06-18 20:00:00", windMs: 4.9 },
      { timestamp: "2026-06-19 08:00:00", windMs: 3.2 },
    ];
    const schedule = buildSchedule(calm, { minKw: 3, maxKw: 4 });
    const production = schedule.find((slot) => slot.turbineMode === "production");
    expect(production?.timestamp).toBe("2026-06-18 20:00:00");
    expect(production?.windMs).toBe(4.9);
  });
});

describe("windpower_client helpers", () => {
  test("parseSubmitToHubText extracts flag from message", () => {
    const parsed = parseSubmitToHubText(
      JSON.stringify({
        ok: true,
        status: 200,
        data: { code: 0, message: "{FLG:TEST}" },
      }),
    );
    expect(parsed.flag).toBe("{FLG:TEST}");
  });

  test("unlock keys use date hour pitch", () => {
    expect(unlockSlotKey("2026-06-18", "18:00:00", 90)).toBe(
      "2026-06-18|18:00:00|90",
    );
    expect(
      scheduleSlotToUnlockKey({
        timestamp: "2026-06-18 18:00:00",
        pitchAngle: 90,
      }),
    ).toBe("2026-06-18|18:00:00|90");
  });
});
