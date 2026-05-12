/**
 * ReAct agent loop — Reasoning and Acting.
 *
 * createAgent returns an object with two methods:
 *   processQuery(query)                   — single-turn query
 *   processConversationTurn(prev, query)  — multi-turn with session history
 *
 * The loop terminates when:
 *   a) The model returns no tool calls (final text answer).
 *   b) The model calls `finish_task` (FinishTaskSignal caught here).
 *   c) MAX_ITERATIONS is reached (returns a guard message).
 *
 * Memory hooks (optional) are called before each LLM turn to support
 * Observer/Reflector context management (see src/agent/memory.ts).
 */

import type { AIAdapter, ChatOptions } from "./ai.js";
import type { ToolCall } from "../types/index.js";
import type { MemoryHooks } from "./memory.js";
import { FinishTaskSignal } from "../tools/native/finish_task.js";
import {
  logThought,
  logAction,
  logResult,
  logError,
  logToolCount,
  logResponse,
  logSystem,
  logQuery,
} from "../utils/logger.js";
import { MAX_ITERATIONS, MAX_TOOL_OUTPUT_CHARS } from "../../config.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToolHandler = {
  /** Display label used in log output (e.g. MCP_LABEL or NATIVE_LABEL). */
  label: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

export type AgentConfig = {
  ai: AIAdapter;
  /** System prompt text (load from a .md file with fs.readFileSync). */
  instructions: string;
  /** OpenAI-format tool definitions to pass to the LLM on every turn. */
  tools?: unknown[];
  /** Handler map keyed by tool name. */
  handlers: Record<string, ToolHandler | undefined>;
  /** Maximum ReAct iterations (defaults to AGENT_MAX_ITERATIONS env / 10). */
  maxIterations?: number;
  /** Maximum characters per echoed tool result (defaults to env / 24000). */
  maxToolOutputChars?: number;
  /** Optional memory hooks for Observer/Reflector-style context management. */
  memory?: MemoryHooks;
  /** Optional ChatOptions passed to each generateResponse call. */
  chatOptions?: ChatOptions;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncateOutput(s: string, maxChars: number): string {
  if (s.length <= maxChars) return s;
  return (
    `${s.slice(0, maxChars)}\n` +
    `…[truncated ${s.length - maxChars} chars; ` +
    `raise AGENT_MAX_TOOL_OUTPUT_CHARS or narrow tool result]`
  );
}

async function dispatchToolCall(
  call: ToolCall,
  handlers: Record<string, ToolHandler | undefined>,
  maxChars: number,
): Promise<{ type: "function_call_output"; call_id: string; output: string }> {
  const args = JSON.parse(call.arguments) as Record<string, unknown>;
  const handler = handlers[call.name];

  if (!handler) {
    const errOut = JSON.stringify({ error: `Unknown tool: ${call.name}` });
    logError(`Unknown tool: ${call.name}`);
    return {
      type: "function_call_output",
      call_id: call.call_id,
      output: truncateOutput(errOut, maxChars),
    };
  }

  logAction(handler.label, call.name, args);

  try {
    const result = await handler.execute(args);
    logResult(result);
    const out = JSON.stringify(result);
    return {
      type: "function_call_output",
      call_id: call.call_id,
      output: truncateOutput(out, maxChars),
    };
  } catch (error) {
    if (error instanceof FinishTaskSignal) throw error;

    logError(error instanceof Error ? error.message : String(error));
    const errOut = JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      type: "function_call_output",
      call_id: call.call_id,
      output: truncateOutput(errOut, maxChars),
    };
  }
}

// ── Agent factory ─────────────────────────────────────────────────────────────

export function createAgent({
  ai,
  instructions,
  tools = [],
  handlers,
  maxIterations = MAX_ITERATIONS,
  maxToolOutputChars = MAX_TOOL_OUTPUT_CHARS,
  memory,
  chatOptions,
}: AgentConfig) {
  async function runLoop(
    conversation: unknown[],
  ): Promise<{ text: string; nextConversation: unknown[] }> {
    let currentInstructions = instructions;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Memory hook: may trim conversation and inject journal
      if (memory?.beforeTurn) {
        const prep = await memory.beforeTurn({
          conversation,
          instructions: currentInstructions,
          iteration,
        });
        conversation = prep.conversation;
        currentInstructions = prep.instructions;
      }

      const response = await ai.generateResponse(
        conversation,
        tools,
        currentInstructions,
        chatOptions,
      );

      if (response.content) {
        logThought(response.content);
      }

      // Append model's output items (strips reasoning/thought, keeps function_call)
      conversation = [...conversation, ...response.rawOutputItems];

      if (response.toolCalls.length === 0) {
        const text = response.content ?? "No response";
        logResponse(text);

        if (memory?.afterTurn) {
          await memory.afterTurn({ conversation, iteration });
        }

        return { text, nextConversation: conversation };
      }

      logToolCount(response.toolCalls.length);

      // Dispatch all tool calls; FinishTaskSignal exits the loop immediately
      let finishSignal: FinishTaskSignal | undefined;
      const toolResults: Array<{
        type: "function_call_output";
        call_id: string;
        output: string;
      }> = [];

      for (const call of response.toolCalls) {
        try {
          const result = await dispatchToolCall(call, handlers, maxToolOutputChars);
          toolResults.push(result);
        } catch (err) {
          if (err instanceof FinishTaskSignal) {
            finishSignal = err;
            break;
          }
          throw err;
        }
      }

      conversation = [...conversation, ...toolResults];

      if (finishSignal) {
        logSystem("finish_task called", { answer: finishSignal.finalAnswer });
        if (memory?.afterTurn) {
          await memory.afterTurn({ conversation, iteration });
        }
        return { text: finishSignal.finalAnswer, nextConversation: conversation };
      }

      if (memory?.afterTurn) {
        await memory.afterTurn({ conversation, iteration });
      }
    }

    const guardMsg = `MAX_ITERATIONS (${maxIterations}) reached without a final answer.`;
    logSystem(guardMsg);
    return { text: guardMsg, nextConversation: conversation };
  }

  return {
    /**
     * Single-turn query: starts a fresh conversation with the given user message.
     */
    async processQuery(query: string): Promise<string> {
      logQuery(query);
      const conversation: unknown[] = [{ role: "user", content: query }];
      const { text } = await runLoop(conversation);
      return text;
    },

    /**
     * Multi-turn query: continues from a previous conversation state.
     * Returns the answer text and the updated conversation for the next turn.
     */
    async processConversationTurn(
      previousConversation: unknown,
      userMessage: string,
    ): Promise<{ text: string; nextConversation: unknown[] }> {
      logQuery(userMessage);
      const prev = Array.isArray(previousConversation)
        ? previousConversation
        : [];
      const conversation: unknown[] = [
        ...prev,
        { role: "user", content: userMessage },
      ];
      return runLoop(conversation);
    },
  };
}
