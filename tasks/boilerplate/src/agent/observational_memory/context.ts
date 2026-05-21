import type { CalibrationState } from "./types.js";
import { isFunctionCallOutput } from "./types.js";
import { estimateItemTokensRaw } from "./tokens.js";
import { buildObservationAppendix, CONTINUATION_HINT } from "./utils.js";

export function splitByTailBudget(
  items: unknown[],
  tailBudget: number,
  _cal?: CalibrationState,
): { head: unknown[]; tail: unknown[] } {
  let tailTokens = 0;
  let splitIndex = items.length;

  for (let i = items.length - 1; i >= 0; i -= 1) {
    const tokens = estimateItemTokensRaw(items[i]);
    if (tailTokens + tokens > tailBudget && splitIndex < items.length) break;
    tailTokens += tokens;
    splitIndex = i;
  }

  while (splitIndex > 0 && splitIndex < items.length) {
    if (isFunctionCallOutput(items[splitIndex])) {
      splitIndex -= 1;
    } else {
      break;
    }
  }

  return {
    head: items.slice(0, splitIndex),
    tail: items.slice(splitIndex),
  };
}

export function buildPassthroughContext(
  conversation: unknown[],
  baseInstructions: string,
  activeObservations: string,
): { conversation: unknown[]; instructions: string } {
  const hasObservations = activeObservations.length > 0;
  return {
    instructions: hasObservations
      ? `${baseInstructions}\n\n${buildObservationAppendix(activeObservations)}`
      : baseInstructions,
    conversation: hasObservations ? conversation : conversation,
  };
}

export function buildObservedContext(
  tail: unknown[],
  baseInstructions: string,
  activeObservations: string,
): { conversation: unknown[]; instructions: string } {
  const contextMessages =
    tail.length > 0 ? tail : [{ role: "user", content: CONTINUATION_HINT }];

  return {
    instructions: `${baseInstructions}\n\n${buildObservationAppendix(activeObservations)}`,
    conversation: contextMessages,
  };
}
