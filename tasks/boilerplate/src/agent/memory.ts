/**
 * Observer/Reflector memory scaffold.
 *
 * This module defines the MemoryHooks interface that the agent loop calls on
 * every iteration. The default export is a no-op implementation.
 *
 * ── Extension point ──
 * To implement full Observer/Reflector memory (introduced in S02E05), create
 * an object that satisfies MemoryHooks:
 *
 *   import type { MemoryHooks } from "@ai-devs/agent-boilerplate/src/agent/memory.js";
 *
 *   const observationalMemory: MemoryHooks = {
 *     async beforeTurn({ conversation, instructions }) {
 *       // 1. Check if conversation exceeds OBSERVER_THRESHOLD_TOKENS.
 *       // 2. Seal oldest items → call LLM to summarise into journal file.
 *       // 3. If journal exceeds REFLECTOR_THRESHOLD_TOKENS, compress it (Reflector).
 *       // 4. Inject journal block into instructions.
 *       return { conversation: trimmed, instructions: withJournal };
 *     },
 *     async afterTurn(_ctx) {
 *       // Optional post-turn bookkeeping.
 *     },
 *   };
 *
 * Reference implementation: tasks/s02e03/src/observationalMemory.ts
 *
 * When enablePlanningPhase is on, instructions may contain a `## Working plan` block
 * (procedural). Do not strip that marker in beforeTurn — keep plan separate from
 * declarative fact journals (e.g. mailbox working memory).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type BeforeTurnContext = {
  /** Current conversation items (Responses API input format). */
  conversation: unknown[];
  /** Active system instructions. */
  instructions: string;
  /** Zero-based loop iteration number. */
  iteration: number;
};

export type BeforeTurnResult = {
  /** Potentially trimmed conversation (oldest items may be sealed). */
  conversation: unknown[];
  /** Instructions, possibly with an injected journal block. */
  instructions: string;
};

export type AfterTurnContext = {
  /** Conversation state after tool results have been appended. */
  conversation: unknown[];
  /** Loop iteration that just completed. */
  iteration: number;
};

/**
 * Lifecycle hooks called by createAgent on every ReAct loop iteration.
 *
 * Both methods are optional — only implement what you need.
 */
export interface MemoryHooks {
  /**
   * Called before each LLM call. May trim the conversation and/or inject
   * a memory journal into the instructions string.
   */
  beforeTurn?(ctx: BeforeTurnContext): Promise<BeforeTurnResult>;

  /**
   * Called after all tool results for the current iteration have been
   * appended to the conversation. Useful for async journal writes.
   */
  afterTurn?(ctx: AfterTurnContext): Promise<void>;
}

// ── Default no-op implementation ──────────────────────────────────────────────

/**
 * No-op MemoryHooks. Use this when you do not need memory management.
 * Pass to createAgent as `memory: noopMemoryHooks`.
 */
export const noopMemoryHooks: MemoryHooks = {
  async beforeTurn({ conversation, instructions }) {
    return { conversation, instructions };
  },
  async afterTurn() {
    // no-op
  },
};

/**
 * Cheap token estimate used by Observer/Reflector implementations.
 * ~4 chars per token for English-ish text (same heuristic as s02e03).
 */
export function estimateTokens(s: string): number {
  return Math.max(1, Math.ceil(s.length / 4));
}
