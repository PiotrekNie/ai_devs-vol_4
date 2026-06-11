# S03E05 — savethem (planowanie trasy posłańca) — research

**Task:** Przeanalizować wdrożenie i rozwiązanie zadania domowego **`savethem`** w `tasks/s03e05/` z użyciem `@ai-devs/agent-boilerplate`, z naciskiem na **wartość edukacyjną** (lekcja S03E05: niedeterminizm jako przewaga).

**Data:** 2026-06-11  
**Status:** Implemented — epizod `tasks/s03e05/` (testy + tsc PASS); hub verified `{FLG:INTACTCITY}` (rocket route, 2026-06-11).  
**Plan:** [savethem.plan.md](savethem.plan.md) — zrealizowany.  
**Powiązany research (boilerplate, nie homework):** [s03e05-nondeterministic-models.research.md](../../../boilerplate/docs/specs/s03e05-nondeterministic-models/s03e05-nondeterministic-models.research.md) — §2.4 docs już zrealizowany.

**Źródła:**

- `markdowns/s03e05-niedeterministyczna-natura-modeli-jako-przewaga-1774562727.md` — opis zadania + fabuła
- `tasks/docs/boilerplate-documentation.md` — §2.4 (mapowanie savethem → `http_request`)
- `tasks/boilerplate/` — ReAct, `http_request`, `submit_to_hub`, `toolDiscovery`, planning
- `lessons/03_05_awareness/` — agent „świadomy” (inny profil niż homework hub)
- `tasks/s03e02/` — wzorzec epizodu: wąskie MCP + `submit_to_hub` (firmware)
- `tasks/s02e05/` — wzorzec: planning + iteracja hub + `http_request`
- `https://hub.ag3nts.org/savethem_preview.html` — podgląd trasy (S, G, teren R/T/W)
- `https://hub.ag3nts.org/api/toolsearch` — smoke probe (2026-06-11): zwraca m.in. `maps`, `wehicles`

**Weryfikacja UI:** brak (preview huba to narzędzie debugowe, nie UI epizodu).

---

## 1. Executive summary

**Werdykt: zadanie `savethem` da się w pełni zrealizować na obecnym `@ai-devs/agent-boilerplate` bez rozszerzania pakietu runtime.** Epizod `tasks/s03e05/` nie istnieje jeszcze w repo — to greenfield scaffold + logika domenowa.

| Pytanie | Odpowiedź |
| --- | --- |
| Czy boilerplate wystarczy? | **Tak** — `createAgent`, `http_request`, `submit_to_hub`, `finish_task`, opcjonalnie `enablePlanningPhase` |
| Czy trzeba dodawać coś do pakietu? | **Nie** — `toolsearch` to HTTP hub, nie nowe API boilerplate |
| Główna trudność pedagogiczna | **Niedeterminizm odkrywania** (zapytania EN, top-3 wyniki) vs **deterministyczna** weryfikacja trasy przez hub |
| Główna trudność techniczna | Optymalizacja trasy 10×10 z ograniczeniami paliwa (10) i jedzenia (10) oraz terenem (R/T/W) |
| Rekomendowany profil epizodu | Wąski ReAct hub (jak firmware), **nie** kopia `03_05_awareness` |

**Kluczowa lekcja dla studenta:** model **nie jest** solverem grafu — wybierasz, co zostaje w ReAct (odkrywanie, strategia, iteracja po feedbacku), a co w **deterministycznym** kodzie TypeScript (symulacja ruchu, BFS/A* po odkryciu reguł). To jest dokładnie napięcie z S03E02 + S03E05 razem.

---

## 2. Task Details

| Field | Value |
| --- | --- |
| Task ID (hub) | `savethem` |
| Hub verify | `POST https://hub.ag3nts.org/verify` |
| Answer shape | **Tablica stringów:** `[vehicle_name, "right", "up", ...]` |
| Start zasobów | 10 jednostek paliwa, 10 porcji jedzenia |
| Mapa | 10×10; teren: rzeki (W), drzewa (T), kamienie (R), puste (.) |
| Cel fabularny | Dotrzeć do **Skolwin** (negocjacje turbiny) |
| Język narzędzi hub | **Wyłącznie angielski** w parametrze `query` |
| Preview | `https://hub.ag3nts.org/savethem_preview.html` |
| Odkrywanie API | Tylko `POST https://hub.ag3nts.org/api/toolsearch` na starcie (koncept zadania) |

### 2.1 Mechanika gry (z opisu + preview)

| Element | Znaczenie |
| --- | --- |
| `S` | Start |
| `G` | Cel (Skolwin) |
| `R` / `T` / `W` | Kamień / drzewo / woda — blokują lub modyfikują ruch (szczegóły w API hub) |
| Pojazd | Wybór na początku trasy (`answer[0]`); można **wysiąść** i iść pieszo |
| Paliwo | Zużywane przy ruchu pojazdem; szybszy pojazd → więcej paliwa |
| Jedzenie | Zużywane przy każdym ruchu; wolniejsza podróż → więcej jedzenia |
| Ruch | Kierunki: `left`, `right`, `up`, `down` (z przykładu w zadaniu) |

### 2.2 Kontrakt hub toolsearch

**Request (wszystkie narzędzia hub — ten sam kształt):**

```json
{
  "apikey": "<HUB_API_KEY>",
  "query": "<natural language or keywords, English only>"
}
```

**Odpowiedź toolsearch (przykład rzeczywisty, smoke 2026-06-11):**

```json
{
  "code": 210,
  "message": "Matching tools found.",
  "query": "map terrain movement rules vehicles",
  "tools": [
    {
      "name": "maps",
      "url": "/api/maps",
      "description": "Terrain maps and map-related location resources.",
      "parameter": "query",
      "score": 10,
      "matched_keywords": ["map", "terrain"]
    },
    {
      "name": "wehicles",
      "url": "/api/wehicles",
      "description": "Information about vehicles and means of transportation.",
      "parameter": "query",
      "score": 7,
      "matched_keywords": ["vehicle", "vehicles"]
    }
  ]
}
```

**Ważne ograniczenia API (z zadania):**

- Każde narzędzie zwraca **tylko 3 najlepiej dopasowane** wyniki na jedno `query` — nie dostaniesz pełnego katalogu jednym strzałem.
- Odkryte endpointy (`/api/maps`, `/api/wehicles`, …) przyjmują ten sam `{ apikey, query }`.
- Literówka `wehicles` w API jest **celowa** — pierwszy element `answer` musi używać nazwy zwróconej przez hub.

### 2.3 Prawdopodobny zestaw narzędzi do odkrycia (hipotezy)

Na podstawie opisu zadania i smoke toolsearch — **do potwierdzenia w runtime** przez serię zapytań EN:

| Obszar wiedzy | Przykładowe `query` do toolsearch | Oczekiwany typ odpowiedzi |
| --- | --- | --- |
| Mapa / teren | `terrain map Skolwin 10x10` | Siatka, legenda, pozycja S/G |
| Pojazdy | `vehicles fuel consumption speed` | Lista pojazdów, koszty paliwa/jedzenia |
| Reguły ruchu | `movement rules rivers trees rocks` | Koszt kroku, blokady, pieszo vs pojazd |
| Symulacja / walidacja | `simulate route validate path` | Ewentualny endpoint testowy (jeśli istnieje) |
| Prowiant / paliwo | `food fuel consumption per move` | Współczynniki zużycia |

**Implikacja edukacyjna:** student musi **iterować** zapytania — to jest rdzeń „niedeterministycznej przewagi”: inna kolejność pytań → inna ścieżka poznania, ale ten sam deterministyczny cel (flaga).

---

## 3. Mapowanie na boilerplate

### 3.1 Co reuse bez zmian

| Komponent boilerplate | Rola w savethem |
| --- | --- |
| `createAgent` + ReAct | Pętla: odkryj → zbierz dane → zbuduj trasę → submit |
| `http_request` | Wywołania `toolsearch` i odkrytych `/api/*` (POST + retry 503) |
| `submit_to_hub` | `task_name: "savethem"`, `answer: string[]` |
| `finish_task` | Po `{FLG:...}` w odpowiedzi huba |
| `fetchWithRetry` | Automatycznie w `http_request` i adapterze LLM |
| `enablePlanningPhase` | Tura 0: plan odkrycia (toolsearch → map → vehicles → rules → route) |
| `createTracingRuntime` | Opcjonalnie — debug kosztów wielu tur |
| `MemoryHooks` | Opcjonalnie — wstrzyknięcie planu po odrzuceniu trasy przez hub |

### 3.2 Czego **nie** używać (świadomie)

| Mechanizm | Dlaczego nie |
| --- | --- |
| `toolDiscovery` (S02E05) | Inny protokół (`activate_tools` na lokalnych MCP) — mylące przy HTTP toolsearch |
| `think` / `recall` z awareness | Inny profil agenta (konwersacja); homework to jednorazowe zadanie NL |
| `analyze_image_vision` | Mapa z API (tekst/JSON), nie PNG jak drone |
| `read_file` | Brak lokalnych danych — wszystko z huba |
| Pełny `createBoilerplateMcpServer()` | Za szeroki zestaw — lepiej **wąskie MCP** jak firmware |
| OM (Observational Memory) | Sesja krótsza niż typowy próg OM; planning wystarczy |

### 3.3 Werdykt zgodności z §2.4 dokumentacji

Homework `savethem` jest **kanonicznym przykładem** wiersza tabeli §2.4:

> ReAct + odkrywanie narzędzi + optymalizacja trasy → tablica ruchów `/verify`

Pakiet **nie potrzebuje** wbudowanego MCP `hub_toolsearch`.

---

## 4. Analiza podejść implementacyjnych

### 4.1 Porównanie architektur

| ID | Podejście | Co uczy się student | Zalety | Wady | Rekomendacja |
| --- | --- | --- | --- | --- | --- |
| **A** | **Czysty ReAct** — tylko `http_request` + `submit_to_hub`; model sam liczy trasę w głowie | Odkrywanie API, prompt engineering, niedeterminizm zapytań | Najwierniej duchowi zadania („tylko toolsearch”) | Wysokie ryzyko błędu optymalizacji; drogie tokeny | ✅ **Faza 1** — eksperyment |
| **B** | **Wąskie MCP `hub_query`** — jedno narzędzie `{ path, query }` z wstrzykniętym `apikey` + `submit_to_hub` | Abstrakcja narzędzi (S03E04); mniej błędów URL | Czystsze niż surowy `http_request`; wzorzec jak `shell_exec` | Student musi sam zbudować MCP | ✅ **Faza 2 — docelowa struktura epizodu** |
| **C** | **Hybrid** — agent odkrywa reguły; **solver TS** (`pathSolver.ts`) liczy optymalną trasę | Podział LLM vs kod (S03E02) | Wysoka skuteczność; tanie tokeny po odkryciu | Mniej „magii” LLM w planowaniu | ✅ **Faza 3 — po zrozumieniu reguł** |
| **D** | **Pre-skryptowany pipeline** bez agenta | — | Szybkie solve | Omija całą lekcję S03E05 | ❌ Antywzorzec edukacyjny |
| **E** | Kopia agenta `03_05_awareness` | Proaktywność konwersacyjna | Bogaty UX | Nie pasuje do homework hub | ❌ |

### 4.2 Rekomendowana architektura epizodu (docelowa)

```text
tasks/s03e05/
├── run.ts                         # bootstrap (wzorzec: s03e02/run.ts)
├── config.ts                      # model, MAX_ITERATIONS, HUB_API_KEY
├── package.json                   # "@ai-devs/agent-boilerplate": "file:../boilerplate"
├── src/
│   ├── mcp/server.ts              # hub_query + submit_to_hub (+ opcj. simulate_route)
│   ├── tools/mcp/
│   │   ├── hub_query.ts           # POST https://hub.ag3nts.org/api/{path} + query
│   │   └── route_solver.ts        # opcjonalnie: deterministyczny solver po odkryciu reguł
│   ├── domain/
│   │   ├── parseMap.ts            # parsowanie odpowiedzi maps → siatka 10×10
│   │   ├── vehicles.ts            # typy pojazdów, koszty
│   │   └── pathSolver.ts          # BFS/A* z ograniczeniami fuel/food
│   ├── prompts/
│   │   ├── system.md
│   │   └── savethem_task.md       # cel, EN queries, format answer, preview URL
│   └── agent/
│       └── savethem_memory.ts     # opcjonalnie: inject plan po błędzie hub
```

### 4.3 Narzędzia widoczne dla agenta

**Wariant minimalny (zadanie „tylko toolsearch”):**

| Narzędzie | Rola |
| --- | --- |
| `hub_query` | `path: "toolsearch"` lub odkryty `"maps"` / `"wehicles"` + `query` (EN) |
| `submit_to_hub` | `task_name: "savethem"`, `answer: ["vehicle", "right", ...]` |
| `finish_task` | Po fladze |

**Wariant rozszerzony (po odkryciu reguł — opcjonalnie):**

| Narzędzie | Rola |
| --- | --- |
| `plan_route` | Deterministyczny solver — input: mapa + vehicle + reguły; output: `string[]` |
| `simulate_route` | Lokalna symulacja przed submitem (jeśli hub nie daje symulatora) |

**Nie rejestrować:** `read_file`, `analyze_image_vision`, generycznego `http_request` (chyba że świadomy wybór A zamiast B).

### 4.4 Projekt `hub_query` (analog `shell_exec`)

| Aspekt | Decyzja |
| --- | --- |
| URL | `https://hub.ag3nts.org/api/${path}` gdzie `path` bez leading slash (`toolsearch`, `maps`, `wehicles`) |
| Auth | `HUB_API_KEY` wstrzykiwany w handlerze — **nie** w prompcie |
| Input Zod | `{ path: z.string(), query: z.string().min(1) }` + `.describe()` po angielsku |
| Output | `mcpOk(JSON.stringify({ ok, status, data }))` — jak `http_request` |
| Retry | `fetchWithRetry` z boilerplate |
| Opis narzędzia | „Start with path `toolsearch`. All hub tools accept English `query`. Returns top matches only.” |

---

## 5. Naturalny przepływ agenta (ReAct)

```text
[Tura 0 — planning, opcjonalnie]
  Plan: toolsearch → maps → vehicles → movement rules → build route → submit

[Tura 1..N]
  hub_query(path: "toolsearch", query: "movement rules terrain map")
    → odkryj maps, wehicles, (ew. rules, simulate, …)

  hub_query(path: "maps", query: "…")
    → siatka 10×10, S, G, teren

  hub_query(path: "wehicles", query: "…")
    → parametry pojazdów

  (więcej hub_query według odkryć — kolejność może być inna!)

  [Opcja C] plan_route() LUB reasoning modelu → tablica ruchów

  submit_to_hub(task_name: "savethem", answer: ["bike", "right", "up", …])
    → jeśli błąd: popraw trasę (fuel/food/terrain)

  finish_task po {FLG:...}
```

**Podgląd:** po submit (lub osobnym API debug) `savethem_preview.html` pokazuje animację — użyj do **weryfikacji wizualnej** przed finalnym submitem.

---

## 6. Wartość edukacyjna — co wynieść z zadania

### 6.1 Lekcja S03E05 w praktyce (homework)

| Koncepcja z lekcji | Jak widać to w savethem |
| --- | --- |
| **Niedeterminizm** | Różne `query` → różne top-3 narzędzia; model może wybrać inną kolejność eksploracji |
| **Szeroka przestrzeń** | Brak sztywnego skryptu „najpierw mapa, potem pojazd” w kodzie — tylko w prompcie/planie |
| **Granice kontroli** | Hub **deterministycznie** weryfikuje trasę; Ty definiujesz MCP i solver |
| **Tool discovery ≠ toolDiscovery** | HTTP catalog (zadanie) vs `activate_tools` (boilerplate S02E05) — ten sam problem, inna implementacja |
| **Awareness vs hub** | `think`/`recall` = rozmowa; savethem = jednorazowa optymalizacja — **nie mieszaj profili** |

### 6.2 Progresja nauki (sugerowana ścieżka)

1. **Uruchom ręcznie** 3–5 `curl` / `hub_query` z różnymi `query` — zobacz, co zwraca top-3 i czego **brakuje** w jednym zapytaniu.
2. **Zbuduj epizod A** — sam agent, bez solvera; zaobserwuj w Langfuse / logach `[AKCJA]` ile tur zużywa i gdzie się myli.
3. **Dodaj parser mapy** w TS — 0 tokenów na interpretację siatki.
4. **Dodaj solver** — BFS ze stanem `(x, y, fuel, food, vehicle?)`; model tylko odkrywa liczby do solvera.
5. **Porównaj** koszt i skuteczność A vs C — to jest esencja S03E02 + S03E05.

### 6.3 Typowe pułapki

| Pułapka | Objaw | Remedium |
| --- | --- | --- |
| Polskie `query` | Słabe / puste dopasowania toolsearch | Prompt: **English only** |
| Jedno zapytanie toolsearch | Brak narzędzi do reguł ruchu | Iteruj zapytania; różne słowa kluczowe |
| LLM liczy kroki w głowie | Zła trasa mimo „dobrej” mapy | Solver w `domain/` |
| Zła nazwa pojazdu | Odrzucenie na verify | Użyj dokładnej nazwy z `/api/wehicles` (`wehicles` typo!) |
| Za mało iteracji ReAct | Agent kończy przed submitem | `MAX_ITERATIONS` 20–30 |
| Mylenie z drone | Szukanie PNG / vision | Mapa z API tekstowego |

---

## 7. Konfiguracja agenta (rekomendacje)

| Parametr | Wartość | Uzasadnienie |
| --- | --- | --- |
| `AGENT_MODEL` | Model z reasoning (np. Sonnet / GPT z `reasoning`) | Wieloetapowe planowanie + odkrywanie |
| `reasoning` / `reasoning_effort` | `high` opcjonalnie w epizodzie | Jak lekcja awareness — świadomy koszt |
| `MAX_ITERATIONS` | 25–35 | Wiele `hub_query` + ewent. poprawki po hub |
| `enablePlanningPhase` | `true` | Tura 0 bez wywołań hub — tańsze odkrycie strategii |
| `toolDiscovery` | `false` | HTTP discovery, nie lokalne MCP |
| OM | `false` | Niepotrzebne |
| Langfuse | opt-in | Śledzenie trajektorii odkrywania |

---

## 8. Gap analysis

| Element | Stan w repo (2026-06-11) |
| --- | --- |
| `tasks/s03e05/` | **Brak** |
| Dokumentacja §2.4 boilerplate | ✅ Zrealizowana |
| Research boilerplate S03E05 | ✅ (scope: pakiet, nie homework) |
| Ten plik (`savethem.research.md`) | ✅ Nowy — scope homework |
| Implementacja solvera / MCP | **Do zrobienia** po akceptacji planu |

---

## 9. Otwarte pytania (do akceptacji / runtime)

| # | Pytanie | Propozycja domyślna |
| --- | --- | --- |
| 1 | Czy solver w TS od razu, czy najpierw czysty agent? | **Hybrid** — kolejność implementacji: odkrywanie, potem solver; **bez** czystego agenta jako deliverable |
| 2 | `http_request` vs `hub_query` MCP? | **`hub_query`** — wzorzec firmware, wstrzyknięty apikey |
| 3 | Czy hub ma endpoint symulacji trasy? | **Sprawdzić** przez toolsearch w runtime; jeśli tak — użyć przed submit |
| 4 | Dokładny format odpowiedzi `maps` / reguł ruchu? | Ustalone dopiero po pierwszym hub_query — parser w `domain/` |
| 5 | Czy `answer[0]` to zawsze nazwa z API (`wehicles`)? | **Tak** — trzymaj się stringów z huba, nie tłumacz |

---

## 10. Następne kroki (po akceptacji research)

1. **Plan:** `savethem.plan.md` — fazy scaffold → MCP → prompty → solver opcjonalny → smoke hub.
2. **Scaffold:** `tasks/s03e05/` jak `s03e02` (`package.json`, `run.ts`, `config.ts`).
3. **Implementacja:** `hub_query` + prompty EN + pętla submit aż `{FLG:...}`.
4. **Rozszerzenie:** `pathSolver.ts` gdy agent sam nie dowozi.
5. **E2E:** `bun --env-file=../.env run run.ts` + preview HTML.

---

## 11. Werdykt końcowy

**Czy savethem da się zrobić na boilerplate?** — **Tak, w 100%.** Nie potrzebujesz `think`/`recall`, artefaktów ani zmian w `@ai-devs/agent-boilerplate`.

**Co jest „niedeterministyczne” w tym zadaniu?** — Trajektoria **odkrywania** (zapytania, kolejność narzędzi, synteza notatek z top-3 wyników), nie poprawność flagi — hub jest sędzią.

**Co jest najcenniejsze do nauki?** — Świadomy wybór: **kiedy** pozwolić modelowi eksplorować, a **kiedy** zamknąć problem w deterministycznym kodzie — bez rezygnacji z ReAct jako orchestratora.

---

## 12. Assumptions

- `HUB_API_KEY` jest w `tasks/.env` (jak inne epizody).
- API hub może ewoluować przed publikacją lekcji (status markdown: `scheduled`) — struktura toolsearch potwierdzona smoke 2026-06-11.
- Nazwa pojazdu w `answer[0]` musi być zgodna z dokumentacją huba (w tym ewentualna literówka `wehicles`).
