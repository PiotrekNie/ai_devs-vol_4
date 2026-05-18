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

describe("download_mail_content (integration with search_mail)", () => {
  afterEach(() => {
    globalThis.fetch = global.fetch;
    delete process.env.HUB_API_KEY;
  });

  it("posts getMessages with messageID array", async () => {
    process.env.HUB_API_KEY = "k";
    let capturedBody: string | null = null;
    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const id = "deadbeefdeadbeefdeadbeefdeadbeef";
    await executeDownloadMailContent({ ids: [id, "a7353b90b3c7d973255aa6cf36bcba0f"] });

    const body = JSON.parse(capturedBody!);
    expect(body).toEqual({
      apikey: "k",
      action: "getMessages",
      ids: [id, "a7353b90b3c7d973255aa6cf36bcba0f"],
    });
  });
});
