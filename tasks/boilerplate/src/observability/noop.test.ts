import { describe, expect, test } from "bun:test";
import { noopTracingRuntime, createNoopTracingRuntime } from "./noop.js";

describe("noopTracingRuntime", () => {
  test("passes through withTrace", async () => {
    const result = await noopTracingRuntime.withTrace(
      { name: "t", input: "x" },
      async () => 42,
    );
    expect(result).toBe(42);
  });

  test("passes through withTool", async () => {
    const result = await noopTracingRuntime.withTool(
      { name: "finish_task" },
      async () => "ok",
    );
    expect(result).toBe("ok");
  });

  test("createNoopTracingRuntime preserves options", () => {
    const rt = createNoopTracingRuntime({ sessionId: "s-1" });
    expect(rt.options.sessionId).toBe("s-1");
    expect(rt.isActive()).toBe(false);
  });
});
