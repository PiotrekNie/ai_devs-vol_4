import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postFoodwarehouseAnswer } from "../../hub/foodwarehouseClient.js";
import type { FwOrdersInput } from "./schemas.js";

export async function executeFwOrders(
  args: FwOrdersInput,
): Promise<McpToolResponse> {
  return postFoodwarehouseAnswer({ tool: "orders", ...args });
}
