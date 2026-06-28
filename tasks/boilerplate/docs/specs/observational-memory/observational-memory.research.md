# Observational Memory — research

**Task:** Analyse `lessons/02_05_agent` (Mastra Observational Memory pattern) and assess feasibility of implementing it in `tasks/boilerplate`.

**Status:** Research zaakceptowany; plan: [observational-memory.plan.md](observational-memory.plan.md).

**Sources:**

- `lessons/02_05_agent/` — lesson reference (Observer / Reflector / processor / persistence)
- `tasks/boilerplate/` — target runtime (`MemoryHooks`, `createAgent`, `config.ts`)
- `tasks/s02e03/src/observationalMemory.ts` — existing task-level OM wired to boilerplate patterns
- `tasks/docs/boilerplate-documentation.md` §4.3 — spec intent (S02E05)
- [Mastra — Observational Memory](https://mastra.ai/blog/observational-memory)

---

## 1. Executive summary

**Verdict: YES — Observational Memory can be implemented in `tasks/boilerplate`.**

OM **nie zastępuje** markdownowej bazy wiedzy (*vault*, S04E04) — kompresuje historię **jednej sesji** ReAct, nie trwałe notatki między triggerami. Patrz [§2.8 Personal knowledge base](../../../../docs/boilerplate-documentation.md#28-personal-knowledge-base-for-ai-s04e04) oraz akapit w [§4.3 spec](../../../../docs/boilerplate-documentation.md#43-zarządzanie-pamięcią-srcagentmemoryts--observational_memory).

The boilerplate was **explicitly designed** for this extension:

- `createAgent` calls `memory.beforeTurn()` before every LLM call and `memory.afterTurn()` after tool results.
- `config.ts` already exports `OBSERVER_THRESHOLD_TOKENS` and `REFLECTOR_THRESHOLD_TOKENS`.
- `memory.ts` documents the extension point and points to `tasks/s02e03` as a reference.
- `tasks/s02e03` already implements a working (simpler) OM on top of the same hook contract.

The lesson package (`02_05_agent`) is a **richer, session-oriented** variant of the same Mastra pattern. Porting it into boilerplate is an **enhancement**, not a greenfield — mainly consolidating scattered task-level code and aligning with the lesson’s structured observation format, tail-budget splitting, and optional persistence.

---

## 2. How Observational Memory works

### 2.1 Problem

Long agent runs accumulate conversation + tool I/O until the context window overflows or cost/latency degrades. Truncating raw history loses facts (paths, hub flags, user decisions).

### 2.2 Core idea (Mastra OM)

Split context into two layers:

```text
┌─────────────────────────────────────────────────────────────┐
│  System instructions                                        │
│  ├── base system prompt                                     │
│  └── <observations> … compressed memory … </observations>   │
├─────────────────────────────────────────────────────────────┤
│  Active input (Responses API items)                         │
│  └── recent unobserved messages (raw tail)                  │
└─────────────────────────────────────────────────────────────┘
```

Older messages are **sealed** (removed from active input) after an **Observer** LLM pass converts them into durable **observations** — bullet facts tagged by source (`[user]`, `[assistant]`, `[tool:name]`) with priority markers.

When observations grow too large, a **Reflector** LLM pass compresses the observation block (multi-level retry until under target token budget).

### 2.3 Control flow (lesson `processor.ts`)

Called **before each agent turn** (`processMemory`):

1. **Measure** unobserved tail token count (`messages.slice(lastObservedIndex)`).
2. **Below threshold** → passthrough: inject existing observations into system prompt if any; keep full or trimmed message list.
3. **Above threshold** → **Observer**:
   - Split unobserved messages into **head** (to seal) and **tail** (keep raw) via `splitByTailBudget` (~30% of threshold, min 120 tokens).
   - LLM extracts new observations from head (XML: `<observations>`, `<current-task>`, `<suggested-response>`).
   - Append to `activeObservations`, advance `lastObservedIndex`, update token counts.
   - Persist observer log to `workspace/memory/observer-NNN.md`.
4. **If observations exceed reflection threshold** and grew enough since last reflection → **Reflector**:
   - Try compression levels 0→2 until under `reflectionTargetTokens`.
   - Replace `activeObservations`, bump `generationCount`, persist reflector log.
5. **Build context** — system prompt + observation appendix + only unobserved tail messages.

**Guard:** Observer runs at most **once per HTTP request** (`_observerRanThisRequest`) to avoid runaway cost within a single user message that triggers many tool rounds.

**Flush:** `flushMemory` force-observes remaining tail at session end.

### 2.4 State model (lesson)

| Field | Role |
| --- | --- |
| `activeObservations` | Accumulated observation text |
| `lastObservedIndex` | Index into `messages[]` — everything before is sealed |
| `observationTokenCount` | Estimated size of observations |
| `generationCount` | Reflector generation (for logging / continuity) |
| `calibration` | Ratio actual/estimated tokens from API usage |
| `_observerRanThisRequest` | Per-request observer cap |
| `_lastReflectionOutputTokens` | Hysteresis — reflect only after sufficient growth |

### 2.5 Observer / Reflector prompts (lesson)

- **Observer:** Structured XML bullets with 🔴/🟡/🟢 priority, source tags, no duplication of prior observations.
- **Reflector:** Rewrites entire observation memory; `[user]` facts highest priority; progressive compression guidance per level.

### 2.6 s02e03 variant (already in repo)

Simpler OM used in a course task:

- Journal stored in a **file** (`journalPath`).
- Plain-text lines (no XML tags).
- Seals by **item count** (`minTail` items) in a `while` loop until under threshold.
- Uses task-local `chat()` helper, not boilerplate `AIAdapter`.
- Injected block: `### Observational memory (sealed prior turns)`.

Same two-phase logic (Observer seal → Reflector compress), weaker structure, easier to debug.

---

## 3. Current boilerplate fit

### 3.1 Integration point (`agent.ts`)

```typescript
if (memory?.beforeTurn) {
  const prep = await memory.beforeTurn({ conversation, instructions, iteration });
  conversation = prep.conversation;
  currentInstructions = prep.instructions;
}
```

Hook receives Responses API `conversation` items and returns trimmed conversation + instructions with journal/observations injected. **No agent.ts changes required** for basic OM.

### 3.2 Existing scaffold (`memory.ts`)

- `MemoryHooks` interface: `beforeTurn`, `afterTurn`.
- `noopMemoryHooks` default.
- `estimateTokens()` helper (chars/4).

### 3.3 Config readiness (`config.ts`)

Already present:

- `OBSERVER_THRESHOLD_TOKENS` (default 30_000)
- `REFLECTOR_THRESHOLD_TOKENS` (default 60_000)

Missing vs lesson (would need adding if porting lesson fidelity):

- `REFLECTION_TARGET_TOKENS`, observer/reflector model names, max output tokens, tail ratio, persistence path, `OM_MODEL`, per-iteration observer cap policy.

### 3.4 Gap vs lesson package

| Capability | Lesson `02_05_agent` | Boilerplate today | s02e03 |
| --- | --- | --- | --- |
| Observer / Reflector | ✓ full | scaffold only | ✓ simplified |
| Tail preservation | token budget split | — | item count |
| Structured observations | XML + tags | — | plain lines |
| Token calibration | API usage ratio | chars/4 only | chars/4 only |
| Persistence logs | `workspace/memory/*.md` | — | journal file |
| Session / multi-turn HTTP | ✓ | via `processConversationTurn` | script runs |
| Once-per-request observer cap | ✓ | — | loop until under threshold |
| `enablePlanningPhase` coexistence | N/A | documented concern | used in failure task |

---

## 4. Implementation options

### Option A — Port lesson module into boilerplate (recommended for course alignment)

Add e.g. `src/agent/observational_memory/`:

- `observer.ts`, `reflector.ts`, `processor.ts`, `context.ts`, `prompts.ts`, `persistence.ts`
- `createObservationalMemoryHooks(config)` returning `MemoryHooks`
- Stateful object holding `MemoryState` (not file-based session — in-memory per agent instance)
- Use boilerplate `AIAdapter` for Observer/Reflector calls (with retry/backoff)
- Prompts in `src/prompts/observer.md`, `reflector.md` (repo convention)

**Pros:** Matches S02E05 lesson; richer memory quality; calibration; debug logs.

**Cons:** Larger surface; extra LLM cost; must define policy for ReAct loop (once per iteration vs once per user query).

### Option B — Promote s02e03 `observationalMemory.ts` into boilerplate

Move and adapt existing task code to use `AIAdapter` + `MemoryHooks`.

**Pros:** Smaller diff; already battle-tested in s02e03; easier for students to read.

**Cons:** Less aligned with lesson XML format; weaker fact prioritization; no calibration.

### Option C — Keep OM in tasks only (status quo)

Boilerplate stays scaffold; each task implements `MemoryHooks` (s02e04 mailbox pattern, s02e03 OM).

**Pros:** Zero boilerplate complexity; tasks choose memory strategy.

**Cons:** Duplication; spec §4.3 / README promise “Observer/Reflector in boilerplate” remains unfulfilled.

---

## 5. Advantages of Observational Memory (in boilerplate)

| Advantage | Explanation |
| --- | --- |
| **Long-horizon tasks** | Agents can run many ReAct iterations without losing sealed facts (hub flags, file paths, errors). |
| **Cost control** | Raw tool JSON is sealed early; only compact observations stay in system prompt. |
| **Better than naive truncation** | Observer preserves structured facts with source attribution; Reflector merges duplicates intentionally. |
| **Fits existing architecture** | `MemoryHooks` + thresholds in config — no LangChain-style black box. |
| **Educational clarity** | Two explicit LLM roles (Observer / Reflector) teach context engineering. |
| **Composable** | Can coexist with domain hooks (s02e04 mailbox journal) if instructions blocks are merged carefully. |
| **Debuggability** | Lesson persistence (`observer-NNN.md`) gives auditable memory evolution. |

---

## 6. Disadvantages and risks

| Risk | Detail | Mitigation |
| --- | --- | --- |
| **Extra LLM calls** | Each observer/reflector pass adds latency + cost. | Thresholds, once-per-turn cap, cheaper OM model (`gpt-4o-mini`). |
| **Information loss** | Reflector explicitly drops content; bad compression loses facts. | Conservative reflector prompts; `[user]` priority rules; tests on golden journals. |
| **Stale / wrong observations** | Observer may mis-summarize tool output. | Source tags; keep recent tail raw; truncation limits on tool payloads in observer input. |
| **Planning phase conflict** | `## Working plan` in instructions may be trimmed if stored only in conversation. | Keep plan in instructions (already done by planning phase); do not seal plan-only turns, or mirror plan in observations. |
| **Hook state lifetime** | Boilerplate `createAgent` is stateless unless hooks hold state. | Factory `createObservationalMemoryHooks()` returns closure over `MemoryState`. |
| **Iteration vs request semantics** | Lesson caps observer per HTTP request; ReAct loop has many LLM calls per user message. | Policy choice: cap per `processQuery` / `processConversationTurn` run, not per iteration. |
| **Dual memory systems** | Tasks like s02e04 add mailbox journal + OM — overlap. | Document layering: procedural plan vs declarative facts vs OM sealed history. |
| **Test complexity** | Observer/reflector need mocked LLM or integration tests. | Unit tests for split/parse/token estimate; optional fixture-based integration. |
| **Provider coupling** | Lesson uses OpenAI Responses API directly; boilerplate uses `AIAdapter`. | Extend adapter or add dedicated `generateMemoryPass()` if tool-free completions differ. |

---

## 7. Mapping lesson → boilerplate

| Lesson component | Boilerplate target |
| --- | --- |
| `processMemory()` | `MemoryHooks.beforeTurn()` |
| `Session.memory` | Closure state in `createObservationalMemoryHooks()` |
| `Session.messages` | `beforeTurnContext.conversation` |
| `baseSystemPrompt` | `beforeTurnContext.instructions` (base part before appendix) |
| `runObserver` / `runReflector` | Calls via `AIAdapter.generateResponse` (no tools, low temperature) |
| `prompts.ts` | `src/prompts/observer.md`, `reflector.md` |
| `persistence.ts` | Optional; env `OM_PERSIST_DIR` |
| `flushMemory` | `afterTurn` on final iteration or explicit `flush()` export |
| Token calibration | Optional phase 2 — boilerplate `ai.ts` may expose usage for calibration |

---

## 8. Open questions (for plan phase)

1. **Option A vs B** — full lesson port or promote s02e03 simplification?
2. **Observer frequency** — once per user turn, once per ReAct iteration, or hybrid (lesson: once per request)?
3. **Default enablement** — opt-in via `memory: createObservationalMemoryHooks()` or env `AGENT_ENABLE_OBSERVATIONAL_MEMORY`?
4. **Persistence** — required for boilerplate or optional debug feature?
5. **Model** — separate `OM_MODEL` env or reuse `AGENT_MODEL`?
6. **Migration** — refactor s02e03 to import from boilerplate after implementation?

---

## 9. Suggested next steps

1. **Human approval** of this research (Option A / B / scope).
2. **Plan** (`observational-memory.plan.md`): modules, env vars, tests, s02e03 migration, planning-phase interaction.
3. **Implement** in boilerplate; run `bun test` + `bunx tsc --noEmit`.
4. **Optional:** thin s02e03 wrapper importing boilerplate factory.

---

## 10. Acceptance criteria (for future implementation)

- [ ] `createObservationalMemoryHooks()` exported from `@ai-devs/agent-boilerplate`.
- [ ] When conversation estimate exceeds `OBSERVER_THRESHOLD_TOKENS`, oldest items sealed into observations; tail retained.
- [ ] When observations exceed `REFLECTOR_THRESHOLD_TOKENS`, reflector compresses journal.
- [ ] Observations injected into instructions; sealed items removed from `conversation` passed to LLM.
- [ ] Default behaviour unchanged (`noopMemoryHooks`).
- [ ] Unit tests for split logic, XML/tag parsing, threshold gating.
- [ ] README + `.env.example` updated with OM variables.
