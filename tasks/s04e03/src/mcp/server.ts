import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  domatowoCallHelicopterInputSchema,
  executeDomatowoCallHelicopter,
} from "../tools/mcp/domatowo_call_helicopter.js";
import {
  domatowoCreateInputSchema,
  executeDomatowoCreate,
} from "../tools/mcp/domatowo_create.js";
import {
  domatowoDismountInputSchema,
  executeDomatowoDismount,
} from "../tools/mcp/domatowo_dismount.js";
import {
  domatowoInspectInputSchema,
  executeDomatowoInspect,
} from "../tools/mcp/domatowo_inspect.js";
import {
  domatowoMoveInputSchema,
  executeDomatowoMove,
} from "../tools/mcp/domatowo_move.js";
import {
  domatowoReconInputSchema,
  executeDomatowoRecon,
} from "../tools/mcp/domatowo_recon.js";
import { executeDomatowoReset } from "../tools/mcp/domatowo_reset.js";

/**
 * Minimal MCP server for domatowo — thin hub proxies only.
 * No read_file, http_request, vision, or submit_to_hub.
 */
export function createS04e03McpServer(): McpServer {
  const server = new McpServer(
    { name: "s04e03-domatowo", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "domatowo_recon",
    {
      description:
        "Read-only domatowo hub actions (0 action points): help, actionCost, getMap, " +
        "getObjects, getLogs, expenses, searchSymbol. Start with help or actionCost.",
      inputSchema: domatowoReconInputSchema,
    },
    executeDomatowoRecon,
  );

  server.registerTool(
    "domatowo_reset",
    {
      description:
        "Reset domatowo board, action points (300), and partisan position. Use when mission failed or points exhausted.",
      inputSchema: z.object({}),
    },
    () => executeDomatowoReset(),
  );

  server.registerTool(
    "domatowo_create",
    {
      description:
        "Create scout (5 pts) or transporter (5 + 5×passengers pts). Spawn slots A6→D6. Max 8 scouts, 4 transporters.",
      inputSchema: domatowoCreateInputSchema,
    },
    executeDomatowoCreate,
  );

  server.registerTool(
    "domatowo_move",
    {
      description:
        "Move unit to cell A1–K11. Scout: 7 pts/field, any tile. Transporter: 1 pt/field, roads only.",
      inputSchema: domatowoMoveInputSchema,
    },
    executeDomatowoMove,
  );

  server.registerTool(
    "domatowo_inspect",
    {
      description:
        "Scout inspects current cell (1 pt). Then call domatowo_recon with getLogs to read Polish result text.",
      inputSchema: domatowoInspectInputSchema,
    },
    executeDomatowoInspect,
  );

  server.registerTool(
    "domatowo_dismount",
    {
      description:
        "Dismount scouts from transporter onto adjacent tiles (0 pts). Use before foot search.",
      inputSchema: domatowoDismountInputSchema,
    },
    executeDomatowoDismount,
  );

  server.registerTool(
    "domatowo_call_helicopter",
    {
      description:
        "Call evacuation helicopter to destination cell (0 pts). Only after scout confirmed human on that cell. Returns {FLG:...} on success.",
      inputSchema: domatowoCallHelicopterInputSchema,
    },
    executeDomatowoCallHelicopter,
  );

  return server;
}
