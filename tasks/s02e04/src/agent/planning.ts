/**
 * Turn-0 planning phase — working plan injected into instructions.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AIAdapter, ChatOptions } from "./ai.js";
import { PLANNING_MAX_OUTPUT_TOKENS } from "../../config.js";
import { logPlan, logSystem } from "../utils/logger.js";

export const WORKING_PLAN_MARKER = "\n\n---\n## Working plan";

const PLANNING_PROMPT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../prompts/planning_turn.md",
);

let cachedPlanningPrompt: string | null = null;

export function loadPlanningTurnPrompt(): string {
  if (cachedPlanningPrompt === null) {
    cachedPlanningPrompt = readFileSync(PLANNING_PROMPT_PATH, "utf8");
  }
  return cachedPlanningPrompt;
}

export function stripPreviousWorkingPlan(instructions: string): string {
  const i = instructions.indexOf(WORKING_PLAN_MARKER);
  if (i === -1) return instructions;
  return instructions.slice(0, i).trimEnd();
}

export function injectWorkingPlan(
  instructions: string,
  planText: string,
): string {
  const base = stripPreviousWorkingPlan(instructions);
  const body =
    planText.trim() || "Plan unavailable — proceed cautiously and revise as you learn.";
  return `${base}${WORKING_PLAN_MARKER}\n\n${body}`;
}

export function buildPlanningInstructions(baseInstructions: string): string {
  const planning = loadPlanningTurnPrompt().trim();
  return `${stripPreviousWorkingPlan(baseInstructions)}\n\n---\n${planning}`;
}

export async function runPlanningTurn(args: {
  ai: AIAdapter;
  conversation: unknown[];
  instructions: string;
  tools: unknown[];
  chatOptions?: ChatOptions;
}): Promise<{
  instructionsWithPlan: string;
  conversationAfterPlan: unknown[];
}> {
  const planningInstructions = buildPlanningInstructions(args.instructions);

  const response = await args.ai.generateResponse(
    args.conversation,
    args.tools,
    planningInstructions,
    {
      ...args.chatOptions,
      toolChoice: "none",
      maxOutputTokens:
        args.chatOptions?.maxOutputTokens ?? PLANNING_MAX_OUTPUT_TOKENS,
    },
  );

  if (response.toolCalls.length > 0) {
    logSystem("Planning turn returned tool calls; ignoring", {
      count: response.toolCalls.length,
    });
  }

  const planText = response.content?.trim() ?? "";
  logPlan(planText || "(empty plan)");

  const instructionsWithPlan = injectWorkingPlan(args.instructions, planText);

  let conversationAfterPlan = [...args.conversation];
  if (response.rawOutputItems.length > 0) {
    conversationAfterPlan = [
      ...conversationAfterPlan,
      ...response.rawOutputItems,
    ];
  } else if (planText) {
    conversationAfterPlan = [
      ...conversationAfterPlan,
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: planText }],
      },
    ];
  }

  return { instructionsWithPlan, conversationAfterPlan };
}
