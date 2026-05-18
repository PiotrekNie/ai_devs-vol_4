# Plan wdrożenia — wstępna faza planowania (P1, boilerplate)

**Normatywny research:** [initial-planning-phase.research.md](initial-planning-phase.research.md) — **zaakceptowany** (decyzje EM §9).  
**Workspace:** `tasks/boilerplate/` (`@ai-devs/agent-boilerplate`)

Ten dokument jest planem wdrożenia zgodnym z `@eversis-implement`: typy zadań `[CREATE]` / `[MODIFY]` / `[REUSE]`. **Implementacja kodu** następuje po akceptacji tego planu przez człowieka.

**Weryfikacja UI:** brak — zmiana dotyczy runtime agenta i logów terminalowych.

**Poza zakresem tego planu:**

- `delegate` / multi-agent — osobny spec `docs/specs/multi-agent-delegate/` (research §9.5.1).
- `http-request-post-body` (B1) — osobny plan; ortogonalny, można merge’ować równolegle.
- Wymuszenie `enablePlanningPhase` globalnie dla wszystkich epizodów.

---

## 1. Zakres (scope)

**W zakresie (boilerplate):**

| Element | Opis |
|---------|------|
| **Tura 0** | Osobne wywołanie LLM **przed** pętlą ReAct; **nie** liczy się do `MAX_ITERATIONS`. |
| **`enablePlanningPhase`** | `AgentConfig` — opt-in, domyślnie `false`. |
| **`tool_choice: "none"`** | W turze 0 model widzi listę narzędzi (nazwy/opisy), ale nie może ich wywołać. |
| **Persistencja planu** | Blok `## Working plan` wstrzyknięty do `instructions` na czas `runLoop`. |
| **`[PLAN]`** | `logPlan()` w `logger.ts`; tura 0 nie używa `logThought` dla treści planu. |
| **Prompt tury 0** | `src/prompts/planning_turn.md` — szablon struktury (cel, niewiadome, narzędzia, sukces, rewizja). |
| **Rewizja planu** | Instrukcja w szablonie + `system.md`: po istotnym błędzie narzędzi / feedbacku huba — zaktualizuj plan w myśli (tury 1..N); bez narzędzia `update_plan` (P3 odłożone). |
| **Testy** | `agent.test.ts`, ewentualnie `planning.test.ts`; `bun test` + `bunx tsc --noEmit`. |
| **Dokumentacja** | README, CHANGELOG, `tasks/docs/boilerplate-documentation.md`. |

**W zakresie (follow-up epizod — osobna faza G, ten sam cykl wdrożeniowy):**

| Element | Opis |
|---------|------|
| **s02e04 pilot** | `enablePlanningPhase: true` + skrócenie `mailbox_task.md` wg research §9.4.1. |

---

## 2. Analiza stanu obecnego (gap)

| Komponent | Stan | Gap |
|-----------|------|-----|
| `agent.ts` | `runLoop` od razu woła LLM z narzędziami | Brak pre-loop planowania |
| `ai.ts` / `ChatOptions` | Tylko `retryDelayBaseMs` | Brak `toolChoice` per wywołanie |
| `logger.ts` | `[MYŚL]`, `[AKCJA]`, … | Brak `[PLAN]` |
| `AgentConfig` | `memory`, `maxIterations`, … | Brak `enablePlanningPhase` |
| `system.md` | Miękka dyscyplina myślenia | Brak opisu opt-in tury 0 |
| Epizody | Własne „Strategie” | Bez zmian, dopóki nie włączą flagi |

---

## 3. Architektura docelowa

```text
processQuery(query) / processConversationTurn(prev, query)
  │
  ├─ enablePlanningPhase === false
  │     └─ runLoop(instructions)                    // jak dziś
  │
  └─ enablePlanningPhase === true
        ├─ [tura 0] runPlanningTurn()
        │     • instructions + planning_turn.md
        │     • input: conversation (user query)
        │     • tools: przekazane (kontekst), tool_choice: "none"
        │     • logPlan(content)
        │     • instructions' = injectWorkingPlan(instructions, plan)
        │     • opcjonalnie: dopisz assistant plan do conversation (bez tool output)
        │
        └─ runLoop(instructions')                   // pełne MAX_ITERATIONS
              iteration 0..maxIterations-1
              logThought w turach z toolami / bez
```

**Stałe (propozycja — `src/agent/planning.ts`):**

```ts
export const WORKING_PLAN_MARKER = "\n\n---\n## Working plan";
```

**Zachowanie przy naruszeniu kontraktu tury 0:**

- Jeśli model mimo `tool_choice: "none"` zwróci `toolCalls` → `logSystem` warning; **nie** wykonuj narzędzi; użyj `content` jeśli jest, inaczej krótki fallback w bloku planu („Plan unavailable — proceed cautiously”).
- Jeśli `content` puste → ten sam fallback + `logSystem`.

---

## 4. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
|--------|-----------|
| Podwójny blok planu przy wielu `processQuery` | `injectWorkingPlan` usuwa poprzedni segment od `WORKING_PLAN_MARKER` (jak `stripPreviousJournal` w mailbox_memory). |
| `memory.beforeTurn` nadpisuje `instructions` | `beforeTurn` dostaje już `instructions` z planem; hook nie usuwa markera (dokumentacja w `memory.ts` komentarz). |
| Testy bez drugiej odpowiedzi mocka | Nowe testy z `enablePlanningPhase: true` — adapter: `[planText, …react…]`. |
| Plan zbyt długi | `planning_turn.md`: limit ~400–600 słów; opcjonalnie `PLANNING_MAX_OUTPUT_TOKENS` w `config.ts` (domyślnie np. 1024). |
| Regresja epizodów bez flagi | Domyślnie `false`; istniejące testy agenta bez zmian ścieżki. |

---

## 5. Kryteria akceptacji (Definition of Done)

### Boilerplate

- [x] `enablePlanningPhase` domyślnie wyłączone; istniejące zachowanie bez flagi **identyczne** jak przed zmianą (test regresji).
- [x] Przy `enablePlanningPhase: true`: pierwsze wywołanie `generateResponse` ma `tool_choice: "none"`; w logu widać `[PLAN]`.
- [x] Pełne `MAX_ITERATIONS` tur ReAct **po** turze 0 (test: `maxIterations: 2` + plan + 2× tool call = 3 wywołania adaptera).
- [x] Po turze 0 `instructions` zawierają `## Working plan` z treścią modelu.
- [x] `bun test` i `bunx tsc --noEmit` w `tasks/boilerplate/` — OK.
- [x] README + CHANGELOG + `boilerplate-documentation.md` opisują flagę i `[PLAN]`.

### Epizod (faza G)

- [x] s02e04: `createAgent({ enablePlanningPhase: true, … })`.
- [x] `mailbox_task.md`: § Ograniczenia domenowe zamiast długiej § Strategia.

---

## 6. Plan fazowy i zadania

### Faza A — Adapter AI (`tool_choice`)

| ID | Typ | Zadanie | DoD |
|----|-----|---------|-----|
| A1 | [MODIFY] | **`src/agent/ai.ts`:** rozszerzyć `ChatOptions` o opcjonalne `toolChoice?: "auto" \| "none" \| "required"`; przekazać do `chat()` → body `tool_choice` gdy `tools.length > 0`. | [ ] Test jednostkowy lub mock fetch: przy `toolChoice: "none"` body zawiera `"tool_choice":"none"`. |
| A2 | [MODIFY] | **`createAIAdapter`:** przekazywać `options?.toolChoice` do `chat()`. | [ ] Typy eksportowane z `index.ts` bez zmiany breaking API (pole opcjonalne). |

### Faza B — Logger `[PLAN]`

| ID | Typ | Zadanie | DoD |
|----|-----|---------|-----|
| B1 | [MODIFY] | **`src/utils/logger.ts`:** dodać `logPlan(text: string)` z tagiem `[PLAN]` (np. kolor odróżniony od `[MYŚL]`). Zaktualizować nagłówek pliku (lista tagów). | [ ] Wywołanie widoczne w stdout; nie myli się z `logThought`. |
| B2 | [MODIFY] | **`index.ts`:** eksport `logPlan` (jeśli inne logi są eksportowane — spójnie z `logThought`). | [ ] Epizody mogą importować z pakietu. |

### Faza C — Moduł planowania

| ID | Typ | Zadanie | DoD |
|----|-----|---------|-----|
| C1 | [CREATE] | **`src/prompts/planning_turn.md`:** instrukcja tury 0 (struktura: Goal, Unknowns, Tools & order, Success criteria, Revision policy); bez hardcodowanych kroków domenowych. | [ ] Plik markdown, ładowany `readFileSync` jak `system.md`. |
| C2 | [CREATE] | **`src/agent/planning.ts`:** `WORKING_PLAN_MARKER`, `stripPreviousWorkingPlan()`, `injectWorkingPlan()`, `loadPlanningTurnPrompt()`, `buildPlanningInstructions(baseInstructions)`. | [ ] Testy jednostkowe strip/inject (bez LLM). |
| C3 | [MODIFY] | **`config.ts`:** opcjonalnie `PLANNING_MAX_OUTPUT_TOKENS` (env `AGENT_PLANNING_MAX_OUTPUT_TOKENS`, domyślnie 1024). | [ ] Używane w turze 0. |

### Faza D — Integracja w `createAgent`

| ID | Typ | Zadanie | DoD |
|----|-----|---------|-----|
| D1 | [MODIFY] | **`AgentConfig`:** `enablePlanningPhase?: boolean` (default `false`). | [ ] Typ w `agent.ts` + eksport w `index.ts`. |
| D2 | [MODIFY] | **`agent.ts`:** funkcja `runPlanningTurn({ ai, conversation, instructions, tools, chatOptions })` → `{ planText, instructionsWithPlan, conversationAfterPlan }`. | [ ] Woła `generateResponse` z `toolChoice: "none"`; `logPlan`; nie dispatchuje tooli. |
| D3 | [MODIFY] | **`processQuery` / `processConversationTurn`:** jeśli flaga — `runPlanningTurn` potem `runLoop` z wynikowymi `instructions`. | [ ] Ścieżka bez flagi nietknięta. |
| D4 | [MODIFY] | **`src/prompts/system.md`:** krótki akapit o opt-in `enablePlanningPhase` (nie włącza globalnie); odniesienie do tury 0 i working plan. | [ ] Bez checklist zmail/API. |
| D5 | [MODIFY] | **`src/agent/memory.ts`:** komentarz w scaffold — `beforeTurn` nie powinien usuwać `## Working plan`; fakty vs plan. | [ ] Tylko dokumentacja w kodzie. |

### Faza E — Testy

| ID | Typ | Zadanie | DoD |
|----|-----|---------|-----|
| E1 | [MODIFY] | **`src/agent/agent.test.ts`:** test — z flagą, adapter `[textResponse("Plan: …"), toolCall…, textResponse("done")]` → `[PLAN]` ścieżka, wynik `done`. | [ ] Przechodzi. |
| E2 | [CREATE] | **`src/agent/agent.test.ts` lub `planning.test.ts`:** test `maxIterations` — 2 pętle tool + plan = adapter call count (plan + 2 react min). | [ ] Potwierdza turę 0 poza limitem. |
| E3 | [MODIFY] | **`src/agent/agent.test.ts`:** test regresji — bez flagi, jeden response, jedno wywołanie adaptera. | [ ] Przechodzi. |
| E4 | [REUSE] | Uruchomić `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate/`. | [ ] Zero failures. |

### Faza F — Dokumentacja pakietu

| ID | Typ | Zadanie | DoD |
|----|-----|---------|-----|
| F1 | [MODIFY] | **`README.md`:** sekcja Planning phase (`enablePlanningPhase`, `[PLAN]`, tura 0, env opcjonalny). | [ ] Przykład `createAgent({ enablePlanningPhase: true })`. |
| F2 | [MODIFY] | **`CHANGELOG.md`:** wpis [Unreleased] — feature P1. | [ ] Keep a Changelog format. |
| F3 | [MODIFY] | **`tasks/docs/boilerplate-documentation.md`:** § pętla agenta — diagram z turą 0. | [ ] Zgodność z research §9.1.1. |
| F4 | [MODIFY] | **`initial-planning-phase.research.md`:** status → *Research zaakceptowany; plan: initial-planning-phase.plan.md*. | [ ] Link do planu. |

### Faza G — Pilot s02e04 (osobny commit / PR epizodu)

| ID | Typ | Zadanie | DoD |
|----|-----|---------|-----|
| G1 | [MODIFY] | **`tasks/s02e04/` entrypoint (`run.ts` / `index.ts`):** `enablePlanningPhase: true` w `createAgent`. | [ ] Agent startuje z turą 0. |
| G2 | [MODIFY] | **`tasks/s02e04/src/prompts/mailbox_task.md`:** usuń § Strategia (kroki 1–5); dodaj § **Ograniczenia domenowe** (3–5 punktów z research §9.4.1); zachowaj Deliverables, Anty-wzorce. | [ ] Brak numerowanej procedury. |
| G3 | [MODIFY] | **User query / bootstrap:** jedna linia o uwzględnieniu Ograniczeń domenowych przy planie. | [ ] W pliku startowym epizodu. |
| G4 | [REUSE] | Ręczny smoke: `bun --env-file=../.env run …` — w logu `[PLAN]` przed `[AKCJA]`. | [ ] EM potwierdza w QA. |

**Uwaga:** G1–G3 mogą być w PR epizodu zaraz po merge boilerplate; **nie blokują** merge Faz A–F, jeśli EM woli rozdzielić — ale research §9.4 wymaga skrócenia promptu **w cyklu włączenia flagi**, więc G nie powinno być odkładane w nieskończoność po włączeniu flagi w produkcji.

---

## 7. Wytyczne testowe

- **Jednostkowe:** strip/inject planu; agent z mock adapterem (plan + react).
- **Integracyjne:** brak w CI przeciwko prawdziwemu API (bez zmian).
- **Ręczne:** epizod z flagą — kolejność logów: `Query` → `[PLAN]` → `[AKCJA]`…

---

## 8. Bezpieczeństwo

- Plan może powtarzać fragmenty user query — **nie logować** env / kluczy API (bez zmian względem `[MYŚL]`).
- Tura 0 **nie wykonuje** narzędzi — brak dodatkowego wektora exfiltracji przez przypadkowy tool call.
- `enablePlanningPhase` nie zmienia uprawnień MCP — tylko kolejność wywołań LLM.

---

## 9. Kolejność realizacji (rekomendowana)

1. **A → B → C → D → E → F** (jeden PR boilerplate).
2. **G** (PR `tasks/s02e04` lub ten sam PR monorepo — decyzja EM przy implementacji).
3. Opcjonalnie równolegle: **`http-request-post-body`** (B1) — niezależny diff w `http_request.ts`.

---

## 10. Changelog planu

| Data | Autor | Zmiana |
|------|-------|--------|
| 2026-05-18 | Architect / EM | Utworzenie planu P1 na podstawie zaakceptowanego researchu §9. |

---

## 11. Status implementacji

- [x] Fazy A–F (boilerplate) — 2026-05-18  
- [x] Faza G (s02e04) — ten sam PR  
- [x] `bun test` + `tsc` — boilerplate i s02e04
