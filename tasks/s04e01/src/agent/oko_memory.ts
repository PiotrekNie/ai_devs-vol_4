import type {
  AfterTurnContext,
  BeforeTurnContext,
  MemoryHooks,
} from "@ai-devs/agent-boilerplate";
import {
  injectWorkingPlan,
  stripPreviousWorkingPlan,
} from "@ai-devs/agent-boilerplate";

const HUB_FEEDBACK_MARKER = "\n\n---\n## Last OKO hub feedback";

export type OkoSessionState = {
  lastHubMessage: string;
  hubAttempts: number;
  updateAttempts: number;
  lastFlag: string | null;
};

const sessionState: OkoSessionState = {
  lastHubMessage: "",
  hubAttempts: 0,
  updateAttempts: 0,
  lastFlag: null,
};

export function getOkoSessionState(): OkoSessionState {
  return sessionState;
}

export function recordOkoHubResult(text: string, kind: "update" | "done"): void {
  if (kind === "update") sessionState.updateAttempts++;
  if (kind === "done") sessionState.hubAttempts++;

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
    const data = outer.data;
    if (typeof data === "object" && data !== null && "message" in data) {
      const msg = (data as { message?: string }).message;
      sessionState.lastHubMessage =
        typeof msg === "string" ? msg : JSON.stringify(data).slice(0, 2500);
      return;
    }
    sessionState.lastHubMessage =
      typeof data === "string"
        ? data
        : JSON.stringify(data ?? text).slice(0, 2500);
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
    `OKO hub check failed (updates #${sessionState.updateAttempts}, done attempts #${sessionState.hubAttempts}).`,
    "",
    "Revised steps:",
    "1. Read Last OKO hub feedback below — fix the specific record it mentions.",
    "2. Skolwin report: classification animals (not vehicles/people).",
    "3. Skolwin task: done YES + content about animals (e.g. beavers).",
    "4. Komarowo incident: human movement — title prefix MOVE00/PROB00/RECO00.",
    "5. oko_update one fix per turn, then oko_done again.",
    "6. finish_task only after {FLG:...} from oko_done.",
  ].join("\n");
}

function needsRevision(): boolean {
  if (sessionState.lastFlag) return false;
  return sessionState.hubAttempts > 0;
}

export function createOkoMemoryHooks(): MemoryHooks {
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

    async afterTurn(_ctx: AfterTurnContext): Promise<void> {
      // Tool results captured via wrapped handlers in run.ts
    },
  };
}

export function resetOkoState(): void {
  sessionState.lastHubMessage = "";
  sessionState.hubAttempts = 0;
  sessionState.updateAttempts = 0;
  sessionState.lastFlag = null;
}
