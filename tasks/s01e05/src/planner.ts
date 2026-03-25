import { generateText, Output } from "ai";
import { z } from "zod";
import { getOpenRouterModel, normalizeRouteId, TARGET_ROUTE_ID } from "./config.ts";

const planStepSchema = z.object({
  action: z.string(),
  params: z.record(z.unknown()).optional(),
});

const planSchema = z.object({
  steps: z.array(planStepSchema),
});

export type RailwayPlanStep = z.infer<typeof planStepSchema>;
export type RailwayPlan = z.infer<typeof planSchema>;

function collectAllowedActions(value: unknown, out: Set<string>): void {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === "string") {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectAllowedActions(item, out);
    }
    return;
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.action === "string" && o.action.length > 0) {
      out.add(o.action);
    }
    if (Array.isArray(o.actions)) {
      for (const a of o.actions) {
        if (typeof a === "string") {
          out.add(a);
        } else if (a && typeof a === "object" && typeof (a as { name?: unknown }).name === "string") {
          out.add(String((a as { name: string }).name));
        }
      }
    }
    for (const k of Object.keys(o)) {
      collectAllowedActions(o[k], out);
    }
  }
}

export function extractAllowedActions(helpPayload: unknown): Set<string> {
  const out = new Set<string>();
  collectAllowedActions(helpPayload, out);
  return out;
}

function actionMentionedInHelp(helpText: string, action: string): boolean {
  const patterns = [
    `"${action}"`,
    `'${action}'`,
    `“${action}”`,
    `action": "${action}"`,
    `action': '${action}'`,
    ` ${action} `,
    `\`${action}\``,
  ];
  return patterns.some((p) => helpText.includes(p)) || helpText.includes(`"${action}"`);
}

function validatePlanAgainstHelp(plan: RailwayPlan, helpPayload: unknown): string | null {
  const helpText = JSON.stringify(helpPayload);
  const allowed = extractAllowedActions(helpPayload);

  for (const step of plan.steps) {
    if (allowed.size > 0 && !allowed.has(step.action)) {
      if (!actionMentionedInHelp(helpText, step.action)) {
        return `Step action "${step.action}" is not listed in help-derived actions`;
      }
    }
  }

  if (allowed.has("save")) {
    const last = plan.steps[plan.steps.length - 1];
    if (!last || last.action !== "save") {
      return 'Documentation requires a final "save" step — last step must be action "save".';
    }
  }

  return null;
}

function buildSystemPrompt(helpPayload: unknown): string {
  const helpJson = JSON.stringify(helpPayload, null, 2);
  return `You are a planner for a self-documenting Railway Hub API.

The ONLY source of truth for action names, parameters, and order of operations is the JSON below (from action "help").
Do NOT invent actions. Use exact parameter names and string values from the documentation.

Goal: activate railway route ${normalizeRouteId(TARGET_ROUTE_ID)} (exact casing as in the API).

Return a JSON object with a "steps" array. Each step has:
- "action": string (required) — must exactly match an action name from the documentation.
- "params": optional object (optional) — only include keys that the documentation specifies for that action. Omit params entirely if the action takes no extra fields beyond what is implied.

If the documentation requires a sequence ending with persistence (often action "save"), include "save" as the LAST step.

Help / API documentation:
${helpJson}`;
}

export async function buildPlanFromHelp(helpPayload: unknown): Promise<RailwayPlan> {
  const model = getOpenRouterModel();
  const maxRounds = 3;
  let lastError: string | undefined;

  for (let round = 0; round < maxRounds; round++) {
    const prompt = lastError
      ? `${buildSystemPrompt(helpPayload)}\n\nPrevious plan was rejected: ${lastError}\nFix the plan and output only valid JSON matching the schema.`
      : `${buildSystemPrompt(helpPayload)}\n\nOutput the plan only.`;

    const result = await generateText({
      model,
      output: Output.object({ schema: planSchema }),
      prompt,
      temperature: 0,
    });

    const plan = result.output;
    if (!plan.steps.length) {
      lastError = "Plan has no steps";
      continue;
    }

    const err = validatePlanAgainstHelp(plan, helpPayload);
    if (err) {
      lastError = err;
      console.warn(`[planner] validation failed (round ${round + 1}): ${err}`);
      continue;
    }

    return plan;
  }

  throw new Error(`Failed to build a valid plan after ${maxRounds} attempts: ${lastError ?? "unknown"}`);
}
