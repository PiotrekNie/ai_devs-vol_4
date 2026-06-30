import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { fetchFoodwarehouseHelp } from "../../hub/foodwarehouseClient.js";

export async function executeFwHelp(): Promise<McpToolResponse> {
  return fetchFoodwarehouseHelp();
}
