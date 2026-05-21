/**
 * Token estimation for Observational Memory.
 *
 * Dual estimator (lesson pattern):
 * - Raw (chars/4) for stable Observer thresholds
 * - Calibrated when enough API usage samples exist
 */

import {
  TOKEN_CHARS_PER_TOKEN,
  OM_CALIBRATION_MIN_ACTUAL_TOKENS,
  OM_TOKEN_SAFETY_MARGIN,
} from "../../../config.js";
import {
  isFunctionCall,
  isFunctionCallOutput,
  isTextConversationItem,
  type CalibrationState,
  type ConversationItem,
} from "./types.js";

export function estimateTokensRaw(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / TOKEN_CHARS_PER_TOKEN);
}

export function withSafetyMargin(tokens: number): number {
  return Math.ceil(tokens * OM_TOKEN_SAFETY_MARGIN);
}

export function estimateTokensCalibrated(
  text: string,
  cal?: CalibrationState,
  enableCalibration = true,
): number {
  const base = estimateTokensRaw(text);
  if (!base) return 0;

  if (
    !enableCalibration ||
    !cal ||
    cal.cumulativeActual < OM_CALIBRATION_MIN_ACTUAL_TOKENS ||
    cal.cumulativeEstimated <= 0
  ) {
    return base;
  }

  const ratio = cal.cumulativeActual / cal.cumulativeEstimated;
  return Math.ceil(base * ratio);
}

export function estimateItemTokensRaw(item: unknown): number {
  let tokens = 4;

  if (isTextConversationItem(item)) {
    const content =
      typeof item.content === "string"
        ? item.content
        : item.content != null
          ? JSON.stringify(item.content)
          : "";
    tokens += estimateTokensRaw(content);
    return tokens;
  }

  if (isFunctionCall(item)) {
    tokens += estimateTokensRaw(item.name);
    tokens += estimateTokensRaw(item.arguments);
    tokens += 10;
    return tokens;
  }

  if (isFunctionCallOutput(item)) {
    tokens += estimateTokensRaw(item.output);
    return tokens;
  }

  tokens += estimateTokensRaw(JSON.stringify(item));
  return tokens;
}

export function estimateConversationTokensRaw(items: unknown[]): number {
  let total = 0;
  for (const item of items) {
    total += estimateItemTokensRaw(item);
  }
  return total;
}

export function estimateConversationTokensSafe(items: unknown[]): number {
  return withSafetyMargin(estimateConversationTokensRaw(items));
}

export function recordActualUsage(
  cal: CalibrationState,
  estimated: number,
  actual: number,
): void {
  cal.cumulativeEstimated += estimated;
  cal.cumulativeActual += actual;
}

export function trackUsage(
  usage: { inputTokens: number; outputTokens: number } | undefined,
  cal: CalibrationState,
  estimatedSafe: number,
  enableCalibration: boolean,
): number | null {
  if (!enableCalibration || !usage) return null;
  const actual = usage.inputTokens + usage.outputTokens;
  recordActualUsage(cal, estimatedSafe, actual);
  return actual;
}

export function getCalibration(cal: CalibrationState): {
  ratio: number | null;
  samples: number;
} {
  if (
    cal.cumulativeActual < OM_CALIBRATION_MIN_ACTUAL_TOKENS ||
    cal.cumulativeEstimated === 0
  ) {
    return { ratio: null, samples: cal.cumulativeActual };
  }
  return {
    ratio: cal.cumulativeActual / cal.cumulativeEstimated,
    samples: cal.cumulativeActual,
  };
}

export function observationTokenCount(
  observations: string,
  cal: CalibrationState,
  enableCalibration: boolean,
): number {
  return estimateTokensCalibrated(observations, cal, enableCalibration);
}

/** Serialize items for rough input-size estimate before OM chat calls. */
export function estimateSerializedInputTokens(items: ConversationItem[]): number {
  return estimateConversationTokensRaw(items);
}
