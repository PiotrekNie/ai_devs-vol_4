# Plan wdrożenia — Aktywna współpraca z AI (S04E02) w dokumentacji boilerplate

**Normatywny research:** [s04e02-active-collaboration.research.md](s04e02-active-collaboration.research.md) — zaakceptowany; **Opcja A + B** (dokumentacja + krótki akapit §5.2.1).  
**Workspace:** `tasks/docs/boilerplate-documentation.md`, `tasks/boilerplate/README.md`, `tasks/boilerplate/CHANGELOG.md`  
**Status:** Zrealizowany (2026-06-17) — D1–D5.

**Decyzje (z research §6–§8):**

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Link do homework `windpower` w §2.6? | **Nie** — brak wzmianek o zadaniu |
| 2 | Wiersz w README „Active collaboration (S04E02)”? | **Tak (D3)** — Quick decision guide |
| 3 | `parallelToolCalls` w `createAgent`? | **Defer** — poza planem |
| 4 | Duplikować MCP Apps / skills z §2.4–§2.5? | **Nie** — cross-linki w §2.6 i odniesieniach |
| 5 | `lessons/04_02_*`? | **Poza scope** — brak demo w repo |
| 6 | Opcja B (async orchestration w §5)? | **Tak (D2b)** — 1 akapit pod §5.2.1, bez `windpower` |
| 7 | Nowy README lekcji? | **Nie** — brak `lessons/04_02_*` (odróżnienie od S04E01 D6) |

**Uwaga numeracji:** W `boilerplate-documentation.md` są §2.1–§2.5. Nowa sekcja to **`### 2.6.`** — wstawiona **po** §2.5, **przed** `---` i §3 (Directory Tree).

**Weryfikacja UI:** brak.

---

## 1. Analiza stanu obecnego (Current Implementation Analysis)

| Element | Stan | Akcja w planie |
| --- | --- | --- |
| `tasks/docs/boilerplate-documentation.md` §2.1–§2.5 | **Istnieje** (S04E01 zrealizowany) | Dodać §2.6; uzupełnić odniesienia §2.5 → §2.6 |
| §2.6 Active collaboration | **Brak** | D1 |
| §5.2.1 akapit async orchestration | **Brak** | D2b |
| `tasks/boilerplate/README.md` — S04E02 | **Brak** wiersza | D3 (1 wiersz Quick decision) |
| `tasks/boilerplate/CHANGELOG.md` | Brak wpisu S04E02 | D4 |
| `tasks/boilerplate/src/` | Bez zmian | **Poza scope** |
| Research status | „oczekuje na akceptację” | D5 → zaakceptowany + link do planu |
| `lessons/04_02_*` | **Brak w repo** | Brak zadania README lekcji |

**Już pokryte przez runtime (bez kodu):** `createBoilerplateMcpServer`, `ask_human`, `processConversationTurn`, `enablePlanningPhase`, `toolDiscovery`, OM, Langfuse — opisać w §2.6 jako **wzorzec hub**, nie duplikować API.

---

## 2. Zakres (scope)

**W zakresie:**

| ID | Element | Opis |
| --- | --- | --- |
| D1 | `tasks/docs/boilerplate-documentation.md` | **`### 2.6. Active collaboration with AI (S04E02)`** — wstęp + tabela + reguła kciuka + odniesienia |
| D2 | Cross-linki | §2.5 odniesienia → §2.6; §2.6 → §2.1–§2.5; research S04E02; lekcje `03_02_events`, `03_05_apps`, `04_01_garden` |
| D2b | §5.2.1 uzupełnienie | 1 akapit (~3–5 zdań): orchestracja async / poll w **kodzie epizodu** zamiast ReAct — **bez** `windpower` |
| D3 | `tasks/boilerplate/README.md` | **1 nowy wiersz** Quick decision guide (S04E02) |
| D4 | `tasks/boilerplate/CHANGELOG.md` | Wpis docs-only S04E02 |
| D5 | Research | Status „plan zaakceptowany” / po implementacji „zrealizowany”, link do tego pliku |

**Poza zakresem (jawnie):**

- `tasks/boilerplate/src/`, testy, `package.json`, `config.ts`
- Chat UI, Slack/Telegram, skills loader, subagenci, meta-prompt engine w core
- MCP Sampling / MCP Apps w pakiecie
- `parallelToolCalls`, `@ai-devs/agent-host`
- Homework **`windpower`** / epizod `tasks/s04e02/`
- `lessons/04_02_*` (brak w repo)
- Nowe zależności npm
- Pełny port interfejsu współpracy do boilerplate

---

## 3. Decyzje projektowe

| # | Decyzja |
| --- | --- |
| 1 | Sekcja **normatywna, edukacyjna** — *kanał współpracy vs profil hub*, nie roadmapa produktowa |
| 2 | **Lokalizacja:** `### 2.6.` **zaraz po** §2.5, **przed** `---` i §3 |
| 3 | **Długość §2.6:** ~45–60 linii — wstęp + tabela (≥10 wierszy) + reguła kciuka + odniesienia |
| 4 | **Język:** polski — spójnie z §2.1–§2.5 |
| 5 | **Linki względne** od `tasks/docs/`: research S04E02, `lessons/03_02_events/`, `03_05_apps/`, `04_01_garden/`, research S03E03 |
| 6 | **Spójność:** §2.5 = wdrożenie / garden; §2.6 = **interfejs współpracy** (CLI, MCP host, custom UI) |
| 7 | **Skills / MCP Apps:** jeden wiersz + cross-link do §2.4 / §2.5 — **bez** powielania tabel |
| 8 | **Meta-prompty:** wiersz w tabeli + analogia `enablePlanningPhase` — **bez** sugestii modułu w pakiecie |
| 9 | **ACP:** jedna wzmianka we wstępie lub wiersz tabeli — bez implementacji |
| 10 | **README boilerplate:** max **1 wiersz** Quick decision (Related packages bez nowego wiersza — brak lekcji demo) |
| 11 | **Bramki jakości:** brak `bun test` / `tsc` (Markdown) |

---

## 4. Treść docelowa (szkic do wdrożenia)

Implementujący agent **nie kopiuje** research 1:1 — streszcza do tabeli poniżej.

### Wstęp (szkic)

> Lekcja S04E02 uczy **aktywnej współpracy z AI**: wybór kanału (CLI, MCP w kliencie, komunikator, dedykowany UI), ograniczenia hostów MCP oraz personalizacji po stronie **hosta aplikacji** (profile, skills, meta-prompty). Runtime boilerplate (`createAgent`, serwer MCP in-process, `ask_human`) **pozostaje bez zmian** dla typowych epizodów hub; pełna kontrola UX i multi-agent wymagają warstwy poza pakietem.

### Tabela wzorców vs antywzorców (docelowa)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Kanał dostarczenia (hub)** | MCP serwer epizodu + klient IDE (Cursor, Claude Code) | Klon ChatGPT / Slack w każdym `tasks/sXXeYY/` | `createBoilerplateMcpServer`; §2.6 |
| **CLI (dev)** | Agenci kodowania na maszynie użytkownika lub zdalnym sandboxie | `terminal` w default MCP pakietu | [§2.5](./boilerplate-documentation.md#25-production-deployments-s04e01); [04_01_garden](../../lessons/04_01_garden/) |
| **MCP jako integracja** | Wąskie narzędzia + JSON w odpowiedzi; logika w opisach MCP | Pełna aplikacja ukryta w jednym narzędziu | [§2.3](./boilerplate-documentation.md#23-tool-design--test-data-s03e04) |
| **Własny interfejs** | Gdy potrzebujesz uprawnień, statusu tła, UX potwierdzeń | Założenie, że MCP w Claude.ai zawsze wystarczy | aplikacja poza pakietem |
| **Ograniczenia hosta MCP** | Świadomość braku samplingu / słabej kontroli system prompt | MCP Sampling w default serwerze kursu | [research S03E03](../boilerplate/docs/specs/s03e03-contextual-feedback/s03e03-contextual-feedback.research.md); [§2.2](./boilerplate-documentation.md#22-contextual-feedback-s03e03) |
| **MCP Apps (postęp UI)** | Host z Apps + sync stanu | MCP Apps w `@ai-devs/agent-boilerplate` | [§2.4](./boilerplate-documentation.md#24-non-deterministic-models-as-advantage-s03e05); [03_05_apps](../../lessons/03_05_apps/) |
| **Komunikator (Slack itd.)** | Bot / webhook → ten sam agent backend | Pełny agent w boilerplate | epizod / osobna app |
| **Profile / subagenci / skills** | Host ładuje `SKILL.md`, subset narzędzi | Publiczne API skills w `createAgent` | [§2.5](./boilerplate-documentation.md#25-production-deployments-s04e01); [04_01_garden](../../lessons/04_01_garden/) |
| **Meta-prompty (produkt)** | Osobny flow onboardingowy; generowanie instrukcji z rozmowy | Meta-prompt engine w pakiecie | `enablePlanningPhase`; Cursor `@eversis-*` |
| **Multi-agent** | Orchestrator wywołuje workerów / wiele `processQuery` | Jeden ReAct „udaje zespół” | [03_02_events](../../lessons/03_02_events/) |
| **Sync z człowiekiem** | `ask_human`, krótka sesja hub | Blokada stdin jako substytut UI web | [`ask_human`](../boilerplate/src/tools/native/ask_human.ts) |
| **Mikro-akcja** | Skrypt + skrót gdy jeden krok | Agent na każdą transformację tekstu | poza repo kursu |
| **ACP** | Standard host↔agent (IDE) — świadomość rynku | Implementacja ACP w boilerplate | docs §2.6 |

### Reguła kciuka (szkic)

```text
Epizod hub (verify, krótka sesja) → default boilerplate + MCP dla klienta IDE.
Potrzebujesz kontroli UX, profili, statusu tła → własny host lub lekcja — nie rozszerzaj createAgent.
Chcesz meta-prompt produktowy → osobny prompt/flow — nie moduł w @ai-devs/agent-boilerplate.
Multi-agent / praca w tle → orchestrator poza pętlą ReAct (03_02_events) — nie agent.ts.
```

### Odniesienia (szkic)

- Research: [s04e02-active-collaboration.research.md](../s04e02-active-collaboration/s04e02-active-collaboration.research.md)
- Powiązane: [§2.1](./boilerplate-documentation.md#21-project-constraints-s03e02) · [§2.2](./boilerplate-documentation.md#22-contextual-feedback-s03e03) · [§2.3](./boilerplate-documentation.md#23-tool-design--test-data-s03e04) · [§2.4](./boilerplate-documentation.md#24-non-deterministic-models-as-advantage-s03e05) · [§2.5](./boilerplate-documentation.md#25-production-deployments-s04e01) · [§5.2.1](./boilerplate-documentation.md#521-code-mode--wykonanie-kodu-poza-pakietem)
- Lekcje: [03_02_events](../../lessons/03_02_events/) · [03_05_apps](../../lessons/03_05_apps/) · [04_01_garden](../../lessons/04_01_garden/)
- Transkrypt: `markdowns/s04e02-aktywna-wspolpraca-z-ai-1774908365.md`

*(Implementujący poprawi anchory nagłówków po wstawieniu §2.6.)*

### Uzupełnienie §2.5 — odniesienia (D2)

Na końcu bloku **Odniesienia** w §2.5 dodać link do §2.6 (jedna linia), np.:

`· [§2.6 Active collaboration (S04E02)](#26-active-collaboration-with-ai-s04e02)`

*(Anchor dopasować do faktycznego slug po D1.)*

### Akapit §5.2.1 (D2b — szkic)

Po istniejącym akapicie o Daytonie / §2.5, dodać **1 akapit**:

> Gdy API zadania jest **asynchroniczne** (kolejka + poll, wiele równoległych requestów), preferuj **deterministyczną orchestrację w TypeScript** w entrypoincie epizodu lub code mode w lekcji — zamiast wielu tur ReAct czekających na LLM. Pakiet `@ai-devs/agent-boilerplate` **nie** wykonuje narzędzi równolegle w jednej turze modelu; to nie blokuje równoległości w kodzie epizodu poza pętlą agenta.

**Bez** nazwy `windpower` i bez przykładu API.

---

## 5. Zmiany w README boilerplate (D3 — szkic)

### Quick decision guide — nowy wiersz

| Active collaboration / interface choice (CLI, MCP host, custom UI) | [§2.6 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#26-active-collaboration-with-ai-s04e02) | Chat UI, Slack bot, skills loader in boilerplate package |

*(Anchor dopasować do faktycznego slug nagłówka po D1.)*

**Nie** dodawać wiersza Related packages — brak `lessons/04_02_*` w repo.

---

## 6. CHANGELOG (D4 — szkic)

```markdown
### Documentation

- **S04E02 (active collaboration):** §2.6 in `tasks/docs/boilerplate-documentation.md` — interface channels (CLI/MCP/messenger/custom), MCP host limits, meta-prompts pattern, multi-agent outside ReAct; §5.2.1 async orchestration note; README Quick decision row.
```

---

## 7. Kryteria akceptacji (Definition of Done)

- [x] W `tasks/docs/boilerplate-documentation.md` istnieje **`### 2.6.`** (S04E02) bezpośrednio pod §2.5
- [x] Sekcja: wstęp (≤5 zdań) + tabela **Wzorzec / Antywzorzec / Gdzie** (≥10 wierszy)
- [x] Tabela zawiera: kanały, MCP host limits, skills (cross-link §2.5), meta-prompty, multi-agent, MCP Apps (cross-link §2.4), mikro-akcje, ACP (wzmianka)
- [x] Reguła kciuka (blok `text`) obecna
- [x] Brak obietnic: chat UI / Slack / skills loader / meta-prompt engine w pakiecie
- [x] Brak wzmianek o homework **`windpower`**
- [x] §2.5 odniesienia zawierają link do §2.6
- [x] §5.2.1: akapit async orchestration (D2b)
- [x] Cross-linki §2.6 ↔ §2.1–§2.5 i research — działają z `tasks/docs/`
- [x] README boilerplate: **1 nowy wiersz** Quick decision
- [x] CHANGELOG zaktualizowany
- [x] Research: status + link do planu
- [x] Review ręczny: §2.1–§2.6 czytelne w <6 min
- [x] `git diff` — zero plików w `tasks/boilerplate/src/`

---

## 8. Plan zadań

| ID | Typ | Zadanie | Definition of done |
| --- | --- | --- | --- |
| D1 | [MODIFY] | Wstawić `### 2.6.` do `tasks/docs/boilerplate-documentation.md` między końcem §2.5 a `---` przed §3, według §4 planu | ✅ |
| D2 | [REUSE] | Cross-linki: §2.5 → §2.6; §2.6 → §2.1–§2.5, research, lekcje; poprawne anchory | ✅ |
| D2b | [MODIFY] | Akapit async orchestration pod §5.2.1 (§4 planu) | ✅ |
| D3 | [MODIFY] | README boilerplate: 1 wiersz Quick decision (§5 planu) | ✅ |
| D4 | [MODIFY] | `CHANGELOG.md` — wpis docs S04E02 | ✅ |
| D5 | [MODIFY] | Research: status zaakceptowany + link do planu; po implementacji „zrealizowany” | ✅ |

**Kolejność:** D1 → D2 → D2b → D3 → D4 → D5.

**Bramki jakości:** `git diff` na plikach Markdown; klik 2–3 linków w IDE. Brak `bun test` / `tsc`.

---

## 9. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Duplikacja §2.4 / §2.5 w §2.6 | Cross-linki zamiast pełnych tabel skills/MCP Apps |
| Student buduje chat UI w epizodzie hub | Reguła kciuka + wiersz „kanał hub = MCP + IDE” |
| Mylenie meta-prompt z `enablePlanningPhase` | Osobny wiersz: produkt vs turn 0 hub |
| Sugestia Slack w core | Jawny antywzorzec w tabeli |
| Lekcja scheduled 2026-03-31 | Docs bez zmian runtime; aktualizacja gdy pojawi `lessons/04_02_*` |
| Akapit §5.2.1 sugeruje `windpower` | Zakaz nazwy zadania w D2b DoD |

---

## 10. Bezpieczeństwo

| Obszar | Uwaga |
| --- | --- |
| Docs | Nie sugerować integracji komunikatorów z uprawnieniami admin w homework hub |
| MCP host | Przypomnieć: auth/uprawnienia w backend epizodu, nie w boilerplate |
| Meta-prompty | Nie zachęcać do generowania promptów z danymi PII bez redakcji |

---

## 11. Testowanie

| Typ | Działanie |
| --- | --- |
| Automatyczne | Brak (tylko Markdown) |
| Manualne | Przejść linki z §2.6 do `03_02_events/`, research S03E03, §2.5 |
| Manualne | Sprawdzić spójność README Quick decision z §2.6 |
| Regresja | `git diff` — zero plików w `tasks/boilerplate/src/` |

---

## 12. Human gate

**Przed implementacją:** akceptacja tego planu (scope = D1–D5, docs-only).

**Po implementacji:** krótki review diff — czy §2.1–§2.6 razem opisują linię kursu bez czytania research.

**Homework `windpower` / `tasks/s04e02/`:** osobna akceptacja scope, gdy zechcesz implementować epizod.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-17 | Plan początkowy — Opcja A+B: §2.6, cross-linki, §5.2.1 akapit, README (1 wiersz), CHANGELOG; bez runtime; bez `windpower` |
| 2026-06-17 | D1–D5 zrealizowane po akceptacji planu |
