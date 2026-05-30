import { describe, it, expect } from "bun:test";
import { createAgent } from "./agent.js";
import { createObservationalMemoryHooks } from "./observational_memory/index.js";
import { FinishTaskSignal } from "../tools/native/finish_task.js";
import type { AIAdapter } from "./ai.js";
import type { ModelResponse } from "../types/index.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAdapter(responses: ModelResponse[]): AIAdapter {
  let call = 0;
  return {
    async generateResponse() {
      const resp = responses[call++];
      if (!resp) throw new Error(`Adapter: no more responses (call ${call})`);
      return resp;
    },
  };
}

function countAdapterCalls(responses: ModelResponse[]): {
  adapter: AIAdapter;
  getCallCount: () => number;
} {
  let call = 0;
  return {
    adapter: {
      async generateResponse() {
        const resp = responses[call++];
        if (!resp) throw new Error(`Adapter: no more responses (call ${call})`);
        return resp;
      },
    },
    getCallCount: () => call,
  };
}

function textResponse(content: string): ModelResponse {
  return { content, toolCalls: [], rawOutputItems: [] };
}

function toolCallResponse(
  name: string,
  args: Record<string, unknown>,
  callId = "call_1",
): ModelResponse {
  return {
    content: null,
    toolCalls: [
      {
        type: "function_call",
        name,
        arguments: JSON.stringify(args),
        call_id: callId,
      },
    ],
    rawOutputItems: [
      {
        type: "function_call",
        name,
        arguments: JSON.stringify(args),
        call_id: callId,
      },
    ],
  };
}

// ── processQuery ──────────────────────────────────────────────────────────────

describe("createAgent — processQuery", () => {
  it("returns text when the model produces no tool calls", async () => {
    const agent = createAgent({
      ai: makeAdapter([textResponse("Hello, world!")]),
      instructions: "You are helpful.",
      tools: [],
      handlers: {},
    });

    const result = await agent.processQuery("Say hello.");
    expect(result).toBe("Hello, world!");
  });

  it("dispatches a tool call and appends the result before next turn", async () => {
    let toolCalled = false;

    const agent = createAgent({
      ai: makeAdapter([
        toolCallResponse("echo", { value: "ping" }),
        textResponse("pong"),
      ]),
      instructions: "You are a test agent.",
      tools: [],
      handlers: {
        echo: {
          label: "[Test]",
          execute: async (args) => {
            toolCalled = true;
            return { echoed: args["value"] };
          },
        },
      },
    });

    const result = await agent.processQuery("Test echo.");
    expect(toolCalled).toBe(true);
    expect(result).toBe("pong");
  });

  it("exits on finish_task and returns the final answer", async () => {
    const agent = createAgent({
      ai: makeAdapter([
        toolCallResponse("finish_task", { final_answer: "42" }),
      ]),
      instructions: "You are a test agent.",
      tools: [],
      handlers: {
        finish_task: {
          label: "[Native]",
          execute: async ({ final_answer }) => {
            throw new FinishTaskSignal(final_answer as string);
          },
        },
      },
    });

    const result = await agent.processQuery("What is the answer?");
    expect(result).toBe("42");
  });

  it("returns a guard message after MAX_ITERATIONS with no answer", async () => {
    const loopResponse = toolCallResponse("no_op", {});
    const manyResponses = Array.from({ length: 20 }, () => loopResponse);

    const agent = createAgent({
      ai: makeAdapter(manyResponses),
      instructions: "Loop forever.",
      tools: [],
      handlers: {
        no_op: {
          label: "[Test]",
          execute: async () => ({ ok: true }),
        },
      },
      maxIterations: 3,
    });

    const result = await agent.processQuery("Loop.");
    expect(result).toContain("MAX_ITERATIONS");
    expect(result).toContain("3");
  });

  it("with enablePlanningPhase runs plan turn then ReAct without extra iteration cost", async () => {
    const { adapter, getCallCount } = countAdapterCalls([
      textResponse("Goal: test\nTools: echo"),
      toolCallResponse("echo", { value: "ping" }),
      textResponse("done"),
    ]);

    const agent = createAgent({
      ai: adapter,
      instructions: "Test.",
      tools: [{ type: "function", name: "echo" }],
      handlers: {
        echo: {
          label: "[Test]",
          execute: async (args) => ({ echoed: args["value"] }),
        },
      },
      enablePlanningPhase: true,
      maxIterations: 2,
    });

    const result = await agent.processQuery("Plan and echo.");
    expect(result).toBe("done");
    expect(getCallCount()).toBe(3);
  });

  it("planning turn calls generateResponse with empty tools on turn 0", async () => {
    const toolsPerCall: number[] = [];
    const adapter = {
      generateResponse: async (
        _messages: unknown[],
        tools: unknown[],
      ) => {
        toolsPerCall.push(tools.length);
        if (toolsPerCall.length === 1) {
          return {
            content: "Goal: test",
            toolCalls: [],
            rawOutputItems: [],
          };
        }
        return {
          content: "done",
          toolCalls: [],
          rawOutputItems: [],
        };
      },
    };

    const agent = createAgent({
      ai: adapter,
      instructions: "Test.",
      tools: [{ type: "function", name: "echo" }],
      handlers: {
        echo: {
          label: "[Test]",
          execute: async () => ({ ok: true }),
        },
      },
      enablePlanningPhase: true,
      maxIterations: 1,
    });

    await agent.processQuery("Plan.");
    expect(toolsPerCall[0]).toBe(0);
    expect(toolsPerCall[1]).toBe(1);
  });

  it("without enablePlanningPhase uses a single adapter call for text-only reply", async () => {
    const { adapter, getCallCount } = countAdapterCalls([
      textResponse("Hello, world!"),
    ]);

    const agent = createAgent({
      ai: adapter,
      instructions: "You are helpful.",
      tools: [],
      handlers: {},
    });

    const result = await agent.processQuery("Say hello.");
    expect(result).toBe("Hello, world!");
    expect(getCallCount()).toBe(1);
  });

  it("handles an unknown tool gracefully (returns error result, continues)", async () => {
    const agent = createAgent({
      ai: makeAdapter([
        toolCallResponse("ghost_tool", {}),
        textResponse("recovered"),
      ]),
      instructions: "Test agent.",
      tools: [],
      handlers: {}, // no handlers registered
    });

    const result = await agent.processQuery("Call a ghost tool.");
    expect(result).toBe("recovered");
  });
});

// ── processConversationTurn ────────────────────────────────────────────────────

describe("createAgent — processConversationTurn", () => {
  it("continues from previous conversation and returns nextConversation", async () => {
    const agent = createAgent({
      ai: makeAdapter([textResponse("I remember you.")]),
      instructions: "You are helpful.",
      tools: [],
      handlers: {},
    });

    const { text, nextConversation } = await agent.processConversationTurn(
      [{ role: "user", content: "First message." }],
      "Second message.",
    );

    expect(text).toBe("I remember you.");
    expect(Array.isArray(nextConversation)).toBe(true);
    expect(nextConversation.length).toBeGreaterThan(1);
  });

  it("starts fresh when previousConversation is not an array", async () => {
    const agent = createAgent({
      ai: makeAdapter([textResponse("Fresh start.")]),
      instructions: "You are helpful.",
      tools: [],
      handlers: {},
    });

    const { text } = await agent.processConversationTurn(null, "Hello.");
    expect(text).toBe("Fresh start.");
  });
});

// ── Observational Memory integration ───────────────────────────────────────────

function openAiToolDef(
  name: string,
  description = "",
): { type: "function"; name: string; description: string; parameters: Record<string, unknown> } {
  return {
    type: "function",
    name,
    description,
    parameters: { type: "object", properties: {}, additionalProperties: false },
  };
}

describe("createAgent — tool discovery", () => {
  it("passes a smaller tools array until activate_tools runs", async () => {
    const toolsPerCall: number[] = [];
    const adapter = {
      generateResponse: async (
        _messages: unknown[],
        apiTools: unknown[],
      ) => {
        toolsPerCall.push(apiTools.length);
        if (toolsPerCall.length === 1) {
          return toolCallResponse("activate_tools", { names: ["beta"] });
        }
        if (toolsPerCall.length === 2) {
          return toolCallResponse("beta", { x: "1" });
        }
        return textResponse("done");
      },
    };

    const episodeTools = [
      openAiToolDef("echo", "core echo"),
      openAiToolDef("beta", "extended beta"),
      openAiToolDef("finish_task", "finish"),
    ];

    const agent = createAgent({
      ai: adapter,
      instructions: "Test discovery.",
      tools: episodeTools,
      handlers: {
        echo: { label: "[T]", execute: async () => ({ ok: true }) },
        beta: { label: "[T]", execute: async () => ({ beta: true }) },
        finish_task: {
          label: "[T]",
          execute: async ({ final_answer }) => {
            throw new FinishTaskSignal(final_answer as string);
          },
        },
      },
      toolDiscovery: {
        enabled: true,
        coreToolNames: ["finish_task", "echo"],
      },
      maxIterations: 5,
    });

    await agent.processQuery("Discover and use beta.");
    expect(toolsPerCall.length).toBeGreaterThanOrEqual(2);
    const first = toolsPerCall[0]!;
    const second = toolsPerCall[1]!;
    expect(first).toBeLessThan(episodeTools.length + 3);
    expect(second).toBeGreaterThan(first);
  });

  it("without toolDiscovery passes full tools every turn", async () => {
    const toolsLengths: number[] = [];
    const episodeTools = [
      openAiToolDef("echo"),
      openAiToolDef("beta"),
    ];

    const agent = createAgent({
      ai: {
        generateResponse: async (_m, t) => {
          toolsLengths.push(t.length);
          return textResponse("ok");
        },
      },
      instructions: "Test.",
      tools: episodeTools,
      handlers: {
        echo: { label: "[T]", execute: async () => ({}) },
        beta: { label: "[T]", execute: async () => ({}) },
      },
    });

    await agent.processQuery("Hi");
    expect(toolsLengths.every((n) => n === episodeTools.length)).toBe(true);
  });
});

describe("createAgent — observational memory", () => {
  it("injects observations when threshold exceeded", async () => {
    let omCalls = 0;
    const memory = createObservationalMemoryHooks({
      observationThresholdTokens: 10,
      enableCalibration: false,
      chatFn: async () => {
        omCalls++;
        return {
          content:
            "<observations>\n* [user] sealed from long history\n</observations>",
          toolCalls: [],
          rawOutputItems: [],
        };
      },
    });

    const captured: { instructions?: string } = {};
    const agent = createAgent({
      ai: {
        async generateResponse(_msgs, _tools, instructions) {
          captured.instructions = instructions;
          return textResponse("done");
        },
      },
      instructions: "Base system.",
      tools: [],
      handlers: {},
      memory,
    });

    const longQuery = "data ".repeat(500);
    await agent.processQuery(longQuery);

    expect(omCalls).toBeGreaterThan(0);
    expect(captured.instructions).toContain("<observations>");
    expect(captured.instructions).toContain("sealed from long history");
  });
});
