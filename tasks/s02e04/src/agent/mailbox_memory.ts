/**
 * Mailbox task memory — lightweight journal + conversation trim (phase E).
 *
 * Deterministically extracts `date`, `password`, `confirmation_code` hints from
 * tool outputs (no extra LLM calls). Injects a stable block into instructions
 * and drops middle conversation items when estimated context grows too large.
 */

import type {
  AfterTurnContext,
  BeforeTurnContext,
  MemoryHooks,
} from "./memory.js";
import { estimateTokens } from "./memory.js";
import {
  MAILBOX_MEMORY_KEEP_TAIL_ITEMS,
  MAILBOX_MEMORY_TRIM_TOKEN_EST,
} from "../../config.js";

const JOURNAL_MARKER = "\n\n---\n## Mailbox working memory";

export type MailboxMemoryHooksOptions = {
  /** Estimated tokens (chars/4) before trimming; default from config. */
  trimAtTokenEst?: number;
  /** Keep first message + this many tail items after trim. */
  keepTailItems?: number;
};

type MailboxFacts = {
  date?: string;
  password?: string;
  confirmation_code?: string;
};

function stripPreviousJournal(instructions: string): string {
  const i = instructions.indexOf(JOURNAL_MARKER);
  if (i === -1) return instructions;
  return instructions.slice(0, i).trimEnd();
}

function confirmationPattern(s: string): string | undefined {
  const m = s.match(/SEC-.{32}/);
  return m ? m[0] : undefined;
}

function isoDatePattern(s: string): string | undefined {
  const dates = s.match(/\b20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b/g);
  if (!dates || dates.length !== 1) return undefined;
  return dates[0];
}

function visitFactsNode(node: unknown, depth: number, facts: MailboxFacts): void {
  if (depth > 24 || node == null) return;

  if (typeof node === "string") {
    const sec = confirmationPattern(node);
    if (sec) facts.confirmation_code = sec;
    const d = isoDatePattern(node);
    if (d) facts.date = d;
    return;
  }

  if (typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const e of node) visitFactsNode(e, depth + 1, facts);
    return;
  }

  const n = node as Record<string, unknown>;

  if (typeof n.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(n.date)) {
    facts.date = n.date;
  }
  if (typeof n.password === "string" && n.password.length > 0) {
    facts.password = n.password;
  }
  if (typeof n.confirmation_code === "string") {
    const sec = confirmationPattern(n.confirmation_code);
    if (sec) facts.confirmation_code = sec;
  }

  for (const k of Object.keys(n)) {
    visitFactsNode(n[k], depth + 1, facts);
  }
}

function tryParseJsonChain(s: string): unknown {
  let v: unknown = s;
  for (let i = 0; i < 4; i++) {
    if (typeof v !== "string") break;
    try {
      v = JSON.parse(v);
    } catch {
      break;
    }
  }
  return v;
}

function collectFunctionOutputs(conversation: unknown[]): string[] {
  const texts: string[] = [];
  for (const item of conversation) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (o.type === "function_call_output" && typeof o.output === "string") {
      texts.push(o.output);
    }
  }
  return texts;
}

function conversationTokenEstimate(conversation: unknown[]): number {
  let acc = "";
  for (const item of conversation) {
    try {
      acc += JSON.stringify(item);
    } catch {
      acc += "{}";
    }
  }
  return estimateTokens(acc);
}

function trimMiddle(conversation: unknown[], keepTail: number): unknown[] {
  if (conversation.length <= 1) return conversation;
  const head = conversation[0];
  if (conversation.length <= 1 + keepTail) return conversation;
  const tail = conversation.slice(-keepTail);
  return [head, ...tail];
}

function formatJournal(facts: MailboxFacts, trimNote: string | null): string {
  const lines = [
    JOURNAL_MARKER,
    "",
    "Extracted so far from tool results (may be incomplete; verify with tools):",
    `- **date:** ${facts.date ?? "(unknown)"}`,
    `- **password:** ${facts.password ?? "(unknown)"}`,
    `- **confirmation_code:** ${facts.confirmation_code ?? "(unknown)"}`,
  ];
  if (trimNote) {
    lines.push("", `Context note: ${trimNote}`);
  }
  lines.push("", "Do not invent values — only use what tools returned.");
  return lines.join("\n");
}

/**
 * Memory hooks for the S02E04 mailbox agent.
 */
export function createMailboxMemoryHooks(
  options: MailboxMemoryHooksOptions = {},
): MemoryHooks {
  const trimAt =
    options.trimAtTokenEst ?? MAILBOX_MEMORY_TRIM_TOKEN_EST;
  const keepTail =
    options.keepTailItems ?? MAILBOX_MEMORY_KEEP_TAIL_ITEMS;

  const facts: MailboxFacts = {};
  let trimNote: string | null = null;

  return {
    async beforeTurn(ctx: BeforeTurnContext) {
      let { conversation, instructions } = ctx;

      const est = conversationTokenEstimate(conversation);
      if (est > trimAt && conversation.length > 2) {
        const before = conversation.length;
        conversation = trimMiddle(conversation, keepTail);
        trimNote = `conversation trimmed (${before} → ${conversation.length} items; est. ${est} → ${conversationTokenEstimate(conversation)} tokens)`;
      } else {
        trimNote = null;
      }

      const base = stripPreviousJournal(instructions);
      const injected = base + formatJournal(facts, trimNote);

      return { conversation, instructions: injected };
    },

    async afterTurn(ctx: AfterTurnContext) {
      for (const text of collectFunctionOutputs(ctx.conversation)) {
        visitFactsNode(text, 0, facts);
        const parsed = tryParseJsonChain(text);
        if (parsed !== text) visitFactsNode(parsed, 0, facts);
      }
    },
  };
}
