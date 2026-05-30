# Plan wdrożenia — Project constraints (S03E02) w boilerplate-documentation

**Normatywny research:** [s03e02-model-constraints.research.md](s03e02-model-constraints.research.md) — zaakceptowany werdykt: **docs only**, bez rozszerzenia runtime boilerplate.  
**Workspace:** `tasks/docs/boilerplate-documentation.md`  
**Status:** Zrealizowany (2026-05-30).

**Weryfikacja UI:** brak.

---

## 1. Zakres (scope)

**W zakresie (jedyny deliverable):**

| Element | Opis |
| --- | --- |
| **`tasks/docs/boilerplate-documentation.md`** | Nowa krótka sekcja **„Project constraints (S03E02)”** — tabela wzorców vs antywzorców przy projektowaniu agentów kursowych |

**Poza zakresem (jawnie):**

- Zmiany w `@ai-devs/agent-boilerplate` (kod, testy, `config.ts`)
- `tasks/boilerplate/README.md`, `CHANGELOG.md` — opcjonalne cross-linki **nie** w tym planie
- Epizod `tasks/s03e02/` (firmware)
- Pakiet `@ai-devs/agent-code-mode`
- Prompt injection middleware, heartbeat, email RBAC

---

## 2. Decyzje projektowe

| # | Decyzja |
| --- | --- |
| 1 | Sekcja **normatywna, edukacyjna** — opisuje *jak projektować epizody*, nie dodaje API do pakietu |
| 2 | **Lokalizacja:** podrozdział **`### 2.1. Project constraints (S03E02)`** w §2 *Założenia Architektoniczne*, zaraz po liście 4 punktów architektury (przed `---` i §3) |
| 3 | **Długość:** ~25–40 linii — wstęp (2–3 zdania) + jedna tabela + opcjonalna reguła kciuka (1 akapit lub blok `text`) |
| 4 | **Język:** polski — spójnie z resztą `boilerplate-documentation.md` |
| 5 | **Linki:** do research (`s03e02-model-constraints.research.md`), lekcji `lessons/03_02_code/`, wzorca epizodu `tasks/s03e01/` — ścieżki względne od `tasks/docs/` |
| 6 | **Nowe zależności npm:** brak |

---

## 3. Treść docelowa (szkic do wdrożenia)

Implementujący agent **nie kopiuje** research 1:1 — streszcza do tabeli poniżej.

### Wstęp (szkic)

> Lekcja S03E02 uczy projektowania agentów **pod ograniczenia modeli** (koszt, latency, halucynacje, bezpieczeństwo). Boilerplate dostarcza runtime ReAct; **decyzje co robi model, a co kod** należy do autora epizodu. Poniższa tabela to szybka ściąga przy starcie nowego zadania w `tasks/sXXeYY/`.

### Tabela wzorców vs antywzorców (docelowa)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Podział logiki** | Deterministyczne filtry / agregacje w **MCP TypeScript** (0 tokenów ReAct) | LLM analizuje każdy rekord / plik osobno | `tasks/s03e01` — `scan_sensors` |
| **Orkiestracja** | ReAct + ≤5 tur, jawne narzędzia, `finish_task` | Pełna automatyzacja bez człowieka przy akcjach nieodwracalnych | default boilerplate |
| **Planowanie** | `enablePlanningPhase` + aktualizacja `## Working plan` po feedbacku hub | Heartbeat multi-agent dla prostego homework | `planning.ts`, `evaluation_memory.ts` |
| **Duże dane** | Batch po unikalnych kluczach + cache odpowiedzi LLM w warstwie epizodu | Wczytanie 10k+ rekordów do kontekstu | `classifyNotes.ts` |
| **Wiele wywołań MCP** | Code mode w **lekcji** / deterministyczny skrypt developera | `execute_code` w domyślnym pakiecie | `lessons/03_02_code`, §5.2.1 spec |
| **Kontekst LLM** | `toolDiscovery` gdy >4 narzędzia; OM dla długich sesji **jednego** agenta | Wszystkie schematy MCP w każdej turze | README § Tool discovery |
| **Modele** | Mini na klasyfikację / enum; mocniejszy model na reasoning (env) | Jeden drogi model „everywhere” | `config.ts`, `AGENT_MODEL` |
| **Bezpieczeństwo** | Brak narzędzi nieodwracalnych; uprawnienia w **handlerze** MCP, nie w prompcie | Model decyduje o wysyłce maila / shell bez limitów | wzorzec lekcji `03_02_email` |
| **Prompt injection** | System prompt bez sekretów; nieufność wobec treści zewnętrznych | Poleganie na „nie ujawniaj instrukcji” jako jedyną barierę | — |
| **Obserwowalność** | Langfuse opt-in do debugu kosztów | Langfuse jako warunek poprawności solve | `observability/` |
| **Homework typu shell/API** | `http_request` + retry 429/503 + opisowe błędy w narzędziu epizodu | Sandbox Deno gdy wystarczy sekwencja HTTP | zadanie `firmware` (S03E02) |

### Reguła kciuka (szkic, pod tabelą)

```text
≤5 tur ReAct i ≤4 narzędzi w prompcie → default boilerplate (bez discovery, OM, code mode).
Wiele wywołań MCP / agregacja dużych plików → lekcja code mode LUB deterministyczne MCP w TS.
Multi-agent / heartbeat → lekcja events, nie pakiet kursowy.
```

### Odniesienia (szkic, pod regułą)

- Research: [s03e02-model-constraints.research.md](../../boilerplate/docs/specs/s03e02-model-constraints/s03e02-model-constraints.research.md)
- Code mode (poza pakietem): [§5.2.1](./boilerplate-documentation.md) w tym dokumencie
- Przykład epizodu: [tasks/s03e01/](../s03e01/)

*(Implementujący poprawi ścieżki względne w pliku docelowym.)*

---

## 4. Kryteria akceptacji (Definition of Done)

- [x] W `tasks/docs/boilerplate-documentation.md` istnieje **`### 2.1. Project constraints (S03E02)`** w §2
- [x] Sekcja zawiera wstęp (≤3 zdania) + tabelę **Wzorzec / Antywzorzec** (≥8 wierszy merytorycznych)
- [x] Tabela zawiera kolumnę **„Gdzie w repo”** z działającymi linkami względnymi
- [x] Reguła kciuka obecna (blok `text` lub lista)
- [x] Brak sprzeczności z §5.2 (tool discovery) i §5.2.1 (code mode)
- [x] Brak obietnic nowych feature’ów w boilerplate — sekcja opisuje **worce projektowe**, nie roadmapę kodu
- [x] Review ręczny: sekcja czytelna w <2 min (student przed nowym epizodem)

---

## 5. Plan zadań

Typy: `[CREATE]`, `[MODIFY]`, `[REUSE]`.

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| D1 | [MODIFY] | Dodać `### 2.1. Project constraints (S03E02)` do `tasks/docs/boilerplate-documentation.md` według §3 tego planu | ✅ |
| D2 | [REUSE] | Spójność cross-linków: §5.2.1, research S03E02, `tasks/s03e01` — klikalne ścieżki w IDE | ✅ |

**Kolejność:** D1 → D2.

**Bramki jakości:** brak `bun test` / `tsc` (tylko Markdown). Weryfikacja: podgląd diff + linki względne.

---

## 6. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Sekcja rośnie ponad „krótką” | Limit ~40 linii; reszta w research |
| Duplikacja README feature catalog | Tabela decyzyjna (kiedy co), nie lista API |
| Nieaktualne linki do lekcji | Link tylko do tego, co jest w repo (`03_02_code`); email/events — wzmianka tekstowa bez ścieżki |

---

## 7. Human gate

**Przed implementacją:** akceptacja tego planu (scope = wyłącznie sekcja w `boilerplate-documentation.md`).

**Po implementacji:** krótki review diff — czy tabela wystarcza studentowi bez czytania całego research.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-05-30 | Plan początkowy — scope: §2.1 Project constraints (S03E02) only |
| 2026-05-30 | D1–D2: sekcja §2.1 w `tasks/docs/boilerplate-documentation.md` |
