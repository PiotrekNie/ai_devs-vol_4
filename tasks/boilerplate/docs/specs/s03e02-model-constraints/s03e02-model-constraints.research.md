# S03E02 — ograniczenia modeli na etapie założeń projektu — research

**Task:** Analiza lekcji S03E02 pod kątem opisanych funkcjonalności oraz ocena, czy którekolwiek powinny trafić do `@ai-devs/agent-boilerplate`.

**Data:** 2026-05-30  
**Status:** Research — **oczekuje akceptacji** przed planem / implementacją.

**Źródła:**

- `markdowns/s03e02-ograniczenia-modeli-na-etapie-zalozen-projektu-1774278041.md` — transkrypt lekcji S03E02
- `lessons/03_02_code/` — Deno sandbox + `execute_code` (lekcja)
- `tasks/boilerplate/README.md` — feature catalog boilerplate
- `tasks/boilerplate/docs/specs/sandbox-code-execution/` — precedens: sandbox → opt-in, nie core
- `tasks/s03e01/docs/specs/s03e01-evaluation/` — weryfikacja planu vs realizacja (powiązany epizod S03)

**Weryfikacja UI:** brak.

---

## 1. Executive summary

Lekcja S03E02 to **projektowanie systemów agentowych pod ograniczenia modeli** — nie kolejny „feature pack” do skopiowania 1:1 do boilerplate. Większość treści to **decyzje architektoniczne** (zakres roli AI, izolacja uprawnień, human-in-the-loop), a przykłady kodu (`03_02_email`, `03_02_events`, `03_02_code`) to **osobne demo runtime’y** w `lessons/`, celowo poza `@ai-devs/agent-boilerplate`.

| Werdykt ogólny | Uzasadnienie |
| --- | --- |
| **Nie rozszerzać core boilerplate** o heartbeat, email RBAC, prompt-injection guard, Deno sandbox | Złożoność, domena, zależności zewnętrzne; misja pakietu = jawny ReAct + MCP kursowe |
| **Utrzymać status quo + dokumentację** | README i `sandbox-code-execution.research.md` już mapują lekcje → opt-in / osobny pakiet |
| **Ewentualny następny krok (osobny plan)** | `@ai-devs/agent-code-mode` (Deno) — **tylko gdy** konkretne zadanie w `tasks/` wymaga `execute_code`; homework `firmware` **nie wymaga** |
| **Homework `firmware`** | Epizod `tasks/s03e02/` z MCP `shell_exec` (wrapper na `http_request`) + istniejący boilerplate — **nie** nowy moduł w pakiecie |

**Powiązana weryfikacja:** plan i implementacja `tasks/s03e01/` (evaluation) — **PASS** (§6).

---

## 2. Funkcjonalności z lekcji — inwentaryzacja

### 2.1 Warstwa koncepcyjna (nie kod boilerplate)

| Temat lekcji | Opis | Czy to feature runtime? |
| --- | --- | --- |
| Łamanie schematów (RAG, czatbot, all-in-one) | Projektowanie wartości vs hype | **Nie** — guidance dla architekta / BA |
| Wąski zakres roli AI | Etykietowanie, szkicowanie vs pełna automatyzacja | **Nie** — decyzja produktowa |
| Deterministyczna logika poza modelem | Routing, referencje do dokumentów | **Wzorzec** — realizacja w MCP tools epizodu (jak S03E01 `scan_sensors`) |
| Human-in-the-loop dla akcji nieodwracalnych | Brak wysyłki maili przez agenta | **Wzorzec** — `ask_human` + brak narzędzia „send” |

### 2.2 Przykład `03_02_email` (lekcja — brak w `lessons/` w tym repo)

| Mechanizm | Opis |
| --- | --- |
| Izolacja sesji per skrzynka / domena | Programistyczne zawężenie KB i kontekstu przy **szkicowaniu** |
| Brak narzędzia wysyłki | Akcje nieodwracalne tylko przez człowieka |
| Etykiety, priorytety, szkice | Wąski, wspierający zakres vs autonomia |
| Eksperymenty skuteczności | Eval per aktywność — blisko `@ai-devs/agent-evals`, nie boilerplate |

### 2.3 Przykład `03_02_events` — heartbeat + multi-agent (lekcja — brak w repo)

| Mechanizm | Opis |
| --- | --- |
| **Kontrakty planu** | Zadania: nazwa, opis, status, zależności, opcjonalnie agent |
| **Heartbeat** | Manager przydzielający zadania po każdym cyklu |
| **Pamięć FS** | Wymiana między agentami przez pliki |
| **Observational Memory** | Kompresja kontekstu per sesja agenta |
| **goal.md → plan → rounds** | Workflow wieloagentowy, elastyczne dodawanie zadań |
| **ask_human** w planie | Decyzje nierozstrzygalne autonomicznie |

### 2.4 Prompt injection (sekcja lekcji)

| Technika | Opis |
| --- | --- |
| System prompt = publiczny | Brak sekretów w instructions |
| Dostęp programistyczny | Model nie decyduje o uprawnieniach |
| Blokada / nadzór kanałów zewnętrznych | Mail, post, SMS |
| **Bariera** | Osobne zapytanie LLM → stałe tokeny `bezpieczne` / `niebezpieczne` + weryfikacja kodem |
| Informacja prawna dla użytkownika | UX / compliance |

### 2.5 Wydajność i koszty (pięć dźwigni)

| Dźwignia | Lekcja | Boilerplate dziś |
| --- | --- | --- |
| Mniej tokenów wejściowych | Krótszy prompt, mniej schematów narzędzi | `toolDiscovery`, truncation, OM |
| Cache (provider) | Powtarzające się prefixy | Po stronie API — brak warstwy w boilerplate |
| Mniej tokenów wyjściowych | Krótkie odpowiedzi, mniej kroków | `AGENT_PLANNING_MAX_OUTPUT_TOKENS`, ReAct guard |
| Mniej zapytań | Batch w kodzie vs N tur ReAct | Brak code mode w core |
| Mniejsze modele | Mini na proste kroki | `AGENT_MODEL`, `OM_MODEL`, per-episode `chat()` |

### 2.6 Przykład `03_02_code` — Deno sandbox

| Element | Opis |
| --- | --- |
| `execute_code` w Deno | Izolowany subprocess, poziomy uprawnień |
| MCP plików + HTTP bridge | Host tools dostępne z kodu gościa |
| Pipeline | Eksploracja → fragmenty → skrypt agregacji → PDF |
| Architektura 3 procesy | Main + MCP STDIO + Sandbox |

**W repo:** `lessons/03_02_code/` — kompletny, osobny od boilerplate.

### 2.7 Zadanie domowe `firmware`

| Wymaganie | Implikacja techniczna |
| --- | --- |
| API `https://hub.ag3nts.org/api/shell` | Jedno narzędzie HTTP (POST `cmd`) |
| Pętla agentowa ReAct | Domyślny boilerplate |
| `submit_to_hub` | Już w boilerplate |
| Obsługa ban / rate limit / 503 | Retry w `http_request` + opcjonalnie bogatsze komunikaty w **narzędziu epizodu** |
| Model reasoning (`claude-sonnet-4-6`) | `AGENT_MODEL` / OpenRouter — konfiguracja, nie kod |
| Sekwencyjne komendy | Prompty + ReAct — bez sandboxa |
| **Bez** code mode | Shell to zewnętrzne API, nie lokalny FS 150k linii |

---

## 3. Mapowanie lekcja → boilerplate (stan obecny)

| Funkcjonalność lekcji | W boilerplate? | Gdzie / jak |
| --- | --- | --- |
| ReAct + function calling | ✅ default | `createAgent` |
| Planning turn 0 (`## Working plan`) | ✅ opt-in | `enablePlanningPhase` — **uproszczony** odpowiednik planu z heartbeat |
| Observational Memory | ✅ opt-in | `createObservationalMemoryHooks` |
| Tool discovery (lazy schemas) | ✅ opt-in | `toolDiscovery` — redukcja tokenów wejściowych |
| Retry 429/503 | ✅ default | `createAIAdapter`, `http_request` |
| Truncation wyników narzędzi | ✅ default | `AGENT_MAX_TOOL_OUTPUT_CHARS` |
| `read_file` + path sandbox | ✅ default | MCP |
| `submit_to_hub` | ✅ default | MCP |
| `ask_human` | ✅ default | native |
| Langfuse tracing | ✅ opt-in subpath | `observability/` |
| MemoryHooks (hub feedback, plan inject) | ✅ interface | Epizody: np. `evaluation_memory.ts` |
| Heartbeat multi-agent | ❌ | Lekcja `03_02_events` |
| Plan z statusami / zależnościami / równoległością | ❌ (częściowo plan turn 0) | Heartbeat >> planning phase |
| Email scope / RBAC per sesja | ❌ | Lekcja `03_02_email` |
| Prompt injection barrier (drugi LLM) | ❌ | Wzorzec produkcyjny, poza kursem |
| Deno / QuickJS `execute_code` | ❌ (by design) | `lessons/03_02_code`, `lessons/02_05_sandbox` |
| LLM response cache (aplikacyjny) | ❌ | Wzorzec epizodu (`classifyNotes.ts` w S03E01) |
| Shell API tool | ❌ | `http_request` wystarczy; cienki wrapper w epizodzie |

---

## 4. Ocena zasadności dodania do boilerplate

Skala: **Tak (core)** | **Tak (opt-in / osobny pakiet)** | **Nie (epizod / lekcja)** | **Tylko docs**

| # | Feature z lekcji | Rekomendacja | Uzasadnienie |
| --- | --- | --- | --- |
| 1 | Deno sandbox + `execute_code` | **Opt-in — osobny pakiet** (`@ai-devs/agent-code-mode`) | Zgodne z [sandbox-code-execution.research.md](../sandbox-code-execution/sandbox-code-execution.research.md); zależność Deno, 3 procesy, ukryte kroki w logach; **firmware tego nie potrzebuje** |
| 2 | Heartbeat + multi-agent + FS memory | **Nie** | Osobny orchestrator; nie pasuje do „minimal ReAct per episode”; OM w boilerplate wystarczy dla długich sesji **jednego** agenta |
| 3 | Strukturalny plan (statusy, deps, parallel) | **Nie w core**; ewent. **helper opt-in** w distant future | Turn 0 + `injectWorkingPlan` pokrywa 80% zadań kursowych; pełny task graph = over-engineering |
| 4 | Email-style RBAC / scope isolation | **Nie** | Silnie domenowe; implementacja w handlerach MCP epizodu |
| 5 | Prompt injection guard (drugi LLM) | **Tylko docs** | Poza scope homework; fałszywe poczucie bezpieczeństwa bez programistycznej kontroli narzędzi |
| 6 | Bogatsze błędy HTTP (ban, retry-after) | **Epizod** lub **mała modyfikacja `http_request`** | Niski koszt; **firmware** korzysta — można rozważyć w planie epizodu, nie obowiązkowo w core |
| 7 | Dedykowane MCP `shell_exec` | **Epizod `tasks/s03e02/`** | Cienka warstwa nad `http_request`; nie uniwersalne dla wszystkich zadań |
| 8 | Aplikacyjny cache odpowiedzi LLM | **Epizod** | S03E01 `classifyNotes` — wzorzec; uniwersalny cache w boilerplate bez polityki TTL/klucza = premature |
| 9 | Wybór modelu per rola (reasoning vs mini) | **Już jest** | `config.ts`, osobne adaptery / `chat()` w domain |
| 10 | Brak narzędzi nieodwracalnych | **Wzorzec projektowy** | Nie rejestrować `send_email` — dokumentacja w boilerplate-documentation |
| 11 | Deterministyczne filtry przed LLM | **Epizod (MCP TS)** | Wzorzec S03E01 — najlepsza lekcja S03E02 w praktyce kursu |
| 12 | `@ai-devs/agent-evals` | **Już osobny pakiet** | Zgodnie z S03E01; evals email activities → tam, nie boilerplate |

### 4.1 Reguła decyzyjna (z README boilerplate)

```text
≤5 tur ReAct i ≤4 narzędzia w prompcie → default boilerplate (bez discovery, OM, code mode).
Wiele wywołań MCP / duży FS / agregacja → lekcja code mode lub deterministyczne MCP w TS.
Multi-agent / heartbeat → lekcja events, nie pakiet kursowy.
```

Homework **firmware** = profil pierwszej kategorii (shell + hub, sekwencja komend, reasoning).

---

## 5. Rekomendacje priorytetowe

### Nie dodawać teraz do `@ai-devs/agent-boilerplate`

1. Heartbeat / multi-agent orchestration  
2. Deno sandbox w core (pozostaje `lessons/03_02_code` + ewent. przyszły `@ai-devs/agent-code-mode`)  
3. Prompt-injection middleware  
4. Email RBAC framework  
5. Uniwersalny LLM cache  

### Warto zrobić (poza boilerplate lub minimalnie)

| Działanie | Gdzie |
| --- | --- |
| Epizod `tasks/s03e02/` — agent `firmware` | MCP `shell` (wrapper POST), prompty, obsługa ban w toolu |
| Krótka sekcja w `boilerplate-documentation.md` | „Project constraints (S03E02)” — tabela wzorców vs antywzorców |
| Opcjonalnie: rozszerzenie `http_request` o czytelniejsze body przy 429/ban | Boilerplate — **tylko jeśli** więcej niż jeden epizod tego wymaga |

### Kiedy wrócić do code mode w monorepo

- Gdy pojawi się zadanie w `tasks/` wymagające batch >10 MCP lub agregacji 100k+ linii **generowanego przez agenta kodu** (nie przez developera w TS).  
- **Nie** dlatego, że lekcja S03E02 go pokazuje — edukacyjnie wystarczy link do `lessons/03_02_code`.

---

## 6. Weryfikacja: S03E01 plan vs realizacja

**Plan:** [s03e01-evaluation.plan.md](../../../s03e01/docs/specs/s03e01-evaluation/s03e01-evaluation.plan.md)  
**Research:** [s03e01-evaluation.research.md](../../../s03e01/docs/specs/s03e01-evaluation/s03e01-evaluation.research.md)

| Obszar | Plan | Stan | Werdykt |
| --- | --- | --- | --- |
| Fazy A–D (MVP) | ✅ done | Kod, pipeline, hub `{FLG:BUGGYSYSTEM}` | **PASS** |
| Faza E (polish) | ✅ done | README, testy scan, memory, classify retry | **PASS** |
| `bun test` + `tsc` | wymagane | 7 testów pass, tsc clean (2026-05-30) | **PASS** |
| Architektura scan → classify → build → submit | tak | Zgodna z research | **PASS** |
| Bez sandbox / OM / discovery | tak | Potwierdzone w `run.ts` | **PASS** |
| Langfuse opt-in | tak | `run.ts` + noop bez kluczy | **PASS** |
| `injectWorkingPlan` po błędzie hub | E4 | `evaluation_memory.ts` + test | **PASS** |
| E2E agent | E7 | Plan: ~4.5 min, flag OK | **PASS** (wg plan changelog) |

**Luka:** brak — plan i implementacja są spójne. Epizod S03E01 jest **wzorcową aplikacją** tezy S03E02: deterministyczny TS (scan) + minimalny LLM (batch notatek) + lekki ReAct.

---

## 7. User stories (backlog — tylko jeśli zaakceptujesz scope)

| ID | Jako… | Chcę… | Aby… | Pakiet |
| --- | --- | --- | --- | --- |
| MC-1 | maintainer | sekcję S03E02 w boilerplate-documentation | studenci widzieli mapę wzorców | docs |
| MC-2 | student S03E02 | epizod firmware na boilerplate | solve homework bez code mode | `tasks/s03e02/` |
| MC-3 | maintainer | `@ai-devs/agent-code-mode` (Deno) | replikować lekcję 03_02_code w tasks | osobny pakiet — **defer** |

---

## 8. Assumptions

- Lekcje `03_02_email` i `03_02_events` nie są jeszcze w submodule `lessons/` tego workspace — opis oparty na transkrypcie markdown.
- Homework bieżącego epizodu to **`firmware`** (shell VM), nie PDF/code mode.
- Boilerplate pozostaje **minimalnym runtime ReAct** dla zadań kursowych.

---

## 9. Suggested next steps

1. **Human gate:** akceptacja tego research (czy zgadzasz się z werdyktem „nie rozszerzać core”).  
2. Opcjonalny plan: `s03e02-model-constraints.plan.md` — **tylko docs** lub docs + epizod `firmware`.  
3. Implementacja **`tasks/s03e02/`** (osobny wątek) — poza scope boilerplate unless approved.  
4. Brak zmian w boilerplate bez osobnej decyzji na MC-3 (code mode package).

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-05-30 | Research początkowy — lekcja S03E02 vs boilerplate + weryfikacja S03E01 |
