import { describe, expect, it, beforeEach } from "bun:test";
import { WORKING_PLAN_MARKER } from "@ai-devs/agent-boilerplate";
import {
  createDomatowoMemoryHooks,
  recordDomatowoResult,
  resetDomatowoState,
} from "./domatowo_memory.js";

describe("domatowo memory hooks", () => {
  beforeEach(() => {
    resetDomatowoState();
  });

  it("injects revised plan when action points are low", async () => {
    recordDomatowoResult(
      JSON.stringify({
        ok: true,
        action: "move",
        action_points_left: 25,
        data: { code: 20, message: "Moved.", action_points_left: 25 },
      }),
    );

    const hooks = createDomatowoMemoryHooks();
    const baseInstructions = `System\n\n---${WORKING_PLAN_MARKER}\n\nOld plan`;

    const result = await hooks.beforeTurn!({
      conversation: [],
      instructions: baseInstructions,
      iteration: 2,
    });

    expect(result.instructions).toContain(WORKING_PLAN_MARKER);
    expect(result.instructions).toContain("transporter");
    expect(result.instructions).toContain("getLogs");
    expect(result.instructions).not.toContain("Old plan");
  });

  it("does not inject after successful flag", async () => {
    recordDomatowoResult(
      JSON.stringify({
        ok: true,
        flag: "{FLG:TEST}",
        data: { message: "{FLG:TEST}" },
      }),
    );

    const hooks = createDomatowoMemoryHooks();
    const result = await hooks.beforeTurn!({
      conversation: [],
      instructions: "unchanged",
      iteration: 1,
    });

    expect(result.instructions).toBe("unchanged");
  });
});
