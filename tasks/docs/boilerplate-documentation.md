# Specyfikacja Projektowa: AI Devs 4 Agent Boilerplate

## 1. Informacje Ogólne i Cel Projektu

**Nazwa projektu:** AI Devs 4 Agent Boilerplate
**Cel:** Stworzenie uniwersalnego, łatwo konfigurowalnego środowiska (boilerplate'u) do budowy i testowania agentów AI w ramach kursu AI Devs 4. Projekt ma charakter **edukacyjny** – struktura musi być czytelna, pozbawiona "czarnej magii" (np. bez ciężkich frameworków jak LangChain), z naciskiem na jawne zarządzanie pętlą rozumowania (reasoning loop), pamięcią oraz integracją przez Model Context Protocol (MCP).

## 2. Założenia Architektoniczne

Projekt opiera się na architekturze modułowej, w której agent jest oddzielony od narzędzi poprzez protokół MCP oraz od modelu językowego poprzez ustandaryzowany adapter.

1. **Wzorzec Agenta:** ReAct (Reasoning and Acting) realizowany w prostej pętli while/for wewnątrz `agent.ts`.
2. **Rozdzielenie Narzędzi:**

- **Natywne:** Funkcje bezpośrednio modyfikujące stan agenta (np. zatrzymanie pętli).
- **MCP (Model Context Protocol):** Operacje I/O, sieć, system plików, uruchamiane w oddzielnym serwerze (`server.ts`) i wywoływane przez klienta (`client.ts`).

3. **Pamięć i Kompresja (Observer/Reflector):** Długoterminowe zarządzanie oknem kontekstowym dla wieloetapowych zadań, zapobiegające przekroczeniu limitu tokenów.
4. **Odporność (Resilience):** Wbudowany mechanizm Exponential Backoff dla błędów sieciowych (np. celowe błędy HTTP 503 na serwerach kursowych).

---

## 3. Struktura Katalogów (Directory Tree)

```text
/
├── .cursor/
│   └── rules/                 # Reguły dla narzędzia cursor-collections (np. tools.md, prompts.md)
├── src/
│   ├── agent/
│   │   ├── agent.ts           # Pętla decyzyjna agenta (Reasoning Loop)
│   │   ├── ai.ts              # Adapter modelu językowego (z logiką Retry/Backoff)
│   │   └── memory.ts          # Implementacja Observer / Reflector
│   ├── mcp/
│   │   ├── client.ts          # Interfejs klienta MCP
│   │   └── server.ts          # Serwer MCP rejestrujący narzędzia zdefiniowane w /tools/mcp/
│   ├── tools/
│   │   ├── native/            # Narzędzia wewnętrzne (np. finish_task.ts, ask_human.ts)
│   │   └── mcp/               # Narzędzia zewnętrzne (np. http_request.ts, read_file.ts)
│   ├── prompts/               # Pliki .md z instrukcjami (np. system.md, memory.md)
│   ├── scripts/               # Kod specyficzny dla danego zadania (domenowy)
│   ├── types/
│   │   └── index.ts           # Globalne interfejsy i schematy Zod
│   └── utils/
│       └── logger.ts          # Kolorowane logi: [MYŚL], [AKCJA], [WYNIK], [SYSTEM]
├── .env.example               # Szablon zmiennych środowiskowych
├── package.json
├── tsconfig.json
├── config.ts                  # Konfiguracja bazowa (modele, limity pamięci)
├── index.ts                   # Entrypoint aplikacji (bootstrap)
├── README.md                  # Dokumentacja "Quick Start"
└── CHANGELOG.md               # Dziennik wprowadzanych modyfikacji

```

---

## 4. Specyfikacja Interfejsów i Modułów (Contracts)

### 4.1. Moduł AI / Adapter Modelu (`src/agent/ai.ts`)

**Odpowiedzialność:** Komunikacja z API LLM (OpenAI/Anthropic/Gemini) z gwarancją obsługi błędów.
**Wymagania Spec-Driven:**

- Musi implementować mechanizm ponawiania żądań (Retry) z wykładniczym opóźnieniem (Exponential Backoff) aktywowany przy kodach `429` (Rate Limit) i `503` (Service Unavailable).
- Musi obsługiwać `tool_choice` oraz parsowanie wywołań narzędzi do wspólnego formatu.

```typescript
// Kontrakt
interface AIAdapter {
  generateResponse(
    messages: Message[],
    tools: ToolDefinition[],
  ): Promise<ModelResponse>;
}
type ModelResponse = {
  content: string;
  toolCalls?: ToolCall[];
};
```

### 4.2. Pętla Agenta (`src/agent/agent.ts`)

**Odpowiedzialność:** Zarządzanie procesem myślowym (Reasoning Loop).
**Przepływ (Workflow):**

1. Przyjmij zadanie (Task) i załaduj System Prompt (`/prompts/system.md`).
2. Rozpocznij pętlę (do `MAX_ITERATIONS`).
3. Wywołaj `ai.ts`. Wypisz `content` używając `logger.logThought()`.
4. Jeśli model zwrócił `toolCalls`:

- Zweryfikuj typ narzędzia (Native vs MCP).
- Zablokuj pętlę i poczekaj na wynik (`await executeTool()`).
- Zapisz wynik za pomocą `logger.logResult()`.
- Dodaj wynik do kontekstu jako nową wiadomość typu `tool_result`.

5. Jeśli wykonano narzędzie `finish_task` -> przerwij pętlę, zwróć wynik.

### 4.3. Zarządzanie Pamięcią (`src/agent/memory.ts`)

**Odpowiedzialność:** Kompresja historii konwersacji w przypadku długich sesji (szczególnie operacje na plikach/logach).
**Mechanika (Zgodna z lekcją S02E05):**

- **Observer:** Po każdej turze (lub przekroczeniu limitu X tokenów), agent pobiera najstarsze wiadomości i streszcza je (tworzy wpis do dziennika).
- **Reflector:** Kiedy "Dziennik Zdarzeń" rośnie za bardzo, wywoływany jest model w celu jego skompresowania do spójnych wniosków.

---

## 5. Specyfikacja Narzędzi (Tool Definitions)

Narzędzia muszą być zdefiniowane za pomocą biblioteki `Zod` (dla walidacji i generowania JSON Schema dla LLM).

### 5.1. Narzędzia Natywne (`src/tools/native/`)

Bezpośredni dostęp do logiki sterującej:

- **`finish_task`**
- _Opis:_ Zakończenie pracy agenta po zalezieniu rozwiązania.
- _Parametry:_ `final_answer` (string lub zrzut JSON).

- **`ask_human`**
- _Opis:_ Przerwanie pracy na żądanie pomocy od człowieka. Wstrzymuje proces w oczekiwaniu na wejście ze strumienia `stdin`.
- _Parametry:_ `question` (string).

### 5.2. Narzędzia MCP (`src/tools/mcp/`)

Udostępniane przez serwer MCP (`mcp/server.ts`):

- **`http_request`** (Najważniejsze narzędzie sieciowe dla kursu)
- _Opis:_ Wykonanie zapytania HTTP. Pod spodem korzysta z tej samej logiki Retry co adapter AI, aby radzić sobie z Rate Limitami API kursowego.
- _Parametry:_ `url` (string), `method` (enum: GET, POST), `body` (opcjonalny JSON).

- **`submit_to_hub`**
- _Opis:_ Wyodrębniona logika wysyłania odpowiedzi pod adres weryfikujący i wyciągania flagi `{FLG:...}`.
- _Parametry:_ `task_name` (string), `answer` (any).

- **`read_file`**
- _Opis:_ Odczyt zawartości pliku tekstowego z zabezpieczeniem (Chunking). Jeśli plik ma więcej niż Y znaków, odczytuje tylko zadaną porcję.
- _Parametry:_ `filepath` (string), `offset` (number, opcjonalnie).

- **`analyze_image_vision`**
- _Opis:_ Wykorzystuje lekki model vision (np. Gemini 1.5 Flash), aby opisać obrazek i zwrócić tekst do głównego (droższego) agenta, oszczędzając tokeny.
- _Parametry:_ `filepath` (string), `query` (string - o co zapytać obrazek).

---

## 6. Integracja Cursor IDE — Cursor Collections (Eversis)

Repozytorium jest w pełni zintegrowane z frameworkiem [PiotrNie-Eversis/cursor-collections](https://github.com/PiotrNie-Eversis/cursor-collections). Poniżej znajdziesz mapę dostępnych zasobów w katalogu `.cursor/` w korzeniu repozytorium.

### Workflow: Ideate → Implement → Review

Każde nowe zadanie realizuj zgodnie z workflow opisanym w [AGENTS.md](/third-party/github-collections/AGENTS.md) i [documentation/cursor-collection.md](/third-party/github-collections/documentation/cursor-collection.md):

1. **Implement** — dołącz `@eversis-implement` i opis zadania; agent przeprowadzi research → plan → kod z ludzkimi bramkami zatwierdzenia.
2. **Review** — po implementacji dołącz `@eversis-review` w celu ustrukturyzowanego przeglądu kodu.

### Dostępne reguły (`.cursor/rules/`)

| Plik                                        | Kiedy aktywna                                                |
| ------------------------------------------- | ------------------------------------------------------------ |
| `eversis-agent-core.mdc`                    | zawsze (`alwaysApply: true`) — bazowe zachowania agenta      |
| `eversis-project-stack.mdc`                 | zawsze — stack Bun/TypeScript, komendy i konwencje tego repo |
| `eversis-engineering-manager.mdc`           | na żądanie `@` — przy użyciu `@eversis-implement`            |
| `eversis-code-reviewer.mdc`                 | na żądanie `@` — przy użyciu `@eversis-review`               |
| `eversis-testing-and-terminal.mdc`          | na żądanie `@` — dyscyplina testowania i terminala           |
| `use-bun-instead-of-node-vite-npm-pnpm.mdc` | automatycznie dla `tasks/**` i `lessons/**`                  |

### Dostępne prompty (`.cursor/prompts/`, dołącz przez `@`)

| Prompt                         | Zastosowanie                                             |
| ------------------------------ | -------------------------------------------------------- |
| `@eversis-implement`           | Research → plan → implementacja nowego zadania kursowego |
| `@eversis-review`              | Przegląd kodu z PASS / BLOCKER / SUGGESTION              |
| `@eversis-review-codebase`     | Ogólny przegląd zdrowia bazy kodu                        |
| `@eversis-analyze-materials`   | Analiza materiałów kursu → strukturyzowane notatki       |
| `@eversis-create-custom-skill` | Tworzenie nowego skill package w `.cursor/skills/`       |

### Skills (`.cursor/skills/`, przez MCP `eversis-collections`)

Po uruchomieniu lokalnego serwera MCP (`node third-party/github-collections/mcp/eversis-collections-mcp/dist/index.js`, po `npm ci && npm run build` w tym katalogu) agent może wywołać narzędzia `eversis_skills_list` i `eversis_skills_get`, aby odczytać proceduralne instrukcje dla konkretnych technologii (np. `eversis-implementing-backend`, `eversis-sql-and-database-understanding`).

### Kluczowe konwencje wymuszane przez reguły

- Wszystkie duże bloki promptów trzymaj w `src/prompts/*.md`; wczytuj przez `fs.readFileSync`. Nigdy nie hardkoduj długich stringów w logice agenta.
- Nowe narzędzie MCP: utwórz plik w `src/tools/mcp/`, zdefiniuj `inputSchema` przez `zod`, zarejestruj w `src/mcp/server.ts`, zwracaj `{ content: [{ type: "text", text: string }] }`.
- Zakres zmian — modyfikuj wyłącznie pliki wymagane przez zadanie; nie refaktoruj kodu niezwiązanego ze zmianą.

---

## 7. Plan Wdrożenia (Implementation Steps)

Przy użyciu Cursora proces wdrażania na podstawie tej specyfikacji powinien przebiegać następująco:

**KROK 1: Inicjalizacja i Fundamenty (Konfiguracja)**

- Utworzenie plików `package.json`, `tsconfig.json`, `config.ts`, `.env.example`.
- Instalacja kluczowych pakietów: `zod`, `@modelcontextprotocol/sdk`, bibliotek AI (np. `openai` lub dedykowanych SDK), bibliotek do logowania (np. `chalk` do kolorowania).

**KROK 2: Logowanie i Typy**

- Stworzenie modułu `utils/logger.ts` i zdefiniowanie standardu logowania procesu myślowego.
- Utworzenie pliku `types/index.ts` zawierającego schematy wiadomości (Role: system, user, assistant, tool).

**KROK 3: Adapter AI i Odporność (Resilience)**

- Zakodowanie pliku `ai.ts` implementującego kontrakt `AIAdapter`.
- Wdrożenie funkcji opóźnienia i ponawiania (`Exponential Backoff`) przechwytującej HTTP 503.

**KROK 4: Warstwa Narzędzi i MCP**

- Inicjalizacja serwera MCP w `mcp/server.ts`.
- Stworzenie 4 bazowych narzędzi MCP zdefiniowanych w Sekcji 5.
- Inicjalizacja klienta MCP `mcp/client.ts` i mapowanie narzędzi do zrzutu Zod.
- Utworzenie narzędzi natywnych (`finish_task`, `ask_human`).

**KROK 5: Pętla Główna Agenta (Reasoning Loop)**

- Złożenie całości w `agent.ts`.
- Implementacja pętli z ogranicznikiem zapętlenia (Max Iterations Guard).
- Integracja wywołań zwrotnych (Tool Results) do kontekstu modelu.

**KROK 6: Pamięć (Wersja edukacyjna)**

- Przygotowanie pustej, ale zdefiniowanej w architekturze struktury dla modułu `memory.ts`. Wdrożenie algorytmów Observer/Reflector będzie realizowane w miarę postępów w S02E05.

**KROK 7: Testy "Hello World"**

- Napisanie prostego skryptu w `scripts/test_agent.ts` używającego boilerplate'u do spytania o prosty matematyczny fakt z sieci lub z odczytanego pliku z użyciem narzędzia `http_request` lub `read_file`.
