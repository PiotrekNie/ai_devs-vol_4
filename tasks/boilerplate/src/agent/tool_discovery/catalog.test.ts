import { describe, it, expect } from "bun:test";
import { buildToolCatalog } from "./catalog.js";

describe("buildToolCatalog", () => {
  it("indexes OpenAI-format tool definitions by name", () => {
    const catalog = buildToolCatalog([
      {
        type: "function",
        name: "echo",
        description: "Echo",
        parameters: { type: "object", properties: {} },
      },
      {
        type: "function",
        name: "beta",
        description: "Beta tool",
        parameters: { type: "object", properties: { x: { type: "string" } } },
      },
    ]);

    expect(catalog.size).toBe(2);
    expect(catalog.get("echo")?.description).toBe("Echo");
    expect(catalog.get("beta")?.parameters).toMatchObject({
      type: "object",
    });
  });

  it("skips reserved meta tool names", () => {
    const catalog = buildToolCatalog([
      {
        type: "function",
        name: "list_tools",
        description: "collision",
        parameters: { type: "object", properties: {} },
      },
      {
        type: "function",
        name: "real_tool",
        description: "ok",
        parameters: { type: "object", properties: {} },
      },
    ]);

    expect(catalog.has("list_tools")).toBe(false);
    expect(catalog.has("real_tool")).toBe(true);
  });
});
