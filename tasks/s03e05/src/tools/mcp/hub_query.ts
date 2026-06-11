/**
 * hub_query MCP — POST https://hub.ag3nts.org/api/{path} with { apikey, query }.
 */

import { z } from "zod";
import {
  fetchWithRetry,
  mcpErr,
  mcpOk,
  type McpToolResponse,
} from "@ai-devs/agent-boilerplate";
import { HUB_BASE_URL } from "../../../config.js";
import { recordHubResponse } from "../../domain/discovery_store.js";

export const hubQueryInputSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe(
      "Hub API path without /api/ prefix. Start with toolsearch, then use discovered paths " +
        "(maps, wehicles, books). Example: maps",
    ),
  query: z
    .string()
    .min(1)
    .describe(
      "English natural language or keywords for the hub tool. " +
        "Examples: Skolwin (maps), rocket (wehicles), movement (books).",
    ),
});

export type HubQueryInput = z.infer<typeof hubQueryInputSchema>;

function normalizePath(path: string): string {
  return path.trim().replace(/^\/+/, "").replace(/^api\//, "");
}

function resolveHubApiKey(): string | undefined {
  return process.env["HUB_API_KEY"]?.trim();
}

export async function executeHubQuery(
  args: HubQueryInput,
): Promise<McpToolResponse> {
  const apiKey = resolveHubApiKey();
  if (!apiKey) {
    return mcpErr("HUB_API_KEY is not set in environment.");
  }

  const path = normalizePath(args.path);
  const url = `${HUB_BASE_URL.replace(/\/$/, "")}/api/${path}`;

  try {
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: apiKey, query: args.query }),
    });

    const rawText = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }

    if (parsed !== null && typeof parsed === "object") {
      recordHubResponse(path, parsed);
    }

    const result = {
      ok: response.ok,
      status: response.status,
      path,
      data: parsed,
    };

    return mcpOk(JSON.stringify(result));
  } catch (error) {
    return mcpErr(error instanceof Error ? error.message : String(error));
  }
}
