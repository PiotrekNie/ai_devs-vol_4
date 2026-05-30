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

/**
 * Resolve planning flag: explicit `createAgent({ enablePlanningPhase })` wins,
 * then `AGENT_ENABLE_PLANNING=true|1` in the environment.
 */
export function resolveEnablePlanningPhase(explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit;
  const raw = process.env.AGENT_ENABLE_PLANNING?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

export function collectToolNames(tools: unknown[]): string[] {
  const names: string[] = [];
  for (const t of tools) {
    if (!t || typeof t !== "object") continue;
    const name = (t as { name?: unknown }).name;
    if (typeof name === "string" && name.length > 0) names.push(name);
  }
  return names;
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
    planText.trim() ||
    "Plan unavailable — proceed cautiously and revise as you learn.";
  return `${base}${WORKING_PLAN_MARKER}\n\n${body}`;
}

export function buildPlanningInstructions(
  baseInstructions: string,
  toolNames: string[] = [],
  options?: { toolDiscoveryEnabled?: boolean },
): string {
  const planning = loadPlanningTurnPrompt().trim();
  const toolsLine =
    toolNames.length > 0
      ? `\n\nAvailable tools (name them in the plan only — **do not call** in turn 0): ${toolNames.join(", ")}.`
      : "";
  const discoveryLine = options?.toolDiscoveryEnabled
    ? "\n\nTool discovery is enabled: extended tools need **activate_tools** in turn 1+ (not turn 0)."
    : "";
  const turnZero =
    "\n\n**Turn 0:** Reply with the working plan as plain text in this assistant message. No tool calls.";
  return `${stripPreviousWorkingPlan(baseInstructions)}\n\n---\n${planning}${toolsLine}${discoveryLine}${turnZero}`;
}

export async function runPlanningTurn(args: {
  ai: AIAdapter;
  conversation: unknown[];
  instructions: string;
  tools: unknown[];
  chatOptions?: ChatOptions;
  toolDiscoveryEnabled?: boolean;
}): Promise<{
  instructionsWithPlan: string;
  conversationAfterPlan: unknown[];
}> {
  const toolNames = collectToolNames(args.tools);
  const planningInstructions = buildPlanningInstructions(
    args.instructions,
    toolNames,
    { toolDiscoveryEnabled: args.toolDiscoveryEnabled },
  );

  // Turn 0 must not register tools — otherwise some models call tools despite
  // tool_choice: "none", and [PLAN] never appears as a dedicated plan turn.
  const response = await args.ai.generateResponse(
    args.conversation,
    [],
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
  logPlan(planText || "(empty plan — check model outputs reasoning-only)");

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
