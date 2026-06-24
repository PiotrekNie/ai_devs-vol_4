# Plan wdrożenia — S04E03: agent `domatowo` (misja ratunkowa)

**Normatywny research:** [s04e03-domatowo.research.md](s04e03-domatowo.research.md) — **zaakceptowany** (agent-first, bez solvera).  
**Workspace:** `tasks/s04e03/` + wpis w root `README.md` + `CHANGELOG.md`  
**Status:** Zrealizowany (2026-06-23) — fazy A–G; testy + tsc PASS; E2E agent (H1) — manual.

**Weryfikacja UI:** brak.

---

## 1. Zakres (scope)

### W zakresie

| Element | Opis |
| --- | --- |
| **`tasks/s04e03/`** | Epizod npm `@ai-devs/s04e03` na `@ai-devs/agent-boilerplate` |
| **Wąskie MCP (proxy hub)** | POST `https://hub.ag3nts.org/verify`, `task: domatowo` — **bez logiki misji** |
| **Agent ReAct** | `createAgent` + `enablePlanningPhase` + `finish_task` |
| **`domatowo_memory.ts`** | Inject planu po błędzie huba / niskim `action_points_left` (wzorzec `firmware_memory`) |
| **`run.ts`** | Langfuse opt-in (noop bez kluczy), wrapped handlers, pętla do `{FLG:...}` |
| **Prompty** | `system.md`, `domatowo_task.md` (sygnał radiowy w task spec) |
| **Testy** | `domatowoClient.test.ts`, `domatowo_memory.test.ts`; opcj. testy pojedynczych MCP (mock fetch) |
| **`tasks/s04e03/README.md`** | Start, env, model, architektura agent-first |
| **Root `README.md`** | Wiersz `s04e03` |
| **`CHANGELOG.md`** | Wpis `[Unreleased]` |

### Poza zakresem (hard — antywzorzec)

| Element | Powód |
| --- | --- |
| `planner.ts`, `pathfind.ts`, BFS/A* | Solver w TS — user chce naukę przez agenta |
| MCP `plan_mission`, `plan_route`, `solve_domatowo` | Black box jak `savethem` solver |
| Regex wykrywający partyzanta w logach | Agent interpretuje `getLogs` |
| Hardcoded lista pól B3 / tras | Agent wnioskuje z sygnału + API |
| `run.ts` deterministyczny (bez `createAgent`) | Antywzorzec `reactor` |
| `submit_to_hub` jako osobne narzędzie | Flaga w `message` po `callHelicopter`; każda akcja = `answer.action` |
| `createBoilerplateMcpServer()` | Ekspozycja `read_file`, `http_request`, vision — agent miałby złą abstrakcję |
| Zmiany w `@ai-devs/agent-boilerplate` core | Epizod only |
| E2E hub w CI | Wymaga sekretów + koszt LLM |

---

## 2. Decyzje projektowe (human gate)

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Kto rozwiązuje misję? | **LLM w ReAct** — infrastruktura tylko proxy |
| 2 | Ile narzędzi MCP? | **7 wąskich** (poniżej) — cienkie proxy; wspólny `domatowoClient.postAnswer()` w implementacji |
| 3 | Sygnał radiowy | Pełny cytat w **`domatowo_task.md`**, nie w `system.md` |
| 4 | Memory hooks | **Od razu** — wzorzec S03E02 `firmware_memory` |
| 5 | Langfuse | **Włączone** w `run.ts` — graceful bez kluczy |
| 6 | Model domyślny | `anthropic/claude-sonnet-4-6` (`AGENT_MODEL` override) |
| 7 | `MAX_ITERATIONS` | **40** domyślnie (`DOMATOWO_MAX_ITERATIONS`) |
| 8 | E2E DoD | Manual agent run → `{FLG:...}` (nie gwarantowane za 1. próbą — OK) |
| 9 | Root docs | **Tak** — README + CHANGELOG |

### 2.1 Narzędzia MCP (7 + `finish_task`)

Wszystkie handlery: walidacja Zod → `postAnswer({ action, ...params })` → JSON tekst do agenta. **Zero** planowania tras w TS.

| Narzędzie | Akcje hub (`answer`) | Parametry (Zod) |
| --- | --- | --- |
| `domatowo_recon` | `help`, `actionCost`, `getMap`, `getObjects`, `getLogs`, `expenses`, `searchSymbol` | `action` enum + opcj. `symbols[]`, `symbol` |
| `domatowo_reset` | `reset` | — |
| `domatowo_create` | `create` | `type`: scout \| transporter; opcj. `passengers` 1–4 |
| `domatowo_move` | `move` | `object` (hash/id), `where` (A1–K11) |
| `domatowo_inspect` | `inspect` | `object` |
| `domatowo_dismount` | `dismount` | `object`, `passengers` 1–4 |
| `domatowo_call_helicopter` | `callHelicopter` | `destination` (A1–K11) |

**Uzasadnienie 7 vs 13:** research wymienia 13 akcji osobno; grupowanie **odczytów 0 pkt** w `domatowo_recon` skraca prompt bez solvera — agent nadal wybiera `action` i parametry. Mutacje (koszt > 0) = osobne narzędzia (jak `shell_exec` w firmware).

---

## 3. Technical Context

| Obszar | Konwencja |
| --- | --- |
| Runtime | **Bun** — `bun install`, `bun test`, `bunx tsc --noEmit` |
| Pakiet | `"@ai-devs/agent-boilerplate": "file:../boilerplate"` |
| Env | `tasks/.env` — `HUB_API_KEY`, `AGENT_MODEL`, opcj. Langfuse |
| Hub | `HUB_VERIFY_URL` z boilerplate; body: `{ apikey, task: "domatowo", answer }` |
| MCP server | **Minimalny** `createS04e03McpServer()` — tylko narzędzia epizodu |
| Prompty | `fs.readFileSync` → `instructions` w `run.ts` |
| Logi | `[MYŚL]`, `[AKCJA]`, `[WYNIK]` — obserwuj trajektorię agenta |
| Flaga | `extractFlag` z odpowiedzi hub w handlerze / memory; potem `finish_task` |
| Wzorzec epizodu | **`tasks/s03e02/`** (firmware) — nie `s03e03` / `s04e02` |

---

## 4. Skrót zadania (kontekst planu)

| Element | Wartość |
| --- | --- |
| Cel | Znaleźć partyzanta, `callHelicopter` → `{FLG:...}` |
| Budżet | 300 punktów akcji |
| Kluczowa mechanika | Transporter 1 pkt/pole (ulice); zwiadowca 7 pkt/pole |
| Kontekst fabularny | Sygnał: „najwyższe bloki” — agent sam zawęża przeszukanie |
| Preview | https://hub.ag3nts.org/domatowo_preview |

---

## 5. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| Agent przepala 300 pkt | Prompt + memory inject; sugestia `domatowo_reset` w revised plan |
| Agent nie czyta `getLogs` po `inspect` | Antywzorzec w `domatowo_task.md` |
| Zbyt mało tur ReAct | `MAX_ITERATIONS` 40 |
| 13+ narzędzi zaśmieca prompt | 7 MCP (§2.1) |
| Agent woła `http_request` zamiast MCP | Minimalny MCP server — bez boilerplate defaults |
| Halucynacja współrzędnych | Hub zwraca błąd; memory inject |
| E2E niestabilny (model słabszy) | README: rekomendacja Sonnet/gpt-4o; mini = eksperyment |
| Implementer dodaje solver „dla pewności” | DoD §7 — code review / brak `domain/planner` |

---

## 6. Security

- `HUB_API_KEY` tylko w env / `domatowoClient` — **nigdy** w promptach.
- Brak dostępu do lokalnego FS poza odczytem promptów w `run.ts`.
- Wyniki hub obcinane do `AGENT_MAX_TOOL_OUTPUT_CHARS` jeśli `getMap` jest duży.

---

## 7. Definition of Done

### MVP (fazy A–F)

- [x] `bun install` + `bun test` + `bunx tsc --noEmit` z `tasks/s04e03/` PASS.
- [x] Agent ma **7** MCP + `finish_task` — **bez** `read_file` / `http_request` / vision / `submit_to_hub`.
- [x] Każdy MCP = cienki POST; **brak** plików `planner.ts` / `pathfind.ts`.
- [x] `enablePlanningPhase: true`; tura 0 bez tool calls.
- [x] `domatowo_task.md` zawiera pełny sygnał radiowy + koszty + antywzorce.
- [x] `domatowo_memory`: inject po błędzie hub / niskim `action_points_left`.
- [x] Langfuse wired (graceful bez kluczy).

### Docs + E2E (fazy G–H)

- [x] `tasks/s04e03/README.md` kompletny.
- [x] Root `README.md` — wiersz `s04e03`.
- [x] `CHANGELOG.md` — `[Unreleased]`.
- [ ] Research zaktualizowany (status Implemented po E2E).
- [ ] Manual E2E: agent run → `{FLG:...}` (human gate; może wymagać kilku prób / mocniejszego modelu).

---

## 8. Plan fazowy

Typy: `[CREATE]`, `[MODIFY]`, `[REUSE]`.

### Faza A — Pakiet i konfiguracja

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| A1 | [CREATE] | `package.json` — `@ai-devs/s04e03`, deps jak `s03e02` | [ ] |
| A2 | [CREATE] | `config.ts` — `DOMATOWO_MAX_ITERATIONS` (40), `DEFAULT_AGENT_MODEL` (`anthropic/claude-sonnet-4-6`), `TRACING_SERVICE_NAME` | [ ] |
| A3 | [CREATE] | `tsconfig.json`, `index.ts` | [ ] |

---

### Faza B — Hub client (bez strategii)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| B1 | [CREATE] | `src/hub/domatowoClient.ts` — `postDomatowoAnswer(answer)`, `fetchWithRetry`, `HUB_API_KEY` check, `mcpOk`/`mcpErr` shape | [ ] |
| B2 | [CREATE] | `src/hub/domatowoClient.test.ts` — mock fetch: body shape `{ task: domatowo }`, brak klucza | [ ] |
| B3 | [CREATE] | `src/hub/types.ts` — typy odpowiedzi (opcj. `action_points_left`, `message`) | [ ] |

**Szczegóły B1:**

```typescript
// POST HUB_VERIFY_URL
// body: { apikey, task: "domatowo", answer: { action, ... } }
// return: JSON string for MCP (include action_points_left when present)
```

---

### Faza C — Narzędzia MCP (cienkie)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| C1 | [CREATE] | `src/tools/mcp/domatowo_recon.ts` + Zod | [ ] |
| C2 | [CREATE] | `src/tools/mcp/domatowo_reset.ts` | [ ] |
| C3 | [CREATE] | `src/tools/mcp/domatowo_create.ts` | [ ] |
| C4 | [CREATE] | `src/tools/mcp/domatowo_move.ts` | [ ] |
| C5 | [CREATE] | `src/tools/mcp/domatowo_inspect.ts` | [ ] |
| C6 | [CREATE] | `src/tools/mcp/domatowo_dismount.ts` | [ ] |
| C7 | [CREATE] | `src/tools/mcp/domatowo_call_helicopter.ts` | [ ] |
| C8 | [CREATE] | `src/mcp/server.ts` — `createS04e03McpServer()` rejestruje C1–C7 | [ ] |
| C9 | [CREATE] | `src/tools/mcp/domatowo_recon.test.ts` — mock: `getMap` wysyła poprawne `answer` | [ ] |

**Wspólny wzorzec handlera (każde C*):**

```typescript
export async function executeDomatowoMove(input: MoveInput): Promise<McpToolResponse> {
  return postDomatowoAnswer({ action: "move", object: input.object, where: input.where });
}
```

---

### Faza D — Prompty

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| D1 | [CREATE] | `src/prompts/system.md` — rola, tura 0, budżet pkt, `finish_task` po `{FLG:...}` | [ ] |
| D2 | [CREATE] | `src/prompts/domatowo_task.md` — cel, koszty, limity, sygnał radiowy (pełny tekst), mechanika ruchu, typowa sekwencja **bez** współrzędnych | [ ] |

**Szkic user query (planning on):**

```text
Rozpocznij domatowo. Tura 0: plan misji (recon → strategia jednostek → przeszukanie → helikopter).
Potem wykonuj narzędzia domatowo_* sekwencyjnie. Monitoruj action_points_left. Czytaj getLogs po inspect.
Kończ finish_task dopiero po {FLG:...} w odpowiedzi huba.
```

**Zakaz w promptach:** lista pól B3, gotowe trasy, „wywołaj searchSymbol('B3') jako krok N”.

---

### Faza E — Memory hooks

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| E1 | [CREATE] | `src/agent/domatowo_memory.ts` | [ ] |
| E2 | [CREATE] | `recordDomatowoResult(text)` — parsuj `action_points_left`, błędy, flagę | [ ] |
| E3 | [CREATE] | `beforeTurn`: inject revised plan gdy błąd hub lub `action_points_left` < 50 | [ ] |
| E4 | [CREATE] | `domatowo_memory.test.ts` | [ ] |

**Szkic revised plan:**

```text
Hub action failed or action points low (N left).
Revised steps:
1. domatowo_recon: expenses + getObjects — understand state.
2. Re-read domatowo_task costs (scout 7/field vs transporter 1/field on roads).
3. Use transporter + dismount for long distances; inspect high buildings from radio hint.
4. domatowo_get_logs after each inspect; callHelicopter only on confirmed human.
5. If exhausted: domatowo_reset and new plan.
```

---

### Faza F — Agent bootstrap (`run.ts`)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| F1 | [CREATE] | `run.ts` — MCP client, `createAgent`, planning, memory, handlers | [ ] |
| F2 | [REUSE] | Langfuse (`initTracing`, `withTracingAdapter`, flush) | [ ] |
| F3 | [REUSE] | `finish_task` native handler | [ ] |

**Handlers:**

```typescript
if (t.name.startsWith("domatowo_")) recordDomatowoResult(text);
```

**Agent config (szkic):**

```typescript
createAgent({
  ai: withTracingAdapter(baseAdapter, DEFAULT_AGENT_MODEL),
  instructions: [systemPrompt, domatowoTaskSpec].join("\n\n"),
  tools: [...mcpToolDefs, finishTaskToolDefinition],
  handlers,
  memory: createDomatowoMemoryHooks(),
  enablePlanningPhase: true,
  maxIterations: DOMATOWO_MAX_ITERATIONS,
  tracing,
});
```

---

### Faza G — Dokumentacja

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| G1 | [CREATE] | `tasks/s04e03/README.md` — agent-first, modele, `bun run start`, brak solvera | [ ] |
| G2 | [MODIFY] | Root `README.md` — wiersz `s04e03` | [ ] |
| G3 | [MODIFY] | `CHANGELOG.md` | [ ] |
| G4 | [MODIFY] | `s04e03-domatowo.research.md` — status po E2E | [ ] |

---

### Faza H — Weryfikacja E2E (agent)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| H1 | [REUSE] | `cd tasks/s04e03 && bun run start` + `tasks/.env` + `AGENT_MODEL=anthropic/claude-sonnet-4-6` | [ ] `{FLG:...}` w logach |
| H2 | [REUSE] | Opcjonalnie: Langfuse trace — przejrzyj tury i tool calls | [ ] |
| H3 | [REUSE] | Preview HTML — wizualna weryfikacja (manual) | [ ] opcjonalnie |

**Uwaga H1:** sukces zależy od modelu i trajektorii agenta — **nie** od solvera w repo. Kilka runów jest OK.

---

## 9. Przepływ agenta (docelowy)

```text
Turn 0 (planning, no tools)
  └─ ## Working plan: recon (map, costs, radio hint) → units → search → helicopter

Turn 1+: domatowo_* (one or few tools per turn)
  └─ domatowo_recon: help / getMap / searchSymbol / actionCost
  └─ domatowo_create → domatowo_move → domatowo_dismount
  └─ domatowo_inspect → domatowo_recon(getLogs)
  └─ interpret logs (PL) → domatowo_call_helicopter
  └─ {FLG:...} in hub message → finish_task

(błąd / mało pkt → memory inject → reset opcjonalnie → nowy plan)
```

---

## 10. Struktura katalogów (docelowa)

```text
tasks/s04e03/
├── run.ts
├── index.ts
├── config.ts
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── hub/
│   │   ├── domatowoClient.ts
│   │   ├── domatowoClient.test.ts
│   │   └── types.ts
│   ├── tools/mcp/
│   │   ├── domatowo_recon.ts
│   │   ├── domatowo_recon.test.ts
│   │   ├── domatowo_reset.ts
│   │   ├── domatowo_create.ts
│   │   ├── domatowo_move.ts
│   │   ├── domatowo_inspect.ts
│   │   ├── domatowo_dismount.ts
│   │   └── domatowo_call_helicopter.ts
│   ├── mcp/
│   │   └── server.ts
│   ├── agent/
│   │   ├── domatowo_memory.ts
│   │   └── domatowo_memory.test.ts
│   └── prompts/
│       ├── system.md
│       └── domatowo_task.md
└── docs/specs/s04e03-domatowo/
    ├── s04e03-domatowo.research.md
    └── s04e03-domatowo.plan.md
```

**Brak:** `src/domain/planner.ts`, `pathfind.ts`, `solve_*.ts`.

---

## 11. Bramki jakości

Z `tasks/s04e03/`:

```bash
bun install
bun test
bunx tsc --noEmit
bun run start    # E2E agent — wymaga tasks/.env + LLM
```

---

## 12. Kolejność wdrożenia

1. **A → B** — pakiet + hub client (testowalny).
2. **C** — MCP tools + server.
3. **D → E** — prompty + memory (równolegle po C).
4. **F** — `run.ts` integracja.
5. **G** — dokumentacja.
6. **H** — E2E agent (manual).

---

## 13. Human gate

**Przed implementacją:** akceptacja planu (agent-first, 7 MCP, brak solvera, fazy A–H).

**Po implementacji:** review diff (confirm brak `planner`/`pathfind`) + E2E `{FLG:...}` lub udokumentowana liczba prób / model.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-23 | Plan początkowy — agent-first domatowo; wzorzec firmware; 7 wąskich MCP; bez solvera |
| 2026-06-23 | Implementacja A–G — epizod `tasks/s04e03/`; 6 testów pass; tsc clean; E2E H1 pending manual |
