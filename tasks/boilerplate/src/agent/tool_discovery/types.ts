/**
 * Tool discovery (S02E05-inspired) — types and constants.
 */

export const META_TOOL_NAMES = [
  "list_tools",
  "describe_tool",
  "activate_tools",
] as const;

export type MetaToolName = (typeof META_TOOL_NAMES)[number];

export const DEFAULT_CORE_TOOL_NAMES = [
  "http_request",
  "submit_to_hub",
  "finish_task",
] as const;

export type ToolDiscoveryOptions = {
  /** Enables dynamic tool visibility in the ReAct loop. */
  enabled: boolean;
  /**
   * Tools always registered in the API from the first ReAct turn.
   * Defaults to {@link DEFAULT_CORE_TOOL_NAMES}.
   */
  coreToolNames?: string[];
  /**
   * When true, calling a catalogued but inactive tool activates it and returns a hint
   * to retry on the next turn (does not run the tool in the same turn).
   */
  autoActivateOnUnknownTool?: boolean;
};

export type ToolCatalogEntry = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  /** Original OpenAI function definition object. */
  definition: unknown;
};

export type ToolCatalog = Map<string, ToolCatalogEntry>;

export type ActivateToolsResult = {
  activated: string[];
  alreadyActive: string[];
  unknown: string[];
  active: string[];
};

export type ToolDiscoveryState = {
  getActiveNames: () => ReadonlySet<string>;
  activate: (names: string[]) => ActivateToolsResult;
  isActive: (name: string) => boolean;
  isInCatalog: (name: string) => boolean;
  isMetaTool: (name: string) => boolean;
};
