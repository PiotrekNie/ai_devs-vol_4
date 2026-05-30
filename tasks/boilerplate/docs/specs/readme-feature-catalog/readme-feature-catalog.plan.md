# Plan wdrożenia — Feature catalog w README boilerplate

**Normatywny research:** [readme-feature-catalog.research.md](readme-feature-catalog.research.md) — **zaakceptowany** (2026-05-30).  
**Workspace:** `tasks/boilerplate/README.md`  
**Powiązane:** [sandbox-code-execution.plan.md](../sandbox-code-execution/sandbox-code-execution.plan.md), [tool-discovery.plan.md](../tool-discovery/tool-discovery.plan.md), [agent-observability-evals.plan.md](../agent-observability-evals/agent-observability-evals.plan.md).

Ten dokument jest planem wdrożenia zgodnym z `@eversis-implement`: typy zadań `[CREATE]` / `[MODIFY]` / `[REUSE]`. **Implementacja:** 2026-05-30 (Fine).

**Weryfikacja UI:** brak — zmiany dotyczą wyłącznie Markdown.

**Poza zakresem:**

- Zmiany w kodzie runtime (`src/`, `index.ts`, narzędzia).
- Nowe zależności npm.
- Rozbudowa `tasks/docs/boilerplate-documentation.md` (opcjonalna w przyszłości; ten plan = README only).
- Mini-TOC na górze README.
- Pełny opis API `tasks/shared/` — tylko wzmianka + link.

---

## 1. Zakres (scope)

| Element | Opis |
| --- | --- |
| **README** | Nowa sekcja `## Feature catalog` po Quick Start, przed `## Code mode / sandbox`. |
| **Research** | Status planu + link zwrotny. |
| **CHANGELOG** | Wpis [Unreleased] → Documentation (feature catalog). |

**Już zrobione (przed planem):**

- [x] Research + inwentarz funkcji (§3 research).
- [x] Decyzje produktowe: EN, pozycja sekcji, shared = wzmianka, bez mini-TOC.

---

## 2. Decyzje projektowe (zatwierdzone)

| # | Decyzja |
| --- | --- |
| 1 | Język sekcji: **EN** (jak reszta README). |
| 2 | Umiejscowienie: **po całej sekcji Quick Start** (linia ~184, przed Code mode). |
| 3 | **`tasks/shared/`** — jedna linia w „Related packages”, link `../../shared/`. |
| 4 | **Bez mini-TOC** — nawigacja: outline IDE/GitHub + Feature catalog + anchor linki wewnątrz sekcji. |
| 5 | Sekcje szczegółowe (OM, Observability, Planning, Discovery) **zostają** — katalog linkuje, nie duplikuje długich przykładów kodu. |
| 6 | Legenda w katalogu: kolumna **Availability** = `default` \| `opt-in` \| `separate package` \| `lesson only`. |

---

## 3. Analiza stanu obecnego (gap)

| Komponent | Stan | Gap |
| --- | --- | --- |
| `README.md` | Quick Start + rozproszone sekcje tematyczne | Brak jednej „mapy” wszystkich funkcji i macierzy decyzyjnej |
| `ask_human` | Zaimplementowane, eksportowane z `index.ts` | Nie wymienione obok `finish_task` w nawigacji decyzyjnej |
| OM vs Langfuse | Rozdzielone w README, ale daleko od siebie | Katalog musi mieć jeden wiersz każdy + „do not confuse” |
| `agent-evals` | Wzmianka w Observability | Brak w jednej tabeli „related packages” |
| CHANGELOG | Brak wpisu o feature catalog | Dodać pod Documentation |

---

## 4. Docelowa struktura sekcji `## Feature catalog`

Kolejność podsekcji (`###`) w README:

```text
## Feature catalog
  Intro (1–2 zdania: skanuj tabele, szczegóły w sekcjach poniżej + boilerplate-documentation.md)

  ### Core runtime (always on with createAgent)
  Tabela: Feature | Description | Availability | When to use | Details

  ### LLM adapter
  Tabela (A1–A5 skrót)

  ### Tools
  Tabela: Name | Type (MCP/Native/Meta) | Description | Availability | When to use
  — 4 MCP + finish_task + ask_human + 3 meta (note: meta only with toolDiscovery)

  ### createAgent options
  Tabela: Option | Description | Default | When to enable | See also (anchor)

  ### Opt-in extensions (summary)
  Krótkie akapity + linki anchor:
  - Planning phase → ### Planning phase (w Quick Start) lub pozostawić anchor w Quick Start
  - Tool discovery → ### Tool discovery
  - Observational Memory → ## Observational Memory (S02E05)
  - Langfuse tracing → ## Observability — Langfuse tracing
  - Custom MemoryHooks → ## MemoryHooks

  ### Related packages (not in @ai-devs/agent-boilerplate)
  Tabela: Package | Purpose | When
  - @ai-devs/agent-evals → link ../agent-evals/README.md
  - tasks/shared → link ../../shared/ (one line)
  - Code execution → link ## Code mode / sandbox (lesson only)

  ### Quick decision guide
  Tabela z research §5 (8–9 wierszy) + thumb rule ≤5 turns / ≤4 tools
```

**Szacowana długość:** ~120–180 linii Markdown (tabele skondensowane; bez duplikacji bloków kodu z OM/Langfuse).

**Anchory GitHub:** nagłówki `###` w katalogu generują własne ID; linki „See also” używają istniejących `##` (np. `#observational-memory-s02e05`).

---

## 5. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| README zbyt długi | Tabele zamiast narracji; szczegóły tylko linkami |
| Katalog się dezaktualizuje przy nowej funkcji | CHANGELOG + punkt w planie: przy feature w [Unreleased] zaktualizuj Feature catalog |
| Mylenie OM / Observability / MemoryHooks | Osobne wiersze + jedno zdanie „OM compresses context; Langfuse records traces» |
| Duplikacja z Code mode | W Related packages odwołanie do istniejącej sekcji, nie powtórka tabeli 3 warstw |

---

## 6. Kryteria akceptacji (Definition of Done)

- [x] Sekcja `## Feature catalog` istnieje **po** Quick Start, **przed** Code mode.
- [x] Wszystkie pozycje z research §3.1–3.11 są reprezentowane (tabele lub wiersze w „Opt-in extensions»).
- [x] Kolumna / legenda **Availability** dla każdej grupy.
- [x] `ask_human` w tabeli Tools.
- [x] Macierz **Quick decision guide** (research §5).
- [x] `tasks/shared/` — wyłącznie wzmianka + link (bez listy plików/API).
- [x] Brak mini-TOC na górze pliku.
- [x] Linki względne działają: `boilerplate-documentation.md`, `CHANGELOG.md`, `agent-evals`, `docs/specs/*` (opcjonalnie 1–2 kluczowe specy).
- [x] CHANGELOG [Unreleased]: Documentation — Feature catalog in README.
- [x] Research §10: link do planu; status implementacji.

**Weryfikacja manualna (bez `bun test`):**

- Podgląd README w IDE — tabele renderują się poprawnie.
- Przejście po linkach anchor do OM / Observability / Code mode.

---

## 7. Fazy implementacji

### Faza A — Szkic treści `[CREATE]`

**Plik:** `tasks/boilerplate/README.md` (wstawka ~linia 184)

- [x] **A.1** `[CREATE]` Wstaw `## Feature catalog` + intro (2 zdania).
- [x] **A.2** `[CREATE]` `### Core runtime` — tabela 8 wierszy (R1–R8 z research).
- [x] **A.3** `[CREATE]` `### LLM adapter` — tabela 5 wierszy (skrót).
- [x] **A.4** `[CREATE]` `### Tools` — jedna tabela MCP + native + meta (availability dla meta: `opt-in (toolDiscovery)`).
- [x] **A.5** `[CREATE]` `### createAgent options` — tabela opcji z research §3.6.
- [x] **A.6** `[CREATE]` `### Opt-in extensions` — 5 bulletów z linkami anchor (bez kopiowania kodu).
- [x] **A.7** `[CREATE]` `### Related packages` — evals, shared (link only), code mode anchor.
- [x] **A.8** `[CREATE]` `### Quick decision guide` — tabela macierzy + thumb rule.

**Kontrola jakości po Fazie A:** przeczytaj całość vs research §7 (acceptance checklist).

---

### Faza B — Spójność i cross-linki `[MODIFY]`

- [x] **B.1** `[MODIFY]` W intro README — link „Capability map» do Feature catalog.
- [x] **B.2** `[MODIFY]` Code mode bez duplikacji macierzy (katalog linkuje do Code mode).
- [x] **B.3** `[MODIFY]` `readme-feature-catalog.research.md` — status Fine.

---

### Faza C — CHANGELOG i zamknięcie `[MODIFY]`

- [x] **C.1** `[MODIFY]` `CHANGELOG.md` — pod [Unreleased] → Documentation:

  ```text
  - **Feature catalog** — README section listing all boilerplate capabilities, tools, opt-in flags, and quick decision guide.
  ```

- [x] **C.2** `[REUSE]` Przegląd vs CHANGELOG [Unreleased] Added — OM, discovery, observability, planning w katalogu.

---

### Faza D — Review `[REUSE]`

- [x] **D.1** `[REUSE]` Self-review docs: kompletność vs research §3.
- [x] **D.2** Checkboxy §6 i §7 zaznaczone.

**Nie uruchamiać:** `bun test` / `tsc` — brak zmian TS.

---

## 8. Harmonogram zadań (checklist dla EM)

| ID | Zadanie | Typ | Status |
| --- | --- | --- | --- |
| A.1–A.8 | Wstawka Feature catalog | CREATE | [x] |
| B.1–B.3 | Cross-linki + research update | MODIFY | [x] |
| C.1–C.2 | CHANGELOG + spójność Unreleased | MODIFY | [x] |
| D.1–D.2 | Review docs | REUSE | [x] |

---

## 9. Changelog planu

| Data | Zmiana |
| --- | --- |
| 2026-05-30 | Utworzenie planu po zaakceptowanym research; decyzje: EN, po Quick Start, shared=wzmianka, bez mini-TOC. |
| 2026-05-30 | Implementacja Fine — README Feature catalog + CHANGELOG. |
