# S03E02 — firmware (shell VM) — research

**Task:** Zaprojektować optymalne rozwiązanie zadania domowego `firmware` w `tasks/s03e02/` z użyciem `@ai-devs/agent-boilerplate`.

**Data:** 2026-05-30  
**Status:** Implemented — epizod `tasks/s03e02/` (testy + tsc PASS); E2E hub pending manual run.

**Źródła:**

- `markdowns/s03e02-ograniczenia-modeli-na-etapie-zalozen-projektu-1774278041.md` — **kanoniczny opis zadania `firmware`** (§ Zadanie, wskazówki)
- `markdowns/s02e02-zewnetrzny-kontekst-narzedzi-i-dokumentow-1773818117.md` — lekcja S02E02 (RAG); **nie zawiera** specyfikacji `firmware` (homework tej lekcji to `electricity`)
- `tasks/boilerplate/` — runtime ReAct, `http_request`, `submit_to_hub`, planning, tracing
- `tasks/boilerplate/docs/specs/s03e02-model-constraints/` — werdykt: firmware = epizod, nie rozszerzenie core
- `tasks/s03e01/` — wzorzec epizodu na boilerplate (MCP rozszerzenia, prompty, `run.ts`)
- `tasks/s02e02/` — wzorzec zadania agentowego kursowego (custom loop — **do unikania**; preferuj `createAgent`)

**Weryfikacja UI:** brak.

---

## Task Details

| Field | Value |
| --- | --- |
| Task ID | `firmware` |
| Hub verify | `POST https://hub.ag3nts.org/verify` |
| Answer shape | `{ "confirmation": "<ECCS-...>" }` |
| Success code format | `ECCS-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (40 hex po prefiksie) |
| Shell API | `POST https://hub.ag3nts.org/api/shell` |
| Shell body | `{ "apikey": "<HUB_API_KEY>", "cmd": "<polecenie>" }` |
| Target binary | `/opt/firmware/cooler/cooler.bin` |
| Config file | `settings.ini` (w katalogu oprogramowania — ścieżka do ustalenia przez eksplorację) |

### Kroki biznesowe (z opisu zadania)

1. Uruchomić `cooler.bin` (wystarczy podać ścieżkę).
2. Zdobyć hasło (zapisane w kilku miejscach w VM).
3. Przekonfigurować `settings.ini`, aby chłodzenie działało poprawnie.
4. Opcjonalnie `reboot` po „zbyt mocnym namieszaniu”.
5. Odesłać kod `ECCS-...` przez `submit_to_hub`.

### Zasady bezpieczeństwa VM (krytyczne)

| Reguła | Konsekwencja naruszenia |
| --- | --- |
| Konto zwykłego użytkownika | — |
| **Zakaz** `/etc`, `/root`, `/proc/` | Ban API + reset VM do stanu początkowego |
| Respektuj `.gitignore` w katalogach | Ban + reset |
| Niestandardowy shell (nie pełny Linux) | Agent musi zacząć od `help` |

---

## Business Impact

Zadanie domknięcia fabuły S03 (ECCS / chłodzenie) i ilustracja lekcji S03E02: **wąski zakres narzędzi**, **sekwencyjne HTTP**, **model reasoning**, **obsługa ban/rate limit** — bez code mode i bez multi-agent heartbeat. Rozwiązanie ma być utrzymywalne jako kolejny epizod kursowy na wspólnym runtime.

---

## Gathered Information

### Wymagania z opisu zadania (S03E02)

**Podejście zalecane przez autorów kursu:**

- Pętla agentowa ReAct + Function Calling.
- **Dwa narzędzia operacyjne:** shell (jedno polecenie = jedno HTTP) + submit do huba.
- Planowanie **sekwencyjne** — nie równoległe wywołania shell.
- Model: `anthropic/claude-sonnet-4-6` (adaptacja do nieznanego API).
- Start od `help` — niestandardowy zestaw komend (edycja plików ≠ standardowy Linux).
- Obsługa błędów: rate limit, 503, **ban** (czasowy) — agent lub warstwa narzędzia.

**Czego zadanie nie wymaga:**

- Indeksowania / RAG (S02E02).
- Batch deterministycznego skanowania tysięcy plików (S03E01).
- Deno `execute_code` / sandbox lokalny (lekcja `03_02_code`).
- Vision / PNG (S02E02 `electricity`).

### Uwaga o pliku źródłowym w zapytaniu

Ścieżka `markdowns/s02e02-zewnetrzny-kontekst-...md` odnosi się do lekcji **S02E02** (kontekst zewnętrzny, embedding, hybrid RAG). Zadanie **`firmware`** jest opisane w **`markdowns/s03e02-ograniczenia-modeli-...md`**. Research opiera się na S03E02 jako źródle prawdy.

### Codebase — boilerplate (reuse)

| Komponent | Stan | Zastosowanie w firmware |
| --- | --- | --- |
| `createAgent` + ReAct | ✅ default | Główna pętla |
| `createAIAdapter` + retry 429/503 | ✅ default | Wywołania LLM |
| `fetchWithRetry` | ✅ w `ai.ts` / `http_request` | Retry shell API przy 503 |
| `createBoilerplateMcpServer` | ✅ | Baza MCP + `submit_to_hub` |
| `submit_to_hub` | ✅ | `task_name: "firmware"`, `answer: { confirmation }` |
| `finish_task` | ✅ native | Po `{FLG:...}` |
| `enablePlanningPhase` | ✅ opt-in | Turn 0: plan eksploracji VM (**zalecane**) |
| `createObservationalMemoryHooks` | ✅ opt-in | **Nie** — sesja krótsza niż próg OM |
| `toolDiscovery` | ✅ opt-in | **Nie** — ≤3 narzędzia |
| `read_file` | ✅ default MCP | **Nie** eksponować — VM jest zdalna, nie lokalny FS |
| `http_request` (generyczne) | ✅ default MCP | **Nie** eksponować agentowi — zła abstrakcja dla shell |
| Langfuse `observability/` | ✅ opt-in | Debug kosztów / tur (jak S03E01) |

### Codebase — epizody referencyjne

| Epizod | Wzorzec | Stosunek do firmware |
| --- | --- | --- |
| `tasks/s03e01/` | Boilerplate + domenowe MCP + prompty + opcjonalne memory hooks | **Szablon struktury** `tasks/s03e02/` |
| `tasks/s02e04/` | Planning + submit loop + memory po feedbacku hub | Wzorzec **inject plan** po błędzie (opcjonalnie) |
| `tasks/s02e02/` | Custom OpenRouter loop + domenowe narzędzia | **Antywzorzec** — nie kopiować własnego agent loop |
| `lessons/03_02_code/` | Deno sandbox + batch MCP | **Poza scope** — shell to zewnętrzne API |

### Stan implementacji

| Element | Stan |
| --- | --- |
| `tasks/s03e02/` | **Brak** — do utworzenia |
| MCP `shell_exec` | **Brak** — do dodania w epizodzie |
| Research S03E02 constraints | ✅ [s03e02-model-constraints.research.md](../../../boilerplate/docs/specs/s03e02-model-constraints/s03e02-model-constraints.research.md) |

---

## Analiza podejść — werdykt

### Porównanie architektur

| Podejście | Zalety | Wady | Werdykt |
| --- | --- | --- | --- |
| **A. ReAct + MCP `shell_exec` + `submit_to_hub` (boilerplate)** | Zgodne z wskazówkami kursu; ukryty `apikey`; typowane `cmd`; ban/503 w handlerze; łatwy maintenance | Koszt tokenów; zależność od modelu reasoning | **✅ Optymalne** |
| **B. Generyczne `http_request` dla agenta** | Zero kodu epizodu | Agent musi znać URL i body; więcej błędów; gorsze komunikaty ban | ❌ |
| **C. Deno `execute_code` (code mode)** | Mniej tur ReAct teoretycznie | Over-engineering; ryzyko ban na złych ścieżkach; zależność Deno; **sprzeczne z profilem zadania** | ❌ |
| **D. Pre-skryptowany pipeline TS (bez agenta)** | Tanie, szybkie | VM ma niestandardowe komendy i ukryte hasła — pipeline łamie się przy zmianach hub | ❌ |
| **E. Multi-agent / heartbeat (lekcja events)** | Skalowalne dla wielu zadań | Overkill dla jednej VM | ❌ |
| **F. Hybrid: agent + deterministyczny wrapper tylko na submit** | Submit zawsze poprawny shape | Shell nadal musi być agentowy | ⚠️ Opcjonalnie — submit już w `submit_to_hub` |

### Rekomendacja architektury (docelowa)

```text
tasks/s03e02/
├── run.ts                    # bootstrap (jak s03e01/run.ts)
├── config.ts                 # model, MAX_ITERATIONS, tracing
├── package.json              # "@ai-devs/agent-boilerplate": "file:../boilerplate"
├── src/
│   ├── mcp/server.ts         # createBoilerplateMcpServer() + shell_exec
│   ├── tools/mcp/shell_exec.ts
│   ├── prompts/
│   │   ├── system.md
│   │   └── firmware_task.md
│   └── agent/
│       └── firmware_memory.ts   # opcjonalnie: inject plan po ban / błędzie hub
```

**Narzędzia widoczne dla agenta (3):**

| Narzędzie | Rola |
| --- | --- |
| `shell_exec` | `{ cmd: string }` → POST shell API, jedno polecenie |
| `submit_to_hub` | `{ task_name: "firmware", answer: { confirmation: "ECCS-..." } }` |
| `finish_task` | Po `{FLG:...}` |

**Nie rejestrować:** `read_file`, `http_request`, `analyze_image_vision`, meta discovery.

### Projekt `shell_exec` (kluczowy element epizodu)

| Aspekt | Decyzja |
| --- | --- |
| Transport | `fetchWithRetry(SHELL_URL, POST)` — reuse z boilerplate |
| Auth | `HUB_API_KEY` z `config.js` — **nie** w promptcie |
| Input | `z.object({ cmd: z.string().min(1) })` |
| Output | JSON: `{ ok, status, stdout/stderr or hub payload, banSeconds? }` |
| 503 / rate limit | Retry w `fetchWithRetry` (domyślnie 5 prób, backoff) |
| Ban | Parsuj odpowiedź huba; jeśli znany czas oczekiwania — **sleep w handlerze** i jeden retry; inaczej opisowy `mcpErr` dla agenta |
| Sekwencyjność | Opis w prompcie + krótki opis narzędzia — **nie** batch w jednym wywołaniu |

### Konfiguracja agenta

| Parametr | Rekomendacja | Uzasadnienie |
| --- | --- | --- |
| `AGENT_MODEL` | `anthropic/claude-sonnet-4-6` | Wskazówka kursu; reasoning + adaptacja |
| `MAX_ITERATIONS` | `25`–`35` | Wiele tur shell (help, ls, cat, edycja, reboot) |
| `enablePlanningPhase` | `true` | Turn 0: plan bez dotykania VM |
| OM / toolDiscovery | `false` | Profil „≤4 narzędzia, ≤5 tur planu” — tu więcej tur, ale nadal jeden agent |
| Langfuse | opt-in | Jak S03E01 — bez kluczy = noop |

### Prompty (wymagania merytoryczne)

**system.md + firmware_task.md** powinny zawierać:

1. Cel: uruchomić chłodzenie, uzyskać `ECCS-...`, submit.
2. **Zacznij od `help`** — nie zakładaj standardowego Linuxa.
3. Zakazane ścieżki: `/etc`, `/root`, `/proc/` + reguła `.gitignore`.
4. Jedno polecenie na wywołanie `shell_exec`.
5. Po uzyskaniu kodu: `submit_to_hub` z `confirmation`, potem `finish_task` przy fladze.
6. Po ban: VM zresetowana — kontynuuj ostrożniej (ew. nowy plan w memory hook).

**Nie umieszczać w prompcie:** `HUB_API_KEY`, pełnych URL-i z kluczem (shell URL OK bez klucza).

---

## Current Implementation Status

### Existing Components

| Komponent | Plik | Status |
| --- | --- | --- |
| ReAct runtime | `tasks/boilerplate/src/agent/agent.ts` | Reuse |
| Hub submit | `tasks/boilerplate/src/tools/mcp/submit_to_hub.ts` | Reuse |
| HTTP retry | `tasks/boilerplate/src/agent/ai.ts` | Reuse w `shell_exec` |
| Epizod firmware | — | **Do utworzenia** |
| `shell_exec` | — | **Do utworzenia** |

### Key Files and Directories

- `tasks/boilerplate/` — runtime
- `tasks/s03e01/run.ts` — wzorzec bootstrap
- `tasks/s03e01/src/mcp/server.ts` — wzorzec rejestracji MCP
- `tasks/docs/boilerplate-documentation.md` §2.1 — wzorzec projektowy „shell/API homework”

---

## Gap Analysis

### G1 — Plik markdown w zapytaniu vs kanoniczne źródło

**Pytanie:** Czy intent to wyłącznie `firmware` (S03E02), czy także integracja z treścią S02E02 (RAG)?

**Odpowiedź (research):** Zadanie `firmware` jest **wyłącznie** w S03E02. S02E02 nie dostarcza wymagań implementacyjnych dla firmware. **Zakładamy scope = epizod `tasks/s03e02/` na boilerplate.**

### G2 — Rozszerzenie boilerplate vs epizod

**Pytanie:** Czy `shell_exec` trafić do `@ai-devs/agent-boilerplate`?

**Odpowiedź (research):** **Nie.** [s03e02-model-constraints.research.md](../../../boilerplate/docs/specs/s03e02-model-constraints/s03e02-model-constraints.research.md) — cienki wrapper specyficzny dla homework; `http_request` w core wystarczy jako implementacja wewnętrzna.

### G3 — Memory hooks po ban

**Pytanie:** Czy implementować `firmware_memory.ts` (jak `evaluation_memory.ts`)?

**Odpowiedź (research):** **Opcjonalne (nice-to-have).** Ban resetuje VM — krótki inject „## Working plan” z przypomnieniem reguł bezpieczeństwa może zmniejszyć powtórne bany. Nie blokuje MVP.

### G4 — Weryfikacja E2E bez klucza w repo

**Pytanie:** Jak akceptować „done”?

**Odpowiedź (research):** Manualny run `bun --env-file=../.env run run.ts` + hub `{FLG:...}`; `bun test` dla `shell_exec` (mock fetch); `tsc --noEmit`. Bez klucza — testy jednostkowe mockują API.

---

## User Stories

| ID | Jako… | Chcę… | Aby… | Priorytet |
| --- | --- | --- | --- | --- |
| FW-1 | student | uruchomić agenta firmware jednym poleceniem | rozwiązać homework S03E02 | Must |
| FW-2 | student | widzieć `[MYŚL]`/`[AKCJA]`/`[WYNIK]` | debugować sekwencję shell | Must |
| FW-3 | maintainer | MCP `shell_exec` z retry i czytelnym ban | agent nie zapętlał się na 503 | Must |
| FW-4 | student | planning turn 0 | zaplanować eksplorację przed `help` | Should |
| FW-5 | maintainer | opcjonalny Langfuse | analiza kosztów solve | Could |
| FW-6 | maintainer | memory hook po ban | mniej powtórnych naruszeń | Could |

---

## Acceptance Criteria (Definition of Done — research level)

- [ ] Epizod `tasks/s03e02/` korzysta z `@ai-devs/agent-boilerplate` (`createAgent`, nie custom loop).
- [ ] Agent ma **wyłącznie** `shell_exec`, `submit_to_hub`, `finish_task`.
- [ ] `shell_exec` używa `HUB_API_KEY` programistycznie; obsługuje 503 (retry) i ban (komunikat lub sleep+retry).
- [ ] Prompty w `src/prompts/*.md` — reguły bezpieczeństwa VM + start od `help`.
- [ ] Model domyślnie reasoning (`claude-sonnet-4-6` lub env).
- [ ] Hub verify z `{ confirmation: "ECCS-..." }` zwraca `{FLG:...}`.
- [ ] `bun test` + `bunx tsc --noEmit` w `tasks/s03e02/`.
- [ ] **Brak** zmian w core boilerplate (poza ewentualnym cross-linkiem w docs — osobny scope).

---

## Assumptions

- Specyfikacja VM (dokładne komendy po `help`, format `settings.ini`) jest **dynamiczna** po stronie huba — rozwiązanie musi być **agentowe**, nie hardcoded pipeline.
- `tasks/.env` zawiera `HUB_API_KEY` i klucz LLM (OpenRouter lub OpenAI).
- Użytkownik akceptuje, że kanoniczny opis zadania to **S03E02**, nie S02E02.

---

## Open Questions (dla human gate) — rozwiązane

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Scope implementacji | **Epizod + root `README.md` + `CHANGELOG.md`** |
| 2 | Memory hook po ban | **Od razu** — wzorzec S03E01 (`firmware_memory.ts`) |
| 3 | Langfuse | **Włączone** w `run.ts` (noop bez kluczy) |

---

## Suggested Next Steps

1. **Human gate:** akceptacja tego research (architektura A + struktura epizodu).
2. Plan: `s03e02-firmware.plan.md` — fazy MVP (shell_exec → prompty → run.ts → E2E hub).
3. Implementacja w `tasks/s03e02/` — **bez** rozszerzania `@ai-devs/agent-boilerplate`.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-05-30 | Research początkowy — optymalne rozwiązanie firmware na boilerplate |
| 2026-05-30 | Human gate: README/CHANGELOG, memory S03E01, Langfuse — plan w s03e02-firmware.plan.md |
