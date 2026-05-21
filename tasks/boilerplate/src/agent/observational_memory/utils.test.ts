import { describe, it, expect } from "bun:test";
import {
  extractTag,
  stripObservationAppendix,
  buildObservationAppendix,
  OBSERVATION_APPENDIX_MARKER,
} from "./utils.js";

describe("observational_memory utils", () => {
  it("extractTag parses XML blocks", () => {
    const raw = `<observations>\n* [user] hello\n</observations>`;
    expect(extractTag(raw, "observations")).toBe("* [user] hello");
  });

  it("stripObservationAppendix removes OM block", () => {
    const base = "System prompt\n\n## Working plan\n- step 1";
    const withObs = `${base}\n\n${buildObservationAppendix("* fact")}`;
    expect(stripObservationAppendix(withObs)).toBe(base);
    expect(withObs).toContain(OBSERVATION_APPENDIX_MARKER);
  });
});
