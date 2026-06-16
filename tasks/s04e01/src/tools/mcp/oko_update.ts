/**
 * oko_update MCP — update one OKO record via hub verify API.
 */

import { z } from "zod";
import { mcpErr, type McpToolResponse } from "@ai-devs/agent-boilerplate";
import { executeSubmitToHub } from "../../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import { OKOEDITOR_TASK_NAME } from "../../../config.js";
import {
  INCIDENT_TITLE_PREFIX,
  OKO_PAGE_VALUES,
  OKO_RECORD_ID_PATTERN,
} from "./oko_constants.js";

export const okoUpdateInputSchema = z
  .object({
    page: z
      .enum(OKO_PAGE_VALUES)
      .describe("Target page: incydenty, notatki, or zadania."),
    id: z
      .string()
      .regex(OKO_RECORD_ID_PATTERN, "id must be 32-char hex (from OKO panel)"),
    title: z.string().optional().describe("New title (optional)."),
    content: z.string().optional().describe("New content / description (optional)."),
    done: z
      .enum(["YES", "NO"])
      .optional()
      .describe('Mark task done — only allowed when page is "zadania".'),
  })
  .refine((v) => Boolean(v.title?.trim() || v.content?.trim()), {
    message: 'At least one of "title" or "content" must be non-empty.',
  });

export type OkoUpdateInput = z.infer<typeof okoUpdateInputSchema>;

export function validateOkoUpdate(args: OkoUpdateInput): string | null {
  if (args.done !== undefined && args.page !== "zadania") {
    return 'Field "done" is allowed only when page is "zadania".';
  }
  if (args.page === "incydenty" && args.title?.trim()) {
    if (!INCIDENT_TITLE_PREFIX.test(args.title.trim())) {
      return 'Incident title must start with MOVE00, PROB00, or RECO00.';
    }
  }
  return null;
}

export async function executeOkoUpdate(
  args: OkoUpdateInput,
): Promise<McpToolResponse> {
  const validationError = validateOkoUpdate(args);
  if (validationError) {
    return mcpErr(validationError);
  }

  const answer: Record<string, string> = {
    action: "update",
    page: args.page,
    id: args.id,
  };
  if (args.title?.trim()) answer.title = args.title.trim();
  if (args.content?.trim()) answer.content = args.content.trim();
  if (args.done !== undefined) answer.done = args.done;

  return executeSubmitToHub({
    task_name: OKOEDITOR_TASK_NAME,
    answer,
  });
}
