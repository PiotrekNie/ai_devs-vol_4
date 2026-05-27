# Plan wdrożenia — S02E05: epizod `drone` na `@ai-devs/agent-boilerplate`

**Normatywny research:** [s02e05-drone.research.md](s02e05-drone.research.md) (zaakceptowany — przejście do planu 2026-05-27)  
**Workspace:** `tasks/s02e05/` (greenfield)  
**Wzorzec epizodu:** import z pakietu (`file:../boilerplate`), **nie** vendoring jak s02e04.

**Weryfikacja UI:** brak — zadanie bez frontendu / Figma.

---

## 1. Zakres (scope)

**W zakresie:**

- **Nowy pakiet npm** `@ai-devs/s02e05` w `tasks/s02e05/` z zależnością `"@ai-devs/agent-boilerplate": "file:../boilerplate"`.
- **Bootstrap agenta** (`run.ts`): `createBoilerplateMcpServer`, domyślne MCP (`http_request`, `submit_to_hub`, `read_file`, `analyze_image_vision`), `finish_task`.
- **Prompty domenowe** (`src/prompts/system.md`, `drone_task.md`) — deliverables, ograniczenia domenowe, anty-wzorce; **bez** długiej § Strategia (planning phase §9.4.1).
- **Planning phase:** `resolveEnablePlanningPhase(true)` — domyślnie włączone; override `AGENT_ENABLE_PLANNING=false`.
- **Observational Memory:** `createObservationalMemoryHooks()` z boilerplate — włączone w `run.ts` (temat S02E05); opcjonalny `OM_PERSIST_DIR` z env.
- **Snapshot dokumentacji API:** `docs/context/drone-api.md` (+ `drone-api.raw.html`) — **faithful**, dla autorów spec; agent czyta **live** URL przez `http_request`.
- **Dokumentacja ludzka:** `docs/context/s02e05.md`, `README.md`, `CHANGELOG.md`.
- **Testy minimalne:** istnienie plików, stałe config, opcjonalnie asercje na snapshot MD; `bun test` + `bunx tsc --noEmit`.

**Poza zakresem:**

- Port QuickJS / `execute_code` ([sandbox-code-execution.research.md](../../../../boilerplate/docs/specs/sandbox-code-execution/sandbox-code-execution.research.md)).
- Własne narzędzia MCP domenowe (wrapper drona) — dopiero po nieudanym MVP runie.
- E2E z prawdziwym hubem w CI (wymaga sekretów).
- Modyfikacje `tasks/boilerplate/` (poza ewentualnymi poprawkami bugów odkrytych przy integracji — osobna decyzja).

---

## 2. Skrót researchu (kontekst planu)

| Element | Opis |
| --- | --- |
| Cel homework | Zbudować `answer.instructions[]` dla zadania hub **`drone`**; flaga `{FLG:...}`. |
| Przepływ | Vision (mapa) → live HTML docs → składanie instrukcji → iteracyjny `submit_to_hub`. |
| Pułapki docs | Wiele wariantów `set(...)`; mieszanie `/verify` z metodami drona. |
| Snapshot MD | Spec dla ludzi / promptów; **nie** domyślna ścieżka agenta. |
| Planning | Tura 0: vision → HTTP → hub; sekcja Revision po błędach verify. |

---

## 3. Analiza stanu obecnego

| Komponent | Stan | Działanie |
| --- | --- | --- |
| `tasks/s02e05/` | Brak | Utworzyć cały katalog |
| `@ai-devs/agent-boilerplate` | Gotowy | Import — `createAgent`, MCP, OM, planning |
| Wzorzec `run.ts` | s02e04 (vendored) | Adaptacja na importy z pakietu (README boilerplate §4) |
| Wzorzec promptu domenowego | `s02e04/mailbox_task.md` | Analogiczna struktura dla `drone_task.md` |
| `DRONE_MAP_URL` | Nieznany w repo | Env `DRONE_MAP_URL` + opis w README (URL z platformy kursu) |

---

## 4. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| Brak `HUB_API_KEY` / `DRONE_MAP_URL` | Czytelny błąd w README; `config.ts` bez logowania sekretów |
| Agent czyta snapshot zamiast live HTML | Prompt: **zawsze** `http_request` na `DRONE_DOCS_URL`; snapshot tylko w `docs/context/` |
| Duplikacja plan ↔ prompt | `drone_task.md` = Ograniczenia domenowe; bez numerowanej strategii |
| Zły plan w turze 0 | Sekcja Revision w planning; `AGENT_ENABLE_PLANNING=false` do debug |
| Zbyt niski `MAX_ITERATIONS` | Domyślnie podnieść w README (np. 30–50) via env; nie hardcodować w TS |
| Mapa PNG — ścieżka vs URL | `analyze_image_vision` przyjmuje `filepath` — agent pobiera mapę przez `http_request` do `data/` **lub** używa lokalnej kopii po pobraniu; opisać w `drone_task.md` |

---

## 5. Bezpieczeństwo

- Klucze wyłącznie z `tasks/.env` (`HUB_API_KEY`, klucze LLM) — nigdy w promptach ani snapshotach.
- `data/` w `.gitignore` — cache mapy / HTML z runów debug.
- Nie commitować `.env`; snapshot HTML bez wstrzykiwania `apikey` użytkownika.
- `read_file` — sandbox boilerplate (chroot względem katalogu zadania); nie rozszerzać poza epizod bez potrzeby.

---

## 6. Kryteria akceptacji (Definition of Done)

- [x] Z `tasks/s02e05/`: `bun install`, `bun test`, `bunx tsc --noEmit` — bez błędów.
- [ ] `bun --env-file=../.env run run.ts` — smoke ręczny po ustawieniu `DRONE_MAP_URL` w `tasks/.env`.
- [x] Importy wyłącznie z `@ai-devs/agent-boilerplate` — brak skopiowanego `src/agent/` w epizodzie.
- [x] Prompty wczytywane z `src/prompts/*.md`; `drone_task.md` zawiera deliverables i ograniczenia domenowe.
- [x] `enablePlanningPhase` domyślnie true w `run.ts`.
- [x] `createObservationalMemoryHooks()` podłączone w `createAgent`.
- [x] `docs/context/drone-api.md` z nagłówkiem snapshotu i disclaimerem.
- [x] Agent nie instruowany do `read_file` na snapshot w normalnym flow.
- [x] README opisuje uruchomienie, env i lekcja vs homework.

---

## 7. Plan fazowy i zadania

Typy: `[CREATE]`, `[MODIFY]`, `[REUSE]` (zgodnie z `@eversis-implement`).

### Faza A — Fundament pakietu

| ID | Typ | Zadanie | Definition of done |
| --- | --- | --- | --- |
| A1 | [CREATE] | **`package.json`:** `name: "@ai-devs/s02e05"`, `private`, `type: "module"`, `scripts`: `start`, `test`, `typecheck`; deps: `@ai-devs/agent-boilerplate`, `@modelcontextprotocol/sdk`, `zod`; dev: `@types/bun`. | [ ] `bun install` w katalogu epizodu kończy się sukcesem. |
| A2 | [CREATE] | **`tsconfig.json`:** skopiować opcje ze wzorca `tasks/s02e04/tsconfig.json` / boilerplate. | [ ] `bunx tsc --noEmit` działa (pusty lub minimalny TS). |
| A3 | [CREATE] | **`config.ts`:** re-export provider z `../config.js`; stałe `DRONE_DOCS_URL`, `DRONE_MAP_URL` (env + fallback URL docs); re-export `HUB_VERIFY_URL`, `DEFAULT_AGENT_MODEL`, `AGENT_MAX_OUTPUT_TOKENS` z boilerplate config. | [ ] Brak logowania kluczy; URL docs ma sensowny default. |
| A4 | [CREATE] | **`.gitignore`:** `data/`, opcjonalnie `workspace/memory/` (OM debug). | [ ] Cache runów nie trafia do git. |

### Faza B — Dokumentacja kontekstu i snapshot API

| ID | Typ | Zadanie | Definition of done |
| --- | --- | --- | --- |
| B1 | [CREATE] | **`docs/context/s02e05.md`:** opis zadania dla człowieka (cel, hub `drone`, format `instructions`, mapa, wskazówki kursu, env). Wzorzec: `tasks/s02e04/docs/context/s02e04.md`. | [ ] Zawiera URL docs i opis deliverable. |
| B2 | [CREATE] | **`docs/context/drone-api.raw.html`:** snapshot GET z `https://hub.ag3nts.org/dane/drone.html` (curl / bun one-liner / skrypt). | [ ] Plik w repo; bez kluczy użytkownika. |
| B3 | [CREATE] | **`docs/context/drone-api.md`:** konwersja **wierna** HTML→MD; nagłówek: data snapshotu, źródłowy URL, disclaimer „reference for authors — agent uses live URL”. Zachować pułapki `set(...)`. | [ ] Zawiera `setDestinationObject`, `set(x,y)`, `hardReset`, `flyToLocation`. |
| B4 | [CREATE] | **`scripts/sync-drone-docs.ts`** (opcjonalny): pobiera HTML → nadpisuje `drone-api.raw.html`; wypisuje przypomnienie o ręcznej aktualizacji MD. | [ ] Uruchamialny przez `bun run scripts/sync-drone-docs.ts`; nie w ścieżce agenta. |

### Faza C — Prompty

| ID | Typ | Zadanie | Definition of done |
| --- | --- | --- | --- |
| C1 | [CREATE] | **`src/prompts/system.md`:** bazowa dyscyplina ReAct (na bazie szablonu boilerplate) + reguły: `submit_to_hub` aż do `{FLG:...}`; live fetch docs; nie `finish_task` przed flagą. | [ ] Bez hardcodu URL mapy — odwołanie do `drone_task.md` / config. |
| C2 | [CREATE] | **`src/prompts/drone_task.md`:** struktura jak `mailbox_task.md`: **Deliverables** (`task_name: drone`, `answer.instructions[]`), **Ograniczenia domenowe** (vision→live HTML, pułapki `set`, `hardReset`, format stringów instrukcji), **Anty-wzorce** (snapshot zamiast URL, finish przed flagą). **Bez** numerowanej § Strategia. | [ ] Zgodne z research §4.5.1 i §7.1. |
| C3 | [REUSE] | **Szablon planning:** boilerplate `planning_turn.md` — bez kopii w epizodzie; tura 0 przez `enablePlanningPhase`. | [ ] Brak duplikatu `planning_turn.md` w s02e05. |

### Faza D — Bootstrap agenta

| ID | Typ | Zadanie | Definition of done |
| --- | --- | --- | --- |
| D1 | [CREATE] | **`run.ts`:** wczytanie `system.md` + `drone_task.md` → `instructions`; `createBoilerplateMcpServer` + `createMcpClient`; mapowanie `handlers` (MCP + `finish_task`); `createAIAdapter`; `createObservationalMemoryHooks()`; `resolveEnablePlanningPhase(true)`; `createAgent({ … })`; `processQuery` z user query zależnym od planning (jak s02e04 `run.ts`). | [ ] Wszystkie importy z `@ai-devs/agent-boilerplate`; agent startuje. |
| D2 | [CREATE] | **User query** w `run.ts`: krótka linia startowa — tura 0 + Ograniczenia domenowe; kolejność vision → live docs → submit_to_hub. | [ ] Query różni się gdy planning off (opcjonalnie). |
| D3 | [CREATE] | **`index.ts`** (cienki barrel, opcjonalny): re-export `config`, `run` entry — tylko jeśli potrzebny testom; inaczej pominąć. | [ ] Nie duplikuje logiki z `run.ts`. |

**Wzorzec importów (normatywny):**

```typescript
import { createAgent, createAIAdapter, createBoilerplateMcpServer,
  createObservationalMemoryHooks, resolveEnablePlanningPhase,
  createMcpClient, listMcpTools, callMcpTool, mcpToolsToOpenAI,
  mcpToolResultToText, finishTaskToolDefinition, finishTaskTool,
  MCP_LABEL, NATIVE_LABEL } from "@ai-devs/agent-boilerplate";
import { DEFAULT_AGENT_MODEL, AGENT_MAX_OUTPUT_TOKENS } from "@ai-devs/agent-boilerplate/config.js";
```

*(Dostosować ścieżki importu do faktycznego eksportu pakietu po `bun install`.)*

### Faza E — Testy i dokumentacja epizodu

| ID | Typ | Zadanie | Definition of done |
| --- | --- | --- | --- |
| E1 | [CREATE] | **`src/config.test.ts`** (lub `config.test.ts`): asercje na `DRONE_DOCS_URL`, że `DRONE_MAP_URL` czyta env. | [ ] Test przechodzi bez sieci. |
| E2 | [CREATE] | **`src/prompts/prompts.test.ts`:** pliki `system.md`, `drone_task.md` istnieją; zawierają `drone`, `instructions`, `submit_to_hub` (lub równoważne). | [ ] `bun test` green. |
| E3 | [CREATE] | **`docs/context/drone-api.test.ts`:** snapshot MD zawiera kluczowe frazy API (pułapki). | [ ] Ochrona przed przypadkowym wyczyszczeniem snapshotu. |
| E4 | [CREATE] | **`README.md`:** quick start, env (`HUB_API_KEY`, `DRONE_MAP_URL`, `AGENT_*`, `OM_*`, `AGENT_ENABLE_PLANNING`), odniesienie do lekcji `02_05_agent` / `02_05_sandbox` vs homework, linki do specs. | [ ] Instrukcja `bun run start`. |
| E5 | [CREATE] | **`CHANGELOG.md`:** wpis inicjalny epizodu. | [ ] Data + scope MVP. |

### Faza F — Opcjonalnie (po pierwszym runie na hubie)

| ID | Typ | Zadanie | Definition of done |
| --- | --- | --- | --- |
| F1 | [CREATE] | **Domenowe MCP** (wrapper `fetch_drone_docs`) — tylko jeśli model myli URL/body. | [ ] Decyzja w CHANGELOG; rejestracja obok defaults na serwerze z boilerplate. |
| F2 | [MODIFY] | **Dopracowanie `drone_task.md`** po feedbacku huba (iteracja promptów). | [ ] Wpis w CHANGELOG planu. |

---

## 8. Bramki jakości

Po każdej fazie (lub przed merge), z `tasks/s02e05/`:

```bash
bun install
bun test
bunx tsc --noEmit
```

Smoke (ręcznie, poza CI):

```bash
bun --env-file=../.env run run.ts
# wymaga: OPENAI_API_KEY lub OPENROUTER_API_KEY, HUB_API_KEY, DRONE_MAP_URL
```

---

## 9. Decyzje zamknięte (z research + dyskusji)

| # | Temat | Decyzja |
| --- | --- | --- |
| 1 | Integracja boilerplate | `file:../boilerplate`, bez vendoringu |
| 2 | Scope MVP | Scaffold + agent z promptami domenowymi + testy + snapshot docs |
| 3 | Sandbox QuickJS | Poza scope |
| 4 | Planning | Domyślnie włączone (`resolveEnablePlanningPhase(true)`) |
| 5 | OM | Włączone (`createObservationalMemoryHooks()`) |
| 6 | MCP domenowe | Opcja A — tylko defaults; F1 opcjonalnie później |
| 7 | Snapshot HTML→MD | Tak w `docs/context/`; agent używa live URL |
| 8 | `DRONE_MAP_URL` | Env — wartość z platformy kursu; dokumentacja w README |

---

## 10. Changelog planu

| Data | Zmiana |
| --- | --- |
| 2026-05-27 | Implementacja MVP (fazy A–E): pakiet `@ai-devs/s02e05`, run.ts, prompty, snapshot docs, testy. |

---

## 11. Checklist postępu (do odhaczania w `@eversis-implement`)

- [x] Faza A — A1, A2, A3, A4
- [x] Faza B — B1, B2, B3, B4 (B4 opcjonalny)
- [x] Faza C — C1, C2, C3
- [x] Faza D — D1, D2, D3
- [x] Faza E — E1, E2, E3, E4, E5
- [ ] Faza F — opcjonalnie po smoke na hubie
- [x] Kryteria akceptacji §6 — wszystkie punkty (smoke hub wymaga kluczy + DRONE_MAP_URL)
- [ ] Code review (`@eversis-review`)
