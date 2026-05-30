/**
 * S03E01 evaluation agent — ReAct + MCP pipeline + Langfuse tracing.
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
  MAX_ITERATIONS,
  TRACING_SERVICE_NAME,
} from "./config.js";
import {
  createEvaluationMemoryHooks,
  recordBuildRecheckResult,
  recordHubSubmitResult,
  resetEvaluationHubState,
} from "./src/agent/evaluation_memory.js";
import { resetEvaluationState } from "./src/evaluationState.js";
import { createS03e01McpServer } from "./src/mcp/server.js";

const systemPrompt = readFileSync(
  new URL("./src/prompts/system.md", import.meta.url),
  "utf8",
);
const evaluationTaskSpec = readFileSync(
  new URL("./src/prompts/evaluation_task.md", import.meta.url),
  "utf8",
);

const instructions = [systemPrompt.trimEnd(), evaluationTaskSpec.trimEnd(), ""].join(
  "\n\n",
);

const enablePlanningPhase = resolveEnablePlanningPhase(true);

const userQuery = enablePlanningPhase
  ? "Rozpocznij zadanie evaluation. Tura 0: plan pipeline (scan → classify notes → build_recheck → submit_to_hub). Potem wykonaj narzędzia w tej kolejności aż hub zwróci {FLG:...}. Krótkie myśli."
  : "Wykonaj evaluation: scan_sensors → classify_operator_notes → build_recheck → submit_to_hub aż {FLG:...}.";

async function main() {
  resetEvaluationState();
  resetEvaluationHubState();

  initTracing({ serviceName: TRACING_SERVICE_NAME });
  const tracing = createTracingRuntime({
    sessionId: `s03e01-evaluation-${Date.now().toString(36)}`,
    agentName: "s03e01-evaluation",
    tags: ["s03e01", "evaluation"],
  });

  try {
    const mcpServer = createS03e01McpServer();
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
              if (t.name === "build_recheck") recordBuildRecheckResult(text);
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
      memory: createEvaluationMemoryHooks(),
      enablePlanningPhase,
      maxIterations: MAX_ITERATIONS,
      tracing,
      chatOptions: { tracingMetadata: { episode: "s03e01", task: "evaluation" } },
    });

    const result = await tracing.withTrace(
      { name: "s03e01-evaluation-run", metadata: { task: "evaluation" } },
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
