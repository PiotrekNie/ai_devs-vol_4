import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const promptsDir = join(import.meta.dir, ".");

describe("prompts", () => {
  it("system.md and drone_task.md exist with required keywords", () => {
    const system = readFileSync(join(promptsDir, "system.md"), "utf8");
    const task = readFileSync(join(promptsDir, "drone_task.md"), "utf8");

    expect(system.toLowerCase()).toContain("submit_to_hub");
    expect(task).toContain("drone");
    expect(task).toContain("instructions");
    expect(task).toContain("prefetch");
    expect(task).toContain("analyze_image_vision");
    expect(task).toContain("submit_to_hub");
    expect(task).not.toMatch(/##\s*Strategia/i);
  });
});
