# Plan wdrożenia — Kontekstowa współpraca z AI (S04E03) w dokumentacji boilerplate

**Normatywny research:** [s04e03-contextual-collaboration.research.md](s04e03-contextual-collaboration.research.md) — zaakceptowany; **Opcja A + B** (§2.7 docs + akapit w `agent-evals/README.md`).  
**Workspace:** `tasks/docs/boilerplate-documentation.md`, `tasks/boilerplate/README.md`, `tasks/boilerplate/CHANGELOG.md`, `tasks/agent-evals/README.md`  
**Status:** Zrealizowany (2026-06-23) — D1–D6.

**Decyzje (z research §7–§9):**

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Link do homework `domatowo` w §2.7? | **Nie** — tylko ogólna regułka „epizod hub + planner TS” |
| 2 | Wiersz w README „Contextual collaboration (S04E03)”? | **Tak (D3)** — Quick decision guide |
| 3 | Opcja B (`agent-evals`)? | **Tak (D6)** — sekcja „System self-observation” |
| 4 | Duplikować izolację z `02_04_ops`? | **Nie** — cross-link; §2.7 = zasada, ops = referencja |
| 5 | `lessons/04_03_*`? | **Poza scope** — brak demo w repo |
| 6 | Nowy README lekcji? | **Nie** — brak `lessons/04_03_*` |
| 7 | Zmiany w `tasks/boilerplate/src/`? | **Nie** — docs-only |

**Uwaga numeracji:** W `boilerplate-documentation.md` są §2.1–§2.6. Nowa sekcja to **`### 2.7.`** — wstawiona **po** §2.6, **przed** `---` i §3 (Directory Tree).

**Weryfikacja UI:** brak.

---

## Technical Context

| Obszar | Wartość |
| --- | --- |
| **Stack** | Markdown docs; brak zmian TypeScript w boilerplate |
| **Normatywna spec** | `tasks/docs/boilerplate-documentation.md` |
| **Precedens** | [s04e02-active-collaboration.plan.md](../s04e02-active-collaboration/s04e02-active-collaboration.plan.md) (D1–D5) |
| **Język §2.7** | Polski — spójnie z §2.1–§2.6 |
| **Linki względne** | Od `tasks/docs/` do research, lekcji, `agent-evals` |
| **Testy** | Brak `bun test` / `tsc` dla plików Markdown; `git diff` bez `tasks/boilerplate/src/` |
| **agent-evals** | Tylko README; `bun test` w `tasks/agent-evals/` opcjonalnie po D6 (brak zmian kodu) |

---

## 1. Analiza stanu obecnego (Current Implementation Analysis)

| Element | Stan | Akcja w planie |
| --- | --- | --- |
| `tasks/docs/boilerplate-documentation.md` §2.1–§2.6 | **Istnieje** (S04E02 zrealizowany) | Dodać §2.7; uzupełnić odniesienia §2.6 → §2.7 |
| §2.7 Contextual collaboration | **Brak** | D1 |
| `tasks/boilerplate/README.md` — S04E03 | **Brak** wiersza | D3 (1 wiersz Quick decision) |
| `tasks/boilerplate/CHANGELOG.md` | Brak wpisu S04E03 | D4 |
| `tasks/agent-evals/README.md` — system self-observation | **Brak** | D6 (Opcja B) |
| `tasks/boilerplate/src/` | Bez zmian | **Poza scope** |
| Research status | „do akceptacji” | D5 → zaakceptowany + link do planu |
| `lessons/04_03_*` | **Brak w repo** | Brak zadania README lekcji |

**Już pokryte przez runtime (bez kodu):** `createAgent`, `http_request`, `processConversationTurn`, OM, planning, Langfuse, `MemoryHooks` — opisać w §2.7 jako **wzorzec epizodu / orchestratora**, nie duplikować API.

---

## 2. Zakres (scope)

**W zakresie:**

| ID | Element | Opis |
| --- | --- | --- |
| D1 | `tasks/docs/boilerplate-documentation.md` | **`### 2.7. Contextual collaboration in daily & business workflows (S04E03)`** — wstęp + tabela + reguła kciuka + odniesienia |
| D2 | Cross-linki | §2.6 odniesienia → §2.7; §2.7 → §2.1–§2.6; research S04E03; `agent-evals`; lekcje `03_02_events`, `03_03_calendar`, `04_01_garden`, `02_04_ops` |
| D3 | `tasks/boilerplate/README.md` | **1 nowy wiersz** Quick decision guide (S04E03) |
| D4 | `tasks/boilerplate/CHANGELOG.md` | Wpis docs-only S04E03 (Unreleased) |
| D5 | Research | Status „plan zaakceptowany” / po implementacji „zrealizowany”, link do tego pliku |
| D6 | `tasks/agent-evals/README.md` | Sekcja **System self-observation (S04E03)** — cykliczny audit / LLM-judge; link do §2.7 |

**Poza zakresem (jawnie):**

- `tasks/boilerplate/src/`, testy boilerplate, `package.json`, `config.ts`
- Scheduler, webhook server, integracje SaaS, folder watcher, agent bus w core
- `createAgent({ subAgents })`, device context module, notification engine
- Homework **`domatowo`** / epizod `tasks/s04e03/`
- `lessons/04_03_*` (brak w repo)
- Nowe zależności npm
- Kod w `tasks/agent-evals/src/` (Opcja B = docs only)

---

## 3. Decyzje projektowe

| # | Decyzja |
| --- | --- |
| 1 | Sekcja **normatywna, edukacyjna** — *AI w tle vs profil hub*, nie roadmapa integracji SaaS |
| 2 | **Lokalizacja:** `### 2.7.` **zaraz po** §2.6, **przed** `---` i §3 |
| 3 | **Długość §2.7:** ~50–65 linii — wstęp + tabela (≥10 wierszy) + reguła kciuka + odniesienia |
| 4 | **Spójność:** §2.2 = mechanika kontekstu; §2.6 = kanał współpracy; §2.7 = **procesy w tle i izolacja produkcyjna** |
| 5 | **Garden / events / ops:** cross-linki — **bez** powielania tabel z §2.5 / §2.6 |
| 6 | **Samonadzór:** wiersz w §2.7 + rozwinięcie w D6 (`agent-evals`) — **bez** nowego exportu w pakiecie |
| 7 | **Homework hub:** reguła kciuka „planner TS + minimalny ReAct” — **bez** nazwy `domatowo` |
| 8 | **README boilerplate:** max **1 wiersz** Quick decision |
| 9 | **agent-evals README:** nowa sekcja ~15–25 linii + link do §2.7 i research S03E01 |
| 10 | **Bramki jakości:** `git diff` — zero plików w `tasks/boilerplate/src/` |

---

## 4. Treść docelowa (szkic do wdrożenia)

Implementujący agent **nie kopiuje** research 1:1 — streszcza do tabeli poniżej.

### Wstęp §2.7 (szkic)

> Lekcja S04E03 rozwija **kontekstową współpracę z AI w codzienności i biznesie** — integracje API-first, agenci działający w tle, izolacja obszarów odpowiedzialności oraz samonadzór systemu (evals / LLM-judge). To uzupełnienie §2.2 (mechanika kontekstu) i §2.6 (kanał współpracy). Runtime boilerplate (`createAgent`, MCP, `http_request`) **pozostaje bez zmian**; orchestracja czasu, integracje SaaS i meta-agenci audytujący to **warstwa aplikacji** poza pakietem.

### Tabela wzorców vs antywzorców (docelowa)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **AI w tle** | Osobny entrypoint + ten sam `createAgent` | Jeden wieczny ReAct na cały biznes | [03_02_events](../../lessons/03_02_events/); [§2.5](#25-production-deployments-s04e01) |
| **Integracja SaaS** | Wąskie MCP + `http_request`; scope w handlerze | Pełne API w jednym narzędziu | [§2.3](#23-tool-design--test-data-s03e04); epizod |
| **Uprawnienia** | Read-only KB; wysyłka tylko do ownera | Model z pełnym dostępem API | env + MCP epizodu |
| **Powiadomienia** | Tylko gdy istotne; zbiorcze digesty | Agent produkujący szum | prompt + orchestrator |
| **Aktywne katalogi** | Folder → worker → kolejny etap | Watchery w `createAgent` | [04_01_garden](../../lessons/04_01_garden/) |
| **Metadata urządzenia** | JSON / `<metadata>` w user message | Model zgaduje DND/geo | [03_03_calendar](../../lessons/03_03_calendar/) |
| **Izolacja agentów** | 1 obszar = 1 agent/worker | Wspólna pamięć wszystkich ról | §2.7; [02_04_ops](../../lessons/02_04_ops/) gdy sync |
| **Komunikacja agentów** | Tylko gdy zadanie wymaga współdzielenia | Domyślny graf zależności | S02E04; `delegate` w ops |
| **Samonadzór systemu** | Cykliczny audit + evals / LLM-judge | Hook w każdej turze ReAct | [agent-evals](../../agent-evals/README.md); Langfuse |
| **Monitoring sygnału** | Scheduled fetch + klasyfikacja | Ciągły ReAct na RSS | worker + epizod |
| **Epizod hub (strategia)** | Planner TS + minimalny ReAct | Pełna automatyzacja bez kosztów | `tasks/sXXeYY/` |

### Reguła kciuka (szkic)

```text
Chcesz AI w codzienności (mail, kalendarz, KPI) → orchestrator + triggery poza createAgent; wąskie MCP per domena.
Budujesz wiele agentów → izoluj obszary; łącz tylko gdy musisz (02_04_ops).
System ma się sam oceniać → periodic worker + agent-evals — nie rozszerzaj agent.ts.
Epizod hub (verify, mapa/strategia) → default boilerplate; logika planowania w kodzie epizodu.
```

### Odniesienia §2.7 (szkic)

- Research: [s04e03-contextual-collaboration.research.md](../s04e03-contextual-collaboration/s04e03-contextual-collaboration.research.md)
- Powiązane: [§2.1](#21-project-constraints-s03e02) · [§2.2](#22-contextual-feedback-s03e03) · [§2.3](#23-tool-design--test-data-s03e04) · [§2.5](#25-production-deployments-s04e01) · [§2.6](#26-active-collaboration-with-ai-s04e02) · [§5.2.1](#521-code-mode--wykonanie-kodu-poza-pakietem)
- Pakiety: [agent-evals](../../agent-evals/README.md) · [research S03E01](../agent-observability-evals/agent-observability-evals.research.md)
- Lekcje: [03_02_events](../../lessons/03_02_events/) · [03_03_calendar](../../lessons/03_03_calendar/) · [04_01_garden](../../lessons/04_01_garden/) · [02_04_ops](../../lessons/02_04_ops/)
- Transkrypt: `markdowns/s04e03-kontekstowa-wspolpraca-z-ai-1774999647.md`

*(Implementujący poprawi anchory nagłówków po wstawieniu §2.7.)*

### Uzupełnienie §2.6 — odniesienia (D2)

Na końcu bloku **Odniesienia** w §2.6 dodać link do §2.7 (jedna linia), np.:

`· [§2.7 Contextual collaboration (S04E03)](#27-contextual-collaboration-in-daily--business-workflows-s04e03)`

*(Anchor dopasować do faktycznego slug po D1.)*

### Sekcja `agent-evals/README.md` (D6 — szkic Opcji B)

Wstawić **przed** sekcją `## Tests` nową sekcję:

**Nagłówek:** `## System self-observation (S04E03)`

**Treść (~15–25 linii):**

- Lekcja S04E03: agenci mogą **audytować skuteczność całego systemu** (np. czy digest jest czytany, czy źródła RSS są żywe) — analogia do LLM-as-judge z S03E01.
- To **nie** jest hook w `createAgent` — to **osobny worker** (cron / heartbeat) wywołujący `createAgent` lub `chat()` z datasetem metryk.
- Użyj `@ai-devs/agent-evals` do offline oceny reguł audytu; Langfuse opcjonalnie do historii.
- **Antywzorzec:** samonadzór w każdej turze ReAct agenta produkcyjnego.
- Link: [§2.7 w boilerplate-documentation.md](../docs/boilerplate-documentation.md#27-contextual-collaboration-in-daily--business-workflows-s04e03).

**Przykład szkicowy (pseudo-flow, nie pełny kod):**

```text
1. Worker (cron) zbiera metryki: open_rate newslettera, lista źródeł HTTP 404.
2. Buduje user message z JSON metryk + krótką instrukcją audytu.
3. createAgent.processQuery(...) → rekomendacja: wyłącz proces / usuń źródło / eskaluj do człowieka.
4. Opcjonalnie: zapis case do Langfuse dataset + responseCorrectnessEvaluator offline.
```

---

## 5. Zmiany w README boilerplate (D3 — szkic)

### Quick decision guide — nowy wiersz

| Contextual work / background agents (calendar, mail, KPI, isolation) | [§2.7 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#27-contextual-collaboration-in-daily--business-workflows-s04e03) | Scheduler, SaaS integrations, subAgents API in boilerplate package |

*(Anchor dopasować do faktycznego slug nagłówka po D1.)*

**Nie** dodawać wiersza Related packages — brak `lessons/04_03_*` w repo.

---

## 6. CHANGELOG (D4 — szkic)

```markdown
- **S04E03 (contextual collaboration):** §2.7 in `tasks/docs/boilerplate-documentation.md` (background AI, SaaS integration patterns, agent isolation, system self-observation); README Quick decision row; `agent-evals/README.md` system self-observation section.
```

---

## 7. Kryteria akceptacji (Definition of Done)

- [x] W `tasks/docs/boilerplate-documentation.md` istnieje **`### 2.7.`** (S04E03) bezpośrednio pod §2.6
- [x] Sekcja: wstęp (≤5 zdań) + tabela **Wzorzec / Antywzorzec / Gdzie** (≥10 wierszy)
- [x] Tabela zawiera: AI w tle, SaaS, uprawnienia, powiadomienia, aktywne katalogi, metadata urządzenia, izolacja, komunikacja agentów, samonadzór, monitoring sygnału, epizod hub
- [x] Reguła kciuka (blok `text`) obecna
- [x] Brak obietnic: scheduler / webhook / integracje SaaS / subAgents w pakiecie
- [x] Brak wzmianek o homework **`domatowo`**
- [x] §2.6 odniesienia zawierają link do §2.7
- [x] Cross-linki §2.7 ↔ §2.1–§2.6, research, `agent-evals`, lekcje — działają z `tasks/docs/`
- [x] README boilerplate: **1 nowy wiersz** Quick decision
- [x] CHANGELOG (Unreleased) zaktualizowany
- [x] `agent-evals/README.md`: sekcja System self-observation (D6) z linkiem do §2.7
- [x] Research: status + link do planu
- [x] Review ręczny: §2.1–§2.7 czytelne w <8 min
- [x] `git diff` — zero plików w `tasks/boilerplate/src/` i `tasks/agent-evals/src/`

---

## 8. Plan zadań

| ID | Typ | Zadanie | Definition of done |
| --- | --- | --- | --- |
| D1 | [MODIFY] | Wstawić `### 2.7.` do `tasks/docs/boilerplate-documentation.md` między końcem §2.6 a `---` przed §3, według §4 planu | ✅ |
| D2 | [REUSE] | Cross-linki: §2.6 → §2.7; §2.7 → §2.1–§2.6, research, lekcje, agent-evals; poprawne anchory | ✅ |
| D3 | [MODIFY] | README boilerplate: 1 wiersz Quick decision (§5 planu) | ✅ |
| D4 | [MODIFY] | `CHANGELOG.md` — wpis docs S04E03 | ✅ |
| D5 | [MODIFY] | Research: status zaakceptowany + link do planu; po implementacji „zrealizowany” | ✅ |
| D6 | [MODIFY] | `tasks/agent-evals/README.md` — sekcja System self-observation (§4 planu) | ✅ |

**Kolejność:** D1 → D2 → D3 → D4 → D6 → D5.

**Bramki jakości:** `git diff` na plikach Markdown; klik 2–3 linków w IDE. Brak `bun test` / `tsc` (tylko docs).

---

## 9. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Duplikacja §2.2 / §2.5 / §2.6 w §2.7 | Cross-linki; §2.7 = mapa use-case + izolacja |
| Student buduje scheduler w `agent.ts` | Reguła kciuka + wiersz „AI w tle → orchestrator” |
| Mylenie samonadzoru z OM / Langfuse tracing | Osobny wiersz + D6 w agent-evals |
| Sugestia integracji Gmail/Slack w core | Jawny antywzorzec w tabeli |
| Lekcja scheduled 2026-04-01 | Docs bez zmian runtime |
| Nazwa `domatowo` w docs | Zakaz w DoD |
| §2.7 zbyt długa (katalog SaaS z lekcji) | Tabela wzorców, nie lista 30 usług |

---

## 10. Bezpieczeństwo

| Obszar | Uwaga |
| --- | --- |
| Docs | Nie sugerować agentów z pełnym dostępem do skrzynek / CRM w homework hub |
| Uprawnienia | Przypomnieć: scope w handlerze MCP + env, nie w prompcie |
| Samonadzór | Audyt nie powinien wysyłać PII do Langfuse bez polityki redakcji (link do agent-evals env) |

---

## 11. Testowanie

| Typ | Działanie |
| --- | --- |
| Automatyczne | Brak (tylko Markdown) |
| Manualne | Przejść linki z §2.7 do `03_02_events/`, `agent-evals`, §2.2 |
| Manualne | Sprawdzić spójność README Quick decision z §2.7 |
| Manualne | Przeczytać sekcję D6 w agent-evals — czytelna bez research |
| Regresja | `git diff` — zero plików w `tasks/boilerplate/src/` i `tasks/agent-evals/src/` |

---

## 12. Human gate

**Przed implementacją:** akceptacja tego planu (scope = D1–D6, docs-only, osobny MR).

**Po implementacji:** krótki review diff — czy §2.1–§2.7 razem opisują linię kursu bez czytania research.

**Homework `domatowo` / `tasks/s04e03/`:** osobna akceptacja scope, gdy zechcesz implementować epizod.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-23 | Plan początkowy — Opcja A+B: §2.7, cross-linki, README (1 wiersz), CHANGELOG, agent-evals README; bez runtime; bez `domatowo` |
| 2026-06-23 | D1–D6 zrealizowane po akceptacji planu |
