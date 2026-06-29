import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postFilesystemDone } from "../../hub/filesystemClient.js";

export async function executeFsDone(): Promise<McpToolResponse> {
  return postFilesystemDone();
}
