/**
 * shell_exec MCP tool — one remote shell command via hub VM API.
 *
 * POST https://hub.ag3nts.org/api/shell with { apikey, cmd }.
 * Retries on 503 via fetchWithRetry; handles ban with sleep + one retry.
 */

import { z } from "zod";
import {
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
  type McpToolResponse,
  mcpErr,
  mcpOk,
} from "@ai-devs/agent-boilerplate";
import { SHELL_API_URL } from "../../../config.js";

export const shellExecInputSchema = z.object({
  cmd: z
    .string()
    .min(1)
    .describe(
      "Single shell command for the remote VM. One command per tool call — " +
        "start with help. Avoid /etc, /root, /proc/ and paths listed in .gitignore files.",
    ),
});
export type ShellExecInput = z.infer<typeof shellExecInputSchema>;

const MAX_BAN_SLEEP_SEC = 120;
const DEFAULT_BAN_SLEEP_SEC = 30;

export type ShellExecResult = {
  ok: boolean;
  status: number;
  cmd: string;
  output: string;
  banSeconds?: number;
  retriedAfterBan?: boolean;
  data?: unknown;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseResponseBody(rawText: string): unknown {
  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
}

function formatOutput(parsed: unknown, rawText: string): string {
  if (typeof parsed === "string") return parsed;
  if (parsed !== null && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    for (const key of ["output", "stdout", "result", "message", "error"]) {
      const v = o[key];
      if (typeof v === "string" && v.length > 0) return v;
    }
    return JSON.stringify(parsed);
  }
  return rawText;
}

export function extractBanSeconds(parsed: unknown, rawText: string): number | null {
  if (parsed !== null && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    for (const key of ["banSeconds", "ban_seconds", "retry_after", "retryAfter", "wait"]) {
      const v = o[key];
      if (typeof v === "number" && v > 0) {
        return Math.min(Math.ceil(v), MAX_BAN_SLEEP_SEC);
      }
      if (typeof v === "string") {
        const n = Number.parseInt(v, 10);
        if (Number.isFinite(n) && n > 0) {
          return Math.min(n, MAX_BAN_SLEEP_SEC);
        }
      }
    }
  }

  const haystack = `${typeof parsed === "string" ? parsed : JSON.stringify(parsed)} ${rawText}`.toLowerCase();
  const match = haystack.match(/(?:ban|blocked|wait)[^\d]{0,40}(\d{1,3})\s*(?:s|sec|seconds)?/);
  if (match?.[1]) {
    const n = Number.parseInt(match[1], 10);
    if (Number.isFinite(n) && n > 0) {
      return Math.min(n, MAX_BAN_SLEEP_SEC);
    }
  }
  return null;
}

export function isBanResponse(status: number, parsed: unknown, rawText: string): boolean {
  if (status === 429) return true;
  const text = `${typeof parsed === "string" ? parsed : JSON.stringify(parsed)} ${rawText}`.toLowerCase();
  return (
    text.includes("ban") ||
    text.includes("blocked") ||
    text.includes("forbidden") ||
    text.includes("blacklist") ||
    text.includes("not allowed")
  );
}

function resolveHubApiKey(): string | undefined {
  return process.env["HUB_API_KEY"]?.trim();
}

async function postShell(
  cmd: string,
  apiKey: string,
  options?: { delayOverrideMs?: number },
): Promise<{
  response: Response;
  rawText: string;
  parsed: unknown;
}> {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: apiKey, cmd }),
  };
  const baseDelay = options?.delayOverrideMs ?? RETRY_BASE_DELAY_MS;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const response = await fetch(SHELL_API_URL, init);
    if (response.status !== 503) {
      const rawText = await response.text();
      return { response, rawText, parsed: parseResponseBody(rawText) };
    }

    const isLastAttempt = attempt === MAX_RETRY_ATTEMPTS - 1;
    if (isLastAttempt) {
      const rawText = await response.text();
      return { response, rawText, parsed: parseResponseBody(rawText) };
    }

    const delay = baseDelay * Math.pow(2, attempt);
    await sleep(delay);
  }

  throw new Error("postShell: unreachable");
}

function buildShellResult(
  cmd: string,
  response: Response,
  parsed: unknown,
  rawText: string,
  extra?: Partial<Pick<ShellExecResult, "banSeconds" | "retriedAfterBan">>,
): ShellExecResult {
  return {
    ok: response.ok,
    status: response.status,
    cmd,
    output: formatOutput(parsed, rawText),
    data: parsed,
    ...extra,
  };
}

export async function executeShellExec(args: ShellExecInput): Promise<McpToolResponse> {
  return executeShellExecWithOptions(args);
}

export async function executeShellExecWithOptions(
  args: ShellExecInput,
  options?: { delayOverrideMs?: number },
): Promise<McpToolResponse> {
  const apiKey = resolveHubApiKey();
  if (!apiKey) {
    return mcpErr(
      "HUB_API_KEY is not set. Add it to tasks/.env to use shell_exec.",
    );
  }

  const cmd = args.cmd.trim();
  if (!cmd) {
    return mcpErr("shell_exec requires a non-empty cmd string.");
  }

  try {
    let first = await postShell(cmd, apiKey, options);

    if (isBanResponse(first.response.status, first.parsed, first.rawText)) {
      const banSeconds =
        extractBanSeconds(first.parsed, first.rawText) ?? DEFAULT_BAN_SLEEP_SEC;
      const delayMs = options?.delayOverrideMs ?? banSeconds * 1000;
      await sleep(delayMs);
      first = await postShell(cmd, apiKey, options);
      const result = buildShellResult(cmd, first.response, first.parsed, first.rawText, {
        banSeconds,
        retriedAfterBan: true,
      });
      return mcpOk(JSON.stringify(result));
    }

    const result = buildShellResult(cmd, first.response, first.parsed, first.rawText);
    return mcpOk(JSON.stringify(result));
  } catch (error) {
    return mcpErr(error instanceof Error ? error.message : String(error));
  }
}
