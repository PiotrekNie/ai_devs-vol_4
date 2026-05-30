import type { MemoryHooks } from "../memory.js";
import { chat } from "../ai.js";
import {
  OBSERVER_THRESHOLD_TOKENS,
  OM_CALIBRATION_MIN_ACTUAL_TOKENS,
  OM_MIN_TAIL_TOKENS,
  OM_MODEL,
  OM_OBSERVER_MAX_OUTPUT_TOKENS,
  OM_PERSIST_DIR,
  OM_REFLECTOR_MAX_OUTPUT_TOKENS,
  OM_TAIL_RATIO,
  OM_TOKEN_SAFETY_MARGIN,
  REFLECTOR_THRESHOLD_TOKENS,
  REFLECTION_TARGET_TOKENS,
} from "../../../config.js";
import {
  flushObservationalMemory,
  processObservationalMemory,
} from "./processor.js";
import type { OmTracingCallbacks } from "./om-callbacks.js";
import type {
  MemoryChatFn,
  MemoryState,
  ObservationalMemoryConfig,
} from "./types.js";
import { freshMemoryState } from "./types.js";
import { trackUsage } from "./tokens.js";

export type ObservationalMemoryHooksOptions = {
  sessionId?: string;
  persistDir?: string;
  observationThresholdTokens?: number;
  reflectionThresholdTokens?: number;
  reflectionTargetTokens?: number;
  observerModel?: string;
  reflectorModel?: string;
  enableCalibration?: boolean;
  /** Inject for tests (defaults to boilerplate `chat`). */
  chatFn?: MemoryChatFn;
  /** Optional tracing callbacks (e.g. from `createOmTracingCallbacks`). */
  tracing?: OmTracingCallbacks;
};

function resolveConfig(
  options: ObservationalMemoryHooksOptions = {},
): ObservationalMemoryConfig {
  return {
    observationThresholdTokens:
      options.observationThresholdTokens ?? OBSERVER_THRESHOLD_TOKENS,
    reflectionThresholdTokens:
      options.reflectionThresholdTokens ?? REFLECTOR_THRESHOLD_TOKENS,
    reflectionTargetTokens:
      options.reflectionTargetTokens ?? REFLECTION_TARGET_TOKENS,
    observerModel: options.observerModel ?? OM_MODEL,
    reflectorModel: options.reflectorModel ?? OM_MODEL,
    observerMaxOutputTokens: OM_OBSERVER_MAX_OUTPUT_TOKENS,
    reflectorMaxOutputTokens: OM_REFLECTOR_MAX_OUTPUT_TOKENS,
    tailRatio: OM_TAIL_RATIO,
    minTailTokens: OM_MIN_TAIL_TOKENS,
    persistDir: options.persistDir ?? OM_PERSIST_DIR,
    enableCalibration: options.enableCalibration ?? true,
    calibrationMinActualTokens: OM_CALIBRATION_MIN_ACTUAL_TOKENS,
    tokenSafetyMargin: OM_TOKEN_SAFETY_MARGIN,
    tracing: options.tracing,
  };
}

function defaultChatFn(): MemoryChatFn {
  return async (params) =>
    chat({
      model: params.model,
      instructions: params.instructions,
      input: params.input,
      temperature: params.temperature,
      maxOutputTokens: params.maxOutputTokens,
    });
}

/**
 * Creates MemoryHooks implementing Mastra Observational Memory (S02E05).
 *
 * Opt-in: pass to `createAgent({ memory: createObservationalMemoryHooks() })`.
 * Reuse the same factory instance across `processConversationTurn` calls to
 * retain observation state.
 */
export function createObservationalMemoryHooks(
  options: ObservationalMemoryHooksOptions = {},
): MemoryHooks & { getState: () => MemoryState } {
  const config = resolveConfig(options);
  const chatFn = options.chatFn ?? defaultChatFn();
  const state = freshMemoryState(options.sessionId);

  const hooks: MemoryHooks & { getState: () => MemoryState } = {
    getState: () => state,

    async beforeTurn({ conversation, instructions }) {
      const result = await processObservationalMemory({
        state,
        conversation,
        instructions,
        config,
        chatFn,
      });
      return result;
    },

    async afterTurn({ conversation, iteration, lastResponse, terminal }) {
      if (lastResponse?.estimatedTokens != null) {
        trackUsage(
          lastResponse.usage,
          state.calibration,
          lastResponse.estimatedTokens,
          config.enableCalibration,
        );
      }

      if (terminal) {
        await flushObservationalMemory({
          state,
          conversation,
          instructions: "",
          config,
          chatFn,
        });
      }

      void iteration;
    },
  };

  return hooks;
}

export { flushObservationalMemory, processObservationalMemory };
export type { MemoryState, ObservationalMemoryConfig };
export type {
  OmTracingCallbacks,
  OmObserverStartContext,
  OmObserverEndContext,
  OmReflectorStartContext,
  OmReflectorEndContext,
} from "./om-callbacks.js";
