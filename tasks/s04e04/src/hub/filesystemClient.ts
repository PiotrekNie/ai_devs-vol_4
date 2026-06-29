/**
 * Thin HTTP client for hub task filesystem — no extraction logic.
 */

import {
  fetchWithRetry,
  mcpErr,
  mcpOk,
  type McpToolResponse,
} from "@ai-devs/agent-boilerplate";
import { extractFlag } from "../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import { HUB_VERIFY_URL } from "../../config.js";
import type { FilesystemAnswer, FilesystemHubResponse } from "./types.js";

const TASK_NAME = "filesystem";

function resolveHubApiKey(): string {
  return process.env["HUB_API_KEY"]?.trim() ?? "";
}

export async function postFilesystemAnswer(
  answer: FilesystemAnswer,
): Promise<McpToolResponse> {
  const apiKey = resolveHubApiKey();
  if (!apiKey) {
    return mcpErr(
      "HUB_API_KEY is not set. Add it to tasks/.env to use filesystem tools.",
    );
  }

  const payload = {
    apikey: apiKey,
    task: TASK_NAME,
    answer,
  };

  try {
    const response = await fetchWithRetry(HUB_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let parsed: FilesystemHubResponse;
    try {
      parsed = JSON.parse(rawText) as FilesystemHubResponse;
    } catch {
      parsed = { message: rawText };
    }

    const flag = extractFlag(rawText);
    const result = {
      ok: response.ok,
      status: response.status,
      data: parsed,
      ...(flag !== null ? { flag } : {}),
    };

    return mcpOk(JSON.stringify(result));
  } catch (error) {
    return mcpErr(error instanceof Error ? error.message : String(error));
  }
}

export async function fetchFilesystemHelp(): Promise<McpToolResponse> {
  return postFilesystemAnswer({ action: "help" });
}

export async function postFilesystemBatch(
  actions: FilesystemAnswer,
): Promise<McpToolResponse> {
  if (!Array.isArray(actions)) {
    return mcpErr("fs_batch requires an array of filesystem actions.");
  }
  return postFilesystemAnswer(actions);
}

export async function postFilesystemDone(): Promise<McpToolResponse> {
  return postFilesystemAnswer({ action: "done" });
}

export async function listFilesystem(path?: string): Promise<McpToolResponse> {
  return postFilesystemAnswer(
    path !== undefined ? { action: "listFiles", path } : { action: "listFiles" },
  );
}

export async function resetFilesystem(): Promise<McpToolResponse> {
  return postFilesystemAnswer({ action: "reset" });
}
