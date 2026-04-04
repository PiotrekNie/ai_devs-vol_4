import { describe, expect, test } from "bun:test";
import { glyphCharToMask } from "./glyphMap.ts";
import { REFERENCE_SOLVED_MASKS } from "./config.ts";

describe("glyphCharToMask", () => {
  test("maps reference solved glyphs", () => {
    const glyphs: string[][] = [
      ["┌", "┬", "─"],
      ["│", "├", "┬"],
      ["┴", "┘", "└"],
    ];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const m = glyphCharToMask(glyphs[r]![c]!);
        expect(m).toBe(REFERENCE_SOLVED_MASKS[r]![c]! & 0xf);
      }
    }
  });

  test("rejects unknown", () => {
    expect(glyphCharToMask("x")).toBeNull();
    expect(glyphCharToMask("")).toBeNull();
  });
});
