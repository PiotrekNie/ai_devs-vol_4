import type { Evaluator } from "@langfuse/client";
import { asArray, toCaseInput } from "../helpers.js";

export type ToolUseExpect = {
  shouldUseTools: boolean;
  requiredTools: string[];
  forbiddenTools?: string[];
  minToolCalls?: number;
  maxToolCalls?: number;
};

function toExpected(raw: unknown): ToolUseExpect {
  if (typeof raw !== "object" || raw == null) {
    return { shouldUseTools: false, requiredTools: [], maxToolCalls: 0 };
  }

  const c = raw as {
    shouldUseTools?: unknown;
    requiredTools?: unknown;
    forbiddenTools?: unknown;
    minToolCalls?: unknown;
    maxToolCalls?: unknown;
  };

  const requiredTools = asArray(c.requiredTools).filter(
    (v): v is string => typeof v === "string",
  );
  const forbiddenTools = asArray(c.forbiddenTools).filter(
    (v): v is string => typeof v === "string",
  );

  return {
    shouldUseTools:
      typeof c.shouldUseTools === "boolean" ? c.shouldUseTools : false,
    requiredTools,
    ...(forbiddenTools.length > 0 ? { forbiddenTools } : {}),
    ...(typeof c.minToolCalls === "number"
      ? { minToolCalls: c.minToolCalls }
      : {}),
    ...(typeof c.maxToolCalls === "number"
      ? { maxToolCalls: c.maxToolCalls }
      : {}),
  };
}

export const toolUseEvaluator: Evaluator = async ({
  input,
  output,
  expectedOutput,
}) => {
  const inputCase = toCaseInput(input);
  const expected = toExpected(expectedOutput);
  const outputObj = (
    typeof output === "object" && output != null ? output : {}
  ) as { toolNames?: unknown };
  const toolNames = asArray(outputObj.toolNames).filter(
    (v): v is string => typeof v === "string",
  );

  const count = toolNames.length;
  const unique = new Set(toolNames);

  const decision = expected.shouldUseTools
    ? count > 0
      ? 1
      : 0
    : count === 0
      ? 1
      : 0;
  const required =
    expected.requiredTools.length === 0
      ? 1
      : expected.requiredTools.every((n) => unique.has(n))
        ? 1
        : 0;
  const forbidden =
    (expected.forbiddenTools ?? []).length === 0
      ? 1
      : (expected.forbiddenTools ?? []).every((n) => !unique.has(n))
        ? 1
        : 0;
  const callCount =
    (expected.minToolCalls === undefined || count >= expected.minToolCalls) &&
    (expected.maxToolCalls === undefined || count <= expected.maxToolCalls)
      ? 1
      : 0;
  const overall = (decision + required + forbidden + callCount) / 4;

  return [
    {
      name: "tool_use_overall",
      value: overall,
      comment: `[${inputCase.id}] tools=[${toolNames.join(", ")}]`,
    },
    { name: "tool_use_decision_accuracy", value: decision },
    { name: "tool_use_required_tools_accuracy", value: required },
    { name: "tool_use_forbidden_tools_accuracy", value: forbidden },
    { name: "tool_use_call_count_accuracy", value: callCount },
  ];
};
