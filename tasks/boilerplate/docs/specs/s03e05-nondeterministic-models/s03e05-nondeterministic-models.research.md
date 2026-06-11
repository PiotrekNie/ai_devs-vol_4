# S03E05 — Niedeterministyczna natura modeli jako przewaga → boilerplate (research)

**Task:** Przeanalizować lekcję S03E05 pod kątem opisanych funkcjonalności i ocenić, czy którekolwiek z nich warto dodać do `tasks/boilerplate` (`@ai-devs/agent-boilerplate`) — **w oderwaniu od pełnej implementacji homeworku** `savethem` (planowanie trasy), ale z uwzględnieniem wymagań zadania jako wzorca „dynamicznego odkrywania narzędzi”.

**Data:** 2026-06-03  
**Status:** Research **zaakceptowany** (2026-06-03); implementacja docs **zrealizowana** (2026-06-03).  
**Plan:** [s03e05-nondeterministic-models.plan.md](s03e05-nondeterministic-models.plan.md) — Opcja A (§**2.4** w spec) — **done**.

**Źródła:**

- `markdowns/s03e05-niedeterministyczna-natura-modeli-jako-przewaga-1774562727.md` — transkrypt lekcji
- `lessons/03_05_awareness/` — agent „sytuacyjny”: `think`, `recall`, scout, metadata, szablony promptów
- `lessons/03_05_artifacts/` — generowanie HTML/JS (artefakty), live preview, iframe
- `lessons/03_05_render/` — JSON spec → interfejs (json-render)
- `lessons/03_05_apps/` — MCP Apps, host UI, synchronizacja stanu
- `tasks/boilerplate/` — ReAct, `toolDiscovery`, `http_request`, `ai.ts` (`reasoning`)
- `tasks/boilerplate/docs/specs/tool-discovery/` — precedens discovery (S02E05)
- `tasks/boilerplate/docs/specs/s03e02-model-constraints/`, `s03e03-contextual-feedback/`, `s03e04-tool-design-test-data/` — werdykty „docs vs core”
- `tasks/docs/boilerplate-documentation.md` — spec produktowa (§2.1–2.3)

**Weryfikacja UI:** brak (lekcja zawiera demo przeglądarkowe w `lessons/03_05_*` — poza scope pakietu kursowego).

---

## 1. Executive summary

**Werdykt: lekcja S03E05 wzmacnia głównie *architekturę kognitywną i produktową* (szeroka przestrzeń zachowań, generatywne UI), a nie brakujące elementy domyślnego runtime ReAct. Do boilerplate wchodzi przede wszystkim dokumentacja (proponowane §**2.4** w `boilerplate-documentation.md`) oraz ewentualnie **1–2 wiersze** w README — bez `think`/`recall`, bez hosta artefaktów/MCP Apps i bez wbudowanego klienta `toolsearch`.**

| Obszar lekcji | W boilerplate domyślnie? | Gdzie indziej |
| --- | --- | --- |
| Niedeterminizm / „szeroka przestrzeń” zachowań | **Docs** — kiedy ReAct hub vs agent „świadomy” | `lessons/03_05_awareness/` |
| Narzędzia `think` / `recall` + scout pamięci | **Nie** | lekcja awareness (osobny runtime Responses API) |
| `reasoning_effort` / LRM | **Częściowo** — pass-through w `ai.ts`, bez domyślnej polityki | env + konfiguracja epizodu |
| Artefakty HTML (Preact, Tailwind, Chart.js…) | **Nie** | `lessons/03_05_artifacts/` |
| JSON Render (stan UI) | **Nie** | `lessons/03_05_render/` |
| MCP Apps (host + UI + sync) | **Nie** | `lessons/03_05_apps/` |
| Hub **`/api/toolsearch`** (homework) | **Nie** jako MCP w pakiecie | epizod `tasks/s03e05/` + `http_request` |
| Lazy discovery narzędzi (koncept) | **Tak (opt-in)** | `toolDiscovery` (S02E05) — **inny mechanizm**, ten sam cel pedagogiczny |

**Reguła kciuka (spójna z S03E02–S03E04):**

```text
Homework hub (savethem: trasa, /verify, angielskie query) → default boilerplate + http_request;
  odkrywanie narzędzi hub = własne cienkie MCP w epizodzie LUB pętla ReAct z http_request (nie nowy moduł w pakiecie).
Agent konwersacyjny / coaching / artefakty / MCP Apps → lekcje 03_05_* (osobne aplikacje).
Szerokie prompty + proaktywność bez poleceń → nie domyślny createAgent; dokumentacja + wzorzec awareness.
```

---

## 2. Funkcjonalności z lekcji (poza pełną implementacją `savethem`)

### 2.1 Warstwa koncepcyjna

| Temat | Opis | Runtime w boilerplate? |
| --- | --- | --- |
| „Wszystko jest halucynacją” | Output LLM zawsze generowany; czasem użyteczny | **Nie** — filozofia / eval |
| Powtarzalność vs kontekst | Ten sam prompt → podobny wynik; agent z pamięcią/otoczeniem → większa zmienność | **Wzorzec** — OM, metadata, historia |
| Precyzja vs zróżnicowanie | Trade-off instrukcji | **Docs** — kiedy wąski ReAct hub |
| Cognitive Architectures (CoALA) | Stwarzanie warunków, nie skryptów if/else | **Docs** — odsyłacz do lekcji |
| Temperature / top_p | Niska „losowość” w czystym czacie | **Poza pakietem** — parametry providera w `ai.ts` możliwe per call, brak domyślnej polityki |

### 2.2 Agent „świadomy sytuacji” (`03_05_awareness`)

| Mechanizm | Opis | Stan w monorepo |
| --- | --- | --- |
| **Proaktywność** bez jawnego polecenia | Model sam wybiera, kiedy działać | Lekcja; homework hub zwykle **reaktywny** (jedno zadanie NL) |
| **`think`** | Przestrzeń na pytania do siebie (luki wiedzy) | `lessons/03_05_awareness/src/core/tools.ts` — **nie** w boilerplate |
| **`recall`** + scout | Odkrywanie pamięci plikowej przez sub-agenta | Osobny `runScout`, MCP filesystem — **nie** w pakiecie |
| Metadata w wiadomości (emocje, styl) | Wzmacnianie postaw | Już opisane w **§2.2 S03E03** (metadata block) |
| Ogólne instrukcje (generalizacja) | Brak „jeśli X to Y” | **Prompt epizodu / lekcji**, nie `createAgent` |
| `reasoning_effort: high` + narzędzia think | LRM + dedykowane „zastanów się” | `ai.ts` przyjmuje `reasoning`; brak natywnych `think`/`recall` |

**Wniosek:** Awareness to **inny profil agenta** (długa rozmowa, filesystem jako tożsamość) niż typowy epizod `tasks/sXXeYY/` (≤5 tur, hub). Przenoszenie `think`/`recall` do boilerplate **rozmyłoby** kontrakt pakietu i duplikowałoby lekcję.

### 2.3 Generatywne UI (trzy demo)

| Demo | Model kontroli | Dlaczego poza boilerplate |
| --- | --- | --- |
| **03_05_artifacts** | Niski — pełny HTML/JS w iframe | Playwright/host, live preview, biblioteki CDN — **aplikacja lekcji** |
| **03_05_render** | Średni — JSON → szablon HTML | Osobny pipeline `spec-generator` / `spec-to-html` |
| **03_05_apps** | Wysoki — MCP Apps, stan w hostcie | Rozszerzenie MCP + UI server — zgodnie z S03E03: browser/apps **poza** default install |

Lekcja explicite: artefakty vs json-render vs MCP Apps to **„kiedy X, kiedy Y, kiedy X+Y”** — materiał na §2.4, nie na nowe zależności w `package.json` boilerplate.

### 2.4 Homework `savethem` (kontekst, nie scope pakietu)

| Wymaganie | Implikacja techniczna | Boilerplate |
| --- | --- | --- |
| Tylko **toolsearch** na start | Dynamiczne poznawanie API przez `query` | Analogia do **`toolDiscovery`**, ale endpoint HTTP, nie `list_tools` |
| Wszystkie odkryte narzędzia: `{ apikey, query }` | Cienkie proxy MCP lub wywołania w pętli | **`http_request`** + epizodowe MCP |
| Plan trasy 10×10, paliwo, jedzenie, pojazdy | Logika domenowa + ewent. deterministyczny solver | **`tasks/s03e05/`** (jeszcze brak w repo) |
| Odpowiedź: tablica ruchów + pojazd → `/verify` | `submit_to_hub` | **Już jest** w boilerplate |
| Język angielski w `query` | Prompt / opis narzędzi epizodu | Epizod |

**Wniosek:** Zadanie **nie wymaga** nowego modułu w `@ai-devs/agent-boilerplate`. Wystarczy istniejący stos: ReAct + `http_request` + (opcjonalnie) `toolDiscovery` jako **lokalny** wzorzec lazy-load, gdy student doda wiele własnych MCP proxy.

---

## 3. Mapowanie na stan `tasks/boilerplate`

### 3.1 Już pokryte (bez zmian)

| Potrzeba z lekcji / kursu | Mechanizm |
| --- | --- |
| ReAct + function calling | `createAgent`, `agent.ts` |
| Wywołania hub z retry | `http_request`, `fetchWithRetry` |
| Weryfikacja zadania | `submit_to_hub` |
| Lazy schematy narzędzi (lokalne MCP) | `toolDiscovery: { enabled: true }` |
| Długa sesja / kompresja | OM (opt-in) |
| Metadata otoczenia w wiadomości | Wzorzec S03E03 (kod epizodu) |
| Pass-through reasoning API | `createAIAdapter` / `generateResponse` — `reasoning` w body |
| Planowanie tury 0 | `enablePlanningPhase` |
| Eval trajektorii | `@ai-devs/agent-evals` + Langfuse |

### 3.2 Luka dokumentacyjna (warto uzupełnić)

Brak sekcji **§2.4** w `tasks/docs/boilerplate-documentation.md` dla:

- szerokiej przestrzeni zachowań vs deterministyczny homework hub;
- `think`/`recall` vs `MemoryHooks` / `ask_human`;
- trzech ścieżek generatywnego UI (artefakt / JSON render / MCP Apps);
- mapowania **hub toolsearch** → `http_request` + epizod, **nie** nowe API w pakiecie;
- kiedy włączyć `toolDiscovery` przy wielu proxy-MCP po odkryciu hub API.

### 3.3 Rozszerzenia runtime — ocena

| Propozycja | Zysk | Koszt / ryzyko | Rekomendacja |
| --- | --- | --- | --- |
| Natywne `think` / `recall` w pakiecie | Spójność z lekcją awareness | Inny UX niż hub; duplikat lekcji; Responses-specific scout | **Nie** |
| MCP `hub_toolsearch` w boilerplate | Szybszy start savethem | Jedno zadanie; hardcode URL kursu; ang. query to detail epizodu | **Nie** (przykład w docs/README wystarczy) |
| Domyślne `reasoning_effort: high` | Lepsze „rozumowanie” | Koszt/latency wszystkich epizodów | **Nie** — env epizodu |
| `temperature` w `config.ts` | Kontrola losowości | Rzadko używane w zadaniach hub | **Nie** — opcjonalnie per `generateResponse` |
| Pakiet `@ai-devs/agent-artifacts` | Reużycie UI lekcji | 0 epizodów `tasks/`; ciężki host | **Defer** (jak browser w S03E03) |
| Rozszerzenie `toolDiscovery` o „remote catalog” | Blisko homework | Over-engineering; hub API nie jest MCP | **Nie** |

---

## 4. Zbieżność z wcześniejszymi researchami

| Temat | Relacja S03E05 |
| --- | --- |
| **S03E02 constraints** | Homework savethem = deterministyczna **weryfikacja** trasy przy **niedeterministycznym** odkrywaniu narzędzi przez model |
| **S03E03 contextual feedback** | Awareness = metadata + pamięć plikowa; nadal **bez** schedulera w core |
| **S03E04 tool design** | Narzędzia hub zwracają top-3 JSON — projekt opisów `query` w epizodzie; bez envelope Gmail |
| **Tool discovery S02E05** | Ten sam problem pedagogiczny co toolsearch; inna implementacja (HTTP vs `activate_tools`) |
| **Sandbox / code mode** | Artefakty mogą używać sandboxów — osobna ścieżka; nie łączyć z default boilerplate |

---

## 5. Rekomendacje priorytetowe

### Nie dodawać do `@ai-devs/agent-boilerplate` (core)

1. `think`, `recall`, scout filesystem  
2. Host artefaktów (iframe, live preview, Playwright)  
3. JSON Render pipeline i katalog komponentów  
4. MCP Apps host + synchronizacja UI  
5. Wbudowany klient `/api/toolsearch` i generyczne „hub dynamic tools”  
6. Domyślna polityka „szerokiej generalizacji” w `system.md` pakietu  

### Warto zrobić (niska intruzywność — precedens S03E02–E04)

| Opcja | Zakres | Szacowany effort |
| --- | --- | --- |
| **A (zalecana)** | §**2.4** w `tasks/docs/boilerplate-documentation.md` + krzyżowe linki w research S03E02–E04; opcjonalnie 2–3 zdania w `tasks/boilerplate/README.md` (Feature catalog / When to use) | Mały |
| **B** | Szablon `tasks/s03e05/` (homework) — **osobny** od rozszerzenia pakietu; nie jest częścią tego research | Osobny task |
| **C** | Przykładowe MCP `toolsearch` w `tasks/shared/` lub samym epizodzie | Tylko jeśli ≥2 epizody hub z tym samym API |
| **D** | Brak zmian | Odrzucone — **A** daje wartość przy zerowej złożoności runtime |

---

## 6. Otwarte pytania (do akceptacji research)

| # | Pytanie | Propozycja domyślna |
| --- | --- | --- |
| 1 | Czy planować epizod `tasks/s03e05/` w tym samym PR co docs §2.4? | **Rozdzielić** — docs boilerplate niezależnie od homework |
| 2 | Czy w README dodać przykład JSON `http_request` → `toolsearch`? | **Tak**, jeden blok (jak hub POST w innych epizodach) |
| 3 | Czy `toolDiscovery.coreToolNames` powinno dokumentować wzorzec „tylko meta + http”? | **Tak** w §2.4 — bez zmiany domyślnych core names |
| 4 | Czy kiedykolwiek pakiet `@ai-devs/agent-ui` (artifacts/render)? | **Defer** — dopóki brak ≥2 epizodów `tasks/` |

---

## 7. Następne kroki (po akceptacji research)

1. **Plan:** `s03e05-nondeterministic-models.plan.md` — Opcja A: tylko dokumentacja (checklist jak S03E04 plan).  
2. **Implementacja docs:** §2.4 + ewentualny wpis CHANGELOG (Unreleased).  
3. **Homework:** osobny wątek `tasks/s03e05/` — ReAct + `http_request` + własne MCP hub; opcjonalnie `toolDiscovery` jeśli student zmaterializuje wiele narzędzi lokalnie.

---

## 8. Werdykt końcowy (odpowiedź na pytanie użytkownika)

**Czy w lekcji S03E05 można rozbudować `tasks/boilerplate`?**

- **Tak, zasadnie i zgodnie z linią S03E02–S03E04** — ale prawie wyłącznie przez **dokumentację produktową** (§2.4): kiedy szeroka przestrzeń zachowań ma sens, jak mapować demo `03_05_*` i homework `savethem` na istniejące API (`http_request`, `submit_to_hub`, `toolDiscovery`, `reasoning` w adapterze).
- **Nie zasadnie w core runtime** — `think`/`recall`, generatywne UI, MCP Apps ani dedykowany moduł hub `toolsearch` nie powinny trafić do domyślnego pakietu; to materiał lekcji lub cienkiego kodu epizodu.
- **Homework `savethem`** realizujesz na **obecnym** boilerplate bez rozszerzania pakietu; lekcja podkreśla niedeterminizm w **wyborze narzędzi i strategii**, przy **deterministycznej** ocenie poprawnej trasy przez hub.

**Implikacja dla Ciebie:** jeśli celem jest „wzbogacić kurs o S03E05”, najlepszy ROI = **Opcja A (docs)** + osobny folder zadania; pełna kopia lekcji awareness/UI do boilerplate **obniżyłaby** czytelność pakietu ReAct dla epizodów hub.

---

## 9. Assumptions

- Demo `lessons/03_05_*` pozostają poza importami `@ai-devs/agent-boilerplate` (jak `03_03_*`, `03_04_gmail`).
- Epizod `tasks/s03e05/` nie istnieje jeszcze w repozytorium (2026-06-03).
- Lekcja ma status `scheduled` (publikacja 2026-03-27) — treść homework może być jeszcze doprecyzowana; werdykt oparty na opublikowanym markdownie w repo.
