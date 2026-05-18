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
| `AGENT_MAX_TOOL_OUTPUT_CHARS`            | No                  | `24000`                         | Max chars echoed per tool result                 |
| `AGENT_MAX_FILE_READ_CHARS`              | No                  | `50000`                         | Max chars returned by `read_file`                |
| `AGENT_RETRY_BASE_DELAY_MS`              | No                  | `1000`                          | Base retry delay for 429/503 errors              |
| `AGENT_MAX_RETRY_ATTEMPTS`               | No                  | `5`                             | Max retry attempts per call                      |
| `HUB_VERIFY_URL`                         | No                  | `https://hub.ag3nts.org/verify` | Hub verification endpoint                        |

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
    │   └── memory.ts              # MemoryHooks interface + no-op default (Observer/Reflector scaffold)
    ├── mcp/
    │   ├── client.ts              # createMcpClient, listMcpTools, callMcpTool, mcpToolsToOpenAI
    │   └── server.ts              # createBoilerplateMcpServer() — registers 4 default MCP tools
    ├── tools/
    │   ├── native/
    │   │   ├── finish_task.ts     # finish_task — terminates agent loop with final answer
    │   │   └── ask_human.ts       # ask_human — blocks on stdin for human input
    │   └── mcp/
    │       ├── http_request.ts    # http_request — GET/POST with retry/backoff
    │       ├── submit_to_hub.ts   # submit_to_hub — POST answer to hub, extract flag
    │       ├── read_file.ts       # read_file — chunked local file reader
    │       └── analyze_image_vision.ts  # analyze_image_vision — vision model image analysis
    ├── prompts/
    │   └── system.md              # Default system prompt template (override per task)
    ├── types/
    │   └── index.ts               # Zod schemas + TS types: Message, ToolDefinition, ModelResponse
    └── utils/
        └── logger.ts              # Tagged logger: [MYŚL] [AKCJA] [WYNIK] [SYSTEM]
```

---

## Observer/Reflector memory extension

`src/agent/memory.ts` exposes a `MemoryHooks` interface with two lifecycle methods: `beforeTurn` (called before each LLM call) and `afterTurn` (called after all tool results are appended). The default export `noopMemoryHooks` is a no-op implementation.

To implement full Observer/Reflector (S02E05 pattern), extend `MemoryHooks`:

```typescript
import type { MemoryHooks } from "@ai-devs/agent-boilerplate/src/agent/memory.js";

const myMemory: MemoryHooks = {
  async beforeTurn({ conversation, instructions }) {
    // Seal old items, append journal to instructions
    return {
      conversation: trimmedConversation,
      instructions: injectedInstructions,
    };
  },
  async afterTurn() {
    // Optional: post-turn bookkeeping
  },
};
```

Reference implementation: `tasks/s02e03/src/observationalMemory.ts`.
