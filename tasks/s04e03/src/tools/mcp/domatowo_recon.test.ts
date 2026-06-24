import { describe, expect, it, mock, beforeEach } from "bun:test";
import { executeDomatowoRecon } from "./domatowo_recon.js";

describe("domatowo_recon", () => {
  const originalKey = process.env.HUB_API_KEY;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.HUB_API_KEY = "test-key";
  });

  it("sends getMap with optional symbols", async () => {
    let capturedBody = "";

    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(JSON.stringify({ code: 80, message: "Map loaded." }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    await executeDomatowoRecon({
      action: "getMap",
      symbols: ["B3"],
    });

    const parsed = JSON.parse(capturedBody) as {
      answer: { action: string; symbols: string[] };
    };
    expect(parsed.answer.action).toBe("getMap");
    expect(parsed.answer.symbols).toEqual(["B3"]);

    globalThis.fetch = originalFetch;
    process.env.HUB_API_KEY = originalKey;
  });

  it("sends searchSymbol with symbol param", async () => {
    let capturedBody = "";

    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(JSON.stringify({ code: 90, symbol: "B3", found: [] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    await executeDomatowoRecon({
      action: "searchSymbol",
      symbol: "B3",
    });

    const parsed = JSON.parse(capturedBody) as {
      answer: { action: string; symbol: string };
    };
    expect(parsed.answer.action).toBe("searchSymbol");
    expect(parsed.answer.symbol).toBe("B3");

    globalThis.fetch = originalFetch;
    process.env.HUB_API_KEY = originalKey;
  });
});
