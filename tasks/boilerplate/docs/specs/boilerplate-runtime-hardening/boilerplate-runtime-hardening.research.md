# Research — Boilerplate runtime hardening (post S02E05 smoke)

**Data:** 2026-05-27  
**Status:** Research — **oczekuje na akceptację** przed planem implementacji.  
**Trigger:** smoke run `tasks/s02e05` (`drone`) + analiza rozjazdów epizod ↔ boilerplate po naprawach ad-hoc.

**Powiązane artefakty:**

- [s02e05-drone.research.md](../../../../s02e05/docs/specs/s02e05-drone/s02e05-drone.research.md) — scaffold epizodu
- [s02e05-drone-smoke-findings.research.md](../../../../s02e05/docs/specs/s02e05-drone/s02e05-drone-smoke-findings.research.md) — blokada mapy / vision (Opcja A zaimplementowana)
- [s02e05-drone.plan.md](../../../../s02e05/docs/specs/s02e05-drone/s02e05-drone.plan.md) — plan MVP epizodu
- [boilerplate-documentation.md](../../../docs/boilerplate-documentation.md) — spec normatywna runtime

---

## 1. Executive summary

**Werdykt:** smoke run `drone` ujawnił **trzy klasy problemów** — część już naprawiona lokalnie, reszta wymaga **dokończenia hardeningu boilerplate** + drobnych poprawek w `s02e05`.

| Klasa | Przykład | Gdzie naprawić |
| --- | --- | --- |
| **A — bug współdzielony MCP** | `submit_to_hub` nie akceptował `answer.instructions: string[]` | **Boilerplate** (częściowo zrobione) |
| **B — luka bootstrap epizodu** | brak `maxIterations`, brak `ask_human` w `run.ts` | **Epizod** (częściowo zrobione w s02e05) |
| **C — mylenie kontraktu przez model** | HTML docs pokazują pełne POST body z `apikey`; agent „nie może legalnie zweryfikować” | **Prompty epizodu + szablon boilerplate + opis narzędzia** (częściowo zrobione) |
| **D — dryft / martwy kod** | `s02e04` ma własny `submit_to_hub` ze starym schematem; `AGENT_VISION_MODEL` w `s02e05/config.ts` nie jest podpięty | **Sync opcjonalny + cleanup epizodu** |

**Rekomendacja:** zaakceptować **fazę hardeningu boilerplate** (helper native tools, README, `system.md`) jako mały, współdzielony diff; **nie** podbijać globalnych defaultów (`MAX_ITERATIONS=10`, `gpt-4o-mini`) — epizody nadpisują jawnie. Walidacja: ponowny smoke `s02e05` z `HUB_API_KEY` + `DRONE_MAP_URL`.

---

## 2. Cel i zakres

### 2.1 Cel

Zweryfikować błędy zgłoszone przez agenta podczas smoke (`MAX_ITERATIONS`, `apikey`, schemat submit, brak `ask_human`) oraz zaproponować **minimalny, spójny** zestaw zmian — priorytet na boilerplate jako kanonicznym runtime dla nowych epizodów (wzorzec `s02e05`, nie vendored `s02e04`).

### 2.2 W scope

- Audyt stanu po naprawach ad-hoc (2026-05-27).
- Propozycja zmian w `@ai-devs/agent-boilerplate`.
- Propozycja zmian pozostałych w `tasks/s02e05`.
- Ocena dryftu `tasks/s02e04` (informacyjnie — bez migracji w tej fazie, chyba że human zażąda).

### 2.3 Poza scope

- Port QuickJS / sandbox (`sandbox-code-execution.research.md`).
- Dopracowanie logiki misji `drone` (sekwencja `instructions`, ID obiektu z mapy) — to homework modelu, nie runtime.
- `analyze_image_vision` z parametrem `url` (Opcja C ze smoke findings) — osobny ticket.
- Publikacja QA do Jira.

---

## 3. Zweryfikowane błędy (stan na 2026-05-27)

### 3.1 `MAX_ITERATIONS (10)` mimo config epizodu 50

| Aspekt | Ustalenie |
| --- | --- |
| **Objaw** | Log: `[SYSTEM] MAX_ITERATIONS (10) reached without a final answer.` |
| **Przyczyna** | `s02e05/run.ts` nie przekazywał `maxIterations` do `createAgent`; boilerplate domyślnie czyta `AGENT_MAX_ITERATIONS` z **własnego** `config.ts` (fallback **10**). |
| **Mylący sygnał** | User wskazywał `s02e04/config.ts` (default 50) — ten plik **nie dotyczy** epizodu na boilerplate. |
| **Status** | **NAPRAWIONE** w `s02e05/run.ts`: `maxIterations: MAX_ITERATIONS` (default 50 z epizodu). |

### 3.2 Brak `apikey` / „błędny schemat submittera”

| Aspekt | Ustalenie |
| --- | --- |
| **Objaw** | Agent: brak `apikey`, dedykowany submit ma zły schemat, nie może dokończyć weryfikacji. |
| **Przyczyna 1 (fałszywy alarm)** | Live HTML (`drone.html`) i przykłady JSON pokazują **pełne body** `{ apikey, task, answer }`. Narzędzie `submit_to_hub` przyjmuje `{ task_name, answer }` i **wstrzykuje** `apikey` z `HUB_API_KEY` (`executeSubmitToHub`, linie 60–64 boilerplate). |
| **Przyczyna 2 (realny bug)** | Schemat Zod `answer: z.record(..., hubAnswerLeaf)` **nie dopuszczał** wartości-tablic (`instructions: string[]`). Model mógł traktować submit jako niezgodny z zadaniem `drone`. |
| **Status** | **Częściowo NAPRAWIONE:** schemat + opisy w boilerplate; prompty `s02e05` (`system.md`, `drone_task.md`). **Wymaga smoke** z ustawionym `HUB_API_KEY`. |

### 3.3 Brak `ask_human` w runtime mimo promptu

| Aspekt | Ustalenie |
| --- | --- |
| **Objaw** | Agent przy blokadzie nie miał narzędzia wskazanego w promptach. |
| **Przyczyna** | `ask_human` istnieje w boilerplate, ale **epizod musi ręcznie** dodać definicję + handler (jak `finish_task`). `s02e05/run.ts` początkowo rejestrował tylko `finish_task`. Ten sam wzorzec w README boilerplate (Quick Start). |
| **Status** | **NAPRAWIONE** w `s02e05/run.ts`. **Pozostaje:** README + brak helpera → ryzyko powtórki w kolejnych epizodach. |

### 3.4 Mapa PNG / vision (wcześniejszy smoke)

| Aspekt | Ustalenie |
| --- | --- |
| **Objaw** | Agent nie mógł zapisać mapy → brak vision. |
| **Przyczyna** | Brak `write_file`; `http_request` korumpuje binaria przez `response.text()`. |
| **Status** | **NAPRAWIONE** — prefetch mapy w `ensureDroneMapCached()` przed pętlą ([s02e05-drone-map-prefetch.plan.md](../../../../s02e05/docs/specs/s02e05-drone/s02e05-drone-map-prefetch.plan.md)). |

### 3.5 `AGENT_VISION_MODEL` w `s02e05/config.ts`

| Aspekt | Ustalenie |
| --- | --- |
| **Objaw** | User pytał o poprawność `DEFAULT_AGENT_MODEL` / `AGENT_VISION_MODEL`. |
| **Przyczyna** | `DEFAULT_AGENT_MODEL` — podpięty w `createAIAdapter` ✅. `AGENT_VISION_MODEL` w epizodzie — **martwy eksport**; `analyze_image_vision` importuje model z **`boilerplate/config.ts`** (default `gpt-4o-mini`). Env `AGENT_VISION_MODEL` działa globalnie (ten sam process.env), ale default z epizodu (`gpt-5.4`) **nie obowiązuje** bez env. |
| **Status** | **OTWARTE** — cleanup: usunąć mylący eksport lub re-export z dokumentacją; opcjonalnie przekazywanie vision model do MCP (wymaga API boilerplate). |

### 3.6 Dryft `s02e04` vs boilerplate

| Plik | Stan |
| --- | --- |
| `tasks/s02e04/src/tools/mcp/submit_to_hub.ts` | **Stary schemat** (bez `string[]` w record); ma walidację mailbox — OK dla mailbox, **nie** dla hipotetycznego reuse przez drone. |
| `tasks/s02e04/run.ts` | Nie rejestruje `ask_human` (jak wcześniejszy s02e05). |
| **Rekomendacja** | **Nie migrować** s02e04 w tej fazie; przy kolejnym dotyku zsynchronizować schemat `submit_to_hub` lub oznaczyć epizod jako legacy vendored. |

---

## 4. Gap analysis — co już jest vs co brakuje

| Element | Stan | Priorytet |
| --- | --- | --- |
| `submit_to_hub` — tablice w `answer` | ✅ boilerplate | — |
| `submit_to_hub` — opis `apikey` injected | ✅ boilerplate + s02e05 prompty | — |
| `submit_to_hub.test.ts` (drone schema) | ✅ boilerplate | — |
| `maxIterations` w s02e05 | ✅ | — |
| `ask_human` w s02e05 | ✅ | — |
| Map prefetch s02e05 | ✅ | — |
| Helper `createNativeToolBundle()` (tools + handlers) | ❌ | **P1** |
| README Quick Start — `ask_human` + `maxIterations` | ❌ | **P1** |
| `boilerplate/src/prompts/system.md` — submit vs full POST | ❌ | **P2** |
| `s02e05` — usunąć nieużywany import `AGENT_VISION_MODEL` / doprecyzować config | ❌ | **P2** |
| `resolveModelForProvider` w epizodzie (OpenRouter) | ❌ opcjonalnie | **P3** |
| Sync `submit_to_hub` w s02e04 | ❌ opcjonalnie | **P3** |
| Smoke E2E do flagi `{FLG:...}` | ❌ niepotwierdzone | **P1 walidacja** |

---

## 5. Propozycje zmian (rekomendowane)

### 5.1 Opcja A — **Rekomendowana:** minimalny hardening boilerplate + cleanup s02e05

**Boilerplate**

1. **`createNativeToolBundle()`** (nazwa do ustalenia w planie) w `src/tools/native/` lub `src/agent/bootstrap.ts`:
   - zwraca `{ toolDefinitions, handlers }` dla `finish_task` + `ask_human`;
   - używa `NATIVE_LABEL` z loggera;
   - eksport z `index.ts`.
2. **README.md** — zaktualizować § Quick Start:
   - użyć helpera lub jawnej listy obu native tools;
   - wspomnieć `maxIterations` / `AGENT_MAX_ITERATIONS` (epizod nadpisuje default 10);
   - doprecyzować `submit_to_hub`: tylko `task_name` + `answer`.
3. **`src/prompts/system.md`** — jedna sekcja o `submit_to_hub` vs pełne body POST; wzmianka o `ask_human`.
4. **Test jednostkowy** helpera (handlers zawierają oba klucze).

**s02e05**

1. Refactor `run.ts` na `createNativeToolBundle()` (mniej copy-paste).
2. Config: usunąć martwy `AGENT_VISION_MODEL` **lub** komentarz + README „vision czyta boilerplate config; ustaw env”.
3. Usunąć nieużywany import z `run.ts` jeśli zostaje tylko env path.

**Akceptacja:** `bun test` + `tsc` w boilerplate i s02e05; smoke run z pełnym `.env` — agent woła `submit_to_hub` z `instructions[]` bez raportu o braku `apikey`.

### 5.2 Opcja B — tylko dokumentacja (bez helpera)

- README + `system.md` jak wyżej;
- s02e05 bez refactoru `run.ts`.

**Minus:** każdy nowy epizod nadal kopiuje ~20 linii handlers.

### 5.3 Opcja C — rozszerzenie MCP (później)

- `analyze_image_vision({ url })` lub `write_file` w boilerplate;
- **Nie** w tej fazie — prefetch w epizodzie wystarczy dla `drone`.

---

## 6. User stories i acceptance criteria

### US-1 — Deweloper epizodu

**Jako** autor nowego epizodu na boilerplate  
**chcę** jednym importem dostać standardowe native tools  
**aby** nie zapomnieć `ask_human` i nie duplikować handlerów.

**AC:**

- [ ] Eksportowany helper rejestruje `finish_task` i `ask_human`.
- [ ] README pokazuje helper w Quick Start.
- [ ] Istnieje test, że oba handlery są obecne.

### US-2 — Agent `drone`

**Jako** agent rozwiązujący homework  
**chcę** poprawnie wywołać `submit_to_hub` dla `instructions: string[]`  
**aby** hub weryfikował misję bez ręcznego `apikey`.

**AC:**

- [ ] Zod akceptuje `{ task_name: "drone", answer: { instructions: ["..."] } }` (test ✅).
- [ ] Prompty mówią, że `apikey` jest wstrzykiwany (s02e05 ✅; boilerplate template — do zrobienia).
- [ ] Smoke: brak komunikatu agenta o „błędnym schemacie” / braku `apikey` przy poprawnym env.

### US-3 — Operator kursu

**Jako** użytkownik uruchamiający `bun run run.ts`  
**chcę** przewidywalny limit iteracji i możliwość `ask_human` przy blokadzie  
**aby** debug nie kończył się fałszywym `finish_task` po 10 turach.

**AC:**

- [ ] s02e05: `maxIterations` z epizodu (50 default) ✅.
- [ ] s02e05: `ask_human` w tools ✅.
- [ ] Dokumentacja env spójna z faktycznymi defaultami epizodu.

---

## 7. Ryzyka i mitigacje

| Ryzyko | Mitigacja |
| --- | --- |
| Helper zbyt „magiczny” | Cienki export — bez auto-MCP; epizod nadal składa MCP + native bundle |
| JSON Schema Responses API przy głębszym `answer` | Trzymać `hubAnswerValue` płytkie (scalar + `string[]`); unikać `z.unknown()` |
| s02e04 dryft | Osobna notatka w CHANGELOG boilerplate; sync tylko on-demand |
| Smoke bez kluczy | README: `HUB_API_KEY` wymagane; agent `ask_human` gdy brak env (komunikat z `executeSubmitToHub`) |

---

## 8. Open questions

1. **Nazwa helpera:** `createNativeToolBundle` vs `createDefaultNativeTools` — preferencja zespołu?
2. **s02e04 sync:** czy w tej samej fazie przenieść schemat `submit_to_hub` do vendored kopii?
3. **Vision model:** wystarczy env `AGENT_VISION_MODEL`, czy epizod ma re-exportować z własnym defaultem (wymaga hooka w boilerplate)?
4. **Smoke gate:** czy akceptacja researchu = obowiązkowy run do `{FLG:...}` przed zamknięciem epizodu, czy wystarczy brak błędów runtime?

---

## 9. Proponowane next steps (po akceptacji research)

1. **Plan:** `@eversis-implement` → `boilerplate-runtime-hardening.plan.md` (fazy P1–P3).
2. **Implement:** helper + README + `system.md` + refactor `s02e05/run.ts` + cleanup config.
3. **Verify:** `bun test`, `tsc`, smoke `s02e05` z pełnym `tasks/.env`.
4. **Review:** `eversis-review` na diff boilerplate + s02e05.

---

## 10. Changelog researchu

| Data | Autor | Opis |
| --- | --- | --- |
| 2026-05-27 | Context / EM | Wersja początkowa — audyt smoke S02E05, propozycja hardeningu boilerplate |
