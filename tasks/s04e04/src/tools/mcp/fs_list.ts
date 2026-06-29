import { z } from "zod";
import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { listFilesystem } from "../../hub/filesystemClient.js";

export const fsListInputSchema = z.object({
  path: z
    .string()
    .optional()
    .describe("Directory path to list (default /). Example: /miasta"),
});

export async function executeFsList(
  args: z.infer<typeof fsListInputSchema>,
): Promise<McpToolResponse> {
  return listFilesystem(args.path);
}
