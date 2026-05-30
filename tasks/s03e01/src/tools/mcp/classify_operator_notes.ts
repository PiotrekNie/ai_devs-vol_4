import { z } from "zod";
import { mcpErr, mcpOk } from "@ai-devs/agent-boilerplate";
import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { classifyNoteGroups } from "../../domain/classifyNotes.js";
import { getLastScan, setNoteSentiment } from "../../evaluationState.js";
import { NOTE_CLASSIFIER_MODEL } from "../../../config.js";

export const classifyOperatorNotesInputSchema = z.object({
  batch_size: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe("Notes per LLM batch (default 25)."),
});

export type ClassifyOperatorNotesInput = z.infer<
  typeof classifyOperatorNotesInputSchema
>;

export async function executeClassifyOperatorNotes(
  args: ClassifyOperatorNotesInput,
): Promise<McpToolResponse> {
  const scan = getLastScan();
  if (!scan) {
    return mcpErr("Run scan_sensors first.");
  }

  const classifications = await classifyNoteGroups({
    groups: scan.noteGroups,
    model: NOTE_CLASSIFIER_MODEL,
    batchSize: args.batch_size ?? 25,
  });

  const counts = { ok: 0, problem: 0, neutral: 0 };
  for (const row of classifications) {
    setNoteSentiment(row.note, row.sentiment);
    counts[row.sentiment]++;
  }

  return mcpOk(
    JSON.stringify({
      ok: true,
      classified_notes: classifications.length,
      sentiment_counts: counts,
      next_step: "Call build_recheck, then submit_to_hub.",
    }),
  );
}
