import { z } from "zod";
import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { filesystemActionSchema } from "../../hub/types.js";
import { postFilesystemBatch } from "../../hub/filesystemClient.js";

export const fsBatchInputSchema = z.object({
  actions: z
    .array(filesystemActionSchema)
    .min(1)
    .describe(
      "Sequential filesystem operations (batch_mode). Allowed: createDirectory, " +
        "createFile, deleteFile, deleteDirectory, reset. NOT done/help/listFiles. " +
        "Create city files before person/good files that link to them.",
    ),
});

export async function executeFsBatch(
  args: z.infer<typeof fsBatchInputSchema>,
): Promise<McpToolResponse> {
  return postFilesystemBatch(args.actions);
}
