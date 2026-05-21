import { describe, it, expect } from "bun:test";
import { parseObserverOutput } from "./observer.js";

describe("parseObserverOutput", () => {
  it("parses observations and optional tags", () => {
    const raw = [
      "<observations>",
      "* 🔴 [user] Flag is FLG:abc",
      "</observations>",
      "<current-task>Find flag</current-task>",
      "<suggested-response>Continue</suggested-response>",
    ].join("\n");

    const result = parseObserverOutput(raw);
    expect(result.observations).toContain("FLG:abc");
    expect(result.currentTask).toBe("Find flag");
    expect(result.suggestedResponse).toBe("Continue");
  });
});
