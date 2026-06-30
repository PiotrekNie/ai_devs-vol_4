/**
 * Thin HTTP client for hub task foodwarehouse — no warehouse solver logic.
 */

import {
  fetchWithRetry,
  mcpErr,
  mcpOk,
  type McpToolResponse,
} from "@ai-devs/agent-boilerplate";
import { extractFlag } from "../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import { HUB_VERIFY_URL } from "../../config.js";
import type { FoodwarehouseAnswer, FoodwarehouseHubResponse } from "./types.js";

const TASK_NAME = "foodwarehouse";

function resolveHubApiKey(): string {
  return process.env["HUB_API_KEY"]?.trim() ?? "";
}

export async function postFoodwarehouseAnswer(
  answer: FoodwarehouseAnswer,
): Promise<McpToolResponse> {
  const apiKey = resolveHubApiKey();
  if (!apiKey) {
    return mcpErr(
      "HUB_API_KEY is not set. Add it to tasks/.env to use foodwarehouse tools.",
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
    let parsed: FoodwarehouseHubResponse;
    try {
      parsed = JSON.parse(rawText) as FoodwarehouseHubResponse;
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

export async function fetchFoodwarehouseHelp(): Promise<McpToolResponse> {
  return postFoodwarehouseAnswer({ tool: "help" });
}

export async function postFoodwarehouseDone(): Promise<McpToolResponse> {
  return postFoodwarehouseAnswer({ tool: "done" });
}

export async function resetFoodwarehouseOrders(): Promise<McpToolResponse> {
  return postFoodwarehouseAnswer({ tool: "reset" });
}
