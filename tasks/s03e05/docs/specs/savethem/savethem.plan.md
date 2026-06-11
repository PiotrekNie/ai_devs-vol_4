# Plan wdrożenia — S03E05: agent `savethem` (hybrid: odkrywanie + solver)

**Normatywny research:** [savethem.research.md](savethem.research.md) — **zaakceptowany** (2026-06-11).  
**Workspace:** `tasks/s03e05/` (greenfield) + root `README.md` + `CHANGELOG.md`  
**Status:** Zrealizowany (2026-06-11) — fazy A0–H; hub E2E `{FLG:INTACTCITY}` (solver smoke).

**Decyzje (human gate — rozwiązane):**

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Profil rozwiązania | **Hybrid** — agent odkrywa hub; **solver TS** liczy trasę (nie czysty agent) |
| 2 | Kolejność implementacji | **Najpierw** warstwa odkrywania (`hub_query` + agent), **potem** `domain/` + `plan_route` |
| 3 | MCP `hub_query` vs `http_request` | **`hub_query`** — wzorzec `shell_exec` (firmware) |
| 4 | Memory hooks | **Tak** — wzorzec S03E01 po błędzie verify |
| 5 | Langfuse | **Włączone** w `run.ts` — noop bez kluczy (jak S03E02) |
| 6 | Docs repo | **Tak** — root `README.md` + `CHANGELOG.md` + `tasks/s03e05/README.md` |

**Weryfikacja UI:** brak.

---

## 1. Zakres (scope)

**W zakresie:**

| Element | Opis |
| --- | --- |
| **`tasks/s03e05/`** | Epizod `@ai-devs/s03e05` na `@ai-devs/agent-boilerplate` |
| **`hub_query` MCP** | POST `https://hub.ag3nts.org/api/{path}` + `{ apikey, query }` (EN) |
| **`plan_route` MCP** | Deterministyczny solver — input: wybór pojazdu; dane z sesji odkryć |
| **`domain/`** | Parser mapy, reguł ruchu, pojazdów; BFS/A* ze stanem fuel/food |
| **`discovery_store.ts`** | Moduł sesji: surowe + sparsowane odpowiedzi hub (aktualizowany przez `hub_query`) |
| **Agent ReAct** | `hub_query` → `plan_route` → `submit_to_hub` → `finish_task` (**4 callable**) |
| **`savethem_memory.ts`** | Inject plan po błędzie hub verify |
| **`run.ts`** | Planning turn 0, Langfuse, wrapped handlers |
| **Prompty** | `system.md`, `savethem_task.md` — angielskie `query`, format `answer[]` |
| **`docs/context/`** | `savethem.md` + notatki z runtime probe API (format mapy/reguł) |
| **Testy** | `hub_query`, parsery, `pathSolver`, memory; `bun test` + `tsc` |
| **Root docs** | Wpis `s03e05` w README, CHANGELOG |

**Poza zakresem:**

- Zmiany w `@ai-devs/agent-boilerplate` (core)
- `toolDiscovery`, OM, `think`/`recall`, awareness runtime
- `read_file`, `analyze_image_vision`, generyczny `http_request` w MCP agenta
- E2E hub w CI (wymaga sekretów)
- Snapshot pełnego katalogu hub tools (API zwraca top-3 — dokumentacja opisowa)

---

## 2. Skrót researchu (kontekst planu)

| Element | Opis |
| --- | --- |
| Cel | Tablica `["vehicle_name", "right", "up", ...]` → `task: savethem` → `{FLG:...}` |
| Odkrywanie | `toolsearch` → `/api/maps`, `/api/wehicles`, … (top-3 na `query`) |
| Zasoby | 10 fuel, 10 food; mapa 10×10; teren R/T/W; cel Skolwin (G) |
| Niedeterminizm | Kolejność i treść `hub_query` (agent); poprawność trasy (solver + hub) |
| Preview | `https://hub.ag3nts.org/savethem_preview.html` — weryfikacja wizualna (manual) |

---

## 3. Architektura docelowa

```text
tasks/s03e05/
├── run.ts
├── config.ts
├── package.json
├── index.ts
├── docs/context/
│   └── savethem.md              # opis dla człowieka + probe notes
├── src/
│   ├── mcp/server.ts            # createS03e05McpServer()
│   ├── tools/mcp/
│   │   ├── hub_query.ts
│   │   └── plan_route.ts
│   ├── domain/
│   │   ├── types.ts
│   │   ├── discovery_store.ts   # stan sesji po hub_query
│   │   ├── parseHubResponses.ts # maps / vehicles / rules → struktury
│   │   └── pathSolver.ts        # BFS ze stanem (x,y,fuel,food,mode)
│   ├── agent/
│   │   └── savethem_memory.ts
│   └── prompts/
│       ├── system.md
│       └── savethem_task.md
```

### Przepływ danych (hybrid)

```text
hub_query(path, query)
  → fetch hub API
  → discovery_store.record(path, rawJson)
  → parseHubResponses (best-effort) → zaktualizuj GameRules / MapGrid / Vehicles

plan_route({ vehicle: string })
  → wymaga kompletnych danych w discovery_store (inaczej mcpErr z hintem)
  → pathSolver.solve() → string[] (vehicle + moves)
  → zwróć agentowi do submit_to_hub

submit_to_hub(task_name: savethem, answer: route[])
  → {FLG:...} lub feedback → memory inject → retry
```

**Agent nie liczy kroków w głowie** — po odkryciu woła `plan_route`, potem `submit_to_hub`.

---

## 4. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| Nieznany format odpowiedzi `maps` / rules | **Faza A0:** runtime probe + fixtures w testach; parser defensywny |
| `plan_route` przed kompletnym odkryciem | `mcpErr` z listą brakujących pól + sugestia `hub_query` |
| Polskie `query` | Prompt: **English only**; opis narzędzia po angielsku |
| Literówka `wehicles` | Parser używa nazw z API; test na exact vehicle id |
| Agent pomija `plan_route` | Prompt: obowiązkowa sekwencja discover → plan_route → submit |
| Za mało iteracji | `SAVETHEM_MAX_ITERATIONS` domyślnie **30** |
| Hub 503 | `fetchWithRetry` w `hub_query` |
| Solver nie znajduje trasy | Zwróć czytelny błąd; memory inject; agent może zmienić pojazd |

---

## 5. Security

- `HUB_API_KEY` — tylko env / `hub_query` handler; **nigdy** w promptach.
- Brak ekspozycji `read_file` — agent nie czyta lokalnych sekretów poza env w kodzie.
- Logi `[WYNIK]` — nie drukować pełnego apikey.

---

## 6. Kryteria akceptacji (Definition of Done)

### MVP (fazy A–G)

- [ ] `bun install` + `bun test` + `bunx tsc --noEmit` z `tasks/s03e05/` — PASS.
- [ ] Agent ma **dokładnie 4** callable tools: `hub_query`, `plan_route`, `submit_to_hub`, `finish_task`.
- [ ] `hub_query`: POST na `/api/{path}`, retry 503, aktualizacja `discovery_store`.
- [ ] `plan_route`: solver zwraca `string[]` zgodny z formatem verify; testy jednostkowe na fixture mapy.
- [ ] `enablePlanningPhase: true`; tura 0 bez tool calls.
- [ ] `savethem_memory`: inject plan po błędzie hub (bez flagi).
- [ ] Prompty: EN queries, `plan_route` przed submit, preview URL, nie `finish_task` przed flagą.

### Docs + E2E (faza H)

- [ ] `tasks/s03e05/README.md` — start, env, architektura hybrid, probe API.
- [ ] Root `README.md` — wiersz `s03e05`.
- [ ] `CHANGELOG.md` — wpis `[Unreleased]`.
- [ ] Research zaktualizowany (status Implemented po E2E).
- [ ] Manual E2E: `bun run start` → hub `{FLG:...}` (wymaga `tasks/.env`).

---

## 7. Plan fazowy i zadania

Typy: `[CREATE]`, `[MODIFY]`, `[REUSE]`.

### Faza A0 — Runtime probe hub API (przed kodem solvera)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| A0.1 | [REUSE] | Ręcznie / skrypt `scripts/probe-hub.ts`: seria `toolsearch` + `maps` + `wehicles` + queries o movement rules (EN) | [ ] Notatki w `docs/context/savethem.md` § API probe |
| A0.2 | [CREATE] | Fixtures JSON w `src/domain/__fixtures__/` z rzeczywistych odpowiedzi (bez apikey) | [ ] Pliki używane w testach parsera |

**Przykładowe zapytania probe:**

```text
toolsearch: "movement rules terrain map"
toolsearch: "fuel food consumption vehicles"
maps: "Skolwin 10x10 terrain map"
wehicles: "all vehicles fuel speed food consumption"
(maps/rules z odkrytych endpointów)
```

---

### Faza A — Pakiet i konfiguracja

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| A1 | [CREATE] | `package.json` — `@ai-devs/s03e05`, deps jak s03e02 | [ ] `bun install` OK |
| A2 | [CREATE] | `config.ts` — `HUB_BASE_URL`, `SAVETHEM_MAX_ITERATIONS` (30), `DEFAULT_AGENT_MODEL`, `TRACING_SERVICE_NAME` | [ ] |
| A3 | [CREATE] | `tsconfig.json`, `index.ts`, `.gitignore` (`data/`) | [ ] `tsc` OK |

---

### Faza B — `hub_query` MCP

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| B1 | [CREATE] | `src/tools/mcp/hub_query.ts` — Zod `{ path, query }`, POST, `fetchWithRetry` | [ ] |
| B2 | [CREATE] | `src/domain/discovery_store.ts` — `recordHubResponse`, `getDiscoveryState`, `isReadyForSolver` | [ ] |
| B3 | [CREATE] | `src/tools/mcp/hub_query.test.ts` — mock fetch, zapis do store | [ ] |

**Szczegóły B1:**

- URL: `${HUB_BASE_URL}/api/${path}` (path bez `/`).
- Body: `{ apikey: HUB_API_KEY, query }`.
- Po sukcesie: `discovery_store.record(path, data)` + best-effort `parseHubResponses`.
- Opis MCP: start with `toolsearch`; English `query` only.

---

### Faza C — MCP server (minimalny)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| C1 | [CREATE] | `src/mcp/server.ts` — `createS03e05McpServer()`: `hub_query` + `submit_to_hub` (+ `plan_route` po fazie E) | [ ] Faza C: bez `plan_route`; faza E rozszerza |
| C2 | [REUSE] | `submit_to_hub` z boilerplate — import bez zmian core | [ ] |

**Uwaga:** Nie używać `createBoilerplateMcpServer()`.

---

### Faza D — Prompty (warstwa odkrywania)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| D1 | [CREATE] | `src/prompts/system.md` — ReAct, submit aż flaga, nie finish wcześniej | [ ] |
| D2 | [CREATE] | `src/prompts/savethem_task.md` — deliverables, EN queries, sekwencja discover → **plan_route** → submit, preview URL | [ ] |

**Szkic user query (planning on):**

```text
Rozpocznij savethem. Tura 0: plan odkrycia (toolsearch → maps → vehicles → movement rules).
Potem hub_query (English queries only) aż dane kompletne → plan_route(vehicle) → submit_to_hub aż {FLG:...}.
Nie licz trasy ręcznie — użyj plan_route.
```

---

### Faza E — Domain + solver + `plan_route`

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| E1 | [CREATE] | `src/domain/types.ts` — `Grid`, `Cell`, `Vehicle`, `MovementRules`, `GameState` | [ ] |
| E2 | [CREATE] | `src/domain/parseHubResponses.ts` — parse maps grid, vehicles list, movement costs | [ ] Testy na fixtures A0 |
| E3 | [CREATE] | `src/domain/pathSolver.ts` — BFS/A*; stan `(x,y,fuel,food,onFoot\|vehicle)`; moves: left/right/up/down; exit vehicle | [ ] Test: fixture → trasa do G |
| E4 | [CREATE] | `src/tools/mcp/plan_route.ts` — `{ vehicle: string }` → solver → `string[]` | [ ] |
| E5 | [CREATE] | `src/tools/mcp/plan_route.test.ts` | [ ] |
| E6 | [MODIFY] | `src/mcp/server.ts` — rejestracja `plan_route` | [ ] 4 narzędzia MCP + finish |

**Szczegóły solver (E3):**

- Start: pozycja `S` z mapy; zasoby 10/10.
- Koszty ruchu z `MovementRules` + profil `Vehicle`.
- Pola R/T/W: blokada lub podwyższony koszt (zgodnie z probe API).
- Optymalizacja: minimalna liczba kroków przy constraint fuel≥0 i food≥0 na całej trasie (BFS po skończonym stanie wystarczy na 10×10).
- Output: `[vehicleName, ...directions]` — `vehicleName` = exact id z huba.

---

### Faza F — Memory hooks

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| F1 | [CREATE] | `src/agent/savethem_memory.ts` — `recordHubSubmitResult`, `beforeTurn` inject | [ ] |
| F2 | [CREATE] | `savethem_memory.test.ts` | [ ] |

**Revised plan (szkic po błędzie verify):**

```text
Hub rejected route (attempt N). Check fuel/food/terrain/vehicle name.
Revised steps:
1. hub_query — refill movement rules or vehicles if missing (English).
2. plan_route with a different vehicle if fuel/food failed.
3. submit_to_hub(savethem, answer array) — preview: savethem_preview.html
4. finish_task on {FLG:...}
```

---

### Faza G — Agent bootstrap (`run.ts`)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| G1 | [CREATE] | `run.ts` — reset `discovery_store` na start | [ ] |
| G2 | [REUSE] | Langfuse `initTracing` / noop | [ ] |
| G3 | [REUSE] | `finish_task`, `createAgent`, planning phase | [ ] |

**Handlers:**

```typescript
if (t.name === "hub_query") { /* opcjonalnie log */ }
if (t.name === "submit_to_hub") recordHubSubmitResult(text);
```

**Agent config:**

```typescript
createAgent({
  ai: withTracingAdapter(baseAdapter, DEFAULT_AGENT_MODEL),
  instructions: [systemPrompt, savethemTaskSpec].join("\n\n"),
  tools: [...mcpToolDefs, finishTaskToolDefinition],
  handlers,
  memory: createSavethemMemoryHooks(),
  enablePlanningPhase: true,
  maxIterations: SAVETHEM_MAX_ITERATIONS,
  tracing,
});
```

---

### Faza H — Dokumentacja i E2E

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| H1 | [CREATE] | `tasks/s03e05/README.md` | [ ] |
| H2 | [CREATE] | `docs/context/savethem.md` | [ ] |
| H3 | [MODIFY] | Root `README.md` — wiersz s03e05 | [ ] |
| H4 | [MODIFY] | `CHANGELOG.md` | [ ] |
| H5 | [MODIFY] | `savethem.research.md` — status Implemented | [ ] |
| H6 | [REUSE] | Manual E2E: `cd tasks/s03e05 && bun run start` | [ ] `{FLG:...}` |

---

## 8. Przepływ agenta (docelowy)

```text
Turn 0 (planning, no tools)
  └─ ## Working plan: toolsearch → maps → vehicles → rules → plan_route → submit

Turn 1..K: hub_query (English)
  └─ toolsearch → odkryj endpointy
  └─ maps, wehicles, (rules, …) — kolejność może być inna (niedeterminizm)

Turn K+1: plan_route({ vehicle: "<exact hub name>" })
  └─ solver → ["vehicle", "right", "up", ...]

Turn K+2: submit_to_hub({ task_name: "savethem", answer: [...] })
  └─ błąd → memory inject → plan_route z innym pojazdem / więcej hub_query
  └─ {FLG:...} → finish_task
```

---

## 9. Bramki jakości

Z `tasks/s03e05/`:

```bash
bun install
bun test
bunx tsc --noEmit
bun run start    # E2E — wymaga tasks/.env + klucz LLM
```

Po każdej fazie: aktualizacja checkboxów §7 i Changelog.

---

## 10. Kolejność wdrożenia

1. **A0** — probe API + fixtures (blokuje poprawny parser).
2. **A → B → C → D** — scaffold + odkrywanie + prompty (agent bez solvera — tymczasowo `plan_route` stub lub brak).
3. **E** — parser + solver + `plan_route` (pełny hybrid).
4. **F → G** — memory + `run.ts`.
5. **H** — docs + E2E manual.

**Checkpoint po fazie D:** agent wykonuje `hub_query` i wypełnia `discovery_store` (smoke bez submit).  
**Checkpoint po fazie E:** `plan_route` na fixture daje trasę; integracja w `run.ts`.

---

## 11. Human gate

**Przed implementacją:** akceptacja tego planu (hybrid z solverem, 4 narzędzia, fazy A0–H).

**Po implementacji:** review diff + potwierdzenie E2E `{FLG:...}` (H6).

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-11 | Plan początkowy — hybrid savethem; human gate: solver w scope, nie czysty agent; hub_query + plan_route |
