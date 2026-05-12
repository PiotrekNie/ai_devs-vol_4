# Research: Agent Boilerplate Package (`tasks/boilerplate/`)

**Date:** 2026-05-12  
**Status:** Approved for implementation

---

## 1. Current state of tasks/

After reading all active task directories, the agent pattern is duplicated across episodes with slight variations:

| Episode | Language | Agent style | MCP | Retry/Backoff | Memory |
|---------|----------|-------------|-----|---------------|--------|
| s01e03 | JS | `createAgent` factory (handler map) | ✓ (InMemory) | ✗ | ✗ |
| s01e04 | TS | `runAgentTurn` flat function | ✗ | ✗ | ✗ |
| s02e02 | TS | Custom OpenRouter loop | ✓ (InMemory) | ✗ | ✗ |
| s02e03 | TS | `createAgent` factory (handler map) | ✓ (InMemory) | ✗ | ✓ (Observer/Reflector) |

The **s02e03** `createAgent` / `chat` / `observationalMemory` pattern is the most mature and closest to the target spec. The boilerplate package will generalize it.

---

## 2. Decisions

### 2.1 Package path
`tasks/boilerplate/` — alongside `tasks/shared/`. Episodes consume it via:
```json
"@ai-devs/agent-boilerplate": "file:../boilerplate"
```
(path must be adjusted per episode nesting; `../boilerplate` works for all top-level `tasks/sXXeYY/`.)

### 2.2 LLM SDK choice
All existing tasks use the **OpenAI Responses API** directly via raw `fetch`, sharing `tasks/config.js` for provider selection (OpenAI vs OpenRouter). The boilerplate re-exports from `../config.js` (i.e., `tasks/config.js`) and does **not** introduce a separate LLM SDK dependency. This preserves the existing zero-extra-deps pattern.

### 2.3 MCP process model
**In-process `InMemoryTransport`** (from `@modelcontextprotocol/sdk`). Every task uses linked-pair in-memory transport — no subprocess startup needed. MCP server and client live in the same process.

### 2.4 Dependencies
- `@modelcontextprotocol/sdk: ^1.29.0` (matches s02e03)
- `zod: ^4.3.6` (matches s02e03; confirmed compatible with MCP SDK's `registerTool`)
- `@types/bun: latest` (dev)
- No new dependencies beyond these three.

### 2.5 `analyze_image_vision`
Optional at runtime — requires a vision-capable model set via `AGENT_VISION_MODEL` env var (defaults to `gpt-4o-mini`). Reads local files, encodes base64, sends to Responses API with `input_image` content type.

### 2.6 Retry/backoff
Implemented in two places: `src/agent/ai.ts` (LLM calls) and `src/tools/mcp/http_request.ts` (course API calls). Both use the same `fetchWithRetry` helper with configurable base delay (`AGENT_RETRY_BASE_DELAY_MS`, default 1000ms) and max attempts (`AGENT_MAX_RETRY_ATTEMPTS`, default 5). Status codes 429 and 503 trigger retry.

### 2.7 Observer/Reflector (memory)
`src/agent/memory.ts` exports a `MemoryHooks` interface and a no-op default implementation. The `createAgent` loop calls hooks before each LLM call. Full Observer/Reflector implementation is intentionally deferred per spec §6 (S02E05). The `ObservationalMemory` class from s02e03 is the reference for future extension.

### 2.8 Overlap with `tasks/shared/`
`tasks/shared/` contains domain-specific helpers: `jobTagging.ts`, `filterPeople.ts`, `fetchPeople.ts`. None of these are moved. The boilerplate owns **agent runtime** primitives only.

---

## 3. Risks

| Risk | Mitigation |
|------|-----------|
| Bun path resolution for `file:../boilerplate` across nested episode dirs | Pilot integration in s02e03 (same level) validates the pattern; deeper nesting can adjust the path |
| Zod v4 + MCP SDK compatibility | Already verified: s02e03 uses both versions together without issues |
| `tasks/config.js` import from within package | Relative import `../config.js` resolves correctly because Bun resolves relative to the file's own location, not the consuming package |
| `analyze_image_vision` requires vision model key | Tool is guarded with a clear error if model is not reachable; disabled by omitting from server registration if `AGENT_VISION_MODEL` is unset |
