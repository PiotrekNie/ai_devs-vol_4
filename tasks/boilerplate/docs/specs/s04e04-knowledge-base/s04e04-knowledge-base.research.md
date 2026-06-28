# S04E04 — Projektowanie własnej bazy wiedzy dla AI → boilerplate (research)

**Task:** Przeanalizować lekcję S04E04 pod kątem opisanych funkcjonalności i metodologii oraz ocenić, czy którekolwiek z nich warto dodać do `tasks/boilerplate` (`@ai-devs/agent-boilerplate`) — **w oderwaniu od zadania domowego `filesystem`**.

**Data:** 2026-06-28  
**Status:** Research **zaakceptowany** (2026-06-28); plan: [s04e04-knowledge-base.plan.md](s04e04-knowledge-base.plan.md) — Opcja A + B — **zrealizowany** (2026-06-28).

**Powiązane:**

- [observational-memory.research.md](../observational-memory/observational-memory.research.md) — OM kompresuje **historię sesji**; nie zastępuje bazy wiedzy
- [s04e01-production-deployments.research.md](../s04e01-production-deployments/s04e01-production-deployments.research.md) — garden, vault, skills/workflows, frontmatter
- [s04e02-active-collaboration.research.md](../s04e02-active-collaboration/s04e02-active-collaboration.research.md) — kanał współpracy; KB jako „kod źródłowy” poza programowaniem
- [s04e03-contextual-collaboration.research.md](../s04e03-contextual-collaboration/s04e03-contextual-collaboration.research.md) — AI w tle, izolacja agentów, samonadzór
- [s03e03-contextual-feedback.research.md](../s03e03-contextual-feedback/s03e03-contextual-feedback.research.md) — metadata, triggery, proaktywność
- [boilerplate-documentation.md](../../../docs/boilerplate-documentation.md) — §2.1–§2.7

**Źródła:**

- `markdowns/s04e04-projektowanie-wlasnej-bazy-wiedzy-dla-ai-1775085192.md` — transkrypt lekcji (`published_at: 2026-04-02`, status: scheduled)
- `lessons/04_04_system/` — referencyjny system wieloagentowy oparty na vault markdown (Me / World / Craft / Ops / System)
- `lessons/02_04_ops/` — precedens `delegate` + profile agentów z frontmatter
- `lessons/04_01_garden/` — vault, workflows, publikacja treści
- `tasks/boilerplate/` — ReAct, `read_file` (read-only), OM, planning, tool discovery, MCP

**Weryfikacja UI:** brak (lekcja koncepcyjna + diagramy; demo `04_04_system` to CLI).

**Scope wyłączony:** homework **`filesystem`** (wirtualny FS hub: `createFile`, `listDir`, `batch_mode`, `/verify`, uporządkowanie notatek Natana) — osobny profil epizodu hub; **nie wpływa** na werdykt rozszerzeń pakietu kursowego.

---

## 0. Konspekt lekcji

**Tytuł:** S04E04 — Projektowanie własnej bazy wiedzy dla AI  
**Źródło:** `markdowns/s04e04-projektowanie-wlasnej-bazy-wiedzy-dla-ai-1775085192.md`  
**Materiały:** film główny [Vimeo 1177416750](https://vimeo.com/1177416750); demo `lessons/04_04_system/` (`npm run lesson19:system`, `lesson19:daily-news`, `lesson19:examples`)

### 0.1 Teza wprowadzająca

- W programowaniu agent korzysta z **kodu źródłowego** — stąd personalizacja nawet przy ogólnych zapytaniach.
- Poza kodem „źródłem prawdy” stają się **instrukcja systemowa**, **bieżąca rozmowa** oraz **baza wiedzy** (pliki, vault, kontekst).
- W repo kursu odpowiednikiem są już: plany, specyfikacje (`docs/specs/`), skills (`.cursor/skills/`) — lekcja przenosi ten wzorzec na **prywatną / firmową** przestrzeń wiedzy.

### 0.2 Budowanie *własnej* bazy wiedzy

| Temat | Treść lekcji |
| --- | --- |
| Podejście | Nie uniwersalny przepis, lecz **„jak zbudować WŁASNĄ KB?”** — często wniosek: KB w ogóle nie jest potrzebna |
| Odkrywanie zakresu | Rozmowa z AI: co automatyzować, czego **nie** podłączać do agentów; lista jest skończona (domeny, nawyki, narzędzia) |
| Iluzja pełnej automatyzacji | Ćwiczenie mapowania **obala** mit „AI zrobi wszystko”; kompletność listy przychodzi z **praktyki**, nie tylko planowania |
| Obszary „nie automatyzujemy, ale czytamy” | Np. treści tworzone ręcznie — agent ma **odczyt**, bez przejmowania tworzenia |
| Start | **Jeden obszar** lub **jedna aktywność** (newsletter, hobby, plan dnia); najpierw coś przyjemnego, potem użyteczne |
| Bez kodu na początek | Folder KB → Claude Code / MCP / CLI; dopiero później serwer zdalny i własna logika agenta |

### 0.3 Proponowana struktura katalogów

Lekcja (polskie nazwy) ↔ demo `04_04_system` (angielskie):

| Obszar (lekcja) | Katalog (demo) | Właściciel / rola |
| --- | --- | --- |
| **Profil** | `me/` | Człowiek — wartości, preferencje, rozwój; agent: wybrane fragmenty |
| **Świat** | `world/` | Ludzie, miejsca, narzędzia, źródła; konfiguracja pracy |
| **Tworzenie** | `craft/` | Praca koncepcyjna, projekty, eksperymenty, publikacje |
| **Operacje** | `ops/` | Głównie agenci — procesy, wyniki researchu (np. `daily-news/`) |
| **System** | `system/` | Metadane systemu — szablony, reguły, profile agentów, statusy |

**Organizacja treści:** elementy Zettelkasten / PARA (atomowe notatki, linki); różne zasady dla człowieka vs agenta; notatka może zawierać tekst, kod, skrypty.

**Frontmatter notatki:** status, tagi, uprawnienia, odpowiedzialność, opcjonalnie „prompt” — poza polami pod publikację WWW.

### 0.4 Markdown jako format KB

| Aspekt | Wniosek lekcji |
| --- | --- |
| Zalety | Tekst, transformacje, wyszukiwanie; **naturalny dla LLM** |
| vs Notion / Google Docs | Współpraca wieloosobowa i ACL → Notion/Docs; MD tam, gdzie elastyczność pliku i agenci |
| Konwersja MD ↔ Notion | W praktyce **słaba** — świadomy podział obszarów |
| `with-md` | Eksperymentalne wzbogacenie MD dla agentów ([repo](https://github.com/emotion-machine-org/with-md)) — poza kursem |
| Obrazy | **URL zdalne**, nie lokalne załączniki — agent i vision (S01E04); kontrola uprawnień i ważności linków |

### 0.5 Baza wiedzy a pamięć długoterminowa (S02E03)

- W zaawansowanym systemie **KB i pamięć długoterminowa zlewają się** w jednej przestrzeni plików; treść tworzą człowiek i AI.
- Notatki pisane „dla siebie” mają **luki z perspektywy agenta** (niejawne odniesienia, skrócone linki, „ostatnia rozmowa”, nadpisywanie wersji).
- **Zasada:** notatka musi być zrozumiała **bez zewnętrznego kontekstu** czytelnika.

### 0.6 Rola AI przy pracy na KB (balans)

**Człowiek:** treść merytoryczna + główne zasady.  
**AI (dozwolone):**

| Rola | Opis |
| --- | --- |
| Transformacja | Formatowanie, korekta, transkrypcja z audio/obrazu — człowiek pozostaje źródłem |
| Szablony | Utrzymanie struktury z `system/templates/` |
| Organizacja | Sprawdzenie miejsca notatki; sugestia przeniesienia z uzasadnieniem |
| Linkowanie | Zasady w notatce reguł; wsparcie modelu |
| Walidacja | Spójność linków, struktury, organizacji |
| Komentowanie | Osobna przestrzeń — **nie** treść notatki autora |
| Indeksowanie (MoC) | Map of Content — indeks obszaru; generacja programistyczna lub agent |
| Audytowanie | Łączenie duplikatów, archiwizacja szumu |

### 0.7 Połączenie z agentami — demo `04_04_system`

| Element | Opis |
| --- | --- |
| Architektura | Multi-agent; **vault markdown = główna logika** (Me / World / Craft / Ops / System) |
| Szablony | `workspace/system/templates/` — typy: osoba, miejsce, zdarzenie, narzędzie, zasób, idea, eksperyment… |
| Tworzenie notatki | Agent: MoC → szablon → nowy wpis **lub** uzupełnienie istniejącego; **wiele wywołań LLM** na jedną notatkę |
| Nawigacja | Agent nie tylko zapisuje — **porusza się** po KB → autonomiczne procesy |
| Workflow `ops/daily-news` | Pliki: `_info.md`, `01-research.md`, `02-assemble.md`, `03-deliver.md`; delegacja między agentami (research → assemble → deliver) |
| Trigger | Np. codzienne „Wykonaj proces daily-news” — agenci w tle |
| Synteza kursu | Łączy: S02E03 (pamięć), S02E04 (multi-agent), S04E01 (ogród), S04E02 (współpraca), S04E03 (tło), system plików |

**Uruchomienie demo:**

```bash
npm run lesson19:system          # interaktywnie — Alice + KB
npm run lesson19:daily-news      # pipeline daily-news
npm run lesson19:examples -- 3  # przykładowe zapytania (np. osoba)
```

### 0.8 Fabuła (skrót)

Natan — ocalały spoza systemu; notatki o **handlu wymiennym** między miastami (osoby, towary, zamówienia) w chaosie; elektrownia potrzebuje **uporządkowanej struktury** danych (motyw zadania domowego).

### 0.9 Zadanie praktyczne: `filesystem` *(poza analizą boilerplate)*

| Pole | Wartość |
| --- | --- |
| Cel | Uporządkowanie notatek Natana w **wirtualnym FS** hub |
| API | `/verify/`, akcje: `help`, `createFile`, `listDir`, `reset`, `done`; opcjonalnie **batch_mode** |
| Dane | [natan_notes.zip](https://hub.ag3nts.org/dane/natan_notes.zip); [podgląd FS](https://hub.ag3nts.org/filesystem_preview.html) |
| Struktura wynikowa | `/miasta` (JSON zapotrzebowania), `/osoby` (handlowcy + link MD do miasta), `/towary` (oferta + link do miasta); bez polskich znaków w nazwach/JSON |

*Szczegółowa analiza implementacji homework → §5; nie wpływa na werdykt rozszerzeń `@ai-devs/agent-boilerplate`.*

---

## 1. Executive summary

**Werdykt: lekcja S04E04 to synteza linii S02E03 (pamięć/dokumenty) + S04E01 (vault/garden) + S04E03 (procesy w tle) wokół **markdownowej bazy wiedzy** jako głównego „kodu źródłowego” agenta poza repozytorium aplikacji. To głównie **architektura produktowa i organizacja treści**, nie brakujące API w domyślnym ReAct.**

| Obszar lekcji | W boilerplate domyślnie? | Gdzie indziej |
| --- | --- | --- |
| ReAct + MCP + hub | **Tak** | `@ai-devs/agent-boilerplate` |
| Struktura KB (Profil / Świat / Tworzenie / Ops / System) | **Docs** | proponowane §**2.8**; `04_04_system/workspace/` |
| Markdown + frontmatter (uprawnienia, tagi, prompt w notatce) | **Wzorzec** | lekcja; epizod; garden `vault/` |
| Notatki „bez założonego kontekstu” (linki, MoC, wersje) | **Docs** | §2.8; reguły w `workspace/system/rules/` |
| Podział ról: człowiek = treść, AI = organizacja | **Docs** | §2.8; playbooks w ops/ |
| Szablony notatek (templates) | **Nie** | `04_04_system/workspace/system/templates/` |
| Mapy treści (MoC) | **Nie** | vault + opcjonalny worker |
| Audyt / walidacja struktury KB | **Częściowo** | worker + ReAct epizodu; [agent-evals](../../agent-evals/README.md) |
| Workflow w markdown (`ops/…`) | **Nie** | `04_04_system`, `04_01_garden` |
| Profile agentów z `.md` + `delegate` | **Nie** | `04_04_system`, `02_04_ops` |
| MCP plików (`list`, `write`, `glob`) | **Częściowo** | tylko **`read_file`** w boilerplate; pełny FS w lekcji |
| OM (Observer/Reflector) | **Opt-in** | kompresja **sesji**, nie nawigacja po vault |
| Wirtualny zdalny FS (homework) | **Nie** | `http_request` + batch w epizodzie |
| RAG / embeddingi / vector DB | **Nie** | lekcja nie promuje; nawigacja plikowa + linki |
| `with-md` (wzbogacony markdown) | **Poza repo** | koncepcja zewnętrzna |

**Reguła kciuka (spójna z §2.1–§2.7):**

```text
Epizod hub (≤5 tur, http_request, /verify, brak mutacji vault) → default boilerplate bez zmian.
Trwała baza wiedzy (szablony, ops/, multi-agent, zapis notatek) → lessons/04_04_system lub aplikacja poza pakietem.
Kompresja długiej sesji ReAct → OM opt-in — nie mylić z KB.
Homework filesystem (zdalny FS API, batch_mode) → epizod hub; deterministyczna orchestracja lub wąski ReAct.
```

**Implikacja:** najlepszy ROI = **Opcja A (docs §2.8)** + cross-linki do `04_04_system`, OM i §2.5–§2.7 w **osobnym MR**; **brak zmian w `tasks/boilerplate/src/`** w ramach tego scope.

---

## 2. Pozycja lekcji w kurriculum

| Lekcja | Fokus | Relacja do S04E04 |
| --- | --- | --- |
| **S02E03** | Pamięć długoterminowa, dokumenty zewnętrzne | S04E04: KB i pamięć **w tej samej przestrzeni** plików |
| **S02E04** | Orchestrator, `delegate`, wiele wątków | S04E04: procesy ops/ z delegacją faz |
| **S04E01** | Garden, vault, skills, publikacja | S04E04: ten sam format MD, inny układ katalogów |
| **S04E02** | Kanał współpracy (CLI, MCP) | S04E04: KB podłączana do Claude Code **bez kodu** na start |
| **S04E03** | AI w tle, izolacja, samonadzór | S04E04: daily-news = proces w tle z wieloma agentami |
| **S03E04** | Projektowanie narzędzi | S04E04: `files__*` MCP w lekcji — wąskie akcje, playbooks |

S04E04 **nie wprowadza nowej klasy runtime** niewidocznej w §2.1–§2.7 — **scala** vault + multi-agent + markdown workflows w jedną narrację „własna baza wiedzy”.

---

## 3. Funkcjonalności z lekcji (poza homework `filesystem`)

### 3.1 Budowanie *własnej* bazy wiedzy (indywidualność)

Lekcja odrzuca uniwersalny przepis na „jak budować KB” na rzecz:

- mapowania **własnych** obszarów (co automatyzować / czego nie);
- startu od **jednej aktywności** (newsletter, hobby, plan dnia);
- iteracji przez praktykę, nie tylko planowanie.

| Obserwacja | Implikacja dla boilerplate |
| --- | --- |
| KB jest **produktowa**, nie kursowa | Brak jednego `vault/` w pakiecie — epizody hub nie potrzebują |
| Struktura **Me / World / Craft / Ops / System** (w lekcji: Me/World/Craft/Ops/System) | Wzorzec dokumentacyjny §2.8, nie katalog w `createAgent` |
| Obszary „nie automatyzujemy, ale agent czyta” | Uprawnienia w frontmatter + handler MCP epizodu |

**Wniosek:** Boilerplate **nie powinien** narzucać struktury vault — tylko **opisać**, kiedy epizod vs lekcja vs aplikacja.

### 3.2 Markdown jako format bazy wiedzy

| Temat | Opis | Runtime w boilerplate? |
| --- | --- | --- |
| MD jako tekst + transformacje | grep, buildery, LLM-native | `read_file` — odczyt fragmentów |
| vs Notion/Docs (współpraca, ACL) | Wybór per obszar | **Docs** — nie integracja w core |
| Obrazy jako **zdalne URL** | Vision / cytowanie | `analyze_image_vision` + HTTP |
| Frontmatter: status, tagi, ACL, prompt w notatce | Kierowanie agenta bez kodu | **Wzorzec epizodu** — parser w hoście (gray-matter w lekcjach) |
| `with-md` | Rozszerzony MD dla agentów | **Poza scope** — eksperyment zewnętrzny |

**Wniosek:** Boilerplate **już wspiera** odczyt MD przez `read_file`; **parsing frontmatter, zapis, listowanie katalogów** to warstwa aplikacji/lekcji (odrzucone w [S04E01 research §5](../s04e01-production-deployments/s04e01-production-deployments.research.md) dla `write_file` w core).

### 3.3 Baza wiedzy vs pamięć długoterminowa

| Aspekt | Observational Memory (boilerplate) | Baza wiedzy (S04E04) |
| --- | --- | --- |
| Cel | Kompresja **historii rozmowy** w jednej sesji | Trwała **wiedza strukturalna** między sesjami |
| Format | XML obserwacji w `instructions` | Pliki `.md` w drzewie katalogów |
| Autor treści | LLM (Observer/Reflector) | Człowiek (+ AI: organizacja, nie treść merytoryczna) |
| Nawigacja | Brak — tekst wstrzykiwany do promptu | MoC, linki, szablony, `read`/`list`/`glob` |
| Persystencja | Opcjonalna `OM_PERSIST_DIR` (debug) | Vault jako źródło prawdy |

**Wniosek:** OM i KB **uzupełniają się** w długich systemach (OM w turze ReAct + vault między triggerami), ale **nie zastępują** — warto to wyraźnie rozdzielić w §2.8 (cross-link do §4.3 spec).

### 3.4 Kontekst notatek dla agentów

Lekcja wymienia typowe luki: niejawne odniesienia, skrócone linki, brak wersjonowania, fragmenty bez backlinków.

| Praktyka | Kto implementuje |
| --- | --- |
| Notatki samowystarczalne | Autor + reguły w `system/rules/` |
| Jawne linki wikilink / ścieżki | Szablony + audyt agentowy |
| Wersje dokumentów | Konwencja nazewnictwa / folder `archive/` |
| MoC (Map of Content) | Notatki indeksowe; regeneracja workerem |

**Wniosek:** To **jakość treści i reguł vault**, nie moduł `createAgent`. Eval jakości notatek → opcjonalnie `agent-evals` + dataset (jak S03E04).

### 3.5 Rola AI przy edycji KB (balans człowiek / AI)

| Rola AI (dozwolona) | Rola człowieka | W boilerplate? |
| --- | --- | --- |
| Transformacja / formatowanie | Treść merytoryczna | Narzędzia epizodu |
| Szablony (`system/templates`) | Zatwierdzenie struktury | Lekcja `04_04_system` |
| Organizacja, sugestia przeniesienia | Decyzja | ReAct + MCP plików w hoście |
| Linkowanie, walidacja, MoC, audyt | Zasady w `rules/` | Worker / osobna sesja agenta |
| Komentarze (nie treść notatki) | Oryginał | Poza pakietem |

**Reguła lekcji:** *„My odpowiadamy za treść i zasady, AI za organizację”* — spójna z linią S03E02 (determinizm w kodzie) i S04E01 (skills/workflows w hoście).

### 3.6 Referencyjny projekt `lessons/04_04_system`

Lekcja wskazuje demo z własną pętlą agenta (nie `createAgent`).

| Komponent | Mechanizm | Dlaczego poza boilerplate |
| --- | --- | --- |
| **Agent loop** | Własny `src/agent.js` + Responses API | Inny stack niż `AIAdapter` boilerplate |
| **Profile agentów** | `workspace/system/agents/*.md` + gray-matter | Jak garden — **host aplikacji** |
| **Szablony** | `workspace/system/templates/*.md` | Domena vault, nie hub homework |
| **Reguły linkowania** | `workspace/system/rules/linking.md` | Treść KB, nie runtime |
| **Workflow ops/** | `daily-news`: research → assemble → deliver | Multi-agent + pliki fazowe |
| **`delegate`** | Głębokość max 2, sekwencyjne fazy | `02_04_ops` — precedens poza pakietem |
| **MCP `files__*`** | Scoped do `workspace/` | Pełny FS (list/write/glob) — S04E01 odrzucił `write_file` w core |
| **MCP `web__*`** | Firecrawl | Integracja zewnętrzna — epizod/aplikacja |
| **Koszt LLM** | Kilkanaście wywołań na jedną notatkę | Uzasadnia code mode / deterministyczne kroki tam, gdzie możliwe |

**Kluczowe obserwacje z README lekcji (iteracja):**

- Playbooki fazowe z listą „Do NOT” > ogólne cele;
- Tryb workflow vs tryb tworzenia notatki musi być rozdzielony w prompcie orchestratora;
- KB **kieruje**, ale nie gwarantuje — tight playbook = przewidywalność.

**Wniosek:** `04_04_system` to **następny krok po garden** w stronę „agent system = vault”, ale nadal **osobna aplikacja lekcji**, nie rozszerzenie `@ai-devs/agent-boilerplate`.

---

## 4. Mapowanie na istniejące możliwości boilerplate

| Potrzeba KB (S04E04) | Stan w `@ai-devs/agent-boilerplate` | Luka? |
| --- | --- | --- |
| Odczyt fragmentu notatki | `read_file` (chunk, offset) | Brak `list_dir` / glob w core |
| Długa sesja agenta przy wielu `read` | OM opt-in | Wystarczy przy wielu turach |
| Plan przed działaniem | `enablePlanningPhase` | Opcjonalne |
| Wiele narzędzi MCP | `toolDiscovery` | Epizody z dużym FS API |
| Hub verify | `submit_to_hub`, `http_request` | Homework filesystem |
| Zapis / strukturyzacja notatek | **Brak** | Świadomie — lekcja / MCP hosta |
| Multi-agent workflow | **Brak** `delegate` | `02_04_ops`, `04_04_system` |
| Szablony + walidacja | **Brak** | Vault + reguły markdown |
| Triggery cron (daily-news) | **Brak** | `03_02_events` |

### 4.1 Czy dodać `list_dir` (lub `glob`) do core?

| Za | Przeciw |
| --- | --- |
| Ułatwia nawigację po vault bez zgadywania ścieżek | Hub homework zwykle zna ścieżki z API `help` |
| Naturalne uzupełnienie `read_file` | Lekcja używa zewnętrznego **files MCP**, nie boilerplate |
| Mały, read-only narzędzie | Precedens S04E01: minimalny zestaw MCP w core |

**Propozycja:** **Defer** — dokumentować w §2.8 wzorzec „`read_file` + wąskie `list_dir` w MCP epizodu”; do core tylko gdy **≥2 epizody `tasks/`** wymagają lokalnego vault (obecnie: **nie**).

#### Kiedy zmienić werdykt z defer na core (lub `@ai-devs/agent-vault`)

Werdykt **defer** dotyczy **domyślnej instalacji** hub — nie zakazuje `list_dir` jako takiego. Przejrzyj ponownie, gdy spełniony jest **co najmniej jeden** sygnał poniżej:

| Sygnał | Próg / warunek | Preferowana reakcja |
| --- | --- | --- |
| **Popyt epizodów** | **≥2** katalogi `tasks/sXXeYY/` z lokalnym vault (wieloplikowa KB, eksploracja bez podanych ścieżek) | `list_dir` read-only w core **albo** wspólny pakiet vault (patrz §4.3) — nie duplikować w każdym epizodzie |
| **Jeden epizod z FS** | Pojedynczy homework wymaga listingu, ale bez pełnego vault | Wąski `list_dir` w **`src/tools/mcp/` epizodu** — bez zmiany core |
| **Pełna KB (S04E04)** | Szablony, ops/, glob, zapis, głębokość drzewa | **`lessons/mcp/files-mcp`** (`fs_read`) lub lekcja — minimalny `list_dir` w core i tak **nie wystarczy** |
| **Homework zdalny FS** | API typu `listDir` na `/verify` (np. `filesystem`) | **`http_request`** w epizodzie — **nie** uzasadnia `list_dir` w boilerplate |
| **Koszt domyślnego MCP** | Nowe narzędzie w core trafia do wszystkich epizodów hub | Tylko gdy korzyść > ryzyko zbędnych tur ReAct i szerszej powierzchni path |

**Reguła decyzyjna:**

```text
Ścieżki znane z zadania / API hub → read_file w core wystarczy (defer list_dir).
Jeden epizod, lokalne drzewo do przejrzenia → list_dir w MCP epizodu.
Wiele epizodów + vault → rozważ list_dir w core LUB @ai-devs/agent-vault (nie oba naraz bez uzasadnienia).
Vault jak w 04_04_system → files-mcp / aplikacja — nie rozszerzaj createAgent o „pełny” FS.
```

**Antywzorce (nie zmieniają werdyktu na core):**

- „`read_file` nie działa na katalogu” — to oczekiwane; sama luka nie uzasadnia core bez profilu vault w `tasks/`.
- „Lekcja ma listing” — `04_04_system` już używa `files__fs_read`; kopiowanie uboższego `list_dir` do boilerplate **nie upraszcza** lekcji.
- „Wygodnie mieć w pakiecie” — sprzeczne z linią S04E01 (minimalny sandbox: odczyt bez eksploracji drzewa w default install).

**Artefakt przy zmianie werdyktu:** zaktualizować §2.8, README Feature catalog, CHANGELOG oraz — jeśli dodano API — testy i opis chroot/paginacji w `read_file`/`list_dir` (spójny kontrakt ścieżek).

### 4.2 Czy dodać `write_file` do core?

**Nie** — potwierdzenie werdyktu S04E01: mutacja plików, ryzyko destrukcji, homework hub rzadko edytuje lokalny repo. Homework `filesystem` operuje na **zdalnym** FS przez HTTP, nie na `read_file` chroot.

### 4.3 Czy pakiet `@ai-devs/agent-vault` / `@ai-devs/agent-knowledge`?

Analogia do `@ai-devs/agent-garden` (defer w S04E01):

| Warunek | Stan monorepo |
| --- | --- |
| ≥2 epizody `tasks/` z pełnym vault + templates | **Brak** |
| Lekcja referencyjna | `04_04_system` (własny runtime) |

**Propozycja:** **Defer** — wzmianka w §2.8; ekstrakcja gdy pojawi się drugi konsument poza lekcją.

---

## 5. Homework `filesystem` (świadomie wyłączone)

Zadanie hub: uporządkowanie chaotycznych notatek Natana w **wirtualnym systemie plików** (`/miasta`, `/osoby`, `/towary`) przez API (`createFile`, `listDir`, `batch_mode`, `done`).

| Cecha | Profil implementacji |
| --- | --- |
| Źródło danych | ZIP z hub + ekstrakcja w epizodzie |
| Operacje | HTTP POST na `/verify` — nie lokalny vault |
| Logika | Ekstrakcja encji (miasta, osoby, towary) + normalizacja JSON/MD |
| Batch | Deterministyczna lista operacji — **code mode / TS**, nie 15 tur ReAct na plik |
| Boilerplate | `http_request` + ewent. krótki ReAct; **bez** nowych narzędzi FS w pakiecie |

**Wniosek:** Homework **nie uzasadnia** rozszerzenia boilerplate o KB — to **jednorazowa transformacja danych** na zdalnym FS, nie trwała baza wiedzy z szablonami i ops/.

---

## 6. Zbieżność z wcześniejszymi lekcjami

| Temat S04E04 | Już w research / boilerplate |
| --- | --- |
| Vault / garden | S04E01 §2.5; `04_01_garden` |
| `delegate` / multi-agent | S02E04; `02_04_ops`; S04E03 §2.7 |
| Procesy w tle (daily-news) | S03E03; `03_02_events`; S04E03 |
| Pamięć sesji (OM) | S02E05; `observational-memory` |
| MCP plików | S04E01 (read-only w core); pełny FS w lekcjach |
| Skills / szablony | S04E01; S04E02 §2.6 |
| Eval / audyt KB | S03E01; S03E04; `agent-evals` |
| Markdown + frontmatter | S04E01 garden; `04_04_system` |

S04E04 **dodaje** nacisk na: **jakość notatek dla agentów**, **podział Me/World/Craft/Ops/System**, **szablony + MoC**, **workflow jako pliki ops/** oraz **świadome rozdzielenie KB i OM**.

---

## 7. Rekomendacje priorytetowe

### Nie dodawać do `@ai-devs/agent-boilerplate` (core)

1. Struktura vault (Me/World/Craft/Ops/System) jako kod  
2. Loader szablonów / agentów z frontmatter  
3. `write_file`, `edit_file`, `delete_file` w default MCP  
4. `delegate` / multi-agent w `createAgent`  
5. Workflow engine czytający `ops/*.md`  
6. Integracja Firecrawl / `web__search` w core  
7. MoC generator / link checker jako moduł pakietu  
8. RAG / vector store  
9. Parser `with-md`  
10. Klient wirtualnego FS hub (`filesystem` homework)  

### Warto zrobić (niska intruzywność — precedens S04E01–S04E03 Opcja A)

| Opcja | Zakres | Szacowany effort |
| --- | --- | --- |
| **A (zalecana)** | §**2.8** w `tasks/docs/boilerplate-documentation.md` + wiersz w README Feature catalog + Quick decision guide + CHANGELOG (Unreleased); cross-linki §2.3–§2.7, OM, `04_04_system`, `04_01_garden` | Mały |
| **B** | Akapit w `observational-memory` research lub §4.3 spec — „OM ≠ knowledge base” | Mały |
| **C** | Link w `lessons/04_04_system/README.md` do §2.8 (po powstaniu) | Bardzo mały |
| **D** | Pakiet `@ai-devs/agent-vault` (loader templates + delegate + files MCP) | **Defer** — 0 epizodów `tasks/` |
| **E** | `list_dir` read-only w core | **Defer** — brak zapotrzebowania epizodów |

---

## 8. Proponowana treść §2.8 (szkic do planu)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Cel KB** | Jedna aktywność na start; iteracja | Pełna struktura „na dzień 1” | lekcja S04E04 |
| **Układ katalogów** | Me / World / Craft / Ops / System (lub własny) | Jedna płaska lista notatek | `04_04_system/workspace/` |
| **Format** | Markdown + frontmatter (ACL, tagi) | Binaria bez URL; lokalne obrazy bez planu | §2.8; garden |
| **Treść notatki** | Samowystarczalna dla czytelnika bez kontekstu | „Ostatnia rozmowa” bez linku | `system/rules/` |
| **Rola AI** | Organizacja, szablony, audyt | AI pisze merytorykę bez nadzoru | lekcja |
| **Szablony** | `system/templates/` + MoC | Agent wymyśla strukturę za każdym razem | `04_04_system` |
| **Procesy** | Pliki w `ops/` + delegacja faz | Jeden ReAct na cały pipeline | `ops/daily-news/` |
| **Pamięć sesji** | OM opt-in przy długim ReAct | Mylenie OM z vault | [§4.3](../../../docs/boilerplate-documentation.md#43-zarządzanie-pamięcią-srcagentmemoryts--observational_memory) |
| **Odczyt plików (hub)** | `read_file` chunkowany | Wczytanie całego vault do kontekstu | boilerplate MCP |
| **Zapis / listowanie** | MCP epizodu lub files MCP lekcji | `write_file` w default pakiecie | S04E01 §2.5 |
| **Homework hub** | `http_request` + batch / TS | 15+ tur ReAct na plik KB | epizod `filesystem` |

**Reguła kciuka §2.8:**

```text
Epizod hub (verify, krótka sesja, brak lokalnego vault) → default boilerplate.
Trwała KB + szablony + ops/ + multi-agent → lessons/04_04_system lub aplikacja — nie createAgent.
Długa sesja na wielu plikach → OM opt-in; vault pozostaje na dysku między triggerami (03_02_events).
Zdalny FS / jednorazowa strukturyzacja danych (filesystem) → http_request + kod epizodu — nie moduł KB w pakiecie.
```

---

## 9. Otwarte pytania (do akceptacji research)

| # | Pytanie | Propozycja domyślna |
| --- | --- | --- |
| 1 | Czy §2.8 ma linkować homework `filesystem`? | **Tak** — jedna regułka w tabeli (jak `savethem` w §2.4) |
| 2 | Czy dodać wiersz „Knowledge base (S04E04)” w README Feature catalog? | **Tak** — spójnie z S04E01–S04E03 |
| 3 | Czy rozszerzać §4.3 spec o akapit OM vs KB (Opcja B)? | **Tak** — 1 akapit, unika pomyłek studentów |
| 4 | Czy `list_dir` read-only w core (Opcja E)? | **Nie** w tym MR — defer; kryteria zmiany werdyktu → [§4.1](#41-czy-dodać-list_dir-lub-glob-do-core) |
| 5 | Nazwa folderu spec: `knowledge-base` vs `personal-knowledge-base`? | **`s04e04-knowledge-base`** |
| 6 | Czy upstream zmieni treść przed `published_at`? | Założenie: rdzeń koncepcyjny stabilny; homework może mieć drobne poprawki API |

---

## 10. Następne kroki (po akceptacji research)

1. **Plan:** [s04e04-knowledge-base.plan.md](s04e04-knowledge-base.plan.md) — **Opcja A + B** — utworzony (2026-06-28); **czeka na akceptację planu**.  
2. **Implementacja docs (osobny MR):** D1–D6b (opcjonalnie D7) — §2.8 + §4.3 + README + CHANGELOG; bez `tasks/boilerplate/src/`.  
3. **Homework `filesystem`:** osobny epizod `tasks/s04e04/` (lub analogiczny) — poza MR dokumentacji.  
4. **Lekcja `04_04_system`:** pozostaje referencją runtime; cross-link w D7.

---

## 11. Werdykt końcowy (odpowiedź na pytanie użytkownika)

**Czy w lekcji S04E04 można rozbudować `tasks/boilerplate` pod kątem rozbudowanych agentów AI?**

- **Tak, zasadnie** — ale prawie wyłącznie przez **dokumentację produktową** (proponowane §**2.8**): kiedy vault markdown zastępuje „kod źródłowy”, jak oddzielić KB od OM, podział ról człowiek/AI, wzorce szablonów/MoC/ops/, oraz mapowanie na `04_04_system` i garden — **uzupełniając** §2.5–§2.7.
- **Nie zasadnie w core runtime** — loadery agentów/szablonów, `delegate`, pełny MCP plików, workflow z `ops/`, integracje web i trwały vault to **warstwa aplikacji/lekcji** (`04_04_system`, `04_01_garden`, `02_04_ops`), zgodnie z linią „nie rozszerzaj createAgent”.
- **Homework `filesystem`** (wyłączone) **nie uzasadnia** nowych modułów KB w pakiecie — profil hub: HTTP + batch + ekstrakcja danych.

**Implikacja:** rozbudowani agenci „oparci o wiedzę” buduje się **kompozycją** istniejących klocków (ReAct, `read_file`, OM, MCP epizodu, events, vault w lekcji) — nie jednym większym `@ai-devs/agent-boilerplate`. Najlepszy ROI = **Opcja A w osobnym MR** (zgodnie z życzeniem użytkownika).

---

## 12. Assumptions

- Analiza oparta na markdownie w repo (`published_at: 2026-04-02` — scheduled); API homework może się nieznacznie zmienić.
- `lessons/04_04_system/` jest w monorepo i stanowi główny punkt odniesienia implementacyjnego (własny agent loop, nie `createAgent`).
- Użytkownik świadomie wyłączył **`filesystem`** z głębokiej analizy — granica scope w §5.
- §2.7 (S04E03) jest **zrealizowane** — §2.8 ma **uzupełniać**, nie zastępować.
- Implementacja docs ma być **osobnym MR** od zadania domowego i od lekcji runtime.
