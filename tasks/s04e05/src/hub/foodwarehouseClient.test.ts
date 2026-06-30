import { describe, expect, it, beforeEach, mock } from "bun:test";
import { postFoodwarehouseAnswer } from "./foodwarehouseClient.js";

describe("foodwarehouseClient", () => {
  const originalKey = process.env.HUB_API_KEY;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.HUB_API_KEY = "test-key";
  });

  it("returns mcpErr when HUB_API_KEY is missing", async () => {
    process.env.HUB_API_KEY = "";
    const result = await postFoodwarehouseAnswer({ tool: "help" });
    expect(result.isError).toBe(true);
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("HUB_API_KEY");
  });

  it("posts foodwarehouse verify payload", async () => {
    process.env.HUB_API_KEY = "test-key";
    let capturedBody = "";

    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({ code: 140, message: "Foodwarehouse API help." }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const result = await postFoodwarehouseAnswer({ tool: "help" });
    expect(result.isError).not.toBe(true);

    const parsed = JSON.parse(capturedBody) as {
      task: string;
      apikey: string;
      answer: { tool: string };
    };
    expect(parsed.task).toBe("foodwarehouse");
    expect(parsed.apikey).toBe("test-key");
    expect(parsed.answer.tool).toBe("help");

    globalThis.fetch = originalFetch;
    process.env.HUB_API_KEY = originalKey;
  });

  it("posts orders create answer shape", async () => {
    process.env.HUB_API_KEY = "test-key";
    let capturedBody = "";

    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(JSON.stringify({ code: 101, message: "ok" }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    await postFoodwarehouseAnswer({
      tool: "orders",
      action: "create",
      title: "Test",
      creatorID: 2,
      destination: 991828,
      signature: "abc",
    });

    const parsed = JSON.parse(capturedBody) as {
      answer: { tool: string; action: string; destination: number };
    };
    expect(parsed.answer.tool).toBe("orders");
    expect(parsed.answer.action).toBe("create");
    expect(parsed.answer.destination).toBe(991828);

    globalThis.fetch = originalFetch;
    process.env.HUB_API_KEY = originalKey;
  });
});
