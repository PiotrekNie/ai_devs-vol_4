/**
 * S03E02 firmware agent — ReAct + shell VM + Langfuse tracing.
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
  FIRMWARE_MAX_ITERATIONS,
  TRACING_SERVICE_NAME,
} from "./config.js";
import {
  createFirmwareMemoryHooks,
  recordHubSubmitResult,
  recordShellResult,
  resetFirmwareState,
} from "./src/agent/firmware_memory.js";
import { createS03e02McpServer } from "./src/mcp/server.js";

const systemPrompt = readFileSync(
  new URL("./src/prompts/system.md", import.meta.url),
  "utf8",
);
const firmwareTaskSpec = readFileSync(
  new URL("./src/prompts/firmware_task.md", import.meta.url),
  "utf8",
);

const instructions = [systemPrompt.trimEnd(), firmwareTaskSpec.trimEnd(), ""].join(
  "\n\n",
);

const enablePlanningPhase = resolveEnablePlanningPhase(true);

const userQuery = enablePlanningPhase
  ? "Rozpocznij zadanie firmware. Tura 0: plan eksploracji VM (help → cooler.bin → hasło → settings.ini → kod ECCS → submit_to_hub). Potem wykonuj shell_exec sekwencyjnie aż hub zwróci {FLG:...}. Krótkie myśli."
  : "Wykonaj firmware: shell_exec (help, potem eksploracja VM) → submit_to_hub z kodem ECCS aż {FLG:...}.";

async function main() {
  resetFirmwareState();

  initTracing({ serviceName: TRACING_SERVICE_NAME });
  const tracing = createTracingRuntime({
    sessionId: `s03e02-firmware-${Date.now().toString(36)}`,
    agentName: "s03e02-firmware",
    tags: ["s03e02", "firmware"],
  });

  try {
    const mcpServer = createS03e02McpServer();
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
              if (t.name === "shell_exec") recordShellResult(text);
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
      memory: createFirmwareMemoryHooks(),
      enablePlanningPhase,
      maxIterations: FIRMWARE_MAX_ITERATIONS,
      tracing,
      chatOptions: { tracingMetadata: { episode: "s03e02", task: "firmware" } },
    });

    const result = await tracing.withTrace(
      { name: "s03e02-firmware-run", metadata: { task: "firmware" } },
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
