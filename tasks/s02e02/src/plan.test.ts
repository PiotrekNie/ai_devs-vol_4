import { describe, expect, test } from "bun:test";
import { diffVsTarget, planRotationsFlat } from "./plan.ts";
import { EDGE_E, EDGE_N, EDGE_S, rotateMaskCw } from "./symbols.ts";

describe("rotationsToReachMask (via diffVsTarget)", () => {
  test("aligned target yields no rotations", () => {
    const m = EDGE_N | EDGE_S;
    const grid = [
      [m, m, m],
      [m, m, m],
      [m, m, m],
    ];
    const d = diffVsTarget(grid, grid);
    expect(d.ok).toBe(true);
    expect(d.rotations).toHaveLength(0);
  });

  test("one quarter turn on one cell", () => {
    const cur = EDGE_N | EDGE_S;
    const tgt = rotateMaskCw(cur);
    const current = [
      [cur, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const target = [
      [tgt, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const d = diffVsTarget(current, target);
    expect(d.ok).toBe(true);
    expect(d.rotations).toEqual([{ cell: "1x1", count: 1 }]);
  });

  test("topology mismatch when piece families differ", () => {
    const straight = EDGE_N | EDGE_S;
    const corner = EDGE_S | EDGE_E;
    const current = [
      [straight, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const target = [
      [corner, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const d = diffVsTarget(current, target);
    expect(d.ok).toBe(false);
    expect(d.topologyMismatch?.length).toBe(1);
  });
});

describe("planRotationsFlat", () => {
  test("expands counts", () => {
    const flat = planRotationsFlat([
      { cell: "2x2", count: 2 },
      { cell: "3x3", count: 1 },
    ]);
    expect(flat).toEqual(["2x2", "2x2", "3x3"]);
  });
});
