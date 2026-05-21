import { describe, it, expect } from "bun:test";
import {
  estimateTokensCalibrated,
  estimateTokensRaw,
  getCalibration,
  recordActualUsage,
  trackUsage,
} from "./tokens.js";
import { freshMemoryState, freshCalibration } from "./types.js";
import { processObservationalMemory } from "./processor.js";
import type { MemoryChatFn, ObservationalMemoryConfig } from "./types.js";

describe("observational_memory tokens", () => {
  it("applies calibration ratio after enough actual tokens", () => {
    const cal = freshCalibration();
    recordActualUsage(cal, 400, 600);
    expect(getCalibration(cal).ratio).toBeCloseTo(1.5);
    expect(estimateTokensCalibrated("abcd", cal, true)).toBe(
      Math.ceil(estimateTokensRaw("abcd") * 1.5),
    );
  });

  it("trackUsage returns null when usage missing", () => {
    const cal = freshCalibration();
    expect(trackUsage(undefined, cal, 100, true)).toBeNull();
    expect(cal.cumulativeActual).toBe(0);
  });

  it("trackUsage records usage when present", () => {
    const cal = freshCalibration();
    const actual = trackUsage(
      { inputTokens: 100, outputTokens: 50 },
      cal,
      120,
      true,
    );
    expect(actual).toBe(150);
    expect(cal.cumulativeActual).toBe(150);
  });
});

describe("processObservationalMemory", () => {
  const mockChatFn: MemoryChatFn = async () => ({
    content: "<observations>\n* [user] sealed fact\n</observations>",
    toolCalls: [],
    rawOutputItems: [],
  });

  const config: ObservationalMemoryConfig = {
    observationThresholdTokens: 10,
    reflectionThresholdTokens: 100_000,
    reflectionTargetTokens: 20_000,
    observerModel: "test",
    reflectorModel: "test",
    observerMaxOutputTokens: 1024,
    reflectorMaxOutputTokens: 1024,
    tailRatio: 0.3,
    minTailTokens: 4,
    persistDir: "",
    enableCalibration: false,
    calibrationMinActualTokens: 500,
    tokenSafetyMargin: 1.2,
  };

  it("seals head when threshold exceeded", async () => {
    const state = freshMemoryState("test");
    const long = "word ".repeat(200);
    const conversation = [
      { role: "user", content: long },
      { role: "assistant", content: "ok" },
    ];

    const result = await processObservationalMemory({
      state,
      conversation,
      instructions: "Base instructions",
      config,
      chatFn: mockChatFn,
    });

    expect(result.instructions).toContain("<observations>");
    expect(result.instructions).toContain("sealed fact");
    expect(result.conversation.length).toBeLessThan(conversation.length);
  });
});
