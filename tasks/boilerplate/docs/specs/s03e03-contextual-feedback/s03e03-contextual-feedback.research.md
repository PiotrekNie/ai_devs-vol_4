# S03E03 — kontekstowy feedback wspierający skuteczność agentów — research

**Task:** Analiza lekcji S03E03 pod kątem opisanych funkcjonalności oraz ocena, czy którekolwiek powinny trafić do `@ai-devs/agent-boilerplate`.

**Zakres:** Cały kurs (wzorce agentowe, lekcje demo, epizody `tasks/`) — **bez** implementacji zadania domowego `reactor` (osobny wątek).

**Data:** 2026-05-31  
**Status:** Research + plan docs-only — **zrealizowany** (§2.2 w `tasks/docs/boilerplate-documentation.md`, 2026-05-31).

**Źródła:**

- `markdowns/s03e03-kontekstowy-feedback-wspierajacy-skutecznosc-agentow-1774391034.md` — transkrypt lekcji S03E03
- `lessons/03_03_calendar/` — metadata w wiadomości, fazy add / webhook, wzbogacanie kontekstu
- `lessons/03_03_language/` — hooki `beforeToolCall` / `afterToolResult` / `beforeFinish`, profil + sesje
- `lessons/03_03_browser/` — Playwright + MCP, agent przeglądarkowy
- `lessons/03_02_events/` — heartbeat, `tasks.md`, proaktywność (nawiązanie w lekcji)
- `tasks/boilerplate/README.md` — feature catalog
- `tasks/boilerplate/docs/specs/s03e02-model-constraints/s03e02-model-constraints.research.md` — precedens werdyktu „nie rozszerzać core”
- `tasks/s03e01/`, `tasks/s03e02/` — wzorce epizodów (`*_memory.ts`, minimalny ReAct)

**Weryfikacja UI:** brak.

---

## 1. Executive summary

Lekcja S03E03 rozwija **integrację agenta z otoczeniem** i **feedback kontekstowy** — od reaktywnego stanu w S02E01 do autonomicznych wyzwalaczy, proaktywności, wzbogacania wiadomości oraz hooków cyklu życia narzędzi. To głównie **wzorce architektoniczne i produktowe**, a nie brakujące API w pakiecie kursowym.

| Werdykt ogólny | Uzasadnienie |
| --- | --- |
| **Nie rozszerzać core boilerplate** o scheduler (cron/heartbeat/webhook), `tasks.md`, Playwright, MCP Sampling, pełny zestaw hooków AI SDK | Orchestracja i domena; misja pakietu = jawny **ReAct + MCP** na zadania hub |
| **Utrzymać / dokumentować** | `MemoryHooks`, `ask_human`, `processConversationTurn`, OM, planning, Langfuse — już pokrywają 80% potrzeb kursu |
| **Epizody i lekcje** | Wzbogacanie kontekstu, workflow guards, browser — w `lessons/03_03_*` lub cienkim kodzie epizodu |
| **Homework `reactor`** | Deterministyczna pętla HTTP + wizja / reasoning — **nie** wymaga nowych modułów w boilerplate (osobny wątek) |

**Spójność z S03E02:** werdykt ten sam — heartbeat i multi-agent pozostają w `lessons/03_02_events/`, nie w `@ai-devs/agent-boilerplate`.

---

## 2. Funkcjonalności z lekcji — inwentaryzacja (bez zadania `reactor`)

### 2.1 Warstwa koncepcyjna (nie kod boilerplate)

| Temat lekcji | Opis | Czy to feature runtime? |
| --- | --- | --- |
| Personalizacja vs „iluzja samoświadomości” | Zachowanie zależne od otoczenia i zdarzeń | **Nie** — UX / product design |
| Jeden punkt wejścia systemu | NL z różnych triggerów → ten sam agent | **Wzorzec** — orchestrator poza pętlą ReAct |
| Sesja per trigger vs główna sesja | Izolacja kontekstu vs współdzielenie | **Decyzja architektoniczna** — `processConversationTurn` vs nowe `processQuery` |
| „Połączenie kropek” przy słabym kontekście | Dopytywanie, narzędzia, pamięć | **Wzorzec** — prompty + MCP + `ask_human` |
| Wsparcie człowieka (onboarding, jakość nagrań) | Oczekiwania wobec użytkownika | **Nie** — copy / UX produktu |
| MCP Sampling (serwer → klient LLM) | Odwrócona komunikacja w narzędziach | **Spec MCP** — rzadko wspierane; poza scope boilerplate |

### 2.2 Autonomiczne wyzwalacze (triggery)

| Trigger | Lekcja | Typowa realizacja w kursie |
| --- | --- | --- |
| Wiadomości (człowiek / inny agent) | ✅ | `processQuery` / `processConversationTurn` |
| Hooki wewnętrzne (subagenci, kroki) | ✅ | Lekcja `03_03_language`, browser step hooks w aplikacji |
| Webhooki zewnętrzne | ✅ | Skrypt + `http_request` lub osobny entrypoint epizodu |
| Cron | ✅ | `setInterval` / zewnętrzny scheduler — **poza** agent loop |
| Heartbeat | ✅ (nawiązanie) | `lessons/03_02_events/`, `tasks.md` — **nie** boilerplate |

Lekcja podkreśla: trigger często = **nowa sesja**; wyjątek to **główna, „nieskończona” sesja** + OM + okresowe czytanie `tasks.md` — to orchestrator produkcyjny, nie homework typu hub.

### 2.3 Proaktywność i `tasks.md`

| Mechanizm | Opis |
| --- | --- |
| Trwała sesja użytkownika | Kompresja (OM) + kontynuacja wątku |
| Heartbeat / tick | Wiadomość: przeczytaj `tasks.md`, wykonaj lub pomiń |
| `tasks.md` | Lista aktywności wymagających kontekstu głównego wątku |
| Personalizacja triggerów | Czas, lokalizacja, Linear, kalendarz — **metadata** + narzędzia |

**Mapowanie kursu:** OM + `enablePlanningPhase` + epizodowe `MemoryHooks` (np. wstrzyknięcie planu po błędzie hub) — **wystarczają** dla zadań `tasks/`. Pełna proaktywność = lekcja events + osobna aplikacja.

### 2.4 Kontekst niewystarczający i wzbogacanie (`03_03_calendar`)

| Mechanizm | Opis | Demo |
| --- | --- | --- |
| Blok `<metadata>` w wiadomości użytkownika | Czas, lokalizacja, pogoda — **programistycznie** | `lessons/03_03_calendar/src/data/environment.ts` |
| Faza „dodawanie wydarzeń” | Agent łączy sygnały → bogatszy wpis kalendarza | Symulacja czasu/lokalizacji między krokami |
| Faza webhooków | Payload zdarzenia + metadata → powiadomienie | `notificationWebhooks` w scenariuszu |
| Narzędzia domenowe | Kalendarz, mapa, pamięć, powiadomienia | MCP w lekcji — nie uniwersalne dla kursu |

**Wniosek:** „Wzbogacanie” = **dobry prompt + metadata w `user` message + MCP**, nie nowy moduł w boilerplate.

### 2.5 Hooki cyklu życia agenta

**Lekcja (AI SDK / Pi):** `onStart`, `onStepStart`, `onStepFinish`, `onToolCallStart`, `onToolCallFinish`, `onFinish`, plus streaming / kompresja sesji.

**Demo `03_03_language`:**

| Hook | Rola |
| --- | --- |
| `beforeToolCall` | Przy `listen` — zapamiętanie ścieżki audio |
| `afterToolResult` | Flagi `listen_done`, `feedback_done`, `session_saved`; reset fazy |
| `beforeFinish` | Strażnik: wymuszenie dokończenia pipeline’u coachingu |
| `buildFallbackTextFeedback` | Fallback gdy model kończy za wcześnie |

To **workflow specjalistyczny** (coach językowy), nie generyczny kontrakt ReAct.

**Demo `03_03_browser`:** logika kroków w aplikacji CLI (login → chat), Playwright — osobny runtime.

### 2.6 Narzędzia wielomodelowe w jednym toolu

Lekcja: `listen` / `feedback` wywołują **dodatkowe** API (Gemini audio). MCP **Sampling** — serwer prosi klienta o completion.

| Aspekt | Rekomendacja |
| --- | --- |
| Sampling w boilerplate | **Nie** — brak wsparcia w większości klientów MCP kursu |
| Wzorzec „tool woła drugi model” | **Epizod** — implementacja w handlerze MCP / osobnym `chat()` |

### 2.7 Human-in-the-loop przez hooki

| Scenariusz lekcji | Boilerplate dziś |
| --- | --- |
| Potwierdzenie niezaufanej akcji | `ask_human` (native) |
| Uzupełnienie brakujących informacji | `ask_human` + prompt |
| Analiza przed końcem sesji | `beforeFinish` w lekcji language — **custom** w aplikacji lekcji |

---

## 3. Demo lekcji vs pakiet kursowy

| Lokalizacja | Co pokazuje | Import do boilerplate? |
| --- | --- | --- |
| `lessons/03_03_calendar/` | Metadata + 2 fazy (add / notify) | **Nie** — orchestrator skryptowy + domena kalendarza |
| `lessons/03_03_language/` | Hooki workflow + Gemini audio | **Nie** — wysoka specjalizacja |
| `lessons/03_03_browser/` | Playwright, sesja przeglądarki, Kernel docs | **Nie** — ciężkie zależności; opcjonalnie osobny pakiet w distant future |
| `lessons/03_02_events/` | Heartbeat, plan wieloagentowy | Już wykluczone w S03E02 research |

---

## 4. Mapowanie lekcja → boilerplate (stan obecny)

| Funkcjonalność lekcji | W boilerplate? | Gdzie / jak |
| --- | --- | --- |
| ReAct + function calling | ✅ default | `createAgent` |
| Multi-turn sesja | ✅ default | `processConversationTurn` |
| Metadata w wiadomości użytkownika | ✅ wzorzec | Epizod buduje string w `run.ts` / prompt — bez helpera w core |
| `ask_human` | ✅ default | native |
| MemoryHooks (`beforeTurn` / `afterTurn`) | ✅ interface | OM factory lub `firmware_memory` / `evaluation_memory` |
| Planning turn 0 | ✅ opt-in | `enablePlanningPhase` |
| Observational Memory (długa sesja) | ✅ opt-in | `createObservationalMemoryHooks` |
| Langfuse tracing | ✅ opt-in | `observability/` |
| Retry HTTP / hub | ✅ default | `http_request`, adapter |
| Wstrzyknięcie planu po feedbacku | ✅ wzorzec epizodu | `injectWorkingPlan` + custom hooks |
| Hooki `beforeToolCall` / `afterToolResult` / `beforeFinish` | ❌ | `lessons/03_03_language` |
| Scheduler: cron / webhook runner | ❌ | Aplikacja / skrypt poza pakietem |
| Heartbeat + `tasks.md` | ❌ | `lessons/03_02_events` |
| Playwright / browser MCP | ❌ | `lessons/03_03_browser` |
| MCP Sampling | ❌ | Docs / przyszłe lekcje MCP |
| Generowanie nazwy sesji (`onStart`) | ❌ | Produkt UI — poza kursem |
| Proaktywne powiadomienia push | ❌ | Integracja OS / messaging — poza kursem |

**Uwaga:** `MemoryHooks` operują na **turze ReAct** (przed/po wywołaniu LLM), podczas gdy hooki z lekcji operują na **pojedynczym tool call** i **zakończeniu runu**. To różne warstwy — scalanie w jeden mega-interfejs w core **nie jest uzasadnione** dla zadań hub.

---

## 5. Ocena zasadności dodania do boilerplate

Skala: **Tak (core)** | **Tak (opt-in / osobny pakiet)** | **Nie (epizod / lekcja)** | **Tylko docs**

| # | Feature z lekcji | Rekomendacja | Uzasadnienie |
| --- | --- | --- | --- |
| 1 | Heartbeat + `tasks.md` + proaktywność | **Nie** | Duplikuje `03_02_events`; orchestrator ≠ ReAct homework |
| 2 | Cron / webhook dispatcher | **Nie** | Entrypoint aplikacji, nie agent runtime |
| 3 | `buildMetadataBlock()` w core | **Tylko docs** | 5 linii XML w epizodzie; kształt zależny od domeny |
| 4 | Pełne `AgentLifecycleHooks` (AI SDK) | **Nie** | 1 sensowny demo (language); reszta przez `handlers` + logika epizodu |
| 5 | `beforeFinish` workflow guard w `createAgent` | **Nie** (ewent. **distant opt-in**) | Kolizja z `finish_task`; coaching ≠ hub tasks |
| 6 | Hooki per tool call w boilerplate | **Nie** | Rozszerzałoby `dispatchToolCall` — API surface dla jednego wzorca lekcji |
| 7 | Playwright / browser tools | **Nie** (osobny pakiet **defer**) | Jak code mode — tylko gdy zadanie w `tasks/` tego wymaga |
| 8 | MCP Sampling helper | **Tylko docs** | Spec rzadko implementowany |
| 9 | Kontekstowe wzbogacanie wiadomości | **Wzorzec prompt + MCP** | Calendar pokazuje **treść** wiadomości, nie nowy runtime |
| 10 | Multi-model w jednym tool | **Epizod** | Drugi adapter / `chat()` w implementacji narzędzia |
| 11 | Jeden punkt wejścia NL | **Wzorzec arch.** | `index.ts` epizodu przyjmuje różne źródła → ten sam `createAgent` |
| 12 | Rozszerzenie `MemoryHooks` o `onToolResult` | **Nie teraz** | Epizody z rzadką potrzebą mogą opakować `handlers.execute` |

### 5.1 Reguła decyzyjna (z README + S03E02)

```text
≤5 tur ReAct, ≤4 narzędzia, jednorazowy hub → default boilerplate.
Długa sesja / duży kontekst → OM (+ ewent. tracing).
Orchestracja czasu (cron, heartbeat, tasks.md) → lekcje events / osobna aplikacja.
Hooki workflow (listen→feedback→save) → lekcja language lub kod epizodu.
Browser / audio multi-modal → lekcje 03_03_* lub dedykowany pakiet — nie core.
```

### 5.2 Profil typowych zadań kursowych (`tasks/`)

| Epizod | Potrzeby S03E03 | Wystarczy boilerplate? |
| --- | --- | --- |
| S03E01 evaluation | Hub feedback → plan w pamięci | ✅ `MemoryHooks` + `injectWorkingPlan` |
| S03E02 firmware | Sekwencja HTTP, ban | ✅ bez hooków language |
| Przyszły S03E03 reactor | Pętla `start`/`wait`/mapa, wizja opcjonalnie | ✅ `http_request` + vision tool; logika w epizodzie |
| S02E04 mailbox | Plan + journal domenowy | ✅ planning + custom memory |
| S02E05 drone | ReAct + vision | ✅ default |

**Żaden** z powyższych **nie wymaga** schedulera, `tasks.md`, ani hooków coachingowych z lekcji language.

---

## 6. Co już pokrywa kurs (bez zmian w boilerplate)

| Potrzeba z lekcji S03E03 | Istniejący mechanizm |
| --- | --- |
| Reakcja na zmieniające się otoczenie w trakcie rozmowy | Narzędzia MCP + wyniki w kontekście ReAct |
| Programistyczny stan otoczenia | Metadata / JSON w treści `user` message (calendar) |
| Długa sesja bez przepełnienia | OM (opt-in) |
| Korekta po błędzie / feedback hub | `MemoryHooks` + `injectWorkingPlan` (S03E01, S03E02) |
| Człowiek w pętli | `ask_human` |
| Obserwowalność działań | Logger + Langfuse (opt-in) |
| Eval jakości | `@ai-devs/agent-evals` (osobny pakiet) |

---

## 7. Rekomendacje priorytetowe

### Nie dodawać do `@ai-devs/agent-boilerplate` (core)

1. Heartbeat, `tasks.md`, cron/webhook runner  
2. Zestaw hooków AI SDK (`onToolCallStart`, …) jako publiczne API pakietu  
3. Playwright / browser MCP w default install  
4. MCP Sampling bridge  
5. Uniwersalny „context enricher” LLM  

### Warto zrobić (poza core lub dokumentacja)

| Działanie | Gdzie |
| --- | --- |
| Sekcja **„S03E03 — contextual feedback patterns”** w `tasks/docs/boilerplate-documentation.md` | Tabela: metadata block, single entrypoint, episode hooks vs `MemoryHooks` |
| ~~Odsyłacze w README~~ | **Nie** (decyzja 2026-05-31) — tylko §2.2 w `boilerplate-documentation.md` |
| Epizod `reactor` (osobny wątek) | Pętla deterministyczna + opcjonalnie vision — **bez** nowych modułów w pakiecie |
| Przyszły `@ai-devs/agent-browser` | **Defer** — tylko gdy zadanie w `tasks/` wymaga Playwright w wielu epizodach |

### Kiedy rozważyć opt-in w monorepo

- **Browser package:** gdy ≥2 epizody w `tasks/` wymagają tego samego zestawu narzędzi Playwright (obecnie: 0).  
- **Workflow guards:** gdy ≥2 epizody potrzebują identycznego `beforeFinish` — dziś wystarczy wrapper na `handlers` w epizodzie.  
- **Metadata helper:** gdy powtarzalny ten sam kształt XML w ≥3 epizodach — na razie **prompt template** w `src/prompts/` epizodu.

---

## 8. Porównanie z werdyktem S03E02

| Obszar | S03E02 | S03E03 |
| --- | --- | --- |
| Heartbeat / multi-agent | ❌ core | ❌ core (potwierdzenie) |
| Sandbox / code mode | osobny pakiet | — |
| Human-in-the-loop | `ask_human` | + hooki jako **wzorzec produktu** (docs) |
| Nowy focus | Ograniczenia modeli | **Triggery, metadata, hooki tool-level** |
| Werdykt core | Nie rozszerzać | **Nie rozszerzać** (spójne) |

---

## 9. Assumptions

- Trzy demo S03E03 są w `lessons/03_03_{calendar,language,browser}/` — osobne runtime’y, nie importowane przez boilerplate.
- Zadanie domowe **`reactor`** jest poza scope tego research (osobny wątek implementacji).
- Boilerplate pozostaje **minimalnym ReAct runtime** dla epizodów hub; lekcje S03E03 uczą **wzorców produkcyjnych**, nie obowiązkowego API pakietu.

---

## 10. Open questions — rozstrzygnięte (2026-05-31)

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Plan docs-only? | **Tak** — [s03e03-contextual-feedback.plan.md](s03e03-contextual-feedback.plan.md) |
| 2 | §2.2 w `boilerplate-documentation.md`? | **Tak** |
| 2b | Wiersz w README Feature catalog? | **Nie** |
| 3 | Pakiet `@ai-devs/agent-browser`? | **Nie** — wystarczą `lessons/03_03_*` |

---

## 11. Suggested next steps

1. **Human gate:** akceptacja [planu docs-only](s03e03-contextual-feedback.plan.md).  
2. Implementacja D1–D2: sekcja **`### 2.2. Contextual feedback (S03E03)`** w `tasks/docs/boilerplate-documentation.md`.  
3. Implementacja **`tasks/s03e03/`** (`reactor`) — **osobny wątek**.  
4. Brak zmian w `src/agent/agent.ts` bez osobnej decyzji (≥2 epizody).

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-05-31 | Research początkowy — lekcja S03E03 vs boilerplate (bez zadania reactor) |
| 2026-05-31 | Open questions rozstrzygnięte; plan docs-only (§2.2 tak, README nie, browser = lekcje) |
| 2026-05-31 | Implementacja D1–D2: §2.2 Contextual feedback (S03E03) w boilerplate-documentation |
