/**
 * @ai-devs/s02e04 — mailbox agent + shared runtime surface
 *
 * Run: `bun --env-file=../.env run run.ts`
 */

// Config
export * from "./config.js";

// Types
export * from "./src/types/index.js";

// Logger
export * from "./src/utils/logger.js";

// AI adapter
export { chat, createAIAdapter, fetchWithRetry } from "./src/agent/ai.js";
export type { AIAdapter, ChatParams, ChatOptions } from "./src/agent/ai.js";

// Memory hooks
export { noopMemoryHooks, estimateTokens } from "./src/agent/memory.js";
export { createMailboxMemoryHooks } from "./src/agent/mailbox_memory.js";
export type { MailboxMemoryHooksOptions } from "./src/agent/mailbox_memory.js";
export type {
  MemoryHooks,
  BeforeTurnContext,
  BeforeTurnResult,
  AfterTurnContext,
} from "./src/agent/memory.js";

// Agent loop
export { createAgent } from "./src/agent/agent.js";
export type { ToolHandler, AgentConfig } from "./src/agent/agent.js";

// MCP
export {
  createMcpClient,
  listMcpTools,
  callMcpTool,
  mcpToolResultToText,
  mcpToolsToOpenAI,
} from "./src/mcp/client.js";
export {
  createS02e04McpServer,
  createBoilerplateMcpServer,
} from "./src/mcp/server.js";

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
