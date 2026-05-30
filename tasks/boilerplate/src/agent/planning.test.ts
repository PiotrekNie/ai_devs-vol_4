import { describe, it, expect } from "bun:test";
import {
  WORKING_PLAN_MARKER,
  stripPreviousWorkingPlan,
  injectWorkingPlan,
  buildPlanningInstructions,
  collectToolNames,
  resolveEnablePlanningPhase,
  runPlanningTurn,
  PLANNING_EXECUTION_NUDGE,
} from "./planning.js";

describe("planning helpers", () => {
  it("stripPreviousWorkingPlan removes an existing block", () => {
    const base = `System${WORKING_PLAN_MARKER}\n\nold plan`;
    expect(stripPreviousWorkingPlan(base)).toBe("System");
  });

  it("injectWorkingPlan appends marker and text", () => {
    const out = injectWorkingPlan("Base", "Step 1: help");
    expect(out).toContain(WORKING_PLAN_MARKER);
    expect(out).toContain("Step 1: help");
  });

  it("injectWorkingPlan uses fallback when plan is empty", () => {
    const out = injectWorkingPlan("Base", "   ");
    expect(out).toContain("Plan unavailable");
  });

  it("buildPlanningInstructions includes planning turn prompt", () => {
    const out = buildPlanningInstructions("Episode rules");
    expect(out).toContain("Episode rules");
    expect(out).toContain("Planning turn");
  });

  it("buildPlanningInstructions lists tool names without exposing them to the API", () => {
    const out = buildPlanningInstructions("Episode", ["search_mail", "finish_task"]);
    expect(out).toContain("search_mail");
    expect(out).toContain("do not call");
  });

  it("collectToolNames extracts OpenAI function definitions", () => {
    expect(
      collectToolNames([
        { type: "function", name: "echo" },
        { name: "finish_task" },
      ]),
    ).toEqual(["echo", "finish_task"]);
  });

  it("resolveEnablePlanningPhase prefers explicit flag over env", () => {
    const prev = process.env.AGENT_ENABLE_PLANNING;
    process.env.AGENT_ENABLE_PLANNING = "true";
    expect(resolveEnablePlanningPhase(false)).toBe(false);
    expect(resolveEnablePlanningPhase(true)).toBe(true);
    if (prev === undefined) delete process.env.AGENT_ENABLE_PLANNING;
    else process.env.AGENT_ENABLE_PLANNING = prev;
  });

  it("runPlanningTurn ends conversation with user nudge for turn 1+", async () => {
    const adapter = {
      generateResponse: async () => ({
        content: "Step 1: help",
        toolCalls: [],
        rawOutputItems: [
          {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "Step 1: help" }],
          },
        ],
      }),
    };

    const { conversationAfterPlan } = await runPlanningTurn({
      ai: adapter,
      conversation: [{ role: "user", content: "Plan firmware." }],
      instructions: "Episode rules",
      tools: [{ type: "function", name: "shell_exec" }],
    });

    const last = conversationAfterPlan[conversationAfterPlan.length - 1] as {
      role?: string;
      content?: string;
    };
    expect(last.role).toBe("user");
    expect(last.content).toBe(PLANNING_EXECUTION_NUDGE);
  });
});
