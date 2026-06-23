# S04E03 — Kontekstowa współpraca z AI → boilerplate (research)

**Task:** Przeanalizować lekcję S04E03 pod kątem opisanych funkcjonalności i metodologii oraz ocenić, czy którekolwiek z nich warto dodać do `tasks/boilerplate` (`@ai-devs/agent-boilerplate`) — **w oderwaniu od zadania domowego `domatowo`**.

**Data:** 2026-06-23  
**Status:** Research **zaakceptowany** (2026-06-23); plan: [s04e03-contextual-collaboration.plan.md](s04e03-contextual-collaboration.plan.md) — Opcja A + B — **zrealizowany** (2026-06-23).

**Powiązane:**

- [s03e03-contextual-feedback.research.md](../s03e03-contextual-feedback/s03e03-contextual-feedback.research.md) — mechaniki kontekstu, triggery, metadata, hooki (precedens „nie core”)
- [s04e01-production-deployments.research.md](../s04e01-production-deployments/s04e01-production-deployments.research.md) — garden, skills/workflows, sync/async
- [s04e02-active-collaboration.research.md](../s04e02-active-collaboration/s04e02-active-collaboration.research.md) — kanały współpracy (CLI, MCP, UI); §2.6 zrealizowane
- [agent-observability-evals.research.md](../agent-observability-evals/agent-observability-evals.research.md) — Langfuse, evals, LLM-as-judge
- [boilerplate-documentation.md](../../../docs/boilerplate-documentation.md) — §2.1–§2.6

**Źródła:**

- `markdowns/s04e03-kontekstowa-wspolpraca-z-ai-1774999647.md` — transkrypt lekcji (`published_at: 2026-04-01`, status: scheduled)
- `tasks/boilerplate/` — ReAct, MCP, OM, planning, tool discovery, observability
- `lessons/03_02_events/` — heartbeat, `tasks.md`, proaktywność
- `lessons/03_03_calendar/` — metadata otoczenia w wiadomości użytkownika
- `lessons/04_01_garden/` — aktywne katalogi, skills, workflows
- `lessons/02_04_ops/` — orchestrator + `delegate` (wieloagentowość domenowa)
- Brak `lessons/04_03_*` w monorepo — brak kodu referencyjnego upstream dla tej lekcji

**Weryfikacja UI:** brak (lekcja koncepcyjna + diagramy).

**Scope wyłączony:** homework **`domatowo`** (mapa 11×11, budżet punktów akcji, zwiadowcy/transportery, `inspect`/`getLogs`/`callHelicopter`) — osobny profil epizodu hub; **nie wpływa** na werdykt rozszerzeń pakietu kursowego.

---

## 1. Executive summary

**Werdykt: lekcja S04E03 to rozszerzenie linii S03E03 + S04E01 o perspektywę „AI w tle codzienności i biznesu” — mapę integracji, scenariusze procesowe, izolację agentów oraz samonadzór systemu. To głównie architektura produktowa i wzorce orchestracji, nie brakujące API w domyślnym ReAct.**

| Obszar lekcji | W boilerplate domyślnie? | Gdzie indziej |
| --- | --- | --- |
| ReAct + MCP + hub | **Tak** | `@ai-devs/agent-boilerplate` |
| Metadata / kontekst otoczenia w wiadomości | **Wzorzec** (kod epizodu) | §2.2 S03E03; `03_03_calendar` |
| Triggery (cron, webhook, heartbeat) | **Nie** | `03_02_events/`; entrypoint epizodu |
| Integracje SaaS (GSuite, Linear, Slack…) | **Nie** | wąskie MCP w epizodzie / aplikacji |
| Aktywne katalogi / workflow plikowy | **Nie** | `04_01_garden/`; orchestrator FS |
| Stan urządzenia (DND, app, lokalizacja) | **Nie** | natywna aplikacja (Swift/Rust/C#) |
| Izolacja agentów (jeden obszar = jeden agent) | **Docs** | proponowane §**2.7** |
| Agenci obserwujący skuteczność systemu | **Częściowo** | `@ai-devs/agent-evals` + worker poza ReAct |
| Komunikacja między agentami (gdy konieczna) | **Nie** | `02_04_ops` (`delegate`); S02E04 |
| Computer Use / scrapowanie / monitoring sygnału | **Nie** | `03_03_browser`; MCP epizodu + `http_request` |
| Dyscyplina powiadomień (nie spamować) | **Docs** | produkt / prompt |
| Uprawnienia agentów (read-only KB, tylko do usera) | **Wzorzec** | handler MCP + env epizodu |
| Homework `domatowo` (strategia na mapie) | **Poza scope** | deterministyczny TS + opcj. ReAct |

**Reguła kciuka (spójna z §2.1–§2.6):**

```text
Epizod hub (verify, krótka sesja, HTTP/MCP) → default boilerplate bez zmian.
AI w tle (kalendarz, mail, katalogi, monitoring) → orchestrator + triggery poza createAgent; wąskie MCP per domena.
Wielu agentów w produkcji → izolacja obszarów; komunikacja tylko gdy musi (02_04_ops) — nie jeden ReAct „cały biznes”.
Samonadzór systemu → cykliczny worker + agent-evals / LLM-judge — nie moduł w agent.ts.
```

**Implikacja:** najlepszy ROI = **Opcja A (docs §2.7)** + krzyżowe linki do §2.2, §2.5, §2.6 i `agent-evals`; **brak zmian w `tasks/boilerplate/src/`** w ramach tego MR.

---

## 2. Pozycja lekcji w kurriculum

| Lekcja | Fokus | Relacja do S04E03 |
| --- | --- | --- |
| **S03E03** | Feedback kontekstowy, triggery, metadata, hooki | S04E03 **zakłada** te mechaniki i przenosi je na codzienność |
| **S04E01** | Wdrożenie, garden, skills, async | S04E03 odwołuje się do **aktywnych katalogów** w garden |
| **S04E02** | Kanał współpracy (jak rozmawiasz z AI) | S04E03 = **co** automatyzujesz w tle, nie **gdzie** siedzi UI |
| **S02E04** | Kontekst wielu wątków, orchestrator | S04E03: komunikacja agentów tylko gdy izolacja nie wystarcza |
| **S03E01** | Observability, evals | S04E03: **agenci oceniający skuteczność** całego systemu |

S04E03 **nie wprowadza nowej klasy runtime** niewidocznej w §2.1–§2.6 — syntetyzuje **produkcyjne wdrożenie kontekstowe** i podkreśla **granice multi-agent** (izolacja, unikanie pętli feedbacku).

---

## 3. Funkcjonalności z lekcji (poza homework `domatowo`)

### 3.1 Szerokie spojrzenie — krajobraz integracji

Lekcja enumeruje obszary codziennej pracy, w których AI może działać **bez bezpośredniej interakcji**:

| Domena | Przykładowe zastosowanie agentowe | Runtime w boilerplate? |
| --- | --- | --- |
| OS (Mac/Win/Linux) | CLI, harmonogramy, AppleScript, deep-linki | **Nie** — host / skrypty |
| Mobile / IoT | czujniki, lokalizacja, automaty | **Nie** — natywna app |
| Komunikatory | monitoring kanału, bot, feedback | **Nie** — epizod / bot |
| Kalendarze | planowanie, podsumowania, dostępność | MCP epizodu + orchestrator |
| Maile | organizacja wątków, szkice, kanał async | lekcja `03_04_gmail` jako wzorzec narzędzi |
| Internet / RSS / social | monitoring tematów | `http_request` + epizodowe MCP |
| Task management | odpowiedzialności agenta w zakresie | Linear/Jira MCP w aplikacji |
| Zdalne repo | review, mobile coding, **ryzyko injection** | §2.5; brak git w default MCP |
| Edytory / CMS | wsparcie twórcze, nie generyczny spam | poza pakietem |
| CRM / sprzedaż | research, routing — relacje wymagają ostrożności | wąskie MCP |
| Grafika / wideo | vision + zewnętrzne API (Replicate…) | `analyze_image_vision` + HTTP |
| Lifestyle / nauka | coach, trening | lekcje `03_03_language` |

**Wniosek:** Lekcja to **mapa decyzyjna integracji**, nie lista modułów do `@ai-devs/agent-boilerplate`. Warto ją skondensować w **§2.7** (tabela „domena → wzorzec → antywzorzec”).

### 3.2 Osobisty „stack” narzędzi (API-first)

Lekcja podaje przykładowy zestaw usług (GSuite, Linear, Slack, Obsidian, Firecrawl, sandboxy Daytona/E2B, GitHub, Convex, Resend, SMS API…).

| Obserwacja lekcji | Implikacja dla kursu |
| --- | --- |
| Wspólny mianownik = **szerokie API** | Narzędzia MCP epizodu: wąskie akcje, nie pełne API (§2.3) |
| API bywa niekompletne | Logika i walidacja w **handlerze** TypeScript |
| Ograniczenie zaangażowania człowieka + rozsądne uprawnienia | Projekt epizodu: env, scope MCP, brak „superuser” w prompcie |
| Źle zaprojektowany flow (np. konsultacje + faktury) | **Nie** problem runtime — design procesu przed kodem |

**Wniosek:** Boilerplate **już daje** `http_request` + retry; integracje SaaS = **kod epizodu / aplikacji**, nie nowe zależności w pakiecie.

### 3.3 Scenariusze kontekstu indywidualnego

| Scenariusz | Istota | Mapowanie w repo |
| --- | --- | --- |
| Przegląd wydarzeń kalendarza | Analityka + sugestie tylko gdy potrzeba | Orchestrator cron + ReAct z metadata; `03_03_calendar` |
| Sugestie wydarzeń | Proaktywne propozycje z notatek/otoczenia | OM + trigger; **nie** `agent.ts` |
| Dodatkowy e-mail agenta | Read-only KB; wysyłka tylko do usera | Wzorzec uprawnień w MCP epizodu |
| Aktywne katalogi | Plik w folderze → transformacja w tle | `04_01_garden` (concept/review/ready/published) |
| Manager schowka | Lokalny model, prywatność | Poza pakietem (local LLM) |
| Przegląd zadań | Prezentacja + techniki produktywności | Planning + prompt; opcj. OM |
| Panel / „ściana” (Second Brain) | Agregacja sygnałów wewn./zewn. | Aplikacja frontend + workerzy |
| Nasłuchiwanie sygnału | YouTube, X, RSS, ranking istotności | Scheduled worker + klasyfikacja LLM |
| Kontrola jakości publikacji | Linki, język, merytoryka | Osobny agent QC; izolacja |
| Tworzenie powiązań w KB | Sugestie linków, nie pełna autonomia | Narzędzie MCP + człowiek w pętli |

**Wniosek:** Wszystkie scenariusze = **wiele entrypointów** wywołujących ten sam `createAgent` z różnymi promptami/narzędziami — wzorzec już opisany w S03E03 §2.2 i S04E01 §2.5.

### 3.4 Przepływy danych (biznes)

| Scenariusz | Mapowanie |
| --- | --- |
| Szablony projektowe | Workflow markdown + integracje (garden, §2.5) |
| Materiały promocyjne | Vision + generatywne UI (`03_05_*`) |
| Przekierowania zgłoszeń | Klasyfikacja LLM + routing w MCP |
| Optymalizacja workflow | Logi + ocena skuteczności (Langfuse, evals) |
| Monitorowanie KPI (MRR, churn, NPS) | Agregacja w TS; LLM na priorytetyzację feedbacku |
| Raporty | LLM jako **wsparcie** analizy, nie jedyny autor decyzji |

**Wniosek:** Lekcja wzmacnia werdykt S03E02 — **deterministyczna agregacja w TS**, LLM tam gdzie potrzebna interpretacja.

### 3.5 Kontekst urządzenia i formy komunikacji

Agent z dostępem do: aktywnej aplikacji, DND, lokalizacji, SMS/telefonu — dynamiczny wybór kanału powiadomienia.

| Element | Boilerplate |
| --- | --- |
| Metadata (app, DND, geo) w user message | **Wzorzec** — budowa w `run.ts` (jak `buildMetadata` w calendar) |
| Sterowanie DND / SMS | **Natywna aplikacja** — lekcja wspomina Swift/Rust/C# |
| Decyzja modelu o kanale | Prompt + metadata; **nie** moduł `NotificationRouter` w core |

### 3.6 Zarządzanie zdarzeniami, izolacja i samonadzór

**Kluczowa nowość pedagogiczna S04E03** względem S03E03:

| Zasada | Opis | Implikacja techniczna |
| --- | --- | --- |
| **Izolacja agentów** | Jeden agent = jeden obszar; brak wzajemnej wiedzy o innych | Osobne `processQuery` / osobne wątki; **nie** shared memory domyślnie |
| Unikanie konfliktów | Projekt tak, by konflikty **nie występowały** | Brak wspólnej kolejki zadań w `createAgent` |
| Ryzyko multi-agent | Nakładające się zależności, pętle, opóźnione ujawnienie | Docs + architektura; `02_04_ops` gdy komunikacja konieczna |
| **Agenci obserwujący system** | LLM-as-judge: czy newsletter czytany? czy źródło żywe? | Worker cykliczny + `@ai-devs/agent-evals`; **nie** hook w każdej turze ReAct |
| Komunikacja między agentami | Tylko gdy zadanie tego wymaga | S02E04 / `delegate` w `02_04_ops` |

**Wniosek:** To uzasadnia **§2.7** (izolacja + samonadzór) i cross-link do `agent-observability-evals` — **nie** nowe API `createAgent({ agents: [...] })`.

### 3.7 Computer Use i scraping

Lekcja wspomina wzrost **Computer Use**, scrapowanie, API — bez osobnego demo w repo (`lessons/04_03_*` brak).

| Temat | Gdzie w kursie |
| --- | --- |
| Playwright / browser agent | `lessons/03_03_browser/` |
| HTTP + parsowanie | `http_request` + epizod |
| Firecrawl / Jina | Zewnętrzne API w MCP epizodu |

**Wniosek:** **Nie** dodawać browser MCP do default install (werdykt S03E03 bez zmian).

### 3.8 Brak referencyjnej lekcji w repo

Jak S04E02 — treść opiera się na **markdown + diagramy**; brak `lessons/04_03_*` do porównania implementacyjnego.

---

## 4. Mapowanie na stan `tasks/boilerplate`

### 4.1 Już pokryte (bez zmian)

| Potrzeba z lekcji / kursu | Mechanizm |
| --- | --- |
| Pętla agenta + narzędzia | `createAgent`, ReAct |
| HTTP do API świata | `http_request`, retry 429/503 |
| Hub verify | `submit_to_hub` |
| Multi-turn / długa sesja | `processConversationTurn`, OM |
| Plan przed działaniem | `enablePlanningPhase` |
| Feedback po błędzie | `MemoryHooks` (epizod) |
| Człowiek w pętli | `ask_human` |
| Metadata w user message | Wzorzec §2.2 |
| Lazy narzędzia przy wielu integracjach | `toolDiscovery` |
| Observability / evals | Langfuse opt-in; `@ai-devs/agent-evals` |
| Wąskie MCP | §2.3 |
| Garden / skills / deploy | §2.5; `04_01_garden` |
| Kanały współpracy | §2.6 |
| Proaktywność / heartbeat | `03_02_events/` |
| Multi-agent z delegacją | `02_04_ops` |

### 4.2 Luka dokumentacyjna (warto uzupełnić — §2.7)

Brak sekcji **§2.7** w `tasks/docs/boilerplate-documentation.md` dla:

- **Mapy domen codzienności/biznesu** (kalendarz, mail, taski, monitoring…) — kiedy agent w tle ma sens;
- **Stack integracji API-first** — wąskie MCP, uprawnienia, anty-spam powiadomień;
- **Aktywne katalogi / workflow plikowy** — cross-link do garden;
- **Izolacja agentów** — jeden obszar = jeden agent/worker; unikanie wspólnego grafu zależności;
- **Samonadzór systemu** — cykliczni „audytorzy” + evals, nie pętla w `agent.ts`;
- **Kontekst urządzenia** — metadata w wiadomości, natywne akcje poza pakietem;
- **Kiedy komunikacja między agentami** — S02E04 / `02_04_ops`, koszt spadku autonomii;
- **Computer Use / scraping** — browser lesson + HTTP, nie default MCP.

### 4.3 Rozszerzenia runtime — ocena

| Propozycja | Zysk | Koszt / ryzyko | Rekomendacja |
| --- | --- | --- | --- |
| **Scheduler / cron** w `createAgent` | Triggery z lekcji | Duplikat `03_02_events` | **Nie** |
| **Webhook server** w pakiecie | Integracje SaaS | Host-specific | **Nie** — entrypoint epizodu |
| **Folder watcher** (aktywne katalogi) | Garden UX | FS + platform-specific | **Nie** — garden / app |
| **Agent bus / message queue** | Komunikacja multi-agent | Złożoność, pętle | **Nie** — `02_04_ops` |
| **`createAgent({ subAgents })`** | Izolacja w API | Mylenie z orchestratorem | **Nie** |
| **Moduł integracji** (Gmail, Linear…) | Szybki start | Setki API, sekrety | **Nie** — epizod |
| **Device context provider** w core | DND, app, geo | Platform-specific | **Nie** — wzorzec metadata |
| **Notification policy engine** | Nie spamować | Produkt-specific | **Nie** — docs |
| **System health agent** w boilerplate | Samonadzór | Poza misją hub | **Nie** — worker + evals |
| **LLM-judge helper** (cienki export) | Audyt newsletterów | Nakładka na evals | **Defer** — wystarczy docs + `agent-evals` |
| **§2.7 + README + CHANGELOG** | Spójność §2.1–§2.6 | Mały effort docs | **Tak (Opcja A)** |

### 4.4 Szczegół: relacja do S03E03 i S04E02

| Pytanie | Odpowiedź |
| --- | --- |
| Czy S04E03 duplikuje S03E03? | **Częściowo** — S03E03 = mechanika; S04E03 = **katalog use-case’ów** i **izolacja produkcyjna** |
| Czy S04E03 duplikuje S04E02? | **Nie** — S04E02 = interfejs; S04E03 = **procesy w tle** i integracje |
| Czy potrzebna nowa sekcja docs? | **Tak** — §2.7 uzupełnia §2.2 (jak) o §2.7 (co i jak organizować w produkcji) |

---

## 5. Homework `domatowo` (tylko granica scope)

Zadanie **`domatowo`** (misja ratunkowa na mapie 11×11, budżet **300** punktów akcji, max 4 transportery / 8 zwiadowców, `getMap`, `create`, ruch, `inspect`, `getLogs`, `callHelicopter`) **nie jest analizowane**.

Z grubsza pasuje do profilu **hub + `http_request` + planowanie przestrzenne w kodzie epizodu**:

- analiza mapy i kosztów akcji → **deterministyczny** planner/pathfinder w TypeScript (0–N tur ReAct);
- ewentualna interpretacja logów `inspect` → wąski ReAct lub reguły;
- **nie wymaga** rozszerzenia `@ai-devs/agent-boilerplate` — analogia do `windpower` / `savethem` (orchestracja w epizodzie).

Motyw homework **nie przenosi się** na werdykt rozszerzeń core (świadomie wyłączone przez użytkownika).

---

## 6. Zbieżność z wcześniejszymi lekcjami

| Temat S04E03 | Już w research / boilerplate |
| --- | --- |
| Metadata / otoczenie | S03E03 §2.2 |
| Triggery / proaktywność | S03E03; `03_02_events` |
| Wąskie narzędzia / uprawnienia | S03E04 §2.3 |
| Eval / judge | S03E01; `agent-evals` |
| Garden / katalogi | S04E01 §2.5 |
| Kanały współpracy | S04E02 §2.6 |
| Multi-agent / delegate | S02E04; `02_04_ops` |
| Model vs kod | S03E02 §2.1 |

S04E03 **dodaje** nacisk na **produkcyjną mapę integracji**, **izolację agentów tła** oraz **meta-agentów audytujących** — bez nowego runtime w pakiecie.

---

## 7. Rekomendacje priorytetowe

### Nie dodawać do `@ai-devs/agent-boilerplate` (core)

1. Scheduler / cron / webhook server  
2. Integracje SaaS (Gmail, Linear, Slack, Firecrawl…)  
3. Folder watcher / aktywne katalogi w core  
4. Agent bus / kolejka między agentami  
5. API subagentów w `createAgent`  
6. Device context (DND, SMS, geolocation) w pakiecie  
7. Notification / anti-spam policy engine  
8. Browser / Computer Use w default install  
9. System health agent w `agent.ts`  
10. Moduł „contextual collaboration” jako kod runtime  

### Warto zrobić (niska intruzywność — precedens S04E02 Opcja A)

| Opcja | Zakres | Szacowany effort |
| --- | --- | --- |
| **A (zalecana)** | §**2.7** w `tasks/docs/boilerplate-documentation.md` + wiersz w README Feature catalog + Quick decision guide + CHANGELOG (Unreleased); cross-linki §2.2, §2.5, §2.6, `agent-evals` | Mały |
| **B** | Akapit w `agent-evals/README.md` — „system self-observation (S04E03)” z przykładem cyklicznego judge | Mały |
| **C** | Referencyjna lekcja `lessons/04_03_*` w upstream | **Poza repo** / defer |
| **D** | Pakiet `@ai-devs/agent-integrations` | **Defer** — 0 epizodów `tasks/` wymaga |
| **E** | Cienki helper `runPeriodicAudit()` | **Defer** — docs wystarczą |

---

## 8. Proponowana treść §2.7 (szkic do planu)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **AI w tle** | Osobny entrypoint + ten sam `createAgent` | Jeden wieczny ReAct na cały biznes | `03_02_events/`; §2.5 |
| **Integracja SaaS** | Wąskie MCP + `http_request`; scope w handlerze | Pełne API w jednym narzędziu | §2.3; epizod |
| **Uprawnienia** | Read-only KB; wysyłka tylko do ownera | Model z pełnym dostępem API | env + MCP epizodu |
| **Powiadomienia** | Tylko gdy istotne; zbiorcze digesty | Agent produkujący szum | prompt + orchestrator |
| **Aktywne katalogi** | Folder → worker → kolejny etap | Watchery w `createAgent` | `04_01_garden` |
| **Metadata urządzenia** | JSON / `<metadata>` w user message | Model zgaduje DND/geo | `03_03_calendar` |
| **Izolacja agentów** | 1 obszar = 1 agent/worker | Wspólna pamięć wszystkich ról | §2.7; `02_04_ops` gdy sync |
| **Komunikacja agentów** | Tylko gdy zadanie wymaga współdzielenia | Domyślny graf zależności | S02E04; `delegate` |
| **Samonadzór** | Cykliczny audit + evals / LLM-judge | Hook w każdej turze ReAct | `agent-evals`; Langfuse |
| **Monitoring sygnału** | Scheduled fetch + klasyfikacja | Ciągły ReAct na RSS | worker + epizod |
| **Homework hub** | Planner TS + minimalny ReAct | Pełna automatyzacja bez kosztów | `tasks/sXXeYY/` |

**Reguła kciuka §2.7:**

```text
Chcesz AI w codzienności (mail, kalendarz, KPI) → orchestrator + triggery poza createAgent; wąskie MCP per domena.
Budujesz wiele agentów → izoluj obszary; łącz tylko gdy musisz (02_04_ops).
System ma się sam oceniać → periodic worker + agent-evals — nie rozszerzaj agent.ts.
Epizod hub (domatowo, verify) → default boilerplate; strategia mapy w kodzie epizodu.
```

---

## 9. Otwarte pytania (do akceptacji research)

| # | Pytanie | Propozycja domyślna |
| --- | --- | --- |
| 1 | Czy §2.7 ma linkować homework `domatowo`? | **Nie** — tylko ogólna regułka „hub + planner TS” (jak §5 dla async) |
| 2 | Czy dodać wiersz „Contextual collaboration (S04E03)” w README Feature catalog? | **Tak** — spójnie z S04E02 |
| 3 | Czy rozszerzać `agent-evals` (Opcja B)? | **Tak** — sekcja w README w tym samym MR docs (plan D6) |
| 4 | Czy duplikować izolację z `02_04_ops`? | **Cross-link** — §2.7 = zasada; ops = implementacja referencyjna |
| 5 | Czy upstream doda `lessons/04_03_*`? | **Poza scope** — zaktualizować §2.7 gdy pojawi się demo |
| 6 | Nazwa folderu spec: `contextual-collaboration` vs `contextual-work`? | **`s04e03-contextual-collaboration`** — zgodnie z tytułem lekcji |

---

## 10. Następne kroki (po akceptacji research)

1. **Plan:** [s04e03-contextual-collaboration.plan.md](s04e03-contextual-collaboration.plan.md) — Opcja A + B — **utworzony** (2026-06-23).  
2. **Implementacja docs (osobny MR):** §2.7 + README + CHANGELOG + `agent-evals/README.md` (D1–D6).  
3. **Brak zmian w `tasks/boilerplate/src/`** w ramach Opcji A.  
4. **Homework `domatowo`:** osobny epizod `tasks/s04e03/` — poza tym MR (jeśli w ogóle).

---

## 11. Werdykt końcowy (odpowiedź na pytanie użytkownika)

**Czy w lekcji S04E03 można rozbudować `tasks/boilerplate` pod kątem rozbudowanych agentów AI?**

- **Tak, zasadnie** — ale prawie wyłącznie przez **dokumentację produktową** (proponowane §**2.7**): mapa integracji codzienności/biznesu, AI w tle z izolacją agentów, dyscyplina powiadomień, samonadzór systemu (evals), kontekst urządzenia jako metadata — **uzupełniając** §2.2 (mechanika) i §2.6 (kanał współpracy).
- **Nie zasadnie w core runtime** — schedulery, webhooki, integracje SaaS, watchery katalogów, bus multi-agent, device APIs i „system health” w `createAgent` to **warstwa aplikacji/orchestratora**, nie brakujące klocki `@ai-devs/agent-boilerplate`.
- **Homework `domatowo`** (pominięty) **nie uzasadnia** rozszerzenia boilerplate — typowy profil hub ze strategią przestrzenną w kodzie epizodu.

**Implikacja:** najlepszy ROI = **Opcja A (docs §2.7)** w **osobnym MR** (zgodnie z życzeniem użytkownika); rozbudowane agenty produkcyjne buduje się **compositionem** istniejących klocków (ReAct, MCP, OM, evals, events, garden) — nie jednym większym `createAgent`.

---

## 12. Assumptions

- Analiza oparta na markdownie w repo (`published_at: 2026-04-01` — scheduled); treść może się nieznacznie zmienić przed publikacją.
- Brak `lessons/04_03_*` w monorepo — brak kodu referencyjnego do porównania implementacyjnego.
- Użytkownik świadomie wyłączył **`domatowo`** z głębokiej analizy — granica scope w §5.
- §2.6 (S04E02) jest **zrealizowane** — §2.7 ma **uzupełniać**, nie zastępować.
- Implementacja docs ma być **osobnym MR** od zadania domowego `domatowo`.
