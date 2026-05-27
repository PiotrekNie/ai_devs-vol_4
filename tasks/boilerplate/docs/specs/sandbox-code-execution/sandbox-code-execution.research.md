# Sandbox (QuickJS + code mode) — research

**Task:** Zweryfikować zasadność przeniesienia funkcjonalności z `lessons/02_05_sandbox` do `tasks/boilerplate` (`@ai-devs/agent-boilerplate`).

**Data:** 2026-05-27  
**Status:** Research — **oczekuje na akceptację człowieka** przed planem / implementacją.

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

**Po kontekście S02E05 (materiał kursu):** zadanie domowe epizodu to **`drone`** (API drona + mapa + hub `/verify`) — **nie** wymaga `execute_code` ani piaskownicy QuickJS. Sandbox w epizodzie jest **przykładem architektury**, nie deliverable’em homeworku. Dla `tasks/s02e05` (gdy powstanie) wystarczy domyślny boilerplate: ReAct, `http_request`, `submit_to_hub`, `analyze_image_vision`, ewentualnie OM i faza planowania.

---

## 2. Kontekst epizodu S02E05 (materiał kursu)

Źródło: `markdowns/s02e05-projektowanie-agentow-1773962356.md` (publikacja lekcji 2026-03-20).

### 2.1 Dwa filary techniczne epizodu

| Temat w lekcji | Przykład w repo | Stan w boilerplate |
| --- | --- | --- |
| **Projektowanie instrukcji** (identity, protocol, tools, OM w promptcie) | `02_05_agent`, bonus `02_04_agent` | Częściowo: `prompts/system.md`, opt-in OM, opt-in planning |
| **Sandbox / code mode** (dynamic discovery + `execute_code`) | `02_05_sandbox` | **Brak** |

Lekcja explicite łączy **Observational Memory** z S02E03 (sekcja WORKSPACE w promptcie orchestratora). To potwierdza wcześniejszą decyzję: **OM w boilerplate = zgodne z kursem**; sandbox = **osobny wzorzec**, nie ten sam priorytet co OM.

### 2.2 Co kurs mówi o `02_05_sandbox`

- Motywacja: zbyt sztywne ograniczenia narzędzi obniżają użyteczność → systemy w **sandboxach** z balansem ryzyka.
- Agent startuje tylko z: `list_servers`, `list_tools`, `get_tool_schema`, `execute_code` — reszta MCP **nie zajmuje kontekstu** do momentu discovery.
- Flow demo: brak narzędzia do listy zakupów → discovery MCP todo → **kod w piaskownicy** (w tekście lekcji: TypeScript; implementacja lekcji: JavaScript w QuickJS).
- Korzyści (kurs): łączenie narzędzi, duże dane jako zmienne w kodzie (nie w kontekście LLM).
- Koszty (kurs): **nowa złożoność architektury i kosztów** — sandbox nie rozwiązuje wszystkiego.

### 2.3 Zadanie domowe: `drone` (nie sandbox)

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

### 2.4 Wniosek z materiału kursu

1. **Homework S02E05 nie uzasadnia** portu QuickJS do boilerplate.
2. **Sandbox w boilerplate** ma sens tylko jako **materiał uzupełniający** (Opcja A) lub **moduł opt-in** (Opcja B) dla studentów eksperymentujących z lekcją — nie jako wymóg epizodu `drone`.
3. Kurs sam ostrzega przed kosztem sandboxów — spójne z **nie** włączaniem ich domyślnie w runtime zadań.

---

## 3. Co robi lekcja `02_05_sandbox`

### 3.1 Cel pedagogiczny

Pokazać **code mode**: zamiast wielu tur LLM × pojedyncze `tool_call`, model:

1. Odkrywa serwery MCP (`list_servers`, `list_tools`).
2. Ładuje sygnaturę TypeScript narzędzia (`get_tool_schema`) — **lazy load** do sesji.
3. Pisze **JavaScript** wykonywany w **QuickJS (WASM, asyncify)** z synchronicznymi mostami do implementacji MCP (`execute_code`).

### 3.2 Kluczowe komponenty

| Plik / moduł | Rola |
| --- | --- |
| `src/sandbox.ts` | QuickJS runtime: `console`, timeout, memory limit, `buildGuestCode`, asyncified host functions `__call_{server}_{tool}` |
| `src/mcp-registry.ts` | Statyczny rejestr serwera `todo` + TS signatures + `loadedTools` Map |
| `src/tools.ts` | 4 meta-narzędzia LLM (nie MCP): discovery + `execute_code` |
| `src/mcp-client.ts` | Stdio MCP do `servers/todo.ts` |
| `src/agent.ts` | **Osobna** pętla: OpenAI **Chat Completions**, `MAX_TURNS=15`, szablony z `workspace/agents/*.agent.md` |
| `package.json` | Zależności: `quickjs-emscripten-core`, `@jitl/quickjs-wasmfile-release-asyncify` |

### 3.3 Przepływ demo

```text
index.ts → connect MCP todo (stdio) → runAgent('sandbox', task)
  → LLM może: list_servers → list_tools → get_tool_schema → execute_code(JS)
  → execute_code → QuickJS z API todo.create/list/...
```

### 3.4 Uwagi techniczne (ważne przy porcie)

- Mosty narzędzi muszą być **synchroniczne z perspektywy QuickJS** (komentarze w `sandbox.ts` — `async` w gościu psuje flush microtasków).
- `getLoadedImplementations()` eksponuje tylko narzędzia wcześniej załadowane przez `get_tool_schema`.
- README wskazuje `workspace/agents/sandbox.agent.md` — **plik nie występuje w repozytorium** (tylko wzmianka); demo może wymagać materiałów poza repo lub lokalnego `workspace/`.

---

## 4. Stan `tasks/boilerplate` (baseline)

### 4.1 Model wywołań narzędzi

- **`createAgent`** + **OpenAI Responses API** (`ai.ts`).
- Narzędzia MCP: **bezpośrednio** w handlerach — `callMcpTool(mcpClient, name, args)` po każdym `tool_call` z modelu.
- Domyślne MCP: `http_request`, `submit_to_hub`, `read_file`, `analyze_image_vision`.
- Natywne: `finish_task`, `ask_human`.
- **Brak** `execute_code`, `list_servers`, lazy schema load.

### 4.2 „Sandbox” w boilerplate dziś

- `read_file` — **sandboxing ścieżek** (chroot względem katalogu zadania), **nie** wykonanie kodu.
- Inne znaczenie niż w lekcji 02_05.

### 4.3 Powiązanie z tym samym modułem kursu (S02E05)

| Lekcja | W boilerplate |
| --- | --- |
| `02_05_agent` (Observer/Reflector) | **Wdrożone** — `observational_memory/`, opt-in przez `createObservationalMemoryHooks()` |
| `02_05_sandbox` (code mode) | **Brak** |

OM był explicite w spec (`boilerplate-documentation.md` §4.3, KROK 6). **Code mode nie jest** w spec boilerplate ani w żadnym `tasks/sXXeYY`.

### 4.4 Zależności

Boilerplate: `@modelcontextprotocol/sdk`, `zod` tylko.  
Lekcja sandbox: +2 pakiety QuickJS WASM (~rozmiar i czas cold start).

---

## 5. Porównanie z innymi lekcjami „sandbox”

| Lekcja | Mechanizm | Kiedy sensowny |
| --- | --- | --- |
| `02_05_sandbox` | QuickJS in-process, sync bridge do MCP | Wiele wywołań MCP w jednym skrypcie JS, bez Deno |
| `03_02_code` | Deno subprocess + HTTP bridge | TypeScript, uprawnienia Deno, cięższe skrypty |
| `04_01_garden` | Daytona (zdalny VM) | Pełne repo, git, terminal |
| `01_02_tool_use` | Sandbox FS w narzędziach | Izolacja plików, nie code mode |

**Wniosek:** Kurs świadomie pokazuje **wiele strategii izolacji**. Boilerplate nie musi scalać wszystkich — już skonsolidował wzorzec najczęstszy dla zadań domowych (ReAct + MCP in-process + OM).

---

## 6. Mapowanie lekcja → boilerplate

| Element lekcji | Zgodność z architekturą boilerplate | Uwagi |
| --- | --- | --- |
| `executeCode` + QuickJS | Możliwy **moduł utility** | Niezależny od Responses API |
| Meta-tools (`list_*`, `get_tool_schema`) | Wymaga **nowego kontraktu** agenta | Albo native tools, albo osobny MCP server „meta” |
| `mcp-registry` (hardcoded todo) | **Nie** przenosić 1:1 | Epizody rejestrują własne MCP przez `registerTool` |
| Osobny `runAgent` + Chat Completions | **Konflikt** | Duplikacja względem `createAgent` / `ai.ts` |
| Stdio MCP todo server | Poza scope boilerplate | Demo lekcji; zadania mają własne serwery |
| Agent templates (`gray-matter`) | Osobny wzorzec | Boilerplate: `src/prompts/*.md` + `instructions` |

---

## 7. Korzyści i koszty dodania do boilerplate

### 7.1 Korzyści (gdy opt-in)

1. **Mniej tur LLM** przy złożonej orchestracji (N wywołań MCP w jednym `execute_code`).
2. **Spójność materiału S02E05** — OM już w pakiecie; code mode jako drugi filar tej lekcji.
3. **Reuse kodu** — `sandbox.ts` jest samodzielny (~220 LOC), testowalny jednostkowo.
4. **Wzorzec na przyszłe epizody** z wieloma krokami API (np. wieloetapowe CRUD bez pisania pętli w TS zadania).

### 7.2 Koszty i ryzyka

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

### 7.3 Zadania, które zyskają / nie zyskają

| Typ zadania | Zysk z code mode |
| --- | --- |
| **S02E05 homework `drone`** | **Brak** — vision + HTTP + iteracja na hub (patrz §2.3) |
| Pojedyncze `http_request` + `submit_to_hub` | Brak — szum |
| s02e04 mailbox (wiele tur, pamięć) | Niski — już OM + jawne MCP |
| Hipotetyczne: 20+ wywołań MCP z transformacją danych | Wysoki |
| Zadania wymagające Deno/TS w sandboxie | Lepiej lekcja `03_02_code`, nie QuickJS |

---

## 8. Opcje implementacyjne (do planu — nie wybór w research)

### Opcja A — Tylko dokumentacja (minimalna)

- Sekcja w `tasks/boilerplate/README.md` + link do `lessons/02_05_sandbox`.
- **Koszt:** ~0 LOC w runtime.
- **Kiedy:** S02E05 homework = `drone` bez code mode; lekcja sandbox pozostaje w `lessons/02_05_sandbox` (stan zalecany po §2).

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

## 9. Rekomendacja produktowa

1. **Nie dodawać** sandboxa QuickJS do **domyślnego** zestawu narzędzi boilerplate (jak `http_request`).
2. **Dla S02E05 (`drone`):** zostać przy domyślnym boilerplate; ewentualnie krótka sekcja w README epizodu / boilerplate: „sandbox = lekcja `02_05_sandbox`, homework = ReAct + vision”.
3. **Opcja A (dokumentacja)** — **domyślna rekomendacja** po analizie materiału kursu, dopóki nie ma innego zadania wymagającego code mode.
4. **Opcja B (moduł opt-in)** — tylko przy świadomym requestcie (eksperyment, przyszły epizod z wieloma MCP w jednym skrypcie).
5. **Priorytet niższy niż OM** — OM jest w spec, w lekcji i w homework flow długich sesji; sandbox jest przykładem z ostrzeżeniem o kosztach.
6. **Nie portować** `agent.ts` z lekcji — rozszerzać `createAgent` + istniejące handlery.
7. **Uzupełnić materiał lekcji** — brakujący `workspace/agents/sandbox.agent.md` (osobny ticket / sync z upstream kursu).

---

## 10. Acceptance criteria (dla fazy planu, jeśli zaakceptowane)

Research uznaje się za zamknięte, gdy człowiek wybierze jedną ścieżkę:

- [ ] **A** — tylko dokumentacja, bez kodu w boilerplate  
- [ ] **B** — moduł opt-in + testy jednostkowe + przykład w README  
- [ ] **C** — pełna integracja domyślna (wymaga silnego uzasadnienia biznesowego)  
- [ ] **D** — osobny pakiet  
- [ ] **Odłożyć** — brak zadań kursowych wymagających code mode w najbliższym sprincie  

Jeśli **B**: plan powinien obejmować:

- API registry (jak mapować `registerTool` MCP → implementacje w QuickJS).
- Czy meta-tools są native czy MCP.
- Polityka zależności (`quickjs-emscripten-core` w `dependencies` vs `optionalDependencies`).
- Zakres testów i wpis w `CHANGELOG.md`.

---

## 11. Open questions (do człowieka)

1. ~~Czy homework S02E05 wymaga sandboxa?~~ → **Nie** (`drone` — §2.3). Czy planujesz **inne** zadanie w `tasks/` z code mode?
2. Czy dla `tasks/s02e05` wolisz **tylko** scaffold pod `drone` (bez sandboxa), czy równolegle moduł opt-in z lekcji?
3. Czy preferowany runtime kodu gościa to **QuickJS (lekcja)** czy **Deno (`03_02_code`)** — unikamy dwóch oficjalnych ścieżek w boilerplate bez decyzji.
4. Czy zależności WASM są **akceptowalne** w `@ai-devs/agent-boilerplate`, czy wolisz Opcję D (osobny pakiet)?
5. Czy uzupełnić brakujący `sandbox.agent.md` w submodule lekcji / osobnym PR?

---

## 12. Suggested next steps

1. **Ty:** wybierz ścieżkę z §10 — po materiale S02E05 naturalna domyślna to **A** (dokumentacja) lub **odłożyć** implementację sandboxa; osobno możesz zlecić scaffold **`tasks/s02e05`** pod `drone`.
2. **Po akceptacji research:** `@eversis-implement` → faza **Plan** tylko jeśli wybierzesz B/C/D.
3. **Implementacja** tylko po akceptacji planu; nowe pakiety — zgodnie z regułami repo, po zgodzie tech lead.

---

## 13. Referencje kodu

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
