import { describe, expect, it } from "bun:test";
import {
  okoUpdateInputSchema,
  validateOkoUpdate,
} from "./oko_update.js";

describe("oko_update validation", () => {
  const validId = "a".repeat(32);

  it("requires title or content", () => {
    const parsed = okoUpdateInputSchema.safeParse({
      page: "notatki",
      id: validId,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects done on incydenty", () => {
    expect(
      validateOkoUpdate({
        page: "incydenty",
        id: validId,
        title: "MOVE00 test",
        done: "YES",
      }),
    ).toContain("zadania");
  });

  it("requires incident title prefix", () => {
    expect(
      validateOkoUpdate({
        page: "incydenty",
        id: validId,
        title: "Invalid title",
      }),
    ).toContain("MOVE00");
  });

  it("accepts valid incident update", () => {
    expect(
      validateOkoUpdate({
        page: "incydenty",
        id: validId,
        title: "MOVE00 Komarowo patrol",
        content: "Wykryto ruch ludzi.",
      }),
    ).toBeNull();
  });

  it("accepts zadania with done", () => {
    expect(
      validateOkoUpdate({
        page: "zadania",
        id: validId,
        content: "Bobry w Skolwin.",
        done: "YES",
      }),
    ).toBeNull();
  });
});
