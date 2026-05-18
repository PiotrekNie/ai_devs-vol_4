# Changelog

All notable changes to **@ai-devs/agent-boilerplate** are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Planning phase (turn 0)** — opt-in `enablePlanningPhase` on `createAgent`: one `tool_choice: "none"` turn before the ReAct loop (logged as `[PLAN]`), injects `## Working plan` into instructions; does not count toward `MAX_ITERATIONS`. `AGENT_PLANNING_MAX_OUTPUT_TOKENS` (default 1024). Helpers exported from `src/agent/planning.ts`.

### Fixed

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
