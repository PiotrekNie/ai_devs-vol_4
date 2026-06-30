import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { resetFoodwarehouseOrders } from "../../hub/foodwarehouseClient.js";

export async function executeFwReset(): Promise<McpToolResponse> {
  return resetFoodwarehouseOrders();
}
