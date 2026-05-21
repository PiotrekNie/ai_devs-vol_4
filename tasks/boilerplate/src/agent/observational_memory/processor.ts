/**
 * Observational Memory processor — orchestrates Observer / Reflector cycle.
 */

import type {
  MemoryChatFn,
  MemoryState,
  ObservationalMemoryConfig,
  ProcessedMemoryContext,
} from "./types.js";
import {
  buildObservedContext,
  buildPassthroughContext,
  splitByTailBudget,
} from "./context.js";
import { appendObservations, runObserver } from "./observer.js";
import { persistObserverLog, persistReflectorLog } from "./persistence.js";
import { runReflector } from "./reflector.js";
import {
  estimateConversationTokensRaw,
  estimateTokensRaw,
  observationTokenCount,
} from "./tokens.js";
import { stripObservationAppendix } from "./utils.js";
import { logMemory, logError } from "../../utils/logger.js";

const MIN_TAIL_BUDGET = 120;

async function runReflectionIfNeeded(args: {
  state: MemoryState;
  config: ObservationalMemoryConfig;
  chatFn: MemoryChatFn;
}): Promise<void> {
  const { state, config, chatFn } = args;
  const grewSinceReflection =
    state.observationTokenCount - (state.lastReflectionOutputTokens ?? 0);
  const shouldReflect =
    state.observationTokenCount > config.reflectionThresholdTokens &&
    grewSinceReflection >= config.reflectionTargetTokens;

  if (!shouldReflect) {
    if (state.observationTokenCount > config.reflectionThresholdTokens) {
      logMemory("reflect-skip", {
        grew: grewSinceReflection,
        need: config.reflectionTargetTokens,
      });
    }
    return;
  }

  try {
    const reflected = await runReflector({
      state,
      config,
      observations: state.activeObservations,
      targetTokens: config.reflectionTargetTokens,
      chatFn,
    });

    state.activeObservations = reflected.observations;
    state.observationTokenCount = reflected.tokenCount;
    state.lastReflectionOutputTokens = reflected.tokenCount;
    state.generationCount += 1;

    state.reflectorLogSeq += 1;
    await persistReflectorLog({
      persistDir: config.persistDir,
      sessionId: state.sessionId,
      sequence: state.reflectorLogSeq,
      observations: reflected.observations,
      tokensRaw: estimateTokensRaw(reflected.observations),
      tokensCalibrated: reflected.tokenCount,
      generation: state.generationCount,
      compressionLevel: reflected.compressionLevel,
      calibration: state.calibration,
    });
  } catch (err) {
    logError(
      `Observational memory reflector failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function runObservationPass(args: {
  state: MemoryState;
  config: ObservationalMemoryConfig;
  conversation: unknown[];
  chatFn: MemoryChatFn;
  /** When true, observe all items (flush); otherwise split tail budget. */
  forceAll?: boolean;
}): Promise<{ conversation: unknown[]; observed: boolean }> {
  const { state, config, conversation, chatFn, forceAll } = args;
  if (conversation.length === 0) {
    return { conversation, observed: false };
  }

  const tailBudget = Math.max(
    MIN_TAIL_BUDGET,
    Math.floor(config.observationThresholdTokens * config.tailRatio),
  );
  const { head, tail } = forceAll
    ? { head: conversation, tail: [] as unknown[] }
    : splitByTailBudget(conversation, tailBudget, state.calibration);
  const toObserve = head.length > 0 ? head : conversation;

  const observed = await runObserver({
    state,
    config,
    previousObservations: state.activeObservations,
    items: toObserve,
    chatFn,
  });

  if (!observed.observations.trim()) {
    return { conversation, observed: false };
  }

  appendObservations(state, config, observed.observations);

  state.observerLogSeq += 1;
  await persistObserverLog({
    persistDir: config.persistDir,
    sessionId: state.sessionId,
    sequence: state.observerLogSeq,
    observations: observed.observations,
    tokensRaw: estimateTokensRaw(observed.observations),
    tokensCalibrated: observationTokenCount(
      observed.observations,
      state.calibration,
      config.enableCalibration,
    ),
    messagesObserved: toObserve.length,
    generation: state.generationCount,
    calibration: state.calibration,
  });

  logMemory("sealed", {
    messages: toObserve.length,
    tailKept: forceAll ? 0 : tail.length,
    generation: state.generationCount,
  });

  return {
    conversation: forceAll ? [] : tail.length > 0 ? tail : conversation,
    observed: true,
  };
}

export async function processObservationalMemory(args: {
  state: MemoryState;
  conversation: unknown[];
  instructions: string;
  config: ObservationalMemoryConfig;
  chatFn: MemoryChatFn;
}): Promise<ProcessedMemoryContext> {
  const { state, config, chatFn } = args;
  let conversation = args.conversation;
  const baseInstructions = stripObservationAppendix(args.instructions);

  const pendingTokens = estimateConversationTokensRaw(conversation);

  logMemory("pending", {
    tokens: pendingTokens,
    messages: conversation.length,
    obsTokens: state.observationTokenCount,
    generation: state.generationCount,
  });

  if (pendingTokens < config.observationThresholdTokens) {
    const ctx = buildPassthroughContext(
      conversation,
      baseInstructions,
      state.activeObservations,
    );
    return ctx;
  }

  logMemory("threshold", {
    pending: pendingTokens,
    threshold: config.observationThresholdTokens,
  });

  try {
    const { conversation: trimmed } = await runObservationPass({
      state,
      config,
      conversation,
      chatFn,
    });
    conversation = trimmed;

    await runReflectionIfNeeded({ state, config, chatFn });

    return buildObservedContext(
      conversation,
      baseInstructions,
      state.activeObservations,
    );
  } catch (err) {
    logError(
      `Observational memory observer failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return buildPassthroughContext(
      args.conversation,
      baseInstructions,
      state.activeObservations,
    );
  }
}

export async function flushObservationalMemory(args: {
  state: MemoryState;
  conversation: unknown[];
  instructions: string;
  config: ObservationalMemoryConfig;
  chatFn: MemoryChatFn;
}): Promise<ProcessedMemoryContext> {
  const baseInstructions = stripObservationAppendix(args.instructions);
  if (args.conversation.length === 0) {
    return buildPassthroughContext(
      args.conversation,
      baseInstructions,
      args.state.activeObservations,
    );
  }

  logMemory("flush", { messages: args.conversation.length });

  try {
    await runObservationPass({
      state: args.state,
      config: args.config,
      conversation: args.conversation,
      chatFn: args.chatFn,
      forceAll: true,
    });

    await runReflectionIfNeeded({
      state: args.state,
      config: args.config,
      chatFn: args.chatFn,
    });
  } catch (err) {
    logError(
      `Observational memory flush failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return buildPassthroughContext([], baseInstructions, args.state.activeObservations);
}
