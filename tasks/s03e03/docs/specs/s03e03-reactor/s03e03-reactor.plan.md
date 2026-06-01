# Plan wdrożenia — S03E03: `reactor` (deterministyczny planer)

**Normatywny research:** [s03e03-reactor.research.md](s03e03-reactor.research.md) — zaakceptowany (2026-06-01): **deterministyczny planer bez LLM**.  
**Workspace:** `tasks/s03e03/` + wpis w root `README.md` + `CHANGELOG.md`  
**Status:** Zrealizowany (2026-06-01) — fazy A–H done; E2E hub PASS (`{FLG:INSTALLED}`).

**Weryfikacja UI:** brak.

---

## 1. Zakres (scope)

**W zakresie:**

| Element | Opis |
| --- | --- |
| **`tasks/s03e03/`** | Nowy epizod npm `@ai-devs/s03e03` — cienka zależność od `@ai-devs/agent-boilerplate` (HTTP + logger) |
| **Symulator gry** | `simulate.ts` — ruch bloczków, kolizje, `applyCommand` (pure) |
| **Planer** | `planner.ts` — BFS (głębokość ≤ 40) + fallback heurystyka z opisu zadania |
| **Klient hub** | `reactorClient.ts` — POST `/verify`, retry 503, parse + `extractFlag` |
| **Pętla gry** | `reactorRun.ts` + `run.ts` — `start` → plan → wykonaj → aż `{FLG:...}` |
| **Fixtures + testy** | JSON z realnych odpowiedzi hub; `simulate.test.ts`, `planner.test.ts`, `reactorClient.test.ts` |
| **`tasks/s03e03/README.md`** | Uruchomienie, architektura, brak LLM |
| **Root `README.md`** | Wiersz `s03e03` w tabeli Tasks |
| **`CHANGELOG.md`** | Wpis `[Unreleased]` — epizod reactor |
| **Research** | Aktualizacja statusu → Implemented (po E2E) |

**Poza zakresem:**

- `createAgent`, ReAct, MCP, prompty systemowe
- `analyze_image_vision`, preview HTML jako źródło stanu
- Langfuse / OpenTelemetry (brak wywołań LLM — opcjonalny defer)
- Zmiany w `@ai-devs/agent-boilerplate` core
- E2E hub w CI (wymaga `HUB_API_KEY`)
- Tryb `--agent` (ReAct) — defer

---

## 2. Decyzje projektowe

| # | Decyzja |
| --- | --- |
| 1 | **Architektura:** proceduralna pętla HTTP — nie agent ReAct |
| 2 | **LLM:** brak — 0 tokenów |
| 3 | **Reuse boilerplate:** `fetchWithRetry`, logger (`logThought`, `logAction`, `logResult`, `logSystem`), `HUB_*` z config |
| 4 | **`extractFlag`:** import z `../boilerplate/src/tools/mcp/submit_to_hub.js` (nie exportowane z głównego index pakietu) |
| 5 | **Źródło prawdy stanu:** odpowiedź API po każdym kroku; symulator tylko do lookahead |
| 6 | **Planer:** BFS preferowany; heurystyka `right → wait → left` jako fallback gdy BFS nie znajdzie ścieżki w limicie |
| 7 | **Priorytet kolejności BFS:** przy sortowaniu sąsiadów: `right` > `wait` > `left` |
| 8 | **Zależności npm:** tylko `@ai-devs/agent-boilerplate` + `zod` (parse odpowiedzi hub) — **bez** MCP SDK, Langfuse |
| 9 | **Logger:** `[MYŚL]` = uzasadnienie planera; `[AKCJA]` = POST command; `[WYNIK]` = skrót odpowiedzi hub |

---

## 3. Skrót researchu (kontekst planu)

| Element | Opis |
| --- | --- |
| Cel | Doprowadzić robota z (1,5) do (7,5) bez zgniecenia przez bloczki |
| Hub | `POST https://hub.ag3nts.org/verify` — `{ apikey, task: "reactor", answer: { command } }` |
| Komendy | `start`, `reset`, `left`, `wait`, `right` — **jedna na request** |
| Sukces | `{FLG:INSTALLED}` (lub inna flaga `{FLG:...}`) w `message` / body |
| Plansza | 7×5, wiersze/kolumny **1-indexed** w API |
| Bloki | 2 pola pionowo; ruch **przed** ruchem robota w każdej turze |
| Randomizacja | Layout początkowy losowy — plan od bieżącego `blocks` + `player` |

### Reguły symulacji (normatywne dla implementacji)

```text
moveBlocks (każda tura, przed ruchem robota):
  direction "up"   → ruch w stronę wiersza 1 (top_row--, bottom_row--)
                   → jeśli top_row == 1: odwróć na "down", przesuń o 1 w dół (top++, bottom++)
  direction "down" → ruch w stronę wiersza 5 (top_row++, bottom_row++)
                   → jeśli bottom_row == 5: odwróć na "up", przesuń o 1 w górę (top--, bottom--)

applyCommand:
  1. blocks ← moveBlocks(blocks)
  2. jeśli robot stoi na polu zajętym przez blok → crush
  3. wait  → robot stoi; blocks już przesunięte
  4. left  → col-- (min 1); pole docelowe wolne
  5. right → col++ (max 7); pole docelowe wolne; col==goal.col && row==goal.row → goal
```

**Kalibracja:** reguły muszą przejść testy na fixture zapisanych z live API (nagranie skryptem `scripts/record-fixtures.ts` — opcjonalnie w Fazie B).

---

## 4. Architektura docelowa

```text
tasks/s03e03/
├── run.ts
├── config.ts
├── index.ts
├── package.json
├── tsconfig.json
├── README.md
├── docs/specs/s03e03-reactor/     # research + plan (już istnieje)
├── src/
│   ├── domain/
│   │   ├── types.ts
│   │   ├── simulate.ts
│   │   ├── simulate.test.ts
│   │   ├── planner.ts
│   │   ├── planner.test.ts
│   │   └── fixtures/
│   │       ├── start-01.json
│   │       └── step-*.json          # pary (stateBefore, command, apiResponse)
│   ├── hub/
│   │   ├── reactorClient.ts
│   │   └── reactorClient.test.ts
│   └── reactorRun.ts
```

### Przepływ runtime

```text
run.ts
  → reactorRun.runReactor()
       logSystem("start")
       response ← hub.send("start")
       loop (step < MAX_STEPS):
         flag ← extractFlag(JSON.stringify(response))
         if flag → logResponse(flag); return
         if response.code < 0 → throw
         state ← parseGameState(response)
         cmd ← chooseCommand(state)        // planner
         logThought("wybrano: " + cmd + " bo ...")
         logAction("[Hub]", "reactor", { command: cmd })
         response ← hub.send(cmd)
         logResult({ code, player, message: truncate })
       throw "MAX_STEPS exceeded"
```

---

## 5. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| Symulator ≠ API | Fixture testy; po każdym HTTP sync stan z API (nie ufaj wyłącznie sim) |
| BFS zbyt wolny | Stan mało wymiarowy (~5 bloków × pozycje); limit głębokości 40 |
| BFS brak ścieżki w limicie | Fallback heurystyka; zwiększ limit lub log `[SYSTEM]` z pełnym stanem |
| Zgniecenie mimo planera | `reset` tylko w dev; E2E: jedna sesja od `start` |
| Brak `HUB_API_KEY` | `reactorClient` throw czytelny błąd na starcie |
| Hub 503 | `fetchWithRetry` (domyślnie 5 prób) |
| Zbyt wiele prób hub | Komunikat „robot smashed” — planer minimalizuje kroki (BFS) |

---

## 6. Security Considerations

- **`HUB_API_KEY`** — tylko w `config.ts` / `reactorClient.ts`; nigdy w logach (truncate OK).
- **Brak LLM** — brak wycieku stanu gry do zewnętrznego providera.
- **Fixtures** — bez `apikey` w plikach JSON (tylko `board`, `blocks`, `player`).

---

## 7. Kryteria akceptacji (Definition of Done)

### MVP (Fazy A–F)

- [x] `bun install` + `bun test` + `bunx tsc --noEmit` z `tasks/s03e03/` przechodzą.
- [x] Symulator: testy na ≥2 fixture (start + co najmniej 3 kroki `wait`/`right`) — stan zgodny z zapisanym API.
- [x] Planer: unit test — znany stan → oczekiwana komenda (z fixture).
- [x] `reactorClient`: mock fetch — success, 503 retry, missing key, extractFlag.
- [x] `run.ts` loguje `[MYŚL]`, `[AKCJA]`, `[WYNIK]` zgodnie z konwencją boilerplate.
- [x] Brak importów `createAgent`, MCP, Langfuse w epizodzie.

### Docs + E2E (Faza G–H)

- [x] `tasks/s03e03/README.md` — `bun run start`, env, architektura deterministyczna.
- [x] Root `README.md` — wiersz `s03e03`.
- [x] `CHANGELOG.md` — wpis Added.
- [x] Research — status Implemented po manual E2E.
- [x] Manual E2E: `bun run start` → `{FLG:...}` (wymaga `tasks/.env`, ~5–30 s).

---

## 8. Plan fazowy i zadania

Typy: `[CREATE]`, `[MODIFY]`, `[REUSE]`.

### Faza A — Pakiet i konfiguracja

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| A1 | [CREATE] | `package.json` — `@ai-devs/s03e03`, dep: `file:../boilerplate`, `zod`; scripts: `start`, `test`, `typecheck` | ✅ |
| A2 | [CREATE] | `config.ts` — re-export `HUB_VERIFY_URL`, `HUB_API_KEY`; `MAX_STEPS` (domyślnie 200), `BFS_MAX_DEPTH` (40), `TASK_NAME = "reactor"` | ✅ |
| A3 | [CREATE] | `tsconfig.json`, `index.ts` (re-export config) | ✅ |

**Szczegóły A2:**

```typescript
export { HUB_VERIFY_URL, HUB_API_KEY } from "../boilerplate/config.js";

export const REACTOR_MAX_STEPS = posInt("REACTOR_MAX_STEPS", 200);
export const REACTOR_BFS_MAX_DEPTH = posInt("REACTOR_BFS_MAX_DEPTH", 40);
export const REACTOR_TASK_NAME = "reactor";
```

---

### Faza B — Typy domenowe + symulator

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| B1 | [CREATE] | `src/domain/types.ts` — `Block`, `Player`, `Goal`, `GameState`, `Command`, `ReactorHubResponse` (Zod) | ✅ |
| B2 | [CREATE] | `src/domain/simulate.ts` — `moveBlocks`, `occupies`, `applyCommand`, `isSafe`, `stateKey` | ✅ |
| B3 | [CREATE] | `src/domain/fixtures/` — min. 1 plik `start-*.json` + `steps/` z parą command→response (nagrane z hub) | ✅ |
| B4 | [CREATE] | `src/domain/simulate.test.ts` — regresja ruchu bloczków i kolizji na fixture | ✅ |

**Szczegóły B2 — sygnatury:**

```typescript
export function moveBlocks(blocks: Block[]): Block[];
export function applyCommand(
  state: GameState,
  command: Command,
): GameState | "crush" | "goal";
export function parseGameState(data: ReactorHubResponse): GameState;
```

---

### Faza C — Planer

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| C1 | [CREATE] | `src/domain/planner.ts` — `chooseCommand(state): Command` | ✅ |
| C2 | [CREATE] | `chooseCommandBfs` — kolejka BFS, visited `Set<stateKey>`, depth limit | ✅ |
| C3 | [CREATE] | `chooseCommandHeuristic` — right jeśli bezpieczny → wait → left | ✅ |
| C4 | [CREATE] | `src/domain/planner.test.ts` — fixture states → expected command | ✅ |

**Szczegóły C1:**

```typescript
export function chooseCommand(state: GameState): Command {
  return chooseCommandBfs(state) ?? chooseCommandHeuristic(state);
}
```

**Log `[MYŚL]` (w `reactorRun`):** krótki opis — np. „BFS: right (3 kroki do celu)” lub „heurystyka: wait — blok w kol. 2 zagraża”.

---

### Faza D — Klient hub

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| D1 | [CREATE] | `src/hub/reactorClient.ts` — `sendCommand(cmd)`, walidacja `HUB_API_KEY`, Zod parse response | ✅ |
| D2 | [REUSE] | `fetchWithRetry` z `@ai-devs/agent-boilerplate` | ✅ |
| D3 | [REUSE] | `extractFlag` z `../boilerplate/src/tools/mcp/submit_to_hub.js` | ✅ |
| D4 | [CREATE] | `src/hub/reactorClient.test.ts` — mock fetch, flag extraction | ✅ |

**Payload:**

```json
{ "apikey": "<HUB_API_KEY>", "task": "reactor", "answer": { "command": "right" } }
```

---

### Faza E — Pętla gry

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| E1 | [CREATE] | `src/reactorRun.ts` — `runReactor()` z pętlą, logger, obsługa błędów | ✅ |
| E2 | [CREATE] | `run.ts` — entrypoint, `main().catch` → exit 1 | ✅ |
| E3 | [REUSE] | Logger: `logThought`, `logAction`, `logResult`, `logSystem`, `logResponse` z boilerplate | ✅ |

**Szczegóły E1:**

- Po `start`: jeśli od razu flaga (edge case) — zakończ.
- `logAction` label: `"[Hub]"` lub stała `HUB_LABEL` w `config.ts`.
- Truncate `logResult` do ~500 znaków (duże `board`).

---

### Faza F — Jakość

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| F1 | [REUSE] | `bun test` — wszystkie testy zielone | ✅ |
| F2 | [REUSE] | `bunx tsc --noEmit` — brak błędów | ✅ |
| F3 | [CREATE] | (Opcjonalnie) test integracyjny `planner + simulate` na pełnej ścieżce fixture bez HTTP | ✅ |

---

### Faza G — Dokumentacja repo

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| G1 | [CREATE] | `tasks/s03e03/README.md` | ✅ |
| G2 | [MODIFY] | Root `README.md` — wiersz `s03e03` | ✅ |
| G3 | [MODIFY] | `CHANGELOG.md` — Added `@ai-devs/s03e03` reactor | ✅ |
| G4 | [MODIFY] | `s03e03-reactor.research.md` — status Implemented (po H1) | ✅ |

**Szkic README:**

```text
bun install && bun run start   # wymaga tasks/.env (HUB_API_KEY)
Architektura: deterministyczny planer (BFS) — bez LLM.
Debug: https://hub.ag3nts.org/reactor_preview.html
```

---

### Faza H — E2E manual

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| H1 | [REUSE] | `cd tasks/s03e03 && bun run start` → stdout zawiera `{FLG:...}` | ✅ |

---

## 9. Kolejność realizacji

```text
A → B → C → D → E → F → G → H
```

B i D mogą być równolegle po A; C wymaga B; E wymaga C+D; F po E; G po F; H na końcu.

---

## 10. Human gate

**Przed implementacją:** akceptacja tego planu (scope = deterministyczny planer, bez LLM/MCP/agent).

**Po implementacji:** krótki review diff + manual E2E (H1).

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-01 | Plan początkowy — epizod s03e03 reactor, fazy A–H, BFS + heurystyka |
| 2026-06-01 | Implementacja A–H: epizod `@ai-devs/s03e03`, E2E `{FLG:INSTALLED}` |
