import type {
  AfterTurnContext,
  BeforeTurnContext,
  MemoryHooks,
} from "@ai-devs/agent-boilerplate";
import {
  injectWorkingPlan,
  stripPreviousWorkingPlan,
} from "@ai-devs/agent-boilerplate";

const HUB_FEEDBACK_MARKER = "\n\n---\n## Last filesystem hub feedback";

export type FilesystemSessionState = {
  lastHubMessage: string;
  hubAttempts: number;
  lastFlag: string | null;
  lastHubOk: boolean;
};

const sessionState: FilesystemSessionState = {
  lastHubMessage: "",
  hubAttempts: 0,
  lastFlag: null,
  lastHubOk: true,
};

export function getFilesystemSessionState(): FilesystemSessionState {
  return sessionState;
}

export function recordFilesystemResult(text: string): void {
  sessionState.hubAttempts++;
  try {
    const outer = JSON.parse(text) as {
      flag?: string;
      ok?: boolean;
      data?: { message?: string; code?: number };
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
  return [
    `Filesystem hub attempt #${sessionState.hubAttempts} needs revision.`,
    "",
    "Revised steps:",
    "1. read_file — re-check any note you may have misread.",
    "2. fs_list — inspect current virtual FS state.",
    "3. fs_reset if structure is wrong, then fs_batch again.",
    "4. Order batch: /miasta files first, then /osoby and /towary with markdown links.",
    "5. ASCII slugs only; JSON in cities without Polish diacritics.",
    "6. fs_done — read error message literally and fix specific issue.",
    "7. finish_task only after {FLG:...} in fs_done result.",
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

export function createFilesystemMemoryHooks(): MemoryHooks {
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

export function resetFilesystemState(): void {
  sessionState.lastHubMessage = "";
  sessionState.hubAttempts = 0;
  sessionState.lastFlag = null;
  sessionState.lastHubOk = true;
}
