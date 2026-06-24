import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postDomatowoAnswer } from "../../hub/domatowoClient.js";
import {
  domatowoCallHelicopterInputSchema,
  type DomatowoCallHelicopterInput,
} from "./schemas.js";

export { domatowoCallHelicopterInputSchema };

export async function executeDomatowoCallHelicopter(
  args: DomatowoCallHelicopterInput,
): Promise<McpToolResponse> {
  return postDomatowoAnswer({
    action: "callHelicopter",
    destination: args.destination,
  });
}
