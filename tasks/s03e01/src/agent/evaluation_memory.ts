import type {
  AfterTurnContext,
  BeforeTurnContext,
  MemoryHooks,
} from "@ai-devs/agent-boilerplate";
import {
  injectWorkingPlan,
  stripPreviousWorkingPlan,
} from "@ai-devs/agent-boilerplate";

const HUB_FEEDBACK_MARKER = "\n\n---\n## Last hub feedback";

export type EvaluationHubState = {
  lastHubMessage: string;
  verifyAttempts: number;
  lastRecheckCount: number;
  lastFlag: string | null;
};

const hubState: EvaluationHubState = {
  lastHubMessage: "",
  verifyAttempts: 0,
  lastRecheckCount: 0,
  lastFlag: null,
};

export function getEvaluationHubState(): EvaluationHubState {
  return hubState;
}

export function recordHubSubmitResult(text: string): void {
  hubState.verifyAttempts++;
  try {
    const outer = JSON.parse(text) as {
      flag?: string;
      data?: unknown;
      ok?: boolean;
    };
    if (outer.flag) {
      hubState.lastFlag = outer.flag;
      hubState.lastHubMessage = `Success: ${outer.flag}`;
      return;
    }
    hubState.lastFlag = null;
    hubState.lastHubMessage =
      typeof outer.data === "string"
        ? outer.data
        : JSON.stringify(outer.data ?? text).slice(0, 2500);
  } catch {
    hubState.lastFlag = null;
    hubState.lastHubMessage = text.slice(0, 2500);
  }
}

export function recordBuildRecheckResult(text: string): void {
  try {
    const parsed = JSON.parse(text) as { recheck_count?: number };
    if (typeof parsed.recheck_count === "number") {
      hubState.lastRecheckCount = parsed.recheck_count;
    }
  } catch {
    // ignore
  }
}

function stripHubFeedback(instructions: string): string {
  const i = instructions.indexOf(HUB_FEEDBACK_MARKER);
  if (i === -1) return instructions;
  return instructions.slice(0, i).trimEnd();
}

function buildRevisedPlan(): string {
  return [
    `Verify attempt ${hubState.verifyAttempts} failed.`,
    `Last recheck count: ${hubState.lastRecheckCount}.`,
    "",
    "Revised steps:",
    "1. Read hub feedback below.",
    "2. Re-run classify_operator_notes only if note semantics may be wrong.",
    "3. build_recheck → submit_to_hub (task_name: evaluation).",
    "4. finish_task only after {FLG:...} in hub response.",
  ].join("\n");
}

export function createEvaluationMemoryHooks(): MemoryHooks {
  return {
    async beforeTurn(ctx: BeforeTurnContext) {
      if (!hubState.lastHubMessage || hubState.lastFlag) {
        return { conversation: ctx.conversation, instructions: ctx.instructions };
      }

      const base = stripHubFeedback(ctx.instructions);
      const withPlan = injectWorkingPlan(
        stripPreviousWorkingPlan(base),
        buildRevisedPlan(),
      );

      const feedbackBlock = [
        HUB_FEEDBACK_MARKER,
        "",
        hubState.lastHubMessage.slice(0, 2500),
      ].join("\n");

      return {
        conversation: ctx.conversation,
        instructions: `${withPlan}${feedbackBlock}`,
      };
    },

    async afterTurn(_ctx: AfterTurnContext): Promise<void> {
      // Hub feedback captured via wrapped tool handlers in run.ts
    },
  };
}

export function resetEvaluationHubState(): void {
  hubState.lastHubMessage = "";
  hubState.verifyAttempts = 0;
  hubState.lastRecheckCount = 0;
  hubState.lastFlag = null;
}
