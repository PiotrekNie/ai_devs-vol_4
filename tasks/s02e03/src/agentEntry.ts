/**
 * MCP-backed agent: exposes categorize_data to the Responses API tool loop.
 * Run: bun run agent (or bun run src/agentEntry.ts "…")
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { resolveModelForProvider } from "../../config.js";
import { createAgent } from "./agent.js";
import { callMcpTool } from "./mcp/client.js";
import { createMcpToolRuntime } from "./mcpRuntime.js";

const {
  mcpClient,
  mcpTools,
  openAiTools: tools,
} = await createMcpToolRuntime();

const model = resolveModelForProvider(
  process.env.S02E03_AGENT_MODEL?.trim() ??
    process.env.OPENAI_MODEL?.trim() ??
    "gpt-4o-mini",
);

const instructions = [
  "You are a power-plant failure analyst (failure task). MCP tools: fetch_data, categorize_data, use_tokenizer, read_json_list_file (paged; strict cache-shaped files only), write_json_list, update_json_list, remove_duplicates, filter_by_log_status, filter_by_log_date, build_list_to_verify, minify_message, verify_answer.",
  'When the user supplies logs or asks for compression or filtering for failure analysis, call categorize_data with { "data": [ { "date", "status", "message" }, ... ] }.',
  "status must be INFO, WARN, or CRIT. Do not invent events—use data from the tool or from the user (first build a data array from it).",
  "Tool output: each line has category (power_plant = high-confidence causal path only—strict inclusion; non_power_plant = exclude) and reasoning (short justification). You may quote or summarize reasoning when explaining classifications.",
  'When the user asks for condensed logs or lines relevant to failure analysis, filter results to category === "power_plant". Use remove_duplicates (prefer mode same_message to collapse repeated alert text at different timestamps; default exact keeps date-level rows) and filter_by_log_status (e.g. CRIT-only) on full row arrays; then filter_by_log_date so rows are chronological before build_list_to_verify (hub requirement). Pass the tool’s returned data into build_list_to_verify. For hub-style limits: build_list_to_verify → use_tokenizer on that logs string; only if count > 1500, return to JsonList rows (read_json_list_file or current items) and minify_message(items) — never minify the plaintext logs string — then filter_by_log_date and build_list_to_verify and use_tokenizer again.',
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

const agent = createAgent({ model, tools, instructions, handlers });

const query =
  process.argv.slice(2).join(" ").trim() ||
  "Opisz, jak użyć categorize_data do przygotowania skondensowanych logów pod zadanie failure (bez konkretnych danych).";

const text = await agent.processQuery(query);
console.log(text);
