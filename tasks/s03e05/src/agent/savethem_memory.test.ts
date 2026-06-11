import { beforeEach, describe, expect, test } from "bun:test";
import {
  createSavethemMemoryHooks,
  recordHubSubmitResult,
  resetSavethemState,
} from "./savethem_memory.js";

describe("savethem_memory", () => {
  beforeEach(() => resetSavethemState());

  test("injects revised plan after failed hub submit", async () => {
    recordHubSubmitResult(
      JSON.stringify({ ok: false, data: "Invalid route: out of fuel" }),
    );
    const hooks = createSavethemMemoryHooks();
    const out = await hooks.beforeTurn!({
      conversation: [],
      instructions: "base instructions",
      iteration: 2,
    });
    expect(out.instructions).toContain("Revised steps");
    expect(out.instructions).toContain("Last hub feedback");
  });

  test("no inject after success flag", async () => {
    recordHubSubmitResult(JSON.stringify({ ok: true, flag: "{FLG:TEST}" }));
    const hooks = createSavethemMemoryHooks();
    const out = await hooks.beforeTurn!({
      conversation: [],
      instructions: "base",
      iteration: 2,
    });
    expect(out.instructions).toBe("base");
  });
});
