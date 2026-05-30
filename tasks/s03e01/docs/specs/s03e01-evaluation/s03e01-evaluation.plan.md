# Plan wdrożenia — S03E01: agent `evaluation` (anomalie sensorów)

**Normatywny research:** [s03e01-evaluation.research.md](s03e01-evaluation.research.md)  
**Workspace:** `tasks/s03e01/`  
**Status:** Fazy A–D **zrealizowane** (hub `{FLG:BUGGYSYSTEM}`, 52 ID via pipeline). Faza E — **oczekuje akceptacji** przed implementacją.

**Weryfikacja UI:** brak — zadanie nie dotyczy frontendu ani Figma.

---

## 1. Zakres (scope)

**W zakresie (Fazy A–D — done):**

- Epizod npm `@ai-devs/s03e01` na `@ai-devs/agent-boilerplate` (ReAct + MCP).
- Pipeline deterministyczny + batch LLM:
  - `scan_sensors` — 10k plików, reguły pomiarowe (0 tokenów LLM w ReAct)
  - `classify_operator_notes` — batch po unikalnych notatkach (~2032), cache
  - `build_recheck` — merge pomiary + niespójność operatora
  - `submit_to_hub` — `task: evaluation`, `answer.recheck[]`
- Agent: `enablePlanningPhase: true`, Langfuse tracing, memory z feedbackiem hub.
- Skrypt `scripts/run-pipeline.ts` — bezpośrednia ścieżka solve (zweryfikowana).
- Testy jednostkowe reguł domenowych + `bunx tsc --noEmit`.

**W zakresie (Faza E — polish, po weryfikacji):**

- README epizodu, aktualizacja research/plan docs.
- Test integracyjny `scanSensors` (mały fixture).
- Ulepszenie retry po błędzie hub (`injectWorkingPlan`).
- Jednorazowa weryfikacja agenta (`run.ts`) + Langfuse.

**Poza zakresem:**

- Sandbox / code mode (QuickJS).
- Observational Memory, tool discovery.
- `@ai-devs/agent-evals` harness (osobna decyzja).
- E2E hub w CI (wymaga sekretów).

---

## 2. Skrót researchu (kontekst planu)

| Element | Opis |
| --- | --- |
| Cel | Znaleźć **wszystkie** pliki z anomaliami w ~10k JSON sensorów; submit `recheck[]` na hub. |
| Anomalie | Pomiar poza normą; nieaktywne pole ≠ 0; operator OK + złe dane; operator problem + OK dane. |
| Architektura | MCP tools (TS) + agent orkiestrujący; **nie** LLM per plik; **nie** sandbox. |
| Koszty | Scan programistyczny; klasyfikacja notatek batch + cache (`gpt-4o-mini`). |
| Observability | Langfuse opt-in (`initTracing`, `createTracingRuntime`). |

---

## 3. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| 10k plików w kontekście LLM | Narzędzia zwracają summary; `build_recheck` zwraca listę ID (≤52). |
| Klasyfikacja notatek ~4–5 min | Cache w `classifyNotes.ts`; agent wywołuje `classify_operator_notes` raz. |
| `neutral` sentiment (błąd parse LLM) | Faza E: log ostrzeżeń + opcjonalny retry batch. |
| Agent omija kolejność narzędzi | Prompty `system.md` + `evaluation_task.md` — twarda kolejność. |
| Brak `HUB_API_KEY` | `submit_to_hub` → `mcpErr`; README. |
| `MAX_ITERATIONS` (domyślnie 10) | Wystarczy na plan + 4 kroki; env override w README. |

---

## 4. Kryteria akceptacji (Definition of Done)

### Fazy A–D (MVP — spełnione)

- [x] `bun test` + `bunx tsc --noEmit` z `tasks/s03e01/` przechodzą.
- [x] `scan_sensors` wykrywa 46 anomalii pomiarowych na lokalnych danych.
- [x] Pipeline: `bun run pipeline` → hub `{FLG:BUGGYSYSTEM}` (52 ID).
- [x] Agent bootstrap: `run.ts` z planning, tracing, memory, MCP (scan/classify/build/submit).
- [x] Brak sandbox / OM / tool discovery.

### Faza E (polish — zrealizowane)

- [x] `README.md` epizodu (start, env, architektura, dwa tryby: agent vs pipeline).
- [x] Research § Gap Analysis zaktualizowany (stan po implementacji).
- [x] Test integracyjny `scanSensors` na mini-fixture (≥2 pliki, reguły pomiarowe).
- [x] `evaluation_memory`: po błędzie hub aktualizacja `## Working plan` (`injectWorkingPlan`).
- [x] `classifyNotes`: log + retry gdy batch parse niepełny.
- [x] Usunięcie martwego kodu (`summarizeRecheck`).
- [x] `run.ts` uruchomiony E2E; trace w Langfuse (E7 — agent → `{FLG:BUGGYSYSTEM}`, 52 ID; classify MCP timeout ×4, cache z pierwszego wywołania).

---

## 5. Plan fazowy i zadania

Typy: `[CREATE]`, `[MODIFY]`, `[REUSE]`.

### Faza A — Pakiet i konfiguracja ✅

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| A1 | [CREATE] | `package.json` — `@ai-devs/s03e01`, deps boilerplate + Langfuse peers, scripts `start` / `pipeline` / `test` / `typecheck` | ✅ |
| A2 | [CREATE] | `config.ts` — re-export hub, `DEFAULT_SENSORS_DIR`, `NOTE_CLASSIFIER_MODEL`, `TRACING_SERVICE_NAME` | ✅ |
| A3 | [CREATE] | `tsconfig.json`, `index.ts` (re-export config) | ✅ |

### Faza B — Logika domenowa ✅

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| B1 | [CREATE] | `src/domain/sensorRules.ts` — zakresy, `hasMeasurementAnomaly`, `normalizeSensorId` | ✅ |
| B2 | [CREATE] | `src/domain/scanSensors.ts` — skan katalogu, grupy `operator_notes`, profile all_ok/all_bad/mixed | ✅ |
| B3 | [CREATE] | `src/domain/classifyNotes.ts` — batch LLM, cache, sentiment ok/problem/neutral | ✅ |
| B4 | [CREATE] | `src/domain/buildRecheck.ts` — merge ID, reguła per plik (mixed groups) | ✅ |
| B5 | [CREATE] | `src/domain/sensorRules.test.ts` — testy reguł + merge | ✅ |

### Faza C — MCP i stan sesji ✅

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| C1 | [CREATE] | `src/evaluationState.ts` — `lastScan`, mapa sentimentów między tool calls | ✅ |
| C2 | [CREATE] | `src/tools/mcp/scan_sensors.ts` | ✅ |
| C3 | [CREATE] | `src/tools/mcp/classify_operator_notes.ts` | ✅ |
| C4 | [CREATE] | `src/tools/mcp/build_recheck.ts` | ✅ |
| C5 | [CREATE] | `src/mcp/server.ts` — `createS03e01McpServer()` na boilerplate + 3 narzędzia | ✅ |

### Faza D — Agent, prompty, walidacja ✅

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| D1 | [CREATE] | `src/prompts/system.md`, `evaluation_task.md` | ✅ |
| D2 | [CREATE] | `src/agent/evaluation_memory.ts` — hub feedback w instructions | ✅ |
| D3 | [CREATE] | `run.ts` — planning, Langfuse, wrapped handlers, `finish_task` | ✅ |
| D4 | [CREATE] | `scripts/run-pipeline.ts` — bezpośredni solve (scan → classify → submit) | ✅ |
| D5 | [REUSE] | Hub verify — pipeline → `{FLG:BUGGYSYSTEM}` | ✅ |

### Faza E — Utwardzenie i dokumentacja ✅

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| E1 | [CREATE] | **`README.md`** | ✅ |
| E2 | [MODIFY] | Research § Gap Analysis | ✅ |
| E3 | [CREATE] | `scanSensors.test.ts` + fixtures | ✅ |
| E4 | [MODIFY] | `evaluation_memory.ts` — `injectWorkingPlan` | ✅ |
| E5 | [MODIFY] | `classifyNotes.ts` — log + retry parse | ✅ |
| E6 | [MODIFY] | Usunięto `summarizeRecheck` | ✅ |
| E7 | [REUSE] | E2E agent `bun run start` | ✅ — `{FLG:BUGGYSYSTEM}`, ~4.5 min |

---

### Faza E — DoD (zaktualizowane)

- [x] `README.md` epizodu
- [x] Research § Gap Analysis zaktualizowany
- [x] Test integracyjny `scanSensors` (fixture)
- [x] `evaluation_memory`: `injectWorkingPlan` przy błędzie hub
- [x] `classifyNotes`: log + retry przy niepełnym parse
- [x] Usunięto martwy kod `summarizeRecheck`
- [x] E2E agent + Langfuse (wymaga lokalnego `bun run start`)

---

## 6. Przepływ agenta (docelowy)

```text
Turn 0 (planning, tool_choice: none)
  └─ ## Working plan: scan → classify → build → submit

Turn 1: scan_sensors
  └─ summary: 46 meas anomalies, 2032 unique notes

Turn 2: classify_operator_notes
  └─ batch LLM (~4–5 min), cache

Turn 3: build_recheck
  └─ recheck[52]

Turn 4: submit_to_hub({ task_name: "evaluation", answer: { recheck } })
  └─ {FLG:...} → finish_task

(błąd hub → memory inject feedback + revised plan → build/submit)
```

---

## 7. Bramki jakości

Z `tasks/s03e01/`:

```bash
bun install
bun test
bunx tsc --noEmit
bun run pipeline          # solve (hub)
# opcjonalnie po Fazie E:
bun run start             # agent E2E
```

---

## 8. Kolejność wdrożenia Fazy E

1. **E1 + E2** — dokumentacja (niski koszt, odblokowuje onboarding).
2. **E3** — test integracyjny scan (regresja reguł).
3. **E4 + E5 + E6** — poprawki memory / classify / dead code.
4. **E7** — E2E agent + Langfuse (wymaga `.env` i ~5–10 min runtime).

---

## 9. Human gate

**Fazy A–D:** zaakceptowane i zaimplementowane (weryfikacja 2026-05-30: PASS).

**Faza E:** zakończona (2026-05-30). E7: agent E2E → `{FLG:BUGGYSYSTEM}` (~4.5 min).

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-05-30 | Plan początkowy (fazy 1–4) |
| 2026-05-30 | Rozbudowa do formatu eversis; fazy A–D oznaczone done; dodana Faza E (polish) po weryfikacji |
| 2026-05-30 | Faza E: README, testy scan/memory, injectWorkingPlan, classify retry, dead code removal |
| 2026-05-30 | E7: `bun run run.ts` → hub `{FLG:BUGGYSYSTEM}` (52 recheck); classify MCP timeout, agent retry + cache |
