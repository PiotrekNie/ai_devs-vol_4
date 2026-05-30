import { describe, it, expect } from "bun:test";
import { processObservationalMemory } from "./processor.js";
import type {
  MemoryChatFn,
  ObservationalMemoryConfig,
} from "./types.js";
import type {
  OmObserverEndContext,
  OmObserverStartContext,
  OmTracingCallbacks,
} from "./om-callbacks.js";
import { freshMemoryState } from "./types.js";

describe("OM tracing callbacks", () => {
  const mockChatFn: MemoryChatFn = async () => ({
    content: "<observations>\n* [user] sealed fact\n</observations>",
    toolCalls: [],
    rawOutputItems: [],
    usage: { inputTokens: 50, outputTokens: 20 },
  });

  const baseConfig: ObservationalMemoryConfig = {
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

  it("invokes observer callbacks when threshold exceeded", async () => {
    const starts: OmObserverStartContext[] = [];
    const ends: OmObserverEndContext[] = [];

    const tracing: OmTracingCallbacks = {
      onObserverStart: (ctx) => {
        starts.push(ctx);
      },
      onObserverEnd: (ctx) => {
        ends.push(ctx);
      },
    };

    const state = freshMemoryState("tracing-test");
    const long = "word ".repeat(200);
    const conversation = [
      { role: "user", content: long },
      { role: "assistant", content: "ok" },
    ];

    await processObservationalMemory({
      state,
      conversation,
      instructions: "Base",
      config: { ...baseConfig, tracing },
      chatFn: mockChatFn,
    });

    expect(starts).toHaveLength(1);
    expect(starts[0]?.messagesSealed).toBeGreaterThan(0);
    expect(starts[0]?.pendingTokensRaw).toBeGreaterThan(10);
    expect(ends).toHaveLength(1);
    expect(ends[0]?.observationLines).toBeGreaterThan(0);
    expect(ends[0]?.usage).toEqual({ inputTokens: 50, outputTokens: 20 });
  });

  it("does not invoke callbacks below threshold", async () => {
    let called = false;
    const tracing: OmTracingCallbacks = {
      onObserverStart: () => {
        called = true;
      },
    };

    await processObservationalMemory({
      state: freshMemoryState("below-threshold"),
      conversation: [{ role: "user", content: "short" }],
      instructions: "Base",
      config: { ...baseConfig, tracing },
      chatFn: mockChatFn,
    });

    expect(called).toBe(false);
  });
});
