/**
 * Example: validate tool-use evaluator against synthetic expectations (no LLM).
 *
 * Run: bun run example:tool-use
 */
import { resolve } from "node:path";
import type { Evaluation } from "@langfuse/client";
import {
  loadJsonFile,
  toolUseEvaluator,
  toCaseInput,
} from "../index.js";

type ToolUseCase = {
  id: string;
  message: string;
  expect: {
    shouldUseTools: boolean;
    requiredTools: string[];
    forbiddenTools?: string[];
  };
};

const DATASET = resolve(
  import.meta.dir,
  "../templates/datasets/tool-use.synthetic.json",
);

const main = async (): Promise<void> => {
  const loaded = await loadJsonFile<ToolUseCase[]>(DATASET);
  if (!loaded.ok) {
    throw new Error(loaded.error);
  }

  console.log(`Dry-run tool-use evaluator on ${loaded.value.length} cases\n`);

  for (const item of loaded.value) {
    const input = toCaseInput({ id: item.id, message: item.message });
    const rawScores = await toolUseEvaluator({
      input,
      output: { toolNames: item.expect.requiredTools },
      expectedOutput: item.expect,
    });
    const scores: Evaluation[] = Array.isArray(rawScores)
      ? rawScores
      : [rawScores];
    const overall = scores.find((s) => s.name === "tool_use_overall");
    const scorePct =
      typeof overall?.value === "number" ? overall.value * 100 : 0;
    console.log(
      `${item.id}: score=${scorePct.toFixed(0)}% (mock output uses requiredTools)`,
    );
  }

  console.log(
    "\nFor live Langfuse experiments, wire dataset.runExperiment in your task.",
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
