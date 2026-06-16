import { describe, expect, it, beforeEach } from "bun:test";
import { WORKING_PLAN_MARKER } from "@ai-devs/agent-boilerplate";
import {
  createOkoMemoryHooks,
  recordOkoHubResult,
  resetOkoState,
} from "./oko_memory.js";

describe("oko memory hooks", () => {
  beforeEach(() => {
    resetOkoState();
  });

  it("injects revised plan after failed oko_done", async () => {
    recordOkoHubResult(
      JSON.stringify({
        ok: true,
        status: 200,
        data: {
          code: -720,
          message:
            'Incorrect ticket code for Skolwin or the city name not found. Is the word "Skolwin" in the title there?',
        },
      }),
      "done",
    );

    const hooks = createOkoMemoryHooks();
    const result = await hooks.beforeTurn!({
      conversation: [],
      instructions: `System\n\n---${WORKING_PLAN_MARKER}\n\nOld plan`,
      iteration: 2,
    });

    expect(result.instructions).toContain(WORKING_PLAN_MARKER);
    expect(result.instructions).toContain("Skolwin");
    expect(result.instructions).toContain("Komarowo");
    expect(result.instructions).not.toContain("Old plan");
  });

  it("does not inject after successful flag", async () => {
    recordOkoHubResult(
      JSON.stringify({ ok: true, flag: "{FLG:TEST}", data: {} }),
      "done",
    );

    const hooks = createOkoMemoryHooks();
    const result = await hooks.beforeTurn!({
      conversation: [],
      instructions: "unchanged",
      iteration: 1,
    });

    expect(result.instructions).toBe("unchanged");
  });
});
