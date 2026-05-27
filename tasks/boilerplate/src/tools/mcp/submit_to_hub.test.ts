import { describe, expect, it } from "bun:test";
import { submitToHubInputSchema } from "./submit_to_hub.js";

describe("submitToHubInputSchema", () => {
  it("accepts drone answer with instructions string array", () => {
    const parsed = submitToHubInputSchema.parse({
      task_name: "drone",
      answer: {
        instructions: ["selfCheck", "set(3,4)", "flyToLocation"],
      },
    });

    expect(parsed.task_name).toBe("drone");
    expect(parsed.answer).toEqual({
      instructions: ["selfCheck", "set(3,4)", "flyToLocation"],
    });
  });

  it("accepts mailbox-style flat string answer", () => {
    const parsed = submitToHubInputSchema.parse({
      task_name: "mailbox",
      answer: {
        date: "2026-03-23",
        password: "RABARBAR25",
        confirmation_code: "SEC-c1e598764329cc9c377ef1d029be8ce1",
      },
    });

    expect(parsed.task_name).toBe("mailbox");
  });
});
