# S04E02 — Aktywna współpraca z AI → boilerplate (research)

**Task:** Przeanalizować lekcję S04E02 pod kątem opisanych funkcjonalności i metodologii oraz ocenić, czy którekolwiek z nich warto dodać do `tasks/boilerplate` (`@ai-devs/agent-boilerplate`) — **w oderwaniu od zadania domowego `windpower`**.

**Data:** 2026-06-17  
**Status:** Research **zaakceptowany** (2026-06-17); implementacja docs **zrealizowana** (2026-06-17).  
**Plan:** [s04e02-active-collaboration.plan.md](s04e02-active-collaboration.plan.md) — Opcja A + B — **done**.

**Źródła:**

- `markdowns/s04e02-aktywna-wspolpraca-z-ai-1774908365.md` — transkrypt lekcji (`published_at: 2026-03-31`, status: scheduled)
- `tasks/boilerplate/` — ReAct runtime, MCP, OM, tool discovery, observability, planning
- `tasks/docs/boilerplate-documentation.md` — spec produktowa (§2.1–§2.5)
- `tasks/boilerplate/docs/specs/s03e03-contextual-feedback/` — MCP Sampling, triggery, hooki (precedens „nie core”)
- `tasks/boilerplate/docs/specs/s04e01-production-deployments/` — skills/workflows, sync/async, garden (precedens §2.5)
- `tasks/boilerplate/docs/specs/s03e05-nondeterministic-models/` — MCP Apps, generatywne UI (precedens host poza pakietem)

**Weryfikacja UI:** brak (lekcja koncepcyjna + diagramy; brak folderu `lessons/04_02_*` w repo).

**Scope wyłączony:** homework **`windpower`** (API z oknem 40 s, kolejkowane akcje async, równoległość w kodzie epizodu) — osobny profil epizodu hub; **nie wpływa** na werdykt rozszerzeń pakietu kursowego.

---

## 1. Executive summary

**Werdykt: lekcja S04E02 uczy głównie *wyboru kanału współpracy z AI* (CLI, MCP, komunikatory, dedykowany UI), *ograniczeń hostów MCP* oraz *personalizacji po stronie aplikacji* (profile, skills, meta-prompty). To kontynuacja linii S03E03 / S04E01 — **produkt i architektura hosta**, nie brakujące klocki domyślnego ReAct w `@ai-devs/agent-boilerplate`.**

| Obszar lekcji | W boilerplate domyślnie? | Gdzie indziej |
| --- | --- | --- |
| ReAct + MCP + hub | **Tak** | `@ai-devs/agent-boilerplate` |
| Wybór interfejsu (CLI / MCP / Slack / custom / hybryda) | **Docs** | proponowane §**2.6** |
| ACP (Agent Client Protocol) | **Docs** (wzmianka) | host aplikacji / IDE |
| MCP jako integracja vs dedykowany UI | **Docs** | §2.6; cross-link §2.5 |
| Ograniczenia klientów MCP (brak samplingu, słaba kontrola UI narzędzi) | **Docs** | §2.6 + §2.2 S03E03 |
| MCP Apps (postęp, interakcja) | **Nie** | `lessons/03_05_apps/`; §2.4 |
| Zespół agentów / multi-agent na jedno zdarzenie | **Nie** | orchestrator poza `createAgent`; `03_02_events/` |
| Profile, subagenci, skills, workflows, hooki | **Nie** | host aplikacji; `04_01_garden/`; §2.5 |
| UX wywołań narzędzi (potwierdzenie, anulowanie, postęp) | **Nie** | warstwa UI hosta |
| Mikro-akcje (skróty, transformacje zaznaczenia) | **Nie** | skrypty / aplikacja desktop |
| Meta-prompty (generowanie instrukcji agenta z rozmowy) | **Docs + wzorzec epizodu** | analogia do `enablePlanningPhase`; nie moduł core |
| Augmented Function Calling / personalizacja narzędzi | **Częściowo** | §2.3 S03E04; epizod rejestruje wąskie MCP |
| Metadata w wiadomości użytkownika | **Wzorzec** | §2.2 S03E03 |
| Równoległe / kolejkowane API (motyw z homework) | **Poza scope** | deterministyczny TS lub code mode w epizodzie — **nie** uzasadnia zmiany core z tego researchu |

**Reguła kciuka (spójna z S03E02–S04E01):**

```text
Epizod hub (ReAct, http_request, /verify, ≤5 tur) → default boilerplate bez zmian.
Integracja z Cursor / Claude / Slack → MCP serwer epizodu + docs §2.6 — nie chat UI w pakiecie.
Profile / skills / subagenci / meta-prompty produktowe → host aplikacji lub lekcja — nie createAgent.
Multi-agent i praca w tle → orchestrator poza pętlą ReAct (03_02_events) — nie agent.ts.
```

---

## 2. Funkcjonalności z lekcji (poza homework `windpower`)

### 2.1 Warstwa koncepcyjna — aktywna współpraca

| Temat | Opis | Runtime w boilerplate? |
| --- | --- | --- |
| Od czatu do „zespołu agentów” | Jedno zdarzenie → wiele agentów/kroków | **Nie** — orchestracja poza `createAgent` |
| Trend: więcej niż 1:1 wiadomość–odpowiedź | Zarządzanie kontekstem, integracje, autonomia | Częściowo **już** (OM, planning, discovery) |
| Decyzja: gotowe vs własne rozwiązanie | Ekonomia (subskrypcja vs API), zasięg użytkowników | **Docs** — §2.6 |
| CLI jako domyślny kanał (dev) | Cursor, Claude Code, sandbox zdalny | **Poza pakietem** — środowisko użytkownika |
| MCP + MCP Apps | Integracja z istniejącymi klientami; UI w narzędziu | Serwer MCP **tak**; Apps **nie** w core |
| Komunikatory (Slack, Telegram, Discord) | Boty, kanały, streaming | **Epizod / aplikacja** — nie boilerplate |
| Dedykowany interfejs | Pełna kontrola UX, uprawnień, statusu tła | **Aplikacja poza pakietem** |
| **ACP** | JetBrains, Zed ↔ agenci (Codex, Cursor) | **Docs** — standard hosta, nie runtime kursu |
| Hybryda kanałów | Łączenie opcji zamiast jednego wyboru | **Docs** — architektura produktu |

**Wniosek:** Lekcja nie proponuje nowego API w `createAgent` — uczy **mapy decyzyjnej kanału dostarczenia agenta**, uzupełniając §2.5 (wdrożenie) o perspektywę **współpracy użytkownika z AI**.

### 2.2 MCP w hostowanym kliencie vs własny interfejs

Przykład agenta marketingowego (statystyki, monitoring, raporty) ilustruje ograniczenia podłączenia przez Claude.ai:

| Ograniczenie hosta MCP | Implikacja dla kursu | Boilerplate |
| --- | --- | --- |
| Brak **MCP Sampling** | Serwer nie może „poprosić” klienta o completion w narzędziu | **Nie** implementować samplingu w domyślnym serwerze — [S03E03 §2.1](../s03e03-contextual-feedback/s03e03-contextual-feedback.research.md) |
| Słaba personalizacja system prompt | Logika w opisach narzędzi + zwracanym JSON | Wzorzec **wąskich MCP** (§2.3) |
| Brak kontroli UI wywołań narzędzi | Potwierdzenia / dopytania przez treść narzędzia lub `ask_human` | `ask_human` **sync stdin** — nie zastępuje UI web |
| Uprawnienia wielu kampanii/klientów | Auth w MCP / backend epizodu | **Epizod** |
| Działania w tle + status | Słabe powiadomienia w hostcie | **Async entrypoint** — §2.5, `03_02_events/` |
| **MCP Apps** częściowo łagodzą UX | Postęp, interakcja w kliencie | Lekcja `03_05_apps` — host |

**Wniosek:** Boilerplate **już dostarcza serwer MCP in-process** dla epizodów; lekcja argumentuje, **kiedy serwer MCP nie wystarczy** bez własnego frontu — to materiał na **§2.6**, nie nowy moduł.

### 2.3 Personalizacja interakcji (profile, skills, narzędzia, workflow)

| Mechanizm | Opis w lekcji | Mapowanie w repo |
| --- | --- | --- |
| **Profile / subagenci** | Wiele kontekstów, @mention, generowanie konfiguracji | `04_01_garden` skills; **nie** `createAgent` — [S04E01 §2.2](../s04e01-production-deployments/s04e01-production-deployments.research.md) |
| **Skills (umiejętności)** | Predefiniowane instrukcje, wywołanie przez użytkownika lub model | Cursor/Eversis skills; garden `SKILL.md` |
| **Narzędzia** | Włącz/wyłącz, personalizacja (Augmented FC) | `toolDiscovery` opt-in; wąskie schematy w epizodzie |
| **Workflow** | Serie powtarzalnych akcji | Prompty epizodu + `enablePlanningPhase`; garden workflows |
| **Hooki / zadania zaplanowane** | Automatyzacja, tło | `03_02_events/`; hooki w lekcjach `03_03_*` |
| **UX narzędzi** | Postęp, błędy, pause/cancel | Terminal `[AKCJA]`/`[WYNIK]` — minimalne; pełny UX = host |

**Wniosek:** Większość **duplikuje werdykt S04E01** (skills/workflows w hoście). Nowość S04E02 to **akcent na jakość interfejsu współpracy**, nie brakujący runtime.

### 2.4 Jednorazowe zadania i mikro-akcje

Skróty klawiszowe, transformacje zaznaczenia, Siri Shortcuts, Tauri/Electron — **poza misją** pakietu ReAct dla zadań hub. Ewentualnie **jeden akapit w §2.6** („kiedy agent to overkill → skrypt + skrót”).

### 2.5 Meta-prompty

Struktura meta-promptu (dane → wiedza → rezultat; fazy: proces, strategia, dopasowanie, format, zasady, natywne funkcjonalności, selekcja, reguły krytyczne):

| Element | Zastosowanie | Boilerplate |
| --- | --- | --- |
| Generowanie instrukcji z rozmowy | Onboarding, subagenci, optymalizacja promptów | **Docs** — wzorzec autora produktu |
| **Ustawienia agenta** obok promptu | Model, tryby, aktywne narzędzia | **Nie** — konfiguracja hosta / `createAgent` w epizodzie |
| Metadata + reguły krytyczne na końcu | Spójność z §2.2 S03E03 | **Już udokumentowane** |
| Wielofazowe generowanie | Rozbicie na etapy | Analogia: **`enablePlanningPhase`** (turn 0, bez narzędzi) — **nie** pełny meta-prompt engine |

**Wniosek:** Meta-prompty to **metodologia prompt engineeringu produktowego** — warto **§2.6** (krótki rozdział + link do przykładu z lekcji), **nie** moduł `generateAgentFromConversation()` w pakiecie.

### 2.6 Brak referencyjnej lekcji w repo

W przeciwieństwie do S04E01 (`lessons/04_01_garden/`) **nie ma** `lessons/04_02_*`. Lekcja S04E02 jest **transkrypt + diagramy + homework API** — werdykt opiera się na treści markdown, nie na kodzie demo w monorepo.

---

## 3. Mapowanie na stan `tasks/boilerplate`

### 3.1 Już pokryte (bez zmian)

| Potrzeba z lekcji / kursu | Mechanizm |
| --- | --- |
| Pętla agenta + narzędzia | `createAgent`, ReAct |
| Serwer MCP dla integracji z klientami | `createBoilerplateMcpServer`, `registerTool` |
| Sync: człowiek w pętli | `ask_human` (stdin) |
| Multi-turn | `processConversationTurn` |
| Plan przed działaniem | `enablePlanningPhase`, `planning_turn.md` |
| Lazy narzędzia | `toolDiscovery` |
| Długa sesja / kontekst | OM opt-in |
| Observability | Langfuse opt-in |
| Metadata w user message | Wzorzec S03E03 (kod epizodu) |
| Wąskie, spersonalizowane MCP | §2.3; lekcja `03_04_gmail` |
| MCP Apps / generatywne UI | §2.4; lekcje `03_05_*` |
| Skills / workflows / garden | §2.5 |
| Async / proaktywność | §2.5 → `03_02_events/` |

### 3.2 Luka dokumentacyjna (warto uzupełnić)

Brak sekcji **§2.6** w `tasks/docs/boilerplate-documentation.md` dla:

- **Mapy kanałów współpracy** (CLI, MCP-only, messenger, dedykowany UI, hybryda) — kiedy który;
- **MCP jako produkt integracyjny** vs **własny front** (ograniczenia samplingu, system prompt, UX narzędzi, tło);
- **Profile / subagenci / skills** — host aplikacji (cross-link §2.5, garden, Cursor Collections);
- **Meta-prompty** — wzorzec generowania instrukcji; relacja do `enablePlanningPhase` i `@eversis-*` w Cursor;
- **Multi-agent** — jedno zdarzenie, wielu agentów → orchestrator poza `createAgent`;
- **Mikro-akcje** — kiedy nie budować agenta;
- **ACP** — jedna linia jako emerging standard host↔agent (bez implementacji).

### 3.3 Rozszerzenia runtime — ocena

| Propozycja | Zysk | Koszt / ryzyko | Rekomendacja |
| --- | --- | --- | --- |
| Moduł **skills** (`/skill`, `SKILL.md`) | UX jak Claude Code | Duży API host-specific | **Nie** — §2.5 |
| **Subagent router** w `createAgent` | Profile w jednej pętli | Mylenie z multi-agent orchestration | **Nie** |
| **Meta-prompt generator** w pakiecie | Onboarding produktów | Poza scope kursu hub | **Nie** — docs §2.6 |
| **MCP Sampling** w domyślnym serwerze | Narzędzia wołające LLM | Słabe wsparcie klientów; złożoność | **Nie** — S03E03 |
| **Parallel tool dispatch** (`Promise.all`) | Szybsze multi-call w jednej turze | Semantyka kolejności; homework-specific | **Defer / nie** — epizod może orchestration w TS; poza werdyktem S04E02 |
| Integracja **Slack/Telegram** | Kanał z lekcji | Osobna aplikacja | **Nie** |
| **Tool approval / cancel** hooks w core | UX z lekcji | Host-specific | **Nie** — lekcje `03_03_language` |
| Domyślne **MCP Apps** w boilerplate | Postęp w UI | Wymaga hosta z Apps | **Nie** — `03_05_apps` |
| Loader **workflows** markdown | Procesy z plików | Nakłada się na planning | **Nie** — §2.5 |
| Pakiet `@ai-devs/agent-host` (chat UI) | Pełna współpraca S04E02 | Cały produkt frontend | **Defer** — 0 epizodów `tasks/` |

### 3.4 Szczegół techniczny: kolejność wywołań narzędzi

W `agent.ts` narzędzia z jednej tury modelu są wykonywane **sekwencyjnie** (`for … await dispatchToolCall`). Lekcja (przez homework `windpower`, **poza scope**) podkreśla potrzebę równoległości przy async API — to **nie uzasadnia** zmiany domyślnego zachowania pakietu w ramach tego researchu:

- typowy epizod hub: 1–3 wywołania na turę, sekwencja wystarcza;
- scenariusz „kolejka + poll” → **deterministyczny orchestrator w epizodzie** lub code mode (lekcje), zgodnie z §2.1 S03E02;
- ewentualna opt-in flaga `parallelToolCalls` → **Defer** — dopóki ≥2 epizody poza `windpower` tego wymagają w ReAct (nie w czystym TS).

---

## 4. Homework `windpower` (tylko granica scope)

Zadanie **`windpower`** (okno serwisowe ~40 s, akcje kolejkowane async, `getResult` w losowej kolejności, konfiguracja harmonogramu turbiny) **nie jest analizowane**. Z grubsza pasuje do profilu **hub + `http_request` + wąska logika w epizodzie** (równoległe requesty i polling w TypeScript poza pętlą LLM lub minimalnym ReAct). **Nie wymaga** rozszerzenia `@ai-devs/agent-boilerplate` — zgodnie z linią S03E02 (deterministyczna orchestracja w MCP/TS).

Motyw homework (async API) **nie przenosi się** na werdykt rozszerzeń core, bo użytkownik wyłączył zadanie z analizy; w §3.4 odnotowano jedynie techniczny fakt o sekwencyjnym dispatch w runtime.

---

## 5. Zbieżność z wcześniejszymi lekcjami

| Temat S04E02 | Już w research / boilerplate |
| --- | --- |
| MCP + integracje | Core MCP; §2.3 wąskie narzędzia |
| MCP Sampling | S03E03 — poza core |
| MCP Apps | S03E05 §2.4; `03_05_apps` |
| Skills / workflows / profile | S04E01 §2.5; `04_01_garden` |
| Sync vs async / tło | S04E01 §2.5; `03_02_events` |
| Metadata / feedback kontekstowy | S03E03 §2.2 |
| Meta-prompty / planowanie | `enablePlanningPhase`; Eversis `@eversis-implement` |
| Multi-agent | S03E02; events lesson |
| Wdrożenie vs hub | S04E01 §2.5 |

S04E02 **nie wprowadza nowej klasy mechaniki runtime** niewidocznej w §2.1–§2.5 — dodaje **ramę wyboru interfejsu współpracy** i **meta-prompty jako praktykę produktową**.

---

## 6. Rekomendacje priorytetowe

### Nie dodawać do `@ai-devs/agent-boilerplate` (core)

1. Chat UI / dedykowany front współpracy  
2. Integracje Slack / Telegram / Discord  
3. Loader skills / subagentów / workflows  
4. Meta-prompt engine (generowanie konfiguracji agenta z rozmowy)  
5. MCP Sampling w domyślnym serwerze  
6. MCP Apps w pakiecie  
7. Tool approval / cancel / progress UI w runtime  
8. Multi-agent orchestration w `agent.ts`  
9. Mikro-akcje / skróty systemowe  
10. Domyślne równoległe dispatch narzędzi *(defer — brak uzasadnienia poza wyłączonym homework)*  

### Warto zrobić (niska intruzywność — precedens S04E01 Opcja A)

| Opcja | Zakres | Szacowany effort |
| --- | --- | --- |
| **A (zalecana)** | §**2.6** w `tasks/docs/boilerplate-documentation.md` + krzyżowe linki z §2.2–§2.5; opcjonalnie wiersz w README Feature catalog („Active collaboration / interface channels”); wpis CHANGELOG (Unreleased) | Mały |
| **B** | Krótki akapit w `tasks/docs/boilerplate-documentation.md` §5 — „kiedy orchestracja async w epizodzie zamiast ReAct” *(bez odniesienia do windpower)* | Mały |
| **C** | Referencyjna lekcja `lessons/04_02_*` w upstream kursu | **Poza repo** / defer — brak w git |
| **D** | `@ai-devs/agent-host` lub parallel tool flag | **Defer** |

---

## 7. Proponowana treść §2.6 (szkic do planu)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Kanał dostarczenia** | MCP serwer epizodu + istniejący klient (Cursor, Claude) | Klon ChatGPT w każdym zadaniu | `createBoilerplateMcpServer`; §2.6 |
| **Własny UI** | Gdy potrzebujesz uprawnień, statusu tła, pełnego UX narzędzi | Zakładanie, że MCP w Claude.ai wystarczy zawsze | aplikacja poza pakietem |
| **CLI** | Dev / zespół techniczny; opcjonalnie sandbox zdalny | Terminal w default homework MCP | §2.5; garden |
| **Komunikator** | Bot + wąskie komendy / webhook → agent | Pełny agent w Slacku w boilerplate | epizod |
| **Profile / skills** | Host ładuje `SKILL.md`, subset narzędzi | Publiczne API skills w `createAgent` | §2.5; garden |
| **Meta-prompty** | Osobny flow onboardingowy; turn 0 plan w hub | Meta-prompt engine w pakiecie | `enablePlanningPhase`; §2.6 |
| **Multi-agent** | Orchestrator wywołuje wiele `processQuery` / workerów | Jeden ReAct „udaje zespół” | `03_02_events/` |
| **MCP Sampling** | Świadomość limitu hostów | Sampling w default MCP tools | S03E03 research |
| **Mikro-akcja** | Skrypt + skrót gdy 1 krok | Agent na każdą transformację tekstu | poza repo kursu |

**Reguła kciuka §2.6:**

```text
Epizod hub (verify, krótka sesja) → default boilerplate + MCP dla klienta IDE.
Potrzebujesz kontroli UX, profili, statusu tła → własny host lub lekcja — nie rozszerzaj createAgent.
Chcesz meta-prompt produktowy → osobny prompt/flow — nie moduł w @ai-devs/agent-boilerplate.
```

---

## 8. Otwarte pytania (do akceptacji research)

| # | Pytanie | Propozycja domyślna |
| --- | --- | --- |
| 1 | Czy §2.6 ma linkować homework `windpower`? | **Nie** — tylko ogólna wzmianka „async orchestration w epizodzie” w §5 opcjonalnie |
| 2 | Czy w README dodać wiersz „Active collaboration (S04E02)”? | **Tak** — spójnie z S04E01 |
| 3 | Czy planować `parallelToolCalls` w `createAgent`? | **Defer** — brak epizodów w scope (windpower wyłączone) |
| 4 | Czy duplikować MCP Apps / skills z §2.4–§2.5 w §2.6? | **Krótkie cross-linki** — bez powielania tabel |
| 5 | Czy upstream doda `lessons/04_02_*`? | **Poza scope** — zaktualizować §2.6 gdy pojawi się demo |

---

## 9. Następne kroki (po akceptacji research)

1. **Plan:** `s04e02-active-collaboration.plan.md` — Opcja A: dokumentacja (checklist jak S04E01 plan).  
2. **Implementacja docs:** §2.6 + ewentualny akapit §5 + README + CHANGELOG.  
3. **Brak zmian w `tasks/boilerplate/src/`** w ramach Opcji A.

---

## 10. Werdykt końcowy (odpowiedź na pytanie użytkownika)

**Czy w lekcji S04E02 można rozbudować `tasks/boilerplate`?**

- **Tak, zasadnie i zgodnie z linią S03E02–S04E01** — ale prawie wyłącznie przez **dokumentację produktową** (proponowane §**2.6**): wybór kanału współpracy (CLI / MCP / messenger / custom), ograniczenia hostów MCP, personalizacja po stronie hosta (profile, skills), meta-prompty jako praktyka, multi-agent poza ReAct.
- **Nie zasadnie w core runtime** — chat UI, skills loader, subagenci, meta-prompt engine, MCP Sampling/Apps w pakiecie, integracje komunikatorów i pełny UX narzędzi to **warstwa aplikacji/hosta**, nie brakujące klocki `@ai-devs/agent-boilerplate`.
- **Homework `windpower`** (pominięty) **nie uzasadnia** rozszerzenia boilerplate — typowy profil hub z orchestracją async w kodzie epizodu.

**Implikacja:** najlepszy ROI = **Opcja A (docs §2.6)**; port „interfejsu współpracy” do core **obniżyłby** czytelność pakietu i zduplikował werdykty S03E03 / S04E01.

---

## 11. Assumptions

- Analiza oparta na markdownie w repo (`published_at: 2026-03-31` — scheduled); treść może się nieznacznie zmienić przed publikacją.
- Brak `lessons/04_02_*` w monorepo — brak kodu referencyjnego do porównania implementacyjnego.
- Użytkownik świadomie wyłączył **`windpower`** z głębokiej analizy — granica scope w §4.
- §2.5 (S04E01) jest **zrealizowane** — §2.6 ma **uzupełniać**, nie zastępować.
