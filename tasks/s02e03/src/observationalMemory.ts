/**
 * Observational Memory — Observer + Reflector (S02E03 / Mastra OM pattern).
 * External journal file; sealed conversation items removed from active input;
 * journal injected into instructions.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { chat, extractText, type ChatParams } from "./ai.js";
import { logScript } from "./log.js";

/** Cheap token estimate (~4 chars per token for English-ish text). */
export function estimateTokens(s: string): number {
  return Math.max(1, Math.ceil(s.length / 4));
}

export async function readJournalFile(journalPath: string): Promise<string> {
  try {
    return (await readFile(journalPath, "utf8")).trimEnd();
  } catch {
    return "";
  }
}

export async function writeJournalFile(
  journalPath: string,
  content: string,
): Promise<void> {
  await mkdir(dirname(journalPath), { recursive: true });
  await writeFile(journalPath, content, "utf8");
}

const observerInstructions = [
  "You are the Observer for an agent run.",
  "Summarize the sealed conversation fragment into NEW journal lines only (do not repeat the existing journal).",
  "Rules:",
  "- One short fact per line; plain text.",
  "- Preserve: tool names, file paths, verify/hub outcomes, errors, subsystem ids, dates if present.",
  "- Omit verbose JSON; name what happened.",
  "Output ONLY the new lines to append (no headings, no markdown fences).",
].join("\n");

const reflectorInstructions = [
  "You compress an observational journal while preserving every distinct fact.",
  "Rules:",
  "- Merge duplicate lines; keep dates, ids, verify state, open issues.",
  "- Shorter phrasing; same meaning.",
  "Output ONLY the full compressed journal text (no markdown fences).",
].join("\n");

async function runObserverPass(args: {
  journal: string;
  fragmentJson: string;
  model: string;
  reasoning?: ChatParams["reasoning"];
  maxOutputTokens?: number;
}): Promise<string> {
  const text = await chat({
    model: args.model,
    instructions: observerInstructions,
    reasoning: args.reasoning,
    maxOutputTokens: args.maxOutputTokens,
    input: [
      {
        role: "user",
        content: [
          "Existing journal (may be empty):",
          args.journal || "(empty)",
          "---",
          "Sealed fragment (JSON array of Responses input items):",
          args.fragmentJson.slice(0, 500_000),
        ].join("\n"),
      },
    ],
  });
  const out = extractText(text)?.trim() ?? "";
  if (!out) {
    throw new Error("Observer returned empty text");
  }
  return out;
}

async function runReflectorPass(args: {
  journal: string;
  model: string;
  reasoning?: ChatParams["reasoning"];
  maxOutputTokens?: number;
}): Promise<string> {
  const text = await chat({
    model: args.model,
    instructions: reflectorInstructions,
    reasoning: args.reasoning,
    maxOutputTokens: args.maxOutputTokens,
    input: [
      {
        role: "user",
        content: [
          "Journal to compress (may be long):",
          args.journal.slice(0, 800_000),
        ].join("\n"),
      },
    ],
  });
  const out = extractText(text)?.trim() ?? "";
  if (!out) {
    throw new Error("Reflector returned empty text");
  }
  return out;
}

export type ObservationalMemoryOptions = {
  journalPath: string;
  /** Model for Observer/Reflector (set via S02E03_OM_MODEL or pass gpt-4o-mini). */
  omModel: string;
  reasoning?: ChatParams["reasoning"];
  /** Observer/Reflector completion cap (default S02E03_OM_MAX_OUTPUT_TOKENS or 4096). */
  maxOutputTokensOm?: number;
};

/**
 * Reflector when journal is huge; Observer in a loop when conversation exceeds threshold.
 * Returns trimmed conversation and instructions including journal block.
 */
export async function prepareObservationalMemory(args: {
  conversation: unknown[];
  baseInstructions: string;
  om: ObservationalMemoryOptions;
}): Promise<{ conversation: unknown[]; instructions: string }> {
  const { journalPath, omModel, reasoning } = args.om;
  const maxOutputTokensOm =
    args.om.maxOutputTokensOm ??
    Math.max(256, Number(process.env.S02E03_OM_MAX_OUTPUT_TOKENS ?? 4096));
  const reflectorTh = Math.max(
    1000,
    Number(process.env.S02E03_REFLECTOR_THRESHOLD_TOKENS ?? 60_000),
  );
  const observerTh = Math.max(
    1000,
    Number(process.env.S02E03_OBSERVER_THRESHOLD_TOKENS ?? 30_000),
  );
  const minTail = Math.max(
    2,
    Number(process.env.S02E03_OM_MIN_TAIL_ITEMS ?? 6),
  );

  let journal = await readJournalFile(journalPath);

  if (estimateTokens(journal) >= reflectorTh) {
    logScript("observational memory — Reflector (journal over threshold)", {
      journalChars: journal.length,
      estimatedTokens: estimateTokens(journal),
      threshold: reflectorTh,
    });
    journal = await runReflectorPass({
      journal,
      model: omModel,
      reasoning,
      maxOutputTokens: maxOutputTokensOm,
    });
    await writeJournalFile(journalPath, journal);
  }

  let conversation = [...args.conversation];

  const convTokens = () => estimateTokens(JSON.stringify(conversation));

  const sealPrefix = async (keepTail: number) => {
    if (conversation.length <= keepTail) {
      return;
    }
    const toSeal = conversation.slice(0, -keepTail);
    const fragmentJson = JSON.stringify(toSeal);
    logScript("observational memory — Observer (conversation over threshold)", {
      sealedItems: toSeal.length,
      tailKept: keepTail,
      estimatedTokensBefore: convTokens(),
      threshold: observerTh,
    });
    const addition = await runObserverPass({
      journal,
      fragmentJson,
      model: omModel,
      reasoning,
      maxOutputTokens: maxOutputTokensOm,
    });
    journal = journal ? `${journal}\n${addition}` : addition;
    await writeJournalFile(journalPath, journal);
    conversation = conversation.slice(-keepTail);
  };

  while (convTokens() >= observerTh && conversation.length > minTail) {
    await sealPrefix(minTail);
  }

  while (convTokens() >= observerTh && conversation.length > 1) {
    await sealPrefix(1);
  }

  const journalBlock = journal.trim()
    ? `\n\n### Observational memory (sealed prior turns)\n${journal.trim()}`
    : "";

  return {
    conversation,
    instructions: `${args.baseInstructions}${journalBlock}`,
  };
}
