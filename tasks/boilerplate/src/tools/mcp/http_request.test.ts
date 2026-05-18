import { describe, it, expect, mock, afterEach } from "bun:test";
import { executeHttpRequest } from "./http_request.js";

describe("executeHttpRequest", () => {
  afterEach(() => {
    globalThis.fetch = global.fetch;
  });

  it("rejects POST without body before fetch", async () => {
    let fetchCalled = false;
    globalThis.fetch = mock(async () => {
      fetchCalled = true;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    const out = await executeHttpRequest({
      url: "https://example.com/api",
      method: "POST",
    });

    expect(out.isError).toBe(true);
    expect(out.content[0]?.text).toContain("body");
    expect(fetchCalled).toBe(false);
  });

  it("sends JSON body on POST", async () => {
    let capturedBody: string | null = null;
    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    await executeHttpRequest({
      url: "https://example.com/api",
      method: "POST",
      body: { action: "help" },
    });

    expect(JSON.parse(capturedBody!)).toEqual({ action: "help" });
  });
});
