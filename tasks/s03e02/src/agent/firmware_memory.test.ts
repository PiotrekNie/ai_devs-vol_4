import { describe, expect, it, beforeEach } from "bun:test";
import { WORKING_PLAN_MARKER } from "@ai-devs/agent-boilerplate";
import {
  createFirmwareMemoryHooks,
  recordHubSubmitResult,
  recordShellResult,
  resetFirmwareState,
} from "./firmware_memory.js";

describe("firmware memory hooks", () => {
  beforeEach(() => {
    resetFirmwareState();
  });

  it("injects revised plan and shell feedback after ban", async () => {
    recordShellResult(
      JSON.stringify({
        ok: false,
        status: 429,
        output: "Access ban for 30 seconds — VM reset",
        banSeconds: 30,
      }),
    );

    const hooks = createFirmwareMemoryHooks();
    const baseInstructions = `System\n\n---${WORKING_PLAN_MARKER}\n\nOld plan`;

    const result = await hooks.beforeTurn!({
      conversation: [],
      instructions: baseInstructions,
      iteration: 2,
    });

    expect(result.instructions).toContain(WORKING_PLAN_MARKER);
    expect(result.instructions).toContain("/etc");
    expect(result.instructions).toContain("help");
    expect(result.instructions).toContain("BAN");
    expect(result.instructions).not.toContain("Old plan");
  });

  it("injects hub feedback after failed submit", async () => {
    recordHubSubmitResult(
      JSON.stringify({
        ok: true,
        status: 200,
        data: { code: -1, message: "Invalid confirmation code" },
      }),
    );

    const hooks = createFirmwareMemoryHooks();
    const result = await hooks.beforeTurn!({
      conversation: [],
      instructions: "base",
      iteration: 1,
    });

    expect(result.instructions).toContain("Invalid confirmation");
    expect(result.instructions).toContain("submit_to_hub");
  });

  it("does not inject after successful flag", async () => {
    recordHubSubmitResult(
      JSON.stringify({ ok: true, flag: "{FLG:TEST}", data: {} }),
    );

    const hooks = createFirmwareMemoryHooks();
    const result = await hooks.beforeTurn!({
      conversation: [],
      instructions: "unchanged",
      iteration: 1,
    });

    expect(result.instructions).toBe("unchanged");
  });
});
