import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postDomatowoAnswer } from "../../hub/domatowoClient.js";

export async function executeDomatowoReset(): Promise<McpToolResponse> {
  return postDomatowoAnswer({ action: "reset" });
}
