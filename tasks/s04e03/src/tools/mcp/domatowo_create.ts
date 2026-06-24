import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postDomatowoAnswer } from "../../hub/domatowoClient.js";
import {
  domatowoCreateInputSchema,
  type DomatowoCreateInput,
} from "./schemas.js";

export { domatowoCreateInputSchema };

export async function executeDomatowoCreate(
  args: DomatowoCreateInput,
): Promise<McpToolResponse> {
  const answer: Record<string, unknown> = {
    action: "create",
    type: args.type,
  };
  if (args.type === "transporter") {
    answer.passengers = args.passengers ?? 1;
  }
  return postDomatowoAnswer(answer as { action: string });
}
