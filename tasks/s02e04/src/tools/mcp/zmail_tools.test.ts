import { describe, it, expect, mock, afterEach } from "bun:test";
import { executeSearchMail } from "./search_mail.js";
import { executeDownloadMailContent } from "./download_mail_content.js";

describe("search_mail", () => {
  afterEach(() => {
    globalThis.fetch = global.fetch;
    delete process.env.HUB_API_KEY;
  });

  it("posts search action with query and apikey", async () => {
    process.env.HUB_API_KEY = "test-key";
    let capturedBody: string | null = null;

    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response(
        JSON.stringify({ ok: true, action: "search", items: [] }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const out = await executeSearchMail({
      query: "from:proton.me",
      page: 2,
      perPage: 10,
    });

    expect(out.isError).toBeUndefined();
    const text = out.content[0]?.text;
    expect(text).toBeDefined();
    expect(JSON.parse(text!)).toMatchObject({
      ok: true,
      status: 200,
      data: { ok: true, action: "search" },
    });

    expect(capturedBody).toBeDefined();
    const body = JSON.parse(capturedBody!);
    expect(body).toEqual({
      apikey: "test-key",
      action: "search",
      query: "from:proton.me",
      page: 2,
      perPage: 10,
    });
  });

  it("returns error when HUB_API_KEY is missing", async () => {
    delete process.env.HUB_API_KEY;
    globalThis.fetch = mock(async () => new Response("", { status: 200 })) as unknown as typeof fetch;

    const out = await executeSearchMail({ query: "x" });
    expect(out.isError).toBe(true);
    expect(out.content[0]?.text).toContain("HUB_API_KEY");
  });
});

describe("download_mail_content", () => {
  afterEach(() => {
    globalThis.fetch = global.fetch;
    delete process.env.HUB_API_KEY;
  });

  it("posts getMessages with single numeric id", async () => {
    process.env.HUB_API_KEY = "k";
    let capturedBody: string | null = null;
    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response(JSON.stringify({ ok: true, messages: [] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    await executeDownloadMailContent({ ids: 127 });

    const body = JSON.parse(capturedBody!);
    expect(body).toEqual({
      apikey: "k",
      action: "getMessages",
      ids: 127,
    });
  });

  it("posts getMessages with array of ids", async () => {
    process.env.HUB_API_KEY = "k";
    let capturedBody: string | null = null;
    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    await executeDownloadMailContent({ ids: [1, "deadbeefdeadbeefdeadbeefdeadbeef"] });

    const body = JSON.parse(capturedBody!);
    expect(body).toEqual({
      apikey: "k",
      action: "getMessages",
      ids: [1, "deadbeefdeadbeefdeadbeefdeadbeef"],
    });
  });
});
