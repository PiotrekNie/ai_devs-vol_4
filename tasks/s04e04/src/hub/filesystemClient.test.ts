import { describe, expect, it, beforeEach, mock } from "bun:test";
import { postFilesystemAnswer } from "./filesystemClient.js";

describe("filesystemClient", () => {
  const originalKey = process.env.HUB_API_KEY;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.HUB_API_KEY = "test-key";
  });

  it("returns mcpErr when HUB_API_KEY is missing", async () => {
    process.env.HUB_API_KEY = "";
    const result = await postFilesystemAnswer({ action: "help" });
    expect(result.isError).toBe(true);
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("HUB_API_KEY");
  });

  it("posts filesystem verify payload", async () => {
    process.env.HUB_API_KEY = "test-key";
    let capturedBody = "";

    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({ code: 5, message: "Filesystem usage manual." }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const result = await postFilesystemAnswer({ action: "help" });
    expect(result.isError).not.toBe(true);

    const parsed = JSON.parse(capturedBody) as {
      task: string;
      apikey: string;
      answer: { action: string };
    };
    expect(parsed.task).toBe("filesystem");
    expect(parsed.apikey).toBe("test-key");
    expect(parsed.answer.action).toBe("help");

    globalThis.fetch = originalFetch;
    process.env.HUB_API_KEY = originalKey;
  });

  it("posts batch array as answer", async () => {
    process.env.HUB_API_KEY = "test-key";
    let capturedBody = "";

    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(JSON.stringify({ code: 0, message: "ok" }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    await postFilesystemAnswer([
      { action: "createDirectory", path: "/miasta" },
      {
        action: "createFile",
        path: "/miasta/test",
        content: "{}",
      },
    ]);

    const parsed = JSON.parse(capturedBody) as {
      answer: unknown[];
    };
    expect(Array.isArray(parsed.answer)).toBe(true);
    expect(parsed.answer).toHaveLength(2);

    globalThis.fetch = originalFetch;
    process.env.HUB_API_KEY = originalKey;
  });
});
