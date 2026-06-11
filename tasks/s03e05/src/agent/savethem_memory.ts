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

export type SavethemSessionState = {
  lastHubMessage: string;
  verifyAttempts: number;
  lastFlag: string | null;
};

const sessionState: SavethemSessionState = {
  lastHubMessage: "",
  verifyAttempts: 0,
  lastFlag: null,
};

export function getSavethemSessionState(): SavethemSessionState {
  return sessionState;
}

export function recordHubSubmitResult(text: string): void {
  sessionState.verifyAttempts++;
  try {
    const outer = JSON.parse(text) as {
      flag?: string;
      data?: unknown;
      ok?: boolean;
    };
    if (outer.flag) {
      sessionState.lastFlag = outer.flag;
      sessionState.lastHubMessage = `Success: ${outer.flag}`;
      return;
    }
    sessionState.lastFlag = null;
    sessionState.lastHubMessage =
      typeof outer.data === "string"
        ? outer.data
        : JSON.stringify(outer.data ?? text).slice(0, 2500);
  } catch {
    sessionState.lastFlag = null;
    sessionState.lastHubMessage = text.slice(0, 2500);
  }
}

function stripFeedbackBlocks(instructions: string): string {
  const i = instructions.indexOf(HUB_FEEDBACK_MARKER);
  if (i === -1) return instructions;
  return instructions.slice(0, i).trimEnd();
}

function buildRevisedPlan(): string {
  return [
    `Hub rejected route (verify attempt #${sessionState.verifyAttempts}).`,
    "",
    "Revised steps:",
    "1. hub_query — refill missing data (English): maps/Skolwin, wehicles per vehicle, books/movement.",
    "2. plan_route — try another vehicle or omit vehicle for auto-pick.",
    "3. submit_to_hub(task_name: savethem, answer: route array).",
    "4. Preview: https://hub.ag3nts.org/savethem_preview.html",
    "5. finish_task only after {FLG:...} in hub response.",
  ].join("\n");
}

function needsRevision(): boolean {
  return sessionState.verifyAttempts > 0 && !sessionState.lastFlag;
}

export function createSavethemMemoryHooks(): MemoryHooks {
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

      const blocks = [withPlan];
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

    async afterTurn(_ctx: AfterTurnContext): Promise<void> {},
  };
}

export function resetSavethemState(): void {
  sessionState.lastHubMessage = "";
  sessionState.verifyAttempts = 0;
  sessionState.lastFlag = null;
}
