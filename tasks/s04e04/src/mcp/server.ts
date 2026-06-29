import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  executeReadFile,
  readFileInputSchema,
} from "../../../boilerplate/src/tools/mcp/read_file.js";
import { executeFsBatch, fsBatchInputSchema } from "../tools/mcp/fs_batch.js";
import { executeFsDone } from "../tools/mcp/fs_done.js";
import { executeFsHelp } from "../tools/mcp/fs_help.js";
import { executeFsList, fsListInputSchema } from "../tools/mcp/fs_list.js";
import { executeFsReset } from "../tools/mcp/fs_reset.js";

/**
 * MCP server for filesystem — thin hub proxies + read_file for Natan notes.
 * No http_request, submit_to_hub, or vision.
 */
export function createS04e04McpServer(): McpServer {
  const server = new McpServer(
    { name: "s04e04-filesystem", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "read_file",
    {
      description:
        "Read a local text file from Natan's notes (absolute path given in task spec). " +
        "Use offset/limit for pagination on large files.",
      inputSchema: readFileInputSchema,
    },
    executeReadFile,
  );

  server.registerTool(
    "fs_help",
    {
      description:
        "Fetch virtual filesystem API manual from hub (task filesystem). " +
        "Call first — returns limits, actions, batch_mode rules.",
      inputSchema: z.object({}),
    },
    () => executeFsHelp(),
  );

  server.registerTool(
    "fs_batch",
    {
      description:
        "Send batch_mode array to hub: createDirectory/createFile/delete* / reset. " +
        "Build the full tree in one or few calls. Order: directories → city files → " +
        "person/good files with markdown links to existing city paths.",
      inputSchema: fsBatchInputSchema,
    },
    executeFsBatch,
  );

  server.registerTool(
    "fs_done",
    {
      description:
        "Validate filesystem against task rules. Returns {FLG:...} on success or " +
        "error message to fix. Call after fs_batch. NOT part of batch array.",
      inputSchema: z.object({}),
    },
    () => executeFsDone(),
  );

  server.registerTool(
    "fs_list",
    {
      description:
        "List files in virtual FS directory (hub action listFiles). Optional path, default /.",
      inputSchema: fsListInputSchema,
    },
    executeFsList,
  );

  server.registerTool(
    "fs_reset",
    {
      description:
        "Clear entire virtual filesystem on hub. Use before retry after fs_done failure.",
      inputSchema: z.object({}),
    },
    () => executeFsReset(),
  );

  return server;
}
