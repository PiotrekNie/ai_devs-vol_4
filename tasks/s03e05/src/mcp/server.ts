import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  executeSubmitToHub,
  submitToHubInputSchema,
} from "../../../boilerplate/src/tools/mcp/submit_to_hub.js";
import {
  executeHubQuery,
  hubQueryInputSchema,
} from "../tools/mcp/hub_query.js";
import {
  executePlanRoute,
  planRouteInputSchema,
} from "../tools/mcp/plan_route.js";

/**
 * Minimal MCP server for savethem — hub_query + plan_route + submit_to_hub only.
 */
export function createS03e05McpServer(): McpServer {
  const server = new McpServer(
    { name: "s03e05-savethem", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "hub_query",
    {
      description:
        "Query the course hub savethem APIs. POST /api/{path} with English query. " +
        "Start with path toolsearch, then maps (query: Skolwin), wehicles (rocket|horse|car|walk), " +
        "books (movement|water|trees). apikey is injected automatically.",
      inputSchema: hubQueryInputSchema,
    },
    executeHubQuery,
  );

  server.registerTool(
    "plan_route",
    {
      description:
        "Compute an optimal route array for savethem using data from prior hub_query calls. " +
        "Returns [vehicle, direction, ...] ready for submit_to_hub. " +
        "Call only after map, all vehicles, and movement rules are discovered.",
      inputSchema: planRouteInputSchema,
    },
    executePlanRoute,
  );

  server.registerTool(
    "submit_to_hub",
    {
      description:
        "Submit savethem answer to the course hub. " +
        'Use task_name: savethem and answer: string[] from plan_route (e.g. ["rocket","up",...]). ' +
        "apikey is injected from HUB_API_KEY.",
      inputSchema: submitToHubInputSchema,
    },
    executeSubmitToHub,
  );

  return server;
}
