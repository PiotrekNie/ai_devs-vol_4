/**
 * S02E04 mailbox agent — bootstrap (ReAct + MCP zmail tools).
 *
 * Run from this directory: `bun --env-file=../.env run run.ts`
 */

import { readFileSync } from "node:fs";
import { DEFAULT_AGENT_MODEL } from "./config.js";
import { createAgent } from "./src/agent/agent.js";
import { createAIAdapter } from "./src/agent/ai.js";
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

const instructions = [systemPrompt.trimEnd(), mailboxTaskSpec.trimEnd(), ""].join(
  "\n\n",
);

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
    ai: createAIAdapter({ model: DEFAULT_AGENT_MODEL }),
    instructions,
    tools: allTools,
    handlers,
    memory: createMailboxMemoryHooks(),
  });

  const result = await agent.processQuery(
    "Rozpocznij wykonanie zadania mailbox: działaj zgodnie z instrukcją systemową do momentu flagi lub jawnego braku postępu.",
  );
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
