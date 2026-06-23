# Changelog

All notable changes to **@ai-devs/agent-boilerplate** are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Observational Memory (S02E05)** — `createObservationalMemoryHooks()` in `src/agent/observational_memory/`: Observer/Reflector (Mastra OM), XML observations, tail-budget split, optional `OM_PERSIST_DIR` debug logs, `[PAMIĘĆ]` logger tag.
- **Token calibration** — `ModelResponse.usage` from Responses API; dual estimator (raw Observer threshold, calibrated observation/Reflector budgets); `enableCalibration` opt-out.
- **`AfterTurnContext.lastResponse`** — agent passes estimated tokens + usage for OM calibration after each ReAct turn.
- **Planning phase (turn 0)** — opt-in `enablePlanningPhase` on `createAgent` (see prior unreleased entries).
- **Tool discovery (S02E05-inspired, opt-in)** — `createAgent({ toolDiscovery: { enabled: true } })`: meta tools `list_tools`, `describe_tool`, `activate_tools`; dynamic API tool set via `activate_tools`; default core `http_request`, `submit_to_hub`, `finish_task`.
- **`http_request` tests** — POST without `body` rejected before fetch.
- **Observability (S03E01, opt-in)** — `src/observability/`: Langfuse tracing via subpath `@ai-devs/agent-boilerplate/observability`; `createTracingRuntime`, `withTracingAdapter`, `initTracing`; `createAgent({ tracing })` for agent/generation/tool spans; **`createOmTracingCallbacks`** for OM Observer/Reflector memory spans; peer deps Langfuse + OTEL; default off.

### Documentation

- **Feature catalog** — README section listing core runtime, tools, `createAgent` options, opt-in extensions, related packages, and a quick decision guide.
- **Sandbox / code mode (Option A)** — README and `tasks/docs/boilerplate-documentation.md` §5.2.1: three sandbox layers; code execution stays in course lessons (`02_05_sandbox`, `03_02_code`), not in this package. See `docs/specs/sandbox-code-execution/`.
- **Observability & evals (S03E01)** — README observability section; link to `@ai-devs/agent-evals`.
- **S03E04 (tool design & test data)** — §2.3 in `tasks/docs/boilerplate-documentation.md` (tool schema patterns, Promptfoo vs `agent-evals`); README related-package row for `03_04_gmail`.
- **S03E05 (non-deterministic models)** — §2.4 in `tasks/docs/boilerplate-documentation.md` (cognitive/wide-space vs hub ReAct, generative UI lesson map, `savethem` + toolsearch via `http_request`); README related-package row for `03_05_*`.
- **S04E01 (production deployments)** — §2.5 in `tasks/docs/boilerplate-documentation.md` (hub vs deployment profile, Digital Garden lesson map, sync/async, hypothesis testing); §5.2.1 Daytona row; README rows for `04_01_garden`; `lessons/04_01_garden/README.md`.
- **S04E02 (active collaboration)** — §2.6 in `tasks/docs/boilerplate-documentation.md` (interface channels CLI/MCP/messenger/custom, MCP host limits, meta-prompts pattern, multi-agent outside ReAct); §5.2.1 async orchestration note; README Quick decision row.
- **S04E03 (contextual collaboration)** — §2.7 in `tasks/docs/boilerplate-documentation.md` (background AI, SaaS integration patterns, agent isolation, system self-observation); README Quick decision row; `agent-evals/README.md` system self-observation section.

### Changed

- **`ai.ts`** — optional `temperature`; parses `usage` from Responses API into `ModelResponse`.
- **`ChatOptions.tracingMetadata`** — optional metadata for Langfuse generation spans.
- **`createAgent`** — optional `tracing` runtime (default noop); wraps runs in trace/agent spans; tools in tool spans.
- **Planning turn 0** — `generateResponse` receives **empty tools** (names only in instructions); fixes models that ignored `tool_choice: "none"` and skipped `[PLAN]`.
- **`ai.ts`** — plan text fallback from `reasoning` / `thought` output items when `output_text` is empty.
- **`http_request`** — Zod + runtime: POST requires JSON `body` (generic, no zmail constants in boilerplate).

### Fixed

- **`submit_to_hub` answer schema** — `answer` object values may include **arrays of strings** (e.g. drone `instructions`); tool description clarifies `apikey` is injected from env.
- **Responses API tool schemas** — `submit_to_hub` no longer uses `z.unknown()` for `answer` (invalid JSON Schema / HTTP 400). `mcpToolsToOpenAI` uses `sanitizeToolJsonSchema` + `strict: false` so `http_request` `body` (`z.record`) and optional fields stay valid.
- **`chat()` errors** — provider error responses now append a short JSON body hint for debugging.

---

## [0.1.0] — 2026-05-12

Initial package release.

### Added

- **`createAgent()`** — `createAgent` factory with ReAct loop, `MAX_ITERATIONS` guard, and `finish_task` exit signal. Supports `processQuery` (single-turn) and `processConversationTurn` (multi-turn) methods.
- **`createAIAdapter()`** — OpenAI Responses API adapter (`AIAdapter` interface) with exponential backoff on HTTP 429 and 503. Configurable via `AGENT_RETRY_BASE_DELAY_MS` and `AGENT_MAX_RETRY_ATTEMPTS`.
- **MCP layer** — `createBoilerplateMcpServer()` and `createMcpClient()` using in-process `InMemoryTransport`. `mcpToolsToOpenAI` converts MCP tool schemas to OpenAI strict function-calling format.
- **Native tools** — `finish_task` (terminates agent loop via `FinishTaskSignal`) and `ask_human` (blocks on `stdin` for human input).
- **MCP tools** — `http_request` (GET/POST with retry), `submit_to_hub` (hub verification + flag extraction), `read_file` (chunked local file reader), `analyze_image_vision` (base64 image → vision model text).
- **`MemoryHooks` scaffold** — `beforeTurn` / `afterTurn` lifecycle interface with no-op default; documents Observer/Reflector extension point for S02E05.
- **Logger** — ANSI-colored `[MYŚL]`, `[AKCJA]`, `[WYNIK]`, `[SYSTEM]` tags plus convenience aliases matching existing task conventions.
- **Zod types** — `MessageSchema`, `ToolCallSchema`, `ModelResponseSchema`, `McpContentSchema` and exported TypeScript types.
- **Default system prompt** — `src/prompts/system.md` template; tasks override by loading their own `.md` file.
- **`config.ts`** — Typed runtime configuration sourced from environment variables; re-exports `AI_API_KEY`, `RESPONSES_API_ENDPOINT`, `resolveModelForProvider` from `tasks/config.js`.
- **Tests** — `bun test` suite covering: Zod schema round-trips, AI adapter retry counting, and agent loop `finish_task` exit + `MAX_ITERATIONS` guard.
- **`README.md`** — Quick Start, environment variable table, minimal agent example, MCP usage, module map, and memory extension guide.

[Unreleased]: https://github.com/PiotrNie-Eversis/ai-devs-vol-4/compare/boilerplate-v0.1.0...HEAD
[0.1.0]: https://github.com/PiotrNie-Eversis/ai-devs-vol-4/releases/tag/boilerplate-v0.1.0
