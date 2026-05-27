# Research — S02E05: scaffold `tasks/s02e05` na `@ai-devs/agent-boilerplate` (zadanie `drone`)

**Data:** 2026-05-27  
**Status:** Research — **zaakceptowany** (2026-05-27). Plan: [s02e05-drone.plan.md](s02e05-drone.plan.md).

**Zakres tego researchu:** utworzenie nowego katalogu epizodu `tasks/s02e05` opartego o pakiet **`@ai-devs/agent-boilerplate`** (`file:../boilerplate`), zgodnie z konwencją opisaną w [tasks/boilerplate/README.md](../../../../boilerplate/README.md).

**Poza zakresem (osobny research):** port QuickJS / code mode z lekcji `02_05_sandbox` → [sandbox-code-execution.research.md](../../../../boilerplate/docs/specs/sandbox-code-execution/sandbox-code-execution.research.md).

**Źródła:**

- `tasks/docs/boilerplate-documentation.md` — spec normatywna runtime
- `tasks/boilerplate/README.md` — Quick Start, OM, planning phase
- `tasks/boilerplate/docs/specs/sandbox-code-execution/sandbox-code-execution.research.md` — materiał kursu S02E05, zadanie `drone`
- `lessons/02_05_agent/` — lekcja OM (już w boilerplate jako `observational_memory/`)
- `lessons/02_05_sandbox/` — lekcja code mode (referencja edukacyjna, **nie** deliverable homeworku)
- `tasks/s02e03/` — epizod konsumujący boilerplate przez zależność `file:../boilerplate`
- `tasks/s02e04/` — epizod z vendored runtime + domenowe MCP (mailbox) — wzorzec alternatywny

---

## 1. Executive summary

**Werdykt:** utworzyć **`tasks/s02e05`** jako cienki epizod kursowy oparty wyłącznie o **`@ai-devs/agent-boilerplate`** (import z pakietu, **bez** kopiowania `src/agent/` jak w s02e04). Homework epizodu to **`drone`** — vision + HTTP + iteracyjna weryfikacja na hubie; **nie wymaga** sandboxa QuickJS ani nowych zależności WASM.

| Decyzja | Rekomendacja |
| --- | --- |
| Model integracji z boilerplate | **`file:../boilerplate`** (jak s02e03, README boilerplate) |
| Vendoring runtime (jak s02e04) | **Nie** — s02e04 to ewolucja historyczna; s02e05 ma być kanonicznym konsumentem pakietu |
| Sandbox / `execute_code` | **Nie** w scope epizodu (patrz osobny research sandbox) |
| Domyślne MCP z boilerplate | **Tak** — `http_request`, `submit_to_hub`, `read_file`, `analyze_image_vision` |
| Własne MCP domenowe (wrapper API drona) | **Opcjonalnie** — na start wystarczy `http_request`; dodać tylko jeśli prompt/model myli endpointy |
| Observational Memory | **Opt-in zalecany** — temat lekcji S02E05; długa sesja z wieloma turami hub |
| Planning phase (tura 0) | **Opt-in zalecany** — spójne z lekcją projektowania instrukcji |
| Pełna implementacja logiki `drone` | **Osobna faza** po akceptacji planu scaffoldu (research dopuszcza scaffold-only lub scaffold + minimalny prompt) |

---

## 2. Cel i zakres zadania kursowego (`drone`)

Epizod S02E05 (materiał kursu — transkrypt `markdowns/s02e05-projektowanie-agentow-1773962356.md`, **brak pliku w repo**; streszczenie w research sandbox §2):

### 2.1 Dwa filary lekcji vs homework

| Temat w lekcji | W `tasks/s02e05` |
| --- | --- |
| Projektowanie instrukcji, OM, protocol | Prompty w `src/prompts/`, opcjonalnie `createObservationalMemoryHooks()` |
| Sandbox / code mode (`02_05_sandbox`) | **Poza scope** — lekcja w `lessons/`, nie homework |

### 2.2 Wymagania homework `drone`

| Aspekt | Wymaganie |
| --- | --- |
| **Nazwa zadania (hub)** | `drone` |
| **Weryfikacja** | `POST /verify` → `{ task: "drone", answer: { instructions: [...] } }` |
| **Dokumentacja API** | HTML: `https://hub.ag3nts.org/dane/drone.html` (pułapki w treści — agent musi czytać uważnie) |
| **Mapa** | PNG z kluczem API (URL z materiałów kursu / hub — do potwierdzenia w runtime) |
| **Kluczowe kroki** | (1) Vision na mapę — siatka, sektor tamy; (2) czytanie dokumentacji HTML; (3) budowa sekwencji instrukcji; (4) iteracja na hub po błędach |
| **Wskazówki kursu** | Dwuetapowo: vision, potem tekst; oszczędzać tokeny; podejście reaktywne; `hardReset` przy chaosie w konfiguracji |

### 2.3 Naturalny przepływ agenta (boilerplate, bez sandboxa)

```text
analyze_image_vision (mapa)
  → http_request (drone.html + ewentualnie endpointy API z dokumentacji)
  → ReAct (korekty po feedbacku submit_to_hub)
  → submit_to_hub { task_name: "drone", answer: { instructions: [...] } }
  → finish_task po {FLG:...}
```

Pułapki w dokumentacji i częściowy feedback z huba pasują do **jawnej pętli ReAct** i logów `[WYNIK]` — zgodnie z celem edukacyjnym boilerplate.

### 2.4 Artefakt wyjściowy (answer)

- Pole **`instructions`**: tablica kroków sterowania dronem (format dokładny — z dokumentacji HTML / odpowiedzi huba).
- Agent powinien **nie** kończyć `finish_task` przed flagą `{FLG:...}` z huba (wzorzec jak s02e04 mailbox).

---

## 3. Stan repozytorium (gap analysis)

| Element | Stan |
| --- | --- |
| `tasks/s02e05/` | **Nie istnieje** |
| `@ai-devs/agent-boilerplate` | **Gotowy** — ReAct, MCP, OM, planning phase, testy |
| Materiał markdown S02E05 w repo | **Brak** pliku `markdowns/s02e05-*.md` (tylko streszczenie w research sandbox) |
| Lekcje `lessons/02_05_*` | Obecne — referencja OM i sandbox, nie runtime zadania |
| Precedens epizodu z boilerplate | s02e03 (`file:../boilerplate`); s02e04 (vendored + domenowe MCP) |

**Wniosek:** brak kodu do migracji — greenfield scaffold w `tasks/s02e05/`.

---

## 4. Architektura docelowa epizodu

### 4.1 Zależność od boilerplate (kanoniczna)

```json
{
  "name": "@ai-devs/s02e05",
  "dependencies": {
    "@ai-devs/agent-boilerplate": "file:../boilerplate",
    "@modelcontextprotocol/sdk": "^1.29.0",
    "zod": "^4.3.6"
  }
}
```

Importy z pakietu (przykład — patrz README boilerplate):

- `createAgent`, `createAIAdapter`, `createBoilerplateMcpServer`
- `createMcpClient`, `listMcpTools`, `callMcpTool`, `mcpToolsToOpenAI`, `mcpToolResultToText`
- `finishTaskTool`, `finishTaskToolDefinition`, `MCP_LABEL`, `NATIVE_LABEL`
- opcjonalnie: `createObservationalMemoryHooks`, `resolveEnablePlanningPhase`

**Nie kopiować** plików z `tasks/boilerplate/src/` do epizodu (różnica względem s02e04).

### 4.2 Proponowana struktura katalogów

```text
tasks/s02e05/
├── index.ts                 # opcjonalny barrel eksportów (jak s02e04)
├── run.ts                   # bootstrap: MCP in-process → createAgent → processQuery
├── config.ts                # re-export tasks/config.js + stałe epizodu (URL mapy, limity)
├── package.json
├── tsconfig.json
├── README.md
├── docs/
│   ├── context/
│   │   ├── s02e05.md            # ludzka dokumentacja zadania (jak s02e04.md)
│   │   ├── drone-api.md         # snapshot HTML→MD (spec dla autorów; nie dla agenta)
│   │   └── drone-api.raw.html   # opcjonalnie — surowy HTML snapshot
│   └── specs/
│       └── s02e05-drone/
│           ├── s02e05-drone.research.md   # ten plik
│           └── s02e05-drone.plan.md       # po akceptacji research
├── src/
│   ├── prompts/
│   │   ├── system.md        # dyscyplina ogólna (może rozszerzyć szablon boilerplate)
│   │   └── drone_task.md    # spec zadania: mapa, API, format instructions, pułapki
│   └── tools/mcp/           # opcjonalnie — tylko jeśli wrapper drona okaże się potrzebny
└── data/                    # opcjonalnie — pobrana mapa PNG (gitignore)
```

**Minimalny MVP scaffold** (faza implementacji po planie): `package.json`, `tsconfig.json`, `run.ts`, `src/prompts/system.md`, `src/prompts/drone_task.md`, `README.md` — agent startuje z domyślnym MCP boilerplate i generycznym promptem.

### 4.3 Bootstrap (`run.ts`) — wzorzec

Logicznie identyczny z [README boilerplate §4](../../../../boilerplate/README.md):

1. Wczytaj `system.md` + `drone_task.md` → `instructions`.
2. `createBoilerplateMcpServer()` + `createMcpClient()`.
3. Zbuduj `handlers` (MCP + `finish_task`).
4. `createAgent({ ai, instructions, tools, handlers, memory?, enablePlanningPhase? })`.
5. `processQuery(userQuery)` z treścią startową (np. „Rozpocznij zadanie drone…”).

Uruchomienie (konwencja repo):

```bash
cd tasks/s02e05
bun install
bun --env-file=../.env run run.ts
```

### 4.4 Prompty (wymaganie kursu)

| Plik | Zawartość |
| --- | --- |
| `system.md` | Szablon boilerplate + dyscyplina ReAct, `submit_to_hub` aż do flagi |
| `drone_task.md` | Kontekst domenowy: URL dokumentacji, strategia vision→HTTP, format `instructions`, reakcja na błędy huba, wzmianka o `hardReset` jeśli API zwraca chaos |

Prompty **wyłącznie** w `.md`; wczytywanie przez `readFileSync` — bez hardcodu w TS.

### 4.5 Pamięć i planowanie (S02E05)

| Mechanizm | Rekomendacja |
| --- | --- |
| `enablePlanningPhase` / `AGENT_ENABLE_PLANNING` | **Tak — włączyć domyślnie** (patrz **§4.5.1**) |
| `createObservationalMemoryHooks()` | Przy długich iteracjach hub + wiele tur `http_request` |
| Własny `MemoryHooks` (jak mailbox) | **Nie na start** — brak wielowątkowego stanu jak w s02e04 |

#### 4.5.1 Czy warto `AGENT_ENABLE_PLANNING` w zadaniu `drone`?

**Werdykt: tak — jako domyślne włączenie w epizodzie, z możliwością wyłączenia env.**

| Argument za | Szczegół |
| --- | --- |
| **Zgodność z lekcją S02E05** | Epizod uczy projektowania instrukcji; tura 0 to ten sam wzorzec co w materiale (plan przed akcją). |
| **Wskazówka kursu: dwuetapowo** | „Najpierw vision (mapa), potem tekst (HTML)” — naturalnie wpada w sekcję **Tools & order** szablonu `planning_turn.md`. |
| **Wielofazowy przepływ** | Mapa → docs → składanie `instructions` → iteracja hub — plan uporządkuje kolejność bez długiej checklisty w prompcie. |
| **Bezpłatna tura** | Tura 0 **nie** liczy się do `MAX_ITERATIONS` — dodatkowy koszt to jedno wywołanie LLM (~200–400 słów), nie skrócenie budżetu ReAct. |
| **Precedens w repo** | s02e04: `resolveEnablePlanningPhase(true)` + skrócony prompt domenowy (§9.4.1 initial-planning research). |
| **Współpraca z OM** | `## Working plan` zostaje w `instructions` — nie podlega sealowaniu Observer (boilerplate OM plan). |

| Argument przeciw / ryzyko | Mitygacja |
| --- | --- |
| Homework jest **reaktywny** (feedback huba) | Szablon tury 0 ma sekcję **Revision** — plan ma być aktualizowany po błędach verify, nie sztywny kontrakt. |
| Plan przed zobaczeniem pułapek w HTML | W `drone_task.md` zostawić **Ograniczenia domenowe** (np. „wiele wariantów `set`”) — wejście do planu, nie pełna procedura. |
| Duplikacja prompt ↔ `[PLAN]` | Przy włączonej fladze **skrócić** `drone_task.md` wg §9.4.1 — bez numerowanej „Strategii krok po kroku”. |
| Dodatkowy koszt tokenów | Jednorazowa tura 0; tańszy model na planie możliwy przez ten sam `AGENT_MODEL`. |

**Wzorzec implementacji (jak s02e04):**

```typescript
const enablePlanningPhase = resolveEnablePlanningPhase(true);
// true w kodzie = domyślnie włączone;
// AGENT_ENABLE_PLANNING=false wyłącza bez zmiany kodu (szybkie runy debug).
```

**User query przy planning on:** jedna linia typu: *„Tura 0: plan z Ograniczeniami domenowymi. Kolejność: vision mapy → live HTML docs → submit_to_hub aż do flagi.”*

**Kiedy wyłączyć:** smoke test scaffoldu, porównanie A/B kosztu, lub gdy model generuje zły plan i utrwala błąd — wtedy `AGENT_ENABLE_PLANNING=false` bez refaktoru.

**Nie zastępuje:** live fetch HTML ani iteracji na hubie — plan tylko ustawia ramy; pułapki `set(...)` agent nadal odkrywa z URL.

### 4.6 Narzędzia MCP — czy dodać domenowe?

| Opcja | Opis | Kiedy |
| --- | --- | --- |
| **A — tylko boilerplate** | `http_request` do HTML i API drona | **Domyślnie** — mniejszy diff, zgodne z README |
| **B — cienki wrapper** | np. `drone_command`, `fetch_drone_docs` rejestrowane obok defaults przez `server.registerTool` | Gdy model myli metody / body POST |

Research rekomenduje **A** na scaffold; **B** tylko po pierwszym nieudanym runie.

---

## 5. Porównanie wzorców epizodów

| Aspekt | s02e03 | s02e04 | s02e05 (docelowo) |
| --- | --- | --- | --- |
| Boilerplate | `file:../boilerplate` | Vendored kopia w `src/` | **`file:../boilerplate`** |
| Domenowe MCP | Własny serwer (failure tools) | `search_mail`, `download_mail_content` | **Brak na start** (vision + HTTP) |
| OM | Własna implementacja (historycznie) | Mailbox memory hooks | **`createObservationalMemoryHooks()` z pakietu** |
| Planning | — | `enablePlanningPhase` | **Tak (zalecane)** |
| Testy | Skrypty / minimalne | `bun test` rozbudowane | **`bun test` minimalne** (config, prompt load, opcjonalnie mock hub) |

---

## 6. Konfiguracja i środowisko

Wspólne z `tasks/.env` (ładowane przez `bun --env-file=../.env`):

| Zmienna | Wymagana | Użycie w `drone` |
| --- | --- | --- |
| `OPENAI_API_KEY` / `OPENROUTER_API_KEY` | **Tak** | LLM + vision |
| `HUB_API_KEY` | **Tak** | `submit_to_hub`, ewentualnie URL mapy z API key |
| `AGENT_MODEL` | Nie | Domyślnie z boilerplate; kurs sugeruje tańszy model |
| `AGENT_VISION_MODEL` | Nie | `analyze_image_vision` |
| `AGENT_MAX_ITERATIONS` | Nie | Podnieść vs domyślne 10 — wiele iteracji hub |
| `AGENT_ENABLE_PLANNING` | Nie | Włączenie tury 0 |
| `OM_PERSIST_DIR` | Nie | Debug obserwacji (opcjonalnie `./workspace/memory`) |

Stałe epizodu w `config.ts` (propozycja):

- `DRONE_DOCS_URL = 'https://hub.ag3nts.org/dane/drone.html'`
- `DRONE_MAP_URL` — z materiałów kursu (open question)
- `HUB_VERIFY_URL`, re-export z boilerplate / `tasks/config.js`

---

## 7. Ryzyka i edge case’y

| Ryzyko | Mitygacja |
| --- | --- |
| Pułapki w dokumentacji HTML | Patrz **§7.1** — snapshot MD dla specyfikacji; agent czyta **live** URL |
| Błędne `instructions` z huba | Pętla `submit_to_hub` + interpretacja feedbacku; nie `finish_task` wcześniej |
| Koszt tokenów (vision + długi HTML) | Vision tylko na mapę; agent pobiera HTML raz na sesję; opcjonalnie zapis w `data/` (gitignore) z runu |
| Mapa niedostępna offline | `http_request` lub pobranie do `data/` z `.gitignore` |
| Brak transkryptu S02E05 w repo | Uzupełnić `docs/context/s02e05.md` ręcznie / sync z platformy kursu |
| Rozjazd s02e04 (vendored) vs s02e05 (pakiet) | README epizodu wyjaśnia: s02e05 = kanoniczny konsument boilerplate |

### 7.1 Pułapki w HTML — snapshot lokalny vs źródło dla agenta

**Pytanie:** czy pobrać `drone.html`, przekonwertować na Markdown i zapisać lokalnie jako element specyfikacji?

**Odpowiedź: tak — ale w roli dokumentacji deweloperskiej / snapshotu, nie jako skrót dla agenta w runtime.**

#### Co widać w live docs (`https://hub.ag3nts.org/dane/drone.html`)

Główne pułapki (potwierdzone w snapshot 2026-05-27):

- **Przeciążona nazwa `set(...)`** — ten sam symbol dla: sektor mapy `set(x,y)`, silniki `set(engineON|engineOFF)`, moc `set(N%)`, wysokość `set(Nm)`, cele misji `set(video|image|destroy|return)`. System „rozpoznaje właściwe polecenie na podstawie parametrów” — łatwo wysłać złą wariantację.
- **Mieszanie warstw** — tabela endpointów opisuje `POST /verify` obok metod sterowania dronem (to hub verify, nie osobne API drona).
- **Wiele metod informacyjnych/kalibracyjnych** — `selfCheck`, `getConfig`, `hardReset` itd. — kuszą do zbędnych kroków przed właściwą misją.
- **Format `instructions`** — stringi w stylu `set(3,4)`, `setDestinationObject(BLD1234PL)`, nie JSON wewnątrz tablicy.

Homework **polega** na uważnym czytaniu takiej dokumentacji — nie na dostarczeniu agentowi „oczyszczonej” wersji.

#### Rekomendowany model dwuwarstwowy

| Warstwa | Plik | Kto czyta | Cel |
| --- | --- | --- | --- |
| **Snapshot spec (repo)** | `docs/context/drone-api.md` (+ opcjonalnie `drone-api.raw.html`) | Człowiek, autor promptów, review, testy kontraktu | Stabilna referencja przy pisaniu `drone_task.md`; diff przy odświeżeniu snapshotu |
| **Źródło runtime (agent)** | Live URL `DRONE_DOCS_URL` via **`http_request`** | Agent w pętli ReAct | Umiejętność kursu: parsowanie pułapkowej docs + reakcja na feedback huba |

**Nie** podawać agentowi `read_file` na `docs/context/drone-api.md` jako domyślnej ścieżki — to omija cel zadania (chyba że świadomy tryb debug / `DRONE_USE_LOCAL_DOCS=1` tylko lokalnie).

#### Procedura snapshotu (do planu)

1. Jednorazowo (lub skryptem `scripts/sync-drone-docs.ts`): `http_request` GET → zapis `docs/context/drone-api.raw.html`.
2. Konwersja wierna HTML→MD (np. `turndown`, pandoc, lub ręczna kuratela **bez** usuwania pułapek).
3. Nagłówek w MD: data snapshotu, URL źródłowy, disclaimer „nie authoritative dla agenta”.
4. Opcjonalnie: test snapshotu — assert że MD zawiera kluczowe frazy (`setDestinationObject`, `set(x,y)`, `hardReset`).

#### Korzyści snapshotu MD w specyfikacji

- Autor `drone_task.md` wie, **jakie** pułapki opisać w promptcie (np. „uwaga na wiele wariantów `set`”) bez halucynacji.
- Review / plan / QA mają stały materiał w repo (offline, diff w PR).
- Tańsze iteracje promptów — bez wielokrotnego fetch HTML przy edycji promptu.

#### Ryzyka snapshotu (dlaczego nie zastępuje live fetch)

- Kurs może zaktualizować HTML — snapshot się zestarzeje (mitygacja: data w nagłówku + okazjonalny refresh).
- **Uproszczenie przy konwersji** — usunięcie „szumu” = usunięcie pułapek; konwersja musi być **faithful**.
- Wstrzyknięcie snapshotu do kontekstu agenta = obejście ćwiczenia z lekcji.

#### Wniosek do planu

| Decyzja | Rekomendacja |
| --- | --- |
| Snapshot MD w `docs/context/` | **Tak** — jako element specyfikacji epizodu |
| Agent czyta snapshot zamiast URL | **Nie** (domyślnie) |
| Opcjonalny zapis HTML z runu agenta | **Tak** — `data/drone-docs.html` (gitignore) do debugu |
| Skrypt odświeżania snapshotu | **Opcjonalnie** — mały skrypt w `scripts/`, nie w ścieżce krytycznej agenta |

---

## 8. Acceptance criteria (do fazy planu)

Research uznaje się za zamknięte po wyborze człowieka:

### 8.1 Scope implementacji

- [ ] **Scaffold only** — struktura + bootstrap + prompty-szkielet, bez dopracowanej logiki `drone`
- [ ] **Scaffold + agent MVP** — działający agent z promptami domenowymi, gotowy do iteracji na hubie
- [ ] **Scaffold + testy** — jak wyżej + minimalne testy jednostkowe

### 8.2 Decyzje techniczne

- [ ] Potwierdzenie: **`file:../boilerplate`** (bez vendoringu)
- [ ] **Bez** sandbox QuickJS w tym epizodzie (osobny track — sandbox research)
- [ ] OM: **włączone** / **wyłączone** na start
- [ ] Planning phase: **włączone domyślnie** (`resolveEnablePlanningPhase(true)`); env `AGENT_ENABLE_PLANNING=false` do debug
- [ ] Domenowe MCP: **A** (tylko defaults) / **B** (wrapper)

### 8.3 Definition of done (implementacja)

- [ ] `bun install` + `bun --env-file=../.env run run.ts` startuje bez błędów TypeScript
- [ ] Agent ładuje prompty z `src/prompts/*.md`
- [ ] Dostępne narzędzia: domyślny zestaw boilerplate + `finish_task`
- [ ] `bunx tsc --noEmit` przechodzi w katalogu epizodu
- [ ] README opisuje cel, env, uruchomienie, odniesienie do lekcji vs homework
- [ ] Snapshot `docs/context/drone-api.md` (faithful HTML→MD) z datą i disclaimerem; agent domyślnie używa live URL

---

## 9. Open questions (do człowieka)

1. **Scope:** scaffold only, czy od razu agent MVP z pełnymi promptami `drone`?
2. **URL mapy PNG** — czy masz dokładny URL z platformy kursu (do wpisania w `config.ts` / `drone_task.md`)?
3. **OM i planning** — włączyć domyślnie w `run.ts`, czy zostawić za flagą env?
4. **Sandbox QuickJS** — potwierdzenie, że **nie** wchodzi w scope tego epizodu (osobny research już istnieje)?
5. **Materiał kursu** — czy dostarczysz / dodasz `markdowns/s02e05-*.md` lub treść do `docs/context/s02e05.md` przed planem?

---

## 10. Suggested next steps

1. **Ty:** zaakceptuj research lub odpowiedz na §9 (scope + URL mapy + OM/planning).
2. **Po akceptacji:** `@eversis-implement` → faza **Plan** → plik `s02e05-drone.plan.md`.
3. **Implementacja** tylko po akceptacji planu; **bez** nowych zależności npm poza boilerplate + MCP + zod.
4. **Opcjonalnie równolegle:** decyzja z [sandbox-code-execution.research.md](../../../../boilerplate/docs/specs/sandbox-code-execution/sandbox-code-execution.research.md) — nie blokuje scaffoldu s02e05.

---

## 11. Referencje

Boilerplate — domyślny MCP server:

```typescript
// tasks/boilerplate/src/mcp/server.ts — createBoilerplateMcpServer()
// Rejestruje: http_request, submit_to_hub, read_file, analyze_image_vision
```

Epizod s02e04 — wzorzec bootstrap (vendored, do adaptacji na import z pakietu):

```51:93:tasks/s02e04/run.ts
async function main() {
  const mcpServer = createS02e04McpServer();
  const mcpClient = await createMcpClient(mcpServer);
  // ... handlers + createAgent + processQuery
}
```

Research sandbox — homework nie wymaga code mode:

```58:74:tasks/boilerplate/docs/specs/sandbox-code-execution/sandbox-code-execution.research.md
### 2.3 Zadanie domowe: `drone` (nie sandbox)
...
analyze_image_vision (mapa) → http_request (dokumentacja HTML) → ReAct + submit_to_hub
```
