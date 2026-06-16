/**
 * oko_done MCP — verify all OKO edits and request the course flag.
 */

import { z } from "zod";
import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { executeSubmitToHub } from "../../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import { OKOEDITOR_TASK_NAME } from "../../../config.js";

export const okoDoneInputSchema = z.object({});

export async function executeOkoDone(
  _args: z.infer<typeof okoDoneInputSchema>,
): Promise<McpToolResponse> {
  return executeSubmitToHub({
    task_name: OKOEDITOR_TASK_NAME,
    answer: { action: "done" },
  });
}
