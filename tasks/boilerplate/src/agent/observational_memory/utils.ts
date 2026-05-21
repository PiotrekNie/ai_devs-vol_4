import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const promptsDir = join(moduleDir, "../../prompts");

export const OBSERVATION_APPENDIX_MARKER =
  "The following observations are your memory of past conversations with this user.";

export const CONTINUATION_HINT = [
  "<system-reminder>",
  "Conversation history was compressed into memory observations.",
  "Continue naturally. Do not mention memory mechanics.",
  "</system-reminder>",
].join("\n");

export const REFLECTOR_COMPRESSION_LEVELS = [
  "",
  "Condense older observations more aggressively. Preserve detail for recent ones only.",
  "Heavily condense. Remove redundancy, keep only durable facts, active commitments, and blockers.",
] as const;

export function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function extractTag(text: string, tag: string): string | undefined {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() || undefined;
}

export function loadObserverPrompt(): string {
  return readFileSync(join(promptsDir, "observer.md"), "utf8").trim();
}

export function loadReflectorPrompt(): string {
  return readFileSync(join(promptsDir, "reflector.md"), "utf8").trim();
}

export function buildObserverUserPrompt(
  previousObservations: string,
  messageHistory: string,
): string {
  return [
    "## Previous Observations",
    "",
    previousObservations || "[none]",
    "",
    "---",
    "",
    "Do not repeat these existing observations. Only extract new ones.",
    "",
    "## New Message History",
    "",
    messageHistory || "[none]",
    "",
    "---",
    "",
    "Extract new observations. Return only XML with <observations>, <current-task>, <suggested-response>.",
  ].join("\n");
}

export function buildReflectorUserPrompt(
  observations: string,
  guidance: string,
): string {
  return [
    "Compress and reorganize the observation memory below.",
    guidance ? `Additional guidance: ${guidance}` : "",
    "",
    "<observations>",
    observations,
    "</observations>",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildObservationAppendix(observations: string): string {
  return [
    OBSERVATION_APPENDIX_MARKER,
    "",
    "<observations>",
    observations,
    "</observations>",
    "",
    "IMPORTANT: Reference specific details from these observations when relevant.",
    "When observations conflict, prefer the most recent one.",
  ].join("\n");
}

export function stripObservationAppendix(instructions: string): string {
  const idx = instructions.indexOf(OBSERVATION_APPENDIX_MARKER);
  if (idx === -1) return instructions;
  return instructions.slice(0, idx).trimEnd();
}

export function injectObservations(
  baseInstructions: string,
  observations: string,
): string {
  const base = stripObservationAppendix(baseInstructions);
  if (!observations.trim()) return base;
  return `${base}\n\n${buildObservationAppendix(observations.trim())}`;
}
