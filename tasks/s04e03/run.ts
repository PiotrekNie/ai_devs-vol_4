/**
 * S04E03 domatowo agent — ReAct + thin hub MCP + Langfuse tracing.
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
  DOMATOWO_MAX_ITERATIONS,
  DOMATOWO_MAX_TOOL_OUTPUT_CHARS,
  TRACING_SERVICE_NAME,
} from "./config.js";
import {
  createDomatowoMemoryHooks,
  recordDomatowoResult,
  resetDomatowoState,
} from "./src/agent/domatowo_memory.js";
import { createS04e03McpServer } from "./src/mcp/server.js";

const systemPrompt = readFileSync(
  new URL("./src/prompts/system.md", import.meta.url),
  "utf8",
);
const domatowoTaskSpec = readFileSync(
  new URL("./src/prompts/domatowo_task.md", import.meta.url),
  "utf8",
);

const instructions = [systemPrompt.trimEnd(), domatowoTaskSpec.trimEnd(), ""].join(
  "\n\n",
);

const enablePlanningPhase = resolveEnablePlanningPhase(true);

const userQuery = enablePlanningPhase
  ? "Rozpocznij domatowo. Tura 0: plan misji (recon → strategia jednostek → przeszukanie → helikopter). " +
    "Potem wykonuj narzędzia domatowo_* sekwencyjnie. Monitoruj action_points_left. " +
    "Czytaj getLogs po inspect. Kończ finish_task dopiero po {FLG:...}."
  : "Wykonaj domatowo: domatowo_recon → jednostki → inspect → callHelicopter aż {FLG:...}.";

async function main() {
  resetDomatowoState();

  initTracing({ serviceName: TRACING_SERVICE_NAME });
  const tracing = createTracingRuntime({
    sessionId: `s04e03-domatowo-${Date.now().toString(36)}`,
    agentName: "s04e03-domatowo",
    tags: ["s04e03", "domatowo"],
  });

  try {
    const mcpServer = createS04e03McpServer();
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
              if (t.name.startsWith("domatowo_")) {
                recordDomatowoResult(text);
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
      memory: createDomatowoMemoryHooks(),
      enablePlanningPhase,
      maxIterations: DOMATOWO_MAX_ITERATIONS,
      maxToolOutputChars: DOMATOWO_MAX_TOOL_OUTPUT_CHARS,
      tracing,
      chatOptions: {
        maxOutputTokens: AGENT_MAX_OUTPUT_TOKENS,
        tracingMetadata: { episode: "s04e03", task: "domatowo" },
      },
    });

    const result = await tracing.withTrace(
      { name: "s04e03-domatowo-run", metadata: { task: "domatowo" } },
      () => agent.processQuery(userQuery),
    );

    console.log(result);
  } finally {
    await flushTracing();
    await shutdownTracing();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("402") || /insufficient credits/i.test(message)) {
    console.error(
      "\n[SYSTEM] OpenRouter returned HTTP 402 — insufficient credits.\n" +
        "  1. Top up: https://openrouter.ai/settings/credits\n" +
        "  2. Or add OPENAI_API_KEY to tasks/.env and set AI_PROVIDER=openai\n" +
        "  3. Keep AGENT_MAX_OUTPUT_TOKENS=512 and AGENT_MAX_TOOL_OUTPUT_CHARS=6000\n",
    );
  }
  console.error(error);
  process.exit(1);
});
