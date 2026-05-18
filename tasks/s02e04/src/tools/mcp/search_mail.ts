/**
 * search_mail — zmail `action: "search"` with Gmail-like query syntax.
 */

import { z } from "zod";
import { mcpOk, mcpErr } from "../../types/index.js";
import type { McpToolResponse } from "../../types/index.js";
import { postZmail } from "./zmail_client.js";

export const searchMailInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "Gmail-style query: from:, to:, subject:, OR, AND, \"phrase\", -exclude. " +
        "Each hit in the response includes messageID (32-char hex) — pass that to download_mail_content, not rowID.",
    ),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Page number (default 1)."),
  perPage: z
    .number()
    .int()
    .min(5)
    .max(20)
    .optional()
    .describe("Results per page (5–20, API default if omitted)."),
});
export type SearchMailInput = z.infer<typeof searchMailInputSchema>;

export async function executeSearchMail(
  args: SearchMailInput,
): Promise<McpToolResponse> {
  try {
    const { query, page, perPage } = searchMailInputSchema.parse(args);
    const body: Record<string, unknown> = {
      action: "search",
      query,
    };
    if (page !== undefined) body.page = page;
    if (perPage !== undefined) body.perPage = perPage;

    const result = await postZmail(body);
    return mcpOk(JSON.stringify(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return mcpErr(message);
  }
}
