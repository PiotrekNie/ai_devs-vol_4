import { describe, it, expect } from "bun:test";
import { createOmTracingCallbacks } from "./om-tracing.js";
import { createNoopTracingRuntime } from "./noop.js";
import { processObservationalMemory } from "../agent/observational_memory/processor.js";
import { freshMemoryState } from "../agent/observational_memory/types.js";
import type {
  MemoryChatFn,
  ObservationalMemoryConfig,
} from "../agent/observational_memory/types.js";

describe("createOmTracingCallbacks", () => {
  it("returns no-op callbacks when tracing inactive", async () => {
    const runtime = createNoopTracingRuntime();
    const callbacks = createOmTracingCallbacks(runtime);

    expect(
      callbacks.onObserverStart?.({
        messagesSealed: 1,
        pendingTokensRaw: 100,
        threshold: 10,
        generation: 0,
      }),
    ).toBeUndefined();

    expect(
      callbacks.onObserverEnd?.({
        messagesSealed: 1,
        pendingTokensRaw: 100,
        threshold: 10,
        generation: 0,
        tailKept: 0,
        observationLines: 1,
        obsTokensRaw: 5,
        obsTokensCalibrated: 5,
      }),
    ).toBeUndefined();
  });

  it("integrates with processObservationalMemory without Langfuse keys", async () => {
    const runtime = createNoopTracingRuntime();
    const mockChatFn: MemoryChatFn = async () => ({
      content: "<observations>\n* note\n</observations>",
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
      tracing: createOmTracingCallbacks(runtime),
    };

    const result = await processObservationalMemory({
      state: freshMemoryState("om-tracing"),
      conversation: [{ role: "user", content: "word ".repeat(200) }],
      instructions: "Base",
      config,
      chatFn: mockChatFn,
    });

    expect(result.instructions).toContain("<observations>");
  });
});
