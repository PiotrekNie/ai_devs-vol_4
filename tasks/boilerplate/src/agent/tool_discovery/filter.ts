import { getToolNameFromDefinition } from "./catalog.js";

/**
 * Returns tool definitions whose names are in `activeNames`, preserving input order.
 */
export function filterToolsForApi(
  allTools: unknown[],
  activeNames: ReadonlySet<string>,
): unknown[] {
  const out: unknown[] = [];
  for (const tool of allTools) {
    const name = getToolNameFromDefinition(tool);
    if (name && activeNames.has(name)) {
      out.push(tool);
    }
  }
  return out;
}
