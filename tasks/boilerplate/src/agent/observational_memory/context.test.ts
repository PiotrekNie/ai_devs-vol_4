import { describe, it, expect } from "bun:test";
import { splitByTailBudget } from "./context.js";

describe("splitByTailBudget", () => {
  it("keeps function_call paired with function_call_output in tail", () => {
    const call = {
      type: "function_call" as const,
      call_id: "c1",
      name: "read_file",
      arguments: "{}",
    };
    const out = {
      type: "function_call_output" as const,
      call_id: "c1",
      output: "file contents here",
    };
    const items = [
      { role: "user", content: "x".repeat(400) },
      { role: "assistant", content: "y".repeat(400) },
      call,
      out,
    ];

    const { head, tail } = splitByTailBudget(items, 50);
    expect(head.length).toBeGreaterThan(0);
    expect(tail.some((i) => (i as { type?: string }).type === "function_call")).toBe(
      true,
    );
    expect(
      tail.some((i) => (i as { type?: string }).type === "function_call_output"),
    ).toBe(true);
  });
});
