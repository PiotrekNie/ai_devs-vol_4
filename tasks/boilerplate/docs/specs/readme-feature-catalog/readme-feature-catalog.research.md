# Research: Katalog funkcjonalności w README boilerplate

**Status:** Zaimplementowano (2026-05-30) — plan: [readme-feature-catalog.plan.md](readme-feature-catalog.plan.md)  
**Data:** 2026-05-30  
**Zakres:** `tasks/boilerplate/README.md`  
**Cel:** Jedna, skanowalna lista wszystkich możliwości pakietu `@ai-devs/agent-boilerplate` (i powiązanych modułów kursu) z krótkim opisem i wskazówką „kiedy włączyć”, żeby ułatwić nawigację przy rozwiązywaniu zadań.

---

## 1. Podsumowanie zadania

| Pole | Wartość |
| --- | --- |
| **Źródło** | Żądanie użytkownika + `/eversis-implement` |
| **Deliverable** | Nowa sekcja (lub rozbudowa) w [`README.md`](../../../README.md) — **katalog funkcjonalności** |
| **Poza zakresem** | Zmiana kodu runtime, nowe zależności, refaktor modułów |
| **Normatywna spec** | [`tasks/docs/boilerplate-documentation.md`](../../../../docs/boilerplate-documentation.md) — pozostaje źródłem kontraktów; README = nawigacja decyzyjna |

### Problem

Obecny README jest dobry jako **Quick Start** i ma osobne sekcje dla OM, Langfuse, tool discovery i code mode, ale:

- Brakuje **jednego miejsca** z pełną listą „co pakiet oferuje”.
- Decyzja „ReAct vs discovery vs OM vs tracing vs evals” wymaga skakania między sekcjami i `docs/specs/`.
- Pakiety sąsiadujące (`agent-evals`, `tasks/shared`, lekcje code mode) są wspomniane punktowo, nie w jednej tabeli decyzyjnej.

### Sukces

Uczestnik kursu otwiera README, widzi tabelę / listę funkcji z kolumnami: **nazwa**, **opis**, **domyślnie włączone?**, **kiedy użyć**, **gdzie w kodzie / docs**, i wybiera minimalny zestaw dla epizodu.

---

## 2. Stan obecny README

| Sekcja README | Co pokrywa |
| --- | --- |
| Quick Start, env, testy | Instalacja, zmienne, minimalny przykład |
| Planning phase | Turn 0, `enablePlanningPhase` |
| Tool discovery | Lazy schemas, meta tools |
| Code mode / sandbox | **Czego nie ma** w pakiecie + linki do lekcji |
| MCP server | 4 domyślne narzędzia + rejestracja własnych |
| Module map | Drzewo plików (techniczne, nie decyzyjne) |
| Observational Memory | OM — długa sekcja operacyjna |
| Observability Langfuse | Tracing + OM callbacks |
| MemoryHooks | Rozszerzenie custom |

**Luka:** brak skonsolidowanego **Feature catalog** na początku (po intro) lub zaraz po Quick Start.

---

## 3. Inwentarz funkcjonalności — pakiet główny (`@ai-devs/agent-boilerplate`)

Eksporty publiczne: [`index.ts`](../../../index.ts). Subpath: `@ai-devs/agent-boilerplate/observability`.

### 3.1. Rdzeń runtime (zawsze przy użyciu `createAgent`)

| ID | Funkcja | Opis | Domyślnie | Kiedy użyć | API / pliki |
| --- | --- | --- | --- | --- | --- |
| **R1** | **ReAct loop** | Pętla Reasoning + Acting: LLM → opcjonalne tool calls → wynik w kontekście, do `MAX_ITERATIONS` | Tak | Każde zadanie kursowe oparte na agencie | `createAgent`, `src/agent/agent.ts` |
| **R2** | **MAX_ITERATIONS guard** | Twarde ograniczenie liczby tur; przy przekroczeniu komunikat zamiast nieskończonej pętli | Tak (`AGENT_MAX_ITERATIONS`, dom. 10) | Zawsze; dostosuj env dla długich zadań | `AgentConfig.maxIterations`, `config.ts` |
| **R3** | **Zakończenie pętli** | (a) brak tool calls → odpowiedź tekstowa; (b) `finish_task`; (c) limit iteracji | Tak | `finish_task` gdy agent ma jawnie zakończyć z `final_answer` | `finish_task.ts`, `FinishTaskSignal` |
| **R4** | **Single / multi-turn** | `processQuery` vs `processConversationTurn` z historią sesji | Tak | Multi-turn chat, kolejne pytania użytkownika w jednej sesji | `agent.ts` |
| **R5** | **Truncation wyników narzędzi** | Skrócenie echo tool output w kontekście LLM | Tak (`AGENT_MAX_TOOL_OUTPUT_CHARS`) | Duże odpowiedzi HTTP/plików | `AgentConfig.maxToolOutputChars` |
| **R6** | **Logger terminalowy** | Tagi `[MYŚL]`, `[AKCJA]`, `[WYNIK]`, `[SYSTEM]`, `[PLAN]`, `[PAMIĘĆ]` | Tak | Debug lokalny bez Langfuse | `src/utils/logger.ts` |
| **R7** | **Typy Zod** | `Message`, `ToolCall`, `ModelResponse`, `McpToolResponse`, helpery `mcpOk`/`mcpErr` | Tak | Walidacja i spójność z OpenAI function calling | `src/types/index.ts` |
| **R8** | **config.ts** | Modele, limity, hub URL, OM i Langfuse z env | Tak | Centralna konfiguracja zadania | `config.ts` + `tasks/config.js` |

### 3.2. Adapter LLM

| ID | Funkcja | Opis | Domyślnie | Kiedy użyć | API / pliki |
| --- | --- | --- | --- | --- | --- |
| **A1** | **AIAdapter / createAIAdapter** | OpenAI **Responses API**; parsowanie tool calls i tekstu | Tak | Domyślny provider kursu (OpenAI / OpenRouter przez `tasks/config.js`) | `src/agent/ai.ts` |
| **A2** | **Exponential backoff** | Ponawianie przy HTTP **429** i **503** | Tak | API kursu i hub celowo zwracają 503 | `fetchWithRetry`, współdzielone z `http_request` |
| **A3** | **Usage w odpowiedzi** | `ModelResponse.usage` (tokeny) dla kalibracji OM i tracing | Tak (gdy API zwraca) | Długie sesje + OM z kalibracją | `ai.ts`, `ModelResponseSchema` |
| **A4** | **ChatOptions** | Np. `temperature`, `tracingMetadata` per wywołanie | Opcjonalnie | Sterowanie generacją / metadane spanów | `AgentConfig.chatOptions` |
| **A5** | **chat() niskopoziomowe** | Bezpośrednie wywołanie API poza pętlą agenta | Eksport | Testy, OM Observer/Reflector, custom flow | `chat`, `createAIAdapter` |

### 3.3. Warstwa MCP

| ID | Funkcja | Opis | Domyślnie | Kiedy użyć | API / pliki |
| --- | --- | --- | --- | --- | --- |
| **M1** | **In-process MCP** | `InMemoryTransport` — bez subprocessu | Tak przy `createBoilerplateMcpServer` | Standardowe zadania w `tasks/sXXeYY` | `mcp/client.ts`, `mcp/server.ts` |
| **M2** | **mcpToolsToOpenAI** | Konwersja schematów MCP → OpenAI functions (+ sanityzacja JSON Schema) | Tak | Rejestracja narzędzi w agencie | `mcp/client.ts` |
| **M3** | **Rozszerzenie serwera** | `server.registerTool(...)` dla narzędzi domenowych epizodu | Na żądanie | Logika specyficzna dla zadania (np. filtry, API kursu) | Przykład w README § MCP server |

### 3.4. Narzędzia MCP (domyślne — 4 szt.)

| Narzędzie | Opis | Kiedy użyć | Uwagi |
| --- | --- | --- | --- |
| **`http_request`** | GET/POST z retry 429/503; zwraca `{ ok, status, data }` | Pobieranie danych z API kursu, webhooków, JSON | POST **wymaga** `body` (obiekt JSON) |
| **`submit_to_hub`** | Wysyłka odpowiedzi na hub weryfikacyjny; wyciąga `{FLG:...}` | Zadania z flagą po weryfikacji | `HUB_API_KEY` w env; `apikey` wstrzykiwany |
| **`read_file`** | Odczyt pliku tekstowego z chunkingiem (`offset`, `limit`) | Logi, dane lokalne, duże pliki | Limit znaków: `AGENT_MAX_FILE_READ_CHARS`; ścieżki względem CWD zadania |
| **`analyze_image_vision`** | Analiza obrazu modelem vision (`AGENT_VISION_MODEL`) | Zadania wizualne (mapy, screenshoty) | Formaty: jpg, png, gif, webp |

### 3.5. Narzędzia natywne

| Narzędzie | Opis | Kiedy użyć | W README przykładzie |
| --- | --- | --- | --- |
| **`finish_task`** | Kończy pętlę z `final_answer` | Jawne zakończenie zadania przez model | Tak (minimal example) |
| **`ask_human`** | Pyta człowieka; **blokuje na stdin** | Brak informacji, potwierdzenie, CAPTCHA | Nie w minimal example — dodać do katalogu |
| **`list_tools`** | Katalog nazw + opisów (discovery) | Wiele narzędzi MCP w epizodzie | Tylko z `toolDiscovery.enabled` |
| **`describe_tool`** | Podgląd JSON Schema jednego narzędzia | Przed `activate_tools` | Discovery |
| **`activate_tools`** | Udostępnia wybrane MCP w API function calling | Po poznaniu potrzeb | Discovery |

### 3.6. Opcje `createAgent` (feature flags)

| Opcja | Opis | Domyślnie | Kiedy włączyć |
| --- | --- | --- | --- |
| `enablePlanningPhase` | **Turn 0**: plan bez narzędzi (`tool_choice: none`), blok `## Working plan` w instructions; **nie** liczy się do iteracji | `false` | Złożone zadania wieloetapowe; skróć checklistę w prompcie epizodu |
| `toolDiscovery` | Lazy ładowanie schematów; core tools od razu w API | `false` | **>4–5 narzędzi** MCP / duży prompt — inspiracja S02E05 |
| `toolDiscovery.coreToolNames` | Które narzędzia widoczne od tury 1 | Dom.: `http_request`, `submit_to_hub`, `finish_task` | Dostosuj do epizodu (np. bez hub na początku) |
| `toolDiscovery.autoActivateOnUnknownTool` | Auto-aktywacja przy wywołaniu nieaktywnego toola | `false` | Wygoda vs kontrola kontekstu |
| `memory` | `MemoryHooks` — OM lub własna implementacja | `noopMemoryHooks` | Długa historia, wiele tur ReAct |
| `tracing` | Langfuse span hierarchy | `noopTracingRuntime` | Debug, koszty, evals z trace |
| `maxIterations` / `maxToolOutputChars` | Override env | — | Epizody wyjątkowe |

### 3.7. Planning phase (szczegóły R+)

| Element | Opis |
| --- | --- |
| Env `AGENT_ENABLE_PLANNING` | Włącza turn 0 jeśli flaga w `createAgent` pominięta |
| `AGENT_PLANNING_MAX_OUTPUT_TOKENS` | Limit tokenów planu |
| Prompt | `src/prompts/planning_turn.md` |
| Eksporty planowania | `WORKING_PLAN_MARKER`, `runPlanningTurn`, `injectWorkingPlan`, … — do testów / custom flow |

### 3.8. Observational Memory (OM) — kompresja kontekstu

| Element | Opis | Kiedy |
| --- | --- | --- |
| `createObservationalMemoryHooks()` | Observer sealuje stary kontekst → XML observations; Reflector kompresuje przy dużym bloku | Sesje **> ~30k** tokenów szacunkowych (Observer) |
| Layout | `instructions` = prompt + `<observations>`; `input` = surowy ogon | — |
| Progi env | `OBSERVER_*`, `REFLECTOR_*`, `REFLECTION_TARGET_*`, `OM_MODEL` | Tunowanie |
| Kalibracja tokenów | Raw `chars/4` dla Observer; ratio z API `usage` dla Reflector | `enableCalibration: false` = tylko raw |
| Persystencja debug | `OM_PERSIST_DIR` → `observer-NNN.md`, `reflector-NNN.md` | Analiza po runie |
| Callbacks | `OmTracingCallbacks` — port na spany bez zależności OM→Langfuse | Z tracing (Wariant 2 w README) |
| **≠ Langfuse** | OM = mniejszy kontekst; Langfuse = trace | Nie mylić w katalogu |

### 3.9. Observability — Langfuse tracing (subpath)

| Element | Opis | Kiedy |
| --- | --- | --- |
| `initTracing` / `flushTracing` / `shutdownTracing` | OTEL + Langfuse; **no-op** bez `LANGFUSE_*` | Lokalny debug multi-turn |
| `createTracingRuntime` | `chat-request` → `agent` → `generation#N` / `tool#N` / `memory/*` | Razem z `createAgent({ tracing })` |
| `withTracingAdapter` | Owija `AIAdapter` — spany generacji | Evals, analiza kosztów |
| `createOmTracingCallbacks` | Spany Observer/Reflector (metadata only) | OM + tracing |
| Peer deps | `@langfuse/tracing`, `@langfuse/otel`, OTEL SDK | Instalacja w **zadaniu**, nie w samym boilerplate |
| PII | Brak wbudowanej redakcji | Polityka na poziomie zadania |

### 3.10. MemoryHooks (generyczne)

| Element | Opis | Kiedy |
| --- | --- | --- |
| `noopMemoryHooks` | Domyślne puste hooki | Krótkie zadania |
| `beforeTurn` / `afterTurn` | Modyfikacja instructions + conversation przed/po turą LLM | Własna pamięć (dziennik, RAG skrót) — **nie** mylić z OM factory |
| `estimateTokens` | Prosty estimator | Własne progi |

### 3.11. Prompty wbudowane (szablony)

| Plik | Rola |
| --- | --- |
| `src/prompts/system.md` | Domyślny system prompt (zadania nadpisują własnym `.md`) |
| `planning_turn.md` | Turn 0 |
| `tool_discovery.md` | Instrukcje dla meta tools |
| `observer.md` / `reflector.md` | OM |

---

## 4. Powiązane moduły poza głównym exportem

Te elementy **nie są** w `index.ts`, ale uczestnik powinien je widzieć w katalogu README (sekcja „Poza pakietem” / „Sąsiednie pakiety”).

| Moduł | Relacja | Opis | Kiedy |
| --- | --- | --- | --- |
| **`@ai-devs/agent-evals`** | Osobny pakiet `tasks/agent-evals/` | Dataset, evaluators (`tool-use`, `response-correctness`), `bootstrapExperiment` | Lokalna ocena agenta po wdrożeniu tracing; **nie CI** |
| **`tasks/shared/`** | Helpery domenowe kursu | np. `fetchPeople`, `filterPeople` — **nie** runtime agenta | Zadania z ludźmi / tagowaniem — import bezpośredni w zadaniu |
| **Code mode / sandbox wykonania** | Lekcje, nie boilerplate | QuickJS (`lessons/02_05_sandbox`) lub Deno (`lessons/03_02_code`) | Wiele MCP w jednym skrypcie; orchestracja `for`/`if` |
| **File sandbox** | Część `read_file` | Chroot ścieżek odczytu | Odczyt plików bez code mode |
| **Cursor Collections** | Repo root `.cursor/` | `@eversis-implement`, skills MCP | Workflow zadań w IDE — opcjonalna jedna linia w README |

---

## 5. Macierz decyzyjna (skrót dla README)

Proponowana tabela do skopiowania / skrócenia w README:

| Potrzebujesz… | Włącz / użyj | Nie potrzebujesz |
| --- | --- | --- |
| Standardowe zadanie (HTTP + hub + kilka tur) | Domyślny ReAct + 4 MCP + `finish_task` | OM, discovery, tracing, code mode |
| Wiele narzędzi MCP (>4 w prompcie) | `toolDiscovery: { enabled: true }` | Wszystkie schematy od tury 1 |
| Długa rozmowa / duży kontekst | `createObservationalMemoryHooks()` | — |
| Debug przebiegu / kosztów | `@ai-devs/agent-boilerplate/observability` + Langfuse keys | — |
| Ocena jakości agenta | `@ai-devs/agent-evals` + tracing opcjonalnie | Uruchamianie evalów w CI |
| Plan przed działaniem | `enablePlanningPhase: true` | Duplikowanie planu w prompcie epizodu |
| Pomoc człowieka w trakcie runu | `ask_human` w handlers | — |
| Obrazy / mapy | `analyze_image_vision` | Wgrywanie base64 ręcznie do głównego modelu |
| Dziesiątki wywołań MCP w jednym kroku | Lekcja code mode | `execute_code` w boilerplate |
| Logika domenowa kursu (ludzie, filtry) | `tasks/shared/*` | — |

**Reguła kciuka z istniejącego README:** ≤5 tur i ≤4 narzędzia w prompcie → **zostań przy domyślnym ReAct**.

---

## 6. Propozycja struktury nowej sekcji README

**Umiejscowienie (zatwierdzone):** po całej sekcji **Quick Start** (przed `## Code mode / sandbox`) — nagłówek `## Feature catalog`.

**Podsekcje (kolejność):**

1. **Rdzeń** — tabela skrócona (R1–R8) + link do Module map.
2. **Narzędzia** — jedna tabela: MCP (4) + Native (2 + 3 meta przy discovery).
3. **Opcje runtime** — tabela `createAgent` + env kluczowe.
4. **Rozszerzenia opt-in** — Planning | Tool discovery | OM | Langfuse tracing — każdy 2–3 zdania + link do sekcji szczegółowej niżej w README (nie duplikować całego OM).
5. **Poza pakietem** — agent-evals, shared, code mode (1 akapit + tabela warstw sandbox).
6. **Szybka decyzja** — macierz §5 (skrócona).

**Konwencje językowe README:** obecny README jest **po angielsku**; katalog powinien być **EN** dla spójności (tytuł sekcji może być dwujęzyczny opcjonalnie).

**Nie usuwać:** istniejące sekcje szczegółowe (OM, Observability) — katalog ma **linkować** (`#observational-memory-s02e05`), nie zastępować.

---

## 7. Kryteria akceptacji (implementacja)

- [ ] Sekcja **Feature catalog** (lub uzgodniona nazwa) zawiera **wszystkie** pozycje z §3.1–3.11 i §4 w formie tabel lub list z opisem ≤1 zdania + kolumna „when to use”.
- [ ] Wyraźne rozróżnienie: **domyślne** vs **opt-in** vs **osobny pakiet** vs **lekcja**.
- [ ] `ask_human` obecne w katalogu narzędzi (obecnie brak w minimal example).
- [ ] Macierz decyzyjna §5 (skrócona) obecna w README.
- [ ] Linki do `boilerplate-documentation.md`, `CHANGELOG.md`, `docs/specs/*` tam gdzie temat jest głęboki.
- [ ] Brak nowych zależności npm; tylko edycja markdown.
- [ ] Spójność z CHANGELOG [Unreleased] — wszystkie Added features widoczne w katalogu.

---

## 8. Ryzyka i uwagi

| Ryzyk | Mitygacja |
| --- | --- |
| README staje się zbyt długi | Katalog = tabele + linki; szczegóły zostają w podsekcjach |
| Duplikacja z `boilerplate-documentation.md` | README = decyzje; spec = kontrakty |
| Mylenie OM vs Observability | Osobne wiersze + ikonka/wyróżnik w tabeli (już w README) |
| Przestarzałość katalogu | W planie: punkt „aktualizuj katalog przy nowym eksporcie w CHANGELOG” |

---

## 9. Decyzje produktowe (zatwierdzone 2026-05-30)

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Język katalogu | **EN only** (spójnie z resztą README) |
| 2 | Pozycja sekcji | **Po całej sekcji Quick Start** (po `### Tool discovery`, przed `## Code mode / sandbox`) |
| 3 | `tasks/shared/` | **Tylko wzmianka** — np. „Domain helpers: [`tasks/shared/`](../../shared/)” w podsekcji „Related packages”; bez opisu API |
| 4 | Mini-TOC | **Nie** — bez listy „On this page” na górze README |

### 9.1 Mini-TOC — co to jest i czy warto

**Mini-TOC** (mini table of contents) to krótka lista linków do głównych nagłówków `##` w tym samym pliku, zwykle tuż pod intro (linie 7–8), np.:

```markdown
## On this page

- [Quick Start](#quick-start)
- [Feature catalog](#feature-catalog)
- [Code mode / sandbox](#code-mode--sandbox-not-in-boilerplate)
- …
```

**Po co:** README ma ~420+ linii i 8+ sekcji `##`; katalog funkcji dodaje jeszcze jedną dużą sekcję. TOC pozwala przeskoczyć do OM / Langfuse / Feature catalog bez scrollowania.

**Minusy:**

- GitHub (i wiele podglądów Markdown) i tak pokazuje **outline** po prawej / w nagłówku pliku — częściowa duplikacja.
- Trzeba **utrzymywać** listę przy każdej zmianie tytułu `##` (anchor się zmienia).
- Przy **2–3** sekcjach nad TOC mało sensu; przy **9+** `##` (po dodaniu Feature catalog) zysk rośnie.

**Rekomendacja dla tego README:**

| Opcja | Kiedy |
| --- | --- |
| **Bez mini-TOC** | Wystarczy outline edytora/GitHub + nowa sekcja Feature catalog jako „mapa decyzji” (wielu użytkowników to właśnie szuka). **Mniej utrzymania.** |
| **Mini-TOC tylko `##`** (8–10 linków) | Gdy często czytasz README w plain Markdown (np. w Cursor bez outline) lub udostępniasz plik poza GitHub. |
| **Pełny TOC z `###`** | Raczej **nie** — Quick Start ma 6 podsekcji; lista staje się długa i szybko się dezaktualizuje. |

**Propozycja domyślna w planie:** **bez mini-TOC**, chyba że wybierzesz „tak — tylko `##`”.

---

## 10. Następne kroki (workflow)

1. ~~Research + §9~~ — **done** (2026-05-30).
2. ~~Plan~~ — **done**.
3. ~~Implement~~ — `README.md`, `CHANGELOG.md` — **done**.
4. ~~Review~~ — **done**.

---

## Załącznik A — Mapowanie env → funkcja (do tabeli w README)

| Zmienna | Funkcja |
| --- | --- |
| `OPENAI_API_KEY` / `OPENROUTER_API_KEY` | LLM |
| `AGENT_MODEL`, `AGENT_VISION_MODEL` | Modele agent / vision |
| `AGENT_MAX_ITERATIONS` | R2 |
| `AGENT_ENABLE_PLANNING`, `AGENT_PLANNING_MAX_OUTPUT_TOKENS` | Planning |
| `AGENT_MAX_TOOL_OUTPUT_CHARS`, `AGENT_MAX_FILE_READ_CHARS` | Limity I/O |
| `AGENT_RETRY_*` | A2 |
| `HUB_API_KEY`, `HUB_VERIFY_URL` | submit_to_hub |
| `OBSERVER_*`, `REFLECTOR_*`, `OM_*` | OM |
| `LANGFUSE_*`, `TRACING_SERVICE_NAME` | Tracing |

(W pełna tabela env pozostaje w § Quick Start — katalog może mieć „see Environment variables”.)
