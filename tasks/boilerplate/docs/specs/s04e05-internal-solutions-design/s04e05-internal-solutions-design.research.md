# S04E05 — Projektowanie rozwiązań wewnątrzfirmowych → boilerplate (research)

**Task:** Przeanalizować lekcję S04E05 pod kątem opisanych funkcjonalności i metodologii oraz ocenić, czy którekolwiek z nich warto dodać do `tasks/boilerplate` (`@ai-devs/agent-boilerplate`) — **w oderwaniu od zadania domowego `foodwarehouse`**.

**Data:** 2026-06-29  
**Status:** Research **zaakceptowany** (2026-06-29); plan: [s04e05-internal-solutions-design.plan.md](s04e05-internal-solutions-design.plan.md) — Opcja A (docs §2.9) — **zrealizowany** (2026-06-29).

**Powiązane:**

- [s04e04-knowledge-base.research.md](../s04e04-knowledge-base/s04e04-knowledge-base.research.md) — vault / dokumenty jako źródło prawdy; proste pliki promptów
- [s04e03-contextual-collaboration.research.md](../s04e03-contextual-collaboration/s04e03-contextual-collaboration.research.md) — AI w tle, integracje SaaS, uprawnienia
- [s04e02-active-collaboration.research.md](../s04e02-active-collaboration/s04e02-active-collaboration.research.md) — kanały dostarczenia, MCP Apps (wstęp)
- [s04e01-production-deployments.research.md](../s04e01-production-deployments/s04e01-production-deployments.research.md) — wdrożenie, dogfooding, człowiek w pętli
- [s03e05-nondeterministic-models.research.md](../s03e05-nondeterministic-models/s03e05-nondeterministic-models.research.md) — MCP Apps, generatywne UI
- [s03e04-tool-design-test-data.research.md](../s03e04-tool-design-test-data/s03e04-tool-design-test-data.research.md) — projektowanie narzędzi pod proces
- [s03e02-model-constraints.research.md](../s03e02-model-constraints/s03e02-model-constraints.research.md) — ograniczenia modeli, bezpieczeństwo
- [boilerplate-documentation.md](../../../docs/boilerplate-documentation.md) — §2.0–§2.8

**Źródła:**

- `markdowns/s04e05-projektowanie-rozwiazan-wewnatrzfirmowych-1775189135.md` — transkrypt lekcji (`published_at: 2026-04-03`, status: scheduled)
- `lessons/04_05_review/` — agent recenzji dokumentów (akapity, `add_comment`, UI accept/reject)
- `lessons/04_05_apps/` — MCP Apps pod procesy biznesowe (sprzedaż, newsletter, todo)
- `lessons/03_05_apps/` — wcześniejszy precedens MCP Apps w kursie
- `tasks/boilerplate/` — ReAct, MCP, `ask_human`, planning, OM, tool discovery, observability

**Weryfikacja UI:** brak w scope research (lekcja zawiera diagramy i demo `04_05_review` / `04_05_apps`; ewentualna weryfikacja UI należy do osobnego planu implementacji docs lub lekcji).

**Scope wyłączony:** homework **`foodwarehouse`** (API magazynu, SQLite read-only, `orders` / `signatureGenerator` / `database` / `done` na hubie) — osobny profil epizodu hub; **nie wpływa** na werdykt rozszerzeń pakietu kursowego.

---

## 0. Konspekt lekcji (podsumowanie edukacyjne)

**Tytuł:** S04E05 — Projektowanie rozwiązań wewnątrzfirmowych  
**Źródło:** `markdowns/s04e05-projektowanie-rozwiazan-wewnatrzfirmowych-1775189135.md`  
**Materiały:** film główny [Vimeo 1179335902](https://vimeo.com/1179335902); demo `lessons/04_05_review/`, `lessons/04_05_apps/`

### 0.1 Teza wprowadzająca

Wdrożenie AI w firmie to wybór między **platformami zewnętrznymi** a **własnymi rozwiązaniami**. W drugim przypadku rola techniczna jest większa, ale główną barierą nie jest sama jakość modeli — lecz **zmiana**: procesy, nawyki, koszty utrzymania, oczekiwania użytkowników oraz niedeterministyczna natura LLM.

### 0.2 Trzy wymiary wdrożenia

| Wymiar | Kluczowe punkty |
| --- | --- |
| **Biznesowy** | Uzasadnienie ROI, koszt utrzymania, kwestie prawne (dostawca LLM, chmura — Bedrock, Azure) |
| **Kulturowy** | Zaangażowanie zespołu, warsztaty oddolne, wymiana doświadczeń |
| **Technologiczny / produktowy** | Zakres projektu, metryki sukcesu/porażki, architektura agentów, ewaluacja — przy świadomości, że 100% skuteczności jest mało realne |

### 0.3 Różnica perspektyw użytkowników

Użytkownicy techniczni naturalnie formułują zapytania z **wskazówkami dla agenta** (np. „sprawdź Gmail **i** Slack, potem pliki z **planem dnia**”). Użytkownicy mniej doświadczeni pytają ogólnie („co mam na dziś?”) — agent może nie wykonać pełnej intencji. Modele się poprawiają, ale pełne „odgadywanie” intencji bywa **nieopłacalne** — wtedy potrzebne są inne ścieżki (UI, MCP Apps, wąskie narzędzia).

### 0.4 Lekkie rozwiązania (wysoki ROI, niski koszt)

Nawet proste artefakty mogą dużo dać:

| Typ | Rola | Przykład z lekcji |
| --- | --- | --- |
| **Checklista** | Powtarzalny proces weryfikacji z checklistą kroków | Weryfikacja wpisu na blogu (SEO, linkowanie, sekcje per kategoria) |
| **Onboarding** | Przekierowanie, nie zastąpienie rozmowy | Dokument z linkami, osobami, procesami — AI dopasowuje zapytanie do treści |
| **Styl / standard** | Spójność wizualna lub jakościowa | Wspólny prompt graficzny AI_devs na Slacku |

Analogia do **`AGENTS.md`** i **Skills** w programowaniu — te same wzorce działają poza kodem.

### 0.5 Kiedy dokument wystarcza, a kiedy własne narzędzie / MCP

Sam dokument + dowolna interpretacja przez model i użytkownika bywa niewystarczający. Wtedy warto **wewnątrzfirmowy serwer MCP** lub dedykowana aplikacja dopasowana do procesu — często tania w zbudowaniu z pomocą AI, opłacalna nawet krótkoterminowo.

**Demo `04_05_review`:**

1. Użytkownik wybiera dokument i prompt recenzji.
2. Dokument dzielony na fragmenty (akapity).
3. Agent ocenia każdy fragment; opcjonalnie `add_comment` z kotwicą do cytatu.
4. Notatka końcowa od agenta.
5. UI: akceptacja / odrzucenie sugestii; ponowna recenzja z krótkim dopiskiem.

Rozszerzenia tego samego szkieletu: fact-checking (Internet), linkowanie wewnętrzne (indeks bloga), routing do działów (narzędzia zewnętrzne).

### 0.6 Prywatność, bezpieczeństwo i konsekwencje błędów

Zaufany dostawca LLM (Bedrock, Azure) **nie eliminuje** ryzyk:

- wyciek danych przez agenta z dostępem do Internetu;
- uszkodzenie danych przez code execution;
- błędy LLM bez weryfikacji człowieka;
- przypadkowe `send_email` / zaproszenia kalendarzowe;
- złe porady z firmowej KB (np. restart produkcji).

Lekcja wzmacnia wcześniejsze wzorce: **ograniczanie uprawnień**, fizyczne uniemożliwienie akcji, ostrożność wobec sandboxów (obejścia `.env`), świadomość **eval awareness** modeli. Pełna eliminacja ryzyka jest nierealna — wartość często wynika z **człowieka w pętli**, nie z pełnej automatyzacji.

### 0.7 Kontekst wielu usług i MCP Apps

Problem codziennej pracy: **przenoszenie i agregacja danych** między narzędziami (support, marketing, sprzedaż, produkt). Ogólny agent na NL często nie wystarcza (halucynacje, injection, limity API) — powrót do **MCP Apps** i generatywnych interfejsów (S03E05).

**Demo `04_05_apps`:** chat + zdalny serwer MCP z **interfejsami pod proces** (sprzedaż, newsletter, todo) — nie płaska lista narzędzi. Przyciski deterministyczne („Add follow-up todo”, „Open in Stripe”). Architektura: warstwa prezentacji (web) → backend (API + LLM + klient MCP) → serwer MCP (narzędzia + UI). MCP Apps **uzupełniają** agentów, nie zastępują.

### 0.8 Fabuła i zadanie domowe (poza scope boilerplate)

Fabuła: wirtualne przeprogramowanie dystrybucji w magazynach Zygfryda.  
Homework **`foodwarehouse`**: deterministyczna orchestracja API (`orders`, SQLite, podpisy SHA1, `done`) — profil epizodu hub, nie rozszerzenie pakietu kursowego.

---

## 1. Executive summary

**Werdykt:** Lekcja S04E05 to **synteza wdrożeniowa** linii S03–S04: od lekkich dokumentów (checklisty, onboarding, style) przez **dedykowane narzędzia procesowe** (`04_05_review`) po **MCP Apps** jako most między agentem a deterministycznym UI (`04_05_apps`). To głównie **decyzje produktowe i architektura aplikacji**, nie brakujące API w domyślnym ReAct.

| Obszar lekcji | W boilerplate domyślnie? | Gdzie indziej |
| --- | --- | --- |
| ReAct + MCP + hub | **Tak** | `@ai-devs/agent-boilerplate` |
| Dokumenty jako prompty (checklisty, style, onboarding) | **Wzorzec** | `read_file` + `src/prompts/*.md`; vault S04E04 |
| AGENTS.md / Skills poza kodem | **Docs** | Cursor Collections; garden `SKILL.md` |
| Agent recenzji dokumentów (chunking, `add_comment`) | **Nie** | `lessons/04_05_review/` |
| UI accept/reject sugestii | **Nie** | frontend Svelte w lekcji |
| Orkiestracja poza jedną pętlą ReAct (batch akapitów) | **Nie** | `review-engine.js`; worker / `index.ts` epizodu |
| MCP Apps (procesy biznesowe, deterministyczne akcje) | **Nie** | `04_05_apps`, `03_05_apps` |
| Bezpieczeństwo / uprawnienia / HITL | **Częściowo** | `ask_human`; polityki w handlerach MCP (§2.1) |
| Streaming postępu (NDJSON) | **Nie** | lekcja review |
| Wdrożeniowy hosting (Bedrock, Azure) | **Nie** | infrastruktura poza kursem |
| Homework `foodwarehouse` | **Nie** | `http_request` + logika epizodu |

**Reguła kciuka (spójna z §2.1–§2.8):**

```text
Epizod hub (≤5 tur, http_request, /verify) → default boilerplate bez zmian.
Lekki ROI (checklista, styl, onboarding) → pliki markdown + read_file / vault — nie nowy moduł w createAgent.
Proces z UI (accept/reject, kotwice komentarzy) → lessons/04_05_review lub aplikacja — orchestrator poza ReAct.
Agregacja wielu SaaS + deterministyczne akcje → MCP Apps (04_05_apps) — host poza pakietem.
Bezpieczeństwo → brak nieodwracalnych narzędzi w core; uprawnienia w kodzie handlera, nie w prompcie.
```

**Implikacja:** najlepszy ROI = **Opcja A (docs §2.9)** + cross-linki do `04_05_review`, `04_05_apps` i §2.1–§2.8 w **osobnym MR**; **brak zmian w `tasks/boilerplate/src/`** w ramach tego scope (zgodnie z linią S04E01–S04E04).

---

## 2. Pozycja lekcji w kurriculum

| Lekcja | Fokus | Relacja do S04E05 |
| --- | --- | --- |
| **S03E02** | Ograniczenia modeli, bezpieczeństwo | S04E05: **rozszerza** o scenariusze firmowe (email, kalendarz, KB) |
| **S03E04** | Projektowanie narzędzi | S04E05: `add_comment` jako wąskie narzędzie procesowe |
| **S03E05** | MCP Apps, generatywne UI | S04E05: **produkcyjne** MCP Apps (`04_05_apps`) |
| **S04E01** | Wdrożenie, garden, HITL | S04E05: adopcja organizacyjna, nie tylko runtime |
| **S04E02** | Kanały współpracy | S04E05: MCP zdalny + Claude.ai; własny host gdy UI krytyczne |
| **S04E03** | Integracje, AI w tle | S04E05: agregacja danych z wielu usług |
| **S04E04** | Baza wiedzy markdown | S04E05: dokumenty jako lekkie rozwiązania; KB + review |

S04E05 **nie wprowadza nowej klasy runtime** niewidocznej w §2.1–§2.8 — **scala** wdrożenie organizacyjne z wzorcami: dokument → narzędzie → MCP Apps.

---

## 3. Funkcjonalności z lekcji (poza homework `foodwarehouse`)

### 3.1 Adopcja i „zmiana” jako problem dominujący

| Obserwacja | Implikacja dla boilerplate |
| --- | --- |
| Sukces zależy od biznesu, kultury i technologii | **Poza pakietem** — docs mogą wskazać metryki i HITL |
| Różne poziomy świadomości AI wśród użytkowników | Nie rozwiązywać w `createAgent` — **UI / onboarding / wąskie prompty** w aplikacji |
| 100% skuteczności nierealne | Spójne z §2.1; evals opcjonalne (`agent-evals`) |

**Wniosek:** Boilerplate nie powinien udawać „rozwiązania wdrożeniowego” — tylko **runtime** z guardami (iteracje, retry, brak destrukcyjnych narzędzi domyślnie).

### 3.2 Lekkie artefakty: checklista, onboarding, styl

| Element | Mapowanie na repo |
| --- | --- |
| Checklista procesowa | Plik `.md` w vault / `workspace/prompts/` + `read_file` lub kontekst w user message |
| Onboarding | Ten sam wzorzec; semantyczne wyszukiwanie przez LLM zamiast exact match grep |
| Styl (grafiki, ton) | Prompt współdzielony (Slack) — analogia do `src/prompts/*.md` i Cursor skills |

**Wniosek:** **Już wspierane** przez konwencję promptów w plikach i `read_file`. Brak potrzeby `loadChecklist()` w core — epizod ładuje plik w `index.ts`.

### 3.3 Od dokumentu do dedykowanego narzędzia (`04_05_review`)

| Komponent lekcji | W boilerplate? | Uzasadnienie |
| --- | --- | --- |
| Pętla tool-calling (`runAgent`) | Podobna do ReAct | Lekcja ma własny, prostszy loop (Responses API, max 12 kroków) |
| Narzędzie `add_comment` | **Nie** | Domena review; kotwice do cytatów — specyficzny kontrakt |
| Chunking dokumentu (`remark` AST) | **Nie** | Logika prezentacji / serializacji MD |
| `review-engine.js` (batch, concurrency 4, streaming NDJSON) | **Nie** | **Orkiestrator aplikacji** — wiele wywołań agenta poza jednym `processQuery` |
| Persistencja review JSON | **Nie** | Store plikowy lekcji |
| Accept / reject / revert w UI | **Nie** | Warstwa Svelte; deterministyczna mutacja pliku po akceptacji |

**Wniosek:** Wzorzec **„orchestrator TS + wiele krótkich przebiegów agenta + UI HITL”** jest kluczowy pedagogicznie, ale **nie należy** do `@ai-devs/agent-boilerplate` — to profil aplikacji jak garden czy review lab.

**Co boilerplate już daje dla podobnych systemów:**

- `createAgent` / `processConversationTurn` — pojedyncza sesja recenzji fragmentu;
- `ask_human` — blokada na stdin gdy brak danych (nie zamiennik UI accept/reject);
- `enablePlanningPhase` — plan przed narzędziami (inny use case);
- `chatStructured` — klasyfikacja fragmentu bez narzędzi (opcjonalnie w orchestratorze lekcji).

### 3.4 Bezpieczeństwo i uprawnienia

| Ryzyko z lekcji | Istniejący wzorzec w repo |
| --- | --- |
| Wyciek przez Internet | Brak domyślnego „browse”; `http_request` świadomie w MCP |
| Code execution | Poza pakietem (§5.2.1) |
| Nieodwracalne akcje | Brak `send_email` w core; logika w epizodzie |
| Złe porady z KB | HITL + wąskie narzędzia; nie „pełny admin API” |
| Sandbox bypass | Dokumentacja w §2.1 / sandbox research |

**Opcjonalne rozszerzenie runtime (rozważone, odrzucone w tym research):**

| Propozycja | Werdykt |
| --- | --- |
| `beforeToolCall` / polityki RBAC w `createAgent` | **Defer** — wrapper na `handlers.execute` wystarczy w aplikacji (§2.2 S03E03) |
| Globalny `denyTools` / allowlist | **Defer** — epizod hub ma ≤4 narzędzia; aplikacja konfiguruje subset |
| Moduł „security audit” | **Poza scope** — `agent-evals` + periodic worker (§2.7) |

### 3.5 MCP Apps i kontekst wielu usług (`04_05_apps`)

| Element | W boilerplate? |
| --- | --- |
| `registerAppTool` / `registerAppResource` | **Nie** — SDK MCP Apps w lekcji |
| Host z iframe + `AppBridge` | **Nie** — `public/` lekcji |
| Zdalny worker MCP (Cloudflare) | **Nie** — `04_05_apps/mcp/` |
| Deterministyczne przyciski w UI | **Nie** — komplementarne do ReAct |

**Wniosek:** §2.4 i §2.6 już wskazują MCP Apps jako **lesson only**. S04E05 **wzmacnia** argument biznesowy (procesy stanowiskowe) — wystarczy **§2.9** z odniesieniem do `04_05_apps` (nie duplikować `03_05_apps` w runtime).

### 3.6 Jedna pętla ReAct vs orchestracja wieloetapowa

Lekcja review pokazuje jawny podział:

```text
Orchestrator (kod) → dla każdego bloku: runAgent({ tools: [add_comment] })
                  → zapis review state
                  → UI: człowiek akceptuje/odrzuca
```

To ten sam wzorzec co:

- `04_04_system` — workflow `ops/daily-news` (wiele agentów / faz);
- `03_02_events` — triggery poza `createAgent`;
- epizody z batch MCP w TS (§2.1).

**Wniosek:** Nie dodawać „multi-phase agent” do `agent.ts` — dokumentować w §2.9 kiedy **wielokrotne `processQuery`** lub dedykowany worker jest właściwy.

---

## 4. Mapowanie na istniejące API boilerplate

| Potrzeba z lekcji | API / moduł | Status |
| --- | --- | --- |
| Krótka sesja z narzędziami | `createAgent`, `MAX_ITERATIONS` | ✅ |
| Plan przed działaniem | `enablePlanningPhase` | ✅ opt-in |
| Odczyt dokumentów / promptów | `read_file`, `src/prompts/*.md` | ✅ |
| Pytanie do człowieka (terminal) | `ask_human` | ✅ |
| Wiele narzędzi MCP | `toolDiscovery` | ✅ opt-in |
| Długa sesja jednego agenta | Observational Memory | ✅ opt-in |
| Structured JSON bez narzędzi | `chatStructured` | ✅ export |
| Hub / retry | `http_request`, `submit_to_hub` | ✅ |
| Tracing kosztów | Langfuse opt-in | ✅ |
| Streaming do UI | — | ❌ aplikacja |
| Kotwiczone komentarze | — | ❌ lekcja review |
| MCP Apps | — | ❌ lekcje apps |
| Orchestrator batch | — | ❌ kod hosta |

---

## 5. Opcje rozszerzenia pakietu (werdykt)

### Opcja A — Dokumentacja §2.9 (zalecana)

Dodać **`### 2.9. Internal solutions design (S04E05)`** w `tasks/docs/boilerplate-documentation.md`:

- tabela Wzorzec / Antywzorzec / Gdzie (≥10 wierszy);
- reguła kciuka;
- cross-linki do §2.1, §2.4, §2.6, §2.8, research, `04_05_review`, `04_05_apps`;
- wiersz homework `foodwarehouse` (jak `filesystem` w §2.8) — tylko odsyłacz.

Plus: README Feature catalog (1 wiersz), CHANGELOG (Unreleased), opcjonalnie link w `lessons/04_05_review/README.md` i `04_05_apps/README.md`.

**Koszt:** mały. **ROI:** wysoki — spójność linii S03–S04.

### Opcja B — Dokumentacja + przykład orchestratora w `tasks/boilerplate/index.ts`

**Odrzucone** — `index.ts` boilerplate to smoke test runtime, nie demo aplikacji firmowej.

### Opcja C — Moduł `documentReview` w pakiecie

Ekstrakcja chunkingu + `add_comment` z lekcji.

**Odrzucone** — zbyt wąska domena; UI i remark zależności; lekcja jest reference implementation.

### Opcja D — `createAgent` hooks (`onToolCall`, `onTurnEnd`)

**Defer** — pojedynczy epizod może opakować `handlers.execute`; publiczne hooki zwiększają powierzchnię API bez potrzeby hub.

### Opcja E — Native tool `suggest_change` (bez UI)

Ogólne narzędzie „zaproponuj poprawkę” zwracające JSON.

**Odrzucone** — bez UI accept/reject wartość mała; lekcja review pokazuje pełny wzorzec.

### Opcja F — Pakiet `@ai-devs/agent-review` (osobny)

**Defer** — rozważyć gdy **≥2** konsumenty poza `04_05_review` (obecnie: **nie**).

### Opcja G — MCP Apps helper w boilerplate

**Odrzucone** — sprzeczne z ustaleniem S03E05 / S04E02.

---

## 6. Proponowana treść §2.9 (szkic do planu)

**Nagłówek:** `### 2.9. Internal solutions design (S04E05)`

**Wstęp (≤6 zdań):** Lekcja S04E05 uczy projektowania **wewnątrzfirmowych** rozwiązań AI: od lekkich dokumentów (checklisty, onboarding, style) przez dedykowane narzędzia procesowe z **UI i człowiekiem w pętli** po **MCP Apps** łączące wiele usług. Runtime boilerplate (`createAgent`, MCP, `read_file`, `ask_human`) **pozostaje bez zmian**; orchestracja wieloetapowa, streaming i accept/reject to **warstwa aplikacji** (`04_05_review`, `04_05_apps`).

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Adopcja** | Metryki, HITL, świadome ograniczenia modelu | Obietnica pełnej automatyzacji w core | lekcja S04E05; §2.1 |
| **Lekki ROI** | Checklista / styl / onboarding jako `.md` | Nowy moduł w `createAgent` na każdy dokument | `read_file`; vault §2.8 |
| **Skills poza kodem** | Współdzielone instrukcje (Slack, Notion export) | Jeden ogromny system prompt | `src/prompts/`; Cursor skills |
| **Proces z UI** | Orchestrator + wiele `processQuery` + UI akceptacji | Jedna długa pętla ReAct na cały dokument | [04_05_review](../../lessons/04_05_review/) |
| **Narzędzie procesowe** | Wąskie MCP (`add_comment`, nie „cały edytor”) | Model mutuje plik bez nadzoru | `04_05_review/src/tools.js` |
| **Chunking dokumentu** | Kod hosta (AST / bloki) | Wklejenie całego pliku do kontekstu | `review-engine.js` |
| **Bezpieczeństwo** | Uprawnienia w handlerze; brak nieodwracalnych tooli w core | „Zaufany Bedrock” = pełne zaufanie do modelu | §2.1; lekcja |
| **Wiele usług** | MCP Apps + deterministyczne akcje w UI | Jeden agent NL na cały CRM+Stripe+mail | [04_05_apps](../../lessons/04_05_apps/) |
| **Zdalny MCP** | Serwer HTTP dla klientów (Claude.ai) | Monolit bez podziału host/MCP | `04_05_apps/mcp/` |
| **Streaming postępu** | NDJSON / SSE w aplikacji | Wymaganie streamingu w `createAgent` | `review-engine.js` |
| **Homework hub (`foodwarehouse`)** | `http_request` + SQLite w epizodzie; explore → plan → execute | ReAct zgadywający API magazynu | epizod `tasks/s04e05/` (planowany) |

**Reguła kciuka §2.9:**

```text
Epizod hub (verify, krótka sesja) → default boilerplate.
Checklista / onboarding / styl → markdown + read_file lub vault (§2.8) — nie nowe API.
Recenzja dokumentów z accept/reject → lessons/04_05_review — orchestrator poza createAgent.
Procesy stanowiskowe (wiele SaaS) → MCP Apps (04_05_apps) — host poza pakietem.
Ryzyko nieodwracalne → człowiek w pętli + wąskie narzędzia — nie pełny dostęp API w MCP kursu.
```

---

## 7. Pytania do planu (decyzje produktowe)

| # | Pytanie | Propozycja |
| --- | --- | --- |
| 1 | Czy §2.9 ma linkować homework `foodwarehouse`? | **Tak** — jeden wiersz tabeli (jak `filesystem` w §2.8) |
| 2 | Czy aktualizować §2.4 / §2.6 o link do `04_05_apps`? | **Tak** — po jednym zdaniu w odniesieniach (bez duplikacji treści) |
| 3 | Czy dodawać wiersz w README Feature catalog? | **Tak** — „Internal tools / MCP Apps / review UI → §2.9 + lessons” |
| 4 | Czy ekstrahować `runAgent` z lekcji do boilerplate? | **Nie** — `createAgent` wystarcza; lekcja zostaje minimalna |
| 5 | Czy `lessons/04_05_*/README.md` → link do §2.9? | **Opcjonalnie** (niski koszt, spójność z D7 S04E04) |

---

## 8. Zakres wyłączony — homework `foodwarehouse` (skrót)

| Aspekt | Profil |
| --- | --- |
| Cel | Wiele poprawnych zamówień dla miast z `food4cities.json` |
| API | `orders`, `signatureGenerator`, `database` (SQLite RO), `reset`, `done` |
| Styl rozwiązania | Explore (`help`, schema) → agregacja zapotrzebowania → deterministyczne tworzenie zamówień |
| Boilerplate | `http_request` + ewentualnie wąski ReAct; logika w `tasks/s04e05/` |

*Szczegółowa analiza implementacji homework → osobny research/plan epizodu; **nie wpływa** na werdykt §2.9.*

---

## 9. Rekomendacja i następne kroki

1. **Akceptacja research** (ten dokument).  
2. **Plan (osobny MR):** Opcja A — §2.9 + README + CHANGELOG + cross-linki; **bez** `tasks/boilerplate/src/`.  
3. **Homework `foodwarehouse`:** osobny wątek w `tasks/s04e05/docs/specs/`.

**Podsumowanie werdyktu:**

- **Tak, zasadnie** — ale prawie wyłącznie przez **dokumentację produktową** (proponowane §**2.9**): spektrum od lekkich dokumentów do MCP Apps, rola UI i HITL, bezpieczeństwo wdrożeniowe, orchestracja poza jednym ReAct — **uzupełniając** §2.1, §2.4, §2.6, §2.8.
- **Nie** — ekstrakcja `04_05_review`, MCP Apps SDK, streaming UI ani modułu security do `@ai-devs/agent-boilerplate` w obecnym stanie repo.

---

## 10. Changelog research

| Data | Zmiana |
| --- | --- |
| 2026-06-29 | Research początkowy — analiza lekcji S04E05 vs boilerplate; werdykt Opcja A (§2.9 docs); scope bez `foodwarehouse` |
| 2026-06-29 | Research zaakceptowany; plan: [s04e05-internal-solutions-design.plan.md](s04e05-internal-solutions-design.plan.md) |
| 2026-06-29 | Implementacja docs §2.9 (D1–D7b) zrealizowana |
