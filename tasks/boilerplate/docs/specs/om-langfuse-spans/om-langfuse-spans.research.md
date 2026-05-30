# OM Langfuse spans (`memory/observer`, `memory/reflector`) — research

**Task:** Przeanalizować follow-up z [agent-observability-evals.plan.md](../agent-observability-evals/agent-observability-evals.plan.md) §12 — **span „memory/observer” dla Observational Memory (OM)** — pod kątem wdrożenia w `@ai-devs/agent-boilerplate`.

**Data:** 2026-05-30  
**Status:** Research **zaakceptowany** — **zaimplementowany** (Wariant 2 v1). Plan: [om-langfuse-spans.plan.md](om-langfuse-spans.plan.md).

**Powiązane (zaimplementowane):**

- [agent-observability-evals.research.md](../agent-observability-evals/agent-observability-evals.research.md) — Opcja B tracing (Langfuse, opt-in)
- [observational-memory.research.md](../observational-memory/observational-memory.research.md) — OM (Observer/Reflector)

**Źródła:**

- `tasks/boilerplate/src/agent/observational_memory/` — `runObserver`, `runReflector`, `processor.ts`
- `tasks/boilerplate/src/observability/` — `withTrace`, `withAgent`, `startGeneration`, `withToolSpan`
- `tasks/boilerplate/src/agent/agent.ts` — osobne pola `memory` i `tracing`
- Lekcja S03E01 — hierarchia spanów (session → trace → agent → generation / tool)

---

## 1. Executive summary

**Werdykt: warto — span `memory/observer` (i analogicznie `memory/reflector`) ma sens jako opt-in mostek między OM a Langfuse, ale tylko gdy włączone są oba mechanizmy naraz.**

| Aspekt | Rekomendacja |
| --- | --- |
| **Cel** | W Langfuse widać *kiedy* OM sealuje kontekst i *ile* tokenów/komunikatów dotyczy — obok spanów ReAct (`generation#N`, `tool#N`) |
| **Domyślnie** | **Off** — bez tracingu lub bez OM nic się nie zmienia |
| **Typ obserwacji Langfuse** | **Span** (`asType: "span"` lub reuse `tool`) pod aktywnym spanem `agent`; wewnątrz opcjonalnie **generation** dla wywołania `OM_MODEL` |
| **Zależności** | Wymaga aktywnego `initTracing()` + `createTracingRuntime()` **oraz** `createObservationalMemoryHooks()` |
| **PII** | Polityka **task-level** — do spanów nie trafiać pełnych obserwacji XML bez redakcji |
| **Priorytet** | **P2 follow-up** — po stabilizacji Opcji B; przed Wariantem D (`composeHooks`) lub razem z nim |

**Kluczowy wniosek:** Passy Observer/Reflector to **osobne wywołania LLM** (`chat()` z `OM_MODEL`), które **nie przechodzą** przez `withTracingAdapter` na głównym agencie. Dziś widać je tylko w `[PAMIĘĆ]` i opcjonalnie w plikach `observer-NNN.md`. Span OM domyka lukę observability przy długich runach z włączonym OM.

---

## 2. Problem

### 2.1 Co użytkownik / maintainer widzi dziś

Przy **OM + Langfuse tracing** trace wygląda mniej więcej tak:

```text
chat-request
└── agent
    ├── generation#1      ← główny agent (ReAct)
    ├── tool#1
    ├── generation#2
    └── ...
```

Tymczasem w `beforeTurn` (hook OM) może się wydarzyć:

1. Przekroczenie progu → **Observer** (`runObserver`) — LLM kompresuje „głowę” konwersacji.
2. Opcjonalnie → **Reflector** (`runReflector`) — LLM kompresuje blok obserwacji.

Te kroki:

- zużywają tokeny (`OM_MODEL`, osobne `usage`),
- zmieniają to, co trafi do następnego `generation#N` głównego agenta,
- są logowane terminalowo jako `[PAMIĘĆ]`, ale **nie są skorelowane** z trace w Langfuse.

### 2.2 Typowy scenariusz debugowania

Agent „zapomina” fakt z wcześniejszej tury (ścieżka pliku, flaga huba, decyzja użytkownika). W Langfuse widać tylko ostatnie generacje z „uboższym” kontekstem. Bez spanu OM trudno ustalić:

- czy Observer w ogóle się uruchomił w tej iteracji,
- ile wiadomości zostało zsealowanych,
- czy Reflector nie usunął istotnego `[user]` faktu.

### 2.3 Cel spanów OM

Uczynić passy pamięci **pierwszoklasowymi obserwacjami** w tym samym trace co ReAct — z metadanymi do kosztów i debugu, bez zmiany semantyki OM.

---

## 3. Stan obecny w boilerplate

### 3.1 Observational Memory

| Element | Lokalizacja | Zachowanie |
| --- | --- | --- |
| Hook | `createObservationalMemoryHooks()` → `beforeTurn` / `afterTurn` | `processObservationalMemory` przed każdym LLM głównego agenta |
| Observer | `observer.ts` → `runObserver` | `chatFn({ model: OM_MODEL, ... })` — **poza** `AIAdapter` agenta |
| Reflector | `reflector.ts` → `runReflector` | j.w. |
| Logi | `logMemory(...)` → `[PAMIĘĆ]` | `pending`, `threshold`, `observer`, `sealed`, `reflector`, `flush` |
| Persystencja | `OM_PERSIST_DIR` | `observer-NNN.md`, `reflector-NNN.md` (debug lokalny) |
| Kalibracja | `trackUsage` po passach OM | Aktualizuje `MemoryState.calibration` |

**Kolejność w `agent.ts` (iteracja ReAct):**

```text
memory.beforeTurn()     ← OM może tu wołać Observer/Reflector
tracing.advanceGenerationTurn()
ai.generateResponse()   ← withTracingAdapter → generation span
dispatchToolCall()      ← tracing.withTool
memory.afterTurn()
```

OM działa **przed** spanem generation głównego agenta — logicznie span OM powinien być **rodzeństwem** `generation#N` (ten sam poziom pod `agent`), a nie dzieckiem generation.

### 3.2 Langfuse tracing (Opcja B — wdrożone)

| Element | Opis |
| --- | --- |
| Aktywacja | `initTracing()` + klucze `LANGFUSE_*` + `createAgent({ tracing })` |
| Import | `@ai-devs/agent-boilerplate/observability` (peer deps) |
| Brak połączenia z OM | Moduł `observational_memory/` **nie importuje** `observability/` |

### 3.3 Luka (gap)

| Wymaganie | OM | Tracing | Gap |
| --- | --- | --- | --- |
| Widoczność passów Observer/Reflector w UI | `[PAMIĘĆ]` / pliki | — | Brak w Langfuse |
| `usage` kosztów OM vs agent | `trackUsage` lokalnie | `usage` na generation agenta | Brak agregacji w trace |
| Korelacja z iteracją ReAct | `iteration` w hooku | `iteration` w metadata generation | Brak wspólnego ID zdarzenia OM |

---

## 4. Propozycja docelowa (koncept)

### 4.1 Hierarchia spanów z OM

```text
chat-request (trace)
└── agent
    ├── memory/observer#1     ← seal pass (metadata + opcjonalnie nested generation)
    │   └── generation       ← opcjonalnie: wywołanie OM_MODEL (osobny model)
    ├── generation#1         ← główny ReAct
    ├── tool#1
    ├── generation#2
    ├── memory/reflector#1    ← gdy próg refleksji spełniony
    └── ...
```

**Nazewnictwo:** spójne z `formatToolName` — np. `agent/memory/observer#1`, `agent/memory/reflector#1` (prefiks agenta z `TracingContext`).

### 4.2 Co zapisywać w metadata (propozycja)

**Span `memory/observer` (input / metadata):**

| Pole | Źródło |
| --- | --- |
| `messagesSealed` | `toObserve.length` |
| `tailKept` | długość tail po `splitByTailBudget` |
| `pendingTokensRaw` | `estimateConversationTokensRaw` przed pass |
| `threshold` | `OBSERVER_THRESHOLD_TOKENS` |
| `generation` | `state.generationCount` |
| `iteration` | opcjonalnie — przekazane z `beforeTurn` context |
| `phase` | `"observer"` |

**Span output (ograniczony — bez pełnego XML):**

| Pole | Opis |
| --- | --- |
| `observationLines` | liczba linii w nowym bloku |
| `obsTokensRaw` / `obsTokensCalibrated` | rozmiar po append |
| `sealed` | `true` |

**Nie logować domyślnie:** pełnej treści `activeObservations`, surowego user prompt Observer, pełnych tool payloadów (PII).

**Span `memory/reflector`:** analogicznie — `compressionLevel`, `tokensBefore`, `tokensAfter`, `targetTokens`.

### 4.3 Zagnieżdżona generation dla OM_MODEL

Observer/Reflector wołają `chat()` bezpośrednio. Dwa warianty:

| Wariant | Opis | Plus | Minus |
| --- | --- | --- | --- |
| **A — span only** | Jeden span `memory/observer` z metadata + `usage` w `end()` | Prosty diff, mało zagnieżdżeń | Brak pełnego input/output LLM w Langfuse |
| **B — span + nested generation** | Span otacza `startGeneration({ model: OM_MODEL, ... })` wokół `chatFn` | Pełna obserwowalność kosztów LLM OM | Więcej kodu; duplikacja wzorca z `withTracingAdapter` |
| **C — event zamiast span** | Lekki `event` Langfuse przy seal | Minimalny overhead | Słabsza hierarchia w UI |

**Rekomendacja:** **A na start**, **B** gdy maintainerzy potrzebują audytu promptów Observer w Langfuse (rzadkie; PII).

---

## 5. Warianty integracji

### 5.1 Wariant 1 — Instrumentacja w `observational_memory/` (bezpośredni import tracing)

`processor.ts` / `observer.ts` importują `withToolSpan` lub nowy `withMemorySpan` z `observability/`, gdy `isTracingActive()`.

| Plus | Minus |
| --- | --- |
| Lokalne, czytelne | **Coupling** OM → Langfuse (łamie separację subpath) |
| | OM wymaga peer deps nawet gdy użytkownik nie chce spanów |

**Werdykt:** **odrzuć** — narusza zasadę „główny pakiet bez Langfuse”.

### 5.2 Wariant 2 — Callback / port w `ObservationalMemoryHooksOptions` (rekomendowany)

Rozszerzyć options factory:

```typescript
createObservationalMemoryHooks({
  onObserverPass?: (ctx: ObserverPassContext) => Promise<ObserverPassResult>;
  onReflectorPass?: (ctx: ReflectorPassContext) => Promise<ReflectorPassResult>;
});
```

Domyślnie no-op. Task (lub helper w `observability/`) podaje implementację opakowującą Langfuse:

```typescript
import { createObservationalMemoryHooks } from "@ai-devs/agent-boilerplate";
import { createOmTracingCallbacks } from "@ai-devs/agent-boilerplate/observability";

const memory = createObservationalMemoryHooks({
  ...createOmTracingCallbacks(tracingRuntime),
});
```

| Plus | Minus |
| --- | --- |
| OM pozostaje free of Langfuse | Dwa obiekty do sklejenia (`tracing` + `memory`) |
| Testowalne bez Langfuse | Więcej API surface |

**Werdykt:** **preferowany** na start.

### 5.3 Wariant 3 — Wariant D (`composeHooks`)

Tracing i OM jako jeden `AgentLifecycleHooks`; span OM w `onBeforeTurn` wrapperze wokół `processObservationalMemory`.

| Plus | Minus |
| --- | --- |
| Jeden punkt konfiguracji | Większy refactor; zależy od planu `composeHooks` |

**Werdykt:** **docelowo** — po Wariancie 2 lub równolegle, jeśli D jest akceptowany.

### 5.4 Wariant 4 — Tylko dokumentacja

Opisać w README: „patrz `[PAMIĘĆ]` i `OM_PERSIST_DIR`”.

**Werdykt:** niewystarczające dla scenariusza OM + Langfuse razem.

---

## 6. Propozycja API (szkic — Wariant 2)

```typescript
// observability/om-tracing.ts (subpath)
export function createOmTracingCallbacks(
  runtime: TracingRuntime,
): Pick<
  ObservationalMemoryHooksOptions,
  "onObserverStart" | "onObserverEnd" | "onReflectorStart" | "onReflectorEnd"
>;
```

Alternatywnie jeden wrapper:

```typescript
export function withObservationalMemoryTracing(
  memoryOptions: ObservationalMemoryHooksOptions,
  runtime: TracingRuntime,
): ObservationalMemoryHooksOptions;
```

**Hook points w OM (minimalne zmiany):**

| Punkt | Plik | Moment |
| --- | --- | --- |
| Observer start/end | `runObservationPass` / `runObserver` | owija `runObserver` |
| Reflector start/end | `runReflectionIfNeeded` | owija `runReflector` |
| Seal summary | `processor.ts` po seal | opcjonalny krótki event (bez LLM) |
| Flush | `flushObservationalMemory` | span `memory/flush` (opcjonalnie P3) |

**Warunek aktywacji:** callbacks ustawione **i** `runtime.isActive()` — double guard.

---

## 7. Współistnienie z istniejącymi mechanizmami

| Mechanizm | Interakcja |
| --- | --- |
| **Planning turn 0** | OM na ogóle nie dotyczy planu w `conversation` tak samo — span OM tylko w `beforeTurn` ReAct |
| **Tool discovery** | Metadata generation agenta już ma `activeToolCount`; span OM może dodać `obsTokens` w trace metadata |
| **`[PAMIĘĆ]` logger** | Zostaje — span uzupełnia, nie zastępuje |
| **`OM_PERSIST_DIR`** | Orthogonal — pliki lokalne vs Langfuse cloud |
| **Evals (`agent-evals`)** | Trace z spanami OM ułatwia analizę regresji pamięci offline |

---

## 8. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| **PII w obserwacjach XML** | Domyślnie tylko liczniki w output span; flaga `omitObservationContent: true` (default) |
| **Koszt Langfuse** | Więcej spanów per iteracja gdy próg OM niski — dokumentacja: nie obniżać progu dla „lepszego trace” |
| **Podwójne generation w trace** | Jasna nazwa `memory/observer` vs `generation#N` |
| **Brak aktywnego agent span** | Spany OM no-op gdy `withAgentContext` nieaktywny (poza `processQuery`) |
| **Testy** | Mock callbacks w `processor.test.ts`; brak live Langfuse w CI |
| **Coupling** | Callback port w OM, implementacja w subpath observability |

---

## 9. Kryteria akceptacji (propozycja — po planie)

- [x] Przy **tylko OM** — brak regresji; brak wymogu Langfuse.
- [x] Przy **tylko tracing** — bez zmian względem dziś.
- [x] Przy **OM + tracing + callbacks** — span `memory/observer` emitowany gdy próg Observer przekroczony (mock test).
- [x] Metadata span zawiera `messagesSealed`, `tailKept`, `obsTokensCalibrated` (lub raw).
- [x] Pełna treść obserwacji **nie** trafia do span output domyślnie.
- [x] `bun test` w boilerplate — OK bez kluczy Langfuse.

---

## 10. User stories

| ID | Jako… | Chcę… | Aby… |
| --- | --- | --- | --- |
| OM-LF-1 | maintainer | widzieć span Observer w tym samym trace co ReAct | zrozumieć, czemu kontekst agenta się skrócił |
| OM-LF-2 | maintainer | porównać `usage` OM vs główny model | estymować koszt OM w długich sesjach |
| OM-LF-3 | student | nie instalować Langfuse gdy używa tylko OM | prosty setup S02E05 |
| OM-LF-4 | student | włączyć OM + tracing jednym wzorcem docs | bez Wariantu D na start |

---

## 11. Decyzje (zamknięte)

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Wariant integracji | **Wariant 2 — callback port** w `ObservationalMemoryHooksOptions` + `createOmTracingCallbacks(runtime)` w subpath `observability` |
| 2 | Głębokość spanu (v1) | **A — metadata only** (bez nested generation dla `OM_MODEL`; v2 opcjonalnie) |
| 3 | Reflector | **Ten sam release v1** co Observer |
| 4 | Export | **`@ai-devs/agent-boilerplate/observability`** (`om-tracing.ts`) |
| 5 | Flush span | **P3** — poza v1 |

**Wariant 3 (`composeHooks`)** — odłożony (v3); nie blokuje Wariantu 2.

---

## 12. Rekomendacja produktowa

| Faza | Zakres |
| --- | --- |
| **v1** | Callback port w OM + `createOmTracingCallbacks(runtime)` w subpath; span **A** dla Observer + Reflector; bez flush span |
| **v2** | Opcjonalna nested generation (B) za flagą `traceOmLlmCalls: true` |
| **v3** | Integracja z Wariantem D (`composeHooks`) — deprecate ręcznego sklejania memory + tracing |

**Poza zakresem v1:**

- Automatyczna redakcja PII w spanach (task-level policy w docs wystarczy).
- Wymuszanie spanów OM dla wszystkich użytkowników OM.
- Zmiana progów Observer/Reflector pod observability.

---

## 13. Suggested next steps

1. ~~Human gate: akceptacja research + Wariant 2.~~ **Done**
2. ~~Plan `om-langfuse-spans.plan.md`.~~ **Done** — [om-langfuse-spans.plan.md](om-langfuse-spans.plan.md)
3. **Human gate:** akceptacja planu przed implementacją.
4. **Implementacja** v1 — callback port + `createOmTracingCallbacks`; testy mock; docs.

---

## 14. Referencje w repo

| Ścieżka | Zawartość |
| --- | --- |
| `src/agent/observational_memory/processor.ts` | `runObservationPass`, `runReflectionIfNeeded` |
| `src/agent/observational_memory/observer.ts` | `runObserver` + `chatFn` |
| `src/agent/observational_memory/reflector.ts` | `runReflector` |
| `src/observability/tracer.ts` | `withToolSpan`, `startGeneration` |
| `src/agent/agent.ts` | kolejność `memory.beforeTurn` → tracing → `generateResponse` |
| `docs/specs/agent-observability-evals/agent-observability-evals.plan.md` | §12 follow-up |
