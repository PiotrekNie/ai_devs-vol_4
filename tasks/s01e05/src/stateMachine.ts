import { postRailwayAnswer } from "./hubClient.ts";
import type { RailwayPlan, RailwayPlanStep } from "./planner.ts";

export type FsmState =
  | { kind: "idle" }
  | { kind: "help_loaded" }
  | { kind: "planned" }
  | { kind: "running"; stepIndex: number }
  | { kind: "done"; flag: string }
  | { kind: "failed"; message: string };

const FLAG_REGEX = /\{FLG:[^}]+\}/;

function findFlagInUnknown(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    const m = value.match(FLAG_REGEX);
    return m?.[0];
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const f = findFlagInUnknown(item);
      if (f) {
        return f;
      }
    }
    return undefined;
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    for (const k of Object.keys(o)) {
      const f = findFlagInUnknown(o[k]);
      if (f) {
        return f;
      }
    }
  }
  return undefined;
}

function buildAnswer(step: RailwayPlanStep): Record<string, unknown> {
  const { action, params } = step;
  if (params && Object.keys(params).length > 0) {
    return { action, ...params };
  }
  return { action };
}

export interface RunPlanResult {
  finalState: FsmState;
  lastResponse: unknown;
}

/**
 * Executes each plan step; stops when a `{FLG:...}` token appears in any JSON field.
 */
export async function runRailwayPlan(plan: RailwayPlan): Promise<RunPlanResult> {
  let state: FsmState = { kind: "planned" };
  let lastResponse: unknown;

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    if (!step) {
      state = { kind: "failed", message: `Missing step at index ${i}` };
      return { finalState: state, lastResponse };
    }

    state = { kind: "running", stepIndex: i };
    console.log(`[fsm] ${state.kind} step ${i + 1}/${plan.steps.length}: ${step.action}`);

    const answer = buildAnswer(step);
    lastResponse = await postRailwayAnswer(answer);

    const flag = findFlagInUnknown(lastResponse);
    if (flag) {
      console.log(`[fsm] flag detected: ${flag}`);
      state = { kind: "done", flag };
      return { finalState: state, lastResponse };
    }
  }

  const tailFlag = findFlagInUnknown(lastResponse);
  if (tailFlag) {
    state = { kind: "done", flag: tailFlag };
    return { finalState: state, lastResponse };
  }

  state = {
    kind: "failed",
    message: "No {FLG:...} token in Hub responses after executing all plan steps",
  };
  return { finalState: state, lastResponse };
}
