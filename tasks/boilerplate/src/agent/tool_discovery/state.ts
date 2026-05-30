import { META_TOOL_NAMES, type ActivateToolsResult, type ToolCatalog, type ToolDiscoveryState } from "./types.js";
import { resolveCoreToolNames } from "./resolve-core.js";

const metaSet = new Set<string>(META_TOOL_NAMES);

export function createToolDiscoveryState(
  catalog: ToolCatalog,
  coreToolNames?: string[],
): ToolDiscoveryState {
  const activeNames = new Set<string>();

  for (const meta of META_TOOL_NAMES) {
    activeNames.add(meta);
  }

  for (const core of resolveCoreToolNames(catalog, coreToolNames)) {
    activeNames.add(core);
  }

  function activate(names: string[]): ActivateToolsResult {
    const activated: string[] = [];
    const alreadyActive: string[] = [];
    const unknown: string[] = [];

    for (const name of names) {
      if (metaSet.has(name)) {
        unknown.push(name);
        continue;
      }
      if (!catalog.has(name)) {
        unknown.push(name);
        continue;
      }
      if (activeNames.has(name)) {
        alreadyActive.push(name);
        continue;
      }
      activeNames.add(name);
      activated.push(name);
    }

    return {
      activated,
      alreadyActive,
      unknown,
      active: [...activeNames].sort(),
    };
  }

  return {
    getActiveNames: () => activeNames,
    activate,
    isActive: (name) => activeNames.has(name),
    isInCatalog: (name) => catalog.has(name) || metaSet.has(name),
    isMetaTool: (name) => metaSet.has(name),
  };
}
