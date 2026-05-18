# Research — wstępna faza planowania po starcie agenta (boilerplate)

**Data:** 2026-05-18  
**Zakres:** `@ai-devs/agent-boilerplate` — analiza krytyczna pomysłu (bez implementacji)  
**Źródła:** `tasks/boilerplate/src/agent/agent.ts`, `memory.ts`, `prompts/system.md`; `tasks/s02e04/docs/specs/s02e04-mailbox/s02e04-mailbox.research.md` (mapowanie lekcji S02E04); `markdowns/s02e04-organizowanie-kontekstu-dla-wielu-watkow-1773922583.md` (poza repo — cytowane pośrednio).

**Status:** Zaimplementowano (P1 + pilot s02e04). Plan: [initial-planning-phase.plan.md](initial-planning-phase.plan.md).

---

## 1. Opis pomysłu (własne słowa)

Po starcie zadania agent **najpierw** przeprowadza jawny proces myślowy w stylu:

- *Co mam osiągnąć?*
- *Co muszę zrobić, żeby to osiągnąć?*
- *Jakie narzędzia mam do dyspozycji i jak je sensownie ułożyć?*

Treść planu ma wynikać z **modelu**, nie z hardcodowanej checklisty w kodzie. W kolejnych iteracjach ReAct agent może **korygować** plan po wynikach narzędzi i feedbacku (hub, błędy MCP).

---

## 2. Stan obecny (baseline)

| Mechanizm | Co robi dziś | Planowanie? |
|-----------|----------------|-------------|
| **ReAct loop** (`agent.ts`) | Od razu `generateResponse` → opcjonalnie `content` + `toolCalls` | Tylko jeśli model sam napisze myśl przed toolami |
| **`logThought(content)`** | Loguje tekst modelu przed akcją | Obserwowalność, brak kontraktu „to jest plan” |
| **`system.md`** | „Think step by step before calling any tool” | Miękka dyscyplina, **bez egzekucji** |
| **`MemoryHooks.beforeTurn`** | Trim / journal (Observer w s02e03, fakty w s02e04) | **Wsteczna** kompresja i stan faktów, nie plan naprzód |
| **Prompty epizodu** (np. `mailbox_task.md`) | Sekcja „Strategia (kolejność myślenia)” | Planowanie **domenowe**, ręcznie w markdown |

**Wniosek:** Pomysł nie duplikuje pustego runtime’u — wypełnia lukę między „proszę myśl” a **gwarantowanym pierwszym krokiem poznawczym** zanim poleci pierwsze `function_call`.

---

## 3. Mapowanie na lekcję S02E04 (organizowanie kontekstu)

Z researchu epizodu mailbox (§5):

- Lekcja promuje **blackboard**, **orchestrator**, wzorce wieloagentowe — dla zadania domowego **nie** wymaga wielu procesów LLM.
- Rekomendacja: **jeden orchestrator (jeden LLM)** + stan roboczy + iteracja po feedbacku.

**Pomysł użytkownika = orchestrator w czasie, nie w procesie:**

| Koncepcja lekcji | Odpowiednik w pomysle |
|------------------|------------------------|
| Orchestrator | Jedna instancja LLM, ale **faza 0** = ułożenie planu |
| Blackboard | Plan + później fakty (journal / mailbox_memory) |
| Delegate/message | **Nie** — nadal jeden wątek |
| Konflikt / aktywna skrzynka | Plan musi być **rewidowalny** w turach 1..N |

**Zgodność:** Wysoka — to jest „lekkie” wielowątkowość **w jednym kontekście** (plan → działanie → aktualizacja), zamiast drugiego agenta.

---

## 4. Wpływ na rozwiązywanie kolejnych zadań

### 4.1 Korzyści (realne)

1. **Mniej „ślepych” pierwszych tool calli** — incydent `http_request` POST bez `body` (research `http-request-post-body`) często wynika z działania przed zrozumieniem kontraktu API; plan z krokiem „najpierw `help` / poznaj wymagane pola” jest naturalną mitigacją **obok** walidacji Zod.
2. **Świadomość zestawu narzędzi** — przy 6+ MCP model czasem wybiera złe narzędzie; jawne wyliczenie w planie zmniejsza to ryzyko.
3. **Lepsza obserwowalność** — osobna faza + tag **`[PLAN]`** w logach (§9.3); odróżnienie od zwykłej myśli w `[MYŚL]` w turach 1..N.
4. **Spójność między epizodami** — wspólny mechanizm w boilerplate; epizody z flagą **skracają** „Strategię” do ograniczeń domenowych (§9.4.1), procedurę generuje tura 0.
5. **Budżet iteracji** — tura 0 poza `MAX_ITERATIONS` (§9.1); pełny budżet N zostaje na ReAct z narzędziami.

### 4.2 Koszty i ryzyka

| Ryzyko | Opis | Siła |
|--------|------|------|
| **Koszt tokenów + czasu** | +1 pełne wywołanie LLM na start (tura 0) | Średnia |
| **Budżet `MAX_ITERATIONS`** | ~~Faza planu zużywa 1 z N~~ → **rozstrzygnięte:** tura 0 **nie** wchodzi w licznik pętli ReAct | Niska (po §9.1) |
| **Plan pozorny** | Model wypisze plan i i tak złamie go w turze 1 (performative planning) | Średnia |
| **Sztywność** | Zły plan na starcie → opóźnienie zanim wyniki narzędzi go skorygują | Średnia |
| **Duplikacja z promptem epizodu** | `mailbox_task.md` już ma kroki 1–5; trzecia warstwa (boilerplate + epizod + plan) → konflikt priorytetów | Średnia przy słabym designie |
| **Zadania proste** | Jedno `submit_to_hub` — plan to szum | Niska–średnia |
| **Testy** | Mock adapter musi uwzględnić fazę planu; regresje w `agent.test.ts` | Średnia (jednorazowo) |

### 4.3 Zadania, które zyskają najwięcej / najmniej

| Typ zadania | Zysk z fazy planowania |
|-------------|-------------------------|
| Wieloetapowe API (zmail, hub verify, pliki) | **Wysoki** |
| Długi kontekst / wiele tooli | **Wysoki** |
| Jednokrokowe (jeden URL → odpowiedź) | **Niski** — overhead |
| Zadania z gotową „Strategią” w prompcie | **Umiarkowany** — plan generyczny + strategia domenowa muszą się zgrać |

---

## 5. Wpływ na pracę samego agenta (runtime)

### 5.1 Co się **nie** zmienia samo z siebie

- Sam ReAct **już pozwala** na myślenie w `content` przed toolami — problem to **niepewność**, że model to zrobi.
- Walidacja narzędzi (Zod, POST+body) nadal potrzebna — plan **nie zastępuje** twardych guardraili.

### 5.2 Co się zmienia przy wdrożeniu

- **Kształt pierwszej tury:** albo `tool_choice: none`, albo osobne wywołanie przed pętlą — model **musi** wydać plan bez akcji (jeśli tak zaprojektujemy).
- **Persystencja planu:** jeśli plan zostanie tylko w `content` pierwszej wiadomości assistant i kontekst urośnie, plan **zanika** (trim Observer / mailbox_memory). Trzeba:
  - wstrzyknąć skrót do `instructions` (`---\n## Working plan`), **albo**
  - dopisać do journal / blackboard, **albo**
  - narzędzie natywne `update_plan` (bardziej „lekcja S02E04”, więcej kodu).
- **Rewizja planu:** trzeba jawnie pozwolić (prompt: „po istotnym wyniku narzędzia zaktualizuj plan”) — inaczej faza 0 jest dekoracją.

### 5.3 Interakcja z `MemoryHooks`

| Hook | Relacja do planu |
|------|------------------|
| `beforeTurn` @ iteration 0 | Naturalne miejsce na wymuszenie „najpierw plan” **lub** wstrzyknięcie szablonu planu |
| Observer (s02e03) | Kompresuje historię — **nie** chroni planu, chyba że plan jest w journal/instructions |
| mailbox_memory (s02e04) | Ekstrahuje **fakty** (`date`, `password`, …) — **ortogonalne** do planu procedury |

**Rekomendacja architektoniczna:** plan = **proceduralna** pamięć (co robię dalej); journal/fakty = **deklaratywna** (co już wiem). Nie mieszać w jednym bloku bez nagłówków.

---

## 6. Opcje wdrożenia (od najlżejszej)

| ID | Podejście | Egzekucja planu | Persistencja | Złożoność |
|----|-----------|-----------------|--------------|-----------|
| **P0** | Tylko mocniejszy `system.md` | Miękka | Brak | Minimalna |
| **P1** | Flaga `planningPhase: true` → pierwsza iteracja `tool_choice: "none"` + krótki prompt struktury (cele, niewiadome, narzędzia, kryterium sukcesu) | Twarda (1 tura) | Wklej plan do `instructions` w `beforeTurn` po turze 0 | Niska w boilerplate |
| **P2** | Osobne `ai.generateResponse` przed `runLoop` (pre-flight) | Twarda | Jak P1 | Średnia |
| **P3** | Natywne narzędzie `update_plan` / `read_plan` | Model aktualizuje plan świadomie | Jawny blackboard w stanie agenta | Wyższa |
| **P4** | Drugi agent „planner” | Twarda, 2× LLM | Protokół między agentami | **Odrzucona** dla kursu (patrz s02e04 §9.2) |

**Rekomendacja (research):** **P1** w boilerplate — **opt-in per epizod** (`enablePlanningPhase?: boolean`, domyślnie `false`), z **szablonem struktury**, nie treścią kroków. Epizod włącza flagę w `createAgent({ ... })` i ewentualnie doprecyzowuje prompt domenowy (§9.4).

**Czego unikać:** hardcodowania listy kroków typu „najpierw help, potem search” w TS — to należy do promptu epizodu lub do wygenerowanego planu.

---

## 7. Krytyczna ocena pomysłu (werdykt)

### 7.1 Czy warto?

**Tak, jako opcjonalna warstwa runtime’u**, nie jako zastąpienie:

- promptów domenowych,
- walidacji narzędzi,
- ani Observer/Reflector.

Pomysł trafnie adresuje **lukę koordynacyjną** opisaną w lekcji S02E04 (orchestrator) bez przechodzenia na wieloagentowość.

### 7.2 Warunki sukcesu

1. Plan **strukturalny**, nie narracyjny esej (limit tokenów, np. max 400–600 tokenów).
2. Plan **persistowany** poza pierwszą turą (instructions lub journal).
3. Jawna **rewizja** po błędzie narzędzia / feedbacku huba.
4. **Tura 0 poza `MAX_ITERATIONS`** — osobna faza przed pętlą `for (iteration …)`; licznik ReAct startuje od 0 dopiero po planie (§9.1).
5. Epizody z „Strategią” — przy `enablePlanningPhase: true` **obowiązkowo skrócić** sekcję procedury; zostawić tylko ograniczenia domenowe (§9.4.1).
6. Log **`[PLAN]`** dla treści tury 0; `[MYŚL]` zostaje dla myśli w turach narzędziowych (§9.3).

### 7.3 Kiedy **nie** wdrażać globalnie

- Gdy wystarczy P0 + B1 (`http_request` POST+body) + prompty epizodu — dla wąskich incydentów to tańsze.
- Gdy zadanie ma budżet 3–5 iteracji — plan + verify + search może nie zmieścić się w N.

---

## 8. Powiązanie z równoległym tematem (`http-request-post-body`)

Oba tematy łączy **jakość pierwszej akcji**:

| Mitigacja | Warstwa | Skuteczność |
|-----------|---------|-------------|
| Walidacja POST+body (B1) | Narzędzie | **Twarda** — blokuje błąd |
| Faza planowania (ten research) | Zachowanie modelu | **Miękka–średnia** — zmniejsza prawdopodobieństwo |
| Prompt „POST wymaga body” | Instrukcja | **Miękka** |

**Wniosek:** Planowanie **uzupełnia** B1; nie zastępuje. Warto robić oba, jeśli celem boilerplate jest edukacyjny „dobry agent”, nie tylko bezpieczne HTTP.

---

## 9. Decyzje EM (zamknięte)

| # | Pytanie | Decyzja |
|---|---------|---------|
| 9.1 | Budżet iteracji | **Tura 0 poza `MAX_ITERATIONS`.** Osobne wywołanie LLM (`tool_choice: "none"`) przed wejściem w pętlę ReAct. Pętla `for (let iteration = 0; iteration < maxIterations; …)` liczy **wyłącznie** tury z możliwymi narzędziami. Przy `MAX_ITERATIONS=10` agent ma 10 tur akcji + 1 turę planu. |
| 9.2 | Domyślne włączenie | **Opt-in per epizod.** W boilerplate `enablePlanningPhase` domyślnie `false` (lub brak pola = false). Epizod przekazuje `enablePlanningPhase: true` w `createAgent`. Szablon `system.md` opisuje mechanizm; nie wymusza go globalnie. |
| 9.3 | Widoczność planu | **Tak — tag `[PLAN]`.** Nowa funkcja w `logger.ts` (np. `logPlan(text)`), wywoływana wyłącznie po turze 0. `[MYŚL]` pozostaje dla `content` w turach 1..N, żeby w logach kursu było widać: najpierw plan, potem bieżące rozumowanie. |
| 9.4 | Sekcja „Strategia” w epizodach | **Tak — skrócić**, gdy epizod włącza `enablePlanningPhase: true` (§9.4.1). Bez flagi — prompty bez zmian. |
| 9.5 | Narzędzie `delegate` | **Tak — osobny spec**, poza scope P1 (§9.5.1). |

### 9.1.1 Semantyka tury 0 (implementacyjna)

```text
processQuery / processConversationTurn
  → [tura 0] generateResponse(tool_choice: none) → logPlan → wstrzyknięcie bloku do instructions
  → runLoop(iteration 0 .. maxIterations-1)   // pełny budżet MAX_ITERATIONS
```

- `memory.beforeTurn` przy `iteration === 0` w pętli ReAct **nie** zastępuje tury planu — plan jest już w `instructions` (marker np. `## Working plan`).
- Testy: adapter mock = najpierw odpowiedź tekstowa (plan), potem sekwencja toolowych tur.

### 9.4.1 Czy po P1 skraca się „Strategia” w promptach epizodów?

**Decyzja EM: tak.** Włączenie `enablePlanningPhase: true` w epizodzie **wiąże się** ze skróceniem sekcji „Strategia” (lub jej zastąpieniem) w promptach tego epizodu. Samo wdrożenie P1 w boilerplate **nie** edytuje promptów innych pakietów — redakcję robi task epizodu w tym samym cyklu co włączenie flagi.

**Dwie warstwy — nie to samo:**

| Warstwa | Kto ją tworzy | Co zawiera | Przykład |
|---------|----------------|------------|----------|
| **Plan runtime (tura 0)** | Model w turze 0 | Cele, niewiadome, kolejność narzędzi *wywnioskowana* z zadania i listy tooli | „Najpierw help na zmail, potem search…”) |
| **Prompt epizodu (po skróceniu)** | Autor zadania (markdown) | Deliverables, **ograniczenia domenowe**, anty-wzorce — bez duplikatu procedury | `mailbox_task.md` — bez długiej § Strategia krok po kroku |

**Co usunąć / skrócić** (przenosi się do planu z tury 0):

- Numerowana checklista kroków („1. help → 2. search → …”).
- Powtórzenie ogólnego „myśl krok po kroku” (jest w szablonie tury 0 boilerplate).
- Lista narzędzi opisana tak samo jak w schematach MCP.

**Co zostawić** w prompcie epizodu:

- Deliverables i format odpowiedzi (`task_name`, pola `answer`, constrainty typu `SEC-` + 32 znaki).
- Anty-wzorce i błędy, których model **nie wywnioskuje** z tooli (np. aktywna skrzynka, brak treści z subject bez `getMessages`).
- Krótka sekcja **„Ograniczenia domenowe”** (3–5 punktów) — wejście do planu, nie drugi plan.

**Wzorzec redakcji (obowiązkowy przy włączeniu flagi):**

1. Usuń lub zastąp „Strategia (kolejność myślenia)” sekcją **„Ograniczenia domenowe”**.
2. W `index.ts` / user query: jedna linia — *„Przy budowie planu (tura 0) uwzględnij Ograniczenia domenowe poniżej.”*
3. Kryterium akceptacji epizodu: brak duplikatu procedury między promptem a `[PLAN]` w logu.

**s02e04 (`mailbox_task.md`):** skrócić § Strategia zgodnie z powyższym, gdy epizod dostanie `enablePlanningPhase: true` (zadanie w planie P1 lub osobnym PR epizodu — **nie** opóźniać w nieskończoność).

Epizody **bez** `enablePlanningPhase` — **bez zmian** w promptach.

### 9.5.1 Czy `delegate` (lekcja) to osobny spec?

**Decyzja EM: tak.** `delegate` / wieloagentowość z lekcji S02E04 to **osobny spec i osobna implementacja** — **poza** `initial-planning-phase` (P1). Nie planować narzędzia `delegate` w `*.plan.md` dla P1.

| Aspekt | P1 (tura 0) | Przyszłe `delegate` |
|--------|-------------|---------------------|
| Procesy LLM | **Jeden** | Orchestrator + co najmniej jeden pod-agent / worker |
| Mechanizm | Tekst planu + ten sam wątek ReAct | Wywołanie narzędzia, przekazanie pod-zadania, zwrot wyniku |
| Stan | Blok w `instructions` / working plan | Blackboard, kolejka zadań, ewentualnie osobna sesja |
| Iteracje | Tura 0 + `MAX_ITERATIONS` | Budżet per agent; ryzyko eksplozji kosztów |
| Lekcja S02E04 | Orchestrator **w czasie** (jeden model) | Orchestrator **w architekturze** (wiele ról) |

**Dlaczego nie łączyć w jednym tasku P1:**

- `delegate` wymaga kontraktu narzędzia (Zod), routingu, timeoutów, formatu `message`, ewentualnie izolacji kontekstu — to inny moduł niż „wymuś jedną turę bez tooli na starcie”.
- P1 **nie blokuje** przyszłego `delegate`: working plan w `instructions` może później zawierać wpis „deleguj analizę logów do sub-agenta”, gdy narzędzie istnieje.
- Zadanie domowe **mailbox** (s02e04 research §9.2) **nie wymaga** `delegate` — wystarczy jedna pętla + plan.

**Ścieżka dokumentacji (obowiązuje po P1):** `tasks/boilerplate/docs/specs/multi-agent-delegate/` — osobny `*.research.md` → `*.plan.md` → implementacja; start po ustabilizowaniu P1 lub równolegle, jeśli priorytet lekcji jest wyższy — **bez** mieszania w PR `initial-planning-phase`.

---

## 10. Następny krok (po akceptacji researchu)

1. Akceptacja researchu + decyzji §9.
2. **`initial-planning-phase.plan.md`** — P1: `agent.ts`, `AgentConfig.enablePlanningPhase`, tura 0, `logPlan` / `[PLAN]`, wstrzyknięcie planu do `instructions`, testy, README/CHANGELOG.
3. **Epizod z flagą:** przy pierwszym `enablePlanningPhase: true` (np. s02e04) — **w tym samym cyklu** skrócić prompt wg §9.4.1 (`mailbox_task.md` itd.); może być osobny commit/PR epizodu zaraz po merge boilerplate.
4. Równolegle lub wcześniej: `http-request-post-body` (B1) — ortogonalne do P1.

---

## 11. Źródła w repo

- `tasks/boilerplate/src/agent/agent.ts` — pętla ReAct, `memory.beforeTurn`, brak fazy pre-loop.
- `tasks/boilerplate/src/prompts/system.md` — „Think step by step”.
- `tasks/s02e04/docs/specs/s02e04-mailbox/s02e04-mailbox.research.md` — §5, §9.2 (jeden agent vs dwóch).
- `tasks/boilerplate/docs/specs/http-request-post-body/http-request-post-body.research.md` — motywacja guardraili vs zachowanie.
