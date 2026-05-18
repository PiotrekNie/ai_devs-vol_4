import { describe, it, expect } from "bun:test";
import { createMailboxMemoryHooks } from "./mailbox_memory.js";

describe("createMailboxMemoryHooks", () => {
  it("injects journal with facts after hub-like tool output", async () => {
    const memory = createMailboxMemoryHooks({
      trimAtTokenEst: 1_000_000,
    });
    const instructions = "You are an agent.";
    const user = { role: "user", content: "go" };
    const toolOut = {
      type: "function_call_output",
      call_id: "x",
      output: JSON.stringify({
        ok: true,
        status: 200,
        data: {
          message: "OK",
          answer: {
            date: "2026-03-15",
            password: "s3cret",
            confirmation_code: "SEC-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
        },
      }),
    };

    await memory.afterTurn!({
      conversation: [user, toolOut],
      iteration: 0,
    });

    const prep = await memory.beforeTurn!({
      conversation: [user, toolOut],
      instructions,
      iteration: 1,
    });

    expect(prep.instructions).toContain("## Mailbox working memory");
    expect(prep.instructions).toContain("2026-03-15");
    expect(prep.instructions).toContain("s3cret");
    expect(prep.instructions).toContain("SEC-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("trims middle of conversation when over token budget", async () => {
    const memory = createMailboxMemoryHooks({
      trimAtTokenEst: 50,
      keepTailItems: 2,
    });
    const instructions = "SYS";
    const conv = [
      { role: "user", content: "first" },
      { role: "assistant", content: "a".repeat(200) },
      { role: "assistant", content: "b".repeat(200) },
      { type: "function_call_output", call_id: "1", output: "{}" },
    ];

    const prep = await memory.beforeTurn!({
      conversation: conv,
      instructions,
      iteration: 0,
    });

    expect(prep.conversation.length).toBeLessThan(conv.length);
    expect(prep.conversation[0]).toEqual(conv[0]);
    expect(prep.instructions).toContain("trimmed");
  });
});
