import { z } from "zod";
import { resolveModelForProvider } from "../../../config.js";
import { chat, extractText } from "../ai.js";
import { logScript } from "../log.js";
import { parseJsonObjectFromText } from "./parseModelJson.js";

export const categorizeDataDescription = [
  "Strict filter for Centrala condensed logs: label power_plant only for high-confidence causal lines—directly on the outage/root-cause path (trip/protection/interlock sequence, concrete loss of cooling/power/software control with a plant effect, named subsystem or component IDs tied to the incident).",
  "Label non_power_plant for routine/heartbeat noise, generic IT, site name only, duplicate status without a new fact, peripheral monitoring that does not change the failure story, or WARN/CRIT without a clear plant mechanism. Severity alone is never enough.",
  "When uncertain, choose non_power_plant (sparse inclusion).",
  "Each tool call sends one row; the model returns one label object; the tool merges labels with your rows in order.",
  "For each line, reasoning is one or two sentences—subsystem or why the line fails the causal-path test.",
].join(" ");

/** Rows passed into categorization (from parseData / MCP callers). */
export const inputLogRowSchema = z.object({
  date: z.string(),
  status: z.enum(["INFO", "WARN", "CRIT"]),
  message: z.string(),
});

/** What the categorize LLM returns (no repeated message field). */
const categorizeModelRowSchema = z.object({
  category: z.enum(["power_plant", "non_power_plant"]),
  reasoning: z.string(),
});

export const categorizeOutputSchema = z.object({
  data: z.array(categorizeModelRowSchema),
});

export const categorizedLogRowSchema = inputLogRowSchema.extend({
  category: z.enum(["power_plant", "non_power_plant"]),
  reasoning: z.string(),
});

export type CategorizedLogRow = z.infer<typeof categorizedLogRowSchema>;
export type CategorizeInputRow = z.infer<typeof inputLogRowSchema>;
export type CategorizeOutput = z.infer<typeof categorizeOutputSchema>;
/** Full rows after merging LLM labels (date/status/message + category/reasoning). */
export type CategorizedRowsOutput = { data: CategorizedLogRow[] };

const categorizeInstructions = [
  "You classify one log line at a time for failure-outage analysis (analiza awarii). Be strict: the condensed log must stay small and high-signal.",
  "power_plant: label ONLY if this line clearly belongs on the causal path of the outage—e.g. trip/protection/interlock sequence, SCRAM/trip initiation, concrete loss or impairment of zasilanie, chłodzenie, pompy wodne, sterowanie/oprogramowanie, or another plant mechanism with a stated effect; OR an explicit subsystem/component tag that directly advances root-cause reasoning. Ask: would removing this line change the failure narrative? If no → non_power_plant.",
  "non_power_plant: routine or heartbeat OK, repeated status without new information, generic IT, chatter, unrelated events, peripheral monitoring that does not alter the incident story, mere mention of the site/unit, or plant-adjacent lines that do not state a mechanism tied to the failure chain.",
  "Do not choose power_plant only because status is WARN or CRIT; severity alone is never sufficient.",
  "When uncertain or the line is borderline, choose non_power_plant (default to exclusion).",
  "Return ONLY category and reasoning—do not repeat date, status, or message.",
  "Return ONLY a single JSON object (no markdown fences, no commentary) with exactly this shape:",
  '{"data":[{"category":"power_plant"|"non_power_plant","reasoning":"string"}]}',
  "The data array must contain exactly one object (one label for the single input line).",
].join("\n");

let t = performance.now();
/** One LLM response: exactly one label (paired with one input row). */
const categorizeSingleLabelsOutputSchema = z.object({
  data: z.tuple([categorizeModelRowSchema]),
});

export function mergeCategorizeLabels(
  rows: CategorizeInputRow[],
  labels: CategorizeOutput,
): CategorizedRowsOutput {
  if (rows.length !== labels.data.length) {
    throw new Error(
      `Categorize label count ${labels.data.length} does not match row count ${rows.length}`,
    );
  }
  return {
    data: rows.map((row, i) => {
      const label = labels.data[i]!;
      return {
        ...row,
        category: label.category,
        reasoning: label.reasoning,
      };
    }),
  };
}

function categorizeModel(): string {
  const raw =
    process.env.S02E03_CATEGORIZE_MODEL?.trim() ??
    process.env.OPENAI_MODEL?.trim() ??
    "gpt-4o";
  return resolveModelForProvider(raw);
}

async function runCategorizeOneRow(
  row: CategorizeInputRow,
): Promise<z.infer<typeof categorizeModelRowSchema>> {
  const response = await chat({
    model: categorizeModel(),
    instructions: categorizeInstructions,
    input: [
      {
        role: "user",
        content: [
          "Categorize this single log entry. Input JSON:",
          JSON.stringify({ data: [row] }),
        ].join("\n"),
      },
    ],
  });
  const text = extractText(response);
  if (!text) {
    throw new Error("Empty model response");
  }
  const parsed = parseJsonObjectFromText(text);
  const out = categorizeSingleLabelsOutputSchema.safeParse(parsed);

  if (!out.success) {
    throw new Error(
      `Invalid JSON from model: ${out.error.message}. Raw: ${text.slice(0, 2000)}`,
    );
  }

  return {
    ...out.data.data[0],
  };
}

/** Calls the model once per row; merges order is preserved. */
export async function runCategorizePrompt(
  data: CategorizeInputRow[],
): Promise<CategorizeOutput> {
  const categories: z.infer<typeof categorizeModelRowSchema>[] = [];
  for (const row of data) {
    const categorizeOneRow = await runCategorizeOneRow(row);
    categories.push(categorizeOneRow);
    t = performance.now();
    logScript("runCategorizePrompt", {
      ms: Math.round(performance.now() - t),
      category: categorizeOneRow,
    });
  }
  return { data: categories };
}
