import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createMcpClient, listMcpTools, mcpToolsToOpenAI } from "./mcp/client.js";
import { createMcpServer } from "./mcp/server.js";

/** Shared MCP in-memory server + client + OpenAI-format tools (used by agent entry and failure agent). */
export async function createMcpToolRuntime(): Promise<{
  mcpClient: Awaited<ReturnType<typeof createMcpClient>>;
  mcpTools: Tool[];
  openAiTools: ReturnType<typeof mcpToolsToOpenAI>;
}> {
  const server = createMcpServer();
  const mcpClient = await createMcpClient(server);
  const mcpTools = await listMcpTools(mcpClient);
  return {
    mcpClient,
    mcpTools,
    openAiTools: mcpToolsToOpenAI(mcpTools),
  };
}
