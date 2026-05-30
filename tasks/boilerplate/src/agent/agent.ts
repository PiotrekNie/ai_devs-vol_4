/**
 * ReAct agent loop — Reasoning and Acting.
 *
 * createAgent returns an object with two methods:
 *   processQuery(query)                   — single-turn query
 *   processConversationTurn(prev, query)  — multi-turn with session history
 *
 * Optional enablePlanningPhase: turn 0 (tool_choice: none) runs before the loop
 * and does not count toward MAX_ITERATIONS.
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
import { runPlanningTurn } from "./planning.js";
import { setupToolDiscovery, type ToolDiscoveryRuntime } from "./tool_discovery/index.js";
import type { ToolDiscoveryOptions } from "./tool_discovery/types.js";
import { FinishTaskSignal } from "../tools/native/finish_task.js";
import { noopTracingRuntime } from "../observability/noop.js";
import type { TracingRuntime } from "../observability/types.js";
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
import { MAX_ITERATIONS, MAX_TOOL_OUTPUT_CHARS, OM_TOKEN_SAFETY_MARGIN } from "../../config.js";

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
  /**
   * When true, run a planning turn (tool_choice: none) before the ReAct loop.
   * Turn 0 does not count toward maxIterations. Default: false.
   */
  enablePlanningPhase?: boolean;
  /** S02E05-inspired lazy tool registration (opt-in). */
  toolDiscovery?: ToolDiscoveryOptions;
  /**
   * Optional Langfuse tracing runtime (opt-in).
   * Use `createTracingRuntime()` from `@ai-devs/agent-boilerplate/observability`.
   */
  tracing?: TracingRuntime;
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

function estimateTurnTokens(
  conversation: unknown[],
  instructions: string,
): number {
  const raw = Math.ceil(
    (JSON.stringify(conversation).length + instructions.length) /
      TOKEN_CHARS_PER_TOKEN,
  );
  return Math.ceil(raw * OM_TOKEN_SAFETY_MARGIN);
}

const TOKEN_CHARS_PER_TOKEN = 4;

async function callAfterTurn(
  memory: MemoryHooks | undefined,
  ctx: Parameters<NonNullable<MemoryHooks["afterTurn"]>>[0],
): Promise<void> {
  if (memory?.afterTurn) {
    await memory.afterTurn(ctx);
  }
}

async function dispatchToolCall(
  call: ToolCall,
  handlers: Record<string, ToolHandler | undefined>,
  maxChars: number,
  discovery?: ToolDiscoveryRuntime | null,
  tracing: TracingRuntime = noopTracingRuntime,
): Promise<{ type: "function_call_output"; call_id: string; output: string }> {
  const args = JSON.parse(call.arguments) as Record<string, unknown>;
  const handler = handlers[call.name];

  if (!handler) {
    const prepared = discovery?.tryPrepareInactiveTool(call.name);
    if (prepared) {
      logSystem("tool discovery: auto-activated inactive tool", {
        name: call.name,
      });
      return {
        type: "function_call_output",
        call_id: call.call_id,
        output: truncateOutput(prepared.message, maxChars),
      };
    }

    const errOut = JSON.stringify({
      error: `Unknown tool: ${call.name}`,
      hint: discovery
        ? "Use list_tools, then activate_tools before calling inactive MCP tools."
        : undefined,
    });
    logError(`Unknown tool: ${call.name}`);
    return {
      type: "function_call_output",
      call_id: call.call_id,
      output: truncateOutput(errOut, maxChars),
    };
  }

  logAction(handler.label, call.name, args);

  const runHandler = async (): Promise<{
    type: "function_call_output";
    call_id: string;
    output: string;
  }> => {
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
  };

  return tracing.withTool(
    { name: call.name, input: args, callId: call.call_id },
    runHandler,
  );
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
  enablePlanningPhase = false,
  toolDiscovery,
  tracing = noopTracingRuntime,
}: AgentConfig) {
  const { runtime: discovery, instructions: resolvedInstructions } =
    setupToolDiscovery(toolDiscovery, tools, handlers, instructions);

  const loopHandlers = discovery?.handlers ?? handlers;
  const agentName = tracing.options.agentName ?? "agent";
  const agentId =
    tracing.options.agentId ??
    tracing.options.sessionId ??
    `agent-${Date.now().toString(36)}`;

  async function runLoop(
    conversation: unknown[],
    loopInstructions: string,
  ): Promise<{ text: string; nextConversation: unknown[] }> {
    let currentInstructions = loopInstructions;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      if (memory?.beforeTurn) {
        const prep = await memory.beforeTurn({
          conversation,
          instructions: currentInstructions,
          iteration,
        });
        conversation = prep.conversation;
        currentInstructions = prep.instructions;
      }

      const estimatedTokens = estimateTurnTokens(
        conversation,
        currentInstructions,
      );

      const apiTools = discovery ? discovery.getApiTools() : tools;

      tracing.advanceGenerationTurn({
        phase: "react",
        iteration,
        toolDiscovery: discovery != null,
        activeToolCount: apiTools.length,
      });

      const turnChatOptions: ChatOptions = {
        ...chatOptions,
        tracingMetadata: {
          phase: "react",
          iteration,
          toolCount: apiTools.length,
          toolDiscovery: discovery != null,
        },
      };

      const response = await ai.generateResponse(
        conversation,
        apiTools,
        currentInstructions,
        turnChatOptions,
      );

      if (response.content) {
        logThought(response.content);
      }

      conversation = [...conversation, ...response.rawOutputItems];

      if (response.toolCalls.length === 0) {
        const text = response.content ?? "No response";
        logResponse(text);

        if (memory?.afterTurn) {
          await callAfterTurn(memory, {
            conversation,
            iteration,
            terminal: true,
            lastResponse: { estimatedTokens, usage: response.usage },
          });
        }

        return { text, nextConversation: conversation };
      }

      logToolCount(response.toolCalls.length);

      let finishSignal: FinishTaskSignal | undefined;
      const toolResults: Array<{
        type: "function_call_output";
        call_id: string;
        output: string;
      }> = [];

      for (const call of response.toolCalls) {
        try {
          const result = await dispatchToolCall(
            call,
            loopHandlers,
            maxToolOutputChars,
            discovery,
            tracing,
          );
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
          await callAfterTurn(memory, {
            conversation,
            iteration,
            terminal: true,
            lastResponse: { estimatedTokens, usage: response.usage },
          });
        }
        return {
          text: finishSignal.finalAnswer,
          nextConversation: conversation,
        };
      }

      await callAfterTurn(memory, {
        conversation,
        iteration,
        lastResponse: { estimatedTokens, usage: response.usage },
      });
    }

    const guardMsg = `MAX_ITERATIONS (${maxIterations}) reached without a final answer.`;
    logSystem(guardMsg);
    await callAfterTurn(memory, {
      conversation,
      iteration: maxIterations - 1,
      terminal: true,
    });
    return { text: guardMsg, nextConversation: conversation };
  }

  async function startRun(
    conversation: unknown[],
    userInput: string,
  ): Promise<{ text: string; nextConversation: unknown[] }> {
    if (!enablePlanningPhase) {
      return runLoop(conversation, resolvedInstructions);
    }

    const planningTools = discovery?.allTools ?? tools;

    tracing.advanceGenerationTurn({ phase: "planning" });

    const { instructionsWithPlan, conversationAfterPlan } =
      await runPlanningTurn({
        ai,
        conversation,
        instructions: resolvedInstructions,
        tools: planningTools,
        chatOptions: {
          ...chatOptions,
          tracingMetadata: { phase: "planning" },
        },
        toolDiscoveryEnabled: discovery != null,
      });

    void userInput;
    return runLoop(conversationAfterPlan, instructionsWithPlan);
  }

  async function executeRun(
    conversation: unknown[],
    userInput: string,
  ): Promise<{ text: string; nextConversation: unknown[] }> {
    return tracing.withAgent(
      {
        name: agentName,
        agentId,
        task: userInput,
      },
      () => startRun(conversation, userInput),
    );
  }

  return {
    async processQuery(query: string): Promise<string> {
      logQuery(query);
      const conversation: unknown[] = [{ role: "user", content: query }];
      const traceName = tracing.options.traceName ?? "chat-request";

      const { text } = await tracing.withTrace(
        {
          name: traceName,
          sessionId: tracing.options.sessionId,
          userId: tracing.options.userId,
          input: query,
          tags: tracing.options.tags,
          metadata: tracing.options.metadata,
        },
        () => executeRun(conversation, query),
      );

      tracing.setTraceOutput(text);
      return text;
    },

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
      const traceName = tracing.options.traceName ?? "chat-request";

      const result = await tracing.withTrace(
        {
          name: traceName,
          sessionId: tracing.options.sessionId,
          userId: tracing.options.userId,
          input: userMessage,
          tags: tracing.options.tags,
          metadata: tracing.options.metadata,
        },
        () => executeRun(conversation, userMessage),
      );

      tracing.setTraceOutput(result.text);
      return result;
    },
  };
}
