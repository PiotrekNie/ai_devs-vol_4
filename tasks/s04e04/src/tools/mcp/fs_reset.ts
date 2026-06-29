import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { resetFilesystem } from "../../hub/filesystemClient.js";

export async function executeFsReset(): Promise<McpToolResponse> {
  return resetFilesystem();
}
