import { describe, it, expect } from "bun:test";
import {
  bestSecCodeFromText,
  mergeConfirmationCode,
  createMailboxMemoryHooks,
} from "./mailbox_memory.js";

const SHORT = "SEC-c1e598764329cc9c377ef1d029be8ce";
const FULL = "SEC-c1e598764329cc9c377ef1d029be8ceb";

describe("bestSecCodeFromText", () => {
  it("prefers full 36-char code over shorter in same text", () => {
    const text = `wrong: ${SHORT} correct: ${FULL}`;
    expect(bestSecCodeFromText(text)).toBe(FULL);
  });
});

describe("mergeConfirmationCode", () => {
  it("keeps full code when merging with short", () => {
    expect(mergeConfirmationCode(SHORT, FULL)).toBe(FULL);
    expect(mergeConfirmationCode(FULL, SHORT)).toBe(FULL);
  });
});

describe("createMailboxMemoryHooks — SEC correction", () => {
  it("journal keeps 36-char code after tool output with short then full mail", async () => {
    const memory = createMailboxMemoryHooks({ trimAtTokenEst: 1_000_000 });
    const instructions = "Agent.";

    const planMail = {
      type: "function_call_output",
      call_id: "a",
      output: JSON.stringify({
        data: { items: [{ message: `kod: ${SHORT}` }] },
      }),
    };
    const fixMail = {
      type: "function_call_output",
      call_id: "b",
      output: JSON.stringify({
        data: { items: [{ message: `Poprawny to: ${FULL}` }] },
      }),
    };

    await memory.afterTurn!({
      conversation: [planMail, fixMail],
      iteration: 0,
    });

    const prep = await memory.beforeTurn!({
      conversation: [planMail, fixMail],
      instructions,
      iteration: 1,
    });

    expect(prep.instructions).toContain(FULL);
    expect(prep.instructions).not.toContain("INCOMPLETE");
  });
});
