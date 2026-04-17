/**
 * Agent loop — processes queries using a unified set of tool handlers.
 *
 * The agent doesn't know whether a tool is served by MCP or native JS.
 * It just dispatches to the handler map built by app.js. Each handler
 * has { execute, label } so the output shows which backend ran the tool.
 */

import {
  chat,
  extractToolCalls,
  extractText,
  type ChatParams,
  type FunctionToolCall,
} from "./ai.js";
import {
  logQuery,
  logToolCall,
  logToolResult,
  logToolError,
  logToolCount,
  logResponse,
} from "./log.js";
import {
  prepareObservationalMemory,
  type ObservationalMemoryOptions,
} from "./observationalMemory.js";

const DEFAULT_MAX_TOOL_ROUNDS = 5;

/** Cap tool JSON echoed back into chat history (characters, not tokens). */
const MAX_FUNCTION_CALL_OUTPUT_CHARS = Math.max(
  8_000,
  Number(process.env.S02E03_MAX_TOOL_OUTPUT_CHARS ?? 24_000),
);

const DEFAULT_AGENT_MAX_OUTPUT_TOKENS = Math.max(
  512,
  Number(process.env.S02E03_AGENT_MAX_OUTPUT_TOKENS ?? 8192),
);

/**
 * Drops Responses API `reasoning` / `thought` items so they are not replayed on
 * every subsequent turn (major context win).
 */
export function compactResponsesApiOutput(
  output: unknown[] | undefined,
): unknown[] {
  if (!Array.isArray(output)) {
    return [];
  }
  return output.filter((item) => {
    if (typeof item !== "object" || item === null) {
      return true;
    }
    const t = (item as { type?: unknown }).type;
    if (t === "reasoning" || t === "thought") {
      return false;
    }
    return true;
  });
}

function truncateToolOutputString(s: string): string {
  if (s.length <= MAX_FUNCTION_CALL_OUTPUT_CHARS) {
    return s;
  }
  const head = s.slice(0, MAX_FUNCTION_CALL_OUTPUT_CHARS);
  return `${head}\n…[truncated ${s.length - MAX_FUNCTION_CALL_OUTPUT_CHARS} chars; raise S02E03_MAX_TOOL_OUTPUT_CHARS or narrow tool result]`;
}

type ToolHandler = {
  label: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

const executeToolCall = async (
  call: FunctionToolCall,
  handlers: Record<string, ToolHandler | undefined>,
) => {
  const args = JSON.parse(call.arguments) as Record<string, unknown>;
  const handler = handlers[call.name];

  if (!handler) {
    throw new Error(`Unknown tool: ${call.name}`);
  }

  logToolCall(handler.label, call.name, args);

  try {
    const result = await handler.execute(args);
    logToolResult(result);
    const out = JSON.stringify(result);
    return {
      type: "function_call_output",
      call_id: call.call_id,
      output: truncateToolOutputString(out),
    };
  } catch (error) {
    logToolError(error instanceof Error ? error.message : String(error));
    const errOut = JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      type: "function_call_output",
      call_id: call.call_id,
      output: truncateToolOutputString(errOut),
    };
  }
};

/**
 * @param {object} config
 * @param {string} config.model — model identifier
 * @param {Array} config.tools — OpenAI-format tool definitions
 * @param {string} config.instructions — system prompt
 * @param {object} config.handlers — { toolName: { execute, label } }
 */
export const createAgent = ({
  model,
  tools,
  instructions,
  handlers,
  maxToolRounds = DEFAULT_MAX_TOOL_ROUNDS,
  reasoning,
  observationalMemory,
  maxOutputTokens = DEFAULT_AGENT_MAX_OUTPUT_TOKENS,
}: {
  model: string;
  tools?: unknown[];
  instructions: string;
  handlers: Record<string, ToolHandler | undefined>;
  maxToolRounds?: number;
  reasoning?: ChatParams["reasoning"];
  observationalMemory?: ObservationalMemoryOptions;
  maxOutputTokens?: number;
}) => ({
  async processQuery(query: string) {
    logQuery(query);

    let conversation: unknown[] = [{ role: "user", content: query }];

    for (let round = 0; round < maxToolRounds; round++) {
      let effectiveInstructions = instructions;
      if (observationalMemory) {
        const prep = await prepareObservationalMemory({
          conversation,
          baseInstructions: instructions,
          om: observationalMemory,
        });
        conversation = prep.conversation;
        effectiveInstructions = prep.instructions;
      }

      const response = await chat({
        model,
        tools,
        instructions: effectiveInstructions,
        input: conversation,
        reasoning,
        maxOutputTokens,
      });
      const toolCalls = extractToolCalls(response);

      if (toolCalls.length === 0) {
        const text = extractText(response) ?? "No response";
        logResponse(text);
        return text;
      }

      logToolCount(toolCalls.length);
      const toolResults = await Promise.all(
        toolCalls.map((call) => executeToolCall(call, handlers)),
      );

      conversation = [
        ...conversation,
        ...compactResponsesApiOutput(response.output),
        ...toolResults,
      ];
    }

    logResponse("Max tool rounds reached");
    return "Max tool rounds reached";
  },

  /**
   * Multi-turn Hub proxy: persists Responses API `input` items per session.
   * @param {unknown[]} previousInput — prior conversation items (empty on first message)
   * @param {string} userMessage
   * @returns {Promise<{ text: string, nextInput: unknown[] }>}
   */
  async processConversationTurn(previousInput: unknown, userMessage: string) {
    logQuery(userMessage);

    const prev = Array.isArray(previousInput) ? previousInput : [];
    let conversation: unknown[] = [
      ...prev,
      { role: "user", content: userMessage },
    ];

    for (let round = 0; round < maxToolRounds; round++) {
      let effectiveInstructions = instructions;
      if (observationalMemory) {
        const prep = await prepareObservationalMemory({
          conversation,
          baseInstructions: instructions,
          om: observationalMemory,
        });
        conversation = prep.conversation;
        effectiveInstructions = prep.instructions;
      }

      const response = await chat({
        model,
        tools,
        instructions: effectiveInstructions,
        input: conversation,
        reasoning,
        maxOutputTokens,
      });
      const toolCalls = extractToolCalls(response);

      if (toolCalls.length === 0) {
        const text = extractText(response) ?? "No response";
        logResponse(text);
        const nextInput = [
          ...conversation,
          ...compactResponsesApiOutput(response.output),
        ];
        return { text, nextInput };
      }

      logToolCount(toolCalls.length);
      const toolResults = await Promise.all(
        toolCalls.map((call) => executeToolCall(call, handlers)),
      );

      conversation = [
        ...conversation,
        ...compactResponsesApiOutput(response.output),
        ...toolResults,
      ];
    }

    logResponse("Max tool rounds reached");
    return {
      text: "Max tool rounds reached",
      nextInput: conversation,
    };
  },
});
