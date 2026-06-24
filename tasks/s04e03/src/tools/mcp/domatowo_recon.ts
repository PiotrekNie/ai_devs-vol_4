import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { postDomatowoAnswer } from "../../hub/domatowoClient.js";
import {
  domatowoReconInputSchema,
  type DomatowoReconInput,
} from "./schemas.js";

export { domatowoReconInputSchema };

export async function executeDomatowoRecon(
  args: DomatowoReconInput,
): Promise<McpToolResponse> {
  const answer: Record<string, unknown> = { action: args.action };
  if (args.symbols !== undefined) {
    answer.symbols = args.symbols;
  }
  if (args.symbol !== undefined) {
    answer.symbol = args.symbol;
  }
  return postDomatowoAnswer(answer as { action: string });
}
