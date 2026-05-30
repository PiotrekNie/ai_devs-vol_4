# @ai-devs/agent-boilerplate

Reusable **ReAct agent runtime** for [AI Devs 4](https://aidevs.pl/) course tasks. Provides the wiring that every episode needs — LLM adapter with retry/backoff, MCP tool layer, native tool signals, logger, and an Observer/Reflector memory scaffold — so individual task code stays focused on domain logic.

**Normative spec:** [tasks/docs/boilerplate-documentation.md](../docs/boilerplate-documentation.md)  
**Release history:** [CHANGELOG.md](./CHANGELOG.md)

---

## Quick Start

### 1. Install

From a task directory (e.g. `tasks/sXXeYY/`):

```bash
bun install
```

The workspace `package.json` already declares the dependency:

```json
"@ai-devs/agent-boilerplate": "file:../boilerplate"
```

If adding to a new task:

```json
{
  "dependencies": {
    "@ai-devs/agent-boilerplate": "file:../boilerplate"
  }
}
```

Then run `bun install` from the task directory.

### 2. Environment variables

All keys are optional unless noted; the defaults are shown in [.env.example](./.env.example). Add them to `tasks/.env` (loaded by every task via `bun --env-file=../.env run index.ts`):

| Variable                                 | Required            | Default                         | Purpose                                          |
| ---------------------------------------- | ------------------- | ------------------------------- | ------------------------------------------------ |
| `OPENAI_API_KEY` or `OPENROUTER_API_KEY` | **Yes**             | —                               | LLM provider key (shared with `tasks/config.js`) |
| `HUB_API_KEY`                            | For `submit_to_hub` | —                               | Course hub verification key                      |
| `AGENT_MODEL`                            | No                  | `gpt-4o-mini`                   | Default LLM model                                |
| `AGENT_VISION_MODEL`                     | No                  | `gpt-4o-mini`                   | Model for `analyze_image_vision` tool            |
| `AGENT_MAX_ITERATIONS`                   | No                  | `10`                            | ReAct loop iteration cap                         |
| `AGENT_PLANNING_MAX_OUTPUT_TOKENS`       | No                  | `1024`                          | Max tokens for turn 0 when `enablePlanningPhase` is true |
| `AGENT_ENABLE_PLANNING`                  | No                  | —                               | When set to `true`/`1`, enables turn 0 if `createAgent` omits the flag |
| `AGENT_MAX_TOOL_OUTPUT_CHARS`            | No                  | `24000`                         | Max chars echoed per tool result                 |
| `AGENT_MAX_FILE_READ_CHARS`              | No                  | `50000`                         | Max chars returned by `read_file`                |
| `AGENT_RETRY_BASE_DELAY_MS`              | No                  | `1000`                          | Base retry delay for 429/503 errors              |
| `AGENT_MAX_RETRY_ATTEMPTS`               | No                  | `5`                             | Max retry attempts per call                      |
| `HUB_VERIFY_URL`                         | No                  | `https://hub.ag3nts.org/verify` | Hub verification endpoint                        |
| `OBSERVER_THRESHOLD_TOKENS`              | No                  | `30000`                         | OM: seal conversation head when tail exceeds this |
| `REFLECTOR_THRESHOLD_TOKENS`             | No                  | `60000`                         | OM: run Reflector when observations exceed this  |
| `REFLECTION_TARGET_TOKENS`                 | No                  | `20000`                         | OM: Reflector target size + hysteresis           |
| `OM_MODEL`                               | No                  | `gpt-4o-mini`                   | Model for Observer / Reflector passes            |
| `OM_PERSIST_DIR`                         | No                  | *(empty)*                       | Debug logs (`observer-NNN.md`); empty = off       |
| `OM_CALIBRATION_MIN_ACTUAL_TOKENS`       | No                  | `500`                           | Min API tokens before usage calibration applies  |
| `LANGFUSE_PUBLIC_KEY`                    | For tracing         | —                               | Langfuse public key (opt-in observability)       |
| `LANGFUSE_SECRET_KEY`                    | For tracing         | —                               | Langfuse secret key                              |
| `LANGFUSE_BASE_URL`                      | No                  | `https://cloud.langfuse.com`    | Langfuse API URL                                 |
| `TRACING_SERVICE_NAME`                   | No                  | `@ai-devs/agent-boilerplate`    | OTEL service name for Langfuse traces            |

### 3. Run the boilerplate tests

```bash
# From tasks/boilerplate/
bun test
bunx tsc --noEmit
```

### 4. Minimal agent example

```typescript
// tasks/sXXeYY/index.ts
import { readFileSync } from "node:fs";
import { createAgent } from "@ai-devs/agent-boilerplate/src/agent/agent.js";
import { createAIAdapter } from "@ai-devs/agent-boilerplate/src/agent/ai.js";
import { createBoilerplateMcpServer } from "@ai-devs/agent-boilerplate/src/mcp/server.js";
import {
  createMcpClient,
  mcpToolsToOpenAI,
} from "@ai-devs/agent-boilerplate/src/mcp/client.js";
import {
  listMcpTools,
  callMcpTool,
  mcpToolResultToText,
} from "@ai-devs/agent-boilerplate/src/mcp/client.js";
import { finishTaskTool } from "@ai-devs/agent-boilerplate/src/tools/native/finish_task.js";
import {
  MCP_LABEL,
  NATIVE_LABEL,
} from "@ai-devs/agent-boilerplate/src/utils/logger.js";
import { DEFAULT_AGENT_MODEL } from "@ai-devs/agent-boilerplate/config.js";

const systemPrompt = readFileSync(
  new URL("./src/prompts/system.md", import.meta.url),
  "utf8",
);

const mcpServer = createBoilerplateMcpServer();
const mcpClient = await createMcpClient(mcpServer);
const mcpToolDefs = mcpToolsToOpenAI(await listMcpTools(mcpClient));

const allTools = [
  ...mcpToolDefs,
  {
    type: "function",
    name: finishTaskTool.name,
    description: finishTaskTool.description,
    parameters: {
      type: "object",
      properties: { final_answer: { type: "string" } },
      required: ["final_answer"],
    },
    strict: true,
  },
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
  finish_task: { label: NATIVE_LABEL, execute: finishTaskTool.execute },
};

const agent = createAgent({
  ai: createAIAdapter({ model: DEFAULT_AGENT_MODEL }),
  instructions: systemPrompt,
  tools: allTools,
  handlers,
});

const result = await agent.processQuery("Your task description here.");
console.log("Result:", result);
```

### Planning phase (optional turn 0)

```typescript
const agent = createAgent({
  ai: createAIAdapter({ model: "gpt-4o-mini" }),
  instructions: systemPrompt,
  tools: allTools,
  handlers,
  enablePlanningPhase: true, // [PLAN] log, then full MAX_ITERATIONS for tools
});
```

Turn 0 uses `tool_choice: "none"`, does not consume ReAct iterations, and injects a `## Working plan` block into instructions. Shorten episode prompt checklists when enabling this flag to avoid duplicating the generated plan.

### Tool discovery (optional, S02E05-inspired)

When an episode registers many MCP tools, you can avoid sending every JSON Schema on every ReAct turn:

```typescript
const agent = createAgent({
  ai: createAIAdapter({ model: DEFAULT_AGENT_MODEL }),
  instructions: systemPrompt,
  tools: allTools,
  handlers,
  toolDiscovery: {
    enabled: true,
    coreToolNames: ["http_request", "submit_to_hub", "finish_task"],
    // autoActivateOnUnknownTool: false, // default
  },
});
```

The runtime injects meta tools and appends guidance from `src/prompts/tool_discovery.md`. Extended tools become callable only after `activate_tools`. This is **lazy schema loading in ReAct** — it does **not** include `execute_code` or a code sandbox (see below).

---

## Code mode / sandbox (not in boilerplate)

Course homework and typical episodes use **ReAct + direct MCP** (one or a few tool calls per turn). A separate pattern — **code mode** — runs LLM-generated scripts that call many tools inside an isolated runtime; only stdout / errors return to the model context.

| Layer | What it is | Where in this repo |
| --- | --- | --- |
| **File sandbox** | Path chroot for reads | `read_file` in boilerplate |
| **Tool discovery** | Lazy load schemas into the prompt | opt-in `toolDiscovery` above (S02E05-inspired) |
| **Code execution sandbox** | Run guest JS/TS with MCP bridges | **lessons only** — not shipped in this package |

**This package does not include** `execute_code`, QuickJS, or Deno. That is intentional: code mode adds WASM or external runtimes, hides intermediate steps in logs, and fits batch orchestration (many MCP calls in one script), not the default puzzle / verify-loop tasks.

| Lesson | Mechanism | Use when |
| --- | --- | --- |
| [`lessons/02_05_sandbox`](../../lessons/02_05_sandbox/) | QuickJS in-process + meta-tools + `execute_code` | Many MCP calls in one JS script; pairs with S02E05 OM material |
| [`lessons/03_02_code`](../../lessons/03_02_code/) | Deno subprocess + HTTP bridge | TypeScript, files, PDF generation; needs `deno` installed |

**When ReAct is enough:** ≤5 turns and ≤4 tools in the prompt — stay on default boilerplate (no code mode).

**S02E05 homework (`drone`):** use default boilerplate — vision + HTTP + ReAct + `submit_to_hub`. Details: [sandbox-code-execution research](./docs/specs/sandbox-code-execution/sandbox-code-execution.research.md) §3; [implementation plan](./docs/specs/sandbox-code-execution/sandbox-code-execution.plan.md) (Option A — docs only).

**Future shared module:** if a course task needs code mode in `tasks/`, prefer a separate package (e.g. `@ai-devs/agent-code-mode` with QuickJS), not an extension of the default boilerplate install.

---

## MCP server (in-process)

The boilerplate uses **in-process `InMemoryTransport`** — no subprocess needed. `createBoilerplateMcpServer()` registers all four MCP tools. Pass the server to `createMcpClient()` to get a ready-to-use client.

To register additional domain-specific tools alongside the defaults:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = createBoilerplateMcpServer();

server.registerTool(
  "my_domain_tool",
  {
    description: "...",
    inputSchema: z.object({ input: z.string() }),
  },
  async ({ input }) => ({
    content: [{ type: "text", text: JSON.stringify({ result: input }) }],
  }),
);
```

---

## Module map

```
tasks/boilerplate/
├── config.ts                      # Typed config: models, limits, endpoints (reads env)
├── index.ts                       # Barrel: re-exports all public surface
└── src/
    ├── agent/
    │   ├── ai.ts                  # AIAdapter interface + OpenAI Responses API impl + retry
    │   ├── agent.ts               # createAgent() — ReAct loop, MAX_ITERATIONS guard
    │   ├── planning.ts            # Turn 0 planning + Working plan injection
    │   ├── memory.ts              # MemoryHooks interface + noop default
    │   ├── tool_discovery/        # opt-in list_tools / describe_tool / activate_tools
    │   └── observational_memory/  # createObservationalMemoryHooks (S02E05 OM)
    │   └── observability/         # Langfuse tracing (S03E01, subpath export)
    ├── mcp/
    │   ├── client.ts              # createMcpClient, listMcpTools, callMcpTool, mcpToolsToOpenAI
    │   └── server.ts              # createBoilerplateMcpServer() — registers 4 default MCP tools
    ├── tools/
    │   ├── native/
    │   │   ├── finish_task.ts     # finish_task — terminates agent loop with final answer
    │   │   ├── ask_human.ts       # ask_human — blocks on stdin for human input
    │   │   ├── list_tools.ts      # tool discovery catalog
    │   │   ├── describe_tool.ts   # tool discovery schema preview
    │   │   └── activate_tools.ts  # tool discovery activation
    │   └── mcp/
    │       ├── http_request.ts    # http_request — GET/POST with retry/backoff
    │       ├── submit_to_hub.ts   # submit_to_hub — POST answer to hub, extract flag
    │       ├── read_file.ts       # read_file — chunked local file reader
    │       └── analyze_image_vision.ts  # analyze_image_vision — vision model image analysis
    ├── prompts/
    │   ├── system.md              # Default system prompt template
    │   ├── planning_turn.md       # Turn 0 planning instructions
    │   ├── observer.md            # Observer system prompt (OM)
    │   └── reflector.md           # Reflector system prompt (OM)
    ├── types/
    │   └── index.ts               # Zod schemas + TS types: Message, ToolDefinition, ModelResponse
    └── utils/
        └── logger.ts              # Tagged logger: [MYŚL] [AKCJA] [WYNIK] [PAMIĘĆ] [SYSTEM]
```

---

## Observational Memory (S02E05)

Mastra **Observational Memory** — Observer seals old conversation into XML observations; Reflector compresses when observations grow too large. Opt-in via factory (default agent behaviour unchanged).

```typescript
import {
  createAgent,
  createObservationalMemoryHooks,
} from "@ai-devs/agent-boilerplate";

const memory = createObservationalMemoryHooks({
  // optional: persistDir: "./workspace/memory",
  // optional: enableCalibration: true,
});

const agent = createAgent({
  ai,
  instructions,
  tools,
  handlers,
  memory,
});
```

**Context layout:**

```text
instructions = base prompt + <observations> … </observations>
input        = recent conversation tail (raw)
```

**Token estimation (dual):**

| Use | Estimator |
| --- | --- |
| Observer threshold (`OBSERVER_THRESHOLD_TOKENS`) | Raw `chars / 4` (stable) |
| Observation size / Reflector | Calibrated from API `usage` when enough samples |

Set `enableCalibration: false` for raw-only behaviour. Reuse the **same** factory instance across `processConversationTurn` calls to retain observation state.

**Coexistence:** `## Working plan` (planning phase) and domain journals (e.g. s02e04 mailbox) stay in `instructions`; OM appendix is injected separately — do not strip plan markers in custom hooks.

Logs: `[PAMIĘĆ]` for observer/reflector/seal events. Prompts: `src/prompts/observer.md`, `reflector.md`.

> **Do not confuse** with **Observability (Langfuse tracing, S03E01)** below — OM compresses context; Langfuse records traces for debugging and cost analysis.

---

## Observability — Langfuse tracing (S03E01, opt-in)

**Opt-in** Langfuse tracing for multi-turn ReAct runs. Default behaviour is unchanged (terminal logger only).

| Concept | Package |
| --- | --- |
| Context compression (Observer/Reflector) | This package — `createObservationalMemoryHooks` |
| Trace / generation / tool spans | `@ai-devs/agent-boilerplate/observability` |
| Eval experiments (datasets) | [`@ai-devs/agent-evals`](../agent-evals/README.md) |

**Peer dependencies** (install in your task when enabling tracing):

```bash
bun add @langfuse/tracing @langfuse/otel @opentelemetry/sdk-node @opentelemetry/api
```

```typescript
import { createAgent, createAIAdapter } from "@ai-devs/agent-boilerplate";
import {
  initTracing,
  flushTracing,
  shutdownTracing,
  createTracingRuntime,
  withTracingAdapter,
} from "@ai-devs/agent-boilerplate/observability";
import { DEFAULT_AGENT_MODEL } from "@ai-devs/agent-boilerplate/config.js";

initTracing({ serviceName: "sXXeYY" }); // no-op without LANGFUSE_* keys

const model = DEFAULT_AGENT_MODEL;
const agent = createAgent({
  ai: withTracingAdapter(createAIAdapter({ model }), model),
  instructions: systemPrompt,
  tools: allTools,
  handlers,
  tracing: createTracingRuntime({
    sessionId: "run-1",
    agentName: "my-episode",
  }),
});

try {
  await agent.processQuery("Your task");
} finally {
  await flushTracing();
  await shutdownTracing();
}
```

**Span hierarchy:** `chat-request` → `agent` → `generation#N` / `tool#N` / `memory/observer#N` / `memory/reflector#N` (when OM + tracing enabled).

### OM + Langfuse tracing together

Use the callback port (Wariant 2) — OM stays Langfuse-free; span implementation lives in the observability subpath:

```typescript
import {
  createAgent,
  createAIAdapter,
  createObservationalMemoryHooks,
} from "@ai-devs/agent-boilerplate";
import {
  initTracing,
  createTracingRuntime,
  withTracingAdapter,
  createOmTracingCallbacks,
  flushTracing,
  shutdownTracing,
} from "@ai-devs/agent-boilerplate/observability";

initTracing({ serviceName: "sXXeYY" });
const tracing = createTracingRuntime({ sessionId: "run-1", agentName: "episode" });
const model = "gpt-4o-mini";

const agent = createAgent({
  ai: withTracingAdapter(createAIAdapter({ model }), model),
  tracing,
  memory: createObservationalMemoryHooks({
    ...createOmTracingCallbacks(tracing),
  }),
  // instructions, tools, handlers…
});
```

OM spans record **metadata only** (message counts, token estimates, API usage) — not full observation XML. See [om-langfuse-spans research](./docs/specs/om-langfuse-spans/om-langfuse-spans.research.md).

**PII:** traces may contain user queries and tool I/O — apply a **task-level** redaction policy before sending production data to Langfuse. Eval experiments run **locally only** (not in CI). See [agent-observability-evals research](./docs/specs/agent-observability-evals/agent-observability-evals.research.md).

---

## MemoryHooks (custom / no-op)

`noopMemoryHooks` is the default when `memory` is omitted. For custom memory, implement `MemoryHooks` (`beforeTurn` / `afterTurn`) — see `src/agent/memory.ts`.
