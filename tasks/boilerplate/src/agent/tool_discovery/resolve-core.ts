import {
  DEFAULT_CORE_TOOL_NAMES,
  META_TOOL_NAMES,
  type ToolCatalog,
} from "./types.js";
import { logSystem } from "../../utils/logger.js";

const metaSet = new Set<string>(META_TOOL_NAMES);

/**
 * Resolves core tool names: defaults, then options override, then validates against catalog.
 * Missing names are logged and skipped (no throw).
 */
export function resolveCoreToolNames(
  catalog: ToolCatalog,
  coreToolNames?: string[],
): string[] {
  const requested = coreToolNames ?? [...DEFAULT_CORE_TOOL_NAMES];
  const resolved: string[] = [];

  for (const name of requested) {
    if (metaSet.has(name)) {
      logSystem("tool discovery: core tool name ignored — reserved meta tool", {
        name,
      });
      continue;
    }
    if (!catalog.has(name)) {
      logSystem("tool discovery: core tool not in catalog — skipped", { name });
      continue;
    }
    if (!resolved.includes(name)) {
      resolved.push(name);
    }
  }

  return resolved;
}
