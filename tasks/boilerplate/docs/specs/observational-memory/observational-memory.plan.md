# Plan wdrożenia — Observational Memory (Opcja A, boilerplate)

**Normatywny research:** [observational-memory.research.md](observational-memory.research.md) — **zaakceptowany** (Opcja A; Observer hybrydowy; persystencja opcjonalna).  
**Workspace:** `tasks/boilerplate/` (`@ai-devs/agent-boilerplate`)  
**Referencja lekcji:** `lessons/02_05_agent/` (Mastra OM)

Ten dokument jest planem wdrożenia zgodnym z `@eversis-implement`: typy zadań `[CREATE]` / `[MODIFY]` / `[REUSE]`. **Implementacja kodu** następuje po akceptacji tego planu przez człowieka.

**Weryfikacja UI:** brak — zmiana dotyczy runtime agenta, hooków pamięci i logów terminalowych.

**Poza zakresem tego planu:**

- Włączenie OM globalnie dla wszystkich epizodów (domyślnie `noopMemoryHooks`).
- Refaktor `tasks/s02e04` mailbox + OM (dokumentacja warstw wystarczy).
- HTTP server sesji jak w lekcji (`POST /api/chat`).

---

## 1. Zakres (scope)

**W zakresie (boilerplate):**

| Element | Opis |
| --- | --- |
| **Moduł OM** | `src/agent/observational_memory/` — port logiki z lekcji (observer, reflector, processor, context, utils). |
| **Prompty** | `src/prompts/observer.md`, `src/prompts/reflector.md` — XML, tagi źródeł, priorytety (jak lekcja). |
| **Factory** | `createObservationalMemoryHooks(options)` → `MemoryHooks` (stan w closure). |
| **Polityka Observer** | Hybryda: w `beforeTurn`, **gdy** szacunek tokenów „ogona” ≥ `OBSERVER_THRESHOLD_TOKENS`; max **1 pass Observer na iterację ReAct** (naturalnie z hooka). |
| **Polityka Reflector** | Gdy obserwacje ≥ `REFLECTOR_THRESHOLD_TOKENS` **i** wzrost od ostatniej refleksji ≥ `REFLECTION_TARGET_TOKENS` (histereza z lekcji). |
| **Tail split** | `splitByTailBudget` (~30% progu, min 120 tokenów); nie rozdzielać pary tool call / tool output. |
| **Persystencja** | **Opcjonalna**, domyślnie wyłączona; `OM_PERSIST_DIR` → pliki `observer-NNN.md`, `reflector-NNN.md`. |
| **Model OM** | Osobny env `OM_MODEL` (domyślnie `gpt-4o-mini`); wywołania przez `chat()` z retry. |
| **Flush** | `flushObservationalMemory(state)` wołane w `afterTurn` gdy pętla kończy się odpowiedzią tekstową / `finish_task` / guard MAX_ITERATIONS. |
| **Domyślne zachowanie** | Bez zmian — `noopMemoryHooks`. |
| **Testy** | Unit: split, parse XML, progi, inject instructions; integracja z mock `chat()`. |
| **Kalibracja tokenów (faza H)** | `usage` z Responses API → korekta heurystyki `chars/4` dla obserwacji i Reflector; progi Observer nadal na **raw**. |
| **Dokumentacja (faza I)** | README, CHANGELOG, `tasks/docs/boilerplate-documentation.md`, `.env.example` (w repo root `tasks/` jeśli wspólny). |

**W zakresie (follow-up — faza J, osobny PR):**

| Element | Opis |
| --- | --- |
| **s02e03 migracja** | Cienki wrapper importujący `createObservationalMemoryHooks` zamiast lokalnego `observationalMemory.ts`. |

---

## 2. Decyzje projektowe (zatwierdzone)

| # | Decyzja |
| --- | --- |
| 1 | **Opcja A** — pełny port wzorca z lekcji (XML observations, tail budget, reflector levels). |
| 2 | **Observer hybrydowy** — uruchamiany w każdej iteracji ReAct **tylko gdy próg przekroczony** (nie raz na cały run). |
| 3 | **Persystencja off by default** — włączana przez `OM_PERSIST_DIR`. |
| 4 | **Opt-in** — `memory: createObservationalMemoryHooks()`; brak globalnego `AGENT_ENABLE_OBSERVATIONAL_MEMORY`. |
| 5 | **Trim in-place** — `beforeTurn` zwraca przycięty `conversation` (ogon); obserwacje w `instructions` — zgodnie z kontraktem hooka i `s02e03`. |
| 6 | **`## Working plan`** — `stripObservationAppendix()` / inject nie usuwa markera planu; dokumentacja w `memory.ts`. |

---

## 3. Analiza stanu obecnego (gap)

| Komponent | Stan | Gap |
| --- | --- | --- |
| `memory.ts` | `MemoryHooks` + `noopMemoryHooks` + `estimateTokens` | Brak implementacji OM |
| `config.ts` | `OBSERVER_THRESHOLD_TOKENS`, `REFLECTOR_THRESHOLD_TOKENS` | Brak `REFLECTION_TARGET_TOKENS`, `OM_MODEL`, limity output, tail ratio, `OM_PERSIST_DIR` |
| `agent.ts` | Woła `beforeTurn` / `afterTurn` | Brak zmian wymaganych (opcjonalnie log `[PAMIĘĆ]` w fazie F) |
| `ai.ts` | `chat()` + retry | Brak `temperature` w body — dodać opcjonalnie dla Observer (0.3) / Reflector (0) |
| `lessons/02_05_agent` | Pełna implementacja | Do adaptacji (Responses items, nie HTTP session) |
| `tasks/s02e03` | Prostszy OM | Docelowo wrapper na boilerplate (faza J) |
| `ai.ts` / `ModelResponse` | Brak `usage` | Faza H — parse + propagate usage |
| Eksporty `index.ts` | `noopMemoryHooks` | Brak `createObservationalMemoryHooks` |

---

## 4. Architektura docelowa

```text
createAgent({ memory: createObservationalMemoryHooks({ ... }) })
  │
  └─ runLoop (iteracja i)
        │
        ├─ memory.beforeTurn({ conversation, instructions, iteration })
        │     │
        │     ├─ pendingTokens < OBSERVER_THRESHOLD?
        │     │     └─ inject existing <observations> → return passthrough
        │     │
        │     └─ pendingTokens ≥ threshold
        │           ├─ splitByTailBudget → head | tail
        │           ├─ chat(OM_MODEL) Observer → append observations
        │           ├─ optional persist observer-NNN.md
        │           ├─ reflect if obs ≥ REFLECTOR_THRESHOLD && growth ≥ TARGET
        │           └─ return { conversation: tail, instructions: base + appendix }
        │
        ├─ ai.generateResponse(trimmed conversation, instructions')
        │
        └─ memory.afterTurn(...)
              └─ on terminal turn → flushObservationalMemory (seal remaining tail)
```

**Layout kontekstu LLM:**

```text
instructions = baseInstructions + "\n\n" + buildObservationAppendix(activeObservations)
input        = conversation tail (unobserved Responses API items)
```

**Stan w closure (`MemoryState`):**

```typescript
type MemoryState = {
  activeObservations: string;
  observationTokenCount: number;
  generationCount: number;
  observerLogSeq: number;
  reflectorLogSeq: number;
  lastReflectionOutputTokens?: number;
  sessionId: string; // do logów persist
  calibration: CalibrationState; // faza H
};
```

Indeks `lastObservedIndex` z lekcji **nie jest potrzebny** — po sealowaniu zwracamy fizycznie krótszy `conversation` (tail only).

**Kalibracja (faza H) — przepływ:**

```text
Każde wywołanie chat() (agent ReAct, Observer, Reflector):
  estimatedSafe = withSafetyMargin(rawEstimate)
  usage = response.usage (input_tokens + output_tokens)
  recordActualUsage(calibration, estimatedSafe, actual)

estimateTokens(text, calibration)     → budżet obserwacji / Reflector target
estimateConversationTokensRaw(items)  → próg Observer (stabilny, bez ratio)
```

---

## 5. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| Observer gubi fakty z tool JSON | Truncate payloadów w serializacji (`OBSERVER_MAX_TOOL_PAYLOAD_CHARS`); tagi `[tool:name]`. |
| Reflector usuwa `[user]` fakty | Prompt reflector.md — priorytet `[user]`; test golden journal. |
| Konflikt z `## Working plan` | Inject observations **po** base instructions; nie stripować `WORKING_PLAN_MARKER`. |
| Podwójny blok observations | `stripObservationAppendix()` przed reinject (jak `stripPreviousWorkingPlan`). |
| Koszt LLM | `OM_MODEL` tańszy model; wysokie progi domyślne (30k / 60k). |
| Testy wołają prawdziwe API | Mock `chat()` / inject dependency w factory. |
| `enablePlanningPhase` + OM | Plan w instructions poza conversation — nie podlega sealowaniu. |
| Błąd Observer | Log `[SYSTEM]`, fallback passthrough (jak lekcja `processor.ts`). |
| Drift ratio w krótkim runie | Kalibracja aktywna dopiero po `OM_CALIBRATION_MIN_ACTUAL_TOKENS` (domyślnie 500); wcześniej raw. |
| Brak `usage` w odpowiedzi API | `trackUsage` no-op; system działa jak MVP (raw only). |

---

## 6. Kryteria akceptacji (Definition of Done)

### Boilerplate core OM (fazy A–G)

- [ ] `createObservationalMemoryHooks()` eksportowane z `@ai-devs/agent-boilerplate`.
- [ ] Przy szacunku ogonu ≥ `OBSERVER_THRESHOLD_TOKENS` — head sealed do obserwacji; tail w `conversation`.
- [ ] Przy obserwacjach ≥ `REFLECTOR_THRESHOLD_TOKENS` + histereza — Reflector kompresuje (levels 0–2).
- [ ] Obserwacje w `<observations>` wstrzyknięte do `instructions`.
- [ ] Domyślne zachowanie bez `memory` hook = identyczne jak dziś (`noopMemoryHooks`).
- [ ] `OM_PERSIST_DIR` ustawione → pliki logów; nie ustawione → brak zapisu FS.
- [ ] `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate/` — OK (fazy A–G).

### Kalibracja tokenów (faza H)

- [ ] `ModelResponse` zawiera opcjonalne `usage: { inputTokens, outputTokens }` parsowane z body Responses API.
- [ ] `MemoryState.calibration` aktualizowane po: głównym agencie ReAct, Observer, Reflector.
- [ ] Próg Observer (`OBSERVER_THRESHOLD_TOKENS`) liczony **raw** (`estimateConversationTokensRaw`).
- [ ] `observationTokenCount` i decyzje Reflector używają **skorygowanego** `estimateTokens(text, calibration)`.
- [ ] `createObservationalMemoryHooks({ enableCalibration: false })` — fallback do zachowania MVP (tylko raw).
- [ ] Testy: mock `usage` → ratio > 1 podbija calibrated estimate; brak `usage` → brak regresji.

### Dokumentacja (faza I)

- [ ] README + CHANGELOG + `boilerplate-documentation.md` opisują OM **i** kalibrację (dual estimator).

### Follow-up (faza J)

- [ ] s02e03 używa factory z boilerplate; lokalny plik deprecated / cienki re-export.

---

## 7. Plan fazowy i zadania

### Faza A — Konfiguracja i typy

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| A1 | [MODIFY] | **`config.ts`:** dodać `REFLECTION_TARGET_TOKENS` (env, domyślnie `20_000`), `OM_MODEL` (domyślnie `gpt-4o-mini`), `OM_OBSERVER_MAX_OUTPUT_TOKENS` (8192), `OM_REFLECTOR_MAX_OUTPUT_TOKENS` (10000), `OM_TAIL_RATIO` (0.3), `OM_MIN_TAIL_TOKENS` (120), `OM_PERSIST_DIR` (pusty = off), `OBSERVER_MAX_SECTION_CHARS`, `OBSERVER_MAX_TOOL_PAYLOAD_CHARS`. | [ ] Stałe eksportowane; sensowne domyślne dla kursu (nie demo-low jak lekcja 400). |
| A2 | [CREATE] | **`src/agent/observational_memory/types.ts`:** `MemoryState`, `ObservationalMemoryConfig`, `ObserverResult`, `ReflectorResult`, type guards dla Responses items (`function_call`, `function_call_output`, text roles). | [ ] Typy używane w całym module. |

### Faza B — Utils, prompty, serializacja

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| B1 | [CREATE] | **`src/prompts/observer.md`**, **`reflector.md`:** przenieść treść z `lessons/02_05_agent/src/memory/prompts.ts` (system prompts + reguły XML). | [ ] Ładowane `readFileSync`; brak hardcoded multi-line w TS. |
| B2 | [CREATE] | **`src/agent/observational_memory/utils.ts`:** `extractTag`, `truncate`, `loadObserverPrompt()`, `loadReflectorPrompt()`, `buildObserverUserPrompt()`, `buildReflectorUserPrompt()`, `buildObservationAppendix()`, `stripObservationAppendix()`, `CONTINUATION_HINT`. | [ ] Testy parse/extract/strip. |
| B3 | [CREATE] | **`src/agent/observational_memory/serialize.ts`:** `serializeConversationItems(items)` — mapowanie Responses API items → tekst dla Observer (truncate sekcji/tool payload). | [ ] Test z sample function_call + output. |

### Faza C — Tokeny i split kontekstu

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| C1 | [CREATE] | **`src/agent/observational_memory/tokens.ts`:** `estimateTokensRaw`, `estimateItemTokens`, `estimateConversationTokensRaw` (chars/4, jak lekcja). Reuse/wrap `estimateTokens` z `memory.ts` gdzie wystarczy. | [ ] Testy edge: empty, large tool output. |
| C2 | [CREATE] | **`src/agent/observational_memory/context.ts`:** `splitByTailBudget(items, tailBudget)` — nie rozdzielać orphaned `function_call_output`; `buildPassthroughContext`, `buildObservedContext`. | [ ] Test: split zachowuje parę call/output. |

### Faza D — Observer i Reflector

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| D1 | [MODIFY] | **`src/agent/ai.ts`:** opcjonalne `temperature?: number` w `ChatParams` / body (Observer 0.3, Reflector 0). | [ ] Pole opcjonalne; brak breaking change. |
| D2 | [CREATE] | **`src/agent/observational_memory/observer.ts`:** `runObserver({ previousObservations, items, model, chatFn })` → `ObserverResult`; parse `<observations>`, `<current-task>`, `<suggested-response>`. | [ ] Test parse na fixture XML. |
| D3 | [CREATE] | **`src/agent/observational_memory/reflector.ts`:** `runReflector({ observations, targetTokens, model, chatFn })` — 3 poziomy kompresji jak lekcja. | [ ] Test: wybiera krótszy wynik. |
| D4 | [CREATE] | **`src/agent/observational_memory/persistence.ts`:** `persistObserverLog`, `persistReflectorLog` — no-op gdy `OM_PERSIST_DIR` puste. | [ ] Test z tmp dir (opcjonalny skip gdy brak FS). |

### Faza E — Processor i factory

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| E1 | [CREATE] | **`src/agent/observational_memory/processor.ts`:** `processObservationalMemory({ state, conversation, baseInstructions, config })` — logika progu, observer, reflector, build context; obsługa błędów (fallback passthrough). | [ ] Test integracyjny z mock `chatFn`. |
| E2 | [CREATE] | **`src/agent/observational_memory/flush.ts`:** `flushObservationalMemory` — seal pozostałego taila na końcu runu. | [ ] Wołane gdy conversation > 0 i poniżej progu też OK. |
| E3 | [CREATE] | **`src/agent/observational_memory/index.ts`:** `createObservationalMemoryHooks(options?)` → `MemoryHooks`; opcje: `persistDir`, `sessionId`, overrides progów, inject `chat` dla testów. | [ ] `beforeTurn` woła processor; `afterTurn` flush na terminal. |
| E4 | [CREATE] | **`src/agent/observational_memory/index.ts`:** eksport `flushObservationalMemory`, typów config/state (dla testów/debug). | [ ] Public API spójne z README. |

### Faza F — Integracja pakietu

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| F1 | [MODIFY] | **`src/agent/memory.ts`:** zaktualizować komentarz scaffold — wskazać `createObservationalMemoryHooks`; OM vs Working plan vs mailbox journal. | [ ] Bez zmiany interfejsu `MemoryHooks`. |
| F2 | [MODIFY] | **`index.ts`:** eksport factory + typów z `observational_memory/`. | [ ] Import z pakietu działa. |
| F3 | [MODIFY] | **`src/utils/logger.ts` (opcjonalnie):** `logMemory(phase, detail)` z tagiem `[PAMIĘĆ]` dla observer/reflector (mirror lekcji). | [ ] Logi czytelne w demo. |

### Faza G — Testy

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| G1 | [CREATE] | **`src/agent/observational_memory/context.test.ts`**, **`utils.test.ts`**, **`processor.test.ts`**. | [ ] Pokrycie split, strip, threshold gate, mock observer. |
| G2 | [CREATE] | **`src/agent/observational_memory/observer.test.ts`:** parseObserverOutput fixtures. | [ ] Przechodzi. |
| G3 | [MODIFY] | **`src/agent/agent.test.ts`:** test — agent z OM mock + przekroczenie progu → instructions zawierają `<observations>`. | [ ] Bez regresji istniejących testów. |
| G4 | [REUSE] | Uruchomić `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate/` (fazy A–G). | [ ] Zero failures. |

### Faza H — Kalibracja tokenów (`usage` API)

Port wzorca z `lessons/02_05_agent/src/ai/tokens.ts`. **Dual estimator:** raw dla progów Observer, skorygowany dla obserwacji i Reflector.

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| H1 | [MODIFY] | **`src/types/index.ts`:** rozszerzyć `ModelResponse` o opcjonalne `usage?: { inputTokens: number; outputTokens: number }`. | [ ] Typ eksportowany; backward compatible. |
| H2 | [MODIFY] | **`src/agent/ai.ts`:** parsować `usage` z body Responses API (`usage.input_tokens`, `usage.output_tokens`); zwracać w `ModelResponse`. | [ ] Test: fixture JSON z `usage` → poprawne pola. |
| H3 | [MODIFY] | **`src/agent/observational_memory/types.ts`:** dodać `CalibrationState`, `UsageTotals`; pole `calibration` w `MemoryState`. | [ ] `freshCalibration()` helper. |
| H4 | [MODIFY] | **`src/agent/observational_memory/tokens.ts`:** dodać `estimateTokensCalibrated(text, cal?)`, `withSafetyMargin`, `recordActualUsage`, `trackUsage`, `getCalibration`; zachować `estimateTokensRaw` / `estimateConversationTokensRaw` bez kalibracji. | [ ] Test: ratio 1.5 po 600 actual tokens → calibrated = ceil(raw × 1.5). |
| H5 | [MODIFY] | **`config.ts`:** `OM_CALIBRATION_MIN_ACTUAL_TOKENS` (env, domyślnie `500`), `TOKEN_SAFETY_MARGIN` (domyślnie `1.2`, jak lekcja). | [ ] Używane w `estimateTokensCalibrated`. |
| H6 | [MODIFY] | **`src/agent/observational_memory/processor.ts`:** próg Observer → `estimateConversationTokensRaw`; `observationTokenCount` → calibrated; reflector target/compare → calibrated. | [ ] Test processor: ten sam raw poniżej progu, calibrated powyżej reflector progu. |
| H7 | [MODIFY] | **`observer.ts` / `reflector.ts`:** po `chatFn` wołać `trackUsage` z estimated input size i `response.usage`. | [ ] Log `[PAMIĘĆ]` opcjonalnie: estimated vs actual. |
| H8 | [MODIFY] | **`src/agent/agent.ts` + `memory.ts`:** rozszerzyć `AfterTurnContext` o `lastResponse?: { estimatedTokens: number; usage?: ModelResponse['usage'] }`; agent przekazuje po każdej turze LLM. W `createObservationalMemoryHooks.afterTurn` — `trackUsage` dla głównego agenta. | [ ] Kalibracja uczy się z tur ReAct, nie tylko z OM passes. |
| H9 | [MODIFY] | **`createObservationalMemoryHooks`:** opcja `enableCalibration?: boolean` (default `true`); gdy `false` — tylko raw (MVP). | [ ] Test: flag off → brak ratio. |
| H10 | [MODIFY] | **`persistence.ts`:** w frontmatter logów opcjonalnie `calibration_ratio`, `tokens_raw`, `tokens_calibrated`. | [ ] Tylko gdy persist on + calibration active. |
| H11 | [CREATE] | **`src/agent/observational_memory/tokens.test.ts`:** testy `trackUsage`, `getCalibration`, prog min actual, brak usage. | [ ] Przechodzi. |
| H12 | [REUSE] | `bun test` + `bunx tsc --noEmit` (A–H). | [ ] Zero failures; regresja A–G bez calibration flag off. |

### Faza I — Dokumentacja

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| I1 | [MODIFY] | **`README.md`:** sekcja Observational Memory — factory, env, przykład `createAgent({ memory: createObservationalMemoryHooks() })`, współistnienie z planning phase; podsekcja **Token calibration** (raw vs calibrated, `enableCalibration`). | [ ] Przykład copy-paste. |
| I2 | [MODIFY] | **`CHANGELOG.md`:** wpis [Unreleased] — OM + kalibracja tokenów. | [ ] Keep a Changelog. |
| I3 | [MODIFY] | **`tasks/docs/boilerplate-documentation.md`:** §4.3 — Observer/Reflector + dual estimator. | [ ] Diagram layout kontekstu + calibration flow. |
| I4 | [MODIFY] | **`tasks/.env.example`** (lub boilerplate doc table): `OM_MODEL`, `OM_PERSIST_DIR`, progi, `OM_CALIBRATION_MIN_ACTUAL_TOKENS`. | [ ] Wszystkie nowe env udokumentowane. |
| I5 | [MODIFY] | **`observational-memory.research.md`:** status → *Research zaakceptowany; plan: observational-memory.plan.md*. | [ ] Link do planu. |

### Faza J — Migracja s02e03 (osobny PR, po merge A–I)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| J1 | [MODIFY] | **`tasks/s02e03/src/observationalMemory.ts`:** cienki wrapper → `createObservationalMemoryHooks({ persistDir: journalPath })` lub deprecate na rzecz bezpośredniego importu w `agent.ts`. | [ ] s02e03 testy / smoke OK. |
| J2 | [MODIFY] | **`tasks/s02e03/src/agent.ts`:** użyć factory z boilerplate. | [ ] Brak duplikacji promptów OM. |

---

## 8. Zmienne środowiskowe (propozycja)

| Zmienna | Domyślnie | Opis |
| --- | --- | --- |
| `OBSERVER_THRESHOLD_TOKENS` | `30000` | Próg sealowania ogonu konwersacji (już istnieje). |
| `REFLECTOR_THRESHOLD_TOKENS` | `60000` | Próg uruchomienia Reflector (już istnieje). |
| `REFLECTION_TARGET_TOKENS` | `20000` | Docelowy rozmiar po kompresji + histereza wzrostu. |
| `OM_MODEL` | `gpt-4o-mini` | Model Observer/Reflector. |
| `OM_PERSIST_DIR` | *(pusty)* | Katalog logów debug; pusty = brak zapisu. |
| `OM_OBSERVER_MAX_OUTPUT_TOKENS` | `8192` | Cap completion Observer. |
| `OM_REFLECTOR_MAX_OUTPUT_TOKENS` | `10000` | Cap completion Reflector. |
| `OM_TAIL_RATIO` | `0.3` | Ułamek progu observera na surowy ogon. |
| `OM_MIN_TAIL_TOKENS` | `120` | Min budżet ogona w tokenach. |
| `OM_CALIBRATION_MIN_ACTUAL_TOKENS` | `500` | Min. skumulowanych tokenów API zanim ratio kalibracji zacznie działać. |
| `OM_TOKEN_SAFETY_MARGIN` | `1.2` | Mnożnik bezpieczeństwa na szacunku przed `recordActualUsage` (jak lekcja). |

---

## 9. Wytyczne testowe

- **Jednostkowe:** split, XML parse, strip/inject appendix, threshold bez LLM.
- **Kalibracja (faza H):** `trackUsage` z fixture usage; ratio null poniżej min actual; calibrated vs raw w processor.
- **Integracyjne (mock):** `processor` z inject `chatFn` zwracającym fixture Observer/Reflector + opcjonalne `usage`.
- **Agent:** mock adapter główny + OM z mock chat — regresja bez OM nietknięta; `afterTurn` przekazuje usage.
- **Ręczne:** epizod z `createObservationalMemoryHooks({ persistDir: './workspace/memory' })` — pliki logów po długim runie; w logach persist opcjonalnie `calibration_ratio`.

---

## 10. Bezpieczeństwo

- Obserwacje mogą zawierać fragmenty user query i output narzędzi — **nie logować** kluczy API.
- `OM_PERSIST_DIR` — użytkownik kontroluje lokalizację; ostrzeżenie w README (PII w logach).
- Observer/Reflector **nie wykonują** narzędzi MCP — tylko odczyt serializowanej historii.
- Persystencja domyślnie off — brak side effect w CI.

---

## 11. Kolejność realizacji (rekomendowana)

1. **A → B → C → D → E → F → G** — core OM (MVP, raw tokeny).
2. **H** — kalibracja `usage` API (wymaga lekkiej zmiany `agent.ts` / `AfterTurnContext`).
3. **I** — dokumentacja (OM + kalibracja).
4. **J** — PR `tasks/s02e03` po stabilizacji API.

Fazy A–I mogą być **jednym PR boilerplate**; faza J osobno.

---

## 12. Changelog planu

| Data | Autor | Zmiana |
| --- | --- | --- |
| 2026-05-21 | Architect / EM | Utworzenie planu OM (Opcja A) na podstawie zaakceptowanego researchu. |
| 2026-05-21 | Architect / EM | Dodana **faza H** — kalibracja tokenów z `usage` API; dokumentacja → faza I; s02e03 → faza J. |

---

## 13. Status implementacji

- [x] Fazy A–G (core OM)
- [x] Faza H (kalibracja tokenów)
- [x] Faza I (dokumentacja)
- [ ] Faza J (s02e03 migracja — osobny PR)
- [x] `bun test` + `tsc` — boilerplate
