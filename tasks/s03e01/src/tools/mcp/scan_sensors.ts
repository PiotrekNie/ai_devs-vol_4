import { z } from "zod";
import { mcpOk } from "@ai-devs/agent-boilerplate";
import type { McpToolResponse } from "@ai-devs/agent-boilerplate";
import { scanSensorDirectory } from "../../domain/scanSensors.js";
import { setLastScan } from "../../evaluationState.js";
import { DEFAULT_SENSORS_DIR } from "../../../config.js";

export const scanSensorsInputSchema = z.object({
  sensors_dir: z
    .string()
    .optional()
    .describe(
      "Directory with sensor JSON files. Defaults to ./sensors in episode cwd.",
    ),
});

export type ScanSensorsInput = z.infer<typeof scanSensorsInputSchema>;

export async function executeScanSensors(
  args: ScanSensorsInput,
): Promise<McpToolResponse> {
  const sensorsDir = args.sensors_dir?.trim() || DEFAULT_SENSORS_DIR;
  const scan = scanSensorDirectory(sensorsDir);
  setLastScan(scan);

  const summary = {
    ok: true,
    sensors_dir: sensorsDir,
    total_files: scan.totalFiles,
    measurement_anomaly_count: scan.measurementAnomalyIds.length,
    unique_operator_notes: scan.uniqueNotes,
    note_groups_by_profile: {
      all_ok: scan.noteGroups.filter((g) => g.profile === "all_ok").length,
      all_bad: scan.noteGroups.filter((g) => g.profile === "all_bad").length,
      mixed: scan.noteGroups.filter((g) => g.profile === "mixed").length,
    },
    next_step:
      "Call classify_operator_notes, then build_recheck, then submit_to_hub with task_name evaluation.",
  };

  return mcpOk(JSON.stringify(summary));
}
