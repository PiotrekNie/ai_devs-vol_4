import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import {
  CATEGORIZE_MAX_PROMPT_TOKENS,
  CATEGORIZE_REPAIR_MAX_CHARS,
  CATEGORIZE_REPAIR_MODEL,
  getOpenRouterApiKeyForRepair,
  openRouterHeaders,
} from "./config.ts";
import type { CategorizeRow } from "./csv.ts";
import { countTokens } from "./tokenCount.ts";

export interface RepairSharedPrefixOpts {
  rows: CategorizeRow[];
  previousPrefix: string;
  hubFeedback: string;
  rowContext: CategorizeRow;
}

/**
 * Minimal telegraphic rules (English). NEU lines must come before DNG so the tiny hub LM applies them first.
 * Never imply DNG for uranium/radioactivity alone — reactor fuel cassettes must stay NEU per task brief.
 */
export function getTelegraphicBasePrefix(): string {
  return [
    "Reply exactly DNG or NEU nothing else.",
    "NEU first: reactor nuclear fuel cassette assembly Zarnowiec lead-lined transport reactor supply chain.",
    "NEU if description matches any NEU line even if words like radioactive lead uranium appear.",
    "DNG only for hazardous non-reactor goods not covered by NEU lines.",
  ].join(" ");
}

/**
 * Shared cached prefix for all rows: compact rules. Variable id/description go in `truncateForRow`.
 */
export function buildSharedPrefix(_rows: CategorizeRow[]): string {
  return getTelegraphicBasePrefix();
}

/**
 * Full prompt for one hub call: static rules first (cache-friendly), row data last.
 */
export function truncateForRow(prefix: string, row: CategorizeRow): string {
  const id = row.id.trim();
  const desc = row.description.trim();
  return `${prefix.trim()}\nID:${id} ${desc}`;
}

function maxPromptTokensForPrefix(prefix: string, rows: CategorizeRow[]): number {
  let m = 0;
  for (const row of rows) {
    m = Math.max(m, countTokens(truncateForRow(prefix, row)));
  }
  return m;
}

/**
 * Shorten prefix by dropping trailing words until every row fits `CATEGORIZE_MAX_PROMPT_TOKENS`,
 * then fall back to the minimal base prefix if needed.
 */
export function shortenPrefixUntilAllFit(
  prefix: string,
  rows: CategorizeRow[],
): string {
  const base = getTelegraphicBasePrefix();
  const words = prefix.trim().split(/\s+/).filter(Boolean);
  while (words.length > 0) {
    const candidate = words.join(" ");
    if (maxPromptTokensForPrefix(candidate, rows) <= CATEGORIZE_MAX_PROMPT_TOKENS) {
      return candidate;
    }
    words.pop();
  }
  if (maxPromptTokensForPrefix(base, rows) <= CATEGORIZE_MAX_PROMPT_TOKENS) {
    return base;
  }
  // Pathological: even base + longest row exceeds limit — trim base by characters
  let p = base;
  while (
    p.length > 20
    && maxPromptTokensForPrefix(p, rows) > CATEGORIZE_MAX_PROMPT_TOKENS
  ) {
    p = p.slice(0, -1).trimEnd();
  }
  return p;
}

function stripMarkdownFences(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:[a-z]*\n)?([\s\S]*?)```$/im);
  return (m?.[1] ?? t).trim();
}

function getRepairLanguageModel() {
  const apiKey = getOpenRouterApiKeyForRepair();
  const openrouter = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    headers: openRouterHeaders(),
  });
  // Use `.chat` so requests go to `/chat/completions`. The default `openrouter(id)` uses
  // OpenAI Responses API (`/responses`), which OpenRouter does not treat the same for third-party models.
  return openrouter.chat(CATEGORIZE_REPAIR_MODEL);
}

/**
 * Option A: single OpenRouter call to rewrite telegraphic rules from hub feedback,
 * then enforce token budget via `shortenPrefixUntilAllFit`.
 */
export async function repairSharedPrefix(
  opts: RepairSharedPrefixOpts,
): Promise<string> {
  const { rows, previousPrefix, hubFeedback, rowContext } = opts;
  const prevSnippet = previousPrefix.slice(0, Math.min(previousPrefix.length, 3500));
  const descSnippet = rowContext.description.slice(0, 500);

  const system = [
    "You rewrite classifier RULES (not answers) for a very small LM with a ~100 token prompt budget.",
    "Telegraphic English only: short lines, no markdown, no bullets, no preamble.",
    "HARD CONSTRAINTS — breaking any of these loses the task:",
    "1) Put NEU rules BEFORE any DNG rules so the small model reads NEU first.",
    "2) Reactor/nuclear fuel cassette / fresh or spent fuel / reactor assembly / Zarnowiec / lead-lined nuclear transport / reactor supply MUST be NEU. Never classify those as DNG.",
    "3) Do NOT add DNG rules that list uranium plutonium radioactive waste or generic radioactivity — that wrongly marks fuel cassettes as DNG. DNG only for clearly non-reactor hazards (e.g. acid battery toxic chemical) when not in the NEU lines.",
    "4) Rules must force the classifier to reply with exactly one word DNG or NEU (no explanation).",
    "5) Use hub feedback only to tune wording; never drop the NEU-first reactor exception.",
    "Output one continuous block of rules text.",
  ].join(" ");

  const user = [
    "Hub feedback:",
    hubFeedback,
    "",
    `Problem row id=${rowContext.id}`,
    `Description: ${descSnippet}`,
    "",
    "Previous rules (rewrite fully if needed; keep NEU-before-DNG and reactor fuel always NEU):",
    prevSnippet,
  ].join("\n");

  const { text } = await generateText({
    model: getRepairLanguageModel(),
    system,
    prompt: user,
    maxOutputTokens: 2048,
  });

  let next = stripMarkdownFences(text).slice(0, CATEGORIZE_REPAIR_MAX_CHARS).trim();
  if (!next) {
    next = getTelegraphicBasePrefix();
  }
  return shortenPrefixUntilAllFit(next, rows);
}
