import { describe, expect, it, beforeEach, mock } from "bun:test";
import { postDomatowoAnswer } from "./domatowoClient.js";

describe("domatowoClient", () => {
  const originalKey = process.env.HUB_API_KEY;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.HUB_API_KEY = "test-key";
  });

  it("returns mcpErr when HUB_API_KEY is missing", async () => {
    process.env.HUB_API_KEY = "";
    const result = await postDomatowoAnswer({ action: "help" });
    expect(result.isError).toBe(true);
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("HUB_API_KEY");
  });

  it("posts domatowo verify payload", async () => {
    process.env.HUB_API_KEY = "test-key";
    let capturedBody = "";

    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({ code: 65, message: "ok", action_points_left: 300 }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const result = await postDomatowoAnswer({ action: "help" });
    expect(result.isError).not.toBe(true);

    const parsed = JSON.parse(capturedBody) as {
      task: string;
      apikey: string;
      answer: { action: string };
    };
    expect(parsed.task).toBe("domatowo");
    expect(parsed.apikey).toBe("test-key");
    expect(parsed.answer.action).toBe("help");

    const text = result.content[0]?.text ?? "";
    expect(text).toContain("action_points_left");

    globalThis.fetch = originalFetch;
    process.env.HUB_API_KEY = originalKey;
  });
});
