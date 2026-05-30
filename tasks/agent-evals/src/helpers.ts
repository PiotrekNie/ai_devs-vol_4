import { createInterface } from "node:readline/promises";
import type { RunEvaluator } from "@langfuse/client";

export const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

export type CaseInput = { id: string; message: string };

export function toCaseInput(item: unknown): CaseInput {
  if (typeof item !== "object" || item == null) {
    return { id: "unknown", message: "" };
  }
  const c = item as { id?: unknown; message?: unknown };
  return {
    id: typeof c.id === "string" ? c.id : "unknown",
    message: typeof c.message === "string" ? c.message : "",
  };
}

/** Extract tool names from Responses API conversation items. */
export function extractToolNames(messages: unknown[]): string[] {
  const names: string[] = [];
  for (const message of messages) {
    if (typeof message !== "object" || message === null) continue;
    const m = message as { type?: unknown; name?: unknown };
    if (m.type === "function_call" && typeof m.name === "string") {
      names.push(m.name);
    }
  }
  return names;
}

export function createAvgScoreEvaluator(scoreName: string): RunEvaluator {
  return async ({ itemResults }) => {
    const scores = itemResults
      .flatMap((item) => item.evaluations)
      .filter((evaluation) => evaluation.name === scoreName)
      .map((evaluation) => evaluation.value)
      .filter((value): value is number => typeof value === "number");

    if (scores.length === 0) {
      return {
        name: `avg_${scoreName}`,
        value: 0,
        comment: `No per-item ${scoreName} scores produced`,
      };
    }

    const avg = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    return {
      name: `avg_${scoreName}`,
      value: avg,
      comment: `${(avg * 100).toFixed(1)}% across ${scores.length} items`,
    };
  };
}

export async function confirmExperiment(params: {
  name: string;
  datasetCases: number;
  description: string;
}): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("");
  console.log("⚠️  Experiment will call the LLM API (costs tokens).");
  console.log(`   Name: ${params.name}`);
  console.log(`   Cases: ${params.datasetCases}`);
  console.log(`   ${params.description}`);
  console.log("");

  const answer = await rl.question("   Continue? (yes/y): ");
  rl.close();

  const normalized = answer.trim().toLowerCase();
  if (normalized !== "yes" && normalized !== "y") {
    console.log("   Aborted.");
    process.exit(0);
  }

  console.log("");
}
