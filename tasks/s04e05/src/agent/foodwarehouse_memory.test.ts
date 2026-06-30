import { describe, expect, it } from "bun:test";
import {
  getFoodwarehouseSessionState,
  recordFoodwarehouseResult,
  resetFoodwarehouseState,
} from "./foodwarehouse_memory.js";

describe("foodwarehouse_memory", () => {
  it("records flag on success", () => {
    resetFoodwarehouseState();
    recordFoodwarehouseResult(
      JSON.stringify({
        ok: true,
        data: { code: 0, message: "ok" },
        flag: "{FLG:test}",
      }),
    );
    const state = getFoodwarehouseSessionState();
    expect(state.lastFlag).toBe("{FLG:test}");
    expect(state.lastHubOk).toBe(true);
  });

  it("records missing array in message", () => {
    resetFoodwarehouseState();
    recordFoodwarehouseResult(
      JSON.stringify({
        ok: true,
        data: {
          code: -655,
          message: "Not all required city orders",
          missing: [{ city: "Opalino", destination: 991828 }],
        },
      }),
    );
    const state = getFoodwarehouseSessionState();
    expect(state.lastHubMessage).toContain("missing");
    expect(state.lastHubMessage).toContain("Opalino");
  });
});
