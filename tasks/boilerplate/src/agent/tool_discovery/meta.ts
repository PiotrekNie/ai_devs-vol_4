import { listToolsToolDefinition } from "../../tools/native/list_tools.js";
import { describeToolToolDefinition } from "../../tools/native/describe_tool.js";
import { activateToolsToolDefinition } from "../../tools/native/activate_tools.js";
import { META_TOOL_NAMES, type ToolCatalog, type ToolDiscoveryState } from "./types.js";
import { logSystem } from "../../utils/logger.js";

export const META_TOOL_DEFINITIONS = [
  listToolsToolDefinition,
  describeToolToolDefinition,
  activateToolsToolDefinition,
] as const;

export type MetaToolHandler = {
  label: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

export function createMetaToolHandlers(
  catalog: ToolCatalog,
  state: ToolDiscoveryState,
): Record<string, MetaToolHandler> {
  const NATIVE_LABEL = "[NATIVE]";

  return {
    list_tools: {
      label: NATIVE_LABEL,
      execute: async () => {
        const items = [...catalog.entries()].map(([name, entry]) => ({
          name,
          description: entry.description,
          active: state.isActive(name),
        }));
        items.sort((a, b) => a.name.localeCompare(b.name));
        return { tools: items, count: items.length };
      },
    },
    describe_tool: {
      label: NATIVE_LABEL,
      execute: async (args) => {
        const name = args["name"];
        if (typeof name !== "string" || !name.trim()) {
          return { error: "name must be a non-empty string" };
        }
        const entry = catalog.get(name);
        if (!entry) {
          return {
            error: `Unknown tool: ${name}`,
            hint: "Call list_tools for available names.",
          };
        }
        return {
          name: entry.name,
          description: entry.description,
          parameters: entry.parameters,
          alreadyActive: state.isActive(name),
        };
      },
    },
    activate_tools: {
      label: NATIVE_LABEL,
      execute: async (args) => {
        const raw = args["names"];
        if (!Array.isArray(raw) || raw.length === 0) {
          return { error: "names must be a non-empty array of strings" };
        }
        const names = raw.filter((n): n is string => typeof n === "string");
        const result = state.activate(names);
        logSystem("tool discovery: activate_tools", {
          activated: result.activated,
          unknown: result.unknown,
        });
        return result;
      },
    },
  };
}

export function mergeToolDefinitions(
  episodeTools: unknown[],
  metaTools: unknown[] = [...META_TOOL_DEFINITIONS],
): unknown[] {
  const seen = new Set<string>();
  const merged: unknown[] = [];

  for (const tool of [...episodeTools, ...metaTools]) {
    if (!tool || typeof tool !== "object") continue;
    const name = (tool as { name?: unknown }).name;
    if (typeof name !== "string" || seen.has(name)) continue;
    seen.add(name);
    merged.push(tool);
  }

  return merged;
}

/** Reserved meta names for tests and documentation. */
export { META_TOOL_NAMES };
