import { buildToolCatalog } from "./catalog.js";
import { filterToolsForApi } from "./filter.js";
import { appendToolDiscoveryInstructions } from "./instructions.js";
import {
  createMetaToolHandlers,
  mergeToolDefinitions,
  META_TOOL_DEFINITIONS,
} from "./meta.js";
import { createToolDiscoveryState } from "./state.js";
import type { ToolDiscoveryOptions } from "./types.js";

export type ToolDiscoveryRuntime = {
  allTools: unknown[];
  handlers: Record<
    string,
    { label: string; execute: (args: Record<string, unknown>) => Promise<unknown> } | undefined
  >;
  getApiTools: () => unknown[];
  autoActivateOnUnknownTool: boolean;
  tryPrepareInactiveTool: (name: string) => { prepared: boolean; message: string } | null;
};

export function setupToolDiscovery(
  options: ToolDiscoveryOptions | undefined,
  episodeTools: unknown[],
  handlers: Record<
    string,
    { label: string; execute: (args: Record<string, unknown>) => Promise<unknown> } | undefined
  >,
  baseInstructions: string,
): {
  runtime: ToolDiscoveryRuntime | null;
  instructions: string;
} {
  if (!options?.enabled) {
    return { runtime: null, instructions: baseInstructions };
  }

  const catalog = buildToolCatalog(episodeTools);
  const state = createToolDiscoveryState(catalog, options.coreToolNames);
  const metaHandlers = createMetaToolHandlers(catalog, state);
  const allTools = mergeToolDefinitions(episodeTools, [...META_TOOL_DEFINITIONS]);

  const mergedHandlers = {
    ...handlers,
    ...metaHandlers,
  };

  const autoActivateOnUnknownTool = options.autoActivateOnUnknownTool === true;

  const runtime: ToolDiscoveryRuntime = {
    allTools,
    handlers: mergedHandlers,
    getApiTools: () => filterToolsForApi(allTools, state.getActiveNames()),
    autoActivateOnUnknownTool,
    tryPrepareInactiveTool: (name: string) => {
      if (state.isMetaTool(name) || !catalog.has(name)) {
        return null;
      }
      if (state.isActive(name)) {
        return null;
      }
      if (!autoActivateOnUnknownTool) {
        return null;
      }
      const result = state.activate([name]);
      if (result.activated.length === 0 && result.alreadyActive.length === 0) {
        return null;
      }
      return {
        prepared: true,
        message: JSON.stringify({
          ok: false,
          activated: result.activated,
          message:
            `Tool "${name}" was inactive and is now activated. ` +
            `Call "${name}" again on the next turn.`,
          active: result.active,
        }),
      };
    },
  };

  return {
    runtime,
    instructions: appendToolDiscoveryInstructions(baseInstructions),
  };
}
