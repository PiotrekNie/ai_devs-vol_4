/**
 * Observer/Reflector memory scaffold.
 *
 * This module defines the MemoryHooks interface that the agent loop calls on
 * every iteration. The default export is a no-op implementation.
 *
 * ── Full Observational Memory (S02E05) ──
 * Use `createObservationalMemoryHooks()` from `./observational_memory/index.js`:
 *
 *   import { createObservationalMemoryHooks } from "@ai-devs/agent-boilerplate";
 *
 *   createAgent({
 *     memory: createObservationalMemoryHooks({ persistDir: "./workspace/memory" }),
 *     ...
 *   });
 *
 * Layers (do not conflate):
 * - **Observational Memory** — sealed conversation history as XML observations.
 * - **`## Working plan`** (enablePlanningPhase) — procedural; lives in instructions.
 * - **Domain journals** (e.g. s02e04 mailbox_memory) — declarative facts for a task.
 *
 * `beforeTurn` must not strip `## Working plan` or domain journal blocks when
 * injecting observations (use `stripObservationAppendix` only for OM appendix).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

import type { ModelResponse } from "../types/index.js";

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
  /** Set when the run ends (final answer, finish_task, or MAX_ITERATIONS guard). */
  terminal?: boolean;
  /** Main agent LLM call metadata for token calibration (Observational Memory). */
  lastResponse?: {
    estimatedTokens: number;
    usage?: ModelResponse["usage"];
  };
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
