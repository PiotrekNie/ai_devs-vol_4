/**
 * S04E05 foodwarehouse agent — ReAct + read_file + thin hub warehouse MCP.
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
  AGENT_MAX_ITERATIONS,
  AGENT_MAX_OUTPUT_TOKENS,
  AGENT_MAX_TOOL_OUTPUT_CHARS,
  DEFAULT_AGENT_MODEL,
  FOOD4CITIES_URL,
  TRACING_SERVICE_NAME,
} from "./config.js";
import {
  createFoodwarehouseMemoryHooks,
  recordFoodwarehouseResult,
  resetFoodwarehouseState,
} from "./src/agent/foodwarehouse_memory.js";
import { downloadDemand } from "./src/ingest/downloadDemand.js";
import { createS04e05McpServer } from "./src/mcp/server.js";

function buildInstructions(demandPath: string): string {
  const systemPrompt = readFileSync(
    new URL("./src/prompts/system.md", import.meta.url),
    "utf8",
  );
  const taskTemplate = readFileSync(
    new URL("./src/prompts/foodwarehouse_task.md", import.meta.url),
    "utf8",
  );

  const taskSpec = taskTemplate
    .replaceAll("{{DEMAND_JSON_PATH}}", demandPath)
    .replaceAll("{{FOOD4CITIES_URL}}", FOOD4CITIES_URL);

  return [systemPrompt.trimEnd(), taskSpec.trimEnd(), ""].join("\n\n");
}

function buildUserQuery(enablePlanningPhase: boolean): string {
  if (enablePlanningPhase) {
    return (
      "Rozpocznij foodwarehouse. Tura 0: plan (fw_help → read_file food4cities.json → " +
      "fw_database schema → dla każdego miasta: fw_signature → fw_orders create → " +
      "fw_orders append batch → fw_done). Iteruj na missing z fw_done aż {FLG:...}."
    );
  }
  return (
    "Wykonaj foodwarehouse: eksploruj API/DB, utwórz zamówienia dla wszystkich miast z JSON, " +
    "fw_done aż {FLG:...}."
  );
}

async function main() {
  resetFoodwarehouseState();

  const demandPath = await downloadDemand();
  const instructions = buildInstructions(demandPath);
  const enablePlanningPhase = resolveEnablePlanningPhase(true);
  const userQuery = buildUserQuery(enablePlanningPhase);

  initTracing({ serviceName: TRACING_SERVICE_NAME });
  const tracing = createTracingRuntime({
    sessionId: `s04e05-foodwarehouse-${Date.now().toString(36)}`,
    agentName: "s04e05-foodwarehouse",
    tags: ["s04e05", "foodwarehouse"],
  });

  try {
    const mcpServer = createS04e05McpServer();
    const mcpClient = await createMcpClient(mcpServer);
    const mcpToolDefs = mcpToolsToOpenAI(await listMcpTools(mcpClient));
    const allTools = [...mcpToolDefs, finishTaskToolDefinition];

    const hubTools = new Set([
      "fw_help",
      "fw_database",
      "fw_signature",
      "fw_orders",
      "fw_done",
      "fw_reset",
    ]);

    const handlers = {
      ...Object.fromEntries(
        mcpToolDefs.map((t) => [
          t.name,
          {
            label: MCP_LABEL,
            execute: async (args: Record<string, unknown>) => {
              const result = await callMcpTool(mcpClient, t.name, args);
              const text = mcpToolResultToText(result);
              if (hubTools.has(t.name)) {
                recordFoodwarehouseResult(text);
              }
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
      memory: createFoodwarehouseMemoryHooks(),
      enablePlanningPhase,
      maxIterations: AGENT_MAX_ITERATIONS,
      maxToolOutputChars: AGENT_MAX_TOOL_OUTPUT_CHARS,
      tracing,
      chatOptions: {
        maxOutputTokens: AGENT_MAX_OUTPUT_TOKENS,
        tracingMetadata: { episode: "s04e05", task: "foodwarehouse" },
      },
    });

    const result = await tracing.withTrace(
      { name: "s04e05-foodwarehouse-run", metadata: { task: "foodwarehouse" } },
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
