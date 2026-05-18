import { describe, it, expect, mock, afterEach } from "bun:test";
import {
  executeDownloadMailContent,
  isZmailMessageId,
  rejectRowIdDownloadIds,
} from "./download_mail_content.js";

const SAMPLE_ID = "6624add090a5cb06f5c192653b5a243c";

describe("isZmailMessageId", () => {
  it("accepts 32-char hex", () => {
    expect(isZmailMessageId(SAMPLE_ID)).toBe(true);
  });

  it("rejects ticket labels and short strings", () => {
    expect(isZmailMessageId("SEC-41248")).toBe(false);
    expect(isZmailMessageId("86")).toBe(false);
  });
});

describe("rejectRowIdDownloadIds", () => {
  it("rejects numeric rowID", () => {
    const err = rejectRowIdDownloadIds(86);
    expect(err?.isError).toBe(true);
    expect(err?.content[0]?.text).toContain("messageID");
  });

  it("rejects numeric string rowID", () => {
    const err = rejectRowIdDownloadIds("93");
    expect(err?.isError).toBe(true);
  });
});

describe("executeDownloadMailContent", () => {
  afterEach(() => {
    globalThis.fetch = global.fetch;
    delete process.env.HUB_API_KEY;
  });

  it("rejects rowID before fetch", async () => {
    let fetchCalled = false;
    globalThis.fetch = mock(async () => {
      fetchCalled = true;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    const out = await executeDownloadMailContent({ ids: 86 });
    expect(out.isError).toBe(true);
    expect(out.content[0]?.text).toContain("rowID");
    expect(fetchCalled).toBe(false);
  });

  it("posts getMessages with messageID string", async () => {
    process.env.HUB_API_KEY = "k";
    let capturedBody: string | null = null;
    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const out = await executeDownloadMailContent({ ids: SAMPLE_ID });

    expect(out.isError).toBeUndefined();
    expect(JSON.parse(capturedBody!)).toEqual({
      apikey: "k",
      action: "getMessages",
      ids: SAMPLE_ID,
    });
  });
});
