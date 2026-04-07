import { describe, expect, test } from "bun:test";
import { maskFromEdges, tileMaskFromVisionPayload } from "./pipeline.ts";

describe("maskFromEdges", () => {
  test("horizontal line left+right = 10", () => {
    expect(
      maskFromEdges({
        top: false,
        right: true,
        bottom: false,
        left: true,
      }),
    ).toBe(10);
  });

  test("vertical line top+bottom = 5", () => {
    expect(
      maskFromEdges({
        top: true,
        right: false,
        bottom: true,
        left: false,
      }),
    ).toBe(5);
  });

  test("tee left+down+right = 14", () => {
    expect(
      maskFromEdges({
        top: false,
        right: true,
        bottom: true,
        left: true,
      }),
    ).toBe(14);
  });
});

describe("tileMaskFromVisionPayload", () => {
  test("ignores contradictory mask when edges encode a horizontal line", () => {
    const m = tileMaskFromVisionPayload({
      analysis: "noise",
      edges: {
        top: false,
        right: true,
        bottom: false,
        left: true,
      },
      mask: 14,
    });
    expect(m).toBe(10);
  });
});
