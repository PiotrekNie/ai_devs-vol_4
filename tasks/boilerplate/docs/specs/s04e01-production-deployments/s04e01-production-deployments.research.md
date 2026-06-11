# S04E01 — Wdrożenia rozwiązań AI → boilerplate (research)

**Task:** Przeanalizować lekcję S04E01 pod kątem opisanych funkcjonalności i ocenić, czy którekolwiek z nich warto dodać do `tasks/boilerplate` (`@ai-devs/agent-boilerplate`) — **w oderwaniu od zadania homework `okoeditor`**.

**Data:** 2026-06-11  
**Status:** Research **zaakceptowany** (2026-06-11); implementacja docs **zrealizowana** (2026-06-11).  
**Plan:** [s04e01-production-deployments.plan.md](s04e01-production-deployments.plan.md) — Opcja A (§**2.5** w spec) — **done**.

**Źródła:**

- `markdowns/s04e01-wdrozenia-rozwiazan-ai-1774824465.md` — transkrypt lekcji
- `lessons/04_01_garden/` — referencyjna implementacja „Cyfrowego Ogrodu” (Daytona, skills, workflows, code mode, git push, static site)
- `tasks/boilerplate/` — ReAct runtime, MCP, OM, tool discovery, observability
- `tasks/docs/boilerplate-documentation.md` — spec produktowa (§2.1–2.4)
- `tasks/boilerplate/docs/specs/sandbox-code-execution/` — precedens: sandbox → opt-in / lekcja, nie core
- `tasks/boilerplate/docs/specs/s03e02-model-constraints/` … `s03e05-nondeterministic-models/` — werdykty „docs vs core”

**Weryfikacja UI:** brak (lekcja zawiera demo `04_01_garden` i panel webowy homework — poza scope tego researchu).

**Scope wyłączony:** homework **`okoeditor`** (API `/verify`, panel `oko.ag3nts.org`) — osobny profil epizodu hub; nie wpływa na werdykt rozszerzeń pakietu kursowego.

---

## 1. Executive summary

**Werdykt: lekcja S04E01 uczy głównie *myślenia o wdrożeniu* (profil systemu, sync vs async, balans kod/AI, szybkie testy hipotez), a nie brakujących elementów domyślnego runtime ReAct. Do boilerplate wchodzi przede wszystkim dokumentacja (proponowane §**2.5** w `boilerplate-documentation.md`) oraz ewentualnie **1–2 wiersze** w README — bez Daytona, terminala, `git_push`, skills/workflows z plików ani pipeline’u static site.**

| Obszar lekcji | W boilerplate domyślnie? | Gdzie indziej |
| --- | --- | --- |
| ReAct + MCP + hub (`http_request`, `/verify`) | **Tak** | `@ai-devs/agent-boilerplate` |
| Oczekiwania vs rzeczywistość wdrożeń | **Docs** | §2.5 — kiedy nie rozszerzać pakietu |
| Sync vs async współpraca z AI | **Docs** | §2.5 + `lessons/03_02_events/` |
| Mapa decyzyjna (kod vs model, „czego nie robić”) | **Docs** | §2.5; epizod wybiera profil |
| Proste testy hipotez (eval, frontmatter, search vs chat) | **Częściowo** | `@ai-devs/agent-evals`, Promptfoo w lekcjach; frontmatter = wzorzec epizodu |
| Cyfrowy Ogród (`04_01_garden`) | **Nie** | `lessons/04_01_garden/` — osobna aplikacja |
| Sandbox Daytona + terminal | **Nie** | lekcja garden (+ porównanie w `sandbox-code-execution`) |
| Code mode (skrypty w sandboxie) | **Nie** | garden; QuickJS/Deno w innych lekcjach |
| Skills (`/nazwa`, `SKILL.md`, subset narzędzi) | **Nie** | garden; analogia do Cursor Skills / Eversis — warstwa aplikacji |
| Workflows w markdown | **Nie** | garden `vault/system/workflows/` |
| `git_push` / publikacja GitHub Pages | **Nie** | garden + CI; zbyt wysokie uprawnienia dla default pakietu |
| Static site z markdown (`grove/`) | **Nie** | garden — kompilator treści, nie agent runtime |
| `web_search` (builtin OpenAI) | **Nie** | garden — wiązanie z Responses API / providerem |
| Response chaining (`previous_response_id`) | **Nie** | garden `src/ai/client.ts` — inny kontrakt niż `createAIAdapter` |
| Multi-agent (wielu agentów, bez bezpośredniej współpracy) | **Nie** | garden + `lessons/03_02_events/` |

**Reguła kciuka (spójna z S03E02–S03E05):**

```text
Homework hub (≤5 tur, http_request + własne MCP, /verify) → default boilerplate bez zmian.
Wdrożenie produkcyjne / Digital Garden / terminal / git / publikacja → lekcja 04_01_garden lub aplikacja poza pakietem.
Sandbox wykonania kodu → lekcje (02_05, 03_02, 04_01) lub przyszły @ai-devs/agent-code-mode — nie default install.
Skills / workflows z plików → host aplikacji (garden), nie createAgent.
```

---

## 2. Funkcjonalności z lekcji (poza homework `okoeditor`)

### 2.1 Warstwa koncepcyjna — wdrożenia AI

| Temat | Opis | Runtime w boilerplate? |
| --- | --- | --- |
| Wdrożenia ≈ wdrożenia niewykorzystujące AI | Procesy, iteracje, ryzyko błędnych założeń | **Docs** — nie nowy moduł |
| „Buduj dla siebie” / dogfooding | Lepsza intuicja przed skalą | **Poza pakietem** — filozofia kursu |
| Oczekiwania vs rzeczywistość | Limity kontekstu, koszt, latency, brak vision w tekście, API | Częściowo **już** w §2.1 S03E02 |
| Sync vs async | Chat + nadzór człowieka vs procesy w tle | **Docs** — profil epizodu vs `03_02_events` |
| Hybryda (edytor + workflow + agenci) | Minimalna konfiguracja, zasady w plikach | **Lekcja garden** — nie generyczny kontrakt |
| Balans kod / AI (70–30 → czasem odwrotnie) | Większość to znany backend/frontend | **Docs** — kiedy deterministyczny TS w MCP |
| Mapa decyzyjna architektury | User, treść, format, integracje, publikacja, dostępność | **Docs** — checklista przy nowym epizodzie |
| „Proste testy” założeń | Frontmatter, eval datasetów, search zamiast chatbota | **Wzorce** — eval w `agent-evals`; frontmatter w kodzie epizodu |
| Źródła wiedzy (blogi, Pi, HumanLayer…) | Inspiracja produktowa | **Poza repo** — linki w docs opcjonalnie |

**Wniosek:** Ta część lekcji **nie proponuje nowych API w `createAgent`**. Wartością dla monorepo jest **§2.5** — most między „epizod hub” a „aplikacja jak garden”.

### 2.2 Referencyjny projekt `04_01_garden`

Lekcja prezentuje **pełną aplikację wdrożeniową**, nie minimalny pakiet kursowy.

| Komponent | Mechanizm | Dlaczego poza boilerplate |
| --- | --- | --- |
| **Agent loop** | Własna pętla (`src/agent/loop.ts`), nie `createAgent` | Inny stack (Responses API, `previous_response_id`) |
| **Szablony agenta** | `vault/system/main.agent.md` + gray-matter | Identyfikacja, model, lista narzędzi z pliku — **warstwa aplikacji** |
| **Workflows** | Markdown w `vault/system/workflows/` dołączany do instructions | Specjalizacja garden (research, cykliczne notatki) |
| **Skills** | `SKILL.md`, `/skill-name`, `allowed_tools`, metadata JSON | Wzorzec Claude Code / Cursor — **host**, nie runtime kursu |
| **Daytona sandbox** | `@daytonaio/sdk`, sync `vault/` ↔ VM | Zewnętrzna usługa, koszt, sync — [sandbox research §2.1 warstwa B](sandbox-code-execution/sandbox-code-execution.research.md) |
| **`terminal`** | `sandbox.process.executeCommand` w vault | Wymaga Daytona; niebezpieczne w default homework |
| **`code_mode`** | Node w sandboxie, most `codemode.vault.*` | Inna implementacja niż QuickJS/Deno; garden-specific |
| **`git_push`** | Commit + push z sandboxa | Akcja nieodwracalna — sprzeczna z linią S03E02 (brak maili/shell bez limitów w pakiecie) |
| **`web_search`** | Builtin OpenAI w `definitions()` | Provider-specific; boilerplate trzyma adapter ogólny |
| **Grove** | MD → HTML, `menu.json`, GitHub Pages | Kompilator statyczny — 0 związku z ReAct |
| **Deploy** | `.github/workflows/deploy.yml` | DevOps epizodu/lekcji |

**Wniosek:** `04_01_garden` to **cel edukacyjny „zobacz co jest pod spodem”** (jak Claude Code), zgodny z tezą lekcji. Przeniesienie do `@ai-devs/agent-boilerplate` **rozmyłoby** kontrakt pakietu i skopiowałoby całą aplikację.

### 2.3 Porównanie profili agenta

| Wymiar | Typowy epizod `tasks/sXXeYY/` | `04_01_garden` |
| --- | --- | --- |
| Cel | Jedno zadanie hub, flaga `/verify` | Długotrwała baza wiedzy + publikacja |
| Interfejs | `run.ts` + opcjonalnie stdin | API + edytor + minimalny chat |
| Sesja | Krótka (≤5–10 tur) | Wieloturowa, pliki jako pamięć |
| Narzędzia | `http_request`, domenowe MCP | terminal, code_mode, git_push |
| Sandbox | `read_file` chroot | Pełny VM + shell |
| Bezpieczeństwo | Brak destrukcyjnych akcji w core | Git push, dowolne komendy w VM |
| Orchestracja | ReAct w `createAgent` | Własna pętla + skills/workflows |

**Wniosek:** Garden ilustruje **inny produkt** niż boilerplate. Wspólny mianownik: pętla LLM → narzędzia → wynik — już pokryty przez pakiet kursowy.

### 2.4 Zbieżność z wcześniejszymi lekcjami (mapowanie bez duplikacji)

| Temat S04E01 | Już w research / boilerplate |
| --- | --- |
| Code mode + MCP/CLI | `sandbox-code-execution` — QuickJS, Deno, Daytona jako **warstwa B** |
| Pliki jako pamięć / procesy w plikach | S02E03, S03E05 awareness — poza default |
| Metadata / frontmatter kierujący agenta | S03E03 — blok w user message |
| Eval przed wyborem modelu | S03E04 — Promptfoo (lekcja), `agent-evals` (trajektorie) |
| Proaktywność / agenci w tle | S03E02, S03E03 — `03_02_events`, nie core |
| Tool discovery | S02E05 / S03E05 — `toolDiscovery` opt-in |
| „Nie wszystko przez LLM” | S03E02 — deterministyczny TS w MCP |

S04E01 **nie wprowadza nowej klasy mechaniki runtime**, której nie da się przypisać do istniejących §2.1–2.4 — dodaje **ramę wdrożeniową** i **jeden duży przykład integracji**.

---

## 3. Mapowanie na stan `tasks/boilerplate`

### 3.1 Już pokryte (bez zmian)

| Potrzeba z lekcji / kursu | Mechanizm |
| --- | --- |
| ReAct + function calling | `createAgent`, `agent.ts` |
| HTTP + retry 429/503 | `http_request`, `fetchWithRetry` |
| Weryfikacja zadania kursowego | `submit_to_hub` |
| Odczyt plików (ograniczony) | `read_file` (chunk, ścieżka względem zadania) |
| Vision | `analyze_image_vision` |
| Lazy schematy MCP | `toolDiscovery` (opt-in) |
| Długa sesja | OM (opt-in) |
| Plan tury 0 | `enablePlanningPhase` |
| Człowiek w pętli | `ask_human` |
| Observability / eval trajektorii | Langfuse opt-in, `@ai-devs/agent-evals` |
| Metadata w wiadomości | Wzorzec S03E03 (kod epizodu) |

### 3.2 Luka dokumentacyjna (warto uzupełnić)

Brak sekcji **§2.5** w `tasks/docs/boilerplate-documentation.md` dla:

- **profilu wdrożeniowego** vs **profilu homework hub**;
- sync vs async i kiedy wynieść orchestrację poza `createAgent` (`03_02_events`);
- **mapy decyzyjnej** (format treści, integracje, publikacja, dostępność) — jako checklista autora epizodu, nie feature flag;
- **„prostych testów”** — frontmatter, dataset + eval, alternatywa bez chatbota (wyszukiwarka);
- jawnego mapowania **`04_01_garden`** → lekcja, **nie** import z boilerplate;
- trzeciego wariantu sandboxa (**Daytona**) obok QuickJS/Deno w §5.2.1;
- skills/workflows — analogia do Cursor/Eversis skills, implementacja w **hoście aplikacji**.

### 3.3 Rozszerzenia runtime — ocena

| Propozycja | Zysk | Koszt / ryzyko | Rekomendacja |
| --- | --- | --- | --- |
| MCP `write_file` / `edit_file` w core | Prostsze modyfikacje vault | Destrukcyjne I/O w każdym epizodzie; homework zwykle nie edytuje repo | **Nie** — epizod lub lekcja |
| `terminal` w pakiecie | Zgodność z garden | Shell bez VM = krytyczne ryzyko; z VM = Daytona dep | **Nie** |
| Integracja Daytona w boilerplate | Demo „jak na produkcji” | `@daytonaio/sdk`, klucze, koszt, sync | **Nie** — tylko `04_01_garden` |
| Moduł **skills** (`/command`, `SKILL.md`) | UX jak Claude Code | Duży host-specific API; nie każdy epizod | **Nie** — opcjonalny wzorzec w docs |
| Loader **workflows** z markdown | Procesy z plików | Nakłada się na prompty epizodu + planning | **Nie** |
| `git_push` MCP | Publikacja jak garden | Nieodwracalne; poza linią bezpieczeństwa kursu | **Nie** |
| `web_search` w adapterze | Research w sieci | Provider lock-in; ograniczona kontrola kosztu | **Nie** — `http_request` + API epizodu |
| `previous_response_id` w `ai.ts` | Tańszy kontekst OpenAI | Łamie abstrakcję adaptera; tylko Responses API | **Nie** — garden / osobny adapter |
| Domyślne OM / planning dla wszystkich | Lepsze długie sesje | Overkill dla ≤5 tur hub | **Nie** — pozostaje opt-in |
| Pakiet `@ai-devs/agent-garden` | Reużycie garden | 0 epizodów `tasks/`; cała aplikacja | **Defer** — jak `@ai-devs/agent-code-mode` |
| Rozszerzenie `read_file` o zapis | Mniej narzędzi | Mylenie odczytu z mutacją | **Nie** — osobne narzędzie w epizodzie jeśli potrzeba |

---

## 4. Homework `okoeditor` (tylko granica scope)

Zadanie **`okoeditor`** (panel webowy tylko do odczytu, edycja wyłącznie przez API `/verify`) **nie wymaga** rozszerzenia boilerplate — profil jak inne epizody hub: ReAct + `http_request` + ewentualnie wąskie MCP w `tasks/s04e01/`. Nie analizowano API ani wymagań zadania; werdykt dotyczy wyłącznie lekcji i `04_01_garden`.

---

## 5. Rekomendacje priorytetowe

### Nie dodawać do `@ai-devs/agent-boilerplate` (core)

1. Daytona / zdalny sandbox i `terminal`  
2. `code_mode` w stylu garden (Node w VM)  
3. `git_push` i narzędzia publikacji  
4. System skills (`/invoke`, frontmatter `SKILL.md`)  
5. Loader workflows z katalogu markdown  
6. Static site pipeline (`grove`)  
7. Builtin `web_search`  
8. Response chaining jako domyślna ścieżka w `createAIAdapter`  
9. Multi-agent orchestration w `agent.ts`  

### Warto zrobić (niska intruzywność — precedens S03E02–E05)

| Opcja | Zakres | Szacowany effort |
| --- | --- | --- |
| **A (zalecana)** | §**2.5** w `tasks/docs/boilerplate-documentation.md` + krzyżowe linki; opcjonalnie wpis w README (Feature catalog / „Production deployments”); uzupełnienie §5.2.1 o **Daytona** jako trzeci wariant | Mały |
| **B** | Jedna strona w `lessons/04_01_garden/README.md` — „relacja do `@ai-devs/agent-boilerplate`” (jeśli brak) | Mały |
| **C** | Pakiet `@ai-devs/agent-code-mode` lub `@ai-devs/agent-garden` | **Defer** — dopóki ≥2 epizody `tasks/` tego wymagają |
| **D** | `write_file` / `terminal` w core „dla wygody” | **Odrzucone** — bezpieczeństwo i misja pakietu |

---

## 6. Proponowana treść §2.5 (szkic do planu)

Tabela docelowa (skrót — pełna wersja w planie implementacji docs):

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Profil systemu** | Homework hub: wąski ReAct, `/verify` | Kopiowanie garden do każdego epizodu | §2.1; `tasks/sXXeYY/` |
| **Sync vs async** | Sync: `ask_human`, krótka sesja | Heartbeat w `createAgent` | `03_02_events/` |
| **Sandbox** | `read_file` chroot w hub | Terminal/git w default pakiecie | §5.2.1; `04_01_garden` |
| **Code mode** | Lekcja gdy wiele kroków MCP | `execute_code` w default install | `02_05_sandbox`, `03_02_code`, garden |
| **Skills / workflows** | Pliki w hoście aplikacji | Publiczne API skills w boilerplate | `04_01_garden/vault/system/` |
| **Publikacja** | CI/CD aplikacji (Pages) | `git_push` w MCP kursu | garden `.github/` |
| **Test hipotez** | Dataset + eval przed pełnym UI | Pełny chatbot „na wszelki wypadek” | S03E04; `agent-evals` |
| **Balans kod/AI** | Transformacje w MCP TS | Model wybiera ścieżkę API | §2.1 S03E02 |

**Reguła kciuka §2.5:**

```text
Epizod hub (HTTP, ≤5 tur, brak mutacji repo) → default boilerplate.
Wdrożenie jak Digital Garden (terminal, git, publikacja, skills) → lessons/04_01_garden — nie rozszerzaj pakietu.
Potrzebujesz write/terminal → osobny epizod z jawnymi guardami LUB lekcja garden — nie core.
```

---

## 7. Otwarte pytania (do akceptacji research)

| # | Pytanie | Propozycja domyślna |
| --- | --- | --- |
| 1 | Czy §2.5 ma linkować homework `okoeditor`? | **Nie** — tylko wzmianka „epizody hub bez zmian pakietu” |
| 2 | Czy w README dodać diagram „hub vs garden”? | **Opcjonalnie** — jeden ASCII lub link do obrazka z lekcji |
| 3 | Czy planować `@ai-devs/agent-garden`? | **Defer** — brak epizodów `tasks/` wymagających garden |
| 4 | Czy uzupełnić `sandbox-code-execution.research.md` o Daytona? | **Tak** w §2.5 lub jednym akapicie w §5.2.1 — bez nowego modułu |
| 5 | Czy `04_01_garden` ma konsumować boilerplate w przyszłości? | **Poza scope** — osobna decyzja; obecnie osobny runtime |

---

## 8. Następne kroki (po akceptacji research)

1. **Plan:** `s04e01-production-deployments.plan.md` — Opcja A: dokumentacja (checklist jak S03E05 plan).  
2. **Implementacja docs:** §2.5 + ewentualny wpis CHANGELOG (Unreleased) + krótki cross-link w `sandbox-code-execution`.  
3. **Brak zmian w `tasks/boilerplate/src/`** w ramach Opcji A.

---

## 9. Werdykt końcowy (odpowiedź na pytanie użytkownika)

**Czy w lekcji S04E01 można rozbudować `tasks/boilerplate`?**

- **Tak, zasadnie i zgodnie z linią S03E02–S03E05** — ale prawie wyłącznie przez **dokumentację produktową** (§2.5): profil wdrożeniowy vs epizod hub, mapowanie `04_01_garden` na lekcję, sync/async, testy hipotez, balans kod/AI.
- **Nie zasadnie w core runtime** — Daytona, terminal, `git_push`, skills/workflows, static site, `web_search` i własna pętla Responses API to **osobna aplikacja** (`lessons/04_01_garden/`), nie brakujące klocki pakietu ReAct.
- **Homework `okoeditor`** (pominięty w analizie) **nie uzasadnia** rozszerzenia boilerplate — typowy profil hub na istniejącym stosie.

**Implikacja:** najlepszy ROI = **Opcja A (docs §2.5)**; pełny lub częściowy port garden do `@ai-devs/agent-boilerplate` **obniżyłby** czytelność pakietu i naruszyłby ustaloną linię bezpieczeństwa (destrukcyjne narzędzia poza lekcjami).

---

## 10. Assumptions

- Analiza oparta na markdownie w repo (`published_at: 2026-03-30` — scheduled); treść może się nieznacznie zmienić przed publikacją.
- `lessons/04_01_garden/` pozostaje **niezależnym** runtime (własny `package.json`, brak zależności od `@ai-devs/agent-boilerplate` w chwili research).
- Użytkownik świadomie wyłączył **`okoeditor`** z głębokiej analizy — granica scope w §4.
- Brak epizodu `tasks/s04e01/` w git status na moment research (może powstać osobno).
