# S01E01 — LLM interaction foundations + `chatStructured` — Implementation Plan

## Task Details

| Field | Value |
| --- | --- |
| Jira ID | — (kurs AI Devs 4, bez Jiry) |
| Title | S01E01 — mapowanie lekcji na boilerplate + Structured Outputs helper |
| Description | Faza docs (§2.0 w spec) + opcjonalna implementacja `chatStructured` wg research §11 |
| Priority | Normal — docs-first, kod w drugiej fazie tego samego planu |
| Related Research | [s01e01-llm-interaction.research.md](s01e01-llm-interaction.research.md) |

**Status:** Zrealizowany (2026-06-29).

**Poza zakresem (jawnie):**

- Zadanie domowe `people` / epizod `tasks/s01e01/`
- Migracja `tasks/shared/jobTagging.ts` z AI SDK (follow-up opcjonalny)
- Streaming, semantic events, multi-agent DB, `withTracingStructuredAdapter` (faza 1.1)
- Zmiany w `createAgent` / ReAct loop
- Nowe zależności npm (AI SDK, Instructor)
- Homework hub, nowe MCP tools

---

## Wildly Important Goal

**Goal**: Uczestnik kursu wie, **kiedy używać boilerplate ReAct, a kiedy Structured Outputs poza agentem** — i ma gotowy, przetestowany helper `chatStructured` w pakiecie, gdy pipeline wymaga typed JSON bez function calling.

**Success Measure**: (1) W `boilerplate-documentation.md` istnieje §2.0 z tabelą wzorców S01E01; (2) `chatStructured` jest eksportowany, pokryty testami mock API, udokumentowany w README/CHANGELOG; (3) `bun test` i `bunx tsc --noEmit` w `tasks/boilerplate/` przechodzą; (4) code review PASS.

**Do NOT touch / do NOT add**: `createAgent` behaviour, homework `people`, AI SDK dependency, streaming UI, Anthropic/Gemini structured endpoints, auto-repair loop on Zod failure.

---

## Proposed Solution

Plan dwufazowy w **jednym streamie implementacji** (możliwe **dwa osobne MR** na GitLab: MR A = Phase 1, MR B = Phase 2).

```text
Phase 1 (docs)     → §2.0 + README row + research link
Phase 2 (runtime)  → structured.ts + tests + exports + docs
Phase 3 (gate)     → Code Reviewer
```

**Dlaczego §2.0, nie §2.6:** W `boilerplate-documentation.md` numeracja §2.1–§2.8 jest zajęta (S03–S04). S01E01 to fundament — wstawiamy **`### 2.0. LLM interaction foundations (S01E01)`** zaraz po liście 4 punktów architektury (przed §2.1).

**Dlaczego osobny plik `structured.ts`:** Zachować `ai.ts` jako ReAct adapter; structured output to inny kontrakt HTTP (pole `text.format`, brak `tools`). Reuse: `fetchWithRetry`, `extractResponseText`, `parseTokenUsage` z `ai.ts` (eksport wewnętrzny lub import z modułu — implementujący decyduje, preferowane **import funkcji już eksportowanych** + ewentualnie wyeksportować `extractResponseText` jako internal jeśli potrzeba).

Normatywny kontrakt API: **research §11** — nie duplikować w planie poza sygnaturami.

---

## Current Implementation Analysis

### Already Implemented

- `fetchWithRetry`, `chat`, `createAIAdapter` — `tasks/boilerplate/src/agent/ai.ts`
- `TokenUsage`, `ModelResponse` — `tasks/boilerplate/src/types/index.ts`
- Wzorzec testów mock fetch — `tasks/boilerplate/src/agent/ai.test.ts`
- Sekcje lekcji S03–S04 w spec — `tasks/docs/boilerplate-documentation.md` §2.1–§2.8
- Feature catalog README — `tasks/boilerplate/README.md`
- Precedens docs-only plan — `s03e02-model-constraints.plan.md`

### To Be Modified

- `tasks/docs/boilerplate-documentation.md` — insert §2.0
- `tasks/boilerplate/README.md` — wiersz w Feature catalog (LLM adapter)
- `tasks/boilerplate/index.ts` — eksporty structured
- `tasks/boilerplate/CHANGELOG.md` — wpis pod minor feature
- `tasks/boilerplate/docs/specs/s01e01-llm-interaction/s01e01-llm-interaction.research.md` — status + link do planu

### To Be Created

- `tasks/boilerplate/src/agent/structured.ts` — `chatStructured`, adapter, converter, errors
- `tasks/boilerplate/src/agent/structured.test.ts` — unit tests (mock fetch)
- Opcjonalnie: krótki przykład w README (snippet, nie pełny epizod)

---

## Open Questions

| # | Question | Answer | Status |
| --- | --- | --- | --- |
| 1 | Czy Phase 1 (docs) przed Phase 2 (kod)? | Tak — najpierw §2.0, potem `chatStructured` | ✅ Resolved |
| 2 | Czy implementować `chatStructured` w tym planie? | Tak — Phase 2; kontrakt wg research §11 | ✅ Resolved |
| 3 | Czy migrować `tasks/shared/jobTagging.ts`? | Nie — osobny MR epizodu (Improvements) | ✅ Resolved |
| 4 | Numer sekcji w spec? | **§2.0** (S01 fundament przed S03) | ✅ Resolved |
| 5 | `withTracingStructuredAdapter` w v1? | Nie — Improvements / faza 1.1 | ✅ Resolved |

---

## Technical Context

### Project Instructions

- `.cursor/rules/eversis-project-stack.mdc` — Bun, TypeScript strict, Zod, prompty w `.md`
- `.cursor/rules/eversis-agent-core.mdc` — brak nowych deps bez zgody; scope planu
- `tasks/docs/boilerplate-documentation.md` — normatywna spec; README = nawigacja

### Architecture & Patterns

- Pakiet: `tasks/boilerplate/` (`@ai-devs/agent-boilerplate`)
- Provider: OpenAI **Responses API** via `RESPONSES_API_ENDPOINT` + `tasks/config.js`
- Structured call: **bez** `tools`; body z `text.format.type = "json_schema"`
- ReAct: **bez zmian** — `createAgent` + function calling

### Tech Stack

- Runtime: **Bun**
- Language: TypeScript (`noEmit: true`)
- Validation: **Zod** (już w pakiecie)
- Test: `bun test` (Bun built-in)

### Code Style & Standards

- ESM imports z `.js` suffix
- Eksport publiczny przez `index.ts`
- Błędy: klasy dziedziczące po `StructuredOutputError` (research §11.10)
- Komentarze JSDoc na public API (jak `chat()`)

### Testing Patterns

- Mock `globalThis.fetch` jak w `ai.test.ts`; `retryDelayBaseMs: 0`
- Brak live API w CI
- Komendy z `tasks/boilerplate/`:
  - `bun test`
  - `bunx tsc --noEmit`

### Additional Context

- OpenAI strict schema: `additionalProperties: false` na object roots — converter musi to ustawiać
- `schemaName` regex: `[a-zA-Z0-9_-]{1,64}`
- Zod converter v1: object, array, string, number, boolean, enum, optional, `.describe()` — reszta → wymusza `params.jsonSchema`

---

## Implementation Plan

### Phase 1: Documentation — S01E01 foundations (MR A)

**Goal**: Student i implementor widzą w spec, co z lekcji S01 należy do boilerplate, a co do epizodu/pipeline.

**Description**: Docs-only. Wstaw §2.0 z tabelą wzorców, regułą kciuka i linkiem do research. Uzupełnij README feature catalog jednym wierszem o `chatStructured` (Phase 2 — można dodać w Phase 1 jako „planned” lub dopiero w Phase 2; **preferowane: wiersz w Phase 2** po implementacji).

**Verification:** Podgląd Markdown + linki względne (brak `bun test` dla samego §2.0).

#### Task 1.1 — [MODIFY] §2.0 w `boilerplate-documentation.md`

**Description**: Dodać **`### 2.0. LLM interaction foundations (S01E01)`** między listą 4 punktów architektury (koniec §2 intro) a **`### 2.1. Project constraints (S03E02)`**.

**Files:** `tasks/docs/boilerplate-documentation.md` (modify)

**Treść docelowa (szkic — implementujący streszcza z research §2, nie kopiuje 1:1):**

- Wstęp (≤3 zdania): kod steruje kontekstem; boilerplate = ReAct + MCP; Structured Outputs = pipeline poza pętlą.
- Tabela ≥10 wierszy: Obszar | Wzorzec | Antywzorzec | Gdzie w repo

| Obszar (min. wiersze) | Przykład wzorca |
| --- | --- |
| Sterowanie kontekstem | Wieloetapowe zapytania w kodzie epizodu |
| ReAct vs pipeline | `createAgent` vs `chatStructured` |
| Structured Outputs | Zod + strict json_schema |
| Function calling | MCP + native tools |
| Multi-model | `AGENT_MODEL`, `OM_MODEL`, osobne adaptery |
| Prompty | pliki `src/prompts/*.md` |
| Batch / równoległość | `Promise.all` w epizodzie, nie w core |
| UI / events | poza pakietem |
| Evals | `agent-evals`, Promptfoo w lekcjach |
| Homework hub | `http_request`, `submit_to_hub` |

- Reguła kciuka (blok `text`):

```text
Agent hub (ReAct, narzędzia) → default boilerplate.
Klasyfikacja / ekstrakcja JSON (bez narzędzi) → chatStructured lub kod epizodu.
UI, streaming, multi-agent DB → aplikacja / lekcje — nie pakiet kursowy.
```

- Odniesienia: link do [s01e01-llm-interaction.research.md](../../boilerplate/docs/specs/s01e01-llm-interaction/s01e01-llm-interaction.research.md)

**Definition of Done**:

- [ ] Sekcja `### 2.0. LLM interaction foundations (S01E01)` istnieje przed §2.1
- [ ] Tabela ma kolumny Wzorzec / Antywzorzec / Gdzie w repo (≥10 wierszy)
- [ ] Brak obietnic feature’ów poza zakresem planu (streaming, multi-agent core)
- [ ] Link do research działa względem `tasks/docs/`

**Clues**: Wzór formatu — §2.1 S03E02 w tym samym pliku.

#### Task 1.2 — [MODIFY] Status research

**Description**: Zaktualizować research: status planu, checkbox akceptacji researchu, link do tego pliku.

**Files:** `tasks/boilerplate/docs/specs/s01e01-llm-interaction/s01e01-llm-interaction.research.md` (modify)

**Definition of Done**:

- [ ] Sekcja 8: checkbox akceptacji researchu `[x]`
- [ ] Sekcja 9 / nagłówek: link do `s01e01-llm-interaction.plan.md` + status „plan approved — pending implementation”

---

### Phase 2: Runtime — `chatStructured` (MR B)

**Goal**: Pakiet eksponuje typed Structured Outputs poza ReAct, zgodnie z research §11.

**Description**: Nowy moduł `structured.ts`, testy, eksporty, dokumentacja. Reuse retry i parsowania z `ai.ts`. **Nie** modyfikować semantyki `createAgent`.

**Verification:** `cd tasks/boilerplate && bun test && bunx tsc --noEmit`

#### Task 2.1 — [CREATE] Moduł `structured.ts`

**Description**: Implementacja API wg research §11.1–§11.10.

**Files:** `tasks/boilerplate/src/agent/structured.ts` (create)

**Kontrakt (sygnatury — pełna spec w research §11):**

```typescript
export type ChatStructuredParams<T> = { model; schema; schemaName; input?; instructions?; ... };
export type ChatStructuredOptions = { retryDelayBaseMs?; maxOutputTokens?; tracingMetadata?; includeRawText? };
export type ChatStructuredResult<T> = { data: T; usage?; rawText? };

export interface StructuredAIAdapter {
  generateObject<T>(params: Omit<ChatStructuredParams<T>, "model">, options?): Promise<ChatStructuredResult<T>>;
}

export function chatStructured<T>(params, options?): Promise<ChatStructuredResult<T>>;
export function createStructuredAIAdapter(cfg): StructuredAIAdapter;
export function zodToOpenAiJsonSchema(schema, options?): OpenAiJsonSchema;

export class StructuredOutputError extends Error { ... }
export class StructuredOutputApiError extends StructuredOutputError { ... }
export class StructuredOutputParseError extends StructuredOutputError { ... }
export class StructuredOutputValidationError extends StructuredOutputError { ... }
```

**Definition of Done**:

- [ ] POST body zawiera `text.format` json_schema + `strict` (default true), **bez** `tools`
- [ ] Używa `fetchWithRetry` + nagłówki jak `chat()`
- [ ] Po odpowiedzi: parse JSON → `schema.safeParse` → `{ data, usage }`
- [ ] `jsonSchema` override działa gdy converter Zod niewspierany
- [ ] Walidacja `schemaName` przed fetch

**Stop Rule:** Jeśli Responses API odrzuca schema testowa — użyć minimalnego fixture schema z testów; nie rozszerzać convertera poza v1 bez aktualizacji planu.

**Clues:** `extractResponseText` z `ai.ts` — wyeksportować lub skopiować minimalnie (preferuj **DRY**: export internal helper z `ai.ts` tylko jeśli nie psuje surface).

#### Task 2.2 — [CREATE] Testy `structured.test.ts`

**Description**: Scenariusze z research §11.15.

**Files:** `tasks/boilerplate/src/agent/structured.test.ts` (create)

**Definition of Done**:

- [ ] Test: valid JSON + Zod match → `data` populated
- [ ] Test: invalid JSON → `StructuredOutputParseError`
- [ ] Test: JSON + Zod fail → `StructuredOutputValidationError` z `parsed`
- [ ] Test: 503 retry then success (mock fetch count)
- [ ] Test: body zawiera `"type":"json_schema"` i `"strict":true`
- [ ] Test: invalid `schemaName` → error before fetch
- [ ] Run `cd tasks/boilerplate && bun test`

#### Task 2.3 — [MODIFY] Eksporty publiczne

**Description**: Dodać eksporty z `index.ts` (jak `chat`, `createAIAdapter`).

**Files:** `tasks/boilerplate/index.ts` (modify)

**Definition of Done**:

- [ ] `chatStructured`, `createStructuredAIAdapter`, `zodToOpenAiJsonSchema`, klasy błędów eksportowane
- [ ] Typy `ChatStructuredParams`, `ChatStructuredOptions`, `ChatStructuredResult`, `StructuredAIAdapter` eksportowane
- [ ] Run `cd tasks/boilerplate && bunx tsc --noEmit`

#### Task 2.4 — [MODIFY] README + CHANGELOG + Feature catalog

**Description**: Dokumentacja użytkowa — kiedy `chatStructured` vs `createAgent`; snippet batch (research §11.13, bez logiki `people`).

**Files:**

- `tasks/boilerplate/README.md` (modify) — sekcja LLM adapter + tabela Feature catalog
- `tasks/boilerplate/CHANGELOG.md` (modify) — wpis Added
- `tasks/docs/boilerplate-documentation.md` (modify) — w §2.0 jedna linia „`chatStructured` — patrz README § …” po Phase 2

**Definition of Done**:

- [ ] README opisuje: brak narzędzi, strict JSON, Zod validation, link do research §11
- [ ] Feature catalog: wiersz `chatStructured` | opt-in / export | pipeline, klasyfikacja
- [ ] CHANGELOG wpis z datą i breaking: **none** (additive)
- [ ] §2.0 wzmianka o `chatStructured` (1 zdanie + link README)

#### Task 2.5 — [MODIFY] Cross-link §2.0 ↔ inne sekcje

**Description**: W §2.0 dodać odniesienia do §2.1 (constraints), §2.3 (tool design / `.describe()`), README OM — bez duplikacji treści.

**Files:** `tasks/docs/boilerplate-documentation.md` (modify — created in Task 1.1)

**Definition of Done**:

- [ ] §2.0 zawiera linię „Patrz też: §2.1, §2.3” z linkami względnymi
- [ ] Brak sprzeczności z „nie rozszerzaj core o UI/events”

---

### Phase 3: Code Review

**Goal**: Zweryfikować jakość całości (docs + runtime) przed zamknięciem planu.

**Description**: Delegacja do Code Reviewer via `eversis-review.md`. E2E poza scope — brak UI.

**Verification:** `cd tasks/boilerplate && bun test && bunx tsc --noEmit`

#### Task 3.1 — [REUSE] Code review by Code Reviewer

**Description**: Review diff Phase 1 + Phase 2. Struktura PASS / BLOCKER / SUGGESTION.

**Files:** wszystkie zmienione w Phase 1–2 (reuse)

**Definition of Done**:

- [ ] Run `cd tasks/boilerplate && bun test && bunx tsc --noEmit`
- [ ] Code review PASS (no blockers) lub potwierdzone poprawki + re-review
- [ ] Wynik review wpisany w Changelog tego planu

---

## Security Considerations

- **Brak sekretów w schema/promptach** — structured calls jak zwykłe LLM; klucz tylko z env (`AI_API_KEY`)
- **Walidacja Zod po parse** — nie ufaj modelowi poza strict API; logi `rawText` tylko opt-in (`includeRawText`)
- **Truncation / size** — brak automatycznego truncate w v1; epizod ogranicza rozmiar `input` (jak w lekcji grounding)
- **Prompt injection** — poza scope; §2.0 może wskazać §2.1 S03E02 dla agentów

---

## Quality Assurance

- [x] §2.0 czytelny w <2 min; tabela wzorców kompletna
- [x] `chatStructured` zgodny z research §11 (sygnatury + błędy)
- [x] `bun test` i `bunx tsc --noEmit` green w `tasks/boilerplate/`
- [x] `createAgent` bez regresji (istniejące `agent.test.ts` green)
- [x] Brak nowych dependencies w `package.json`
- [x] Homework `people` **nie** w diffie tego planu
- [x] README + CHANGELOG spójne z eksportami `index.ts`

---

## Improvements (Out of Scope)

- `withTracingStructuredAdapter` — Langfuse dla structured calls (research §11.12)
- Migracja `tasks/shared/jobTagging.ts` z AI SDK na `chatStructured`
- Epizod `tasks/s01e01/` (homework)
- Pełny Zod→JSON converter (union, refine, recursive)
- Anthropic / Gemini structured output endpoints
- Auto-repair: re-prompt po `StructuredOutputValidationError`
- Eksport przykładu `examples/structured-batch.ts` w pakiecie

---

## Changelog

| Date | Change Description |
| --- | --- |
| 2026-06-29 | Initial plan created (Phase 1 docs + Phase 2 `chatStructured` + review gate) |
| 2026-06-29 | Implemented: §2.0, structured.ts, tests, README/CHANGELOG exports |
