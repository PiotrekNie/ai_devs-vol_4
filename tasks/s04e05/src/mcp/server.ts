import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  executeReadFile,
  readFileInputSchema,
} from "../../../boilerplate/src/tools/mcp/read_file.js";
import { executeFwDatabase } from "../tools/mcp/fw_database.js";
import { executeFwDone } from "../tools/mcp/fw_done.js";
import { executeFwHelp } from "../tools/mcp/fw_help.js";
import { executeFwOrders } from "../tools/mcp/fw_orders.js";
import { executeFwReset } from "../tools/mcp/fw_reset.js";
import { executeFwSignature } from "../tools/mcp/fw_signature.js";
import {
  fwDatabaseSchema,
  fwOrdersSchema,
  fwSignatureSchema,
} from "../tools/mcp/schemas.js";

/**
 * MCP server for foodwarehouse — thin hub proxies + read_file for demand JSON.
 * No http_request, submit_to_hub, or vision.
 */
export function createS04e05McpServer(): McpServer {
  const server = new McpServer(
    { name: "s04e05-foodwarehouse", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "read_file",
    {
      description:
        "Read a local text file — use for food4cities.json city demand data. " +
        "Path is given in task spec. Use offset/limit to paginate large files.",
      inputSchema: readFileInputSchema,
    },
    executeReadFile,
  );

  server.registerTool(
    "fw_help",
    {
      description:
        "Fetch foodwarehouse API manual from hub (task foodwarehouse). " +
        "Call first — returns tools, orders actions, signature rules, database access.",
      inputSchema: z.object({}),
    },
    () => executeFwHelp(),
  );

  server.registerTool(
    "fw_database",
    {
      description:
        "Read-only SQLite queries via hub. Use show tables, show create table, " +
        "then SELECT on destinations, users, roles. Map city names to destination_id.",
      inputSchema: fwDatabaseSchema,
    },
    executeFwDatabase,
  );

  server.registerTool(
    "fw_signature",
    {
      description:
        "Generate SHA1 order signature for login + birthday + destination. " +
        "Use user fields from fw_database; destination is destination_id integer.",
      inputSchema: fwSignatureSchema,
    },
    executeFwSignature,
  );

  server.registerTool(
    "fw_orders",
    {
      description:
        "Read or modify warehouse orders: get, create, append (batch items map supported), delete. " +
        "create needs title, creatorID, destination, signature. append adds goods to order id.",
      inputSchema: fwOrdersSchema,
    },
    executeFwOrders,
  );

  server.registerTool(
    "fw_done",
    {
      description:
        "Validate all required city orders. Returns {FLG:...} on success or missing[] " +
        "with per-city gaps. Call after all orders created and filled. Then finish_task.",
      inputSchema: z.object({}),
    },
    () => executeFwDone(),
  );

  server.registerTool(
    "fw_reset",
    {
      description:
        "Restore hub order state to initial seed. Use before retry after mistakes.",
      inputSchema: z.object({}),
    },
    () => executeFwReset(),
  );

  return server;
}
