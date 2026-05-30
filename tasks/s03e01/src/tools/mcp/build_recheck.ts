import { z } from "zod";
import { mcpErr, mcpOk } from "@ai-devs/agent-boilerplate";
import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { buildRecheckList } from "../../domain/buildRecheck.js";
import { getLastScan, getSentimentsMap } from "../../evaluationState.js";

export const buildRecheckInputSchema = z.object({});

export async function executeBuildRecheck(): Promise<McpToolResponse> {
  const scan = getLastScan();
  if (!scan) {
    return mcpErr("Run scan_sensors first.");
  }

  const sentiments = getSentimentsMap();
  if (sentiments.size === 0) {
    return mcpErr("Run classify_operator_notes first.");
  }

  const recheck = buildRecheckList({ scan, sentiments });

  return mcpOk(
    JSON.stringify({
      ok: true,
      recheck_count: recheck.length,
      recheck,
      submit_example: {
        task_name: "evaluation",
        answer: { recheck },
      },
    }),
  );
}
