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
const SHELL_FEEDBACK_MARKER = "\n\n---\n## Last shell feedback";

export type FirmwareSessionState = {
  lastShellMessage: string;
  lastHubMessage: string;
  shellAttempts: number;
  verifyAttempts: number;
  lastFlag: string | null;
  lastBanSeconds: number | null;
};

const sessionState: FirmwareSessionState = {
  lastShellMessage: "",
  lastHubMessage: "",
  shellAttempts: 0,
  verifyAttempts: 0,
  lastFlag: null,
  lastBanSeconds: null,
};

export function getFirmwareSessionState(): FirmwareSessionState {
  return sessionState;
}

export function recordShellResult(text: string): void {
  sessionState.shellAttempts++;
  sessionState.lastBanSeconds = null;
  try {
    const parsed = JSON.parse(text) as {
      output?: string;
      banSeconds?: number;
      ok?: boolean;
      status?: number;
    };
    if (typeof parsed.banSeconds === "number") {
      sessionState.lastBanSeconds = parsed.banSeconds;
    }
    const output = parsed.output ?? text;
    sessionState.lastShellMessage = output.slice(0, 2500);
    const lower = output.toLowerCase();
    if (
      lower.includes("ban") ||
      lower.includes("blocked") ||
      lower.includes("forbidden") ||
      lower.includes("not allowed")
    ) {
      sessionState.lastShellMessage = `[BAN or security violation] ${output}`.slice(
        0,
        2500,
      );
    }
  } catch {
    sessionState.lastShellMessage = text.slice(0, 2500);
  }
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
  let out = instructions;
  for (const marker of [HUB_FEEDBACK_MARKER, SHELL_FEEDBACK_MARKER]) {
    const i = out.indexOf(marker);
    if (i !== -1) {
      out = out.slice(0, i).trimEnd();
    }
  }
  return out;
}

function buildRevisedPlan(): string {
  const banNote =
    sessionState.lastBanSeconds !== null
      ? `Last ban ~${sessionState.lastBanSeconds}s — VM may have reset.`
      : "VM may have reset after a security violation.";

  return [
    `Shell/hub attempt failed (shell #${sessionState.shellAttempts}, verify #${sessionState.verifyAttempts}).`,
    banNote,
    "",
    "Revised steps:",
    "1. shell_exec: help — rediscover available commands.",
    "2. Never access /etc, /root, /proc/ or paths listed in .gitignore.",
    "3. Explore /opt/firmware/cooler/ — find password, fix settings.ini.",
    "4. Run /opt/firmware/cooler/cooler.bin → capture ECCS-... code.",
    "5. submit_to_hub(task_name: firmware, answer: { confirmation: \"ECCS-...\" }).",
    "6. finish_task only after {FLG:...} in hub response.",
  ].join("\n");
}

function needsRevision(): boolean {
  if (sessionState.lastFlag) return false;
  const shellBan =
    sessionState.lastShellMessage.includes("[BAN") ||
    sessionState.lastShellMessage.toLowerCase().includes("ban");
  const hubFail = sessionState.verifyAttempts > 0 && !sessionState.lastFlag;
  return shellBan || hubFail;
}

export function createFirmwareMemoryHooks(): MemoryHooks {
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
      if (sessionState.lastShellMessage) {
        blocks.push(
          [SHELL_FEEDBACK_MARKER, "", sessionState.lastShellMessage.slice(0, 1500)].join(
            "\n",
          ),
        );
      }
      if (sessionState.lastHubMessage && sessionState.verifyAttempts > 0) {
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

export function resetFirmwareState(): void {
  sessionState.lastShellMessage = "";
  sessionState.lastHubMessage = "";
  sessionState.shellAttempts = 0;
  sessionState.verifyAttempts = 0;
  sessionState.lastFlag = null;
  sessionState.lastBanSeconds = null;
}
