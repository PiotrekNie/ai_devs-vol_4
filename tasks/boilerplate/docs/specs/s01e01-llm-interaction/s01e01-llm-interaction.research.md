# S01E01 — programowanie interakcji z modelem językowym — research

**Task:** Analiza lekcji S01E01 pod kątem możliwości rozwinięcia `@ai-devs/agent-boilerplate` dla budowy rozbudowanych agentów AI — **w oderwaniu od zadania domowego `people`** (osobny MR / kod epizodu).

**Data:** 2026-06-28 (plan: 2026-06-29)  
**Status:** Research **zaakceptowany** — plan [zrealizowany](s01e01-llm-interaction.plan.md) (2026-06-29).

**Źródła:**

- `markdowns/s01e01-programowanie-interakcji-z-modelem-jezykowym-1773053098.md` — transkrypt lekcji S01E01
- `tasks/boilerplate/README.md`, `tasks/docs/boilerplate-documentation.md` — stan pakietu i konwencje kursu
- `tasks/boilerplate/src/agent/ai.ts`, `agent.ts`, `types/index.ts` — adapter LLM i kontrakty
- `tasks/boilerplate/docs/specs/s03e02-model-constraints/` — precedens analizy lekcji → boilerplate
- `tasks/shared/jobTagging.ts` — przykład Structured Output w warstwie epizodu (AI SDK, **poza** boilerplate)
- Przykłady upstream: `01_01_interaction`, `01_01_structured`, `01_01_grounding` (repo `i-am-alice/4th-devs` — **nie** w tym monorepo)

**Weryfikacja UI:** brak.

---

## Podsumowanie lekcji (kontekst dla czytającego)

Lekcja **S01E01** to fundament kursu AI Devs 4: jak **łączyć deterministyczny kod z niedeterministycznym LLM** przez API. Adam przechodzi od mechaniki modelu (tokeny, autoregresja, bezstanowość API, okno kontekstowe) do praktyk programistycznych sterowania zachowaniem — głównie przez **zarządzanie kontekstem** i **wieloetapowe zapytania** (np. routing: klasyfikacja → dedykowany prompt).

Kolejne bloki rozwijają **Structured Outputs** (JSON Schema, strict vs wartości, kolejność pól, wartości neutralne), **Function Calling** (wspomniane jako temat następny), **warstwę prezentacji** (streaming, zdarzenia semantyczne, MCP Apps / JSON Render — jako kierunek, nie implementacja w lekcji), **strategie wielu modeli** (główny + tani/szybki, specjalizacja, ewaluacja praktyczna), **organizację promptów** (inline, pliki markdown, Langfuse, frontmatter), **techniki instrukcji systemowych** (XML-like, tożsamość, limity, generalizowanie generalizacji), **few-shot / kontekst zewnętrzny**, oraz **pipeline wieloetapowy** (`01_01_grounding`: fragmenty tekstu, schematy per etap, równoległość, cache plikowy).

Lekcja pokazuje też **ewolucję persystencji**: prosty czat (`conversations` / `messages`) → schemat multi-agent (`sessions` / `agents` / `items`) — jako wizja produkcyjna, nie kod kursowy. Na końcu: krótki przegląd modeli open-source (LM Studio) i ekosystemu do śledzenia branży.

**Zadanie domowe `people`** (poza zakresem tego researchu): CSV z huba → filtr deterministyczny → **Structured Output** do tagowania zawodów → submit na `/verify`. W repo istnieje już warstwa `tasks/shared/` (`fetchPeople`, `filterPeople`, `jobTagging`) oparta o AI SDK — to **epizod / shared helpers**, nie rozszerzenie boilerplate.

---

## 1. Executive summary

S01E01 definiuje **cały stos generatywny** (kontekst, schematy, eventy, multi-model, persystencja), podczas gdy `@ai-devs/agent-boilerplate` celowo obejmuje **wąski profil**: jawny **ReAct + MCP + function calling** dla zadań hubowych kursu. Większość treści lekcji to **wiedza architektoniczna** i wzorce realizowane w **kodzie epizodu**, **lekcjach demonstracyjnych** lub **osobnych pakietach** — nie brakujące „feature’y” do skopiowania do core.

| Werdykt ogólny | Uzasadnienie |
| --- | --- |
| **Nie rozszerzać core o UI/streaming/semantic events** | Warstwa prezentacji i host zdarzeń — poza misją pakietu kursowego |
| **Nie rozszerzać core o multi-agent DB / heartbeat** | Lekcje S02+ / `03_02_events` — osobne runtime’y |
| **Nie dodawać AI SDK / Instructor do boilerplate** | Lekcja odradza ciężkie frameworki; kurs preferuje jawny `fetch` + Responses API |
| **Rozważyć osobny, cienki moduł lub helpery epizodu** dla **Structured Outputs poza ReAct** | Największa luka względem lekcji; homework i pipeline’y (grounding) tego wymagają, ale **nie** w pętli agenta |
| **Docs-only (zalecane na start)** | Sekcja w `boilerplate-documentation.md` §2.x mapująca S01E01 → „wzorzec / antywzorzec / gdzie w repo” (jak S03E02–S03E05) |
| **Opcjonalny follow-up (osobny plan + MR)** | `chatStructured()` w `ai.ts` (Zod → JSON Schema, strict) **bez** nowej zależności — tylko gdy ≥2 epizody w `tasks/` tego potrzebują poza AI SDK |

**Powiązanie z zadaniem domowym:** implementacja `people` → **`tasks/s01e01/`** lub skrypt + `tasks/shared/` — **osobny MR**, bez zmian w `@ai-devs/agent-boilerplate`.

---

## 2. Inwentaryzacja tematów lekcji

### 2.1 Fundamenty LLM (koncepcje, nie kod boilerplate)

| Temat | Opis | Feature runtime? |
| --- | --- | --- |
| Tokeny, autoregresja, context window | Wpływ całej historii na kolejny token; koszt PL vs EN | **Nie** — świadomość przy projektowaniu promptów i OM |
| Bezstanowość API | Pełny kontekst przy każdym wywołaniu | **Wzorzec** — `processConversationTurn`, OM, truncation |
| Niedeterminizm | Ten sam input ≠ ten sam output | **Wzorzec** — evals, human-in-the-loop (późniejsze lekcje) |
| Sterowanie kodem | Wiele zapytań, wyniki między krokami | **Wzorzec orchestracji** — kod epizodu, nie `createAgent` |

### 2.2 Structured Outputs vs Function Calling

| Temat | Opis | W boilerplate? |
| --- | --- | --- |
| JSON Schema + `strict` | Gwarancja kształtu odpowiedzi | ❌ brak w `chat()` / adapterze |
| Opisy pól schema | Jako „prompt” dla wartości | **Wzorzec** — `.describe()` w Zod narzędzi MCP (S03E04) |
| Wartości neutralne (`unknown`, `mixed`) | Mniej halucynacji przy klasyfikacji | **Wzorzec epizodu** |
| Kolejność pól (reasoning → sentiment → confidence) | Chain-of-thought w schema | **Opcjonalnie** w structured helper |
| Function Calling | Narzędzia agenta | ✅ domyślny ReAct (`ToolDefinition`, strict tools) |

Lekcja traktuje **Structured Output** i **Function Calling** jako **równoległe** mechanizmy API. Boilerplate implementuje **tylko drugi** — słusznie dla agentów ReAct, ale **nie** pokrywa pipeline’ów typu klasyfikacja batch / ekstrakcja bez narzędzi.

### 2.3 Prezentacja, streaming, zdarzenia

| Temat | Opis | W boilerplate? |
| --- | --- | --- |
| Streaming tokenów | UX, partial render | ❌ |
| Zdarzenia API (reasoning, tool calls, errors) | OpenAI Streaming Events | ❌ (logger tekstowy `[MYŚL]`/`[AKCJA]`) |
| Semantyczne zdarzenia aplikacji | ID, typ, metadata pod UI | ❌ — architektura hosta aplikacji |
| MCP Apps, JSON Render, generatywne UI | Dynamiczne interfejsy | ❌ — lekcje `03_05_*` |

### 2.4 Multi-model i providerzy

| Temat | Opis | W boilerplate? |
| --- | --- | --- |
| Główny + alternatywny model | Reasoning vs szybki/tani | **Częściowo** — `AGENT_MODEL`, `OM_MODEL`, `AGENT_VISION_MODEL`; routing w epizodzie |
| Specjalizacja per zadanie | Różne modele per format | **Epizod** — drugi `createAIAdapter` / `chat()` |
| Eval modeli (Promptfoo, DeepEval) | `@ai-devs/agent-evals` | **Osobny pakiet** |
| Cache providera, rate limits | Koszt i 429 | **Częściowo** — retry 429/503 w `fetchWithRetry`; brak warstwy cache |
| Natywne narzędzia providera (web search, code exec) | Vendor lock-in | ❌ — świadomie MCP własne |

### 2.5 Prompty i in-context learning

| Temat | Opis | W boilerplate? |
| --- | --- | --- |
| Prompty w plikach `.md` | Kompozycja, czytelność | ✅ konwencja kursu (`src/prompts/*.md`, `readFileSync`) |
| Langfuse prompt management | Wersjonowanie poza repo | **Opt-in** tracing; prompty nadal w repo |
| Frontmatter YAML | Dynamiczne umiejętności agentów | ❌ — wzorzec multi-agent / CLI (Cursor skills) |
| Few-shot / `<examples>` | Wzorce w instrukcji | **Epizod** — sekcje w `system.md` |
| Generalizowanie generalizacji | Meta-reguły wyboru narzędzi | **Częściowo** — `tool_discovery.md`, planning turn 0 |
| Dynamiczne tworzenie skilli przez agenta | Architect → Reporter | ❌ — poza zakresem kursu podstawowego |

### 2.6 Pipeline `01_01_grounding` (wieloetapowy LLM poza agentem)

| Mechanizm | Opis | Gdzie w repo |
| --- | --- | --- |
| Podział na fragmenty | Skupienie uwagi modelu | **Epizod** — własny pipeline TS |
| Schemat JSON per etap | Osobne prompty + schema | **Epizod** lub helper structured |
| Równoległe batch’e + grupowanie | Latency vs rate limit | **Epizod** — `Promise.all` + backoff |
| Checkpoint / cache plikowy | Wznowienie po błędzie | **Epizod** — wzorzec plików JSON |
| Natywne web search API | Grounding zewnętrzny | **Epizod** — nie MCP boilerplate |

### 2.7 Persystencja i multi-agent (wizja produkcyjna)

| Schemat | Opis | W boilerplate? |
| --- | --- | --- |
| conversations + messages | Prosty czat | ❌ — brak DB w pakiecie |
| sessions + agents + items | Multi-agent, async | ❌ — `03_02_events`, lekcje S04 |

### 2.8 Zadanie domowe `people` (poza zakresem MR boilerplate)

| Wymaganie | Implikacja | Gdzie |
| --- | --- | --- |
| Pobranie CSV | HTTP GET | `tasks/shared/fetchPeople.ts` |
| Filtr wiek/płeć/miasto | Deterministyczny kod | `tasks/shared/filterPeople.ts` |
| Tagowanie LLM (Structured Output) | Batch, schema tagów | `tasks/shared/jobTagging.ts` (AI SDK) |
| Submit hub | POST verify | wzorzec `submit_to_hub` / `http_request` |

---

## 3. Mapowanie lekcja → boilerplate (stan obecny)

| Funkcjonalność S01E01 | W boilerplate? | Gdzie / jak |
| --- | --- | --- |
| ReAct + function calling | ✅ default | `createAgent`, `ai.ts` |
| Responses API + retry 429/503 | ✅ default | `fetchWithRetry`, `http_request` |
| Prompty markdown | ✅ konwencja | `src/prompts/*.md`, epizody |
| Multi-turn / historia | ✅ | `processConversationTurn` |
| Zarządzanie kontekstem (kompresja) | ✅ opt-in | Observational Memory |
| Lazy schematy narzędzi | ✅ opt-in | `toolDiscovery` |
| Planning turn 0 | ✅ opt-in | `enablePlanningPhase` |
| Reasoning API (effort) | ✅ per adapter | `createAIAdapter({ reasoning })` |
| Strip reasoning z replay | ✅ | `compactOutputItems` w `ai.ts` |
| Structured Outputs (json_schema) | ❌ | epizody: AI SDK / ręczny JSON |
| Routing wielu zapytań (classify → act) | ❌ | orchestracja w `index.ts` epizodu |
| Streaming / semantic events | ❌ | aplikacja host |
| Pipeline parallel + file cache | ❌ | wzorzec grounding w lekcji |
| Multi-model router | ❌ | env + wiele adapterów w epizodzie |
| Provider prompt cache | ❌ | infrastruktura API |
| Langfuse tracing | ✅ opt-in | `src/observability/` |
| Evals (Promptfoo) | ❌ w pakiecie | lekcje / `agent-evals` |
| Multi-agent persistence | ❌ | lekcje events / S04 |

---

## 4. Gap analysis — co by „rozbudowało” agentów, a co nie powinno trafić do core

### 4.1 Luki realne (warto rozważyć w przyszłości)

| Luka | Korzyść dla rozbudowanych agentów | Rekomendacja |
| --- | --- | --- |
| **Brak `chatStructured` / json_schema w adapterze** | Klasyfikacja, ekstrakcja, etapy pipeline bez ReAct; spójność z lekcją S01 | **Osobny plan:** cienki helper w `ai.ts` + Zod→JSON Schema (ręcznie lub minimalny converter); **bez** AI SDK |
| **Brak dokumentacji „S01 foundations” w spec** | Uczestnik nie wie, czemu agent ≠ cały stos z lekcji 1 | **Docs-only MR** — §2.0 lub §2.6 w `boilerplate-documentation.md` |
| **Brak wzorca „orchestrator script” w docs** | classify → branch → agent | Opis w dokumentacji + przykład pseudo-kodu w spec (nie nowy moduł) |

### 4.2 Tematy świadomie poza pakietem (zgodnie z filozofią kursu)

| Temat | Powód wykluczenia z core |
| --- | --- |
| Semantic events / streaming UI | Inna warstwa produktu; boilerplate = terminal + ReAct |
| Multi-agent DB, sessions/agents/items | Złożoność S03/S04; demo w `lessons/` |
| AI SDK / Instructor w pakiecie | Lekcja: frameworki „nierekomendowane”; jawność > abstrakcja |
| Natywne narzędzia OpenAI (web search, computer use) | Vendor lock-in; kurs uczy własnych MCP |
| Grounding pipeline w core | Jednorazowy wzorzec edukacyjny; duplikuje logikę epizodu |
| Dynamiczne generowanie promptów przez agenta | SkillsBench — ostrożność; poza homework hub |

### 4.3 Synergia z istniejącymi specami

| Istniejący spec | Relacja do S01E01 |
| --- | --- |
| `initial-planning-phase` | Realizuje „wieloetapowe myślenie przed działaniem” z lekcji (plan → ReAct) |
| `tool-discovery` | Redukcja tokenów wejściowych (dźwignia kosztowa z lekcji) |
| `observational-memory` | Odpowiedź na bezstanowość + długi kontekst |
| `agent-observability-evals` | „Sprawdź model w praktyce” z sekcji multi-model |
| `s03e02-model-constraints` | Rozwija temat kosztu/latency z S01 w profil agenta hub |
| `readme-feature-catalog` | Miejsce na wpis „Structured Outputs → poza ReAct, patrz S01” |

---

## 5. Propozycje kierunków (osobne MR — poza homework)

### 5.1 MR A — docs-only (niski risk, **rekomendowany pierwszy krok**)

- Dodać **`§2.6 LLM interaction foundations (S01E01)`** w `tasks/docs/boilerplate-documentation.md`:
  - tabela wzorzec / antywzorzec / gdzie w repo (jak §2.1–§2.5),
  - reguła kciuka: *ReAct agent → boilerplate; Structured Output pipeline → epizod lub helper; UI/events → aplikacja host*,
  - link do tego pliku research.
- Opcjonalnie: 1 wiersz w **Feature catalog** README („Structured chat outside ReAct — not included”).

**Nie dotyka:** kodu runtime, zależności, zadania `people`.

### 5.2 MR B — opcjonalny helper Structured Outputs (średni scope)

**Warunek:** akceptacja planu + potwierdzenie, że epizody mają **rezygnować z AI SDK** na rzecz spójnego adaptera boilerplate.

| Element | Zakres |
| --- | --- |
| `chatStructured<T>(params, zodSchema)` | `text.format: json_schema`, parse + Zod safeParse |
| Eksport typów | Obok `ChatParams`, bez zmiany `createAgent` |
| Testy | Mock Responses API, strict schema |
| Dokumentacja | Przykład batch tagowania (bez logiki homework) |

**Poza zakresem:** streaming, Instructor, automatyczny Zod→JSON Schema dla wszystkich providerów Anthropic/Gemini (faza 1: OpenAI Responses API jak w `ai.ts`).

### 5.3 MR C — nie rekomendowane teraz

- Moduł semantic events,
- Multi-model router w core,
- Integracja Langfuse Prompt Management,
- Przeniesienie `tasks/shared/jobTagging.ts` do boilerplate.

---

## 6. Zadanie domowe `people` — wyraźne odgraniczenie

| Aspekt | Decyzja |
| --- | --- |
| Scope homework | Epizod `tasks/s01e01/` (do utworzenia) lub skrypt korzystający z `tasks/shared/` |
| Boilerplate | **Bez zmian** — wystarczy `http_request` / ewentualnie prosty skrypt bez ReAct |
| Structured Output | AI SDK w `jobTagging.ts` **już istnieje** — ewentualna refaktoryzacja to **osobny MR epizodu**, nie wynik tego researchu |
| Flaga hub | Submit przez `https://hub.ag3nts.org/verify`, task `people` |

---

## 7. Otwarte pytania (do akceptacji researchu)

| # | Pytanie | Domyślna rekomendacja |
| --- | --- | --- |
| Q1 | Czy pierwszy MR ma być **tylko docs** (§2.6), bez kodu? | **Tak** |
| Q2 | Czy planować `chatStructured` w boilerplate, czy zostawić Structured Output wyłącznie w epizodach (AI SDK / ręczny fetch)? | **Docs teraz; helper dopiero gdy ≥2 epizody bez AI SDK** |
| Q3 | Czy tworzyć `tasks/s01e01/` w tym samym streamie co boilerplate? | **Nie** — osobny MR homework |
| Q4 | Czy `tasks/shared/jobTagging.ts` ma migrować z AI SDK na adapter boilerplate? | **Opcjonalnie później** — nie blokuje researchu S01 |

---

## 8. Acceptance criteria (research)

- [x] Przeanalizowano pełny transkrypt S01E01 pod kątem rozbudowy boilerplate.
- [x] Oddzielono **lekcję / wzorce architektoniczne** od **zadania domowego `people`**.
- [x] Zmapowano tematy na stan `@ai-devs/agent-boilerplate` i istniejące specy.
- [x] Zaproponowano ścieżki MR (docs vs kod) z werdyktem priorytetu.
- [x] Dodano **podsumowanie lekcji** dla czytającego.
- [x] **Akceptacja człowieka** przed `*.plan.md`.
- [x] Plan utworzony: [s01e01-llm-interaction.plan.md](s01e01-llm-interaction.plan.md).

---

## 9. Sugerowane następne kroki

1. ~~**Review tego pliku**~~ — zaakceptowano.
2. ~~**`s01e01-llm-interaction.plan.md`**~~ — utworzono (Phase 1 docs + Phase 2 `chatStructured`).
3. **Plan review** (`*.plan-review.md`) przed implementacją — **następny krok**.
4. Homework `people` — **osobny wątek** (epizod + ewentualnie dopracowanie `tasks/shared/`).

---

## 10. Referencje w repo

| Zasób | Ścieżka |
| --- | --- |
| Adapter LLM | `tasks/boilerplate/src/agent/ai.ts` |
| Agent ReAct | `tasks/boilerplate/src/agent/agent.ts` |
| Kontrakty Zod | `tasks/boilerplate/src/types/index.ts` |
| Shared homework helpers | `tasks/shared/*.ts` |
| Precedens research lekcji | `tasks/boilerplate/docs/specs/s03e02-model-constraints/` |
| Normatywna spec | `tasks/docs/boilerplate-documentation.md` |

---

## 11. Konkretne API `chatStructured` (propozycja MR B)

**Status:** spec projektowy — **niezaimplementowane**.  
**Pliki docelowe:** `src/agent/ai.ts`, `src/agent/structured.ts` (opcjonalny split), `src/agent/structured.test.ts`, eksport w `index.ts`.  
**Provider v1:** ten sam endpoint co `chat()` — OpenAI **Responses API** (`RESPONSES_API_ENDPOINT`, klucz z `tasks/config.js`).

### 11.1 Eksporty publiczne

```typescript
// index.ts — obok chat / createAIAdapter
export {
  chatStructured,
  createStructuredAIAdapter,
  zodToOpenAiJsonSchema,
  StructuredOutputError,
  StructuredOutputApiError,
  StructuredOutputParseError,
  StructuredOutputValidationError,
} from "./src/agent/structured.js";

export type {
  ChatStructuredParams,
  ChatStructuredOptions,
  ChatStructuredResult,
  StructuredAIAdapter,
  OpenAiJsonSchema,
} from "./src/agent/structured.js";
```

**Opcjonalnie (faza 1.1):** `withTracingStructuredAdapter` w `src/observability/tracing-adapter.ts` — analogicznie do `withTracingAdapter`.

### 11.2 Główna funkcja

```typescript
/**
 * Single-shot LLM call with Structured Outputs (json_schema, strict).
 * Outside ReAct — no tools, no createAgent.
 */
export async function chatStructured<T>(
  params: ChatStructuredParams<T>,
  options?: ChatStructuredOptions,
): Promise<ChatStructuredResult<T>>;
```

**Semantyka:**

1. Buduje body Responses API z `text.format.type = "json_schema"`.
2. Woła `fetchWithRetry` (429/503 — identycznie jak `chat()`).
3. Wyciąga tekst JSON z `output_text` / message `output_text`.
4. `JSON.parse` → obiekt.
5. Waliduje przez przekazany `params.schema` (`safeParse`).
6. Zwraca `{ data, usage, rawText }` lub rzuca hierarchię `StructuredOutputError`.

**Nie robi:** streaming, function calling, wielokrotnych tur, automatycznego retry przy błędzie walidacji Zod (to decyzja epizodu).

### 11.3 Typy wejścia — `ChatStructuredParams<T>`

```typescript
import type { z } from "zod";
import type { TokenUsage } from "../types/index.js";

/** JSON Schema subset accepted by OpenAI Structured Outputs (manual escape hatch). */
export type OpenAiJsonSchema = Record<string, unknown>;

export type ChatStructuredParams<T> = {
  /** Model id (OpenAI or OpenRouter via tasks/config.js). */
  model: string;

  /**
   * Zod schema for post-parse validation AND (by default) JSON Schema generation.
   * Must be `z.object(...)` or `z.array(...)` at root — OpenAI requires object/array root.
   */
  schema: z.ZodType<T>;

  /**
   * Schema name sent to API (`text.format.name`).
   * Pattern: `[a-zA-Z0-9_-]{1,64}` — validated at runtime.
   */
  schemaName: string;

  /** Responses API `input` — same shape as chat() (messages / multimodal items). */
  input?: unknown[];

  /** Top-level system instructions (`instructions` field). */
  instructions?: string;

  /** Optional reasoning block (same as chat()). */
  reasoning?: Record<string, unknown>;

  maxOutputTokens?: number;
  temperature?: number;

  /**
   * API-level strict mode. Default: true.
   * When true, provider guarantees response shape matches json_schema.
   */
  strict?: boolean;

  /**
   * Skip Zod→JSON conversion; supply provider schema directly.
   * `schema` is still used for safeParse after response.
   * Use when converter does not support edge-case Zod (discriminated unions, refinements).
   */
  jsonSchema?: OpenAiJsonSchema;
};
```

**Reguły walidacji parametrów (przed fetch):**

| Reguła | Błąd |
| --- | --- |
| `schemaName` pusty lub nie pasuje do regex | `StructuredOutputError` (invalid params) |
| brak `schema` | `StructuredOutputError` |
| `jsonSchema` podany bez `type: "object"` \| `"array"` na root | `StructuredOutputError` |
| `input` undefined | traktowane jako `[]` (pusty input — rzadkie, dozwolone) |

### 11.4 Typy opcji — `ChatStructuredOptions`

Rozszerza wzorzec `ChatOptions` z `ai.ts` — **bez** `toolChoice` (brak narzędzi).

```typescript
export type ChatStructuredOptions = {
  /** Override retry base delay in ms. Pass 0 in tests. */
  retryDelayBaseMs?: number;

  /** Override params.maxOutputTokens for this call. */
  maxOutputTokens?: number;

  /** Langfuse / tracing metadata (when wrapper used). */
  tracingMetadata?: Record<string, unknown>;

  /**
   * Include raw JSON string in result. Default: false.
   * Useful for debugging / logging redacted payloads.
   */
  includeRawText?: boolean;
};
```

### 11.5 Typ wyjścia — `ChatStructuredResult<T>`

```typescript
export type ChatStructuredResult<T> = {
  /** Parsed and Zod-validated object. */
  data: T;

  /** Token usage when API returns it (same shape as ModelResponse.usage). */
  usage?: TokenUsage;

  /** Present only when options.includeRawText === true. */
  rawText?: string;
};
```

**Brak pól:** `toolCalls`, `rawOutputItems` — to nie jest ReAct.

### 11.6 Fabryka — `createStructuredAIAdapter`

Lustrzane odbicie `createAIAdapter` — bindowanie modelu i domyślnych limitów.

```typescript
export interface StructuredAIAdapter {
  generateObject<T>(
    params: Omit<ChatStructuredParams<T>, "model">,
    options?: ChatStructuredOptions,
  ): Promise<ChatStructuredResult<T>>;
}

export function createStructuredAIAdapter(cfg: {
  model: string;
  maxOutputTokens?: number;
  temperature?: number;
  reasoning?: Record<string, unknown>;
}): StructuredAIAdapter;
```

**Implementacja:** deleguje do `chatStructured({ ...params, model: cfg.model, ...defaults })`.

### 11.7 Helper — `zodToOpenAiJsonSchema`

```typescript
/**
 * Converts a Zod schema to OpenAI Structured Outputs JSON Schema (strict subset).
 * Throws StructuredOutputError if conversion unsupported.
 */
export function zodToOpenAiJsonSchema(
  schema: z.ZodType<unknown>,
  options?: { name?: string },
): OpenAiJsonSchema;
```

**Zakres v1 convertera (świadomie wąski):**

| Zod | JSON Schema |
| --- | --- |
| `z.object`, `z.array` | `type: object` / `array`, `properties`, `required` |
| `z.string`, `z.number`, `z.boolean`, `z.null()` | odpowiednie typy |
| `z.enum`, `z.literal` | `enum` |
| `z.optional()` | pole pominięte z `required` |
| `.describe()` | `description` |
| `z.union`, `.refine()`, `z.record`, recursive | **unsupported** → użyj `params.jsonSchema` |

### 11.8 Body HTTP (Responses API)

`chatStructured` wysyła POST na `RESPONSES_API_ENDPOINT` z body:

```json
{
  "model": "gpt-4o-mini",
  "instructions": "Przypisz tagi...",
  "input": [
    { "role": "user", "content": "1. Kierowca autobusu miejskiego\n2. ..." }
  ],
  "max_output_tokens": 2048,
  "temperature": 0,
  "text": {
    "format": {
      "type": "json_schema",
      "name": "job_classifications",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "classifications": {
            "type": "array",
            "description": "One entry per input job line",
            "items": {
              "type": "object",
              "properties": {
                "index": { "type": "integer", "description": "1-based line number" },
                "tags": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "enum": ["IT", "transport", "edukacja", "medycyna", "praca z ludźmi", "praca z pojazdami", "praca fizyczna"]
                  }
                }
              },
              "required": ["index", "tags"],
              "additionalProperties": false
            }
          }
        },
        "required": ["classifications"],
        "additionalProperties": false
      }
    }
  }
}
```

**Uwagi implementacyjne:**

- **Nie** ustawiać `tools` / `tool_choice`.
- `strict: true` wymaga `additionalProperties: false` na każdym obiekcie w schema (OpenAI constraint) — converter musi to dodawać.
- Nagłówki: identyczne jak `chat()` (`Authorization`, `EXTRA_API_HEADERS` z OpenRouter).

### 11.9 Parsowanie odpowiedzi

Kolejność (reuse funkcji z `ai.ts`):

```text
extractResponseText(data)
  → jeśli null: StructuredOutputParseError("empty structured response")
JSON.parse(text)
  → SyntaxError → StructuredOutputParseError
params.schema.safeParse(parsed)
  → success → { data: result.data, usage }
  → failure → StructuredOutputValidationError(zodError, { rawText, parsed })
```

**Usage:** ten sam `parseTokenUsage()` co w `chat()`.

### 11.10 Hierarchia błędów

```typescript
export class StructuredOutputError extends Error {
  readonly code:
    | "invalid_params"
    | "api_error"
    | "parse_error"
    | "validation_error";
}

/** HTTP non-2xx or error object in response body. */
export class StructuredOutputApiError extends StructuredOutputError {
  readonly status: number;
  readonly bodySnippet: string;
}

/** output_text missing or JSON.parse failed. */
export class StructuredOutputParseError extends StructuredOutputError {
  readonly rawText?: string;
}

/** JSON parsed but Zod safeParse failed. */
export class StructuredOutputValidationError extends StructuredOutputError {
  readonly zodError: z.ZodError;
  readonly parsed: unknown;
  readonly rawText?: string;
}
```

**Kontrakt dla epizodu:** łapać `StructuredOutputValidationError` → log + retry z krótszym batch / fallback model — **poza** boilerplate.

Komunikat API — ten sam format co `chat()` (`errMsg | body: ...`) opakowany w `StructuredOutputApiError`.

### 11.11 Relacja do istniejących API

| API | Kiedy | Narzędzia | Format odpowiedzi |
| --- | --- | --- | --- |
| `chat()` | Niskopoziomowe wywołanie (OM, testy) | opcjonalnie | tekst + tool calls |
| `createAIAdapter` | ReAct w `createAgent` | tak | tekst + tool calls |
| **`chatStructured`** | Pipeline / klasyfikacja / ekstrakcja | **nie** | **typed JSON** |
| **`createStructuredAIAdapter`** | Wiele wywołań tym samym modelem w epizodzie | **nie** | **typed JSON** |

**`createAgent` — bez zmian.** Brak integracji structured output w pętli ReAct w v1.

### 11.12 Observability (opcjonalna faza 1.1)

```typescript
export function withTracingStructuredAdapter(
  adapter: StructuredAIAdapter,
  model: string,
): StructuredAIAdapter;
```

Span Langfuse:

- `metadata.mode = "structured"`
- `metadata.schemaName = params.schemaName`
- `input`: sformatowany prompt (bez pełnego schema w body span — tylko nazwa)
- `output`: `JSON.stringify(result.data)` (truncate jak tool output)

### 11.13 Przykład — batch tagowanie (wzorzec `people`, bez logiki homework)

```typescript
import { z } from "zod";
import {
  chatStructured,
  StructuredOutputValidationError,
} from "@ai-devs/agent-boilerplate";
import { DEFAULT_AGENT_MODEL } from "@ai-devs/agent-boilerplate/config.js";

const Tags = [
  "IT",
  "transport",
  "edukacja",
  "medycyna",
  "praca z ludźmi",
  "praca z pojazdami",
  "praca fizyczna",
] as const;

const batchSchema = z.object({
  classifications: z.array(
    z.object({
      index: z.number().int().describe("1-based index from the numbered list"),
      tags: z.array(z.enum(Tags)).describe("All applicable tags"),
    }),
  ),
});

type BatchResult = z.infer<typeof batchSchema>;

export async function tagJobsBatch(
  numberedJobs: string,
): Promise<BatchResult> {
  try {
    const { data, usage } = await chatStructured(
      {
        model: DEFAULT_AGENT_MODEL,
        schemaName: "job_classifications",
        schema: batchSchema,
        temperature: 0,
        maxOutputTokens: 4096,
        instructions: `Assign tags to each numbered job description.
Use only allowed tag values. Include neutral classification when unclear.`,
        input: [{ role: "user", content: numberedJobs }],
      },
      { tracingMetadata: { phase: "job_tagging" } },
    );

    if (usage) {
      console.debug("[structured] tokens", usage);
    }
    return data;
  } catch (e) {
    if (e instanceof StructuredOutputValidationError) {
      throw new Error(
        `Model returned JSON outside schema: ${e.zodError.message}`,
        { cause: e },
      );
    }
    throw e;
  }
}
```

### 11.14 Przykład — adapter wieloetapowy (grounding-style)

```typescript
const keywordsAdapter = createStructuredAIAdapter({
  model: "gpt-4o-mini",
  maxOutputTokens: 2048,
  temperature: 0,
});

const paragraphSchema = z.object({
  keywords: z.array(
    z.object({
      phrase: z.string(),
      definition: z.string().optional(),
    }),
  ),
});

// Etap 1 — per fragment (epizod może Promise.all z limitem współbieżności)
const { data } = await keywordsAdapter.generateObject({
  schemaName: "paragraph_keywords",
  schema: paragraphSchema,
  instructions: loadPrompt("extract_keywords.md"),
  input: [{ role: "user", content: paragraphText }],
});
```

### 11.15 Testy (acceptance dla implementacji)

| Test | Oczekiwanie |
| --- | --- |
| Mock 200 + valid JSON + schema match | `data` typed, `usage` parsed |
| Mock 200 + invalid JSON | `StructuredOutputParseError` |
| Mock 200 + JSON niezgodny z Zod | `StructuredOutputValidationError` + `parsed` |
| Mock 503 ×2 then 200 | 3 fetch calls (retry) |
| `strict: false` in body | body contains `"strict": false` |
| `jsonSchema` override | body schema equals override, not converter output |
| `schemaName` invalid | `StructuredOutputError` before fetch |

### 11.16 Poza zakresem v1

- Streaming partial JSON
- Anthropic / Gemini native structured output endpoints
- Auto-repair loop (re-prompt on validation failure)
- `generateObject` alias export (tylko `chatStructured` + adapter method `generateObject`)
- Integracja z MCP / ReAct tool results
