import { describe, expect, test } from "bun:test";
import { createAgent } from "./agent.js";
import type { AIAdapter } from "./ai.js";
import type { TracingRuntime } from "../observability/types.js";
import { FinishTaskSignal } from "../tools/native/finish_task.js";

function mockAi(content: string): AIAdapter {
  return {
    async generateResponse() {
      return {
        content,
        toolCalls: [],
        rawOutputItems: [{ type: "message", role: "assistant", content }],
      };
    },
  };
}

describe("createAgent tracing", () => {
  test("default agent runs without tracing hooks", async () => {
    const agent = createAgent({
      ai: mockAi("done"),
      instructions: "test",
      handlers: {},
    });
    expect(await agent.processQuery("q")).toBe("done");
  });

  test("mock tracing runtime records withTrace and withTool", async () => {
    const calls: string[] = [];

    const tracing: TracingRuntime = {
      options: { sessionId: "sess-1", agentName: "test-agent" },
      isActive: () => true,
      advanceGenerationTurn: () => {
        calls.push("advance");
      },
      async withTrace(_p, fn) {
        calls.push("trace");
        return fn();
      },
      async withAgent(_p, fn) {
        calls.push("agent");
        return fn();
      },
      async withTool(p, fn) {
        calls.push(`tool:${p.name}`);
        return fn();
      },
      setTraceOutput: () => {
        calls.push("output");
      },
    };

    const ai: AIAdapter = {
      async generateResponse(_m, _t, _i, opts) {
        if (opts?.tracingMetadata?.phase === "react") {
          return {
            content: null,
            toolCalls: [
              {
                type: "function_call",
                name: "finish_task",
                arguments: JSON.stringify({ final_answer: "ok" }),
                call_id: "c1",
              },
            ],
            rawOutputItems: [],
          };
        }
        return {
          content: "x",
          toolCalls: [],
          rawOutputItems: [],
        };
      },
    };

    const agent = createAgent({
      ai,
      instructions: "test",
      handlers: {
        finish_task: {
          label: "native",
          execute: () => {
            throw new FinishTaskSignal("ok");
          },
        },
      },
      tracing,
    });

    const answer = await agent.processQuery("hello");
    expect(answer).toBe("ok");
    expect(calls).toContain("trace");
    expect(calls).toContain("agent");
    expect(calls).toContain("tool:finish_task");
    expect(calls).toContain("output");
  });
});
