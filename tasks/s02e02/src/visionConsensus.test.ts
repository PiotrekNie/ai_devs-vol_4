import { describe, expect, test } from "bun:test";
import { masksEqual, readBoardConsensusFromUrl } from "./visionConsensus.ts";

describe("masksEqual", () => {
  test("equal 3x3", () => {
    const a = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const b = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    expect(masksEqual(a, b)).toBe(true);
  });

  test("masks with high bits normalized", () => {
    expect(
      masksEqual(
        [
          [0x11, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      ),
    ).toBe(true);
  });

  test("different cell", () => {
    expect(
      masksEqual(
        [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        [
          [1, 2, 3],
          [4, 0, 6],
          [7, 8, 9],
        ],
      ),
    ).toBe(false);
  });
});

describe("readBoardConsensusFromUrl", () => {
  test("single read when rounds 0", async () => {
    let calls = 0;
    const read = async () => {
      calls++;
      return [
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
    };
    const prev = process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS;
    process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS = "0";
    try {
      const out = await readBoardConsensusFromUrl("https://example.com/x.png", read);
      expect(calls).toBe(1);
      expect(out[0]![0]).toBe(1);
    } finally {
      if (prev === undefined) {
        delete process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS;
      } else {
        process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS = prev;
      }
    }
  });

  test("two agreeing reads return after one pair", async () => {
    const grid = [
      [6, 7, 5],
      [10, 14, 10],
      [14, 3, 9],
    ];
    let calls = 0;
    const read = async () => {
      calls++;
      return grid.map((r) => [...r]);
    };
    const prev = process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS;
    process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS = "2";
    try {
      const out = await readBoardConsensusFromUrl("https://example.com/x.png", read);
      expect(masksEqual(out, grid)).toBe(true);
      expect(calls).toBe(2);
    } finally {
      if (prev === undefined) {
        delete process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS;
      } else {
        process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS = prev;
      }
    }
  });

  test("disagreeing pair then tie-break third read", async () => {
    const g1 = [
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const g2 = [
      [2, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    let calls = 0;
    const read = async () => {
      calls++;
      if (calls === 1) {
        return g1.map((r) => [...r]);
      }
      if (calls === 2) {
        return g2.map((r) => [...r]);
      }
      return g1.map((r) => [...r]);
    };
    const prev = process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS;
    process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS = "1";
    try {
      const out = await readBoardConsensusFromUrl("https://example.com/x.png", read);
      expect(masksEqual(out, g1)).toBe(true);
      expect(calls).toBe(3);
    } finally {
      if (prev === undefined) {
        delete process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS;
      } else {
        process.env.ELECTRICITY_VISION_CONSENSUS_ROUNDS = prev;
      }
    }
  });
});
