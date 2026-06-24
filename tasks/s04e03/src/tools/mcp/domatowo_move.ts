import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postDomatowoAnswer } from "../../hub/domatowoClient.js";
import {
  domatowoMoveInputSchema,
  type DomatowoMoveInput,
} from "./schemas.js";

export { domatowoMoveInputSchema };

export async function executeDomatowoMove(
  args: DomatowoMoveInput,
): Promise<McpToolResponse> {
  return postDomatowoAnswer({
    action: "move",
    object: args.object,
    where: args.where,
  });
}
