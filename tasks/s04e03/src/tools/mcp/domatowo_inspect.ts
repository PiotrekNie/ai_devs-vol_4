import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postDomatowoAnswer } from "../../hub/domatowoClient.js";
import {
  domatowoInspectInputSchema,
  type DomatowoInspectInput,
} from "./schemas.js";

export { domatowoInspectInputSchema };

export async function executeDomatowoInspect(
  args: DomatowoInspectInput,
): Promise<McpToolResponse> {
  return postDomatowoAnswer({
    action: "inspect",
    object: args.object,
  });
}
