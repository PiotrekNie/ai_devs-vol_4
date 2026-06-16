/**
 * oko_help MCP — fetch OKO Editor API documentation from hub.
 */

import { z } from "zod";
import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { executeSubmitToHub } from "../../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import { OKOEDITOR_TASK_NAME } from "../../../config.js";

export const okoHelpInputSchema = z.object({});

export async function executeOkoHelp(
  _args: z.infer<typeof okoHelpInputSchema>,
): Promise<McpToolResponse> {
  return executeSubmitToHub({
    task_name: OKOEDITOR_TASK_NAME,
    answer: { action: "help" },
  });
}
