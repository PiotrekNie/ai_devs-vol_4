import { describe, expect, it, beforeEach } from "bun:test";
import { WORKING_PLAN_MARKER } from "@ai-devs/agent-boilerplate";
import {
  createEvaluationMemoryHooks,
  recordHubSubmitResult,
  resetEvaluationHubState,
} from "./evaluation_memory.js";

describe("evaluation memory hooks", () => {
  beforeEach(() => {
    resetEvaluationHubState();
  });

  it("injects revised working plan and hub feedback after failed submit", async () => {
    recordHubSubmitResult(
      JSON.stringify({
        ok: true,
        status: 200,
        data: { code: -1, message: "Missing sensor IDs in recheck" },
      }),
    );

    const hooks = createEvaluationMemoryHooks();
    const baseInstructions = `System prompt\n\n---${WORKING_PLAN_MARKER}\n\nOld plan text`;

    const result = await hooks.beforeTurn!({
      conversation: [],
      instructions: baseInstructions,
      iteration: 1,
    });

    expect(result.instructions).toContain(WORKING_PLAN_MARKER);
    expect(result.instructions).toContain("Missing sensor IDs");
    expect(result.instructions).toContain("build_recheck");
    expect(result.instructions).not.toContain("Old plan text");
  });

  it("does not inject feedback after successful flag", async () => {
    recordHubSubmitResult(
      JSON.stringify({ ok: true, flag: "{FLG:TEST}", data: {} }),
    );

    const hooks = createEvaluationMemoryHooks();
    const result = await hooks.beforeTurn!({
      conversation: [],
      instructions: "unchanged",
      iteration: 1,
    });

    expect(result.instructions).toBe("unchanged");
  });
});
