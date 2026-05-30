# Plan wdrożenia — Observability & evals (Opcja B + agent-evals)

**Normatywny research:** [agent-observability-evals.research.md](agent-observability-evals.research.md) — **zaakceptowany** (Opcja B; Faza 1 tracing; pakiet evalów).  
**Workspace:** `tasks/boilerplate/` (`@ai-devs/agent-boilerplate`), `tasks/agent-evals/` (`@ai-devs/agent-evals`)  
**Referencja lekcji:** `lessons/03_01_observability/`, `lessons/03_01_evals/`

Ten dokument jest planem wdrożenia zgodnym z `@eversis-implement`: typy zadań `[CREATE]` / `[MODIFY]` / `[REUSE]`. **Implementacja kodu** następuje po akceptacji tego planu przez człowieka.

**Weryfikacja UI:** brak — runtime agenta, telemetria Langfuse, harness evalów (terminal / Langfuse UI).

**Poza zakresem tego planu:**

- Homework S03E01 (`evaluation` / anomalie sensorów) — osobny task `tasks/s03e01/` (logika domenowa, batch 10k plików).
- Włączenie tracingu globalnie dla wszystkich epizodów (domyślnie **off**).
- HTTP server sesji (`POST /api/chat`) — zostaje w lekcjach.
- Wbudowany redactor PII w boilerplate — **polityka na poziomie tasku** (docs only).
- Eval experiments w CI na PR — tylko **dokumentacja lokalnego** uruchomienia.
- Wariant D (`composeHooks` OM + tracing) — follow-up po stabilizacji Fazy 1.
- Online eval / guardrails produkcyjne.

---

## 1. Zakres (scope)

### 1.1 `@ai-devs/agent-boilerplate` — opt-in tracing (Opcja B, Faza 1)

| Element | Opis |
| --- | --- |
| **Moduł** | `src/observability/` — port wzorca z `lessons/03_01_observability/src/core/tracing/` |
| **Subpath export** | `@ai-devs/agent-boilerplate/observability` — Langfuse **tylko** przy imporcie tej ścieżki |
| **No-op runtime** | `src/observability/noop.ts` — zero importów Langfuse; domyślny runtime w `createAgent` |
| **API** | `initTracing`, `shutdownTracing`, `flushTracing`, `isTracingActive`, `withTracingAdapter`, `createTracingRuntime` |
| **Integracja agenta** | `AgentConfig.tracing?: TracingRuntimeOptions` — spany agent / generation / tool w pętli ReAct |
| **Konfiguracja** | env `LANGFUSE_*` w `config.ts` + tabela w README |
| **peerDependencies** | `@langfuse/tracing`, `@langfuse/otel`, `@opentelemetry/sdk-node`, `@opentelemetry/api` |
| **Domyślne zachowanie** | Bez zmian — brak spanów, brak wymogu Langfuse przy `createAgent` |
| **Testy** | Mock runtime + testy no-op; `bun test` bez kluczy Langfuse i bez sieci |

### 1.2 `@ai-devs/agent-evals` — nowy pakiet

| Element | Opis |
| --- | --- |
| **Lokalizacja** | `tasks/agent-evals/` |
| **Źródło** | Port `lessons/03_01_evals/experiments/lib/` + wzorce evaluatorów |
| **API** | `bootstrapExperiment`, `ensureDataset`, `syncDatasetItems`, `loadJsonFile`, helper evaluators |
| **Szablony** | `templates/datasets/tool-use.synthetic.json`, `response-correctness.synthetic.json` |
| **Przykład** | `examples/tool-use.ts` — standalone script (jak lekcja, bez HTTP servera) |
| **peerDependencies** | `@langfuse/client`, `@ai-devs/agent-boilerplate` (opcjonalnie dla przykładów z ReAct) |
| **Konsument** | Taski / maintainer lokalnie; **nie** CI |

### 1.3 Dokumentacja

| Element | Opis |
| --- | --- |
| **README boilerplate** | Sekcja „Observability (S03E01)” — OM vs Langfuse, opt-in, subpath, peer deps |
| **README agent-evals** | Quick start, env, lokalne `bun run example:tool-use` |
| **boilerplate-documentation.md** | Nowy § observability + link do agent-evals |
| **CHANGELOG** | Oba pakiety [Unreleased] |
| **tasks/.env.example** | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL` |

---

## 2. Decyzje projektowe (zatwierdzone)

| # | Decyzja |
| --- | --- |
| 1 | **Opcja B** — opt-in tracing w boilerplate (Faza 1), nie tylko docs. |
| 2 | **peerDependencies** — Langfuse w boilerplate i agent-evals; task dodaje pakiety gdy włącza tracing/evals. |
| 3 | **Subpath `/observability`** — domyślny import z głównego pakietu **nie** wymaga Langfuse. |
| 4 | **Osobny `@ai-devs/agent-evals`** — harness evalów, nie w core boilerplate. |
| 5 | **PII** — redakcja / polityka danych **na poziomie tasku**; boilerplate tylko ostrzeżenie w README. |
| 6 | **CI** — eval experiments **nie** na PR; udokumentować lokalne uruchomienie. |
| 7 | **Tracing off by default** — żaden istniejący epizod nie wymaga migracji. |
| 8 | **Wersje Langfuse** — wyrównać do `03_01_evals` (`@langfuse/tracing` / `@langfuse/otel` ^4.6.x, `@langfuse/client` ^4.6.x). |

---

## 3. Analiza stanu obecnego (gap)

| Komponent | Stan | Gap |
| --- | --- | --- |
| `tasks/boilerplate/src/agent/agent.ts` | ReAct loop, `dispatchToolCall`, planning turn | Brak hooków tracing; brak `tracing` w `AgentConfig` |
| `tasks/boilerplate/src/agent/ai.ts` | `AIAdapter`, `ModelResponse.usage` | Brak dekoratora generation span |
| `tasks/boilerplate/package.json` | Brak Langfuse | peerDependencies + exports subpath |
| `tasks/boilerplate/index.ts` | Eksport OM, discovery | Brak observability (subpath osobno) |
| `lessons/03_01_observability/` | Pełny tracing stack | Do adaptacji (Responses API items) |
| `lessons/03_01_evals/experiments/` | tool-use + response-correctness | Do portu jako `agent-evals` |
| `tasks/agent-evals/` | Nie istnieje | Utworzyć pakiet |
| Dokumentacja | OM opisane | Brak sekcji Langfuse / evals |

---

## 4. Architektura docelowa

### 4.1 Tracing — przepływ (boilerplate)

```text
Task index.ts (opcjonalnie)
  │
  ├─ import { initTracing, createTracingRuntime, withTracingAdapter }
  │    from "@ai-devs/agent-boilerplate/observability"
  ├─ initTracing({ serviceName: "sXXeYY" })   // no-op bez LANGFUSE_*
  │
  └─ createAgent({
       ai: withTracingAdapter(createAIAdapter({ model })),
       tracing: createTracingRuntime({ sessionId, traceName }),
       ...
     })
       │
       └─ processQuery / processConversationTurn
             │
             ├─ tracing.withTrace({ sessionId, input: query }, () =>
             │     tracing.withAgent({ agentId, task }, () =>
             │       runLoop(...)
             │     ))
             │
             └─ runLoop (iteracja i)
                   ├─ ai.generateResponse  → generation#N (adapter wrapper)
                   └─ dispatchToolCall     → tool#N (runtime.withTool)
```

**Hierarchia spanów (zgodna z lekcją):**

```text
chat-request / trace
└── agent (np. episode id)
    ├── generation#1
    ├── tool#1
    ├── generation#2
    └── ...
```

**Metadata obowiązkowe w planie implementacji:**

- `iteration`, `phase: "react" | "planning"` (turn 0)
- `toolCount` / aktywne narzędzia gdy `toolDiscovery` włączone
- `usage` z `ModelResponse` w `generation.end`

### 4.2 Evals — przepływ (agent-evals)

```text
tasks/sXXeYY/evals/tool-use.ts   (przykład konsumenta — poza tym planem)
  │
  ├─ import { bootstrapExperiment, toolUseEvaluator, ... } from "@ai-devs/agent-evals"
  ├─ bootstrapExperiment({ name: "tool_use" })
  ├─ ensureDataset + syncDatasetItems
  └─ dataset.runExperiment({ task, evaluators, runEvaluators })
        │
        └─ task(item) → uruchamia agenta epizodu (inject przez konsumenta)
```

Pakiet **nie** embeduje logiki homework sensorów — tylko generyczne evaluators i dataset utilities.

### 4.3 Współistnienie z OM i tool discovery

| Feature | Interakcja z tracing |
| --- | --- |
| **Observational Memory** | Niezależne; opcjonalnie metadata span „memory/observer” w follow-up (poza tym planem) |
| **Planning turn 0** | Osobna generacja z `metadata.phase = "planning"` |
| **Tool discovery** | W generation metadata: `activeToolCount`, `discoveryEnabled: true` |

---

## 5. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| Import Langfuse bez peer → błąd modułu | Subpath `/observability`; `agent.ts` importuje tylko `noop.ts` |
| `bun test` wymaga Langfuse | devDependencies w boilerplate + testy na noop runtime |
| Rozjazd wersji SDK Langfuse | Jedna wersja ^4.6.x w obu pakietach; lock w agent-evals |
| Trace zawiera PII / klucze API | README: polityka task-level; nie logować env secrets; truncate dużych tool output (reuse `MAX_TOOL_OUTPUT_CHARS` w metadata) |
| Koszt evalów lokalnie | `confirmExperiment()` jak lekcja; docs: wymaga OPENAI + LANGFUSE |
| Planning + ReAct w jednym trace | Jeden trace na `processQuery`; turn counter w context |
| Flush trace loss | `flushTracing()` w docs — wołać w `finally` w task index |

---

## 6. Kryteria akceptacji (Definition of Done)

### Boilerplate tracing

- [ ] Domyślny `createAgent({ ... })` bez `tracing` — identyczne zachowanie jak przed zmianą.
- [ ] `import from "@ai-devs/agent-boilerplate"` — **nie** wymaga pakietów Langfuse.
- [ ] `initTracing()` bez `LANGFUSE_*` — no-op, brak throw.
- [ ] Włączony tracing + klucze + `createTracingRuntime` — trace z generation#N i tool#N w Langfuse UI.
- [ ] `withTracingAdapter` przekazuje `usage` do span generation.
- [ ] `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate/` — OK bez sieci.

### Pakiet agent-evals

- [ ] `tasks/agent-evals/` z `package.json`, `bun test`, `bunx tsc --noEmit`.
- [ ] Eksport `bootstrapExperiment`, dataset helpers, `toolUseEvaluator`, `createAvgScoreEvaluator`.
- [ ] `examples/tool-use.ts` uruchamialny lokalnie (documented; wymaga env).
- [ ] Brak logiki domenowej homework S03E01.

### Dokumentacja

- [ ] README rozróżnia Observational Memory vs Observability (Langfuse).
- [ ] Opisane peerDependencies i subpath import.
- [ ] Evals: lokalnie only, bez CI.
- [ ] CHANGELOG obu pakietów zaktualizowany.

---

## 7. Plan fazowy i zadania

### Część A — Boilerplate: fundament observability

#### Faza A — Typy, noop, konfiguracja

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| A1 | [CREATE] | **`src/observability/types.ts`:** `TracingRuntime`, `TracingRuntimeOptions`, `TraceParams`, `GenerationHandle`, `Usage` — bez importów Langfuse. | [ ] Typy używane w agent + observability. |
| A2 | [CREATE] | **`src/observability/noop.ts`:** `noopTracingRuntime` — pass-through `withTrace`, `withAgent`, `withTool`; no-op adapter wrapper helper. | [ ] Domyślny runtime agenta. |
| A3 | [MODIFY] | **`config.ts`:** `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`, `TRACING_SERVICE_NAME` (default `@ai-devs/agent-boilerplate`). | [ ] Eksport stałych / reader env. |
| A4 | [MODIFY] | **`package.json`:** `peerDependencies` Langfuse + OTEL; `devDependencies` te same dla testów; `exports["./observability"]`. | [ ] `bun install` w boilerplate bez peer u konsumenta nadal OK dla głównego importu. |

#### Faza B — Port tracing z lekcji

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| B1 | [CREATE] | **`src/observability/init.ts`:** port `initTracing`, `shutdownTracing`, `flushTracing`, `isTracingActive` z lekcji (graceful bez kluczy). | [ ] Test: brak env → `isTracingActive() === false`. |
| B2 | [CREATE] | **`src/observability/context.ts`:** turn counter, `formatGenerationName`, `formatToolName`, AsyncLocalStorage / kontekst agenta (port z lekcji). | [ ] Test: increment turn per generation. |
| B3 | [CREATE] | **`src/observability/tracer.ts`:** `withTrace`, `withAgent`, `startGeneration`, `withTool` — port z `lessons/03_01_observability/src/core/tracing/tracer.ts`. | [ ] Testy z mock `isTracingActive false` → fn wykonane bez throw. |
| B4 | [CREATE] | **`src/observability/tracing-adapter.ts`:** `withTracingAdapter(ai: AIAdapter): AIAdapter` — format input Responses API, `generation.end({ output, usage })`. | [ ] Test mock AIAdapter + mock generation handle. |
| B5 | [CREATE] | **`src/observability/runtime.ts`:** `createTracingRuntime(options)` → `TracingRuntime` łączący tracer + noop fallback. | [ ] Eksport z `observability/index.ts`. |
| B6 | [CREATE] | **`src/observability/index.ts`:** public surface subpath. | [ ] Dokumentacja import path w README. |

#### Faza C — Integracja z `createAgent`

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| C1 | [MODIFY] | **`src/agent/agent.ts` — `AgentConfig`:** `tracing?: TracingRuntimeOptions`; domyślnie `noopTracingRuntime`. | [ ] Brak breaking change dla istniejących call sites. |
| C2 | [MODIFY] | **`agent.ts` — `dispatchToolCall`:** opcjonalnie owija `handler.execute` w `runtime.withTool({ name, input, callId })`. | [ ] Tool span tylko gdy runtime ≠ noop i tracing active. |
| C3 | [MODIFY] | **`agent.ts` — `runLoop`:** owija `ai.generateResponse` context (iteration metadata przez adapter). | [ ] Metadata `iteration` w generation span. |
| C4 | [MODIFY] | **`agent.ts` — `processQuery` / `processConversationTurn`:** owija `startRun` w `withTrace` + `withAgent`. | [ ] `sessionId` z options; trace input = user query. |
| C5 | [MODIFY] | **`agent.ts` — planning turn:** przekazać do adaptera metadata `phase: "planning"` (via `ChatOptions` rozszerzenie lub tracing context). | [ ] Planning widoczny jako osobna generacja w trace. |
| C6 | [MODIFY] | **`src/agent/ai.ts` — `ChatOptions`:** opcjonalne `tracingMetadata?: Record<string, unknown>` przekazywane do adapter wrapper (jeśli potrzebne). | [ ] Backward compatible. |

#### Faza D — Testy boilerplate

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| D1 | [CREATE] | **`src/observability/noop.test.ts`**, **`tracing-adapter.test.ts`**, **`runtime.test.ts`**. | [ ] Bez live Langfuse. |
| D2 | [CREATE] | **`src/agent/agent.tracing.test.ts`:** agent z mock `TracingRuntime` recording calls — tool + query lifecycle. | [ ] Domyślny agent bez tracing — brak wywołań mock. |
| D3 | [REUSE] | `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate/`. | [ ] Zero failures. |

#### Faza E — Dokumentacja boilerplate

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| E1 | [MODIFY] | **`README.md`:** sekcja Observability — subpath, peer deps, przykład, OM vs Langfuse, PII warning, `flushTracing` w finally. | [ ] Copy-paste example. |
| E2 | [MODIFY] | **`CHANGELOG.md`:** [Unreleased] tracing opt-in. | [ ] Keep a Changelog. |
| E3 | [MODIFY] | **`tasks/docs/boilerplate-documentation.md`:** § observability (hierarchia spanów, opt-in). | [ ] Link do agent-evals. |
| E4 | [MODIFY] | **`tasks/.env.example`:** zmienne Langfuse. | [ ] Udokumentowane. |

---

### Część B — Pakiet `@ai-devs/agent-evals`

#### Faza F — Szkielet pakietu

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| F1 | [CREATE] | **`tasks/agent-evals/package.json`:** name `@ai-devs/agent-evals`, `type: module`, scripts test/typecheck, peerDeps `@langfuse/client`, opcjonalnie boilerplate. | [ ] `bun install` w katalogu pakietu. |
| F2 | [CREATE] | **`tasks/agent-evals/tsconfig.json`:** strict, ESNext (jak boilerplate). | [ ] `tsc --noEmit` OK. |
| F3 | [CREATE] | **`tasks/agent-evals/index.ts`:** barrel exports. | [ ] Public API minimal. |

#### Faza G — Port harness z lekcji

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| G1 | [CREATE] | **`src/dataset.ts`:** port `ensureDataset`, `syncDatasetItems`, `loadJsonFile`, typ `DatasetItemSeed`. | [ ] Test load JSON fixture. |
| G2 | [CREATE] | **`src/helpers.ts`:** port `asArray`, `toCaseInput`, `extractToolNames`, `createAvgScoreEvaluator`, `confirmExperiment`. | [ ] Test extractToolNames na sample messages. |
| G3 | [CREATE] | **`src/bootstrap.ts`:** `bootstrapExperiment({ name, serviceName? })` — LangfuseClient, opcjonalnie `initTracing` z boilerplate observability subpath. | [ ] `shutdown()` flush + cleanup. |
| G4 | [CREATE] | **`src/evaluators/tool-use.ts`:** port `toolUseEvaluator` z lekcji (generic). | [ ] Test scoring na fixture output. |
| G5 | [CREATE] | **`src/evaluators/response-correctness.ts`:** port reguł exact_number, iso timestamp, relevance stub. | [ ] Test per type. |

#### Faza H — Szablony i przykład

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| H1 | [CREATE] | **`templates/datasets/tool-use.synthetic.json`:** kopia / adaptacja z lekcji. | [ ] Valid JSON. |
| H2 | [CREATE] | **`templates/datasets/response-correctness.synthetic.json`:** j.w. | [ ] Valid JSON. |
| H3 | [CREATE] | **`examples/tool-use.ts`:** minimal runner (mock task lub inject callback) — dokumentuje wzorzec bez HTTP server. | [ ] README opisuje uruchomienie lokalne. |
| H4 | [CREATE] | **`README.md`:** quick start, env, peer deps, **brak CI**, link do lekcji `03_01_evals`. | [ ] |

#### Faza I — Testy agent-evals

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| I1 | [CREATE] | **`src/helpers.test.ts`**, **`src/evaluators/tool-use.test.ts`**. | [ ] Bez sieci. |
| I2 | [REUSE] | `bun test` + `bunx tsc --noEmit` w `tasks/agent-evals/`. | [ ] Zero failures. |

---

### Część C — Zamknięcie spec

#### Faza J — Research & cross-links

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| J1 | [MODIFY] | **`agent-observability-evals.research.md`:** status zaakceptowany; §11 decyzje zamknięte; link do planu. | [ ] |
| J2 | [MODIFY] | **`tasks/boilerplate/README.md`:** link do `docs/specs/agent-observability-evals/`. | [ ] |

---

## 8. Zmienne środowiskowe

| Zmienna | Pakiet | Domyślnie | Opis |
| --- | --- | --- | --- |
| `LANGFUSE_PUBLIC_KEY` | boilerplate / evals | — | Wymagane do aktywnego tracingu |
| `LANGFUSE_SECRET_KEY` | boilerplate / evals | — | j.w. |
| `LANGFUSE_BASE_URL` | boilerplate / evals | `https://cloud.langfuse.com` | Endpoint Langfuse |
| `TRACING_SERVICE_NAME` | boilerplate | `@ai-devs/agent-boilerplate` | OTEL service name |

Eval experiments wymagają także `OPENAI_API_KEY` / `OPENROUTER_API_KEY` (jak dotychczas w taskach).

---

## 9. Wytyczne testowe

- **Boilerplate:** testy na `noopTracingRuntime` i mock runtime; **zero** live Langfuse w CI.
- **Tracing adapter:** mock `AIAdapter` + spy na generation handle.
- **Agent integration:** mock runtime rejestruje `withTool` / `withTrace` calls.
- **agent-evals:** testy evaluatorów i parserów dataset — deterministyczne, bez API.
- **Ręczne (maintainer):** klucze Langfuse → `processQuery` z tracing → weryfikacja w UI; opcjonalnie `examples/tool-use.ts`.

---

## 10. Bezpieczeństwo

- Trace generation zawiera instructions + conversation — **nie** logować wartości env z kluczami.
- **PII:** brak wbudowanego redactora; README odsyła do polityki tasku przed wysyłką danych produkcyjnych do Langfuse.
- Eval datasets syntetyczne w repo — bez danych osobowych.
- `confirmExperiment()` przed kosztownym runem (port z lekcji).

---

## 11. Kolejność realizacji (rekomendowana)

1. **A → B → C → D → E** — boilerplate tracing (jeden PR).
2. **F → G → H → I** — pakiet agent-evals (drugi PR lub ten sam, jeśli scope akceptowany).
3. **J** — zamknięcie spec / linki.

Fazy A–E mogą merge’ować niezależnie od F–I, ale dokumentacja (E) powinna wspomnieć agent-evals dopiero po F lub z linkiem „coming in agent-evals package”.

**Szacunek:** A–E ~2–3 dni; F–I ~1–2 dni.

---

## 12. Follow-up (poza planem)

| Element | Kiedy |
| --- | --- |
| `composeHooks` OM + tracing (Wariant D) | Po stabilizacji Fazy C |
| Span „memory/observer” dla OM | Opcjonalny | Research: [om-langfuse-spans.research.md](../om-langfuse-spans/om-langfuse-spans.research.md) |
| Konsument `tasks/s03e01/` z tracing + evals | Osobny plan homework |
| CI eval gate | Tylko jeśli zmiana polityki repo |

---

## 13. Changelog planu

| Data | Autor | Zmiana |
| --- | --- | --- |
| 2026-05-30 | Architect / EM | Utworzenie planu: Opcja B, peerDependencies, Faza 1, pakiet agent-evals; decyzje PII task-level, evals lokalnie. |

---

## 14. Status implementacji

- [x] Część A — Fazy A–E (boilerplate tracing)
- [x] Część B — Fazy F–I (agent-evals)
- [x] Część C — Faza J (spec)
- [x] `bun test` + `tsc` — boilerplate
- [x] `bun test` + `tsc` — agent-evals
