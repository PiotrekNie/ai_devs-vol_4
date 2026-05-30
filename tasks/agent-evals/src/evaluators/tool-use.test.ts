import { describe, expect, test } from "bun:test";
import type { Evaluation } from "@langfuse/client";
import { toolUseEvaluator } from "./tool-use.js";

describe("toolUseEvaluator", () => {
  test("scores required tools", async () => {
    const scores = asEvaluations(
      await toolUseEvaluator({
        input: { id: "t1", message: "sum" },
        output: { toolNames: ["sum_numbers"] },
        expectedOutput: {
          shouldUseTools: true,
          requiredTools: ["sum_numbers"],
        },
      }),
    );

    const overall = scores.find((s) => s.name === "tool_use_overall");
    expect(overall?.value).toBe(1);
  });

  test("penalizes forbidden tools", async () => {
    const scores = asEvaluations(
      await toolUseEvaluator({
        input: { id: "t2", message: "time" },
        output: { toolNames: ["sum_numbers"] },
        expectedOutput: {
          shouldUseTools: true,
          requiredTools: ["get_current_time"],
          forbiddenTools: ["sum_numbers"],
        },
      }),
    );

    const forbidden = scores.find(
      (s) => s.name === "tool_use_forbidden_tools_accuracy",
    );
    expect(forbidden?.value).toBe(0);
  });
});

function asEvaluations(result: Evaluation | Evaluation[]): Evaluation[] {
  return Array.isArray(result) ? result : [result];
}
