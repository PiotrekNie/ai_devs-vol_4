import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postFoodwarehouseAnswer } from "../../hub/foodwarehouseClient.js";
import { fwDatabaseSchema, type FwDatabaseInput } from "./schemas.js";

export async function executeFwDatabase(
  args: FwDatabaseInput,
): Promise<McpToolResponse> {
  return postFoodwarehouseAnswer({ tool: "database", query: args.query });
}

export { fwDatabaseSchema };
