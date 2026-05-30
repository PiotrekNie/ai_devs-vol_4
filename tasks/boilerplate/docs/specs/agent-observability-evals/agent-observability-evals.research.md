# Agent observability & evals (S03E01 → boilerplate) — research

**Task:** Przeanalizować materiał lekcji S03E01 (*Obserwowanie i ewaluacja*) pod kątem ewentualnego rozwinięcia pakietu `tasks/boilerplate` o nowe funkcjonalności — **w oderwaniu od zadania homework** (`evaluation` / anomalie sensorów).

**Data:** 2026-05-30  
**Status:** Research **zaakceptowany** — plan: [agent-observability-evals.plan.md](agent-observability-evals.plan.md).

**Źródła:**

- `markdowns/s03e01-obserwowanie-i-ewaluacja-1774206984.md` — transkrypcja lekcji (Langfuse, evals, metryki, guardrails)
- `lessons/03_01_observability/` — minimalny agent HTTP + hierarchia spanów Langfuse
- `lessons/03_01_evals/` — observability + eksperymenty (`tool-use`, `response-correctness`) przez Langfuse Datasets API
- `lessons/01_05_agent/` — wcześniejszy wzorzec Langfuse (event subscriber na granicy runtime)
- `tasks/boilerplate/` — docelowy runtime (`createAgent`, `AIAdapter`, `MemoryHooks`, logger)
- `tasks/boilerplate/docs/specs/observational-memory/` — już zaimplementowane OM (inna semantyka „obserwacji”)
- `tasks/boilerplate/docs/specs/sandbox-code-execution/` — precedens: część lekcji pozostaje poza pakietem (Option A)

---

## 1. Executive summary

**Werdykt: tak — lekcja S03E01 daje sensowne kierunki rozwijania ekosystemu wokół boilerplate, ale nie wszystko powinno trafić do domyślnej instalacji `@ai-devs/agent-boilerplate`.**

| Warstwa lekcji | Co to jest | Stan w boilerplate | Rekomendacja |
| --- | --- | --- | --- |
| **Observability (Langfuse)** | Trace / session / generation / tool spans, koszty, debug multi-turn | Brak — tylko logger terminalowy `[MYŚL]`…`[SYSTEM]` | **Opcja B** — opt-in moduł `tracing/` w boilerplate *lub* osobny pakiet; wzorzec z `03_01_observability` |
| **Evals (offline)** | Dataset + experiment + evaluators (tool-use, correctness) | Brak | **Opcja C** — osobny pakiet `@ai-devs/agent-evals` *lub* szablony w `lessons/` + docs; nie domyślnie w boilerplate |
| **Online eval / guardrails** | Ocena live + moderacja I/O | Brak | Poza zakresem boilerplate; dokumentacja + hooki na przyszłość |
| **Observational Memory (OM)** | Kompresja kontekstu (Observer/Reflector) | **Już jest** (`createObservationalMemoryHooks`) | Nie mylić z observability S03E01; ewentualnie **mostek** spanów OM → Langfuse events |

**Kluczowy wniosek:** Lekcja promuje **scentralizowane podpięcie pod każde wywołanie LLM i każde narzędzie** oraz **hierarchiczne grupowanie** (session → trace → agent → generation/tool). Boilerplate ma naturalne punkty zaczepienia (`AIAdapter`, pętla ReAct, `dispatchToolCall`), ale dodanie Langfuse to **nowa zależność opcjonalna** i decyzja produktowa (jak przy code mode / sandbox).

**Homework `evaluation`:** ilustruje *projektowanie evalów* (deterministyczne reguły vs LLM, batch, koszt outputu), ale logika domenowa (10k plików JSON, reguły sensorów) **nie należy** do boilerplate — tylko do przyszłego `tasks/s03e01/` lub skryptu epizodu.

---

## 2. Koncepcje z lekcji S03E01 (poza zadaniem)

### 2.1 Observability ≠ Observational Memory

| Termin w kursie | Znaczenie | W repo |
| --- | --- | --- |
| **Observational Memory** (S02E05) | Kompresja historii konwersacji do obserwacji XML | `src/agent/observational_memory/` |
| **Observability** (S03E01) | Telemetria zachowania agenta (trace, koszty, debug) | `lessons/03_01_*`, brak w boilerplate |

Te warstwy **współistnieją**: OM skraca kontekst wysyłany do API; observability rejestruje *co* poszło do API i *jakie* były wyniki narzędzi — bez zmiany logiki agenta.

### 2.2 Hierarchia obserwacji (Langfuse)

Lekcja wymaga przekazywania **kontekstu sesji**, nie tylko pojedynczego zdarzenia:

```text
Session (wątek / zadanie)
└── Trace (pojedyncza interakcja użytkownika, np. processQuery)
    └── Agent span (np. nazwa epizodu)
        ├── Generation#1 (LLM call — pełny input/instructions/tools + usage)
        ├── Tool#1 (nazwa, args, output)
        ├── Generation#2
        └── Tool#2 …
```

Metadane: `userId`, `sessionId`, `agentId`, wersja aplikacji, model, tagi.

### 2.3 Evals (offline / online)

**Eval** = zadanie (input → output agenta) + **dataset** (przykłady) + **ocena** (0–1, kod lub LLM).

Lekcja wyróżnia:

- **Offline** — przed release / CI; eksperymenty w kodzie (`dataset.runExperiment`) + panel Langfuse.
- **Online** — ocena interakcji produkcyjnych (moderacja, naruszenia).

Priorytetowe obszary evalów dla agentów ReAct:

1. **Tool selection** — czy agent wywołał właściwe narzędzia (lekcja: `tool-use.synthetic.json`).
2. **Tool usage / trajectory** — poprawność argumentów, liczba iteracji, błędy.
3. **Response correctness** — treść odpowiedzi (exact match, regex, LLM-rubric).
4. **Koszty / latency** — metryki z trace’ów, nie tylko z evaluatorów.

Eval **nie zastępuje** testów jednostkowych/E2E — mierzy *zachowanie modelu* z tolerancją probabilistyczną.

### 2.4 Wymagania niefunkcjonalne

- **Graceful degradation** — brak kluczy Langfuse → agent działa jak dziś (wzorzec w `03_01_observability/src/core/tracing/init.ts`).
- **PII / anonimizacja** — trace’y mogą zawierać dane użytkownika; polityka redakcji przed exportem do evalów.
- **Centralizacja** — jeden punkt na LLM (`AIAdapter`) i jeden na narzędzia (`dispatchToolCall`), nie rozproszone `console.log`.

---

## 3. Stan obecny w `tasks/boilerplate`

### 3.1 Co już mamy

| Mechanizm | Plik | Rola względem S03E01 |
| --- | --- | --- |
| Logger terminalowy | `src/utils/logger.ts` | `[MYŚL]`, `[AKCJA]`, `[WYNIK]`, `[PAMIĘĆ]`, `[SYSTEM]` — **lokalny** debug, bez struktury trace |
| `AIAdapter` | `src/agent/ai.ts` | Pojedynczy kontrakt `generateResponse`; zwraca `usage` — **gotowe pod wrapper tracingowy** |
| Pętla ReAct | `src/agent/agent.ts` | Jawne miejsca: przed/po LLM, pętla `toolCalls`, `dispatchToolCall` |
| `MemoryHooks` | `src/agent/memory.ts` | Lifecycle per iteracja; OM już emituje `[PAMIĘĆ]` |
| `AfterTurnContext.lastResponse` | `memory.ts` + `agent.ts` | `usage` + szacunek tokenów — **sygnał kosztowy** bez Langfuse |
| Planning / tool discovery | `planning.ts`, `tool_discovery/` | Dodatkowe „tury” i narzędzia — trace powinien je rozróżniać (turn 0 vs ReAct) |

### 3.2 Czego brakuje

- Identyfikator **sesji** / **trace** w API `createAgent` (brak `sessionId` w konfiguracji).
- **Strukturalne zdarzenia** (event emitter lub callback hooks) zamiast wyłącznie ANSI logów.
- Integracji z **Langfuse** (lub innym backendem).
- **Harness evalów** (dataset load, evaluator, agregacja wyników).
- Dokumentacji „jak podłączyć observability do epizodu kursu” (OM ma README; observability nie).

### 3.3 Istniejące wzorce w lekcjach (do portowania)

**`03_01_observability`** — dekorator adaptera:

```typescript
// lessons/03_01_observability/src/core/tracing/adapter.ts
export const withGenerationTracing = (adapter: Adapter): Adapter => ({
  complete: async (params) => {
    if (!isTracingActive()) return adapter.complete(params);
    const generation = startGeneration({ model, input, metadata });
    const result = await adapter.complete(params);
    generation.end({ output, usage });
    return result;
  },
});
```

**`03_01_evals`** — agent loop owija narzędzia w `withTool`, eksperymenty w `experiments/*.ts` używają `@langfuse/client` (`dataset.runExperiment`, evaluators 0–1).

**`01_05_agent`** — alternatywa: **event bus** (`agent.started`, `generation.completed`, `tool.completed`) + subscriber Langfuse — głębsza integracja multi-agent, cięższa niż potrzeba typowego epizodu kursu.

---

## 4. Propozycje rozszerzeń boilerplate

### 4.1 Wariant A — Tylko dokumentacja (minimalny koszt)

**Opis:** README + `boilerplate-documentation.md` § nowy: jak w tasku owinąć `createAIAdapter` wzorces z lekcji, gdzie dodać `withTool` w własnym `handlers` map, jak uruchomić eval skrypt obok epizodu.

| Plus | Minus |
| --- | --- |
| Zero nowych zależności w boilerplate | Duplikacja kodu tracing między epizodami |
| Spójne z decyzją „code mode w lessons” | Brak jednego API dla studentów |
| Szybkie wdrożenie | Każdy epizod musi sam skleić Langfuse |

**Kiedy:** wystarczy edukacyjnie, gdy S03E01 homework nie wymaga wspólnego runtime.

---

### 4.2 Wariant B — Opt-in tracing w boilerplate (rekomendowany core)

**Opis:** Moduł `src/observability/` (nazwa unikająca kolizji z `observational_memory/`):

| Element | Odpowiedzialność |
| --- | --- |
| `TracingHooks` lub `createTracingContext()` | sessionId, userId, tags, trace name |
| `withTracingAdapter(ai: AIAdapter)` | span **generation** na każde `generateResponse` |
| Instrumentacja w `createAgent` (flaga opt-in) | span **agent** na `processQuery` / `processConversationTurn`; **tool** w `dispatchToolCall` |
| `initTracing()` / `shutdownTracing()` | Langfuse OTEL processor; no-op bez env |
| `config.ts` | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL` |

**API (szkic):**

```typescript
import { createAgent, createAIAdapter, initTracing, withTracingAdapter } from "@ai-devs/agent-boilerplate";

initTracing(); // optional, no-op without keys

const agent = createAgent({
  ai: withTracingAdapter(createAIAdapter({ model: "gpt-4o-mini" })),
  tracing: { enabled: true, sessionId: "episode-run-1" }, // nowe pole AgentConfig
  // ...
});
```

**Zależności:** `@langfuse/tracing`, `@langfuse/otel` jako **optionalDependencies** lub **peerDependencies** — wymaga zgody tech lead (reguła „no new deps without agreement”).

**Co NIE wchodzi:** HTTP server sesji (`POST /api/chat`) — zostaje w lekcjach; epizody kursu używają `bun run index.ts`.

---

### 4.3 Wariant C — Pakiet evalów obok boilerplate

**Opis:** `@ai-devs/agent-evals` (analogia do `@ai-devs/agent-code-mode` z research sandbox):

```
tasks/agent-evals/
├── src/
│   ├── experiment-runner.ts   # bootstrap Langfuse client, flush/shutdown
│   ├── evaluators/            # tool-use, contains, llm-rubric helpers
│   └── dataset.ts             # load JSON, sync to Langfuse
└── templates/
    └── tool-use.synthetic.json
```

Epizod importuje harness; **boilerplate** dostarcza stabilny sposób uruchomienia agenta + trace id do korelacji wyników.

| Plus | Minus |
| --- | --- |
| Eval nie puchnie domyślnego installu | Dwa pakiety do utrzymania |
| Jasny podział: runtime vs QA | Wymaga `file:../agent-evals` w taskach z evalami |

**Minimalny zestaw evaluatorów** (z lekcji, ogólne):

- `toolUseEvaluator` — required/forbidden tools, min/max call count.
- `responseContains` / `exactNumberInResponse` — deterministyczne.
- Hook pod **LLM-as-judge** (opcjonalny, kosztowny).

---

### 4.4 Wariant D — Ujednolicony `AgentHooks` (tracing + memory + eval)

**Opis:** Rozszerzyć wzorzec `MemoryHooks` do **`AgentLifecycleHooks`**:

```typescript
interface AgentLifecycleHooks {
  beforeTurn?: MemoryHooks["beforeTurn"];
  afterTurn?: MemoryHooks["afterTurn"];
  onGenerationStart?(ctx): void;
  onGenerationEnd?(ctx): void;
  onToolStart?(ctx): void;
  onToolEnd?(ctx): void;
}
```

Implementacje: `createObservationalMemoryHooks`, `createLangfuseTracingHooks`, kompozycja `composeHooks(a, b)`.

| Plus | Minus |
| --- | --- |
| Jedna extensibility story | Refactor API `memory` → `hooks` (breaking lub alias) |
| Łatwe dodawanie guardrails później | Większy zakres niż B |

**Rekomendacja:** fazować — najpierw B (tracing), potem ewentualnie D jeśli pojawi się 3+ hook types.

---

## 5. Mapowanie lekcji → moduły boilerplate

| Koncepcja S03E01 | Lekcja (referencja) | Proponowany moduł boilerplate | Priorytet |
| --- | --- | --- | --- |
| Generation tracing | `withGenerationTracing` | `observability/tracing-adapter.ts` | P0 |
| Tool tracing | `withTool` in `run.ts` | instrument `dispatchToolCall` | P0 |
| Session / trace metadata | `withTrace`, `updateActiveTrace` | `AgentConfig.tracing` | P0 |
| Agent span per run | `withAgent` | wrap `processQuery` / `processConversationTurn` | P1 |
| Turn indexing | `advanceTurn`, `formatGenerationName` | wspólny `TracingContext` w pętli | P1 |
| Prompt refs w Langfuse | `getPromptRefByName` | opcjonalnie — epizody z własnymi promptami | P2 |
| Tool-use eval | `experiments/tool-use.ts` | pakiet `agent-evals` lub kopia w `tasks/s03e01/` | P2 (poza core) |
| Response correctness eval | `experiments/response-correctness.ts` | j.w. | P2 |
| Online eval / guardrails | wspomniane w lekcji | docs + future `onGenerationEnd` hook | P3 |
| Koszty / usage | usage w generation.end | już jest `ModelResponse.usage` | P0 (tylko wiring) |
| OM + tracing razem | — | span „memory/observer” opcjonalnie z `[PAMIĘĆ]` events | P3 |

---

## 6. Luki względem wymagań lekcji (gap analysis)

| Wymaganie lekcji | Boilerplate dziś | Gap |
| --- | --- | --- |
| Podpięcie pod **wszystkie** wywołania LLM | Tylko przez `ai.generateResponse` | OK po wrapperze — **jeden punkt** |
| Podpięcie pod **wszystkie** narzędzia | `dispatchToolCall` centralnie | OK po instrumentacji |
| Kontekst sesji w trace | Brak | Dodać `sessionId` / `userId` do config |
| Grupowanie zagnieżdżone | Brak | Port `withTrace` / `withAgent` z lekcji |
| Degradacja bez Langfuse | N/A | Wzorzec `isTracingActive()` |
| Offline eval w kodzie | Brak | Osobny pakiet lub skrypt epizodu |
| Eval tool selection | Brak | Evaluator + dataset — nie w core loop |
| Anonimizacja PII | Brak | Polityka + opcjonalny redactor przed `generation.end` |
| Debug „odtwarzanie stanu” | `OM_PERSIST_DIR` dla OM | Langfuse UI + export JSON (lekcja); nie duplikować w boilerplate |

---

## 7. Ryzyka i ograniczenia

1. **Zależności Langfuse** — wersje SDK (`@langfuse/tracing` v4 vs `langfuse` v3 w starszych lekcjach); ujednolicić na v4 jak `03_01_evals`.
2. **Responses API vs Chat Completions** — boilerplate używa Responses API; lekcja 03_01 też — format input/output w spanach musi zostać przy `function_call` / `function_call_output`.
3. **Tool discovery** — dynamiczny zestaw `tools` między turami; metadata trace powinna logować **aktywny** zestaw narzędzi (`discovery.getApiTools().length`).
4. **Planning turn 0** — osobna generacja bez narzędzi; oznaczyć w metadata `phase: "planning"`.
5. **Koszt evalów** — uruchamianie datasetów = wielokrotne wywołania LLM; poza domyślnym `bun test`.
6. **Confusion naming** — w docs wyraźnie: *Observational Memory* vs *Observability (tracing)*.
7. **Scope creep** — homework S03E01 (batch JSON, reguły sensorów) **nie** jest argumentem za rozbudową boilerplate — tylko za **przykładem** eval design (deterministyczne vs LLM).

---

## 8. Rekomendacja produktowa

**Proponowana ścieżka (fazowana):**

1. **Faza 0 (docs)** — sekcja w README boilerplate: „Observability & evals (S03E01)”, linki do `lessons/03_01_*`, diagram hierarchii spanów, check-lista podpięcia w epizodzie.
2. **Faza 1 (tracing, opt-in)** — Wariant B: `initTracing`, `withTracingAdapter`, `AgentConfig.tracing`, testy z mock adapter (bez live Langfuse).
3. **Faza 2 (evals, opcjonalnie)** — Wariant C: pakiet `agent-evals` z portem `experiments/lib` z lekcji; pierwszy konsument: przyszły `tasks/s03e01/` *jeśli* homework wymaga harnessu (nie logiki sensorów w boilerplate).
4. **Faza 3 (opcjonalnie)** — Wariant D: `composeHooks` łączący OM + tracing.

**Domyślne zachowanie:** bez zmian — tracing wyłączony, brak Langfuse w `package.json` dopóki nie ma akceptacji zależności.

**Analogia z wcześniejszymi decyzjami:**

| Feature | Gdzie landed |
| --- | --- |
| Code execution sandbox | Lekcje + osobny pakiet (nie boilerplate) |
| Tool discovery | Opt-in w boilerplate |
| Observational Memory | Opt-in w boilerplate |
| **Langfuse tracing** | Proponowane: **opt-in w boilerplate** (mały, spójny surface) |
| **Eval experiments** | Proponowane: **osobny pakiet** lub skrypt epizodu |

---

## 9. User stories (boilerplate / ekosystem)

| ID | Jako… | Chcę… | Aby… | Akceptacja |
| --- | --- | --- | --- | --- |
| OBS-1 | deweloper epizodu | włączyć tracing jednym flagiem + env Langfuse | debugować multi-turn ReAct w UI | trace z generation#N i tool#N bez zmiany logiki tasku |
| OBS-2 | deweloper | uruchomić agenta bez kluczy Langfuse | nie blokować CI / studentów | identyczne wyniki jak dziś |
| OBS-3 | deweloper | widzieć `usage` per generation w trace | estymować koszty epizodu | input/output tokens w spanie |
| OBS-4 | maintainer | rozróżnić OM i Langfuse w docs | uniknąć pomyłek S02 vs S03 | osobne sekcje README |
| EVAL-1 | maintainer | uruchomić syntetyczny tool-use eval | mierzyć regresję po zmianie promptu | avg score + per-case w Langfuse |
| EVAL-2 | maintainer | dodać własny dataset JSON | testować epizod domenowy | runner bez kopiowania całej lekcji |
| EVAL-3 | — | *nie* | wrzucać logikę homework sensorów do boilerplate | brak reguł `temperature_K` w pakiecie |

---

## 10. Assumptions

- Platformą referencyjną kursu pozostaje **Langfuse** (lekcje + S01E05).
- Epizody kursu nadal startują przez `bun --env-file=../.env run index.ts` — **bez** wymogu HTTP servera do observability.
- Testy boilerplate (`bun test`) **nie** wymagają sieci ani kluczy Langfuse.
- Homework S03E01 będzie implementowany w `tasks/s03e01/` z własną logiką batch; ewentualnie korzysta z Fazy 1–2, ale to osobna decyzja.

---

## 11. Decyzje (zamknięte przed planem)

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Langfuse `dependencies` vs `peerDependencies` | **`peerDependencies`** — task dodaje Langfuse gdy włącza tracing |
| 2 | Faza 0 vs Faza 1 | **Faza 1** — kod tracingu opt-in w boilerplate (Opcja B) |
| 3 | `agent-evals` vs kopia w epizodzie | **Osobny pakiet `@ai-devs/agent-evals`** |
| 4 | Redakcja PII | **Polityka na poziomie tasku** (brak redactora w boilerplate) |
| 5 | CI eval experiments | **Tylko dokumentacja lokalnego uruchomienia** (bez gate na PR) |

---

## 12. Suggested next steps

1. ~~Human gate: akceptacja research + decyzje §11.~~ **Done**
2. ~~Plan (`agent-observability-evals.plan.md`).~~ **Done** — [agent-observability-evals.plan.md](agent-observability-evals.plan.md)
3. **Human gate:** akceptacja planu przed implementacją (Część A → B).
4. **Implementacja:** Fazy A–E (boilerplate), potem F–I (agent-evals).
5. **Osobno:** homework `tasks/s03e01/` — osobny plan.

---

## 13. Referencje w repo

| Ścieżka | Zawartość |
| --- | --- |
| `lessons/03_01_observability/src/core/tracing/` | init, tracer, adapter wrapper |
| `lessons/03_01_evals/experiments/` | tool-use + response-correctness runners |
| `lessons/01_05_agent/src/lib/langfuse-subscriber.ts` | event-driven tracing (alternatywa) |
| `tasks/boilerplate/src/agent/agent.ts` | punkty instrumentacji |
| `tasks/boilerplate/src/agent/ai.ts` | `AIAdapter` — dekorator |
| `tasks/boilerplate/docs/specs/sandbox-code-execution/` | precedens „co zostaje poza pakietem” |
