import type {
  AfterTurnContext,
  BeforeTurnContext,
  MemoryHooks,
} from "@ai-devs/agent-boilerplate";
import {
  injectWorkingPlan,
  stripPreviousWorkingPlan,
} from "@ai-devs/agent-boilerplate";

const HUB_FEEDBACK_MARKER = "\n\n---\n## Last foodwarehouse hub feedback";

export type FoodwarehouseSessionState = {
  lastHubMessage: string;
  hubAttempts: number;
  lastFlag: string | null;
  lastHubOk: boolean;
};

const sessionState: FoodwarehouseSessionState = {
  lastHubMessage: "",
  hubAttempts: 0,
  lastFlag: null,
  lastHubOk: true,
};

export function getFoodwarehouseSessionState(): FoodwarehouseSessionState {
  return sessionState;
}

export function recordFoodwarehouseResult(text: string): void {
  sessionState.hubAttempts++;
  try {
    const outer = JSON.parse(text) as {
      flag?: string;
      ok?: boolean;
      data?: { message?: string; code?: number; missing?: unknown[] };
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
    let message =
      typeof data === "object" && data !== null && typeof data.message === "string"
        ? data.message
        : JSON.stringify(outer.data ?? text);

    if (
      data &&
      typeof data === "object" &&
      Array.isArray(data.missing) &&
      data.missing.length > 0
    ) {
      message += `\nmissing: ${JSON.stringify(data.missing).slice(0, 1200)}`;
    }

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
  return [
    `Foodwarehouse hub attempt #${sessionState.hubAttempts} needs revision.`,
    "",
    "Revised steps:",
    "1. fw_help — refresh API rules if unsure.",
    "2. read_file — verify exact quantities from food4cities.json.",
    "3. fw_database — fix destination_id and creator user (login, birthday, user_id).",
    "4. fw_orders get — inspect current orders.",
    "5. fw_reset if state is unrecoverable, then recreate orders.",
    "6. Per missing city: fw_signature → fw_orders create → fw_orders append (batch items).",
    "7. fw_done — fix specific missing[] entries; no extra goods.",
    "8. finish_task only after {FLG:...} in fw_done result.",
  ].join("\n");
}

function needsRevision(): boolean {
  if (sessionState.lastFlag) return false;
  if (sessionState.hubAttempts === 0) return false;

  const hubError = !sessionState.lastHubOk;
  const negativeCode =
    sessionState.lastHubMessage.includes('"code":') &&
    (sessionState.lastHubMessage.includes('"code":-') ||
      sessionState.lastHubMessage.includes('"code": -'));

  return hubError || negativeCode;
}

export function createFoodwarehouseMemoryHooks(): MemoryHooks {
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

export function resetFoodwarehouseState(): void {
  sessionState.lastHubMessage = "";
  sessionState.hubAttempts = 0;
  sessionState.lastFlag = null;
  sessionState.lastHubOk = true;
}
