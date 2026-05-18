/**
 * submit_to_hub MCP tool — POST an answer to the course verification hub.
 *
 * Sends `{ task, apikey, answer }` and scans the response for a
 * `{FLG:...}` flag pattern. Returns the flag if found.
 *
 * Requires: HUB_API_KEY environment variable.
 */

import { z } from "zod";
import { fetchWithRetry } from "../../agent/ai.js";
import { HUB_VERIFY_URL, HUB_API_KEY } from "../../../config.js";
import { mcpOk, mcpErr } from "../../types/index.js";
import type { McpToolResponse } from "../../types/index.js";

const FLAG_PATTERN = /\{FLG:[^}]+\}/;

/** JSON-serializable hub answer (no z.unknown — Responses API rejects untyped properties). */
const hubAnswerLeaf = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const submitToHubInputSchema = z.object({
  task_name: z
    .string()
    .describe(
      "The task identifier used by the hub (e.g. 's02e01', 'json'). " +
        "Matches the task field in the hub request body.",
    ),
  answer: z
    .union([
      z.record(z.string(), hubAnswerLeaf),
      z.array(hubAnswerLeaf),
      hubAnswerLeaf,
    ])
    .describe(
      "Payload for the hub `answer` field. Use an object for typical tasks " +
        "(string values, numbers, booleans, or null per key).",
    ),
});
export type SubmitToHubInput = z.infer<typeof submitToHubInputSchema>;

export function extractFlag(text: string): string | null {
  const match = FLAG_PATTERN.exec(text);
  return match ? (match[0] ?? null) : null;
}

export async function executeSubmitToHub(
  args: SubmitToHubInput,
): Promise<McpToolResponse> {
  if (!HUB_API_KEY) {
    return mcpErr(
      "HUB_API_KEY is not set. Add it to tasks/.env to use submit_to_hub.",
    );
  }

  const payload = {
    task: args.task_name,
    apikey: HUB_API_KEY,
    answer: args.answer,
  };

  try {
    const response = await fetchWithRetry(HUB_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }

    const flag = extractFlag(rawText);
    const result = {
      ok: response.ok,
      status: response.status,
      data: parsed,
      ...(flag !== null ? { flag } : {}),
    };
    return mcpOk(JSON.stringify(result));
  } catch (error) {
    return mcpErr(error instanceof Error ? error.message : String(error));
  }
}
