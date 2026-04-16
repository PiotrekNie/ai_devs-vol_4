/**
 * MCP-backed agent: exposes categorize_data to the Responses API tool loop.
 * Run: bun run agent (or bun run src/agentEntry.ts "…")
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { resolveModelForProvider } from "../../config.js";
import { createAgent } from "./agent.js";
import { callMcpTool, createMcpClient, listMcpTools, mcpToolsToOpenAI } from "./mcp/client.js";
import { createMcpServer } from "./mcp/server.js";

const mcpServer = createMcpServer();
const mcpClient = await createMcpClient(mcpServer);
const mcpTools = await listMcpTools(mcpClient);

const model = resolveModelForProvider(
  process.env.S02E03_AGENT_MODEL?.trim() ??
    process.env.OPENAI_MODEL?.trim() ??
    "gpt-4o-mini",
);

const instructions = [
  "You are a power-plant failure analyst (failure task). You have MCP tools: fetch_data (download hub failure.log; dedupe defaults to true so you get parsed unique rows instead of a huge raw string), categorize_data, write_json_list, update_json_list (persist categorized rows to a JSON file), read_json_list_file (inspect cached categorized JSON at a path; `data` is null if missing or not strict cache-shaped), and use_tokenizer.",
  "When the user supplies logs or asks for compression or filtering for failure analysis, call categorize_data with { \"data\": [ { \"date\", \"status\", \"message\" }, ... ] }.",
  "status must be INFO, WARN, or CRIT. Do not invent events—use data from the tool or from the user (first build a data array from it).",
  "Tool output: each line has category (power_plant = attach-worthy for the failure-analysis condensed log, non_power_plant = not) and reasoning (short justification). You may quote or summarize reasoning when explaining classifications.",
  "When the user asks for condensed logs or lines relevant to failure analysis, filter results to category === \"power_plant\".",
].join("\n");

const handlers = Object.fromEntries(
  mcpTools.map((t: Tool) => [
    t.name,
    {
      execute: (args: Record<string, unknown>) =>
        callMcpTool(mcpClient, t.name, args),
      label: "MCP",
    },
  ]),
);

const tools = mcpToolsToOpenAI(mcpTools);
const agent = createAgent({ model, tools, instructions, handlers });

const query =
  process.argv.slice(2).join(" ").trim() ||
  "Opisz, jak użyć categorize_data do przygotowania skondensowanych logów pod zadanie failure (bez konkretnych danych).";

const text = await agent.processQuery(query);
console.log(text);
