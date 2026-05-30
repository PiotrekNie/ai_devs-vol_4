/**
 * @ai-devs/agent-boilerplate — public surface
 *
 * Import from this file or from the specific submodule paths.
 */

// Config
export * from "./config.js";

// Types
export * from "./src/types/index.js";

// Logger
export * from "./src/utils/logger.js";

// Planning (turn 0)
export {
  WORKING_PLAN_MARKER,
  loadPlanningTurnPrompt,
  resolveEnablePlanningPhase,
  collectToolNames,
  stripPreviousWorkingPlan,
  injectWorkingPlan,
  buildPlanningInstructions,
  runPlanningTurn,
} from "./src/agent/planning.js";

// AI adapter
export { chat, createAIAdapter, fetchWithRetry } from "./src/agent/ai.js";
export type { AIAdapter, ChatParams, ChatOptions } from "./src/agent/ai.js";

// Memory hooks
export { noopMemoryHooks, estimateTokens } from "./src/agent/memory.js";
export type {
  MemoryHooks,
  BeforeTurnContext,
  BeforeTurnResult,
  AfterTurnContext,
} from "./src/agent/memory.js";

// Observational Memory (S02E05)
export {
  createObservationalMemoryHooks,
  processObservationalMemory,
  flushObservationalMemory,
} from "./src/agent/observational_memory/index.js";
export type {
  ObservationalMemoryHooksOptions,
  MemoryState,
  ObservationalMemoryConfig,
} from "./src/agent/observational_memory/index.js";

// Agent loop
export { createAgent } from "./src/agent/agent.js";
export type { ToolHandler, AgentConfig } from "./src/agent/agent.js";

// Tool discovery (S02E05-inspired, opt-in)
export {
  setupToolDiscovery,
  META_TOOL_NAMES,
  DEFAULT_CORE_TOOL_NAMES,
  META_TOOL_DEFINITIONS,
  buildToolCatalog,
  filterToolsForApi,
  createToolDiscoveryState,
} from "./src/agent/tool_discovery/index.js";
export type {
  ToolDiscoveryOptions,
  ToolDiscoveryRuntime,
} from "./src/agent/tool_discovery/index.js";

// MCP
export {
  createMcpClient,
  listMcpTools,
  callMcpTool,
  mcpToolResultToText,
  mcpToolsToOpenAI,
} from "./src/mcp/client.js";
export { createBoilerplateMcpServer } from "./src/mcp/server.js";

// Native tools
export {
  finishTaskTool,
  finishTaskToolDefinition,
  FinishTaskSignal,
} from "./src/tools/native/finish_task.js";
export {
  askHumanTool,
  askHumanToolDefinition,
} from "./src/tools/native/ask_human.js";
