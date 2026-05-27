/**
 * S02E05 drone agent — bootstrap (ReAct + boilerplate MCP).
 *
 * Run: `bun --env-file=../.env run run.ts`
 */

import { readFileSync } from "node:fs";
import {
  createAgent,
  createAIAdapter,
  createBoilerplateMcpServer,
  createObservationalMemoryHooks,
  resolveEnablePlanningPhase,
  createMcpClient,
  listMcpTools,
  callMcpTool,
  mcpToolResultToText,
  mcpToolsToOpenAI,
  finishTaskTool,
  finishTaskToolDefinition,
  askHumanTool,
  askHumanToolDefinition,
  MCP_LABEL,
  NATIVE_LABEL,
} from "@ai-devs/agent-boilerplate";
import {
  AGENT_MAX_OUTPUT_TOKENS,
  DEFAULT_AGENT_MODEL,
  AGENT_VISION_MODEL,
  DRONE_DOCS_URL,
  DRONE_MAP_LOCAL_PATH,
  DRONE_MAP_URL,
  HUB_API_KEY,
  HUB_VERIFY_URL,
  MAX_ITERATIONS,
} from "./config.js";
import { ensureDroneMapCached } from "./src/ensureDroneMapCached.js";

const systemPrompt = readFileSync(
  new URL("./src/prompts/system.md", import.meta.url),
  "utf8",
);
const droneTaskSpec = readFileSync(
  new URL("./src/prompts/drone_task.md", import.meta.url),
  "utf8",
);

/**
 * Extract the numeric prefix from the UUID (first hex-digit segment that is
 * all digits, e.g. "731179b9-…" → "731179").
 * Returns empty string if the key is missing or no pure-digit prefix found.
 */
function uuidNumericPrefix(uuid: string): string {
  const first = uuid.split("-")[0] ?? "";
  const digits = first.match(/^\d+/)?.[0] ?? "";
  return digits;
}

function buildInstructions(mapLocalPath: string): string {
  const idHint =
    "- **Object ID hint:** `PWR6132PL` is a known object from course lore — try it first. Use hub feedback to find the correct `set(x,y)` sector within the object.";

  const runtimeContext = [
    "## Runtime context",
    `- DRONE_DOCS_URL (live docs — http_request GET): ${DRONE_DOCS_URL}`,
    `- Map file (prefetched, ready for vision): **${mapLocalPath}**`,
    "- Do **not** download the map via `http_request` — use `analyze_image_vision` on the local path above.",
    idHint,
    "",
  ].join("\n");

  return [
    systemPrompt.trimEnd(),
    droneTaskSpec.trimEnd(),
    runtimeContext.trimEnd(),
    "",
  ].join("\n\n");
}

const enablePlanningPhase = resolveEnablePlanningPhase(true);

function buildUserQuery(mapLocalPath: string): string {
  return enablePlanningPhase
    ? `Rozpocznij zadanie drone. Tura 0: plan z Ograniczeniami domenowymi. Kolejność: analyze_image_vision na ${mapLocalPath} (siatka, sektor tamy) → live HTML docs (${DRONE_DOCS_URL}) → submit_to_hub aż do {FLG:...}. Krótkie myśli — priorytet narzędzia.`
    : `Rozpocznij zadanie drone. analyze_image_vision(${mapLocalPath}) → live docs → submit_to_hub z task_name drone aż do {FLG:...}. Bez finish_task wcześniej.`;
}

/**
 * Optionally reset the drone state on the hub before the agent starts.
 * Enabled via DRONE_PREFLIGHT_RESET=1 in tasks/.env.
 * Prevents sticky state from previous runs interfering with hub feedback.
 */
async function preflightHubReset(): Promise<void> {
  if (process.env["DRONE_PREFLIGHT_RESET"] !== "1") return;
  if (!HUB_API_KEY) return;
  try {
    const res = await fetch(HUB_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: HUB_API_KEY,
        task: "drone",
        answer: { instructions: ["hardReset"] },
      }),
    });
    const data = await res.json() as { results?: Array<{ message?: string }>; message?: string };
    console.log("[SYSTEM] Preflight hardReset:", data.results?.[0]?.message ?? data.message ?? "done");
  } catch (err) {
    console.warn("[SYSTEM] Preflight hardReset failed (non-fatal):", err instanceof Error ? err.message : String(err));
  }
}

async function main() {
  await preflightHubReset();

  const cached = await ensureDroneMapCached(
    DRONE_MAP_URL,
    DRONE_MAP_LOCAL_PATH,
  );
  console.log(
    `[SYSTEM] Map cached: ${cached.localPath} (${cached.bytes} bytes)`,
  );

  const instructions = buildInstructions(cached.localPath);
  const droneUserQuery = buildUserQuery(cached.localPath);

  const mcpServer = createBoilerplateMcpServer();
  const mcpClient = await createMcpClient(mcpServer);
  const mcpToolDefs = mcpToolsToOpenAI(await listMcpTools(mcpClient));
  const allTools = [
    ...mcpToolDefs,
    finishTaskToolDefinition,
    askHumanToolDefinition,
  ];

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
    ask_human: {
      label: NATIVE_LABEL,
      execute: askHumanTool.execute as unknown as (
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
    memory: createObservationalMemoryHooks(),
    enablePlanningPhase,
    maxIterations: MAX_ITERATIONS,
  });

  const result = await agent.processQuery(droneUserQuery);
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
