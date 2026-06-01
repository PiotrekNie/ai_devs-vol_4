# S03E03 — reactor (robot transport) — research

**Task:** Zaprojektować optymalne rozwiązanie zadania domowego `reactor` w `tasks/s03e03/` z użyciem `@ai-devs/agent-boilerplate`.

**Data:** 2026-06-01  
**Status:** Implemented — epizod `tasks/s03e03/` (testy + tsc PASS); E2E hub PASS `{FLG:INSTALLED}` (2026-06-01).

**Źródła:**

- `markdowns/s03e03-kontekstowy-feedback-wspierajacy-skutecznosc-agentow-1774391034.md` — fabuła + specyfikacja zadania `reactor`
- `tasks/boilerplate/` — `fetchWithRetry`, `submit_to_hub`, `HUB_VERIFY_URL`, `HUB_API_KEY`
- `tasks/boilerplate/docs/specs/s03e03-contextual-feedback/s03e03-contextual-feedback.research.md` — werdykt: reactor = epizod, nie rozszerzenie core
- `tasks/docs/boilerplate-documentation.md` §2.2 — wzorzec „homework hub: pętla deterministyczna lub ReAct + http_request`
- `tasks/s03e02/` — wzorzec epizodu na boilerplate (`run.ts`, MCP, `config.ts`)
- `tasks/s02e05/` — wzorzec zadania z iteracją hub (drone — tu **bez** vision)
- Hub preview: https://hub.ag3nts.org/reactor_preview.html
- **Empiryczna weryfikacja API** (2026-06-01): kilka wywołań `POST /verify` z `task: "reactor"`

**Weryfikacja UI:** brak (preview HTML opcjonalny dla debugu człowieka; solver opiera się na JSON z API).

---

## Task Details

| Field | Value |
| --- | --- |
| Task ID | `reactor` |
| Hub verify | `POST https://hub.ag3nts.org/verify` |
| Answer shape | `{ "command": "<start\|reset\|left\|wait\|right>" }` — **jedno polecenie na request** |
| Success | Odpowiedź z `{FLG:...}` (np. `{FLG:INSTALLED}`) po dotarciu robota na pole docelowe |
| Plansza | 7 kolumn × 5 wierszy (1-indexed w API) |
| Start robota | kolumna 1, wiersz 5 |
| Cel | kolumna 7, wiersz 5 |
| Bloki | 2 pola w pionie, cykl góra/dół; poruszają się **tylko** po wydaniu polecenia (turowo) |
| Preview | https://hub.ag3nts.org/reactor_preview.html |

### Kroki biznesowe (z opisu zadania)

1. Wysłać `start` (inicjalizacja planszy).
2. Obserwować stan (mapa + pozycje bloków + kierunki).
3. Decydować: `right` (krok w prawo), `wait` (tylko ruch bloków), `left` (ucieczka w lewo) — zgodnie z heurystyką zadania.
4. Powtarzać aż `reached_goal` / flaga `{FLG:...}`.

### Heurystyka opisana w zadaniu (naturalny algorytm)

```text
start → dopóki nie cel:
  jeśli bezpieczny ruch w prawo → right
  else jeśli czekanie bezpieczne → wait
  else → left (ucieczka)
```

### Kontekst fabuły

„Nie nadwyrężaj budżetu i zrób to raz a dobrze” — silna wskazówka produktowa na **minimalną liczbę prób** i **zerowy koszt tokenów LLM** tam, gdzie to możliwe.

---

## Business Impact

Domknięcie fabuły S03 (ECCS / chłodzenie reaktora) oraz ilustracja lekcji S03E03 z perspektywy **kontekstu otoczenia**: agent (lub program) musi **czytać zmieniający się stan** i podejmować decyzje w pętli feedbacku. W odróżnieniu od demo lekcji (calendar, browser, language), homework `reactor` to **w pełni obserwowalna gra turowa** — idealna do deterministycznego planera, nie do drogiego reasoning LLM.

---

## Gathered Information

### Odpowiedź API po `start` (kształt — zweryfikowany)

```json
{
  "code": 100,
  "message": "Reactor board initialized.",
  "board": [[".", "...", "B", "B", ".", "."]],
  "player": { "col": 1, "row": 5 },
  "goal": { "col": 7, "row": 5 },
  "blocks": [
    { "col": 2, "top_row": 4, "bottom_row": 5, "direction": "up" }
  ],
  "reached_goal": false
}
```

| Pole | Zastosowanie w solverze |
| --- | --- |
| `board` | Wizualizacja / debug; **źródło prawdy dla planera: `blocks` + `player`** |
| `blocks[]` | Symulacja ruchu bloczków (`col`, `top_row`, `bottom_row`, `direction`) |
| `player` | Pozycja robota (zawsze wiersz 5 w zwycięskim przebiegu) |
| `goal` | Warunek stopu |
| `code` | `100` = OK krok; `<0` = porażka (np. `-920` „Robot was crushed”) |
| `message` | Tekst + ewentualna flaga `{FLG:...}` przy sukcesie |

**Błędy obserwowane:** `-920` (zgniecenie), komunikaty typu „You tried so hard… robot is smashed” przy zbyt wielu próbach.

**Komendy pomocnicze:** `reset` — reset sesji (przydatne w testach E2E).

### Mechanika bloczków (wnioski z probe API)

| Reguła | Szczegół |
| --- | --- |
| Turowość | Każde polecenie = najpierw ruch **wszystkich** bloków, potem ruch robota (lub brak ruchu przy `wait`) |
| Kierunek `up` | Ruch w stronę **wiersza 1** (malejący `top_row` / `bottom_row`) |
| Kierunek `down` | Ruch w stronę **wiersza 5** (rosnący `top_row` / `bottom_row`) |
| Odwrócenie | Na skrajnej pozycji (wiersz 1 lub 5) kierunek się zmienia i blok cofa się o 1 wiersz w tej samej turze |
| Kolizja | Robot nie może wejść na pole zajęte przez blok; po ruchu bloczków robot ginie, jeśli stoi pod blokiem |
| Randomizacja | Układ początkowy bloczków **zmienia się** między grami — solver musi planować z bieżącego stanu, nie zapamiętywać jednej ścieżki |

### Powiązanie z lekcją S03E03

| Temat lekcji | Czy dotyczy homework `reactor`? |
| --- | --- |
| Heartbeat / `tasks.md` / proaktywność | ❌ |
| Hooki `beforeToolCall` / coaching language | ❌ |
| Playwright / browser feedback | ❌ |
| **Feedback otoczenia w pętli** | ✅ — każda odpowiedź hub to kontekst na następny krok |
| **Metadata programistyczna** | ✅ opcjonalnie — można wstrzyknąć skrót stanu do promptu *tylko* w wariancie agentowym |
| Deterministyczna logika poza LLM | ✅ — **preferowane** (jak w S03E02: „deterministyczna logika poza modelem”) |

Istniejący research S03E03 (boilerplate vs lekcja) już wskazuje: **`reactor` = pętla deterministyczna + opcjonalnie vision; bez nowych modułów w pakiecie**.

### Codebase — boilerplate (reuse)

| Komponent | Zastosowanie w reactor |
| --- | --- |
| `fetchWithRetry` z `tasks/boilerplate/src/agent/ai.ts` | POST `/verify` z retry 429/503 |
| `HUB_VERIFY_URL`, `HUB_API_KEY` z `boilerplate/config.ts` | Auth + endpoint |
| `extractFlag` / wzorzec z `submit_to_hub.ts` | Wyłuskanie `{FLG:...}` z `message` |
| `createAgent`, ReAct, MCP | **Opcjonalnie** — wariant edukacyjny; **nie** w ścieżce optymalnej |
| `analyze_image_vision` | **Nie** — API zwraca strukturalny JSON |
| `submit_to_hub` | **Nie** jako osobne narzędzie — każdy krok to `{ command }`, nie jednorazowy submit |

### Codebase — epizody referencyjne

| Epizod | Wzorzec | Stosunek do reactor |
| --- | --- | --- |
| `tasks/s03e02/` | ReAct + domenowe MCP + prompty | **Antywzorzec dla logiki ruchu** — firmware wymaga LLM; reactor nie |
| `tasks/s03e01/` | Struktura katalogów epizodu | **Szablon** `package.json`, `run.ts`, `config.ts`, testy |
| `tasks/s02e05/` (drone) | Iteracja hub + vision | Tylko wzorzec **pętli HTTP**; bez mapy PNG |

### Stan implementacji

| Element | Stan |
| --- | --- |
| `tasks/s03e03/` | **Brak** — do utworzenia |
| Research boilerplate S03E03 | ✅ (reactor wyłączony ze scope — ten dokument uzupełnia lukę) |
| Działający solver (probe) | ✅ proof-of-concept: heurystyka `right → wait → left` + prosta symulacja osiąga `{FLG:INSTALLED}` w ~8 krokach |

---

## Analiza podejść — werdykt

### Porównanie architektur

| Podejście | Zalety | Wady | Werdykt |
| --- | --- | --- | --- |
| **A. Deterministyczna pętla TS + symulator + planer (boilerplate HTTP only)** | 0 tokenów LLM; zgodne z „zrób raz a dobrze”; szybkie; testowalne unit testami; losowy layout — plan od bieżącego stanu | Wymaga poprawnej symulacji bloczków (kalibracja na fixture API) | **✅ Optymalne** |
| **B. ReAct + LLM decyduje o każdym `command`** | Zgodne z „agentem” w sensie kursowym | 50–200+ tur × koszt modelu; zawodność przy precyzyjnym timingu; sprzeczne z fabułą o budżecie | ❌ |
| **C. ReAct + MCP `reactor_command` (LLM tylko orchestruje)** | Epizod „wygląda” jak inne zadania | LLM bez wartości — planer robi całą pracę; sztuczny overhead | ❌ |
| **D. Vision na preview HTML / screenshot** | Ładne demo | API daje lepsze dane; vision drogie i mniej precyzyjne | ❌ |
| **E. Hooki / heartbeat / `tasks.md` z lekcji** | Bogate wzorce S03E03 | Over-engineering dla jednej gry turowej | ❌ |
| **F. Hybryda: planer TS + cienki agent do logowania / explain** | Debug / nauka | Opcjonalny tryb `--explain` poza ścieżką hub | ⚠️ Opcjonalnie dev-only |

### Rekomendacja architektury (docelowa)

```text
tasks/s03e03/
├── run.ts                         # entry: pętla hub (bez createAgent)
├── config.ts                      # HUB_*, opcjonalnie MAX_STEPS
├── package.json                   # "@ai-devs/agent-boilerplate": "file:../boilerplate"
├── src/
│   ├── domain/
│   │   ├── types.ts               # Block, GameState, Command
│   │   ├── simulate.ts            # applyCommand, moveBlocks (pure)
│   │   ├── planner.ts             # chooseCommand (BFS / heurystyka)
│   │   └── fixtures/              # JSON z realnych odpowiedzi hub (testy)
│   ├── hub/
│   │   └── reactorClient.ts       # fetchWithRetry, parseResponse, extractFlag
│   └── reactorRun.ts              # start → loop → flag (logger [AKCJA]/[WYNIK])
```

**Przepływ:**

```text
POST start
  → while not flag:
       state ← parse(lastResponse)
       cmd ← planner.choose(state)      // pure TS, 0 LLM
       response ← POST { command: cmd }
       log [AKCJA] / [WYNIK]
  → print flag
```

**Nie tworzyć:** `createAgent`, prompty systemowe, MCP (chyba że osobny tryb edukacyjny), `analyze_image_vision`, rozszerzenia boilerplate core.

### Projekt planera

| Aspekt | Decyzja |
| --- | --- |
| Stan | `(player.col, player.row, blocks[])` — wiersz robota zwykle 5 |
| Symulacja | Funkcje czyste w `simulate.ts`; **testy regresji** na fixture z hub |
| Wybór ruchu | **BFS** (głębokość ≤ ~40) szukający najkrótszej ścieżki do `goal`; fallback heurystyka z opisu zadania |
| Priorytet komend | Przy równoważnych planach preferuj `right` > `wait` > `left` (mniej kroków) |
| Źródło prawdy | Po każdym HTTP **nadpisuj stan** danymi z API (sim służy tylko do lookahead) |
| Limit kroków | `MAX_STEPS` (~200) — fail fast z czytelnym błędem |

### Reuse boilerplate (minimalny)

```typescript
import { fetchWithRetry } from "@ai-devs/agent-boilerplate"; // via ai.ts re-export path
import { HUB_VERIFY_URL, HUB_API_KEY } from "../boilerplate/config.js";
import { extractFlag } from "../boilerplate/src/tools/mcp/submit_to_hub.js";
```

Alternatywa: skopiować tylko `fetchWithRetry` + `extractFlag` (już publiczne w pakiecie epizodu przez import z `file:../boilerplate`).

---

## Rekomendacje modeli LLM

| Scenariusz | Model | Uzasadnienie |
| --- | --- | --- |
| **Ścieżka optymalna (planer TS)** | **Brak LLM** | Pełna obserwowalność stanu w JSON; gra turowa; wymóg fabuły o budżecie; proof-of-concept bez modelu działa |
| Wariant „agentowy” (niezalecany) | `gpt-4o-mini` | Najtańszy, gdyby jednak wymusano ReAct — ale nadal zawodny przy timingu |
| Wariant „agentowy” (niezalecany) | `anthropic/claude-sonnet-4-6` | Wskazany w firmware dla reasoning — tu **overkill**; wiele tur = wysoki koszt |
| Vision | **Nie używać** | `board` + `blocks` w API są wystarczające i dokładniejsze niż OCR / opis obrazu |

**Wniosek:** dla zadania `reactor` **najlepszy „model” to deterministyczny algorytm**. LLM nie wnosi wartości merytorycznej; ewentualne użycie służyłoby wyłącznie demonstracji pętli ReAct (kosztownej i niestabilnej).

Jeśli kurs wymaga „agenta” w sensie narracji — można nazwać moduł `robotAgent` w kodzie, ale **implementacja pozostaje proceduralna** (jak wiele rozwiązań społeczności dla gier turowych na hub).

---

## Current Implementation Status

### Existing Components

| Komponent | Plik | Status |
| --- | --- | --- |
| HTTP retry | `tasks/boilerplate/src/agent/ai.ts` | Reuse |
| Hub config | `tasks/boilerplate/config.ts` | Reuse |
| Flag extract | `tasks/boilerplate/src/tools/mcp/submit_to_hub.ts` | Reuse (`extractFlag`) |
| Epizod s03e03 | — | **Do utworzenia** |
| Symulator / planer | — | **Do utworzenia** |

### Key Files and Directories

- `tasks/boilerplate/` — wyłącznie importy HTTP/config
- `tasks/s03e02/run.ts` — wzorzec `package.json` + entrypoint (tu **bez** `createAgent`)
- `tasks/docs/boilerplate-documentation.md` §2.2 — wiersz „Homework hub → pętla deterministyczna”

---

## Gap Analysis

| Luka | Status |
| --- | --- |
| Brak `tasks/s03e03/` | Do zbudowania po akceptacji research/plan |
| Dokładna spec symulacji bloczków | Częściowo zweryfikowana probe; **wymaga fixture testów** (pierwszy `wait` może różnić się przy błędnej kalibracji — testy obowiązkowe) |
| Czy hub akceptuje tylko ścieżkę minimalną | Nieznane — planer powinien minimalizować kroki |
| Preview WebSocket | Opcjonalny debug; **poza** ścieżką submit |

### Open questions

| # | Pytanie | Propozycja |
| --- | --- | --- |
| 1 | Czy epizod musi używać `createAgent`? | **Nie** — spec §2.2 i profil zadania wskazują pętlę deterministyczną |
| 2 | Osobny MCP `reactor_step`? | **Nie** w wariancie optymalnym; ewentualnie w trybie `--agent` (defer) |
| 3 | Logger `[MYŚL]/[AKCJA]/[WYNIK]`? | **Tak** — `chooseCommand` loguje reasoning deterministyczny w `[MYŚL]`, HTTP w `[AKCJA]/[WYNIK]` |

---

## Assumptions

- Układ bloczków jest losowany przy `start`, ale mechanika ruchu jest deterministyczna.
- Robot pozostaje na dolnym wierszu (5) przez całą grę — zgodnie z opisem zadania.
- Jedna sesja hub = jedna próba; `reset` tylko do testów / po porażce w dev.
- `HUB_API_KEY` jest w `tasks/.env` (jak inne epizody).

---

## Suggested next steps

1. ~~**Human gate:** akceptacja tego researchu.~~ ✅ 2026-06-01
2. **Human gate:** akceptacja [planu implementacji](s03e03-reactor.plan.md).
3. Implementacja epizodu **bez LLM**; `bun test` na `simulate.ts` / `planner.ts`; E2E: `bun --env-file=../.env run run.ts`.
4. Brak zmian w `@ai-devs/agent-boilerplate` core.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-01 | Research początkowy — reactor: werdykt deterministyczny planer + reuse HTTP boilerplate; rekomendacja modeli LLM |
| 2026-06-01 | Research zaakceptowany; plan implementacji w s03e03-reactor.plan.md |
| 2026-06-01 | Implementacja epizodu s03e03 — BFS planner, E2E `{FLG:INSTALLED}` |
