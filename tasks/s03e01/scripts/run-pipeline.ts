/**
 * Direct pipeline (no ReAct) — validates scan/classify/build + optional hub submit.
 *
 * Run: `bun --env-file=../.env run scripts/run-pipeline.ts`
 * Skip hub: `SUBMIT=0 bun --env-file=../.env run scripts/run-pipeline.ts`
 */

import { HUB_VERIFY_URL, HUB_API_KEY, NOTE_CLASSIFIER_MODEL, DEFAULT_SENSORS_DIR } from "../config.js";
import { fetchWithRetry } from "@ai-devs/agent-boilerplate";
import { buildRecheckList } from "../src/domain/buildRecheck.js";
import {
  classifyNoteGroups,
  clearClassificationCache,
} from "../src/domain/classifyNotes.js";
import { scanSensorDirectory } from "../src/domain/scanSensors.js";

async function main() {
  clearClassificationCache();

  console.log("[SYSTEM] Scanning", DEFAULT_SENSORS_DIR);
  const scan = scanSensorDirectory(DEFAULT_SENSORS_DIR);
  console.log("[SYSTEM] Measurement anomalies:", scan.measurementAnomalyIds.length);
  console.log("[SYSTEM] Unique notes:", scan.uniqueNotes);

  console.log("[SYSTEM] Classifying notes with", NOTE_CLASSIFIER_MODEL);
  const classifications = await classifyNoteGroups({
    groups: scan.noteGroups,
    model: NOTE_CLASSIFIER_MODEL,
    batchSize: 25,
  });

  const sentiments = new Map(
    classifications.map((c) => [c.note, c.sentiment] as const),
  );
  const recheck = buildRecheckList({ scan, sentiments });

  console.log("[SYSTEM] Recheck count:", recheck.length);
  console.log("[SYSTEM] First IDs:", recheck.slice(0, 10).join(", "));

  if (process.env["SUBMIT"] === "0") {
    console.log("[SYSTEM] SUBMIT=0 — skipping hub");
    return;
  }

  if (!HUB_API_KEY) {
    console.error("[SYSTEM] HUB_API_KEY missing");
    process.exit(1);
  }

  const response = await fetchWithRetry(HUB_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: HUB_API_KEY,
      task: "evaluation",
      answer: { recheck },
    }),
  });
  const text = await response.text();
  console.log("[SYSTEM] Hub response:", text.slice(0, 2000));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
