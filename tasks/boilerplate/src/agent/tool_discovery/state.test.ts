import { describe, it, expect } from "bun:test";
import { buildToolCatalog } from "./catalog.js";
import { createToolDiscoveryState } from "./state.js";
import { META_TOOL_NAMES } from "./types.js";

function sampleCatalog() {
  return buildToolCatalog([
    {
      type: "function",
      name: "echo",
      description: "echo",
      parameters: { type: "object", properties: {} },
    },
    {
      type: "function",
      name: "beta",
      description: "beta",
      parameters: { type: "object", properties: {} },
    },
    {
      type: "function",
      name: "finish_task",
      description: "done",
      parameters: { type: "object", properties: {} },
    },
  ]);
}

describe("createToolDiscoveryState", () => {
  it("starts with meta tools and core names", () => {
    const state = createToolDiscoveryState(sampleCatalog(), [
      "finish_task",
      "echo",
    ]);
    const active = state.getActiveNames();
    for (const meta of META_TOOL_NAMES) {
      expect(active.has(meta)).toBe(true);
    }
    expect(active.has("finish_task")).toBe(true);
    expect(active.has("echo")).toBe(true);
    expect(active.has("beta")).toBe(false);
  });

  it("activate adds catalog tools and rejects unknown", () => {
    const state = createToolDiscoveryState(sampleCatalog(), ["finish_task"]);
    const result = state.activate(["beta", "ghost", "beta"]);
    expect(result.activated).toEqual(["beta"]);
    expect(result.alreadyActive).toEqual(["beta"]);
    expect(result.unknown).toEqual(["ghost"]);
    expect(state.isActive("beta")).toBe(true);
  });
});
