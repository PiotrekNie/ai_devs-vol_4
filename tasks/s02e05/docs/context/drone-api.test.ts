import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const snapshotPath = join(import.meta.dir, "drone-api.md");

describe("drone-api snapshot", () => {
  it("contains key API traps and methods", () => {
    const md = readFileSync(snapshotPath, "utf8");
    expect(md).toContain("author reference");
    expect(md).toContain("setDestinationObject");
    expect(md).toContain("set(x,y)");
    expect(md).toContain("hardReset");
    expect(md).toContain("flyToLocation");
    expect(md).toContain("set(...)");
  });
});
