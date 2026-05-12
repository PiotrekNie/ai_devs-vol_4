import { describe, it, expect, mock, afterEach } from "bun:test";
import { fetchWithRetry } from "./ai.js";

// ── fetchWithRetry retry counting ─────────────────────────────────────────────

describe("fetchWithRetry", () => {
  afterEach(() => {
    // Restore real fetch after each test
    globalThis.fetch = global.fetch;
  });

  it("returns immediately on a 200 response", async () => {
    let calls = 0;
    globalThis.fetch = mock(async () => {
      calls++;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const res = await fetchWithRetry("https://example.com", {}, 0);
    expect(res.status).toBe(200);
    expect(calls).toBe(1);
  });

  it("retries on 503 and succeeds on the third attempt", async () => {
    let calls = 0;
    globalThis.fetch = mock(async () => {
      calls++;
      const status = calls < 3 ? 503 : 200;
      return new Response("", { status });
    }) as unknown as typeof fetch;

    const res = await fetchWithRetry("https://example.com", {}, 0);
    expect(res.status).toBe(200);
    expect(calls).toBe(3);
  });

  it("retries on 429 (rate limit)", async () => {
    let calls = 0;
    globalThis.fetch = mock(async () => {
      calls++;
      const status = calls < 2 ? 429 : 200;
      return new Response("", { status });
    }) as unknown as typeof fetch;

    const res = await fetchWithRetry("https://example.com", {}, 0);
    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });

  it("returns the last 503 after exhausting MAX_RETRY_ATTEMPTS", async () => {
    let calls = 0;
    globalThis.fetch = mock(async () => {
      calls++;
      return new Response("", { status: 503 });
    }) as unknown as typeof fetch;

    const res = await fetchWithRetry("https://example.com", {}, 0);
    expect(res.status).toBe(503);
    // MAX_RETRY_ATTEMPTS defaults to 5
    expect(calls).toBe(5);
  });

  it("does not retry on 404", async () => {
    let calls = 0;
    globalThis.fetch = mock(async () => {
      calls++;
      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;

    const res = await fetchWithRetry("https://example.com", {}, 0);
    expect(res.status).toBe(404);
    expect(calls).toBe(1);
  });
});
