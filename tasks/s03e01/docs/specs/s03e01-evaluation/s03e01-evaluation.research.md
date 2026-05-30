# S03E01 — evaluation (anomalie sensorów) — research

**Task:** Zaprojektować rozwiązanie zadania domowego `evaluation` w `tasks/s03e01/` z użyciem `@ai-devs/agent-boilerplate`.

**Data:** 2026-05-30  
**Status:** Implemented — hub verified (`{FLG:BUGGYSYSTEM}`, 52 IDs).

**Źródła:**

- `markdowns/s03e01-obserwowanie-i-ewaluacja-1774206984.md` — opis zadania + wskazówki (Base64)
- `tasks/s03e01/sensors/` — 9999 plików JSON (lokalna kopia danych z hub)
- `tasks/boilerplate/` — runtime ReAct, planning, tracing, OM
- `tasks/boilerplate/docs/specs/sandbox-code-execution/` — code mode poza boilerplate
- `tasks/boilerplate/docs/specs/agent-observability-evals/` — Langfuse / evals
- `tasks/s02e04/` — wzorzec epizodu: planning + `submit_to_hub` loop
- `tasks/s02e03/` — wzorzec: verify loop + aktualizacja planu po feedbacku hub

---

## Task Details

| Field | Value |
| --- | --- |
| Task ID | `evaluation` |
| Hub endpoint | `POST https://hub.ag3nts.org/verify` |
| Answer shape | `{ "recheck": ["0001", "0002", ...] }` |
| Success | Hub zwraca `{FLG:...}` |
| Data | ~10 000 plików JSON (`sensors/{id}.json`) |

## Business Impact

Zadanie ilustruje temat lekcji S03E01: **optymalizacja kosztów agenta** (batch, cache, podział deterministyczny vs LLM) oraz **obserwowalność** (tracing do debugowania pętli verify). Rozwiązanie ma być tanie w tokenach i deterministycznie kompletne (hub wymaga **wszystkich** ID anomalii w jednym submit).

---

## Gathered Information

### Wymagania z opisu zadania

**Anomalie (4 typy):**

1. Pomiary poza normą (zakresy w opisie zadania).
2. Operator twierdzi OK, dane są złe.
3. Operator twierdzi, że znalazł błędy / problem, dane są OK.
4. Czujnik zwraca wartości w polach, które nie należą do `sensor_type` (nieaktywne pole ≠ 0).

**Zakresy aktywnych pól:**

| Pole | Min | Max |
| --- | --- | --- |
| `temperature_K` | 553 | 873 |
| `pressure_bar` | 60 | 160 |
| `water_level_meters` | 5.0 | 15.0 |
| `voltage_supply_v` | 229.0 | 231.0 |
| `humidity_percent` | 40.0 | 80.0 |

**Wskazówki (Base64):**

1. LLM ma cache — Ty też możesz cache'ować odpowiedzi modelu; część danych się powtarza.
2. Klasyfikacja **wszystkich** plików przez LLM nie jest optymalna kosztowo — część da się odrzucić programistycznie.

### Analiza danych lokalnych (`sensors/`)

Skan 9999 plików (Bun, reguły deterministyczne):

| Metryka | Wartość |
| --- | --- |
| Pliki łącznie | 9999 |
| Anomalie pomiarowe (typy 1 + 4) | **46** |
| Unikalne `operator_notes` | **2032** |
| Notatki tylko przy OK pomiarach | 1986 szablonów |
| Notatki tylko przy złych pomiarach | 39 szablonów |
| Notatki „mieszane” (ten sam tekst, różny status pomiaru) | 7 szablonów |

**Wniosek:** ~99,5% plików ma poprawne pomiary według reguł liczbowych. Większość pracy to **semantyka notatek operatora**, ale można ją batchować po **unikalnym tekście notatki** (2032 wywołań zamiast 9999).

### Codebase

| Komponent | Stan | Zastosowanie |
| --- | --- | --- |
| `tasks/s03e01/` | Tylko `sensors/*.json` | Brak `index.ts`, agenta, MCP |
| `@ai-devs/agent-boilerplate` | Gotowy | ReAct, planning, tracing, submit_to_hub |
| `@ai-devs/agent-evals` | Osobny pakiet | Offline evals — **nie** w ścieżce solve |
| Code mode / QuickJS sandbox | Lekcje only | Nie w boilerplate |
| `tasks/s02e04` | Pełny epizod | Planning + mailbox memory + hub |
| `tasks/s02e03` | failure agent | Verify loop + plan update |

---

## Analiza propozycji użytkownika

### Proponowany flow

1. Agent czyta zadanie → plan.
2. Sandbox: funkcja filtrująca pliki (mniej tokenów).
3. LLM analizuje pozostałe pliki (gpt-4o).
4. Składa tablicę `recheck`.
5. `submit_to_hub` → flaga = koniec; błąd = nowy plan + pętla.

### Ocena per feature

| Feature | Werdykt | Uzasadnienie |
| --- | --- | --- |
| **Planning (`enablePlanningPhase`)** | ✅ Tak | Multi-step pipeline; turn 0 bez kosztu iteracji ReAct |
| **Sandbox (QuickJS / code mode)** | ⚠️ Zmień podejście | Code mode nie jest w boilerplate; filtrowanie to **deterministyczna logika** — lepiej jako **MCP tool w TS** niż kod generowany przez LLM w sandboxie |
| **Tool discovery** | ❌ Nie | ≤5 narzędzi w epizodzie; discovery zwiększa złożoność bez korzyści |
| **Memory (custom hooks)** | ✅ Tak (lekko) | Trzymać `recheck`, ostatni feedback hub, licznik prób między submitami |
| **Observational Memory** | ❌ Nie | Jednorazowy batch, brak długiej konwersacji; OM kompresuje historię chatu, nie pliki JSON |
| **Langfuse tracing** | ✅ Opcjonalnie | Zgodne z lekcją S03E01; pomaga debugować pętlę verify; nie wpływa na poprawność odpowiedzi |
| **gpt-4o na każdy plik** | ❌ Nie | 9999 × output = drogo; wskazówka kursu mówi batch + cache |
| **submit_to_hub + retry plan** | ✅ Tak | Wzorzec z s02e04/s02e03; hub zwraca brakujące/nadmiarowe ID |

---

## Rekomendowana architektura (optymalna)

### Podział odpowiedzialności (zgodnie ze wskazówką kursu)

```text
Warstwa 1 — deterministyczna (TypeScript MCP, 0 tokenów LLM)
  • parse sensor_type → aktywne pola
  • sprawdź zakresy + nieaktywne ≠ 0
  • zwróć: ids_meas_anomaly[], mapa note_text → [file_ids] + flaga meas_ok/meas_bad

Warstwa 2 — LLM (batch po unikalnej notatce, min. output)
  • dla każdego unikalnego operator_notes (2032):
      input: tekst notatki + kontekst (czy pomiary OK w próbce)
      output: { sentiment: "ok"|"problem"|"neutral" }  ← 1 token enum
  • cache w Map<note, sentiment> (wskazówka 1)
  • reguła: sentiment=ok && meas_bad → anomaly; sentiment=problem && meas_ok → anomaly

Warstwa 3 — agent ReAct (orkiestracja)
  • turn 0: plan (planning phase)
  • scan_all_sensors → classify_notes_batch → merge_recheck → submit_to_hub
  • po błędzie hub: zaktualizuj plan (injectWorkingPlan / memory hook), targeted rescan

Warstwa 4 — observability (opcjonalna)
  • initTracing + sessionId; debug kosztów i tur verify
```

### Narzędzia MCP (propozycja)

| Tool | Rola |
| --- | --- |
| `scan_sensors` | Pełny skan katalogu; zwraca anomalie pomiarowe + grupy notatek |
| `classify_operator_notes` | Batch LLM (wewnętrznie `chat()`); cache; zwraca anomalie semantyczne |
| `submit_to_hub` | Standard boilerplate; `task_name: "evaluation"` |
| `finish_task` | Po `{FLG:...}` |

**Nie potrzebujesz:** `read_file` × 9999, sandbox QuickJS, tool discovery.

### Model

| Etap | Model | Dlaczego |
| --- | --- | --- |
| ReAct orchestration | `gpt-4.1-mini` / domyślny z config | Kilka tur, proste decyzje |
| Klasyfikacja notatek | `gpt-4o-mini` (structured output) | Tani input, **minimalny output** (enum) |
| gpt-4o | Opcjonalnie | Tylko dla 7 „mieszanych” szablonów notatek, jeśli mini zawodzi |

### Pętla verify

Hub przy niepełnej liście zwykle wskazuje brakujące/nadmiarowe ID (wzorzec z innych zadań kursu):

1. Parsuj body odpowiedzi `submit_to_hub`.
2. Zapisz w memory hook: `missing[]`, `extra[]`, `attempt`.
3. Zaktualizuj `## Working plan` (nie pełny re-plan od zera).
4. Rescan: tylko podejrzane ID / ponowna klasyfikacja wątpliwych notatek.
5. Max prób (np. 5–10) jak w s02e03.

---

## Poprawki względem oryginalnego pomysłu

| # | Było | Powinno być |
| --- | --- | --- |
| 1 | Agent tworzy funkcję w sandbox | **Developer/tool:** `scan_sensors` w TS; agent **wywołuje**, nie generuje filtr |
| 2 | LLM analizuje każdy plik | **Batch po 2032 unikalnych notatach** + cache; pomiary w 100% programistycznie |
| 3 | gpt-4o everywhere | Mini na klasyfikację; mały output (`ok`/`problem`) |
| 4 | toolDiscovery | Wyłączone — mało narzędzi |
| 5 | OM | Wyłączone — nie ten problem |
| 6 | Langfuse | Włącz opcjonalnie (cel edukacyjny S03E01), nie blokuje solve |
| 7 | Nowy plan po błędzie | **Aktualizacja planu** + targeted fix, nie restart całego pipeline |

---

## Gap Analysis

### Stan obecny (2026-05-30)

- [x] Epizod `tasks/s03e01/` — `run.ts`, MCP, prompty, domain, pipeline
- [x] Dane lokalne `sensors/` (9999 plików)
- [x] Boilerplate: planning, tracing, submit_to_hub, memory hub feedback
- [x] Hub zweryfikowany: `{FLG:BUGGYSYSTEM}` (52 ID, pipeline)

### Zrealizowano (Fazy A–E)

1. Szkielet epizodu wg boilerplate-documentation.
2. MCP: `scan_sensors`, `classify_operator_notes`, `build_recheck` (cache + retry parse).
3. Prompty: `evaluation_task.md`, `system.md`.
4. Agent: planning turn 0, Langfuse, `evaluation_memory` z `injectWorkingPlan` przy błędzie hub.
5. README, testy integracyjne scan, E2E agent (`run.ts`).

### Otwarte pytania (zamknięte)

| # | Pytanie | Propozycja domyślna |
| --- | --- | --- |
| 1 | Czy włączać Langfuse od razu? | Tak, jeśli masz klucze w `.env`; graceful noop bez nich |
| 2 | Human-in-the-loop przy planie? | Nie — wystarczy planning turn 0 (jak s02e04, nie jak s02e03 z ask_human) |
| 3 | Format ID w `recheck` | `"0001"` (string z zerami) — akceptowany przez hub |

---

## User Stories

| ID | Jako… | Chcę… | Aby… |
| --- | --- | --- | --- |
| EV-1 | agent | przeskanować 10k plików bez LLM | wykryć 46 anomalii pomiarowych tanio |
| EV-2 | agent | klasyfikować notatki batch + cache | wykryć niespójności operatora bez 9999 wywołań |
| EV-3 | agent | submitować pełną listę `recheck` | dostać `{FLG:...}` |
| EV-4 | agent | iterować po feedbacku hub | uzupełnić brakujące ID |
| EV-5 | student | mieć trace w Langfuse | zobaczyć koszt i tury (S03E01) |

---

## Assumptions

- Lista anomalii jest **statyczna** (pliki lokalne z zip).
- Hub akceptuje mixed format ID (string/number/json filename).
- Klasyfikacja notatki zależy tylko od tekstu (7 wyjątków „mixed” wymaga osobnej logiki per plik).

---

## Suggested Next Steps

1. **Human gate:** akceptacja tego research + architektury powyżej.
2. Plan implementacji: `s03e01-evaluation.plan.md`.
3. Implementacja epizodu w `tasks/s03e01/`.
4. Uruchomienie: `bun --env-file=../.env run index.ts`.
5. (Opcjonalnie) Lokalny eval harness w `@ai-devs/agent-evals` — osobno od solve.

---

## Referencje

| Ścieżka | Zawartość |
| --- | --- |
| `tasks/boilerplate/README.md` | Feature catalog, planning, tracing |
| `tasks/s02e04/run.ts` | Planning + submit loop |
| `tasks/s02e03/src/failureTaskAgent.ts` | Verify feedback + plan update |
| `tasks/boilerplate/docs/specs/sandbox-code-execution/` | Dlaczego nie code mode tutaj |
