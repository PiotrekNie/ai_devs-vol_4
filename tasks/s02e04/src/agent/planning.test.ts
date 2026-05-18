import { describe, it, expect } from "bun:test";
import {
  WORKING_PLAN_MARKER,
  stripPreviousWorkingPlan,
  injectWorkingPlan,
  buildPlanningInstructions,
} from "./planning.js";

describe("planning helpers", () => {
  it("stripPreviousWorkingPlan removes an existing block", () => {
    const base = `System${WORKING_PLAN_MARKER}\n\nold plan`;
    expect(stripPreviousWorkingPlan(base)).toBe("System");
  });

  it("injectWorkingPlan appends marker and text", () => {
    const out = injectWorkingPlan("Base", "Step 1: help");
    expect(out).toContain(WORKING_PLAN_MARKER);
    expect(out).toContain("Step 1: help");
  });

  it("injectWorkingPlan uses fallback when plan is empty", () => {
    const out = injectWorkingPlan("Base", "   ");
    expect(out).toContain("Plan unavailable");
  });

  it("buildPlanningInstructions includes planning turn prompt and tool names", () => {
    const out = buildPlanningInstructions("Episode rules", ["search_mail"]);
    expect(out).toContain("Episode rules");
    expect(out).toContain("Planning turn");
    expect(out).toContain("search_mail");
  });
});
