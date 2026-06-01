# Plan wdrożenia — Contextual feedback (S03E03) w boilerplate-documentation

**Normatywny research:** [s03e03-contextual-feedback.research.md](s03e03-contextual-feedback.research.md) — zaakceptowany werdykt: **docs only**, bez rozszerzenia runtime boilerplate.  
**Workspace:** `tasks/docs/boilerplate-documentation.md`  
**Status:** Zrealizowany (2026-05-31) — D1–D2.

**Decyzje product owner (2026-05-31):**

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Plan docs-only? | **Tak** |
| 2 | §2.2 w `boilerplate-documentation.md`? | **Tak** |
| 2b | Wiersz w `tasks/boilerplate/README.md`? | **Nie** |
| 3 | Pakiet `@ai-devs/agent-browser`? | **Nie** — wystarczą lekcje `lessons/03_03_*` |

**Weryfikacja UI:** brak.

---

## 1. Zakres (scope)

**W zakresie (jedyny deliverable):**

| Element | Opis |
| --- | --- |
| **`tasks/docs/boilerplate-documentation.md`** | Nowa sekcja **`### 2.2. Contextual feedback (S03E03)`** w §2 *Założenia Architektoniczne* — tabela wzorców vs antywzorców (triggery, metadata, hooki, proaktywność) |

**Poza zakresem (jawnie):**

- Zmiany w `@ai-devs/agent-boilerplate` (`src/`, testy, `config.ts`, `CHANGELOG.md`)
- **`tasks/boilerplate/README.md`** — brak nowego wiersza Feature catalog (decyzja: nie)
- Epizod `tasks/s03e03/` (`reactor`) — osobny wątek
- Pakiet `@ai-devs/agent-browser` — defer; materiał w `lessons/03_03_browser/`
- Scheduler (cron / webhook runner / heartbeat / `tasks.md`) w core
- Publiczne API hooków AI SDK (`beforeToolCall`, `onStepFinish`, …) w `createAgent`
- MCP Sampling bridge
- Aktualizacja research §10 — opcjonalnie po D2 (status „zamknięte”)

---

## 2. Decyzje projektowe

| # | Decyzja |
| --- | --- |
| 1 | Sekcja **normatywna, edukacyjna** — jak §2.1 (S03E02): *jak projektować epizody*, nie roadmapa kodu |
| 2 | **Lokalizacja:** `### 2.2. Contextual feedback (S03E03)` **zaraz po** §2.1, **przed** `---` i §3 (Directory Tree) |
| 3 | **Długość:** ~30–45 linii — wstęp (2–3 zdania) + tabela (≥8 wierszy) + reguła kciuka + odniesienia |
| 4 | **Język:** polski — spójnie z §2.1 |
| 5 | **Linki względne** od `tasks/docs/`: research S03E03, lekcje `lessons/03_03_{calendar,language,browser}/`, `lessons/03_02_events/` (heartbeat), epizody `s03e01` / `s03e02` (`*_memory.ts`) |
| 6 | **Spójność z §2.1:** nie powtarzać wierszy S03E02 (modele, code mode, prompt injection); S03E03 = **otoczenie, triggery, feedback kontekstowy** |
| 7 | **README:** bez zmian — studenci szukają wzorców S03E03 w specyfikacji §2.2 (jak S03E02 w §2.1) |
| 8 | **Browser:** jeden wiersz tabeli „lekcja `03_03_browser`, nie pakiet kursowy” — bez obietnicy `@ai-devs/agent-browser` |
| 9 | **Nowe zależności npm:** brak |

---

## 3. Treść docelowa (szkic do wdrożenia)

Implementujący agent **nie kopiuje** research 1:1 — streszcza do tabeli poniżej.

### Wstęp (szkic)

> Lekcja S03E03 uczy **integracji agenta z otoczeniem** i kontekstowego feedbacku (metadata, wzbogacanie wiadomości, triggery, proaktywność, hooki workflow). Boilerplate nadal dostarcza **ReAct + MCP**; orchestracja czasu (cron, heartbeat, `tasks.md`) i przeglądarka (Playwright) pozostają **poza** domyślnym pakietem. Poniższa tabela to ściąga przy epizodach w `tasks/sXXeYY/` oraz przy czytaniu demo w `lessons/03_03_*`.

### Tabela wzorców vs antywzorców (docelowa)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Stan otoczenia** | Blok `<metadata>` / JSON w **treści wiadomości użytkownika** budowany w kodzie (`run.ts`) | Model „zgaduje” czas, lokalizację lub pogodę z pamięci bez danych | [lessons/03_03_calendar](../../lessons/03_03_calendar/) — `buildMetadata` |
| **Wzbogacanie kontekstu** | Narzędzia MCP + jedna tura ReAct łącząca sygnały przed akcją | Osobny moduł „enricher” w boilerplate | ten sam demo calendar |
| **Triggery zewnętrzne** | Osobny entrypoint / skrypt wywołuje ten sam `createAgent` z opisem zadania NL | Cron, webhook, heartbeat w `agent.ts` | lekcja: [03_02_events](../../lessons/03_02_events/) |
| **Proaktywność / `tasks.md`** | Długa sesja: OM + orchestrator **poza** pętlą ReAct | Heartbeat i task graph w `@ai-devs/agent-boilerplate` | events + research S03E02 §2.3 |
| **Sesja** | `processConversationTurn` gdy wątek ma historię; nowe `processQuery` per izolowany trigger | Wszystkie zdarzenia w jednym przepełnionym kontekście | [`agent.ts`](../boilerplate/src/agent/agent.ts) |
| **Feedback po błędzie** | `MemoryHooks` + `injectWorkingPlan` po odpowiedzi hub / ban | Osobny runtime tylko po to | [`evaluation_memory.ts`](../s03e01/src/agent/evaluation_memory.ts), [`firmware_memory.ts`](../s03e02/src/agent/firmware_memory.ts) |
| **Człowiek w pętli** | `ask_human` gdy brak danych; bez limitu czasu (stdin) | Oczekiwanie timeoutu w core bez decyzji epizodu | [`ask_human.ts`](../boilerplate/src/tools/native/ask_human.ts) |
| **Hooki per tool / finish** | Wrapper na `handlers.execute` lub logika w **lekcji** / epizodzie | Publiczne `beforeToolCall` / `beforeFinish` w `createAgent` | [lessons/03_03_language](../../lessons/03_03_language/) — `hooks.ts` |
| **Warstwa pamięci** | `MemoryHooks` = **tura ReAct** (`beforeTurn` / `afterTurn`); OM opt-in | Mylenie z hookami AI SDK z lekcji language | [`memory.ts`](../boilerplate/src/agent/memory.ts) |
| **Przeglądarka** | Playwright i sesja w **lekcji**; homework hub zwykle HTTP + vision | `execute_code` / browser MCP w default install | [lessons/03_03_browser](../../lessons/03_03_browser/) |
| **Multi-model w toolu** | Drugi `chat()` / API w implementacji narzędzia MCP epizodu | MCP Sampling w boilerplate (rzadkie wsparcie klientów) | language — `listen` / `feedback` |
| **Homework hub (np. reactor)** | Pętla deterministyczna lub ReAct + `http_request`; metadata w prompt jeśli potrzeba | Scheduler, browser, coaching hooks z lekcji language | osobny epizod `tasks/s03e03/` (poza tym planem) |

### Reguła kciuka (szkic, pod tabelą)

```text
Homework hub (≤5 tur, HTTP/MCP) → default boilerplate + metadata w user message jeśli stan otoczenia jest znany z kodu.
Orchestracja czasu (cron, webhook runner, heartbeat, tasks.md) → lekcja 03_02_events lub aplikacja poza pakietem.
Hooki workflow (listen→feedback→save) → lekcja 03_03_language lub kod epizodu — nie nowe API w createAgent.
Browser / Playwright → lekcja 03_03_browser; pakiet monorepo tylko gdy ≥2 epizody w tasks/ tego wymagają (obecnie: nie).
```

### Odniesienia (szkic, pod regułą)

- Research: [s03e03-contextual-feedback.research.md](../boilerplate/docs/specs/s03e03-contextual-feedback/s03e03-contextual-feedback.research.md)
- Powiązane ograniczenia modeli: [§2.1 Project constraints (S03E02)](./boilerplate-documentation.md#21-project-constraints-s03e02)
- Demo lekcji: [03_03_calendar](../../lessons/03_03_calendar/) · [03_03_language](../../lessons/03_03_language/) · [03_03_browser](../../lessons/03_03_browser/)
- Heartbeat (kontekst): [03_02_events](../../lessons/03_02_events/)

*(Implementujący poprawi anchor §2.1 w linku oraz ścieżki względne w pliku docelowym.)*

---

## 4. Kryteria akceptacji (Definition of Done)

- [x] W `tasks/docs/boilerplate-documentation.md` istnieje **`### 2.2. Contextual feedback (S03E03)`** bezpośrednio pod §2.1
- [x] Sekcja zawiera wstęp (≤4 zdania) + tabelę **Wzorzec / Antywzorzec / Gdzie w repo** (≥10 wierszy merytorycznych)
- [x] Tabela zawiera wiersze: metadata, triggery/heartbeat, `MemoryHooks` vs hooki language, `ask_human`, browser = lekcja only
- [x] Reguła kciuka obecna (blok `text`)
- [x] Linki względne do `lessons/03_03_*` i research — działają z katalogu `tasks/docs/`
- [x] Brak sprzeczności z §2.1 (S03E02) i §5.2 / §5.2.1 (discovery, code mode)
- [x] Brak obietnic nowych feature’ów w boilerplate ani `@ai-devs/agent-browser`
- [x] **`tasks/boilerplate/README.md` niezmieniony** (brak diff w README)
- [x] Review ręczny: sekcja czytelna w <2 min obok §2.1

---

## 5. Plan zadań

Typy: `[CREATE]`, `[MODIFY]`, `[REUSE]`.

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| D1 | [MODIFY] | Wstawić `### 2.2. Contextual feedback (S03E03)` do `tasks/docs/boilerplate-documentation.md` między końcem §2.1 a `---` przed §3, według §3 tego planu | ✅ |
| D2 | [REUSE] | Spójność cross-linków: §2.1 ↔ §2.2, research S03E03, trzy lekcje `03_03_*`, `03_02_events`; brak martwych anchorów | ✅ |
| D3 | [MODIFY] | (Opcjonalnie) W research §10 dopisać rozstrzygnięte open questions + link do tego planu | ✅ |

**Kolejność:** D1 → D2 → D3 (D3 opcjonalne).

**Bramki jakości:** brak `bun test` / `tsc` (tylko Markdown). Weryfikacja: `git diff tasks/docs/boilerplate-documentation.md` + kliknięcie 2–3 linków w IDE.

---

## 6. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Duplikacja §2.1 (heartbeat, `ask_human`) | S03E03 = nowe wiersze (metadata, hooki tool-level, browser); heartbeat tylko odsyłka do events |
| Sekcja za długa | Limit ~45 linii; szczegóły w research |
| Linki do lekcji poza repo u ucznia | Ścieżki tylko do folderów obecnych w monorepo |
| Student szuka S03E03 w README | Akceptowane — świadoma decyzja; §2.2 w normatywnej specyfikacji |

---

## 7. Human gate

**Przed implementacją:** akceptacja tego planu (scope = wyłącznie §2.2 w `boilerplate-documentation.md`, bez README).

**Po implementacji:** krótki review diff — czy §2.2 + §2.1 razem dają pełny obraz S03 bez czytania research.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-05-31 | Plan początkowy — scope: §2.2 Contextual feedback (S03E03) only; README i browser package wyłączone |
| 2026-05-31 | D1–D2: sekcja §2.2 w `tasks/docs/boilerplate-documentation.md` |
