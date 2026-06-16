/**
 * S04E01 okoeditor agent — ReAct + OKO hub API + Langfuse tracing.
 *
 * Run: `bun --env-file=../.env run run.ts`
 */

import { readFileSync } from "node:fs";
import {
  createAgent,
  createAIAdapter,
  createMcpClient,
  listMcpTools,
  callMcpTool,
  mcpToolResultToText,
  mcpToolsToOpenAI,
  finishTaskTool,
  finishTaskToolDefinition,
  resolveEnablePlanningPhase,
  MCP_LABEL,
  NATIVE_LABEL,
} from "@ai-devs/agent-boilerplate";
import {
  createTracingRuntime,
  flushTracing,
  initTracing,
  shutdownTracing,
  withTracingAdapter,
} from "@ai-devs/agent-boilerplate/observability";
import {
  AGENT_MAX_OUTPUT_TOKENS,
  DEFAULT_AGENT_MODEL,
  OKOEDITOR_MAX_ITERATIONS,
  TRACING_SERVICE_NAME,
} from "./config.js";
import {
  createOkoMemoryHooks,
  recordOkoHubResult,
  resetOkoState,
} from "./src/agent/oko_memory.js";
import { createS04e01McpServer } from "./src/mcp/server.js";

const systemPrompt = readFileSync(
  new URL("./src/prompts/system.md", import.meta.url),
  "utf8",
);
const okoeditorTaskSpec = readFileSync(
  new URL("./src/prompts/okoeditor_task.md", import.meta.url),
  "utf8",
);

const instructions = [systemPrompt.trimEnd(), okoeditorTaskSpec.trimEnd(), ""].join(
  "\n\n",
);

const enablePlanningPhase = resolveEnablePlanningPhase(true);

const userQuery = enablePlanningPhase
  ? "Rozpocznij okoeditor. Tura 0: plan (help opcjonalnie → 3× oko_update z ID z kontekstu → oko_done). " +
    "Iteruj na feedback done aż {FLG:...}. Nie zgaduj ID."
  : "Wykonaj okoeditor: oko_update ×3 → oko_done aż {FLG:...}.";

async function main() {
  resetOkoState();

  initTracing({ serviceName: TRACING_SERVICE_NAME });
  const tracing = createTracingRuntime({
    sessionId: `s04e01-okoeditor-${Date.now().toString(36)}`,
    agentName: "s04e01-okoeditor",
    tags: ["s04e01", "okoeditor"],
  });

  try {
    const mcpServer = createS04e01McpServer();
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
              const text = mcpToolResultToText(result);
              if (t.name === "oko_update") recordOkoHubResult(text, "update");
              if (t.name === "oko_done") recordOkoHubResult(text, "done");
              return result;
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

    const baseAdapter = createAIAdapter({
      model: DEFAULT_AGENT_MODEL,
      maxOutputTokens: AGENT_MAX_OUTPUT_TOKENS,
    });

    const ai = withTracingAdapter(baseAdapter, DEFAULT_AGENT_MODEL);

    const agent = createAgent({
      ai,
      instructions,
      tools: allTools,
      handlers,
      memory: createOkoMemoryHooks(),
      enablePlanningPhase,
      maxIterations: OKOEDITOR_MAX_ITERATIONS,
      tracing,
      chatOptions: { tracingMetadata: { episode: "s04e01", task: "okoeditor" } },
    });

    const result = await tracing.withTrace(
      { name: "s04e01-okoeditor-run", metadata: { task: "okoeditor" } },
      () => agent.processQuery(userQuery),
    );

    console.log(result);
  } finally {
    await flushTracing();
    await shutdownTracing();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
