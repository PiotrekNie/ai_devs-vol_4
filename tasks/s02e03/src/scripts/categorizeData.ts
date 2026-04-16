import { z } from "zod";
import { resolveModelForProvider } from "../../../config.js";
import { chat, extractText } from "../ai.js";
import { logScript } from "../log.js";
import { minimizeMessage } from "./minimizeMessage.js";
import { parseJsonObjectFromText } from "./parseModelJson.js";

export const categorizeDataDescription = [
  "Select which log lines are worthy of inclusion in the condensed log for Centrala: label power_plant only if the line materially supports failure-outage analysis (analiza awarii)—e.g. zasilanie, chłodzenie, pompy wodne, oprogramowanie, or other power-plant subsystems that clarify the incident chain.",
  "Label non_power_plant for chatter, unrelated events, routine noise, generic IT, or lines that mention the site but do not help explain the outage.",
  "Each tool call sends one row; the model returns one label object; the tool merges labels with your rows in order.",
  "For each line, reasoning is one or two sentences—keywords, subsystem, or why the line is not attach-worthy for the failure answer.",
].join(" ");

/** Rows passed into categorization (from parseData / MCP callers). */
export const inputLogRowSchema = z.object({
  date: z.string(),
  status: z.enum(["INFO", "WARN", "CRIT"]),
  message: z.string(),
});

/** Model output: input fields plus category and reasoning. */
export const logEntrySchema = inputLogRowSchema.extend({
  category: z.enum(["power_plant", "non_power_plant"]),
  reasoning: z.string(),
  message: z.string(),
});

/** What the categorize LLM returns (no repeated message field). */
const categorizeModelRowSchema = z.object({
  category: z.enum(["power_plant", "non_power_plant"]),
  reasoning: z.string(),
});

/** Full label row after merging model output with minimized message. */
export const categorizeLabelRowSchema = categorizeModelRowSchema.extend({
  message: z.string(),
});

/** Parsed model JSON: only labels, same order and length as input rows. */
export const categorizeLabelsOutputSchema = z.object({
  data: z.array(categorizeLabelRowSchema),
});

export const categorizeOutputSchema = z.object({
  data: z.array(logEntrySchema),
});

export type CategorizedLogRow = z.infer<typeof logEntrySchema>;
export type CategorizeInputRow = z.infer<typeof inputLogRowSchema>;
export type CategorizeLabelsOutput = z.infer<
  typeof categorizeLabelsOutputSchema
>;

const categorizeInstructions = [
  "You classify one log line at a time for failure-outage analysis. power_plant means the line is worth including in the condensed failure answer: events that help explain the outage—zasilanie, chłodzenie, pompy wodne, oprogramowanie, protection, trips, cooling, control software, or other subsystems relevant to the incident chain.",
  "non_power_plant means exclude from that answer: plant-adjacent chatter, routine INFO with no analytic value, generic IT, unrelated noise, or anything that does not materially support analiza awarii even if it references the unit or site.",
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
  labels: CategorizeLabelsOutput,
): CategorizeOutput {
  if (rows.length !== labels.data.length) {
    throw new Error(
      `Categorize label count ${labels.data.length} does not match row count ${rows.length}`,
    );
  }
  return {
    data: rows.map((row, i) => {
      const label = labels.data[i]!;
      return {
        date: row.date,
        status: row.status,
        message: label.message,
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
    "gpt-4o-mini";
  return resolveModelForProvider(raw);
}

export type CategorizeOutput = z.infer<typeof categorizeOutputSchema>;

async function runCategorizeOneRow(
  row: CategorizeInputRow,
): Promise<z.infer<typeof categorizeLabelRowSchema>> {
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
  const minimize_message = await minimizeMessage(row.message);

  if (!minimize_message) {
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
    message: minimize_message,
  };
}

/** Calls the model once per row; merges order is preserved. */
export async function runCategorizePrompt(
  data: CategorizeInputRow[],
): Promise<CategorizeLabelsOutput> {
  const labels: z.infer<typeof categorizeLabelRowSchema>[] = [];
  for (const row of data) {
    const categorizeOneRow = await runCategorizeOneRow(row);
    labels.push(categorizeOneRow);
    t = performance.now();
    logScript("runCategorizePrompt", {
      ms: Math.round(performance.now() - t),
      label: categorizeOneRow,
    });
  }
  return { data: labels };
}
