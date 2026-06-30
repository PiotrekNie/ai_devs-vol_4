import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postFoodwarehouseDone } from "../../hub/foodwarehouseClient.js";

export async function executeFwDone(): Promise<McpToolResponse> {
  return postFoodwarehouseDone();
}
