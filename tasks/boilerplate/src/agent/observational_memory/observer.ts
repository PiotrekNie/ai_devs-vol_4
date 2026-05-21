import type {
  MemoryChatFn,
  MemoryState,
  ObservationalMemoryConfig,
  ObserverResult,
} from "./types.js";
import { serializeConversationItems } from "./serialize.js";
import {
  estimateSerializedInputTokens,
  estimateTokensRaw,
  observationTokenCount,
  trackUsage,
  withSafetyMargin,
} from "./tokens.js";
import {
  buildObserverUserPrompt,
  extractTag,
  loadObserverPrompt,
} from "./utils.js";
import { logMemory } from "../../utils/logger.js";

export function parseObserverOutput(raw: string): ObserverResult {
  return {
    observations: extractTag(raw, "observations") ?? raw.trim(),
    currentTask: extractTag(raw, "current-task"),
    suggestedResponse: extractTag(raw, "suggested-response"),
    raw,
  };
}

export async function runObserver(args: {
  state: MemoryState;
  config: ObservationalMemoryConfig;
  previousObservations: string;
  items: unknown[];
  chatFn: MemoryChatFn;
}): Promise<ObserverResult> {
  const history = serializeConversationItems(args.items);
  if (!history.trim()) {
    return { observations: "", raw: "" };
  }

  logMemory("observer", {
    messages: args.items.length,
    estimatedTokens: estimateTokensRaw(history),
  });

  const userPrompt = buildObserverUserPrompt(
    args.previousObservations,
    history,
  );
  const estimatedSafe = withSafetyMargin(
    estimateSerializedInputTokens(args.items as never[]) +
      estimateTokensRaw(userPrompt) +
      estimateTokensRaw(loadObserverPrompt()),
  );

  const response = await args.chatFn({
    model: args.config.observerModel,
    instructions: loadObserverPrompt(),
    input: [{ role: "user", content: userPrompt }],
    temperature: 0.3,
    maxOutputTokens: args.config.observerMaxOutputTokens,
  });

  trackUsage(
    response.usage,
    args.state.calibration,
    estimatedSafe,
    args.config.enableCalibration,
  );

  const raw = response.content ?? "";
  const result = parseObserverOutput(raw);
  const lineCount = result.observations
    .split("\n")
    .filter((l) => l.trim()).length;

  logMemory("observer", {
    lines: lineCount,
    estimatedTokens: estimateTokensRaw(result.observations),
  });

  return result;
}

export function appendObservations(
  state: MemoryState,
  config: ObservationalMemoryConfig,
  addition: string,
): void {
  if (!addition.trim()) return;
  state.activeObservations = state.activeObservations
    ? `${state.activeObservations.trim()}\n\n${addition.trim()}`
    : addition.trim();
  state.observationTokenCount = observationTokenCount(
    state.activeObservations,
    state.calibration,
    config.enableCalibration,
  );
}
