/**
 * Thin HTTP client for hub task domatowo — no mission logic.
 */

import {
  fetchWithRetry,
  mcpErr,
  mcpOk,
  type McpToolResponse,
} from "@ai-devs/agent-boilerplate";
import { extractFlag } from "../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import { HUB_VERIFY_URL } from "../../config.js";
import type { DomatowoAnswer, DomatowoHubResponse } from "./types.js";

const TASK_NAME = "domatowo";

function resolveHubApiKey(): string {
  return process.env["HUB_API_KEY"]?.trim() ?? "";
}

export async function postDomatowoAnswer(
  answer: DomatowoAnswer,
): Promise<McpToolResponse> {
  const apiKey = resolveHubApiKey();
  if (!apiKey) {
    return mcpErr(
      "HUB_API_KEY is not set. Add it to tasks/.env to use domatowo tools.",
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
    let parsed: DomatowoHubResponse;
    try {
      parsed = JSON.parse(rawText) as DomatowoHubResponse;
    } catch {
      parsed = { message: rawText };
    }

    const flag = extractFlag(rawText);
    const result = {
      ok: response.ok,
      status: response.status,
      action: answer.action,
      data: parsed,
      ...(typeof parsed.action_points_left === "number"
        ? { action_points_left: parsed.action_points_left }
        : {}),
      ...(flag !== null ? { flag } : {}),
    };

    return mcpOk(JSON.stringify(result));
  } catch (error) {
    return mcpErr(error instanceof Error ? error.message : String(error));
  }
}
