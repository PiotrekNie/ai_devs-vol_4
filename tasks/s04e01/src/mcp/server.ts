import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeOkoDone, okoDoneInputSchema } from "../tools/mcp/oko_done.js";
import { executeOkoHelp, okoHelpInputSchema } from "../tools/mcp/oko_help.js";
import { executeOkoUpdate, okoUpdateInputSchema } from "../tools/mcp/oko_update.js";

/**
 * Minimal MCP server for okoeditor — only oko_* tools.
 * Does not expose read_file, http_request, or vision tools.
 */
export function createS04e01McpServer(): McpServer {
  const server = new McpServer(
    { name: "s04e01-okoeditor", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "oko_help",
    {
      description:
        "Fetch OKO Editor API help from the course hub (task okoeditor). " +
        "Call once at the start to learn update/done syntax.",
      inputSchema: okoHelpInputSchema,
    },
    executeOkoHelp,
  );

  server.registerTool(
    "oko_update",
    {
      description:
        "Update one record in the OKO system via hub verify API. " +
        "Requires 32-char hex id from the OKO web panel (read-only recon). " +
        "Incident titles must start with MOVE00, PROB00, or RECO00. " +
        '"done" only for page zadania.',
      inputSchema: okoUpdateInputSchema,
    },
    executeOkoUpdate,
  );

  server.registerTool(
    "oko_done",
    {
      description:
        "Verify all required OKO edits are complete. Returns {FLG:...} when successful. " +
        "If the hub returns an error message, read it and fix the specific record with oko_update.",
      inputSchema: okoDoneInputSchema,
    },
    executeOkoDone,
  );

  return server;
}
