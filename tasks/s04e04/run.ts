/**
 * S04E04 filesystem agent — ReAct + read_file + thin hub FS MCP.
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
  FILESYSTEM_MAX_ITERATIONS,
  TRACING_SERVICE_NAME,
} from "./config.js";
import {
  createFilesystemMemoryHooks,
  recordFilesystemResult,
  resetFilesystemState,
} from "./src/agent/filesystem_memory.js";
import {
  downloadNotes,
  noteFilePaths,
} from "./src/ingest/downloadNotes.js";
import { createS04e04McpServer } from "./src/mcp/server.js";

function buildInstructions(notesDir: string): string {
  const systemPrompt = readFileSync(
    new URL("./src/prompts/system.md", import.meta.url),
    "utf8",
  );
  const taskTemplate = readFileSync(
    new URL("./src/prompts/filesystem_task.md", import.meta.url),
    "utf8",
  );

  const paths = noteFilePaths(notesDir);
  const taskSpec = taskTemplate
    .replaceAll("{{NOTES_README}}", paths.readme)
    .replaceAll("{{NOTES_OGLOSZENIA}}", paths.ogloszenia)
    .replaceAll("{{NOTES_TRANSAKCJE}}", paths.transakcje)
    .replaceAll("{{NOTES_ROZMOWY}}", paths.rozmowy);

  return [systemPrompt.trimEnd(), taskSpec.trimEnd(), ""].join("\n\n");
}

function buildUserQuery(enablePlanningPhase: boolean): string {
  if (enablePlanningPhase) {
    return (
      "Rozpocznij filesystem. Tura 0: plan (fs_help → read_file wszystkich notatek → " +
      "fs_batch z /miasta, /osoby, /towary → fs_done). Iteruj na błędach fs_done aż {FLG:...}."
    );
  }
  return (
    "Wykonaj filesystem: fs_help → read_file notatki → fs_batch → fs_done aż {FLG:...}."
  );
}

async function main() {
  resetFilesystemState();

  const notesDir = await downloadNotes();
  const instructions = buildInstructions(notesDir);
  const enablePlanningPhase = resolveEnablePlanningPhase(true);
  const userQuery = buildUserQuery(enablePlanningPhase);

  initTracing({ serviceName: TRACING_SERVICE_NAME });
  const tracing = createTracingRuntime({
    sessionId: `s04e04-filesystem-${Date.now().toString(36)}`,
    agentName: "s04e04-filesystem",
    tags: ["s04e04", "filesystem"],
  });

  try {
    const mcpServer = createS04e04McpServer();
    const mcpClient = await createMcpClient(mcpServer);
    const mcpToolDefs = mcpToolsToOpenAI(await listMcpTools(mcpClient));
    const allTools = [...mcpToolDefs, finishTaskToolDefinition];

    const hubTools = new Set([
      "fs_help",
      "fs_batch",
      "fs_done",
      "fs_list",
      "fs_reset",
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
                recordFilesystemResult(text);
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
      memory: createFilesystemMemoryHooks(),
      enablePlanningPhase,
      maxIterations: FILESYSTEM_MAX_ITERATIONS,
      tracing,
      chatOptions: {
        maxOutputTokens: AGENT_MAX_OUTPUT_TOKENS,
        tracingMetadata: { episode: "s04e04", task: "filesystem" },
      },
    });

    const result = await tracing.withTrace(
      { name: "s04e04-filesystem-run", metadata: { task: "filesystem" } },
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
