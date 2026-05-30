import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TOOL_DISCOVERY_PROMPT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../prompts/tool_discovery.md",
);

let cached: string | null = null;

export function loadToolDiscoveryPrompt(): string {
  if (cached === null) {
    cached = readFileSync(TOOL_DISCOVERY_PROMPT_PATH, "utf8");
  }
  return cached;
}

export function appendToolDiscoveryInstructions(instructions: string): string {
  const block = loadToolDiscoveryPrompt().trim();
  if (instructions.includes("Tool discovery")) {
    return instructions;
  }
  return `${instructions.trimEnd()}\n\n---\n${block}`;
}
