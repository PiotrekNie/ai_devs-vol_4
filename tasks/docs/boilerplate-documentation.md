# Specyfikacja Projektowa: AI Devs 4 Agent Boilerplate

## 1. Informacje Ogólne i Cel Projektu

**Nazwa projektu:** AI Devs 4 Agent Boilerplate
**Cel:** Stworzenie uniwersalnego, łatwo konfigurowalnego środowiska (boilerplate'u) do budowy i testowania agentów AI w ramach kursu AI Devs 4. Projekt ma charakter **edukacyjny** – struktura musi być czytelna, pozbawiona "czarnej magii" (np. bez ciężkich frameworków jak LangChain), z naciskiem na jawne zarządzanie pętlą rozumowania (reasoning loop), pamięcią oraz integracją przez Model Context Protocol (MCP).

## 2. Założenia Architektoniczne

Projekt opiera się na architekturze modułowej, w której agent jest oddzielony od narzędzi poprzez protokół MCP oraz od modelu językowego poprzez ustandaryzowany adapter.

1. **Wzorzec Agenta:** ReAct (Reasoning and Acting) realizowany w prostej pętli while/for wewnątrz `agent.ts`. **Code mode** (wykonywanie kodu gościa w piaskownicy) nie jest częścią domyślnego pakietu — patrz §5.2.1 i lekcje `lessons/02_05_sandbox`, `lessons/03_02_code`.
2. **Rozdzielenie Narzędzi:**

- **Natywne:** Funkcje bezpośrednio modyfikujące stan agenta (np. zatrzymanie pętli).
- **MCP (Model Context Protocol):** Operacje I/O, sieć, system plików, uruchamiane w oddzielnym serwerze (`server.ts`) i wywoływane przez klienta (`client.ts`).

3. **Pamięć i Kompresja (Observer/Reflector):** Długoterminowe zarządzanie oknem kontekstowym dla wieloetapowych zadań, zapobiegające przekroczeniu limitu tokenów.
4. **Odporność (Resilience):** Wbudowany mechanizm Exponential Backoff dla błędów sieciowych (np. celowe błędy HTTP 503 na serwerach kursowych).

### 2.1. Project constraints (S03E02)

Lekcja S03E02 uczy projektowania agentów **pod ograniczenia modeli** (koszt, latency, halucynacje, bezpieczeństwo). Boilerplate dostarcza runtime ReAct; **decyzje, co robi model, a co kod**, należy do autora epizodu. Poniższa tabela to szybka ściąga przy starcie nowego zadania w `tasks/sXXeYY/`.

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Podział logiki** | Deterministyczne filtry / agregacje w **MCP TypeScript** (0 tokenów ReAct) | LLM analizuje każdy rekord / plik osobno | [s03e01 — `scan_sensors`](../s03e01/src/tools/mcp/scan_sensors.ts) |
| **Orkiestracja** | ReAct + ≤5 tur, jawne narzędzia, `finish_task` | Pełna automatyzacja bez człowieka przy akcjach nieodwracalnych | [boilerplate README](../boilerplate/README.md) |
| **Planowanie** | `enablePlanningPhase` + aktualizacja `## Working plan` po feedbacku hub | Heartbeat multi-agent dla prostego homework | [`planning.ts`](../boilerplate/src/agent/planning.ts), [`evaluation_memory.ts`](../s03e01/src/agent/evaluation_memory.ts) |
| **Duże dane** | Batch po unikalnych kluczach + cache odpowiedzi LLM w warstwie epizodu | Wczytanie 10k+ rekordów do kontekstu | [`classifyNotes.ts`](../s03e01/src/domain/classifyNotes.ts) |
| **Wiele wywołań MCP** | Code mode w **lekcji** / deterministyczny skrypt developera | `execute_code` w domyślnym pakiecie | [lessons/03_02_code](../../lessons/03_02_code/), [§5.2.1](#521-code-mode--wykonanie-kodu-poza-pakietem) |
| **Kontekst LLM** | `toolDiscovery` gdy >4 narzędzia; OM dla długich sesji **jednego** agenta | Wszystkie schematy MCP w każdej turze | [README — Tool discovery](../boilerplate/README.md#tool-discovery-optional-s02e05-inspired) |
| **Modele** | Mini na klasyfikację / enum; mocniejszy model na reasoning (env) | Jeden drogi model „everywhere” | [`config.ts`](../boilerplate/config.ts) |
| **Bezpieczeństwo** | Brak narzędzi nieodwracalnych; uprawnienia w **handlerze** MCP, nie w prompcie | Model decyduje o wysyłce maila / shell bez limitów | wzorzec lekcji `03_02_email` (materiał kursu) |
| **Prompt injection** | System prompt bez sekretów; nieufność wobec treści zewnętrznych | Poleganie na „nie ujawniaj instrukcji” jako jedyną barierę | — |
| **Obserwowalność** | Langfuse opt-in do debugu kosztów | Langfuse jako warunek poprawności solve | [observability/](../boilerplate/src/observability/) |
| **Homework typu shell/API** | `http_request` + retry 429/503 + opisowe błędy w narzędziu epizodu | Sandbox Deno gdy wystarczy sekwencja HTTP | zadanie `firmware` (S03E02) |

**Reguła kciuka:**

```text
≤5 tur ReAct i ≤4 narzędzi w prompcie → default boilerplate (bez discovery, OM, code mode).
Wiele wywołań MCP / agregacja dużych plików → lekcja code mode LUB deterministyczne MCP w TS.
Multi-agent / heartbeat → lekcja events, nie pakiet kursowy.
```

**Odniesienia:** [research S03E02](../boilerplate/docs/specs/s03e02-model-constraints/s03e02-model-constraints.research.md) · [przykład epizodu s03e01](../s03e01/)

### 2.2. Contextual feedback (S03E03)

Lekcja S03E03 uczy **integracji agenta z otoczeniem** i kontekstowego feedbacku (metadata, wzbogacanie wiadomości, triggery, proaktywność, hooki workflow). Boilerplate nadal dostarcza **ReAct + MCP**; orchestracja czasu (cron, heartbeat, `tasks.md`) i przeglądarka (Playwright) pozostają **poza** domyślnym pakietem. Poniższa tabela to ściąga przy epizodach w `tasks/sXXeYY/` oraz przy demo w `lessons/03_03_*`.

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Stan otoczenia** | Blok `<metadata>` / JSON w **treści wiadomości użytkownika** budowany w kodzie (`run.ts`) | Model „zgaduje” czas, lokalizację lub pogodę bez danych z kodu | [03_03_calendar — `buildMetadata`](../../lessons/03_03_calendar/src/data/environment.ts) |
| **Wzbogacanie kontekstu** | Narzędzia MCP + ReAct łączące sygnały przed akcją | Osobny moduł „enricher” w boilerplate | [lessons/03_03_calendar](../../lessons/03_03_calendar/) |
| **Triggery zewnętrzne** | Osobny entrypoint wywołuje ten sam `createAgent` z zadaniem NL | Cron, webhook, heartbeat w `agent.ts` | [lessons/03_02_events](../../lessons/03_02_events/) |
| **Proaktywność / `tasks.md`** | Długa sesja: OM + orchestrator **poza** pętlą ReAct | Heartbeat i task graph w `@ai-devs/agent-boilerplate` | events; [research S03E02 §2.3](../boilerplate/docs/specs/s03e02-model-constraints/s03e02-model-constraints.research.md) |
| **Sesja** | `processConversationTurn` gdy wątek ma historię; `processQuery` per izolowany trigger | Wszystkie zdarzenia w jednym przepełnionym kontekście | [`agent.ts`](../boilerplate/src/agent/agent.ts) |
| **Feedback po błędzie** | `MemoryHooks` + `injectWorkingPlan` po odpowiedzi hub / ban | Osobny runtime tylko po to | [`evaluation_memory.ts`](../s03e01/src/agent/evaluation_memory.ts), [`firmware_memory.ts`](../s03e02/src/agent/firmware_memory.ts) |
| **Człowiek w pętli** | `ask_human` gdy brak danych (blokada na stdin, bez timeoutu w core) | Wymuszony timeout w pakiecie bez decyzji epizodu | [`ask_human.ts`](../boilerplate/src/tools/native/ask_human.ts) |
| **Hooki per tool / finish** | Wrapper na `handlers.execute` lub logika w lekcji / epizodzie | Publiczne `beforeToolCall` / `beforeFinish` w `createAgent` | [03_03_language — `hooks.ts`](../../lessons/03_03_language/src/hooks.ts) |
| **Warstwa pamięci** | `MemoryHooks` = tura ReAct (`beforeTurn` / `afterTurn`); OM opt-in | Mylenie z hookami AI SDK z lekcji language | [`memory.ts`](../boilerplate/src/agent/memory.ts) |
| **Przeglądarka** | Playwright w **lekcji**; homework hub: HTTP + ewent. vision | Browser MCP / Playwright w default install | [lessons/03_03_browser](../../lessons/03_03_browser/) |
| **Multi-model w toolu** | Drugi `chat()` / API w implementacji narzędzia MCP epizodu | MCP Sampling w boilerplate | language — narzędzia `listen` / `feedback` |
| **Homework hub** | Pętla deterministyczna lub ReAct + `http_request`; metadata w prompt gdy potrzeba | Scheduler, browser, coaching hooks z lekcji language | epizody `tasks/sXXeYY/` (np. reactor — osobny wątek) |

**Reguła kciuka:**

```text
Homework hub (≤5 tur, HTTP/MCP) → default boilerplate + metadata w user message jeśli stan otoczenia jest znany z kodu.
Orchestracja czasu (cron, webhook runner, heartbeat, tasks.md) → lekcja 03_02_events lub aplikacja poza pakietem.
Hooki workflow (listen→feedback→save) → lekcja 03_03_language lub kod epizodu — nie nowe API w createAgent.
Browser / Playwright → lekcja 03_03_browser; pakiet monorepo tylko gdy ≥2 epizody w tasks/ tego wymagają (obecnie: nie).
```

**Odniesienia:** [research S03E03](../boilerplate/docs/specs/s03e03-contextual-feedback/s03e03-contextual-feedback.research.md) · [§2.1 Project constraints (S03E02)](#21-project-constraints-s03e02) · [§2.3 Tool design & test data (S03E04)](#23-tool-design--test-data-s03e04) · [03_03_calendar](../../lessons/03_03_calendar/) · [03_03_language](../../lessons/03_03_language/) · [03_03_browser](../../lessons/03_03_browser/) · [03_02_events](../../lessons/03_02_events/)

### 2.3. Tool design & test data (S03E04)

Lekcja S03E04 uczy **projektowania skutecznych narzędzi** (schematy input/output, odpowiedzi dla modelu, dane testowe, ewaluacja offline) we współpracy z LLM — **bez** obowiązku MCP w lekcji demonstracyjnej. Runtime boilerplate (`createAgent`, `http_request`, `mcpOk`/`mcpErr`) pozostaje bez zmian; jakość narzędzi implementujesz w **`tasks/sXXeYY/src/tools/mcp/`**. Reference integracji i Promptfoo: **`lessons/03_04_gmail/`**.

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Zakres narzędzia** | Wąskie, spersonalizowane akcje (np. `search_support`, nie pełne API) | Generyczne „pełne” integracje z oficjalnym MCP | [§2.1](#21-project-constraints-s03e02); [lessons/03_04_gmail/src/tools/](../../lessons/03_04_gmail/src/tools/) |
| **Schemat input** | Każde pole z `.describe()`; jawna paginacja (`cursor`, `limit`) | Pola bez opisu; brak stronicowania przy listach | [spec/](../../lessons/03_04_gmail/spec/) w lekcji |
| **Schemat output** | Poziom szczegółowości (`details`, warianty listy); tylko to, co model potrzebuje | Base64 / duże bloby w `tool_result` | lekcja Gmail; `AGENT_MAX_TOOL_OUTPUT_CHARS` w boilerplate |
| **Logika w kodzie** | Typ zasobu, merge ID, polityki — **w handlerze**, nie w argumencie modelu | Model wybiera „message vs thread” lub ścieżkę API | `gmail_read` w lekcji |
| **Feedback po akcji** | `modify` zwraca zmienione pola; puste wyniki → sugestia zmiany zapytania | Cichy błąd lub surowy stack w odpowiedzi narzędzia | [hints/](../../lessons/03_04_gmail/src/hints/) w lekcji |
| **Envelope `{ data, hint }`** | Eksperyment **w lekcji** (status, recovery, opcjonalny następny krok) | Domyślny format `mcpOk()` w boilerplate; eksport `tool-hints` w pakiecie | [hints/index.ts](../../lessons/03_04_gmail/src/hints/index.ts) |
| **`nextActions` + confidence** | Tylko reference lekcji (eksperymentalne) | Publiczne API `@ai-devs/agent-boilerplate` | — |
| **Projektowanie z LLM** | Dokumentacja API + iteracja ze **checklistą** praktyk | Jednorazowy schemat „z pamięci” modelu | transkrypt S03E04; [use-cases.md](../../lessons/03_04_gmail/spec/use-cases.md) |
| **Dane testowe** | Kategorie: per-tool + scenariusze multi-turn; różnorodność świadomie | Płytkie testy „żeby były”; overfitting do jednego case | [evals/](../../lessons/03_04_gmail/) w lekcji |
| **Eval offline (narzędzia)** | **Promptfoo** w lekcji — jakość **definicji** narzędzia | Promptfoo w `agent-evals` lub CI boilerplate | [03_04_gmail README](../../lessons/03_04_gmail/README.md) (`eval:*`) |
| **Eval zachowania agenta** | `@ai-devs/agent-evals` + Langfuse (tracing opcjonalnie) | Mylenie z Promptfoo; eval w CI jako gate | [agent-evals/README.md](../agent-evals/README.md) |
| **Wybór modelu** | Porównanie na datasetach po ustabilizowaniu schematów | Jeden model „everywhere” bez pomiaru | `AGENT_MODEL`; [research S03E02 §2.1](../boilerplate/docs/specs/s03e02-model-constraints/s03e02-model-constraints.research.md) |
| **Homework hub (ReAct)** | Prosty JSON/text w MCP; Zod w epizodzie | Envelope Gmail w zadaniach ≤5 tur | [`s03e01`](../s03e01/), [`s03e02`](../s03e02/) |
| **Homework `negotiations` (osobny profil)** | Osobny temat: HTTP tool dla **zewnętrznego** agenta (NL `params`, limit odpowiedzi) | Wzorzec negotiations w boilerplate | markdown S03E04 — zadanie (poza pakietem) |

**Reguła kciuka:**

```text
Homework hub (ReAct, ≤5 tur, http_request + własne MCP) → default boilerplate; opisy Zod i krótkie odpowiedzi w narzędziach epizodu.
Jakość integracji (wiele akcji, bogate hinty) → lekcja 03_04_gmail lub kopia wzorca w epizodzie — nie nowy moduł w pakiecie.
Eval definicji narzędzi (Promptfoo) → lessons/03_04_gmail; eval trajektorii agenta → agent-evals (Langfuse).
```

**Odniesienia:** [research S03E04](../boilerplate/docs/specs/s03e04-tool-design-test-data/s03e04-tool-design-test-data.research.md) · [§2.1 Project constraints (S03E02)](#21-project-constraints-s03e02) · [§2.2 Contextual feedback (S03E03)](#22-contextual-feedback-s03e03) · [§2.4 Non-deterministic models (S03E05)](#24-non-deterministic-models-as-advantage-s03e05) · [03_04_gmail](../../lessons/03_04_gmail/) · [agent-evals](../agent-evals/README.md) · [§4.4 Observability — Langfuse tracing](#44-observability--langfuse-tracing-s03e01-opt-in)

### 2.4. Non-deterministic models as advantage (S03E05)

Lekcja S03E05 uczy wykorzystania **niedeterminizmu** LLM (szeroka przestrzeń interpretacji, proaktywność, synteza) przy jednoczesnym wyznaczaniu **granic** w kodzie i promptach — architektura kognitywna (CoALA), nie „pełna kontrola skryptem”. Runtime boilerplate (`createAgent`, `http_request`, `toolDiscovery`, `reasoning` w adapterze) **pozostaje bez zmian**; demo `03_05_*` i homework `savethem` realizujesz w lekcjach / epizodzie.

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Profil agenta hub** | Wąski ReAct, jawne cele, ≤5 tur, deterministyczna weryfikacja hub | Kopiowanie agenta „świadomego” z lekcji do każdego zadania | [§2.1](#21-project-constraints-s03e02); epizody `tasks/sXXeYY/` |
| **Szeroka przestrzeń zachowań** | Ogólne instrukcje + metadata + pamięć plikowa; model wybiera **kiedy** działać | Sztywne if/else w prompcie dla każdej sytuacji | [03_05_awareness](../../lessons/03_05_awareness/) |
| **`think` / `recall`** | Narzędzia „zastanów się” + odkrywanie pamięci | Wymaganie tych narzędzi w boilerplate | [tools.ts](../../lessons/03_05_awareness/src/core/tools.ts) |
| **Reasoning API** | `reasoning` / `reasoning_effort` per wywołanie w epizodzie (koszt świadomy) | Domyślne `high` dla wszystkich zadań kursu | [`ai.ts`](../boilerplate/src/agent/ai.ts); env epizodu |
| **Powtarzalność** | Akceptuj podobne wyniki przy tym samym kontekście; testuj trajektorie, nie jeden seed | Traktowanie LLM jak funkcji czystej | [agent-evals](../agent-evals/README.md) (opcjonalnie) |
| **Hub toolsearch (`savethem`)** | `http_request` POST na hub; angielskie `query`; odkryte API = ten sam kontrakt | Wbudowany MCP `toolsearch` w pakiecie | epizod `s03e05` (planowany); przykład JSON poniżej |
| **Lazy discovery (lokalne MCP)** | `toolDiscovery: { enabled: true }` gdy wiele proxy-MCP po odkryciu hub | Mylenie z HTTP toolsearch (inny mechanizm) | [tool-discovery research](../boilerplate/docs/specs/tool-discovery/tool-discovery.research.md); [README — Tool discovery](../boilerplate/README.md#tool-discovery-optional-s02e05-inspired) |
| **Artefakty HTML** | iframe + biblioteki znane modelowi (Tailwind 3, Chart.js…) | Generowanie UI w default boilerplate | [03_05_artifacts](../../lessons/03_05_artifacts/) |
| **JSON Render** | Stan JSON → szablon; zapis/wczytanie stanu | Pełny HTML z modelu gdy potrzebna kontrola | [03_05_render](../../lessons/03_05_render/) |
| **MCP Apps** | Host UI + sync stanu po interakcji użytkownika | Playwright / MCP Apps w default install | [03_05_apps](../../lessons/03_05_apps/); [§2.2](#22-contextual-feedback-s03e03) |
| **Generatywne UI na produkcji** | Balans: artefakt vs JSON vs MCP Apps („kiedy X, kiedy Y”) | Jedna ścieżka „zawsze HTML z LLM” | transkrypt S03E05 |
| **Homework `savethem`** | ReAct + odkrywanie narzędzi + optymalizacja trasy → tablica ruchów `/verify` | Solver trasy w `createAgent` | markdown S03E05; `submit_to_hub` w boilerplate |

**Reguła kciuka:**

```text
Homework hub (savethem: trasa, /verify) → default boilerplate + http_request; toolsearch i odkryte endpointy w epizodzie (angielskie query).
Agent konwersacyjny / think+recall / szerokie prompty → lekcja 03_05_awareness — nie domyślny pakiet.
Artefakty / JSON Render / MCP Apps → lekcje 03_05_artifacts | _render | _apps — host poza @ai-devs/agent-boilerplate.
Wiele lokalnych MCP po odkryciu API → toolDiscovery opt-in; HTTP toolsearch ≠ activate_tools, ten sam cel pedagogiczny.
```

**Przykład — pierwsze wywołanie hub toolsearch w epizodzie `savethem`** (dalsze narzędzia zwraca toolsearch; każde przyjmuje `query` + `apikey`):

```json
{
  "url": "https://hub.ag3nts.org/api/toolsearch",
  "method": "POST",
  "body": {
    "apikey": "<HUB_API_KEY>",
    "query": "movement rules and terrain map"
  }
}
```

**Odniesienia:** [research S03E05](../boilerplate/docs/specs/s03e05-nondeterministic-models/s03e05-nondeterministic-models.research.md) · [§2.1 Project constraints (S03E02)](#21-project-constraints-s03e02) · [§2.2 Contextual feedback (S03E03)](#22-contextual-feedback-s03e03) · [§2.3 Tool design & test data (S03E04)](#23-tool-design--test-data-s03e04) · [§2.5 Production deployments (S04E01)](#25-production-deployments-s04e01) · [§2.6 Active collaboration (S04E02)](#26-active-collaboration-with-ai-s04e02) · [03_05_awareness](../../lessons/03_05_awareness/) · [03_05_artifacts](../../lessons/03_05_artifacts/) · [03_05_render](../../lessons/03_05_render/) · [03_05_apps](../../lessons/03_05_apps/) · [tool-discovery research](../boilerplate/docs/specs/tool-discovery/tool-discovery.research.md)

### 2.5. Production deployments (S04E01)

Lekcja S04E01 uczy **wdrażania** rozwiązań AI: oczekiwania vs ograniczenia, współpraca synchroniczna vs asynchroniczna, balans kodu i modelu oraz szybkie testy hipotez przed pełnym produktem. Runtime boilerplate (`createAgent`, MCP, `http_request`, `/verify`) **pozostaje bez zmian** dla typowych epizodów hub; referencyjna aplikacja **Cyfrowy Ogród** (`04_01_garden`) to osobna lekcja, nie rozszerzenie pakietu.

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Profil systemu** | Epizod hub: wąski ReAct, `http_request`, `/verify`, brak mutacji repo | Kopiowanie `04_01_garden` do każdego `tasks/sXXeYY/` | [§2.1](#21-project-constraints-s03e02); epizody `tasks/` |
| **Wdrożenie produkcyjne** | Dogfooding, iteracje, jawne „czego nie robimy” | „Pełna automatyzacja” bez guardów | lekcja S04E01; [04_01_garden](../../lessons/04_01_garden/) |
| **Oczekiwania vs rzeczywistość** | Limity kontekstu/kosztu w MCP i promptach | Obietnica „dowolnej automatyzacji” w core | [§2.1](#21-project-constraints-s03e02) |
| **Sync (człowiek w pętli)** | `ask_human`, krótka sesja, nadzór przy destrukcyjnych akcjach | Terminal/git w default pakiecie | [`ask_human`](../boilerplate/src/tools/native/ask_human.ts); [§2.2](#22-contextual-feedback-s03e03) |
| **Async (tło)** | Osobny entrypoint, cron, `tasks.md` | Heartbeat w `createAgent` | [03_02_events](../../lessons/03_02_events/) |
| **Balans kod / AI** | Deterministyczna logika w MCP TypeScript | Model wybiera ścieżkę API / merge ID | [§2.1](#21-project-constraints-s03e02) |
| **Sandbox plików (hub)** | `read_file` chroot, chunking | `write_file` / shell w core | [§5.2.1](#521-code-mode--wykonanie-kodu-poza-pakietem) |
| **Sandbox wykonania** | Lekcja: QuickJS, Deno lub **Daytona** (garden) | `execute_code` w default install | [02_05_sandbox](../../lessons/02_05_sandbox/); [03_02_code](../../lessons/03_02_code/); [04_01_garden](../../lessons/04_01_garden/) |
| **Code mode (garden)** | Node w VM + `codemode.vault.*` w lekcji | Wbudowany code mode w boilerplate | [code-mode.ts](../../lessons/04_01_garden/src/tools/code-mode.ts) |
| **Skills / workflows** | `SKILL.md`, `/invoke`, workflows w hoście aplikacji | Publiczne API skills w `createAgent` | [04_01_garden/vault/system/](../../lessons/04_01_garden/vault/system/) |
| **Publikacja treści** | CI (GitHub Actions) + static site poza agentem | `git_push` w MCP kursu | garden [`.github/workflows/`](../../lessons/04_01_garden/.github/workflows/) |
| **Static site (grove)** | MD → HTML w kodzie buildera | Generowanie HTML z modelu w boilerplate | [grove/](../../lessons/04_01_garden/grove/) |
| **Test hipotez** | Frontmatter w MD, dataset + eval przed chatbotem | Pełny RAG/chat „na wszelki wypadek” | [§2.3](#23-tool-design--test-data-s03e04); [agent-evals](../agent-evals/README.md) |
| **Dostępność wiedzy** | Wyszukiwarka / link do dokumentu | Obowiązkowy chatbot | decyzja produktowa — docs |
| **`@ai-devs/agent-garden`** | Defer — osobny pakiet gdy ≥2 epizody | Port garden do core boilerplate | [research S04E01](../boilerplate/docs/specs/s04e01-production-deployments/s04e01-production-deployments.research.md) |

**Reguła kciuka:**

```text
Epizod hub (HTTP, ≤5 tur, brak mutacji repo) → default boilerplate.
Wdrożenie jak Digital Garden (terminal, git, publikacja, skills) → lessons/04_01_garden — nie rozszerzaj pakietu.
Orchestracja czasu / agenci w tle → lessons/03_02_events — nie createAgent.
Potrzebujesz write/terminal → lekcja garden lub epizod z jawnymi guardami — nie core.
```

**Odniesienia:** [research S04E01](../boilerplate/docs/specs/s04e01-production-deployments/s04e01-production-deployments.research.md) · [§2.1 Project constraints (S03E02)](#21-project-constraints-s03e02) · [§2.2 Contextual feedback (S03E03)](#22-contextual-feedback-s03e03) · [§2.3 Tool design & test data (S03E04)](#23-tool-design--test-data-s03e04) · [§2.4 Non-deterministic models (S03E05)](#24-non-deterministic-models-as-advantage-s03e05) · [§2.6 Active collaboration (S04E02)](#26-active-collaboration-with-ai-s04e02) · [§5.2.1 Code mode](#521-code-mode--wykonanie-kodu-poza-pakietem) · [04_01_garden](../../lessons/04_01_garden/) · [03_02_events](../../lessons/03_02_events/) · [sandbox-code-execution research](../boilerplate/docs/specs/sandbox-code-execution/sandbox-code-execution.research.md)

### 2.6. Active collaboration with AI (S04E02)

Lekcja S04E02 uczy **aktywnej współpracy z AI**: wybór kanału dostarczenia agenta (CLI, MCP w kliencie, komunikator, dedykowany UI), ograniczenia hostów MCP oraz personalizacji po stronie **hosta aplikacji** (profile, skills, meta-prompty). Runtime boilerplate (`createAgent`, serwer MCP in-process, `ask_human`) **pozostaje bez zmian** dla typowych epizodów hub; pełna kontrola UX, profile i multi-agent wymagają warstwy poza pakietem. Na rynku pojawia się też **Agent Client Protocol (ACP)** — standard host↔agent w IDE (np. JetBrains, Zed); to decyzja hosta, nie moduł kursowy.

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Kanał dostarczenia (hub)** | MCP serwer epizodu + klient IDE (Cursor, Claude Code) | Klon ChatGPT / Slack w każdym `tasks/sXXeYY/` | [`server.ts`](../boilerplate/src/mcp/server.ts); §2.6 |
| **CLI (dev)** | Agenci kodowania na maszynie użytkownika lub zdalnym sandboxie | `terminal` w default MCP pakietu | [§2.5](#25-production-deployments-s04e01); [04_01_garden](../../lessons/04_01_garden/) |
| **MCP jako integracja** | Wąskie narzędzia + JSON w odpowiedzi; logika w opisach MCP | Pełna aplikacja ukryta w jednym narzędziu | [§2.3](#23-tool-design--test-data-s03e04) |
| **Własny interfejs** | Gdy potrzebujesz uprawnień, statusu tła, UX potwierdzeń | Założenie, że MCP w Claude.ai zawsze wystarczy | aplikacja poza pakietem |
| **Ograniczenia hosta MCP** | Świadomość braku samplingu / słabej kontroli system prompt | MCP Sampling w default serwerze kursu | [research S03E03](../boilerplate/docs/specs/s03e03-contextual-feedback/s03e03-contextual-feedback.research.md); [§2.2](#22-contextual-feedback-s03e03) |
| **MCP Apps (postęp UI)** | Host z Apps + sync stanu po interakcji użytkownika | MCP Apps w `@ai-devs/agent-boilerplate` | [§2.4](#24-non-deterministic-models-as-advantage-s03e05); [03_05_apps](../../lessons/03_05_apps/) |
| **Komunikator (Slack itd.)** | Bot / webhook → ten sam backend agenta | Pełny agent w boilerplate | epizod / osobna app |
| **Profile / subagenci / skills** | Host ładuje `SKILL.md`, subset narzędzi | Publiczne API skills w `createAgent` | [§2.5](#25-production-deployments-s04e01); [04_01_garden](../../lessons/04_01_garden/) |
| **Meta-prompty (produkt)** | Osobny flow onboardingowy; generowanie instrukcji z rozmowy | Meta-prompt engine w pakiecie | [`planning.ts`](../boilerplate/src/agent/planning.ts); Cursor `@eversis-*` |
| **Multi-agent** | Orchestrator wywołuje workerów / wiele `processQuery` | Jeden ReAct „udaje zespół” | [03_02_events](../../lessons/03_02_events/) |
| **Sync z człowiekiem** | `ask_human`, krótka sesja hub | Blokada stdin jako substytut UI web | [`ask_human`](../boilerplate/src/tools/native/ask_human.ts) |
| **Mikro-akcja** | Skrypt + skrót gdy jeden krok | Agent na każdą transformację tekstu | poza repo kursu |
| **ACP** | Standard host↔agent (IDE) — świadomość rynku | Implementacja ACP w boilerplate | docs §2.6 |

**Reguła kciuka:**

```text
Epizod hub (verify, krótka sesja) → default boilerplate + MCP dla klienta IDE.
Potrzebujesz kontroli UX, profili, statusu tła → własny host lub lekcja — nie rozszerzaj createAgent.
Chcesz meta-prompt produktowy → osobny prompt/flow — nie moduł w @ai-devs/agent-boilerplate.
Multi-agent / praca w tle → orchestrator poza pętlą ReAct (03_02_events) — nie agent.ts.
```

**Odniesienia:** [research S04E02](../boilerplate/docs/specs/s04e02-active-collaboration/s04e02-active-collaboration.research.md) · [§2.1 Project constraints (S03E02)](#21-project-constraints-s03e02) · [§2.2 Contextual feedback (S03E03)](#22-contextual-feedback-s03e03) · [§2.3 Tool design & test data (S03E04)](#23-tool-design--test-data-s03e04) · [§2.4 Non-deterministic models (S03E05)](#24-non-deterministic-models-as-advantage-s03e05) · [§2.5 Production deployments (S04E01)](#25-production-deployments-s04e01) · [§2.7 Contextual collaboration (S04E03)](#27-contextual-collaboration-in-daily--business-workflows-s04e03) · [§5.2.1 Code mode](#521-code-mode--wykonanie-kodu-poza-pakietem) · [03_02_events](../../lessons/03_02_events/) · [03_05_apps](../../lessons/03_05_apps/) · [04_01_garden](../../lessons/04_01_garden/) · transkrypt: `markdowns/s04e02-aktywna-wspolpraca-z-ai-1774908365.md`

### 2.7. Contextual collaboration in daily & business workflows (S04E03)

Lekcja S04E03 rozwija **kontekstową współpracę z AI w codzienności i biznesie** — integracje API-first, agenci działający w tle, izolacja obszarów odpowiedzialności oraz samonadzór systemu (evals / LLM-judge). To uzupełnienie [§2.2](#22-contextual-feedback-s03e03) (mechanika kontekstu) i [§2.6](#26-active-collaboration-with-ai-s04e02) (kanał współpracy). Runtime boilerplate (`createAgent`, MCP, `http_request`) **pozostaje bez zmian**; orchestracja czasu, integracje SaaS i meta-agenci audytujący to **warstwa aplikacji** poza pakietem.

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **AI w tle** | Osobny entrypoint + ten sam `createAgent` | Jeden wieczny ReAct na cały biznes | [03_02_events](../../lessons/03_02_events/); [§2.5](#25-production-deployments-s04e01) |
| **Integracja SaaS** | Wąskie MCP + `http_request`; scope w handlerze | Pełne API w jednym narzędziu | [§2.3](#23-tool-design--test-data-s03e04); epizod |
| **Uprawnienia** | Read-only KB; wysyłka tylko do ownera | Model z pełnym dostępem API | env + MCP epizodu |
| **Powiadomienia** | Tylko gdy istotne; zbiorcze digesty | Agent produkujący szum | prompt + orchestrator |
| **Aktywne katalogi** | Folder → worker → kolejny etap | Watchery w `createAgent` | [04_01_garden](../../lessons/04_01_garden/) |
| **Metadata urządzenia** | JSON / `<metadata>` w user message | Model zgaduje DND/geo | [03_03_calendar](../../lessons/03_03_calendar/) |
| **Izolacja agentów** | 1 obszar = 1 agent/worker | Wspólna pamięć wszystkich ról | §2.7; [02_04_ops](../../lessons/02_04_ops/) gdy sync |
| **Komunikacja agentów** | Tylko gdy zadanie wymaga współdzielenia | Domyślny graf zależności | S02E04; `delegate` w ops |
| **Samonadzór systemu** | Cykliczny audit + evals / LLM-judge | Hook w każdej turze ReAct | [agent-evals](../../agent-evals/README.md); Langfuse |
| **Monitoring sygnału** | Scheduled fetch + klasyfikacja | Ciągły ReAct na RSS | worker + epizod |
| **Epizod hub (strategia)** | Planner TS + minimalny ReAct | Pełna automatyzacja bez kosztów | `tasks/sXXeYY/` |

**Reguła kciuka:**

```text
Chcesz AI w codzienności (mail, kalendarz, KPI) → orchestrator + triggery poza createAgent; wąskie MCP per domena.
Budujesz wiele agentów → izoluj obszary; łącz tylko gdy musisz (02_04_ops).
System ma się sam oceniać → periodic worker + agent-evals — nie rozszerzaj agent.ts.
Epizod hub (verify, mapa/strategia) → default boilerplate; logika planowania w kodzie epizodu.
```

**Odniesienia:** [research S04E03](../boilerplate/docs/specs/s04e03-contextual-collaboration/s04e03-contextual-collaboration.research.md) · [§2.1 Project constraints (S03E02)](#21-project-constraints-s03e02) · [§2.2 Contextual feedback (S03E03)](#22-contextual-feedback-s03e03) · [§2.3 Tool design & test data (S03E04)](#23-tool-design--test-data-s03e04) · [§2.5 Production deployments (S04E01)](#25-production-deployments-s04e01) · [§2.6 Active collaboration (S04E02)](#26-active-collaboration-with-ai-s04e02) · [§5.2.1 Code mode](#521-code-mode--wykonanie-kodu-poza-pakietem) · [agent-evals](../../agent-evals/README.md) · [research S03E01](../boilerplate/docs/specs/agent-observability-evals/agent-observability-evals.research.md) · [03_02_events](../../lessons/03_02_events/) · [03_03_calendar](../../lessons/03_03_calendar/) · [04_01_garden](../../lessons/04_01_garden/) · [02_04_ops](../../lessons/02_04_ops/) · transkrypt: `markdowns/s04e03-kontekstowa-wspolpraca-z-ai-1774999647.md`

---

## 3. Struktura Katalogów (Directory Tree)

```text
/
├── .cursor/
│   └── rules/                 # Reguły dla narzędzia cursor-collections (np. tools.md, prompts.md)
├── src/
│   ├── agent/
│   │   ├── agent.ts           # Pętla decyzyjna agenta (Reasoning Loop)
│   │   ├── ai.ts              # Adapter modelu językowego (z logiką Retry/Backoff)
│   │   └── memory.ts          # Implementacja Observer / Reflector
│   ├── mcp/
│   │   ├── client.ts          # Interfejs klienta MCP
│   │   └── server.ts          # Serwer MCP rejestrujący narzędzia zdefiniowane w /tools/mcp/
│   ├── tools/
│   │   ├── native/            # Narzędzia wewnętrzne (np. finish_task.ts, ask_human.ts)
│   │   └── mcp/               # Narzędzia zewnętrzne (np. http_request.ts, read_file.ts)
│   ├── prompts/               # Pliki .md z instrukcjami (np. system.md, memory.md)
│   ├── scripts/               # Kod specyficzny dla danego zadania (domenowy)
│   ├── types/
│   │   └── index.ts           # Globalne interfejsy i schematy Zod
│   └── utils/
│       └── logger.ts          # Kolorowane logi: [MYŚL], [AKCJA], [WYNIK], [SYSTEM]
├── .env.example               # Szablon zmiennych środowiskowych
├── package.json
├── tsconfig.json
├── config.ts                  # Konfiguracja bazowa (modele, limity pamięci)
├── index.ts                   # Entrypoint aplikacji (bootstrap)
├── README.md                  # Dokumentacja "Quick Start"
└── CHANGELOG.md               # Dziennik wprowadzanych modyfikacji

```

---

## 4. Specyfikacja Interfejsów i Modułów (Contracts)

### 4.1. Moduł AI / Adapter Modelu (`src/agent/ai.ts`)

**Odpowiedzialność:** Komunikacja z API LLM (OpenAI/Anthropic/Gemini) z gwarancją obsługi błędów.
**Wymagania Spec-Driven:**

- Musi implementować mechanizm ponawiania żądań (Retry) z wykładniczym opóźnieniem (Exponential Backoff) aktywowany przy kodach `429` (Rate Limit) i `503` (Service Unavailable).
- Musi obsługiwać `tool_choice` oraz parsowanie wywołań narzędzi do wspólnego formatu.

```typescript
// Kontrakt
interface AIAdapter {
  generateResponse(
    messages: Message[],
    tools: ToolDefinition[],
  ): Promise<ModelResponse>;
}
type ModelResponse = {
  content: string;
  toolCalls?: ToolCall[];
};
```

### 4.2. Pętla Agenta (`src/agent/agent.ts`)

**Odpowiedzialność:** Zarządzanie procesem myślowym (Reasoning Loop).
**Przepływ (Workflow):**

1. Przyjmij zadanie (Task) i załaduj System Prompt (`/prompts/system.md`).
2. Opcjonalnie (`enablePlanningPhase: true`): **tura 0** — plan bez narzędzi (`tool_choice: none`), log `[PLAN]`, blok `## Working plan` w instructions; **nie** wlicza się do `MAX_ITERATIONS`.
3. Rozpocznij pętlę ReAct (do `MAX_ITERATIONS`).
4. Wywołaj `ai.ts`. Wypisz `content` używając `logger.logThought()`.
5. Jeśli model zwrócił `toolCalls`:

- Zweryfikuj typ narzędzia (Native vs MCP).
- Zablokuj pętlę i poczekaj na wynik (`await executeTool()`).
- Zapisz wynik za pomocą `logger.logResult()`.
- Dodaj wynik do kontekstu jako nową wiadomość typu `tool_result`.

6. Jeśli wykonano narzędzie `finish_task` -> przerwij pętlę, zwróć wynik.

### 4.3. Zarządzanie Pamięcią (`src/agent/memory.ts` + `observational_memory/`)

**Odpowiedzialność:** Kompresja historii konwersacji w długich sesjach (operacje na plikach, wiele tur ReAct).

**Implementacja:** `createObservationalMemoryHooks()` (opt-in). Domyślnie `noopMemoryHooks`.

**Layout kontekstu:**

```text
instructions = prompt + <observations> … </observations>
input        = ostatni surowy ogon konwersacji
```

**Observer:** Gdy szacunek tokenów ogonu ≥ `OBSERVER_THRESHOLD_TOKENS`, najstarsza część jest sealowana przez LLM do obserwacji XML (tagi `[user]`, `[tool:name]`, priorytety). Surowy ogon zostaje w `input`.

**Reflector:** Gdy obserwacje ≥ `REFLECTOR_THRESHOLD_TOKENS` i wzrost od ostatniej refleksji ≥ `REFLECTION_TARGET_TOKENS`, LLM kompresuje cały blok obserwacji.

**Kalibracja tokenów:** Progi Observer liczone **raw** (`chars/4`). Rozmiar obserwacji i Reflector używają ratio z API `usage` po zebraniu próbek (`OM_CALIBRATION_MIN_ACTUAL_TOKENS`).

**Persystencja:** Opcjonalna (`OM_PERSIST_DIR`) — pliki `observer-NNN.md`, `reflector-NNN.md` do debugu.

### 4.4. Observability — Langfuse tracing (S03E01, opt-in)

**Nie mylić z Observational Memory (§4.3).** OM kompresuje kontekst; Langfuse rejestruje trace do debugowania, kosztów i evalów.

**Import:** `@ai-devs/agent-boilerplate/observability` (wymaga peer deps `@langfuse/tracing`, `@langfuse/otel`, OTEL SDK).

**Domyślnie wyłączone** — brak kluczy `LANGFUSE_*` → `initTracing()` no-op; `createAgent` bez `tracing` → `noopTracingRuntime`.

**Hierarchia spanów:**

```text
chat-request (trace)
└── agent
    ├── memory/observer#N   ← createOmTracingCallbacks (gdy OM + tracing)
    ├── memory/reflector#N
    ├── generation#N   ← withTracingAdapter on AIAdapter
    └── tool#N         ← dispatchToolCall via TracingRuntime.withTool
```

**OM + tracing:** `createObservationalMemoryHooks({ ...createOmTracingCallbacks(tracing) })` — span metadata only (bez XML obserwacji). Spec: `tasks/boilerplate/docs/specs/om-langfuse-spans/`.

**Konfiguracja:** `createAgent({ tracing: createTracingRuntime({ sessionId, agentName }) })`.

**Eval harness:** osobny pakiet [`@ai-devs/agent-evals`](../../agent-evals/README.md) — datasets, evaluators, `bootstrapExperiment`. Eksperymenty **lokalnie**, nie w CI.

**PII:** redakcja danych przed wysyłką do Langfuse — polityka **task-level** (nie wbudowany redactor w boilerplate).

Spec: `tasks/boilerplate/docs/specs/agent-observability-evals/`.

---

## 5. Specyfikacja Narzędzi (Tool Definitions)

Narzędzia muszą być zdefiniowane za pomocą biblioteki `Zod` (dla walidacji i generowania JSON Schema dla LLM).

### 5.1. Narzędzia Natywne (`src/tools/native/`)

Bezpośredni dostęp do logiki sterującej:

- **`finish_task`**
- _Opis:_ Zakończenie pracy agenta po zalezieniu rozwiązania.
- _Parametry:_ `final_answer` (string lub zrzut JSON).

- **`ask_human`**
- _Opis:_ Przerwanie pracy na żądanie pomocy od człowieka. Wstrzymuje proces w oczekiwaniu na wejście ze strumienia `stdin`.
- _Parametry:_ `question` (string).

### 5.2. Odkrywalność narzędzi (opcjonalna, S02E05)

Epizody mogą włączyć **lazy registration** przez `createAgent({ toolDiscovery: { enabled: true } })`:

- Meta-narzędzia: `list_tools`, `describe_tool`, `activate_tools` (natywne, wstrzykiwane przez runtime).
- Domyślne **core** w API od pierwszej tury ReAct: `http_request`, `submit_to_hub`, `finish_task` (nadpisywalne przez `coreToolNames`).
- Pozostałe MCP pojawiają się w function calling dopiero po `activate_tools`.
- Pozostałe MCP pojawiają się w function calling dopiero po `activate_tools`.
- Bez QuickJS / `execute_code` — to warstwa **code mode** (§5.2.1), nie discovery.

### 5.2.1. Code mode / wykonanie kodu (poza pakietem)

Boilerplate **nie** implementuje `execute_code` ani piaskownicy QuickJS/Deno. W kursie wyróżniamy **trzy warstwy** „sandbox”:

| Warstwa | Co izoluje | Gdzie |
| --- | --- | --- |
| **Pliki** | Ścieżki odczytu | `read_file` (chroot względem katalogu zadania) |
| **Discovery** | Rozmiar kontekstu LLM (schematy narzędzi) | opt-in `toolDiscovery` (§5.2) |
| **Wykonanie kodu** | Runtime gościa (JS/TS) + mosty MCP | **lekcje**, nie `@ai-devs/agent-boilerplate` |

**Kiedy zostawać przy ReAct (domyślnie):** krótki łańcuch narzędzi (typowo ≤5 tur, ≤4 narzędzia w prompcie), zadania oparte na feedbacku z huba, vision + HTTP — np. homework S02E05 `drone`.

**Kiedy code mode (lekcje):** wiele wywołań MCP w jednym skrypcie, duże pośrednie dane poza kontekstem LLM, złożona orchestracja (`for` / `if` w kodzie gościa).

| Lekcja | Mechanizm | Profil |
| --- | --- | --- |
| `lessons/02_05_sandbox` | QuickJS (WASM) in-process, meta-narzędzia + `execute_code` | Batch MCP w JavaScript |
| `lessons/03_02_code` | Deno subprocess + HTTP bridge | TypeScript, pliki, PDF |
| `lessons/04_01_garden` | Daytona (zdalny VM), `terminal`, `code_mode`, sync `vault/` | Wdrożeniowy Digital Garden; publikacja przez CI — **nie** profil homework hub |

**Przyszły współdzielony moduł:** jeśli zadanie w `tasks/` wymaga code mode, preferowany jest **osobny pakiet** (np. `@ai-devs/agent-code-mode`), nie rozszerzenie domyślnej instalacji boilerplate. Profil wdrożeniowy (terminal, git, skills) mapuj na [§2.5](#25-production-deployments-s04e01) i lekcję `04_01_garden` — nie na `@ai-devs/agent-boilerplate`.

Research i plan: `tasks/boilerplate/docs/specs/sandbox-code-execution/` · [S04E01 production deployments](../boilerplate/docs/specs/s04e01-production-deployments/s04e01-production-deployments.research.md).

Gdy API zadania jest **asynchroniczne** (kolejka + poll, wiele równoległych requestów), preferuj **deterministyczną orchestrację w TypeScript** w entrypoincie epizodu lub code mode w lekcji — zamiast wielu tur ReAct czekających na LLM. Pakiet `@ai-devs/agent-boilerplate` **nie** wykonuje narzędzi równolegle w jednej turze modelu; to nie blokuje równoległości w kodzie epizodu poza pętlą agenta. Mapowanie kanału współpracy (CLI, MCP host, własny UI): [§2.6](#26-active-collaboration-with-ai-s04e02).

### 5.3. Narzędzia MCP (`src/tools/mcp/`)

Udostępniane przez serwer MCP (`mcp/server.ts`):

- **`http_request`** (Najważniejsze narzędzie sieciowe dla kursu)
- _Opis:_ Wykonanie zapytania HTTP. Pod spodem korzysta z tej samej logiki Retry co adapter AI, aby radzić sobie z Rate Limitami API kursowego.
- _Parametry:_ `url` (string), `method` (enum: GET, POST), `body` (opcjonalny JSON).

- **`submit_to_hub`**
- _Opis:_ Wyodrębniona logika wysyłania odpowiedzi pod adres weryfikujący i wyciągania flagi `{FLG:...}`.
- _Parametry:_ `task_name` (string), `answer` (any).

- **`read_file`**
- _Opis:_ Odczyt zawartości pliku tekstowego z zabezpieczeniem (Chunking). Jeśli plik ma więcej niż Y znaków, odczytuje tylko zadaną porcję.
- _Parametry:_ `filepath` (string), `offset` (number, opcjonalnie).

- **`analyze_image_vision`**
- _Opis:_ Wykorzystuje lekki model vision (np. Gemini 1.5 Flash), aby opisać obrazek i zwrócić tekst do głównego (droższego) agenta, oszczędzając tokeny.
- _Parametry:_ `filepath` (string), `query` (string - o co zapytać obrazek).

---

## 6. Integracja Cursor IDE — Cursor Collections (Eversis)

Repozytorium jest w pełni zintegrowane z frameworkiem [PiotrNie-Eversis/cursor-collections](https://github.com/PiotrNie-Eversis/cursor-collections). Poniżej znajdziesz mapę dostępnych zasobów w katalogu `.cursor/` w korzeniu repozytorium.

### Workflow: Ideate → Implement → Review

Każde nowe zadanie realizuj zgodnie z workflow opisanym w [AGENTS.md](/third-party/github-collections/AGENTS.md) i [documentation/cursor-collection.md](/third-party/github-collections/documentation/cursor-collection.md):

1. **Implement** — dołącz `@eversis-implement` i opis zadania; agent przeprowadzi research → plan → kod z ludzkimi bramkami zatwierdzenia.
2. **Review** — po implementacji dołącz `@eversis-review` w celu ustrukturyzowanego przeglądu kodu.

### Dostępne reguły (`.cursor/rules/`)

| Plik                                        | Kiedy aktywna                                                |
| ------------------------------------------- | ------------------------------------------------------------ |
| `eversis-agent-core.mdc`                    | zawsze (`alwaysApply: true`) — bazowe zachowania agenta      |
| `eversis-project-stack.mdc`                 | zawsze — stack Bun/TypeScript, komendy i konwencje tego repo |
| `eversis-engineering-manager.mdc`           | na żądanie `@` — przy użyciu `@eversis-implement`            |
| `eversis-code-reviewer.mdc`                 | na żądanie `@` — przy użyciu `@eversis-review`               |
| `eversis-testing-and-terminal.mdc`          | na żądanie `@` — dyscyplina testowania i terminala           |
| `use-bun-instead-of-node-vite-npm-pnpm.mdc` | automatycznie dla `tasks/**` i `lessons/**`                  |

### Dostępne prompty (`.cursor/prompts/`, dołącz przez `@`)

| Prompt                         | Zastosowanie                                             |
| ------------------------------ | -------------------------------------------------------- |
| `@eversis-implement`           | Research → plan → implementacja nowego zadania kursowego |
| `@eversis-review`              | Przegląd kodu z PASS / BLOCKER / SUGGESTION              |
| `@eversis-review-codebase`     | Ogólny przegląd zdrowia bazy kodu                        |
| `@eversis-analyze-materials`   | Analiza materiałów kursu → strukturyzowane notatki       |
| `@eversis-create-custom-skill` | Tworzenie nowego skill package w `.cursor/skills/`       |

### Skills (`.cursor/skills/`, przez MCP `eversis-collections`)

Po uruchomieniu lokalnego serwera MCP (`node third-party/github-collections/mcp/eversis-collections-mcp/dist/index.js`, po `npm ci && npm run build` w tym katalogu) agent może wywołać narzędzia `eversis_skills_list` i `eversis_skills_get`, aby odczytać proceduralne instrukcje dla konkretnych technologii (np. `eversis-implementing-backend`, `eversis-sql-and-database-understanding`).

### Kluczowe konwencje wymuszane przez reguły

- Wszystkie duże bloki promptów trzymaj w `src/prompts/*.md`; wczytuj przez `fs.readFileSync`. Nigdy nie hardkoduj długich stringów w logice agenta.
- Nowe narzędzie MCP: utwórz plik w `src/tools/mcp/`, zdefiniuj `inputSchema` przez `zod`, zarejestruj w `src/mcp/server.ts`, zwracaj `{ content: [{ type: "text", text: string }] }`.
- Zakres zmian — modyfikuj wyłącznie pliki wymagane przez zadanie; nie refaktoruj kodu niezwiązanego ze zmianą.

---

## 7. Plan Wdrożenia (Implementation Steps)

Przy użyciu Cursora proces wdrażania na podstawie tej specyfikacji powinien przebiegać następująco:

**KROK 1: Inicjalizacja i Fundamenty (Konfiguracja)**

- Utworzenie plików `package.json`, `tsconfig.json`, `config.ts`, `.env.example`.
- Instalacja kluczowych pakietów: `zod`, `@modelcontextprotocol/sdk`, bibliotek AI (np. `openai` lub dedykowanych SDK), bibliotek do logowania (np. `chalk` do kolorowania).

**KROK 2: Logowanie i Typy**

- Stworzenie modułu `utils/logger.ts` i zdefiniowanie standardu logowania procesu myślowego.
- Utworzenie pliku `types/index.ts` zawierającego schematy wiadomości (Role: system, user, assistant, tool).

**KROK 3: Adapter AI i Odporność (Resilience)**

- Zakodowanie pliku `ai.ts` implementującego kontrakt `AIAdapter`.
- Wdrożenie funkcji opóźnienia i ponawiania (`Exponential Backoff`) przechwytującej HTTP 503.

**KROK 4: Warstwa Narzędzi i MCP**

- Inicjalizacja serwera MCP w `mcp/server.ts`.
- Stworzenie 4 bazowych narzędzi MCP zdefiniowanych w Sekcji 5.
- Inicjalizacja klienta MCP `mcp/client.ts` i mapowanie narzędzi do zrzutu Zod.
- Utworzenie narzędzi natywnych (`finish_task`, `ask_human`).

**KROK 5: Pętla Główna Agenta (Reasoning Loop)**

- Złożenie całości w `agent.ts`.
- Implementacja pętli z ogranicznikiem zapętlenia (Max Iterations Guard).
- Integracja wywołań zwrotnych (Tool Results) do kontekstu modelu.

**KROK 6: Pamięć (Wersja edukacyjna)**

- Moduł `observational_memory/` z `createObservationalMemoryHooks()` — Observer/Reflector zgodnie z lekcją S02E05 (wdrożone).

**KROK 7: Testy "Hello World"**

- Napisanie prostego skryptu w `scripts/test_agent.ts` używającego boilerplate'u do spytania o prosty matematyczny fakt z sieci lub z odczytanego pliku z użyciem narzędzia `http_request` lub `read_file`.
