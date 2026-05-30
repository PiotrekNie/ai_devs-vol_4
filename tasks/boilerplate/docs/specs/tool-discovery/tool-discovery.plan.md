# Plan wdrożenia — Tool discovery (Wariant M, boilerplate)

**Normatywny research:** [tool-discovery.research.md](tool-discovery.research.md) — **zaakceptowany** (ścieżka **M**: meta-narzędzia ReAct + dynamiczny zestaw `tools` w API).  
**Workspace:** `tasks/boilerplate/` (`@ai-devs/agent-boilerplate`)  
**Inspiracja:** `lessons/02_05_sandbox/` (bez QuickJS / `execute_code`).

Ten dokument jest planem wdrożenia zgodnym z `@eversis-implement`: typy zadań `[CREATE]` / `[MODIFY]` / `[REUSE]`. **Implementacja kodu** następuje po akceptacji tego planu przez człowieka.

**Weryfikacja UI:** brak — zmiana dotyczy runtime agenta, narzędzi natywnych i logów terminalowych.

**Poza zakresem tego planu:**

- QuickJS / `execute_code` (osobny track: [sandbox-code-execution](../sandbox-code-execution/sandbox-code-execution.research.md)).
- Włączenie discovery **domyślnie** dla wszystkich epizodów (opt-in przez `toolDiscovery.enabled`).
- `list_servers` (boilerplate = jeden in-process `McpServer`; wystarczy `list_tools`).
- Pilot na `tasks/s02e04` / `tasks/s02e05` (osobny PR po stabilizacji API).
- Automatyczne włączanie discovery gdy `tools.length > 8` (tylko jawna flaga w tym planie).

---

## 1. Zakres (scope)

**W zakresie (boilerplate):**

| Element | Opis |
| --- | --- |
| **Moduł** | `src/agent/tool_discovery/` — katalog narzędzi, stan aktywacji, filtr API, factory meta-handlerów. |
| **Meta-narzędzia (native)** | `list_tools`, `describe_tool`, `activate_tools` — definicje OpenAI + handlery. |
| **Integracja `createAgent`** | Opt-in `toolDiscovery?: ToolDiscoveryOptions`; `runLoop` przekazuje **przefiltrowane** `tools` do `generateResponse`. |
| **Core tools** | Zawsze aktywne na starcie (domyślnie: `http_request`, `submit_to_hub`, `finish_task`) + meta + ewentualne `coreToolNames` z epizodu. |
| **Handlery MCP** | Bez zmian — pełna mapa `handlers`; ograniczenie tylko na **widoczność** w API. |
| **Planning turn 0** | Uzupełnienie instrukcji discovery (gdy włączone); turn 0 nadal `tools: []`. |
| **Prompt systemowy** | Krótki fragment w `src/prompts/system.md` (sekcja opcjonalna / marker dla epizodów z discovery). |
| **Logi** | `[AKCJA]` na meta-narzędziach z `NATIVE_LABEL`; opcjonalny `[SYSTEM]` po `activate_tools` (lista aktywnych). |
| **Testy** | Unit: filtr, activate, describe, list; integracja: mock `generateResponse` dostaje mniejszą listę `tools` po starcie, większą po activate. |
| **Dokumentacja** | README, CHANGELOG, `tasks/docs/boilerplate-documentation.md`, przykład w README. |

---

## 2. Decyzje projektowe (zatwierdzone — ścieżka M)

| # | Decyzja |
| --- | --- |
| 1 | **Opt-in** — `createAgent({ toolDiscovery: { enabled: true, ... } })`; bez flagi zachowanie **identyczne** jak dziś. |
| 2 | **Meta-narzędzia wstrzykiwane przez `createAgent`** — epizod nie musi ręcznie dodawać definicji/handlerów meta (tylko flagę + opcjonalnie `coreToolNames`). |
| 3 | **Źródło prawdy katalogu** — tablica `tools` + `handlers` przekazane do `createAgent` (jak dziś po `mcpToolsToOpenAI`). |
| 4 | **Domyślne core** — `http_request`, `submit_to_hub`, `finish_task`; nadpisywalne przez `coreToolNames`. |
| 5 | **`describe_tool`** zwraca JSON: `{ name, description, parameters, alreadyActive }` (pełny schema z katalogu). |
| 6 | **`activate_tools`** — `{ names: string[] }` → aktywacja na **kolejne** tury; wynik: `{ activated, alreadyActive, unknown }`. |
| 7 | **Auto-aktywacja** — `autoActivateOnUnknownTool: false` domyślnie; opcjonalnie `true` → przy wywołaniu nieaktywnego ale znanego narzędzia: dodać do zestawu + wynik tool z hintem „aktywowano — wywołaj ponownie w następnej turze”. |
| 8 | **Brak `list_servers`** — jeden serwer MCP in-process. |
| 9 | **Nowe zależności npm** — brak. |

---

## 3. Analiza stanu obecnego (gap)

| Komponent | Stan | Gap |
| --- | --- | --- |
| `agent.ts` | Stała tablica `tools` w każdej turze | Brak `activeToolNames` i filtra |
| `planning.ts` | Nazwy wszystkich `tools` w turn 0 | Brak wskazówki discovery |
| `mcp/client.ts` | `listMcpTools`, `mcpToolsToOpenAI` | Używane tylko przy bootstrap epizodu |
| `finish_task.ts` | Wzorzec native tool + OpenAI def | Wzorzec dla meta tools |
| `agent.test.ts` | Testy pętli, planning, OM | Brak testów discovery |
| Epizody (`s02e04/run.ts`) | `allTools` = wszystkie MCP | Bez zmian do czasu opt-in w epizodzie |

---

## 4. Architektura docelowa

```text
Episode bootstrap (bez zmian w strukturze):
  mcpToolDefs = mcpToolsToOpenAI(await listMcpTools(client))
  allTools = [...mcpToolDefs, finishTaskToolDefinition]
  handlers = { ...mcp map, finish_task }

createAgent({
  tools: allTools,
  handlers,
  toolDiscovery: { enabled: true, coreToolNames?: [...] },
})
  │
  ├─ buildToolCatalog(tools, handlers)
  ├─ createToolDiscoveryState({ core, meta, catalog })
  ├─ mergeHandlers(handlers, metaHandlers)
  ├─ mergeToolDefinitions(allTools, metaToolDefinitions)  // do planowania / nazw
  │
  └─ runLoop (iteracja i)
        │
        ├─ apiTools = filterToolsForApi(mergedTools, activeToolNames)
        ├─ ai.generateResponse(conversation, apiTools, instructions)
        │
        └─ dispatchToolCall → meta lub MCP (handlers pełne)
              activate_tools → mutuje activeToolNames (następna iteracja)
```

**Przepływ typowy (discovery włączone):**

```text
Tura 1 API tools:  list_tools, describe_tool, activate_tools,
                   http_request, submit_to_hub, finish_task
        → list_tools → describe_tool("search_mail") → activate_tools(["search_mail", ...])
Tura 2 API tools:  + search_mail, download_mail_content, ...
        → search_mail(...)
```

---

## 5. Kontrakty API (propozycja implementacji)

### 5.1 `ToolDiscoveryOptions`

```typescript
export type ToolDiscoveryOptions = {
  /** Włącza Wariant M. Domyślnie false gdy pole omitted. */
  enabled: boolean;
  /**
   * Narzędzia zawsze widoczne w API od pierwszej tury ReAct.
   * Domyślnie: http_request, submit_to_hub, finish_task.
   */
  coreToolNames?: string[];
  /**
   * Gdy true: wywołanie narzędzia z katalogu ale nieaktywnego → dodaj do active + komunikat.
   * Domyślnie false.
   */
  autoActivateOnUnknownTool?: boolean;
};
```

### 5.2 Rozszerzenie `AgentConfig`

```typescript
export type AgentConfig = {
  // ...existing
  toolDiscovery?: ToolDiscoveryOptions;
};
```

### 5.3 Eksporty (`index.ts`)

- `ToolDiscoveryOptions`, `DEFAULT_CORE_TOOL_NAMES`, `META_TOOL_NAMES`
- `buildToolCatalog`, `createMetaToolDefinitions`, `createMetaToolHandlers` (dla zaawansowanych epizodów — opcjonalnie tylko typy + `createAgent` wystarczy)

---

## 6. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| Model nie wywoła `activate_tools` | Core zawsze aktywne; fragment w `system.md` + planning; opcjonalnie `autoActivateOnUnknownTool` |
| Duplikat nazw meta vs MCP | Zarezerwowane prefiksy `list_tools`, `describe_tool`, `activate_tools` — walidacja przy `buildToolCatalog` (warn jeśli kolizja) |
| Planning turn 0 woła meta | Turn 0: `tools: []` + tekst „nie wywołuj narzędzi w turze 0” (bez zmian) |
| `collectToolNames` bez meta w planie | Planning używa **pełnego** merged catalog (wszystkie nazwy + adnotacja które są core) |
| Regresja epizodów bez flagi | Test: `toolDiscovery` undefined → ta sama liczba `tools` w mock co dziś |
| Model wywoła nieaktywne MCP | Error JSON + lista `activeTools` + sugestia `activate_tools` |

---

## 7. Bezpieczeństwo

- `activate_tools` akceptuje tylko nazwy z **katalogu** (zarejestrowane w `tools`/`handlers`), nie dowolne stringi.
- `describe_tool` **nie wykonuje** narzędzia — tylko zwraca schema.
- `list_tools` nie ujawnia sekretów — tylko `name` + `description` z definicji OpenAI/MCP.
- Meta-handlery nie omijają walidacji Zod przy późniejszym wywołaniu MCP (dispatch bez zmian).

---

## 8. Kryteria akceptacji (Definition of Done)

### Core discovery (fazy A–F)

- [x] `createAgent({ toolDiscovery: { enabled: true } })` — pierwsza tura ReAct: API `tools` ⊆ core + meta (nie wszystkie MCP epizodu).
- [x] Po `activate_tools` następna tura zawiera pełne schematy aktywowanych narzędzi.
- [x] `createAgent` bez `toolDiscovery` — zachowanie i liczba przekazanych `tools` jak przed zmianą (test regresji).
- [x] `list_tools` / `describe_tool` / `activate_tools` działają z mock katalogiem (unit).
- [x] `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate/` — OK.

### Dokumentacja (faza G)

- [x] README: sekcja Tool discovery (opt-in, przykład `createAgent`, domyślne core).
- [x] CHANGELOG [Unreleased]: Added tool discovery (S02E05-inspired).
- [x] `tasks/docs/boilerplate-documentation.md`: krótki podrozdział (opcjonalne narzędzia, bez QuickJS).

---

## 9. Plan fazowy i zadania

### Faza A — Typy, katalog, filtr

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| A1 | [CREATE] | **`src/agent/tool_discovery/types.ts`:** `ToolCatalogEntry`, `ToolCatalog`, `ToolDiscoveryState`, `ToolDiscoveryOptions`, `ActivateToolsResult`, stałe `META_TOOL_NAMES`, `DEFAULT_CORE_TOOL_NAMES`. | [ ] Typy eksportowane z modułu. |
| A2 | [CREATE] | **`src/agent/tool_discovery/catalog.ts`:** `buildToolCatalog(tools: unknown[], handlers)` — mapa `name → { definition, handler? }`; wykrycie kolizji z `META_TOOL_NAMES`. | [ ] Test: 3 MCP + finish_task w katalogu. |
| A3 | [CREATE] | **`src/agent/tool_discovery/filter.ts`:** `filterToolsForApi(allTools, activeNames: Set<string>)` — zachowuje kolejność; meta zawsze jeśli w `activeNames`. | [ ] Test: 7 definicji → filtr 4 nazwy → 4 wyniki. |

### Faza B — Stan aktywacji

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| B1 | [CREATE] | **`src/agent/tool_discovery/state.ts`:** `createToolDiscoveryState(options, catalog)` — inicjalizacja `activeNames` = meta ∪ core ∪ `finish_task`; metody `activate(names)`, `getActiveNames()`, `isActive(name)`. | [ ] Test: activate dodaje; unknown odrzucone; idempotent activate. |
| B2 | [CREATE] | **`src/agent/tool_discovery/resolve-core.ts`:** `resolveCoreToolNames(options, catalog)` — domyślne core, walidacja że istnieją w katalogu (throw lub log `[SYSTEM]` + skip brakujących — preferowany log + skip). | [ ] Test: custom core + brakująca nazwa. |

### Faza C — Meta-narzędzia (native)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| C1 | [CREATE] | **`src/tools/native/list_tools.ts`:** Zod `input` pusty obiekt; handler przyjmuje `ToolDiscoveryContext` (catalog + state) — zwraca JSON tablicy `{ name, description, active }` dla wpisów nie-meta. | [ ] Definicja OpenAI + test handlera. |
| C2 | [CREATE] | **`src/tools/native/describe_tool.ts`:** Zod `{ name: string }`; zwraca pełny schema + `alreadyActive`. | [ ] Test: unknown name → error JSON. |
| C3 | [CREATE] | **`src/tools/native/activate_tools.ts`:** Zod `{ names: string[] }`; woła `state.activate`; log `[SYSTEM]` z podsumowaniem. | [ ] Test: partial unknown names. |
| C4 | [CREATE] | **`src/agent/tool_discovery/meta.ts`:** `createMetaToolDefinitions()`, `createMetaToolHandlers(catalog, state)` — składa C1–C3 w mapę zgodną z `ToolHandler`. | [ ] Trzy nazwy w `META_TOOL_NAMES`. |

### Faza D — Integracja `createAgent`

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| D1 | [MODIFY] | **`src/agent/agent.ts`:** Rozszerzyć `AgentConfig` o `toolDiscovery?`; w `createAgent` — jeśli enabled: utworzyć state + meta handlers, zmergować handlery, w `runLoop` użyć `filterToolsForApi` przed `generateResponse`. | [ ] Test integracyjny mock AI. |
| D2 | [MODIFY] | **`src/agent/agent.ts` — `dispatchToolCall`:** Gdy discovery + `autoActivateOnUnknownTool` + nazwa w katalogu ale nieaktywna → activate + zwróć hint (bez wykonania MCP w tej turze). | [ ] Test opcjonalny (flag true). |
| D3 | [MODIFY] | **`src/agent/planning.ts`:** `buildPlanningInstructions` — gdy przekazany `toolDiscoveryEnabled` + opcjonalny blok z `src/prompts/tool_discovery.md` (krótki workflow). `runPlanningTurn` / `createAgent` przekazują flagę. | [ ] Turn 0 nadal `tools: []`. |
| D4 | [MODIFY] | **`config.ts` (opcjonalnie):** `AGENT_TOOL_DISCOVERY` env nie w tym planie — tylko explicit flag w `createAgent` (research: bez globalnego env). | [ ] Brak zmiany domyślnego zachowania env. |

### Faza E — Prompty i eksporty

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| E1 | [CREATE] | **`src/prompts/tool_discovery.md`:** 5–8 linii: najpierw `list_tools`, przed użyciem extended → `describe_tool` / `activate_tools`. | [ ] Ładowane z `planning.ts` / inject do instructions gdy discovery on. |
| E2 | [MODIFY] | **`src/prompts/system.md`:** Jedna sekcja „Tool discovery (when enabled)” — odwołanie do meta-narzędzi. | [ ] Nie psuje epizodów bez discovery. |
| E3 | [MODIFY] | **`index.ts`:** Eksport typów + `META_TOOL_NAMES`, `DEFAULT_CORE_TOOL_NAMES` z `tool_discovery/`. | [ ] `import from "@ai-devs/agent-boilerplate"` działa. |
| E4 | [CREATE] | **`src/agent/tool_discovery/index.ts`:** barrel export modułu. | [ ] Jedno wejście dla testów. |

### Faza F — Testy

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| F1 | [CREATE] | **`src/agent/tool_discovery/catalog.test.ts`**, **`filter.test.ts`**, **`state.test.ts`**. | [ ] Pokrycie happy path + unknown activate. |
| F2 | [MODIFY] | **`src/agent/agent.test.ts`:** Nowy describe `tool discovery` — mock adapter zapisuje `tools.length` per call; scenariusz activate → wzrost liczby. | [ ] Regresja: discovery off — jeden rozmiar tools przez cały run. |
| F3 | [REUSE] | Uruchomić `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate/`. | [ ] Zero fail. |

### Faza G — Dokumentacja

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| G1 | [MODIFY] | **`README.md`:** sekcja Tool discovery + przykład kodu z `toolDiscovery: { enabled: true }`. | [ ] Link do lekcji `02_05_sandbox`. |
| G2 | [MODIFY] | **`CHANGELOG.md`:** wpis pod [Unreleased]. | [ ] Added tool discovery (opt-in). |
| G3 | [MODIFY] | **`tasks/docs/boilerplate-documentation.md`:** § narzędzia — discovery vs pełna lista. | [ ] Zgodność z filozofią edukacyjną. |

---

## 10. Kolejność wdrożenia (zalecana)

```text
A → B → C → D → E → F → G
```

Fazy A–C można testować bez pełnej integracji agenta; **D** jest punktem integracyjnym — po D uruchomić F3.

---

## 11. Przykład użycia (epizod — poza tym planem, referencja)

```typescript
const agent = createAgent({
  ai: createAIAdapter({ model: DEFAULT_AGENT_MODEL }),
  instructions: systemPrompt,
  tools: allTools,
  handlers,
  toolDiscovery: {
    enabled: true,
    coreToolNames: ["http_request", "submit_to_hub", "finish_task"],
  },
  enablePlanningPhase: true,
});
```

Epizody z ≤6 narzędziami **nie muszą** włączać discovery.

---

## 12. Changelog planu

| Data | Zmiana |
| --- | --- |
| 2026-05-27 | Utworzenie planu — ścieżka M zaakceptowana przez człowieka. |

---

## 13. Po implementacji (workflow)

1. `@eversis-review` na diffie `tasks/boilerplate/`.
2. Opcjonalny follow-up PR: włączenie discovery w wybranym epizodzie (np. `s02e04`) do pomiaru tur/tokenów.
3. Aktualizacja [tool-discovery.research.md](tool-discovery.research.md) — status: *Zaimplementowano (plan M)*.
