/**
 * S02E04 mailbox agent — bootstrap (ReAct + MCP zmail tools).
 *
 * Run from this directory: `bun --env-file=../.env run run.ts`
 */

import { readFileSync } from "node:fs";
import { AGENT_MAX_OUTPUT_TOKENS, DEFAULT_AGENT_MODEL } from "./config.js";
import { createAgent } from "./src/agent/agent.js";
import { createAIAdapter } from "./src/agent/ai.js";
import { resolveEnablePlanningPhase } from "./src/agent/planning.js";
import { createMailboxMemoryHooks } from "./src/agent/mailbox_memory.js";
import {
  callMcpTool,
  createMcpClient,
  listMcpTools,
  mcpToolResultToText,
  mcpToolsToOpenAI,
} from "./src/mcp/client.js";
import { createS02e04McpServer } from "./src/mcp/server.js";
import {
  finishTaskTool,
  finishTaskToolDefinition,
} from "./src/tools/native/finish_task.js";
import { MCP_LABEL, NATIVE_LABEL } from "./src/utils/logger.js";

/** Ogólna dyscyplina + narzędzia */
const systemPrompt = readFileSync(
  new URL("./src/prompts/system.md", import.meta.url),
  "utf8",
);
/** Zoptymalizowany kontekst zadania (scalone z instructions — kanał „systemowy” dla modelu) */
const mailboxTaskSpec = readFileSync(
  new URL("./src/prompts/mailbox_task.md", import.meta.url),
  "utf8",
);

const instructions = [
  systemPrompt.trimEnd(),
  mailboxTaskSpec.trimEnd(),
  "",
].join("\n\n");

/** Turn-0 planning (empty tools on API turn 0). Override via AGENT_ENABLE_PLANNING. */
const enablePlanningPhase = resolveEnablePlanningPhase(true);

const mailboxUserQuery = enablePlanningPhase
  ? "Rozpocznij zadanie mailbox. Tura 0: plan z Ograniczeniami domenowymi. Po search_mail zawsze download_mail_content po messageID (32 znaki), nigdy rowID. submit_to_hub aż do {FLG:...}. Krótkie myśli — priorytet narzędzia."
  : "Rozpocznij zadanie mailbox. Od razu używaj narzędzi (search → download po messageID). Złóż answer z trzech maili (data ataku, hasło, kod SEC 36 znaków z korekty). submit_to_hub aż do {FLG:...} — bez finish_task wcześniej. Krótkie myśli — priorytet narzędzia.";

async function main() {
  const mcpServer = createS02e04McpServer();
  const mcpClient = await createMcpClient(mcpServer);
  const mcpToolDefs = mcpToolsToOpenAI(await listMcpTools(mcpClient));

  const allTools = [...mcpToolDefs, finishTaskToolDefinition];

  const handlers = {
    ...Object.fromEntries(
      mcpToolDefs.map((t) => [
        t.name,
        {
          label: MCP_LABEL,
          execute: async (args: Record<string, unknown>) => {
            const result = await callMcpTool(mcpClient, t.name, args);
            return mcpToolResultToText(result);
          },
        },
      ]),
    ),
    finish_task: {
      label: NATIVE_LABEL,
      execute: finishTaskTool.execute as unknown as (
        args: Record<string, unknown>,
      ) => Promise<unknown>,
    },
  };

  const agent = createAgent({
    ai: createAIAdapter({
      model: DEFAULT_AGENT_MODEL,
      maxOutputTokens: AGENT_MAX_OUTPUT_TOKENS,
    }),
    instructions,
    tools: allTools,
    handlers,
    memory: createMailboxMemoryHooks(),
    enablePlanningPhase,
  });

  const result = await agent.processQuery(mailboxUserQuery);
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
