import { describe, expect, it, mock, beforeEach, afterEach } from "bun:test";
import {
  executeShellExec,
  executeShellExecWithOptions,
  extractBanSeconds,
  isBanResponse,
} from "./shell_exec.js";

describe("shell_exec helpers", () => {
  it("detects ban from status 429", () => {
    expect(isBanResponse(429, { message: "slow down" }, "")).toBe(true);
  });

  it("extracts ban seconds from payload", () => {
    expect(extractBanSeconds({ banSeconds: 45 }, "")).toBe(45);
    expect(extractBanSeconds({ retry_after: "12" }, "")).toBe(12);
  });
});

describe("executeShellExec", () => {
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

  it("returns error when HUB_API_KEY missing", async () => {
    delete process.env.HUB_API_KEY;
    const out = await executeShellExec({ cmd: "help" });
    expect(out.isError).toBe(true);
    expect(out.content[0]?.text).toContain("HUB_API_KEY");
  }, 10_000);

  it("posts apikey and cmd to shell API", async () => {
    let capturedBody: string | null = null;
    globalThis.fetch = mock(async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response(JSON.stringify({ output: "commands: help" }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    const out = await executeShellExec({ cmd: "help" });
    expect(out.isError).toBeFalsy();
    expect(JSON.parse(capturedBody!)).toEqual({ apikey: "test-key", cmd: "help" });
    const payload = JSON.parse(out.content[0]?.text ?? "{}") as { output: string };
    expect(payload.output).toContain("help");
  });

  it("retries once after ban with zero delay in tests", async () => {
    let calls = 0;
    globalThis.fetch = mock(async () => {
      calls++;
      if (calls === 1) {
        return new Response(JSON.stringify({ error: "ban for 2 seconds" }), {
          status: 429,
        });
      }
      return new Response(JSON.stringify({ output: "ok after ban" }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    const out = await executeShellExecWithOptions({ cmd: "help" }, { delayOverrideMs: 0 });
    expect(calls).toBe(2);
    const payload = JSON.parse(out.content[0]?.text ?? "{}") as {
      output: string;
      retriedAfterBan?: boolean;
    };
    expect(payload.retriedAfterBan).toBe(true);
    expect(payload.output).toContain("ok after ban");
  });
});
