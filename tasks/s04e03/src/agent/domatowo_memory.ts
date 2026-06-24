import type {
  AfterTurnContext,
  BeforeTurnContext,
  MemoryHooks,
} from "@ai-devs/agent-boilerplate";
import {
  injectWorkingPlan,
  stripPreviousWorkingPlan,
} from "@ai-devs/agent-boilerplate";

const HUB_FEEDBACK_MARKER = "\n\n---\n## Last domatowo hub feedback";

export type DomatowoSessionState = {
  lastHubMessage: string;
  hubAttempts: number;
  lastFlag: string | null;
  lastActionPointsLeft: number | null;
  lastHubOk: boolean;
};

const sessionState: DomatowoSessionState = {
  lastHubMessage: "",
  hubAttempts: 0,
  lastFlag: null,
  lastActionPointsLeft: null,
  lastHubOk: true,
};

export function getDomatowoSessionState(): DomatowoSessionState {
  return sessionState;
}

export function recordDomatowoResult(text: string): void {
  sessionState.hubAttempts++;
  try {
    const outer = JSON.parse(text) as {
      flag?: string;
      ok?: boolean;
      data?: {
        message?: string;
        code?: number;
        action_points_left?: number;
      };
      action_points_left?: number;
    };

    if (outer.flag) {
      sessionState.lastFlag = outer.flag;
      sessionState.lastHubMessage = `Success: ${outer.flag}`;
      sessionState.lastHubOk = true;
      return;
    }

    sessionState.lastFlag = null;
    sessionState.lastHubOk = outer.ok !== false;

    const data = outer.data;
    const pointsLeft =
      outer.action_points_left ??
      (typeof data === "object" && data !== null
        ? data.action_points_left
        : undefined);

    if (typeof pointsLeft === "number") {
      sessionState.lastActionPointsLeft = pointsLeft;
    }

    const message =
      typeof data === "object" && data !== null && typeof data.message === "string"
        ? data.message
        : JSON.stringify(outer.data ?? text);

    sessionState.lastHubMessage = message.slice(0, 2500);
  } catch {
    sessionState.lastFlag = null;
    sessionState.lastHubOk = false;
    sessionState.lastHubMessage = text.slice(0, 2500);
  }
}

function stripFeedbackBlocks(instructions: string): string {
  const i = instructions.indexOf(HUB_FEEDBACK_MARKER);
  if (i !== -1) {
    return instructions.slice(0, i).trimEnd();
  }
  return instructions;
}

function buildRevisedPlan(): string {
  const points =
    sessionState.lastActionPointsLeft !== null
      ? `${sessionState.lastActionPointsLeft} action points left.`
      : "Check action_points_left in last hub response.";

  return [
    `Domatowo hub attempt #${sessionState.hubAttempts} needs revision. ${points}`,
    "",
    "Revised steps:",
    "1. domatowo_recon: getObjects + expenses — understand current state.",
    "2. Remember costs: scout move 7/field, transporter 1/field on roads only.",
    "3. Use transporter + dismount for long distances; inspect high buildings from radio hint.",
    "4. domatowo_recon getLogs after every inspect; interpret Polish text.",
    "5. domatowo_call_helicopter only on confirmed cell; finish_task after {FLG:...}.",
    "6. If points exhausted: domatowo_reset and new plan from recon.",
  ].join("\n");
}

function needsRevision(): boolean {
  if (sessionState.lastFlag) return false;

  const lowPoints =
    sessionState.lastActionPointsLeft !== null &&
    sessionState.lastActionPointsLeft < 50;

  const hubError = sessionState.hubAttempts > 0 && !sessionState.lastHubOk;

  const negativeCode =
    sessionState.lastHubMessage.includes('"code":') &&
    (sessionState.lastHubMessage.includes('"code":-') ||
      sessionState.lastHubMessage.includes('"code": -'));

  return lowPoints || hubError || negativeCode;
}

export function createDomatowoMemoryHooks(): MemoryHooks {
  return {
    async beforeTurn(ctx: BeforeTurnContext) {
      if (!needsRevision()) {
        return { conversation: ctx.conversation, instructions: ctx.instructions };
      }

      const base = stripFeedbackBlocks(ctx.instructions);
      const withPlan = injectWorkingPlan(
        stripPreviousWorkingPlan(base),
        buildRevisedPlan(),
      );

      const blocks: string[] = [withPlan];
      if (sessionState.lastHubMessage) {
        blocks.push(
          [HUB_FEEDBACK_MARKER, "", sessionState.lastHubMessage.slice(0, 1500)].join(
            "\n",
          ),
        );
      }

      return {
        conversation: ctx.conversation,
        instructions: blocks.join("\n"),
      };
    },

    async afterTurn(_ctx: AfterTurnContext): Promise<void> {
      // Tool results captured via wrapped handlers in run.ts
    },
  };
}

export function resetDomatowoState(): void {
  sessionState.lastHubMessage = "";
  sessionState.hubAttempts = 0;
  sessionState.lastFlag = null;
  sessionState.lastActionPointsLeft = null;
  sessionState.lastHubOk = true;
}
