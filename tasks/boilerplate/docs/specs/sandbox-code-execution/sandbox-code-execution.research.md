# Sandbox (QuickJS + code mode) — research

**Task:** Zweryfikować zasadność przeniesienia funkcjonalności z `lessons/02_05_sandbox` do `tasks/boilerplate` (`@ai-devs/agent-boilerplate`).

**Data:** 2026-05-27  
**Status:** **Zaimplementowano (Opcja A — dokumentacja)** (2026-05-30). Plan: [sandbox-code-execution.plan.md](sandbox-code-execution.plan.md).

**Źródła:**

- `markdowns/s02e05-projektowanie-agentow-1773962356.md` — transkrypt / opis epizodu S02E05 (sandbox, OM, zadanie `drone`)
- `lessons/02_05_sandbox/` — lekcja (QuickJS, meta-narzędzia, MCP registry, demo todo)
- `lessons/02_05_agent/` — lekcja OM (już w boilerplate jako `observational_memory/`)
- `lessons/03_02_code/` — alternatywny sandbox (Deno + HTTP bridge)
- `tasks/boilerplate/` — docelowy runtime
- `tasks/docs/boilerplate-documentation.md` — spec produktowa boilerplate
- `tasks/boilerplate/docs/specs/observational-memory/observational-memory.research.md` — precedens analizy lekcji → boilerplate

---

## 1. Executive summary

**Werdykt: częściowo tak — jako moduł opt-in, nie jako domyślna ścieżka w boilerplate.**

| Opcja | Rekomendacja |
| --- | --- |
| Wbudować sandbox (QuickJS + `execute_code` + discovery) **domyślnie** w każdym zadaniu kursowym | **Nie** |
| Udokumentować lekcję i wzorzec „code mode” obok boilerplate | **Tak** |
| Wyodrębnić **opcjonalny** moduł w boilerplate (np. `src/sandbox/` lub osobny export), włączany jawnie przez epizod | **Tak, jeśli pojawi się konkretne zadanie domowe** wymagające wielu kroków MCP w jednym skrypcie |
| Pełny port 1:1 lekcji (własna pętla agenta, `gray-matter`, registry todo) | **Nie** — to osobny demo runtime, nie rozszerzenie `createAgent` |

Uzasadnienie w skrócie: lekcja uczy **innego modelu wywołań narzędzi** (batch w JS w QuickJS) niż boilerplate (jawny ReAct → jedno wywołanie MCP na turę). Wartość edukacyjna jest realna, ale **żadne obecne zadanie w `tasks/`** nie korzysta z tego wzorca; dodanie do core zwiększy złożoność, zależności WASM i koszt utrzymania bez natychmiastowej korzyści dla typowego epizodu (HTTP + hub + pliki).

**Po kontekście S02E05 (materiał kursu):** zadanie domowe epizodu to **`drone`** — **nie** wymaga sandboxa (szczegóły §3). **W oderwieniu od homeworku** wzorzec sandbox/code mode **jest uzasadniony** w określonych klasach problemów (§2); w boilerplate nadal jako **opt-in**, nie domyślny runtime (§2.6, §10).

---

## 2. Zasadność sandboxa — analiza niezależna od homeworku

Ta sekcja odpowiada na pytanie: *czy piaskownica z wykonywaniem kodu (jak w `02_05_sandbox`) ma sens jako element systemu agentowego — bez powiązania z zadaniem `drone`?*

### 2.1 Trzy warstwy pojęcia „sandbox”

W kursie i w kodzie mieszają się trzy znaczenia — warto je rozdzielić:

| Warstwa | Co izoluje | Przykład w repo |
| --- | --- | --- |
| **A. Sandbox plików** | Ścieżki FS | `read_file` (chroot), `01_02_tool_use`, `files-mcp` |
| **B. Sandbox wykonania kodu** | Runtime gościa (JS/TS) | QuickJS (`02_05_sandbox`), Deno (`03_02_code`), Daytona (`04_01_garden`) |
| **C. Lazy discovery narzędzi** | Rozmiar kontekstu LLM | Meta-narzędzia `list_*` + `get_tool_schema` przed `execute_code` |

Lekcja `02_05_sandbox` łączy **B + C**. Boilerplate ma dziś głównie **A** (w `read_file`). Analiza poniżej dotyczy **B+C** — „code mode”.

### 2.2 Jaki problem rozwiązuje code mode?

**Model mentalny ReAct (domyślny boilerplate):** każda akcja = tura LLM → jedno lub kilka `tool_call` → wynik wraca do kontekstu → kolejna tura.

**Model code mode:** LLM generuje **program**, który w izolowanym runtime wywołuje wiele operacji (mosty do MCP), a do kontekstu wraca głównie **stdout / błąd / skrót**.

| Problem | ReAct (bez sandboxa) | Code mode |
| --- | --- | --- |
| **Koszt kontekstu** | Każde wywołanie narzędzia + schemat w historii | Duże dane i pośrednie kroki zostają w zmiennych gościa; LLM widzi log |
| **Wiele kroków MCP** | N tur × (myśl + tool + wynik) = N× latency + tokeny | 1–2 tury LLM (discovery + kod) + wiele wywołań po stronie hosta |
| **Logika sterująca** | Pętle/warunki przez kolejne tury (kruche) | `for`, `if`, `try` w kodzie gościa |
| **Duży zestaw MCP** | Wszystkie schematy narzędzi w każdej turze (lub ręczny subset) | Tylko 4 meta-narzędzia + schematy **ładowane na żądanie** |
| **Łączenie wyników** | Model musi „pamiętać” JSON z poprzednich tur | Kod składa wyniki lokalnie |

**Wniosek:** Code mode jest **uzasadniony architektonicznie** tam, gdzie dominuje **orchestracja wielu wywołań API/MCP** z transformacją danych, a nie pojedyncze zapytanie z jedną odpowiedzią.

### 2.3 Kiedy sandbox (B+C) **ma sens**

Użyj code mode (lub silnego odpowiednika), gdy spełnione są **≥2** z poniższych:

1. **Wolumen wywołań** — typowo >5–10 wywołań narzędzi na jedno zadanie użytkownika (np. CRUD po wielu rekordach, paginacja API).
2. **Wolumen danych** — odpowiedzi narzędzi są duże; do LLM ma trafić agregat, nie surowy JSON (lista 500 elementów).
3. **Powtarzalna procedura** — ten sam schemat kroków (map → filter → update) lepiej jako skrypt niż jako N tur z ryzykiem „zgubienia” kroku.
4. **Eksplozja powierzchni MCP** — wiele serwerów / dziesiątki narzędzi; trzymanie wszystkich schematów w prompcie jest nieekonomiczne.
5. **Kontrolowane ryzyko** — potrzebujesz **więcej** możliwości niż surowe MCP, ale z **ograniczonym** mostem (tylko załadowane narzędzia, timeout, limit pamięci — jak w `sandbox.ts`).

**Przykłady spoza homeworku S02E05** (hipotetyczne, zgodne z kursem):

- Migracja / synchronizacja wielu rekordów między API.
- Batch analiza plików w katalogu (wynik: tabela statystyk, nie N× `read_file` w kontekście).
- Orchestracja wielu hubów / endpointów z jedną finalną odpowiedzią.

### 2.4 Kiedy sandbox **nie ma sensu** (ReAct wystarczy)

1. **Krótki łańcuch** — 1–3 narzędzia, wynik końcowy ma być widoczny krok po kroku (debug, audyt, nauka).
2. **Zadanie „puzzle” oparte na feedbacku** — każda próba zależy od komunikatu błędu z zewnętrznego API; jawna tura ReAct + czytelny log `[AKCJA]`/`[WYNIK]` pomaga modelowi i człowiekowi (to profil wielu zadań kursowych, w tym iteracji na `/verify`).
3. **Vision / interpretacja** — pierwszy krok to multimodalna analiza; sandbox nie zastępuje narzędzia vision.
4. **Edukacja „bez czarnej magii”** — boilerplate celowo pokazuje pętlę ReAct; ukrycie kroków w QuickJS utrudnia zrozumienie *co* agent zrobił.
5. **Koszt implementacji > korzyść** — WASM, mosty sync/asyncify, registry, testy — dla prostych flow to overkill.

**Reguła kciuka:** jeśli da się zadanie rozwiązać w **≤5 turach** ReAct z **≤4 narzędziami** w prompcie — **nie** wprowadzaj code mode.

### 2.5 Code mode vs alternatywy (ten sam problem, inne narzędzie)

| Podejście | Mocne strony | Słabe strony |
| --- | --- | --- |
| **ReAct + bezpośrednie MCP** (boilerplate) | Prostość, logi, zgodność z kursem | Kontekst i latency rosną z liczbą kroków |
| **ReAct + OM + planning** (boilerplate opt-in) | Długie sesje, plan przed akcją | Nie zastępuje batchowania wywołań |
| **QuickJS in-process** (`02_05_sandbox`) | Lekki start, brak Deno; sync bridge do MCP | Ograniczony JS; niuanse asyncify |
| **Deno subprocess** (`03_02_code`) | Prawdziwy TS, uprawnienia Deno | Zewnętrzna zależność, cięższy runtime |
| **Zdalny VM** (`04_01_garden`) | Pełne repo, git, terminal | Koszt, infrastruktura |
| **Kod po stronie zadania (TS)** | Pełna kontrola, zero WASM w boilerplate | Agent nie generuje orchestracji — to skrypt, nie agent |

**Wniosek:** Code mode nie jest „lepszy” od ReAct — to **druga biegłość** dla innej klasy złożoności. W monorepo kursu **trzy** implementacje sandboxa (QuickJS, Deno, Daytona) pokazują, że **nie ma jednego uniwersalnego** — wybór zależy od środowiska i ryzyka.

### 2.6 Zasadność w kontekście `tasks/boilerplate` (bez homeworku)

| Pytanie | Odpowiedź |
| --- | --- |
| Czy wzorzec jest **merytorycznie słuszny**? | **Tak** — to uznany kierunek (tool search + code execution / MCP code mode). |
| Czy **musi** być w domyślnym boilerplate? | **Nie** — misja pakietu to jawny ReAct + MCP kursowe; code mode to warstwa zaawansowana. |
| Czy **warto** mieć w repo współdzielony moduł? | **Umiarkowanie tak** — jeśli planujecie zadania z batch MCP lub studenci mają replikować lekcję w `tasks/`; inaczej wystarczy `lessons/02_05_sandbox`. |
| QuickJS vs Deno w boilerplate? | **Nie scalać obu** w jednym pakiecie bez decyzji; lekcje już rozdzielają przypadki użycia. |

**Werdykt ogólny (niezależny od `drone`):**

```text
Sandbox/code mode: ZASADNY jako wzorzec i jako moduł opt-in w boilerplate.
                   NIEZASADNY jako domyślny tryb wszystkich zadań AI Devs 4.
```

### 2.7 Macierz decyzyjna (skrót)

|  | Niski koszt kontekstu / mało kroków | Wysoki koszt / wiele kroków |
| --- | --- | --- |
| **Prosta logika** | ReAct | ReAct (+ ewentualnie planning) |
| **Złożona orchestracja danych** | ReAct (możliwe, ale drogie) | **Code mode + sandbox** |
| **Wiele serwerów MCP** | Ręczny subset narzędzi w prompcie | **Lazy discovery + code mode** |

### 2.8 Ryzyka sandboxa (też niezależne od homeworku)

- **Debugowanie:** błąd w wygenerowanym kodzie vs błąd w `tool_call` — trudniejsza diagnostyka dla początkujących.
- **Bezpieczeństwo iluzoryczne:** QuickJS izoluje JS, ale mosty wołają **prawdziwe** MCP (HTTP, hub) — zły skrypt = realne skutki uboczne.
- **Halucynacje API:** model może użyć nieistniejącej metody w kodzie gościa (jak złe `tool_call` w ReAct).
- **Koszt LLM nie znika:** nadal potrzebna tura na discovery i generację kodu; oszczędność jest na **turach pośrednich**, nie na zerowym LLM.
- **Utrzymanie:** osobny kontrakt (loaded tools, sync bridge) obok MCP + Zod w boilerplate.

---

## 3. Kontekst epizodu S02E05 (materiał kursu) — homework

Źródło: `markdowns/s02e05-projektowanie-agentow-1773962356.md` (publikacja lekcji 2026-03-20).

### 3.1 Dwa filary techniczne epizodu

| Temat w lekcji | Przykład w repo | Stan w boilerplate |
| --- | --- | --- |
| **Projektowanie instrukcji** (identity, protocol, tools, OM w promptcie) | `02_05_agent`, bonus `02_04_agent` | Częściowo: `prompts/system.md`, opt-in OM, opt-in planning |
| **Sandbox / code mode** (dynamic discovery + `execute_code`) | `02_05_sandbox` | **Brak** |

Lekcja explicite łączy **Observational Memory** z S02E03 (sekcja WORKSPACE w promptcie orchestratora). To potwierdza wcześniejszą decyzję: **OM w boilerplate = zgodne z kursem**; sandbox = **osobny wzorzec**, nie ten sam priorytet co OM.

### 3.2 Co kurs mówi o `02_05_sandbox`

- Motywacja: zbyt sztywne ograniczenia narzędzi obniżają użyteczność → systemy w **sandboxach** z balansem ryzyka.
- Agent startuje tylko z: `list_servers`, `list_tools`, `get_tool_schema`, `execute_code` — reszta MCP **nie zajmuje kontekstu** do momentu discovery.
- Flow demo: brak narzędzia do listy zakupów → discovery MCP todo → **kod w piaskownicy** (w tekście lekcji: TypeScript; implementacja lekcji: JavaScript w QuickJS).
- Korzyści (kurs): łączenie narzędzi, duże dane jako zmienne w kodzie (nie w kontekście LLM).
- Koszty (kurs): **nowa złożoność architektury i kosztów** — sandbox nie rozwiązuje wszystkiego.

### 3.3 Zadanie domowe: `drone` (nie sandbox)

| Aspekt | Wymaganie |
| --- | --- |
| **Task name** | `drone` |
| **Hub** | `POST /verify` z `{ task: "drone", answer: { instructions: [...] } }` |
| **Dane** | HTML API `https://hub.ag3nts.org/dane/drone.html`, mapa PNG z kluczem API |
| **Kluczowe kroki** | Vision na mapę (siatka, sektor tamy) → czytanie pułapkowej dokumentacji API → iteracyjne korekty po błędach hub |
| **Wskazówki kursu** | Dwuetapowo: vision, potem tekst; oszczędzać tokeny; podejście reaktywne; `hardReset` przy chaosie w konfiguracji |

**Mapowanie na boilerplate (bez sandboxa):**

```text
analyze_image_vision (mapa) → http_request (dokumentacja HTML) → ReAct + submit_to_hub
```

Pułapki w dokumentacji drona i feedback z `/verify` naturalnie pasują do **jawnej pętli ReAct** i logów `[WYNIK]` — nie do ukrytej orchestracji w QuickJS.

### 3.4 Wniosek z materiału kursu

1. **Homework S02E05 nie uzasadnia** portu QuickJS do boilerplate.
2. **Sandbox w boilerplate** ma sens tylko jako **materiał uzupełniający** (Opcja A) lub **moduł opt-in** (Opcja B) dla studentów eksperymentujących z lekcją — nie jako wymóg epizodu `drone`.
3. Kurs sam ostrzega przed kosztem sandboxów — spójne z **nie** włączaniem ich domyślnie w runtime zadań.

---

## 4. Co robi lekcja `02_05_sandbox`

### 4.1 Cel pedagogiczny

Pokazać **code mode**: zamiast wielu tur LLM × pojedyncze `tool_call`, model:

1. Odkrywa serwery MCP (`list_servers`, `list_tools`).
2. Ładuje sygnaturę TypeScript narzędzia (`get_tool_schema`) — **lazy load** do sesji.
3. Pisze **JavaScript** wykonywany w **QuickJS (WASM, asyncify)** z synchronicznymi mostami do implementacji MCP (`execute_code`).

### 4.2 Kluczowe komponenty

| Plik / moduł | Rola |
| --- | --- |
| `src/sandbox.ts` | QuickJS runtime: `console`, timeout, memory limit, `buildGuestCode`, asyncified host functions `__call_{server}_{tool}` |
| `src/mcp-registry.ts` | Statyczny rejestr serwera `todo` + TS signatures + `loadedTools` Map |
| `src/tools.ts` | 4 meta-narzędzia LLM (nie MCP): discovery + `execute_code` |
| `src/mcp-client.ts` | Stdio MCP do `servers/todo.ts` |
| `src/agent.ts` | **Osobna** pętla: OpenAI **Chat Completions**, `MAX_TURNS=15`, szablony z `workspace/agents/*.agent.md` |
| `package.json` | Zależności: `quickjs-emscripten-core`, `@jitl/quickjs-wasmfile-release-asyncify` |

### 4.3 Przepływ demo

```text
index.ts → connect MCP todo (stdio) → runAgent('sandbox', task)
  → LLM może: list_servers → list_tools → get_tool_schema → execute_code(JS)
  → execute_code → QuickJS z API todo.create/list/...
```

### 4.4 Uwagi techniczne (ważne przy porcie)

- Mosty narzędzi muszą być **synchroniczne z perspektywy QuickJS** (komentarze w `sandbox.ts` — `async` w gościu psuje flush microtasków).
- `getLoadedImplementations()` eksponuje tylko narzędzia wcześniej załadowane przez `get_tool_schema`.
- README wskazuje `workspace/agents/sandbox.agent.md` — **plik nie występuje w repozytorium** (tylko wzmianka); demo może wymagać materiałów poza repo lub lokalnego `workspace/`.

---

## 5. Stan `tasks/boilerplate` (baseline)

### 5.1 Model wywołań narzędzi

- **`createAgent`** + **OpenAI Responses API** (`ai.ts`).
- Narzędzia MCP: **bezpośrednio** w handlerach — `callMcpTool(mcpClient, name, args)` po każdym `tool_call` z modelu.
- Domyślne MCP: `http_request`, `submit_to_hub`, `read_file`, `analyze_image_vision`.
- Natywne: `finish_task`, `ask_human`.
- **Brak** `execute_code`, `list_servers`, lazy schema load.

### 5.2 „Sandbox” w boilerplate dziś

- `read_file` — **sandboxing ścieżek** (chroot względem katalogu zadania), **nie** wykonanie kodu.
- Inne znaczenie niż w lekcji 02_05.

### 5.3 Powiązanie z tym samym modułem kursu (S02E05)

| Lekcja | W boilerplate |
| --- | --- |
| `02_05_agent` (Observer/Reflector) | **Wdrożone** — `observational_memory/`, opt-in przez `createObservationalMemoryHooks()` |
| `02_05_sandbox` (code mode) | **Brak** |

OM był explicite w spec (`boilerplate-documentation.md` §4.3, KROK 6). **Code mode nie jest** w spec boilerplate ani w żadnym `tasks/sXXeYY`.

### 5.4 Zależności

Boilerplate: `@modelcontextprotocol/sdk`, `zod` tylko.  
Lekcja sandbox: +2 pakiety QuickJS WASM (~rozmiar i czas cold start).

---

## 6. Porównanie z innymi lekcjami „sandbox”

| Lekcja | Mechanizm | Kiedy sensowny |
| --- | --- | --- |
| `02_05_sandbox` | QuickJS in-process, sync bridge do MCP | Wiele wywołań MCP w jednym skrypcie JS, bez Deno |
| `03_02_code` | Deno subprocess + HTTP bridge | TypeScript, uprawnienia Deno, cięższe skrypty |
| `04_01_garden` | Daytona (zdalny VM) | Pełne repo, git, terminal |
| `01_02_tool_use` | Sandbox FS w narzędziach | Izolacja plików, nie code mode |

**Wniosek:** Kurs świadomie pokazuje **wiele strategii izolacji**. Boilerplate nie musi scalać wszystkich — już skonsolidował wzorzec najczęstszy dla zadań domowych (ReAct + MCP in-process + OM).

---

## 7. Mapowanie lekcja → boilerplate

| Element lekcji | Zgodność z architekturą boilerplate | Uwagi |
| --- | --- | --- |
| `executeCode` + QuickJS | Możliwy **moduł utility** | Niezależny od Responses API |
| Meta-tools (`list_*`, `get_tool_schema`) | Wymaga **nowego kontraktu** agenta | Albo native tools, albo osobny MCP server „meta” |
| `mcp-registry` (hardcoded todo) | **Nie** przenosić 1:1 | Epizody rejestrują własne MCP przez `registerTool` |
| Osobny `runAgent` + Chat Completions | **Konflikt** | Duplikacja względem `createAgent` / `ai.ts` |
| Stdio MCP todo server | Poza scope boilerplate | Demo lekcji; zadania mają własne serwery |
| Agent templates (`gray-matter`) | Osobny wzorzec | Boilerplate: `src/prompts/*.md` + `instructions` |

---

## 8. Korzyści i koszty dodania do boilerplate

### 8.1 Korzyści (gdy opt-in)

1. **Mniej tur LLM** przy złożonej orchestracji (N wywołań MCP w jednym `execute_code`).
2. **Spójność materiału S02E05** — OM już w pakiecie; code mode jako drugi filar tej lekcji.
3. **Reuse kodu** — `sandbox.ts` jest samodzielny (~220 LOC), testowalny jednostkowo.
4. **Wzorzec na przyszłe epizody** z wieloma krokami API (np. wieloetapowe CRUD bez pisania pętli w TS zadania).

### 8.2 Koszty i ryzyka

| Ryzyko | Opis | Siła |
| --- | --- | --- |
| **Zmiana modelu mentalnego** | Studenci debugują ReAct w logach `[AKCJA]`; code mode ukrywa kroki w QuickJS | Wysoka dla domyślnego flow |
| **Nowe zależności WASM** | Rozmiar `node_modules`, CI, Bun compatibility | Średnia |
| **Bezpieczeństwo** | QuickJS izoluje JS, ale mosty wołają **prawdziwe** MCP — błędny kod może spamować API / hub | Średnia–wysoka |
| **Registry vs dynamic MCP** | Boilerplate ma dynamiczne `listMcpTools`; lekcja ma ręczne TS signatures | Wysoka przy „pełnym” porcie |
| **Duplikacja z `03_02_code`** | Dwa sposoby uruchamiania kodu w kursie | Średnia |
| **Brak demand w `tasks/`** | Grep: zero `execute_code` / code mode w zadaniach | Wysoka **dziś** |
| **Utrzymanie** | Asyncify, limity pamięci, edge cases microtasków | Średnia |
| **Reguła repo** | Nowe zależności wymagają zgody tech lead (eversis-agent-core) | Procesowa |

### 8.3 Zadania, które zyskają / nie zyskają

| Typ zadania | Zysk z code mode |
| --- | --- |
| **S02E05 homework `drone`** | **Brak** — vision + HTTP + iteracja na hub (patrz §3.3) |
| Pojedyncze `http_request` + `submit_to_hub` | Brak — szum |
| s02e04 mailbox (wiele tur, pamięć) | Niski — już OM + jawne MCP |
| Hipotetyczne: 20+ wywołań MCP z transformacją danych | Wysoki |
| Zadania wymagające Deno/TS w sandboxie | Lepiej lekcja `03_02_code`, nie QuickJS |

---

## 9. Opcje implementacyjne (do planu — nie wybór w research)

### Opcja A — Tylko dokumentacja (minimalna)

- Sekcja w `tasks/boilerplate/README.md` + link do `lessons/02_05_sandbox`.
- **Koszt:** ~0 LOC w runtime.
- **Kiedy:** homework = `drone` bez code mode; wzorzec ogólny — §2; lekcja w `lessons/02_05_sandbox`.

### Opcja B — Moduł opt-in w boilerplate (rekomendowana, jeśli implementować)

```text
tasks/boilerplate/src/sandbox/
  quickjs.ts          # port executeCode + buildGuestCode
  code_mode_tools.ts  # fabryka meta-tools + bridge z Record<implementations>
```

- Export np. `createCodeModeHandlers(registry: CodeModeRegistry)` — epizod buduje registry z **własnych** MCP.
- **Nie** podmienia domyślnego `createBoilerplateMcpServer()`.
- Włączenie w zadaniu: jawne dodanie 4 handlerów obok istniejących MCP.
- Testy: unit na `executeCode` z mock fn (bez WASM w CI — opcjonalnie oznaczyć test integracyjny).

### Opcja C — Pełna integracja domyślna

- Każde zadanie dostaje `list_servers` + `execute_code`.
- **Odradzane:** sprzeczne z celem „czytelny ReAct bez czarnej magii” (`boilerplate-documentation.md` §1).

### Opcja D — Osobny pakiet npm w monorepo

- `@ai-devs/agent-code-mode` zależny od boilerplate.
- **Kiedy:** jeśli WASM ma nie trafiać do studentów instalujących samo boilerplate.

---

## 10. Rekomendacja produktowa

1. **Nie dodawać** sandboxa QuickJS do **domyślnego** zestawu narzędzi boilerplate (jak `http_request`).
2. **Dla S02E05 (`drone`):** zostać przy domyślnym boilerplate; ewentualnie krótka sekcja w README epizodu / boilerplate: „sandbox = lekcja `02_05_sandbox`, homework = ReAct + vision”.
3. **Opcja A (dokumentacja)** — **domyślna rekomendacja** po analizie materiału kursu, dopóki nie ma innego zadania wymagającego code mode.
4. **Opcja B (moduł opt-in)** — tylko przy świadomym requestcie (eksperyment, przyszły epizod z wieloma MCP w jednym skrypcie).
5. **Priorytet niższy niż OM** — OM jest w spec, w lekcji i w homework flow długich sesji; sandbox jest przykładem z ostrzeżeniem o kosztach.
6. **Nie portować** `agent.ts` z lekcji — rozszerzać `createAgent` + istniejące handlery.
7. **Uzupełnić materiał lekcji** — brakujący `workspace/agents/sandbox.agent.md` (osobny ticket / sync z upstream kursu).

---

## 11. Acceptance criteria — decyzja (2026-05-30)

- [x] **A** — tylko dokumentacja, bez kodu w boilerplate  
- [ ] **B** — moduł opt-in + testy jednostkowe + przykład w README  
- [ ] **C** — pełna integracja domyślna (wymaga silnego uzasadnienia biznesowego)  
- [ ] **D** — osobny pakiet *(preferencja na przyszłość, jeśli kiedyś B — nie wdrażane teraz)*  
- [ ] **Odłożyć** — brak zadań kursowych wymagających code mode w najbliższym sprincie  

**Follow-up poza boilerplate:** osobny PR z `sandbox.agent.md` w `lessons/02_05_sandbox` (zgoda człowieka).

Jeśli kiedyś **B**: plan powinien obejmować:

- API registry (jak mapować `registerTool` MCP → implementacje w QuickJS).
- Czy meta-tools są native czy MCP.
- Polityka zależności (`quickjs-emscripten-core` w `dependencies` vs `optionalDependencies`).
- Zakres testów i wpis w `CHANGELOG.md`.

---

## 12. Open questions — rozstrzygnięte (2026-05-30)

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Czy homework S02E05 wymaga sandboxa? | **Nie** (`drone` — §3.3). Brak innego zadania z code mode w najbliższym sprincie. |
| 2 | Scaffold `s02e05` vs moduł opt-in | **Kontekst całego kursu** — domyślnie ReAct; sandbox tylko w lekcji / doc. |
| 3 | QuickJS vs Deno w boilerplate | **N/A przy Opcji A.** Przy ewentualnym B: rekomendacja research = QuickJS w osobnym pakiecie; Deno pozostaje w lekcji `03_02_code`. |
| 4 | WASM w core vs osobny pakiet | **Opcja D** na przyszłość (WASM poza `@ai-devs/agent-boilerplate`). |
| 5 | `sandbox.agent.md` | **Tak** — osobny PR do lekcji (poza tym ticketem). |

---

## 13. Next steps (po akceptacji)

1. ~~Wybór ścieżki §11~~ → **A** (dokumentacja w README boilerplate).
2. **Plan:** [sandbox-code-execution.plan.md](sandbox-code-execution.plan.md) — Opcja A (docs + PR lekcji `sandbox.agent.md`).
3. **Osobny PR:** `lessons/02_05_sandbox/workspace/agents/sandbox.agent.md` (faza E planu).
4. **Przyszły code mode:** nowy research/plan tylko gdy pojawi się zadanie w `tasks/` wymagające batch MCP (§2.3); wtedy pakiet `@ai-devs/agent-code-mode` (D) + QuickJS, nie Deno w boilerplate.

---

## 14. Referencje kodu

Lekcja — most QuickJS → MCP:

```84:98:lessons/02_05_sandbox/src/sandbox.ts
    // Expose tool implementations as async host functions
    for (const [serverName, tools] of Object.entries(toolImplementations)) {
      for (const [toolName, fn] of Object.entries(tools)) {
        const hostFnName = `__call_${serverName}_${toolName}`;
        const hostFn = context.newAsyncifiedFunction(hostFnName, async (inputHandle) => {
          const input = inputHandle ? context.dump(inputHandle) : {};
          const result = await fn(input);
          return context.newString(JSON.stringify(result));
        });
        // ...
      }
    }
```

Boilerplate — dispatch pojedynczego tool call (bez sandboxa):

```101:119:tasks/boilerplate/src/agent/agent.ts
async function dispatchToolCall(
  call: ToolCall,
  handlers: Record<string, ToolHandler | undefined>,
  maxChars: number,
): Promise<{ type: "function_call_output"; call_id: string; output: string }> {
  const args = JSON.parse(call.arguments) as Record<string, unknown>;
  const handler = handlers[call.name];
  // ...
  logAction(handler.label, call.name, args);
```
