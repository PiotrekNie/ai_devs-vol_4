import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  executeSubmitToHub,
  submitToHubInputSchema,
} from "../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import {
  executeShellExec,
  shellExecInputSchema,
} from "../tools/mcp/shell_exec.js";

/**
 * Minimal MCP server for firmware — only shell_exec + submit_to_hub.
 * Does not expose read_file, http_request, or vision tools.
 */
export function createS03e02McpServer(): McpServer {
  const server = new McpServer(
    { name: "s03e02-firmware", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "shell_exec",
    {
      description:
        "Run one command on the remote firmware VM via hub shell API. " +
        "Exactly one shell command per call. Start with help. " +
        "Never access /etc, /root, or /proc/. Respect .gitignore rules in directories.",
      inputSchema: shellExecInputSchema,
    },
    executeShellExec,
  );

  server.registerTool(
    "submit_to_hub",
    {
      description:
        "Submit the ECCS confirmation code to the course hub. " +
        "Use task_name: firmware and answer: { confirmation: \"ECCS-...\" }. " +
        "apikey is injected from HUB_API_KEY.",
      inputSchema: submitToHubInputSchema,
    },
    executeSubmitToHub,
  );

  return server;
}
