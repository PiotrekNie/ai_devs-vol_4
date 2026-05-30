import { chat, logSystem } from "@ai-devs/agent-boilerplate";
import type { NoteGroup } from "./scanSensors.js";

export type NoteSentiment = "ok" | "problem" | "neutral";

export type NoteClassification = {
  note: string;
  sentiment: NoteSentiment;
  source: "cache" | "llm";
};

const classificationCache = new Map<string, NoteSentiment>();
const llmClassifiedNotes = new Set<string>();

export function getCachedClassification(note: string): NoteSentiment | undefined {
  return classificationCache.get(note);
}

export function setCachedClassification(
  note: string,
  sentiment: NoteSentiment,
): void {
  classificationCache.set(note, sentiment);
}

export function clearClassificationCache(): void {
  classificationCache.clear();
  llmClassifiedNotes.clear();
}

function parseBatchResponse(
  text: string,
  batch: Array<{ index: number; note: string }>,
): Map<number, NoteSentiment> {
  const out = new Map<number, NoteSentiment>();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return out;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      index?: number;
      sentiment?: string;
    }>;
    for (const row of parsed) {
      if (typeof row.index !== "number") continue;
      const s = row.sentiment;
      if (s === "ok" || s === "problem" || s === "neutral") {
        out.set(row.index, s);
      }
    }
  } catch {
    return out;
  }

  if (out.size === 0 && batch.length === 1) {
    const lower = text.toLowerCase();
    if (/\bproblem\b/.test(lower)) out.set(batch[0]!.index, "problem");
    else if (/\bok\b/.test(lower)) out.set(batch[0]!.index, "ok");
  }

  return out;
}

const CLASSIFIER_INSTRUCTIONS = `You classify operator_notes from industrial sensor logs.

For each note decide operator sentiment about the readings:
- "ok" — operator says readings are normal/stable/healthy/no issues/no corrective action
- "problem" — operator reports errors, anomalies, faults, investigation, corrective action, alarms, suspicious/abnormal/out-of-range readings
- "neutral" — neither clearly ok nor clearly problem

Reply ONLY with a JSON array: [{"index":0,"sentiment":"ok"}, ...]`;

async function classifyNoteBatch(args: {
  batch: Array<{ index: number; note: string }>;
  model: string;
}): Promise<Map<number, NoteSentiment>> {
  const payload = args.batch.map((b) => ({
    index: b.index,
    note: b.note.slice(0, 500),
  }));

  const response = await chat({
    model: args.model,
    instructions: CLASSIFIER_INSTRUCTIONS,
    input: [{ role: "user", content: JSON.stringify(payload) }],
    maxOutputTokens: 1024,
    temperature: 0,
  });

  return parseBatchResponse(response.content ?? "", args.batch);
}

async function classifyNoteBatchWithRetry(args: {
  batch: Array<{ index: number; note: string }>;
  model: string;
}): Promise<Map<number, NoteSentiment>> {
  let sentiments = await classifyNoteBatch(args);

  if (sentiments.size < args.batch.length) {
    logSystem(
      `classify batch parse incomplete: ${sentiments.size}/${args.batch.length}, retrying once`,
    );
    sentiments = await classifyNoteBatch(args);
    if (sentiments.size < args.batch.length) {
      logSystem(
        `classify batch still incomplete: ${sentiments.size}/${args.batch.length} (missing → neutral)`,
      );
    }
  }

  return sentiments;
}

export async function classifyNoteGroups(args: {
  groups: NoteGroup[];
  model: string;
  batchSize?: number;
}): Promise<NoteClassification[]> {
  const batchSize = args.batchSize ?? 25;
  const pending: Array<{ note: string; group: NoteGroup }> = [];

  for (const group of args.groups) {
    const cached = getCachedClassification(group.note);
    if (cached) continue;
    pending.push({ note: group.note, group });
  }

  for (let i = 0; i < pending.length; i += batchSize) {
    const slice = pending.slice(i, i + batchSize);
    const batch = slice.map((p, idx) => ({ index: idx, note: p.note }));
    const sentiments = await classifyNoteBatchWithRetry({
      batch,
      model: args.model,
    });

    for (let j = 0; j < slice.length; j++) {
      const note = slice[j]!.note;
      const sentiment = sentiments.get(j) ?? "neutral";
      setCachedClassification(note, sentiment);
      llmClassifiedNotes.add(note);
    }
  }

  return args.groups.map((group) => {
    const cached = getCachedClassification(group.note) ?? "neutral";
    return {
      note: group.note,
      sentiment: cached,
      source: llmClassifiedNotes.has(group.note) ? "llm" : "cache",
    };
  });
}
