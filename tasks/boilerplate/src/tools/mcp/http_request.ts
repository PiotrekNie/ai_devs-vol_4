/**
 * http_request MCP tool — GET/POST with exponential backoff on 429/503.
 *
 * The course hub deliberately returns HTTP 503 to simulate production errors.
 * This tool applies the same retry policy as the LLM adapter.
 */

import { z } from "zod";
import { fetchWithRetry } from "../../agent/ai.js";
import { mcpOk, mcpErr } from "../../types/index.js";
import type { McpToolResponse } from "../../types/index.js";

export const httpRequestInputSchema = z
  .object({
    url: z.string().url().describe("The URL to request."),
    method: z
      .enum(["GET", "POST"])
      .default("GET")
      .describe("HTTP method. Defaults to GET."),
    body: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        "Required when method is POST: JSON object sent as the request body.",
      ),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe("Optional extra HTTP headers to include."),
  })
  .superRefine((val, ctx) => {
    if (val.method === "POST" && val.body === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "POST requests require `body` (JSON object).",
        path: ["body"],
      });
    }
  });
export type HttpRequestInput = z.infer<typeof httpRequestInputSchema>;

export async function executeHttpRequest(
  args: HttpRequestInput,
): Promise<McpToolResponse> {
  const { url, method, body, headers: extraHeaders } = args;

  if (method === "POST" && body === undefined) {
    return mcpErr("POST requests require `body` (JSON object).");
  }

  try {
    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
    };
    if (method === "POST") {
      init.body = JSON.stringify(body);
    }

    const response = await fetchWithRetry(url, init);
    const rawText = await response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }

    const result = {
      ok: response.ok,
      status: response.status,
      data: parsed,
    };
    return mcpOk(JSON.stringify(result));
  } catch (error) {
    return mcpErr(error instanceof Error ? error.message : String(error));
  }
}
