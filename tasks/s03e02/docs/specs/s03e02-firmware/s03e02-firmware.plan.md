# Plan wdrożenia — S03E02: agent `firmware` (shell VM)

**Normatywny research:** [s03e02-firmware.research.md](s03e02-firmware.research.md) — zaakceptowany (2026-05-30).  
**Workspace:** `tasks/s03e02/` + aktualizacja `README.md` repo + `CHANGELOG.md`  
**Status:** Zrealizowany (2026-05-30) — fazy A–G done; E2E hub (H1) wymaga lokalnego `bun run start`.

**Weryfikacja UI:** brak — zadanie nie dotyczy frontendu ani Figma.

---

## 1. Zakres (scope)

**W zakresie:**

| Element | Opis |
| --- | --- |
| **`tasks/s03e02/`** | Nowy epizod npm `@ai-devs/s03e02` na `@ai-devs/agent-boilerplate` |
| **`shell_exec` MCP** | POST `https://hub.ag3nts.org/api/shell`, retry 503, obsługa ban |
| **Agent ReAct** | `shell_exec` + `submit_to_hub` + `finish_task` (**tylko te 3** — bez `read_file` / `http_request` / vision) |
| **`firmware_memory.ts`** | Wzorzec S03E01: `injectWorkingPlan` po ban / błędzie hub |
| **`run.ts`** | Planning turn 0, Langfuse (noop bez kluczy), wrapped handlers |
| **Prompty** | `system.md`, `firmware_task.md` |
| **Testy** | `shell_exec.test.ts`, `firmware_memory.test.ts`; `bun test` + `tsc` |
| **`tasks/s03e02/README.md`** | Start, env, architektura, jakość |
| **`README.md` (root)** | Wiersz `s03e02` w tabeli Tasks |
| **`CHANGELOG.md`** | Wpis `[Unreleased]` — epizod firmware |
| **Research** | Aktualizacja statusu + § Open Questions (rozwiązane) |

**Poza zakresem:**

- Zmiany w `@ai-devs/agent-boilerplate` (core)
- Deno code mode / `execute_code`
- Observational Memory, tool discovery
- Pipeline deterministyczny (brak sensu — VM eksploracyjna)
- E2E hub w CI (wymaga sekretów)
- `tasks/boilerplate/README.md` — opcjonalny cross-link (nie w tym planie)

---

## 2. Decyzje projektowe (human gate — rozwiązane)

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Scope docs repo | **Tak** — root `README.md` + `CHANGELOG.md` |
| 2 | Memory hook | **Od razu** — wzorzec S03E01 (`evaluation_memory.ts`) |
| 3 | Langfuse | **Włączone** w `run.ts` — `initTracing` / noop bez kluczy (jak S03E01) |

---

## 3. Skrót researchu (kontekst planu)

| Element | Opis |
| --- | --- |
| Cel | Uruchomić `/opt/firmware/cooler/cooler.bin`, uzyskać `ECCS-...`, submit `{ confirmation }` → `{FLG:...}` |
| Shell API | `POST /api/shell` — `{ apikey, cmd }` — **jedno polecenie na wywołanie** |
| Bezpieczeństwo VM | Zakaz `/etc`, `/root`, `/proc/`; respekt `.gitignore` → ban + reset VM |
| Model | Domyślnie `anthropic/claude-sonnet-4-6` (`AGENT_MODEL`) |
| Architektura | ReAct + 3 narzędzia; **nie** `createBoilerplateMcpServer()` (unikamy ekspozycji zbędnych MCP) |

---

## 4. Current Implementation Analysis

### Already Implemented (reuse)

| Komponent | Ścieżka | Zastosowanie |
| --- | --- | --- |
| `createAgent`, planning | `tasks/boilerplate/src/agent/` | Pętla ReAct |
| `fetchWithRetry` | `tasks/boilerplate/src/agent/ai.ts` | Shell + LLM retry |
| `executeSubmitToHub`, schema | `tasks/boilerplate/src/tools/mcp/submit_to_hub.ts` | Rejestracja w MCP epizodu |
| `injectWorkingPlan`, `MemoryHooks` | `@ai-devs/agent-boilerplate` | `firmware_memory.ts` |
| Langfuse subpath | `@ai-devs/agent-boilerplate/observability` | `run.ts` |
| Wzorzec epizodu | `tasks/s03e01/` | Struktura katalogów, `run.ts`, memory |

### To Be Created

| Komponent | Opis |
| --- | --- |
| `shell_exec.ts` | MCP handler + Zod schema |
| `createS03e02McpServer()` | Tylko `shell_exec` + `submit_to_hub` |
| `firmware_memory.ts` | Stan ban/hub + `beforeTurn` inject |
| `run.ts`, `config.ts`, prompty | Bootstrap agenta |
| Testy mock fetch | `shell_exec`, memory |

### To Be Modified

| Plik | Zmiana |
| --- | --- |
| `README.md` (root) | Wiersz `s03e02` |
| `CHANGELOG.md` | Wpis Added |
| `s03e02-firmware.research.md` | Status + resolved open questions |

---

## 5. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| Ban API (naruszenie VM) | Memory hook: revised plan + reguły bezpieczeństwa; `shell_exec` zwraca czytelny `banSeconds` |
| Agent wywołuje `http_request` / `read_file` | **Minimalny MCP server** — nie rejestrować boilerplate tools |
| `MAX_ITERATIONS` (domyślnie 10) za mało | `config.ts`: domyślnie `30`; env override w README |
| Koszt / czas (reasoning model) | Langfuse trace; krótkie prompty |
| Nieznany format odpowiedzi ban | Testy z fixture JSON; parsowanie defensywne + fallback message |
| Brak `HUB_API_KEY` | `shell_exec` / `submit_to_hub` → `mcpErr`; README |

---

## 6. Security Considerations

- **`HUB_API_KEY`** — tylko w env / handlerze MCP; **nigdy** w promptach markdown.
- **VM blacklist** — opis w prompcie; memory reinject po ban.
- **Brak lokalnego shell** — agent nie ma dostępu do hosta; wyłącznie hub shell API.
- **Truncation** — wyniki shell obcinane do `AGENT_MAX_TOOL_OUTPUT_CHARS` (domyślnie boilerplate) jeśli hub zwraca duże stdout.

---

## 7. Kryteria akceptacji (Definition of Done)

### MVP (Fazy A–F)

- [x] `bun install` + `bun test` + `bunx tsc --noEmit` z `tasks/s03e02/` przechodzą.
- [x] Agent ma **dokładnie 3** callable tools: `shell_exec`, `submit_to_hub`, `finish_task`.
- [x] `shell_exec`: POST shell API, retry 503, obsługa ban (sleep+retry lub opisowy błąd).
- [x] `enablePlanningPhase: true`; turn 0 bez tool calls.
- [x] `firmware_memory`: inject plan po ban i po błędzie hub (bez flagi).
- [x] Langfuse wired w `run.ts` (graceful bez kluczy).
- [x] Prompty: start `help`, reguły VM, sekwencyjność, submit shape.

### Docs + E2E (Faza G–H)

- [x] `tasks/s03e02/README.md` kompletny.
- [x] Root `README.md` — wpis `s03e02`.
- [x] `CHANGELOG.md` — wpis `[Unreleased]`.
- [x] Research zaktualizowany (status Implemented / w toku).
- [ ] Manual E2E: `bun run start` → hub `{FLG:...}` (wymaga `.env`, ~10–20 min).

---

## 8. Plan fazowy i zadania

Typy: `[CREATE]`, `[MODIFY]`, `[REUSE]`.

### Faza A — Pakiet i konfiguracja

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| A1 | [CREATE] | `package.json` — `@ai-devs/s03e02`, deps: boilerplate, MCP SDK, zod, Langfuse peers; scripts: `start`, `test`, `typecheck` | ✅ |
| A2 | [CREATE] | `config.ts` — re-export hub z boilerplate; `SHELL_API_URL`, `DEFAULT_AGENT_MODEL` (`anthropic/claude-sonnet-4-6`), `FIRMWARE_MAX_ITERATIONS` (30), `TRACING_SERVICE_NAME` | ✅ |
| A3 | [CREATE] | `tsconfig.json`, `index.ts` (re-export config) | ✅ |

**Szczegóły A2:**

```typescript
export const SHELL_API_URL =
  process.env["SHELL_API_URL"]?.trim() ?? "https://hub.ag3nts.org/api/shell";
export const FIRMWARE_MAX_ITERATIONS = posInt("AGENT_MAX_ITERATIONS", 30);
export const DEFAULT_AGENT_MODEL =
  process.env["AGENT_MODEL"]?.trim() ?? "anthropic/claude-sonnet-4-6";
```

---

### Faza B — `shell_exec` MCP

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| B1 | [CREATE] | `src/tools/mcp/shell_exec.ts` — schema `{ cmd }`, POST z `HUB_API_KEY`, retry 503, ban sleep+retry | ✅ |
| B2 | [CREATE] | `src/tools/mcp/shell_exec.test.ts` — mock `fetch`: success, ban, missing key | ✅ |

**Szczegóły B1 (handler):**

1. Walidacja `HUB_API_KEY`.
2. `fetchWithRetry(SHELL_API_URL, { method: POST, body: { apikey, cmd } })`.
3. Parse body — jeśli hub zwraca pole z czasem bana (np. sekundy / komunikat „ban”) → `sleep` w handlerze (max rozsądny cap, np. 120s) + **jeden** retry tej samej komendy.
4. Inaczej: strukturalny JSON dla agenta; błędy przez `mcpErr` z actionable text.

**Import:** `fetchWithRetry` z `@ai-devs/agent-boilerplate` (public export przez pakiet — jeśli brak exportu, import względny z `../boilerplate/src/agent/ai.js` **nie** — użyć tego samego wzorca co boilerplate internal: import z `@ai-devs/agent-boilerplate` — sprawdzić `package.json` exports; fallback: duplikacja cienkiego wrappera wywołującego `executeHttpRequest` wewnętrznie **nie** — preferowany import `fetchWithRetry` z głównego exportu boilerplate).

---

### Faza C — MCP server (minimalny)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| C1 | [CREATE] | `src/mcp/server.ts` — `createS03e02McpServer()`: **tylko** `shell_exec` + `submit_to_hub` | ✅ |
| C2 | [REUSE] | `submit_to_hub` z boilerplate — bez modyfikacji core | ✅ |

**Uwaga:** Nie używać `createBoilerplateMcpServer()` — ten rejestruje 4 domyślne narzędzia, co łamie wymaganie research (agent miałby `read_file`, `http_request`, vision).

---

### Faza D — Prompty

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| D1 | [CREATE] | `src/prompts/system.md` | ✅ |
| D2 | [CREATE] | `src/prompts/firmware_task.md` | ✅ |

**Szkic user query (planning on):**

```text
Rozpocznij firmware. Tura 0: plan eksploracji VM (help → cooler.bin → hasło → settings.ini → kod ECCS → submit). Potem wykonuj shell_exec sekwencyjnie aż hub zwróci {FLG:...}.
```

---

### Faza E — Memory hooks (S03E01 pattern)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| E1 | [CREATE] | `src/agent/firmware_memory.ts` | ✅ |
| E2 | [CREATE] | `beforeTurn`: inject plan po ban / błędzie hub | ✅ |
| E3 | [CREATE] | `src/agent/firmware_memory.test.ts` | ✅ |

**Revised plan (szkic):**

```text
Shell/hub attempt N failed (ban or verify error). VM may have reset.
Revised steps:
1. shell_exec: help — rediscover commands.
2. Avoid /etc, /root, /proc/ and .gitignore paths.
3. Explore /opt/firmware/cooler/, find password, fix settings.ini.
4. Run cooler.bin → capture ECCS-...
5. submit_to_hub(task_name: firmware, answer: { confirmation }) → finish_task on {FLG:...}.
```

---

### Faza F — Agent bootstrap (`run.ts`)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| F1 | [CREATE] | `run.ts` | ✅ |
| F2 | [REUSE] | Langfuse tracing | ✅ |
| F3 | [REUSE] | `finish_task` native handler | ✅ |

**Handlers (szkic):**

```typescript
if (t.name === "shell_exec") recordShellResult(text);
if (t.name === "submit_to_hub") recordHubSubmitResult(text);
```

**Agent config:**

```typescript
createAgent({
  ai: withTracingAdapter(baseAdapter, DEFAULT_AGENT_MODEL),
  instructions: [systemPrompt, firmwareTaskSpec].join("\n\n"),
  tools: [...mcpToolDefs, finishTaskToolDefinition],
  handlers,
  memory: createFirmwareMemoryHooks(),
  enablePlanningPhase: true,
  maxIterations: FIRMWARE_MAX_ITERATIONS,
  tracing,
});
```

---

### Faza G — Dokumentacja repo

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| G1 | [CREATE] | `tasks/s03e02/README.md` | ✅ |
| G2 | [MODIFY] | `README.md` (root) | ✅ |
| G3 | [MODIFY] | `CHANGELOG.md` | ✅ |
| G4 | [MODIFY] | `s03e02-firmware.research.md` | ✅ |

---

### Faza H — Weryfikacja E2E

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| H1 | [REUSE] | Manual: `cd tasks/s03e02 && bun run start` z `tasks/.env` | ⏳ pending |
| H2 | [REUSE] | Langfuse trace review (jeśli klucze) | ⏳ pending |

**Uwaga:** H1 wymaga aktywnego klucza hub + model reasoning; czas ~10–20 min. Nie blokuje merge testów jednostkowych.

---

## 9. Przepływ agenta (docelowy)

```text
Turn 0 (planning, no tools)
  └─ ## Working plan: help → explore → password → settings.ini → cooler.bin → ECCS → submit

Turn 1+: shell_exec (one cmd per turn)
  └─ help, ls, cat, edit commands per VM help output
  └─ (ban → memory inject + security reminder → resume from help)

Turn N: submit_to_hub({ task_name: "firmware", answer: { confirmation: "ECCS-..." } })
  └─ {FLG:...} → finish_task

(błąd verify → memory inject hub feedback → retry submit)
```

---

## 10. Bramki jakości

Z `tasks/s03e02/`:

```bash
bun install
bun test
bunx tsc --noEmit
bun run start    # E2E — wymaga tasks/.env
```

Po każdej fazie implementujący aktualizuje checkboxy w §8 i Changelog poniżej.

---

## 11. Kolejność wdrożenia

1. **A → B → C** — pakiet + shell_exec + MCP (testowalne izolowanie).
2. **D → E** — prompty + memory (można równolegle po C).
3. **F** — run.ts (integracja).
4. **G** — docs (można częściowo przed H).
5. **H** — E2E hub (manual gate końcowy).

---

## 12. Human gate

**Przed implementacją:** akceptacja tego planu (scope, fazy A–H, minimalny MCP server, docs repo).

**Po implementacji:** krótki review diff + potwierdzenie E2E `{FLG:...}` (H1).

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-05-30 | Plan początkowy — firmware epizod; human gate: README/CHANGELOG, memory S03E01, Langfuse on |
| 2026-05-30 | Fazy A–G zaimplementowane; 8 testów pass, tsc clean; H1/H2 E2E pending manual |
