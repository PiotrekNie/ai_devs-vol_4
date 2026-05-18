/**
 * finish_task — native tool that terminates the agent loop.
 *
 * When the model calls this tool, the agent loop catches the FinishTaskSignal
 * and returns finalAnswer as the overall result.
 */

import { z } from "zod";

export const finishTaskInputSchema = z.object({
  final_answer: z
    .string()
    .describe(
      "The final answer or result to return from the agent. " +
        "May be plain text or a JSON string.",
    ),
});
export type FinishTaskInput = z.infer<typeof finishTaskInputSchema>;

/**
 * Thrown by the finish_task execute function to signal the agent loop to stop.
 * Caught in agent.ts — not propagated to callers of processQuery.
 */
export class FinishTaskSignal extends Error {
  constructor(public readonly finalAnswer: string) {
    super(`finish_task: ${finalAnswer}`);
    this.name = "FinishTaskSignal";
  }
}

export const finishTaskTool = {
  name: "finish_task" as const,
  description:
    "End the agent's work and return the final answer. " +
    "For mailbox: call only after submit_to_hub returned a {FLG:...} flag in the tool result. " +
    "Do not call after hub errors (-960, -970) without another successful submit. " +
    "Do not call any other tools after this.",
  inputSchema: finishTaskInputSchema,
  /** Throws FinishTaskSignal — caught by createAgent, not the caller. */
  execute: async ({ final_answer }: FinishTaskInput): Promise<never> => {
    throw new FinishTaskSignal(final_answer);
  },
} as const;

/** OpenAI function-calling definition for finish_task (strict mode). */
export const finishTaskToolDefinition = {
  type: "function" as const,
  name: finishTaskTool.name,
  description: finishTaskTool.description,
  parameters: {
    type: "object",
    properties: {
      final_answer: {
        type: "string",
        description: finishTaskInputSchema.shape.final_answer.description,
      },
    },
    required: ["final_answer"],
    additionalProperties: false,
  },
  strict: true,
};
