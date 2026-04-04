import { describe, expect, test } from "bun:test";
import { REFERENCE_SOLVED_MASKS } from "./config.ts";
import { solveBoard } from "./deterministicSolver.ts";
import { rotateMaskBy } from "./symbols.ts";

describe("solveBoard", () => {
  test("already solved", () => {
    const t = REFERENCE_SOLVED_MASKS.map((r) => [...r]) as number[][];
    const r = solveBoard(t, t);
    expect(r.ok).toBe(true);
    expect(r.rotations?.flat().every((x) => x === 0)).toBe(true);
  });

  test("one quarter turn on one cell", () => {
    const target = REFERENCE_SOLVED_MASKS.map((r) => [...r]) as number[][];
    const cur = target.map((row) => [...row]);
    cur[1]![1] = rotateMaskBy(cur[1]![1]!, 3) & 0xf;
    const sol = solveBoard(cur, target);
    expect(sol.ok).toBe(true);
    expect(sol.rotations?.[1]?.[1]).toBe(1);
  });

  test("topology mismatch on wrong piece", () => {
    const target = REFERENCE_SOLVED_MASKS.map((r) => [...r]) as number[][];
    const cur = target.map((r) => [...r]);
    cur[0]![0] = 1;
    const sol = solveBoard(cur, target);
    expect(sol.ok).toBe(false);
    expect(sol.topologyMismatch?.length).toBeGreaterThan(0);
  });

  test("cross tile symmetry: minimal k is 0 when current equals target", () => {
    const target = REFERENCE_SOLVED_MASKS.map((r) => [...r]) as number[][];
    const cur = target.map((row) => [...row]);
    cur[1]![1] = 15;
    const tgt = target.map((row) => [...row]);
    tgt[1]![1] = 15;
    const sol = solveBoard(cur, tgt);
    expect(sol.ok).toBe(true);
    expect(sol.rotations?.[1]?.[1]).toBe(0);
  });
});
