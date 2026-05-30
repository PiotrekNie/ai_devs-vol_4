import { describe, it, expect } from "bun:test";
import { filterToolsForApi } from "./filter.js";

const defs = [
  { type: "function", name: "a", description: "", parameters: {} },
  { type: "function", name: "b", description: "", parameters: {} },
  { type: "function", name: "c", description: "", parameters: {} },
];

describe("filterToolsForApi", () => {
  it("keeps only tools whose names are in activeNames", () => {
    const active = new Set(["a", "c"]);
    const filtered = filterToolsForApi(defs, active);
    expect(filtered.map((t) => (t as { name: string }).name)).toEqual(["a", "c"]);
  });

  it("preserves input order", () => {
    const active = new Set(["c", "a"]);
    const filtered = filterToolsForApi(defs, active);
    expect(filtered.map((t) => (t as { name: string }).name)).toEqual(["a", "c"]);
  });
});
