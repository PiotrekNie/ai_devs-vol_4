import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postFoodwarehouseAnswer } from "../../hub/foodwarehouseClient.js";
import { fwSignatureSchema, type FwSignatureInput } from "./schemas.js";

export async function executeFwSignature(
  args: FwSignatureInput,
): Promise<McpToolResponse> {
  return postFoodwarehouseAnswer({
    tool: "signatureGenerator",
    action: "generate",
    login: args.login,
    birthday: args.birthday,
    destination: args.destination,
  });
}

export { fwSignatureSchema };
