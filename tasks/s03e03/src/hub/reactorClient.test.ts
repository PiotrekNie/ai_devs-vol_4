import { describe, expect, it, mock, afterEach, beforeEach } from "bun:test";
import { createReactorClient } from "./reactorClient.js";

describe("reactorClient", () => {
  const originalKey = process.env.HUB_API_KEY;

  beforeEach(() => {
    process.env.HUB_API_KEY = "test-key";
  });

  afterEach(() => {
    globalThis.fetch = global.fetch;
    if (originalKey === undefined) {
      delete process.env.HUB_API_KEY;
    } else {
      process.env.HUB_API_KEY = originalKey;
    }
  });

  it("throws when api key missing", () => {
    expect(() => createReactorClient({ apiKey: "" })).toThrow("HUB_API_KEY");
  });

  it("posts reactor command payload", async () => {
    let body: string | null = null;
    globalThis.fetch = mock(async (_url, init) => {
      body = init?.body as string;
      return new Response(
        JSON.stringify({
          code: 100,
          message: "ok",
          player: { col: 1, row: 5 },
          goal: { col: 7, row: 5 },
          blocks: [],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const client = createReactorClient({ apiKey: "secret" });
    await client.sendCommand("wait");
    expect(JSON.parse(body!)).toEqual({
      apikey: "secret",
      task: "reactor",
      answer: { command: "wait" },
    });
  });

  it("extracts flag from message", () => {
    const client = createReactorClient({ apiKey: "k" });
    const flag = client.findFlag({
      code: 0,
      message: "Done {FLG:INSTALLED}",
    });
    expect(flag).toBe("{FLG:INSTALLED}");
  });
});
