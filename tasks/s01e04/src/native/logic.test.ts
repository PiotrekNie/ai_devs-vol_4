import { describe, expect, test } from "bun:test";
import { countFee, routeComponentPP, unitNormalization, weightComponentPP } from "./logic.ts";

describe("unitNormalization", () => {
  test("2,8 tony → 2800 kg", () => {
    expect(unitNormalization("2,8 tony")).toBe(2800);
  });
  test("2800 kg", () => {
    expect(unitNormalization("2800 kg")).toBe(2800);
  });
  test("2.8 t", () => {
    expect(unitNormalization("2.8 t")).toBe(2800);
  });
});

describe("count_fee (przykład 1 z dokumentacji)", () => {
  test("E, 2 kg, Kraków–Warszawa 314 km, 1 granica → 18 PP", () => {
    expect(weightComponentPP(2)).toBeCloseTo(1, 5);
    expect(routeComponentPP(314, 1)).toBe(7);
    const r = countFee({
      category: "E",
      massKg: 2,
      distanceKm: 314,
      regionalBoundaries: 1,
    });
    expect(r.totalPP).toBe(18);
  });
});

describe("count_fee zwolnienie A/B", () => {
  test("kat. A → 0 PP", () => {
    const r = countFee({
      category: "A",
      massKg: 2800,
      distanceKm: 80,
      regionalBoundaries: 0,
    });
    expect(r.totalPP).toBe(0);
    expect(r.exempt).toBe(true);
  });
});
