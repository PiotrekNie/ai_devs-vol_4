import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { fetchFilesystemHelp } from "../../hub/filesystemClient.js";

export async function executeFsHelp(): Promise<McpToolResponse> {
  return fetchFilesystemHelp();
}
