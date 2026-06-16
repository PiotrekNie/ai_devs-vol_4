# Plan wdrożenia — S04E01: agent `okoeditor` (OKO API)

**Normatywny research:** [okoeditor.research.md](okoeditor.research.md) — **zaakceptowany** (2026-06-11).  
**Workspace:** `tasks/s04e01/`  
**Status:** Zrealizowany (2026-06-11) — P1–P12 / fazy A–H.

**Ścieżka nauki:** **L0 → L2** (ręczny probe → scaffold agenta).

**Weryfikacja UI:** brak w agencie — rekonesans panelu https://oko.ag3nts.org/ **ręcznie** (odczyt ID); agent nie automatyzuje przeglądarki.

---

## 1. Zakres (scope)

**W zakresie:**

| ID | Element | Opis |
| --- | --- | --- |
| P1 | **`tasks/s04e01/`** | Epizod `@ai-devs/s04e01` na `@ai-devs/agent-boilerplate` |
| P2 | **`oko_help` MCP** | `submit_to_hub` z `answer: { action: "help" }` — cache wyniku w handlerze (opcjonalnie) |
| P3 | **`oko_update` MCP** | Zod: `page`, `id`, `title?`, `content?`, `done?`; walidacja prefiksu dla `incydenty`; wewnętrznie `executeSubmitToHub` |
| P4 | **`oko_done` MCP** | `answer: { action: "done" }`; ekstrakcja `{FLG:...}` |
| P5 | **Agent ReAct** | `oko_help` + `oko_update` + `oko_done` + `finish_task` (**bez** pełnego boilerplate MCP) |
| P6 | **`oko_memory.ts`** | `injectWorkingPlan` po negatywnym `oko_done` / błędzie update (wzorzec `firmware_memory`) |
| P7 | **`run.ts`** | Planning turn 0, Langfuse noop bez kluczy, `MAX_ITERATIONS` 8–12 |
| P8 | **Prompty** | `system.md`, `okoeditor_task.md` — reguły API, fabuła, zakaz UI write |
| P9 | **`scripts/probe-oko.ts`** | L0: `help`, przykładowy `done` (edukacyjny, bez sekretów w logu) |
| P10 | **Testy** | `oko_update.test.ts` (walidacja Zod + prefiks incydentu); `oko_memory.test.ts` |
| P11 | **`README.md`** | Start, env, L0→L2, wypełnienie `docs/context/okoeditor.md` |
| P12 | **Research** | Status + link do planu |

**Poza zakresem:**

- Zmiany w `@ai-devs/agent-boilerplate` (core)
- Playwright / browser MCP w agencie
- Garden, Daytona, terminal
- Automatyczne scrapowanie ID z panelu OKO
- E2E hub w CI (wymaga `HUB_API_KEY`)
- Rozwiązanie z flagą w tym PR — **scaffold + Twoje ID** w `docs/context/`; flaga po ręcznym rekonesansie

---

## 2. Decyzje projektowe (z research §10)

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Ścieżka L0→L2 | **Tak** — `scripts/probe-oko.ts` przed `run.ts` |
| 2 | Cienkie MCP `oko_*` | **Tak** — nauka tool design (S03E04) |
| 3 | Planning phase | **Tak** — tura 0: plan 3× update + done |
| 4 | Langfuse | **Tak** w `run.ts` — noop bez kluczy (jak S03E02) |
| 5 | ID w repo | **Placeholder** w `docs/context/okoeditor.md`; użytkownik uzupełnia lokalnie |
| 6 | Język promptów | **Polski** |
| 7 | Minimalny MCP | **Nie** `createBoilerplateMcpServer()` — tylko `oko_*` + `finish_task` |

---

## 3. Kontrakt narzędzi (szkic implementacji)

### `oko_update`

```typescript
z.object({
  page: z.enum(["incydenty", "notatki", "zadania"]),
  id: z.string().regex(/^[a-f0-9]{32}$/i),
  title: z.string().optional(),
  content: z.string().optional(),
  done: z.enum(["YES", "NO"]).optional(),
}).refine(
  (v) => v.title ?? v.content,
  { message: "At least one of title or content required" },
);
```

- Gdy `page === "incydenty"` i podano `title`: musi matchować `/^(MOVE00|PROB00|RECO00)/`.
- Gdy `done` i `page !== "zadania"`: `mcpErr` przed hubem.
- Handler: `executeSubmitToHub({ task_name: "okoeditor", answer: { action: "update", ... } })`.

### `oko_done`

- Handler: `executeSubmitToHub({ task_name: "okoeditor", answer: { action: "done" } })`.
- Zwróć flagę jeśli `extractFlag(text)`.

### `oko_help`

- Jednorazowe wywołanie help; wynik skrócony jeśli > `AGENT_MAX_TOOL_OUTPUT_CHARS`.

---

## 4. Struktura katalogów

```text
tasks/s04e01/
├── index.ts              # export run (opcjonalnie)
├── run.ts
├── config.ts
├── package.json
├── tsconfig.json
├── README.md
├── scripts/
│   └── probe-oko.ts
├── docs/
│   ├── context/okoeditor.md    # już istnieje — uzupełnij ID
│   └── specs/okoeditor/
├── src/
│   ├── agent/oko_memory.ts
│   ├── mcp/server.ts
│   ├── prompts/system.md
│   ├── prompts/okoeditor_task.md
│   └── tools/mcp/
│       ├── oko_help.ts
│       ├── oko_update.ts
│       ├── oko_update.test.ts
│       ├── oko_done.ts
│       └── oko_done.test.ts   # opcjonalnie minimalny
```

---

## 5. Prompty (szkic)

### `system.md`

- Rola: agent OKO — **tylko** hub API.
- Narzędzia: `oko_help`, `oko_update`, `oko_done`, `finish_task`.
- **Zakaz:** edycja przez panel webowy; zgadywanie ID.
- Jedna akcja hub na turę (update lub done).
- Po `{FLG:...}` → `finish_task`.

### `okoeditor_task.md`

- Checklist fabularny (3 zmiany + done).
- Reguła prefiksów incydentu.
- Sekcja `## Rekordy (uzupełnij po UI)` z placeholderami ID lub odesłanie do `docs/context/okoeditor.md`.
- Instrukcja: `oko_done` po każdej serii update; czytaj `message` przy błędzie.

---

## 6. `run.ts` (szkic)

Wzorzec: [`tasks/s03e02/run.ts`](../../../s03e02/run.ts).

```text
resetOkoState()
initTracing (noop)
createS04e01McpServer() → oko_help, oko_update, oko_done
createAgent({
  enablePlanningPhase: true,
  maxIterations: OKOEDITOR_MAX_ITERATIONS,  // default 10
  memory: createOkoMemoryHooks(),
  tracing,
})
userQuery:
  "Wykonaj okoeditor. Tura 0: plan (help jeśli potrzeba → 3× oko_update → oko_done).
   ID z kontekstu zadania. Iteruj na feedback done aż {FLG:...}."
```

---

## 7. Fazy implementacji

| Faza | ID | Zadanie | Typ |
| --- | --- | --- | --- |
| A | A1 | `package.json`, `tsconfig.json`, `config.ts`, `index.ts` | [CREATE] |
| B | B1–B4 | MCP: `oko_help`, `oko_update`, `oko_done`, `server.ts` | [CREATE] |
| C | C1–C2 | `oko_memory.ts` + test | [CREATE] |
| D | D1–D2 | `system.md`, `okoeditor_task.md` | [CREATE] |
| E | E1 | `run.ts` + Langfuse | [CREATE] |
| F | F1 | `scripts/probe-oko.ts` | [CREATE] |
| G | G1 | `README.md` | [CREATE] |
| H | H1 | `bun test`, `bunx tsc --noEmit` w `tasks/s04e01/` | [REUSE] |

**Kolejność:** A → B → C → D → E → F → G → H.

---

## 8. Kryteria akceptacji (Definition of Done)

### Scaffold (plan)

- [x] `tasks/s04e01/` kompiluje się (`tsc --noEmit`)
- [x] `bun test` przechodzi (walidacja Zod, memory)
- [x] `bun --env-file=../.env run scripts/probe-oko.ts` zwraca help JSON
- [x] Agent startuje bez błędu (`bun run start`) — może nie dostać flagi bez ID w kontekście
- [x] README opisuje L0→L2 i rekonesans UI
- [x] Brak zmian w `tasks/boilerplate/src/`

### Rozwiązanie zadania (Ty, po scaffold)

- [ ] Tabela ID w `docs/context/okoeditor.md` uzupełniona
- [ ] 3× `oko_update` spełnia fabułę
- [ ] `oko_done` → `{FLG:...}`
- [ ] Panel OKO odzwierciedla zmiany (podgląd)

---

## 9. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Brak ID → agent się zapętla | Placeholder w prompt; `ask_human` opcjonalnie; README L0 |
| Zły prefiks incydentu | Walidacja w `oko_update` + test |
| `done` z niejasnym komunikatem | `oko_memory` inject z ostatnim `message` |
| Agent woła zbędne narzędzia | Minimalny MCP server (bez `http_request`) |
| Commit sekretów | Tylko `HUB_API_KEY` z env; probe nie loguje klucza |

---

## 10. Human gate

**Przed implementacją:** akceptacja tego planu (scope P1–P12, fazy A–H).

**Po scaffold:** Ty uzupełniasz ID i uruchamiasz agenta / L0 curl do flagi.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-11 | Plan początkowy — epizod okoeditor, MCP oko_*, L0 probe, bez browser automation |
| 2026-06-11 | P1–P12 / fazy A–H zrealizowane po akceptacji planu |
