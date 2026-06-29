# @ai-devs/agent-boilerplate

Reusable **ReAct agent runtime** for [AI Devs 4](https://aidevs.pl/) course tasks. Provides the wiring that every episode needs — LLM adapter with retry/backoff, MCP tool layer, native tool signals, logger, and an Observer/Reflector memory scaffold — so individual task code stays focused on domain logic.

**Normative spec:** [tasks/docs/boilerplate-documentation.md](../docs/boilerplate-documentation.md)  
**Release history:** [CHANGELOG.md](./CHANGELOG.md)  
**Capability map:** [Feature catalog](#feature-catalog) — what is included, opt-in, or outside this package.

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

## Feature catalog

Scan the tables below to choose the **minimal** setup for an episode. Detailed examples and env vars stay in the sections linked under **Details**; contracts live in [boilerplate-documentation.md](../docs/boilerplate-documentation.md).

**Availability:** `default` = on whenever you use `createAgent`; `opt-in` = explicit flag or env; `separate package` / `lesson only` = not in `@ai-devs/agent-boilerplate`.

### Core runtime

Always active when you call `createAgent()` (unless noted).

| Feature | Description | Availability | When to use | Details |
| --- | --- | --- | --- | --- |
| ReAct loop | Reason → optional tool calls → results in context | default | Every course agent task | [Module map](#module-map) |
| `MAX_ITERATIONS` guard | Hard cap on ReAct turns; safe message when exceeded | default | Always; tune via `AGENT_MAX_ITERATIONS` | [Environment variables](#2-environment-variables) |
| Loop exit | (a) text-only answer, (b) `finish_task`, (c) iteration limit | default | Use `finish_task` for explicit completion | [Minimal example](#4-minimal-agent-example) |
| `processQuery` / `processConversationTurn` | Single-turn vs multi-turn session history | default | Chat-style episodes with follow-ups | `src/agent/agent.ts` |
| Tool output truncation | Caps chars echoed per tool result into the LLM | default | Large HTTP/file payloads | `AGENT_MAX_TOOL_OUTPUT_CHARS` |
| Terminal logger | `[MYŚL]`, `[AKCJA]`, `[WYNIK]`, `[SYSTEM]`, `[PLAN]`, `[PAMIĘĆ]` | default | Local debug without Langfuse | `src/utils/logger.ts` |
| Zod types | `Message`, `ToolCall`, `ModelResponse`, `mcpOk` / `mcpErr` | default | Validation + OpenAI function schemas | `src/types/index.ts` |
| `config.ts` | Models, limits, hub URL, OM/Langfuse from env | default | Central task configuration | `config.ts`, `tasks/config.js` |

### LLM adapter

| Feature | Description | Availability | When to use | Details |
| --- | --- | --- | --- | --- |
| `createAIAdapter` | OpenAI **Responses API**; tool calls + text | default | Standard course LLM (OpenAI / OpenRouter) | [Minimal example](#4-minimal-agent-example) |
| Exponential backoff | Retries on HTTP **429** and **503** | default | Course APIs and hub (503 is expected) | Shared with `http_request` |
| `ModelResponse.usage` | Token usage from API when present | default | OM calibration, cost debugging | [Observational Memory](#observational-memory-s02e05) |
| `ChatOptions` | e.g. `temperature`, `tracingMetadata` | opt-in | Per-call generation control / span metadata | `AgentConfig.chatOptions` |
| `chat()` | Low-level API call outside the agent loop | default | Tests, OM Observer/Reflector passes | `src/agent/ai.ts` |
| `chatStructured` | Single-shot **Structured Outputs** (json_schema + Zod); no tools | export | Classification, extraction, multi-step pipelines outside ReAct | `src/agent/structured.ts`, [§2.0 spec](../docs/boilerplate-documentation.md#20-llm-interaction-foundations-s01e01) |
| `createStructuredAIAdapter` | Factory bound to model for repeated structured calls | export | Same as `chatStructured` with fixed model | `src/agent/structured.ts` |

**Structured Outputs (outside ReAct):** use when you need typed JSON without function calling — e.g. batch classification. Not integrated with `createAgent`.

```typescript
import { z } from "zod";
import { chatStructured } from "@ai-devs/agent-boilerplate";
import { DEFAULT_AGENT_MODEL } from "@ai-devs/agent-boilerplate/config.js";

const schema = z.object({
  items: z.array(z.object({ id: z.number(), label: z.string() })),
});

const { data } = await chatStructured({
  model: DEFAULT_AGENT_MODEL,
  schemaName: "batch_labels",
  schema,
  temperature: 0,
  instructions: "Return one item per numbered line in the user message.",
  input: [{ role: "user", content: "1. foo\n2. bar" }],
});
```

On Zod mismatch after parse, throws `StructuredOutputValidationError`. See [research §11](../boilerplate/docs/specs/s01e01-llm-interaction/s01e01-llm-interaction.research.md).

### Tools

Register handlers for every tool name exposed to the model. MCP tools come from `createBoilerplateMcpServer()` (extend with `registerTool`).

| Name | Type | Description | Availability | When to use |
| --- | --- | --- | --- | --- |
| `http_request` | MCP | GET/POST with 429/503 retry; `{ ok, status, data }` | default | Fetch course APIs, webhooks, JSON |
| `submit_to_hub` | MCP | POST answer to verification hub; extracts `{FLG:...}` | default | Tasks with hub flag (`HUB_API_KEY`) |
| `read_file` | MCP | Chunked local text read (`offset`, `limit`) | default | Logs, local data; path sandbox via tool |
| `analyze_image_vision` | MCP | Vision model Q&A on local image file | default | Maps, screenshots (`AGENT_VISION_MODEL`) |
| `finish_task` | Native | Ends loop with `final_answer` | default | Model-declared task completion |
| `ask_human` | Native | Blocks on **stdin** until human replies | default | Missing info, confirmation, CAPTCHA |
| `list_tools` | Meta | Catalog of tool names + short descriptions | opt-in (`toolDiscovery`) | Many MCP tools in one episode |
| `describe_tool` | Meta | JSON Schema preview for one tool | opt-in (`toolDiscovery`) | Before `activate_tools` |
| `activate_tools` | Meta | Exposes selected MCP tools to function calling | opt-in (`toolDiscovery`) | Lazy schema loading |

**Notes:** POST via `http_request` requires a JSON `body`. `submit_to_hub` injects `apikey` from env. Meta tools are **not** a code sandbox — see [Code mode](#code-mode--sandbox-not-in-boilerplate).

### `createAgent` options

| Option | Description | Default | When to enable | See also |
| --- | --- | --- | --- | --- |
| `enablePlanningPhase` | Turn 0 plan (`tool_choice: none`); `## Working plan` in instructions; not counted in iterations | `false` | Multi-step tasks; shorten duplicate checklists in episode prompt | [Planning phase](#planning-phase-optional-turn-0) |
| `toolDiscovery` | Lazy tool schemas; core tools visible from turn 1 | `false` | Many MCP tools (>4 in prompt) | [Tool discovery](#tool-discovery-optional-s02e05-inspired) |
| `toolDiscovery.coreToolNames` | Tools in API from first ReAct turn | `http_request`, `submit_to_hub`, `finish_task` | Episode-specific core set | Same |
| `toolDiscovery.autoActivateOnUnknownTool` | Auto-activate inactive tool on call (retry next turn) | `false` | Convenience vs strict context control | Same |
| `memory` | `MemoryHooks` (`beforeTurn` / `afterTurn`) | `noopMemoryHooks` | Long sessions — use OM factory or custom hooks | [MemoryHooks](#memoryhooks-custom--no-op), [OM](#observational-memory-s02e05) |
| `tracing` | Langfuse span runtime | noop | Debug runs, costs, evals with traces | [Observability](#observability--langfuse-tracing-s03e01-opt-in) |
| `maxIterations` / `maxToolOutputChars` | Override env limits | env | Exceptional episodes | [Environment variables](#2-environment-variables) |
| `chatOptions` | Passed to each `generateResponse` | — | Temperature, tracing metadata | `src/agent/ai.ts` |

Env shortcut: `AGENT_ENABLE_PLANNING=true` enables planning when the flag is omitted on `createAgent`.

### Opt-in extensions (summary)

| Extension | What it does | Do not confuse with |
| --- | --- | --- |
| [Planning phase](#planning-phase-optional-turn-0) | Turn 0 working plan before tools | Episode checklist duplicated in prompt |
| [Tool discovery](#tool-discovery-optional-s02e05-inspired) | Smaller tool schema footprint in context | Code execution / `execute_code` |
| [Observational Memory](#observational-memory-s02e05) | Observer/Reflector compress **conversation context** (XML observations) | Langfuse **tracing** (records runs for debug) |
| [Langfuse tracing](#observability--langfuse-tracing-s03e01-opt-in) | `chat-request` → `agent` → generation/tool/memory spans | OM (context size); requires peer deps in **your task** |
| [MemoryHooks](#memoryhooks-custom--no-op) | Custom `beforeTurn` / `afterTurn` without OM | `createObservationalMemoryHooks()` factory |

Built-in prompt templates: `src/prompts/system.md`, `planning_turn.md`, `tool_discovery.md`, `observer.md`, `reflector.md`.

### Related packages (not in `@ai-devs/agent-boilerplate`)

| Package / location | Purpose | When |
| --- | --- | --- |
| [`@ai-devs/agent-evals`](../agent-evals/README.md) | Langfuse datasets, evaluators, `bootstrapExperiment` | Local quality runs after tracing; **not CI** |
| [`lessons/03_04_gmail`](../../lessons/03_04_gmail/README.md) | Tool design reference + **Promptfoo** evals (per-tool & scenarios); mocked/live suites | Refining MCP contracts; **not** required for typical hub homework |
| [`lessons/03_05_*`](../../lessons/03_05_awareness/README.md) | S03E05: awareness (`think`/`recall`) + generative UI demos (artifacts, render, MCP Apps) | Wide-space / non-deterministic agents; **not** default `@ai-devs/agent-boilerplate` |
| [`lessons/04_01_garden`](../../lessons/04_01_garden/README.md) | S04E01: Digital Garden — Daytona sandbox, skills/workflows, static site publish | Production-style deployment demo; **not** `@ai-devs/agent-boilerplate` |
| [`lessons/04_04_system`](../../lessons/04_04_system/README.md) | S04E04: markdown vault (Me/World/Craft/Ops/System), templates, `ops/` workflows, multi-agent | Full KB runtime; **not** `@ai-devs/agent-boilerplate` |
| [`tasks/shared/`](../../shared/) | Course domain helpers (e.g. people fetch/filter) — not agent runtime | Import directly in episode code when needed |
| [Code mode / sandbox](#code-mode--sandbox-not-in-boilerplate) | QuickJS or Deno guest execution + MCP bridges | Many MCP calls in one script; **lessons only** |

### Quick decision guide

| You need… | Use | Skip |
| --- | --- | --- |
| Typical homework (HTTP + hub, few turns) | Default ReAct + 4 MCP + `finish_task` | OM, discovery, tracing, code mode |
| Many MCP tools in the prompt | `toolDiscovery: { enabled: true }` | Sending every schema on turn 1 |
| Long multi-turn session | `createObservationalMemoryHooks()` | — |
| Trace / cost debugging | `@ai-devs/agent-boilerplate/observability` + `LANGFUSE_*` | — |
| Agent quality experiments | `@ai-devs/agent-evals` (+ tracing optional) | Running evals in CI |
| Design or refine MCP tool schemas & offline tool evals | [§2.3 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#23-tool-design--test-data-s03e04) + lesson `03_04_gmail` | `tool-hints` package export (not planned) |
| Wide behavioral space or hub `toolsearch` homework (`savethem`) | [§2.4 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#24-non-deterministic-models-as-advantage-s03e05) + episode MCP/`http_request` | `think`/`recall`/UI host in boilerplate package |
| Production deployment / Digital Garden (terminal, git, publish) | [§2.5 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#25-production-deployments-s04e01) + lesson `04_01_garden` | Daytona, `git_push`, skills in boilerplate package |
| Active collaboration / interface choice (CLI, MCP host, custom UI) | [§2.6 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#26-active-collaboration-with-ai-s04e02) | Chat UI, Slack bot, skills loader in boilerplate package |
| Contextual work / background agents (calendar, mail, KPI, isolation) | [§2.7 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#27-contextual-collaboration-in-daily--business-workflows-s04e03) | Scheduler, SaaS integrations, subAgents API in boilerplate package |
| Personal knowledge base / markdown vault (templates, ops/, navigation) | [§2.8 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#28-personal-knowledge-base-for-ai-s04e04) + lesson `04_04_system` | `write_file`, `list_dir`, `delegate`, vault loader in boilerplate package |
| Plan before acting | `enablePlanningPhase: true` | Duplicating plan in episode prompt |
| Human input mid-run | `ask_human` in handlers | — |
| Images / maps | `analyze_image_vision` | Pasting base64 into main model |
| Dozens of MCP calls in one step | Lesson [code mode](#code-mode--sandbox-not-in-boilerplate) | `execute_code` in this package |
| Course domain helpers | [`tasks/shared/`](../../shared/) | — |

**Rule of thumb:** ≤5 ReAct turns and ≤4 tools in the prompt → stay on **default** boilerplate (no discovery, OM, or code mode).

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
