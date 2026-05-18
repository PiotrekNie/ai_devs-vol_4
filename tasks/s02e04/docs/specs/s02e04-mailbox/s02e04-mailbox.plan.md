# Plan wdrożenia — S02E04: agent `mailbox` (zmail + hub)

**Normatywny research:** [s02e04-mailbox.research.md](s02e04-mailbox.research.md)  
**Kontekst zadania:** [docs/context/s02e04.md](../../context/s02e04.md)  
**Workspace:** `tasks/s02e04/`

Ten dokument jest planem **wdrożenia kodu** agenta zgodnym z `@eversis-implement`: typy zadań `[CREATE]` / `[MODIFY]` / `[REUSE]`. **Szerokie zmiany w kodzie** następują po akceptacji planu przez człowieka (bramka z `eversis-agent-core.mdc`).

**Weryfikacja UI:** brak — zadanie nie dotyczy frontendu ani Figma.

---

## 1. Zakres (scope)

**W zakresie:**

- **Osobny pakiet npm** w `tasks/s02e04/` (nazwa, skrypty, entrypoint startowy) — zgodnie z research §9.1.
- **Jedna pętla ReAct** — zgodnie z research §9.2 (bez osobnego agenta „weryfikującego”).
- **Cienkie narzędzia MCP:** `search_mail`, `download_mail_content` → `POST` na API zmail z `HUB_API_KEY`, retry jak w `fetchWithRetry`.
- **Konfiguracja:** stała URL zmail (`ZMAIL_API_URL`, domyślnie `https://hub.ag3nts.org/api/zmail`) w `config.ts`.
- **Pozostałe narzędzia MCP** z boilerplate: `http_request`, `submit_to_hub`, `read_file`, `analyze_image_vision`, `finish_task` (nazwy i zestaw — dopasować do faktycznego `server.ts`).
- **`help` / `getInbox` / `getThread`:** realizacja przez **`http_request`** z gotowym body JSON (bez nowych wrapperów MCP), o ile prompt jednoznacznie opisze kształt żądań — alternatywa: jedno opcjonalne narzędzie `zmail_raw` tylko jeśli model źle trzyma JSON; **domyślnie `http_request`** (research §8).
- **Prompt systemowy** (`src/prompts/system.md`): zmail, dwuetapowość, Gmail-like `search`, aktywna skrzynka, `task: mailbox`, iteracyjny `submit_to_hub`, format trzech pól.
- **Entrypoint:** np. `run.ts` uruchamiany przez `bun --env-file=../.env run run.ts` (lub `npm run start`).
- **Testy:** mock `fetch` / testy jednostkowe narzędzi zmail i rejestracji MCP (minimalny zestaw); `bun test` + `bunx tsc --noEmit` z katalogu zadania.
- **README** epizodu: jak uruchomić, wymagane zmienne (`HUB_API_KEY`, klucz LLM), nazwa zadania hubu.

**Poza zakresem (chyba że osobna decyzja):**

- Refaktor globalny `tasks/boilerplate` vs `tasks/s02e04` (konsolidacja duplikatu kodu).
- Drugi proces LLM / delegate-message.
- E2E przeciwko prawdziwemu hubowi w CI (wymaga sekretów).

---

## 2. Skrót researchu (kontekst planu)

| Element | Opis |
|--------|------|
| Cel | Znaleźć `date`, `password`, `confirmation_code` w aktywnej skrzynce przez zmail; zweryfikować na `/verify` (`task: mailbox`). |
| API | Dwuetapowo: `search` / `getInbox` → metadane; `getMessages` → treść. Start: `help`. |
| Architektura agenta | Jedna pętla ReAct; „blackboard” opcjonalnie przez `MemoryHooks` lub stan w promptach. |
| Pakiet | `tasks/s02e04` jako samodzielny pakiet npm z własnym `name` i skryptem startu. |

---

## 3. Ryzyka i mitygacje

| Ryzyko | Mitygacja w wdrożeniu |
|--------|------------------------|
| Brak `HUB_API_KEY` | Narzędzia zmail i `submit_to_hub` zwracają czytelny `mcpErr`; dokumentacja w README. |
| Truncation dużych list maili | Domyślne `perPage`, paginacja w promptcie; `AGENT_MAX_TOOL_OUTPUT_CHARS`. |
| Model omija `getMessages` | Twarda reguła w `system.md` + opis narzędzia `download_mail_content`. |
| Chaos w `package.json` / entrypoint | Jeden skrypt `start` → jeden plik `run.ts`; barrel eksportów osobno tylko jeśli potrzebny testom. |

---

## 4. Kryteria akceptacji (Definition of Done)

- [ ] Z poziomu `tasks/s02e04`: `bun install`, potem `bun test` i `bunx tsc --noEmit` przechodzą bez błędów.
- [ ] `bun --env-file=../.env run run.ts` (lub ustalony skrypt) startuje agenta z wczytanym promptem i listą narzędzi zawierającą co najmniej `search_mail`, `download_mail_content`, `submit_to_hub`, `finish_task`.
- [ ] `search_mail` wysyła `action: "search"` i przekazuje `query` (+ opcjonalnie `page`, `perPage` z walidacją Zod).
- [ ] `download_mail_content` wysyła `action: "getMessages"` z poprawnym polem `ids` (pojedynczy id lub tablica).
- [ ] Agent w promptcie jest prowadzony do: `help` → wyszukiwanie/czytanie → ekstrakcja → `submit_to_hub` z `task_name: "mailbox"` → reakcja na feedback → ponowienie przy aktywnej skrzynce.
- [ ] README opisuje uruchomienie i zmienne środowiskowe.

---

## 5. Plan fazowy i zadania

Typy zgodne z `@eversis-implement`: `[CREATE]`, `[MODIFY]`, `[REUSE]`.

### Faza A — Pakiet npm i konfiguracja

| ID | Typ | Zadanie |
|----|-----|---------|
| A1 | [MODIFY] | **`package.json`:** ustawić `name` (np. `@ai-devs/s02e04`), `private`, `description`, `scripts` (`start`, `test`, `typecheck`), `type: "module"`; usunąć/wyprostować sprzeczność z obecną nazwą `@ai-devs/agent-boilerplate` jeśli nadal występuje. |
| A2 | [MODIFY] | **`config.ts`:** dodać `ZMAIL_API_URL` (env override + domyślna wartość URL z researchu); nie logować kluczy. |

### Faza B — Klient zmail i narzędzia MCP

| ID | Typ | Zadanie |
|----|-----|---------|
| B1 | [CREATE] | **`src/tools/mcp/zmail_client.ts`:** funkcja `postZmail(body)` — scala `apikey` z `HUB_API_KEY`, `POST` JSON na `ZMAIL_API_URL`, używa `fetchWithRetry` z `ai.ts`. |
| B2 | [CREATE] | **`src/tools/mcp/search_mail.ts`:** schema Zod (`query`, opcjonalnie `page`, `perPage` w zakresie API), `execute*` zwraca `mcpOk`/`mcpErr`. |
| B3 | [CREATE] | **`src/tools/mcp/download_mail_content.ts`:** schema Zod dla `ids` (number \| string \| tablica), `action: "getMessages"`. |
| B4 | [MODIFY] | **`src/mcp/server.ts`:** zarejestrować `search_mail` i `download_mail_content`; zaktualizować nazwę/wersję serwera pod epizod (np. `s02e04-server`). |

### Faza C — Bootstrap agenta

| ID | Typ | Zadanie |
|----|-----|---------|
| C1 | [CREATE] | **`run.ts`** (lub `src/main.ts` — użyć jednej konwencji i `scripts.start`): wczytanie `system.md`, `createBoilerplateMcpServer` (lub nowa factory `createS02e04McpServer` jeśli wydzielisz), `createMcpClient`, złożenie `tools` + `handlers`, `createAgent`, `processQuery` z pełnym user query z `docs/context` (zadanie mailbox). |
| C2 | [MODIFY] | **`src/prompts/system.md`:** zastąpić szablon treścią domenową (zmail, operatory, verify, flaga, aktywna skrzynka, nazwy narzędzi). |
| C3 | [REUSE] | **Model:** domyślnie respektować `AGENT_MODEL` / research (np. tańszy flash); nie hardcodować drogiego modelu bez potrzeby. |

### Faza D — Testy i dokumentacja

| ID | Typ | Zadanie |
|----|-----|---------|
| D1 | [CREATE] | **Testy:** np. `src/tools/mcp/search_mail.test.ts`, `download_mail_content.test.ts` — mock `fetch` lub dependency injection punktu wywołania HTTP; asercje na payload `action` / `query` / `ids`. |
| D2 | [MODIFY] | **`README.md`** (w `tasks/s02e04/`): instrukcja startu, link do `docs/context/s02e04.md`, zmienne env. |
| D3 | [MODIFY] | **`CHANGELOG.md`** epizodu: wpis pod rzecząwistość wdrożenia. |

### Faza E — Opcjonalnie (po MVP)

| ID | Typ | Zadanie |
|----|-----|---------|
| E1 | [CREATE] | **`MemoryHooks`:** skrót „journal” znalezionych faktów w `beforeTurn`, jeśli w praktyce kontekst pęka przy długich runach. |

---

## 6. Bramki jakości (po każdej fazie lub przed merge)

Wykonać z `tasks/s02e04/`:

```bash
bun install
bun test
bunx tsc --noEmit
```

Opcjonalnie ręczny smoke: `bun --env-file=../.env run run.ts` z prawdziwymi kluczami (poza CI).

---

## 7. Changelog planu

| Data | Zmiana |
|------|--------|
| 2026-05-15 | Utworzenie planu po akceptacji researchu; scope: osobny pakiet, jedna pętla, MCP `search_mail` / `download_mail_content`, `http_request` dla help/inbox/thread. |
| 2026-05-15 | Faza E: `createMailboxMemoryHooks`, progi `MAILBOX_MEMORY_*`, testy `mailbox_memory.test.ts`. |

---

## 8. Checklist postępu (do odhaczania w trakcie `@eversis-implement`)

- [x] Faza A — A1, A2  
- [x] Faza B — B1, B2, B3, B4  
- [x] Faza C — C1, C2, C3  
- [x] Faza D — D1, D2, D3  
- [x] Faza E — E1 (`MemoryHooks` / `createMailboxMemoryHooks`)  
- [x] Kryteria akceptacji §4 — wszystkie punkty spełnione (MVP bez E1)  
- [x] Changelog planu — wpis 2026-05-15 (wdrożenie zgodne z planem)  
