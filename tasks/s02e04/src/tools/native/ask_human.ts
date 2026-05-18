/**
 * ask_human — native tool that pauses the agent and waits for stdin input.
 *
 * The agent loop blocks until the human types a response. Use for tasks
 * that need clarification before the agent can continue.
 */

import * as readline from "node:readline";
import { z } from "zod";

export const askHumanInputSchema = z.object({
  question: z
    .string()
    .describe("The question to ask the human. Shown on stdout before reading input."),
});
export type AskHumanInput = z.infer<typeof askHumanInputSchema>;

/** Prompts the user on stdout and reads one line from stdin. */
export async function readLineFromStdin(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  return new Promise<string>((resolve) => {
    rl.question(`\n[ASK HUMAN] ${question}\nYour answer: `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export const askHumanTool = {
  name: "ask_human" as const,
  description:
    "Pause the agent and ask the human operator a question. " +
    "The answer is returned as a string for the agent to continue with. " +
    "Use only when genuinely blocked — prefer tool-based research first.",
  inputSchema: askHumanInputSchema,
  execute: async ({ question }: AskHumanInput): Promise<{ answer: string }> => {
    const answer = await readLineFromStdin(question);
    return { answer };
  },
} as const;

/** OpenAI function-calling definition for ask_human (strict mode). */
export const askHumanToolDefinition = {
  type: "function" as const,
  name: askHumanTool.name,
  description: askHumanTool.description,
  parameters: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: askHumanInputSchema.shape.question.description,
      },
    },
    required: ["question"],
    additionalProperties: false,
  },
  strict: true,
};
