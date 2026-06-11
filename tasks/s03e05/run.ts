/**
 * S03E05 savethem agent — ReAct + hub discovery + route solver.
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
  SAVETHEM_MAX_ITERATIONS,
  TRACING_SERVICE_NAME,
} from "./config.js";
import {
  createSavethemMemoryHooks,
  recordHubSubmitResult,
  resetSavethemState,
} from "./src/agent/savethem_memory.js";
import { resetDiscoveryStore } from "./src/domain/discovery_store.js";
import { createS03e05McpServer } from "./src/mcp/server.js";

const systemPrompt = readFileSync(
  new URL("./src/prompts/system.md", import.meta.url),
  "utf8",
);
const savethemTaskSpec = readFileSync(
  new URL("./src/prompts/savethem_task.md", import.meta.url),
  "utf8",
);

const instructions = [systemPrompt.trimEnd(), savethemTaskSpec.trimEnd(), ""].join(
  "\n\n",
);

const enablePlanningPhase = resolveEnablePlanningPhase(true);

const userQuery = enablePlanningPhase
  ? "Rozpocznij savethem. Tura 0: plan odkrycia (toolsearch → maps/Skolwin → wehicles ×4 → books/movement). " +
    "Potem hub_query (English only) → plan_route → submit_to_hub aż {FLG:...}. Nie licz trasy ręcznie."
  : "Wykonaj savethem: hub_query → plan_route → submit_to_hub aż {FLG:...}.";

async function main() {
  resetSavethemState();
  resetDiscoveryStore();

  initTracing({ serviceName: TRACING_SERVICE_NAME });
  const tracing = createTracingRuntime({
    sessionId: `s03e05-savethem-${Date.now().toString(36)}`,
    agentName: "s03e05-savethem",
    tags: ["s03e05", "savethem"],
  });

  try {
    const mcpServer = createS03e05McpServer();
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
              if (t.name === "submit_to_hub") recordHubSubmitResult(text);
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
      memory: createSavethemMemoryHooks(),
      enablePlanningPhase,
      maxIterations: SAVETHEM_MAX_ITERATIONS,
      tracing,
      chatOptions: { tracingMetadata: { episode: "s03e05", task: "savethem" } },
    });

    const result = await tracing.withTrace(
      { name: "s03e05-savethem-run", metadata: { task: "savethem" } },
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
