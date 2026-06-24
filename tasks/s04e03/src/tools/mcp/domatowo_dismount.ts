import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postDomatowoAnswer } from "../../hub/domatowoClient.js";
import {
  domatowoDismountInputSchema,
  type DomatowoDismountInput,
} from "./schemas.js";

export { domatowoDismountInputSchema };

export async function executeDomatowoDismount(
  args: DomatowoDismountInput,
): Promise<McpToolResponse> {
  return postDomatowoAnswer({
    action: "dismount",
    object: args.object,
    passengers: args.passengers,
  });
}
