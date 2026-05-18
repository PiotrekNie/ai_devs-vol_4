import { describe, it, expect, mock, afterEach } from "bun:test";
import { executeSubmitToHub } from "./submit_to_hub.js";

describe("executeSubmitToHub", () => {
  afterEach(() => {
    delete process.env.HUB_API_KEY;
    globalThis.fetch = global.fetch;
  });

  it("rejects mailbox answer with short confirmation_code before fetch", async () => {
    process.env.HUB_API_KEY = "k";
    let fetchCalled = false;
    globalThis.fetch = mock(async () => {
      fetchCalled = true;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    const out = await executeSubmitToHub({
      task_name: "mailbox",
      answer: {
        date: "2026-03-23",
        password: "RABARBAR25",
        confirmation_code: "SEC-c1e598764329cc9c377ef1d029be8ce",
      },
    });

    expect(out.isError).toBe(true);
    expect(out.content[0]?.text).toContain("36 characters");
    expect(fetchCalled).toBe(false);
  });
});
