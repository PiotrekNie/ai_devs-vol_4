/**
 * Types for Observational Memory (Mastra OM pattern, S02E05).
 */

import type { ModelResponse } from "../../types/index.js";
import type { OmTracingCallbacks } from "./om-callbacks.js";

// ── Responses API conversation items ──────────────────────────────────────────

export type TextConversationItem = {
  role: string;
  content?: string | null | unknown;
};

export type FunctionCallItem = {
  type: "function_call";
  call_id: string;
  name: string;
  arguments: string;
};

export type FunctionCallOutputItem = {
  type: "function_call_output";
  call_id: string;
  output: string;
};

export type ConversationItem =
  | TextConversationItem
  | FunctionCallItem
  | FunctionCallOutputItem;

export function isFunctionCall(item: unknown): item is FunctionCallItem {
  return (
    typeof item === "object" &&
    item !== null &&
    (item as FunctionCallItem).type === "function_call"
  );
}

export function isFunctionCallOutput(
  item: unknown,
): item is FunctionCallOutputItem {
  return (
    typeof item === "object" &&
    item !== null &&
    (item as FunctionCallOutputItem).type === "function_call_output"
  );
}

export function isTextConversationItem(
  item: unknown,
): item is TextConversationItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "role" in item &&
    !("type" in item)
  );
}

// ── Calibration ───────────────────────────────────────────────────────────────

export type CalibrationState = {
  cumulativeEstimated: number;
  cumulativeActual: number;
};

export function freshCalibration(): CalibrationState {
  return { cumulativeEstimated: 0, cumulativeActual: 0 };
}

export type UsageTotals = {
  estimated: number;
  actual: number;
};

// ── Memory state ──────────────────────────────────────────────────────────────

export type MemoryState = {
  activeObservations: string;
  observationTokenCount: number;
  generationCount: number;
  observerLogSeq: number;
  reflectorLogSeq: number;
  lastReflectionOutputTokens?: number;
  sessionId: string;
  calibration: CalibrationState;
};

export function freshMemoryState(sessionId = "default"): MemoryState {
  return {
    activeObservations: "",
    observationTokenCount: 0,
    generationCount: 0,
    observerLogSeq: 0,
    reflectorLogSeq: 0,
    calibration: freshCalibration(),
    sessionId,
  };
}

// ── Config ────────────────────────────────────────────────────────────────────

export type ObservationalMemoryConfig = {
  observationThresholdTokens: number;
  reflectionThresholdTokens: number;
  reflectionTargetTokens: number;
  observerModel: string;
  reflectorModel: string;
  observerMaxOutputTokens: number;
  reflectorMaxOutputTokens: number;
  tailRatio: number;
  minTailTokens: number;
  persistDir: string;
  enableCalibration: boolean;
  calibrationMinActualTokens: number;
  tokenSafetyMargin: number;
  tracing?: OmTracingCallbacks;
};

export type ProcessedMemoryContext = {
  conversation: unknown[];
  instructions: string;
};

// ── Observer / Reflector results ──────────────────────────────────────────────

export type ObserverResult = {
  observations: string;
  currentTask?: string;
  suggestedResponse?: string;
  raw: string;
  usage?: { inputTokens: number; outputTokens: number };
};

export type ReflectorResult = {
  observations: string;
  tokenCount: number;
  raw: string;
  compressionLevel: number;
  usage?: { inputTokens: number; outputTokens: number };
};

export type MemoryChatFn = (params: {
  model: string;
  instructions: string;
  input: unknown[];
  temperature?: number;
  maxOutputTokens?: number;
}) => Promise<ModelResponse>;
