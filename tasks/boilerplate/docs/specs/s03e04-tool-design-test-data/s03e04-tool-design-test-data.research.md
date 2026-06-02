# S03E04 — Budowanie narzędzi na podstawie danych testowych → boilerplate (research)

**Task:** Przeanalizować lekcję S03E04 pod kątem opisanych funkcjonalności i ocenić, czy którekolwiek z nich warto dodać do `tasks/boilerplate` (`@ai-devs/agent-boilerplate`) — **w oderwaniu od homeworku** `negotiations` i od demo Gmail.

**Data:** 2026-06-02  
**Status:** Research **zaakceptowany** (2026-06-02) — decyzje §8.  
**Plan:** [s03e04-tool-design-test-data.plan.md](s03e04-tool-design-test-data.plan.md) — Opcja A (§**2.3** w spec, nie §2.4).

**Źródła:**

- `markdowns/s03e04-budowanie-narzedzi-na-podstawie-danych-testowych-1774477151.md` — transkrypt lekcji
- `lessons/03_04_gmail/` — referencyjna implementacja (narzędzia, `hints/`, Promptfoo, `spec/`)
- `tasks/boilerplate/` — runtime ReAct + MCP
- `tasks/boilerplate/docs/specs/agent-observability-evals/` — evals (Langfuse, pakiet `agent-evals`)
- `tasks/boilerplate/docs/specs/s03e02-model-constraints/`, `s03e03-contextual-feedback/` — precedens tabel §2.x w dokumentacji
- `tasks/docs/boilerplate-documentation.md` — spec produktowa

---

## 1. Executive summary

**Werdykt: lekcja S03E04 wzmacnia głównie *proces* i *kontrakty narzędzi domenowych*, a nie brakujące elementy runtime ReAct. Do boilerplate wchodzi wyłącznie dokumentacja (§**2.3** w `boilerplate-documentation.md`, po §2.1–2.2) — bez modułu `tool-hints`, bez Promptfoo w `agent-evals`, bez Gmail i bez wzorca homework „HTTP + NL params”.**

| Obszar lekcji | W boilerplate domyślnie? | Gdzie indziej |
| --- | --- | --- |
| Proces projektowania schematów z LLM + checklisty | **Docs** (§2.3, link do lekcji) | `lessons/03_04_gmail/spec/` |
| Wąskie, spersonalizowane narzędzia (scope) | **Nie** — decyzja epizodu | `tasks/sXXeYY/src/tools/mcp/` |
| Envelope `{ data, hint }` + `nextActions` / `recovery` / `diagnostics` | **Nie** w pakiecie (reference w lekcji) | `lessons/03_04_gmail/src/hints/` |
| Zestawy danych testowych + kategorie scenariuszy | **Nie** | lekcja + epizody |
| **Promptfoo** (offline eval per-tool + multi-turn) | **Nie** — jedyny reference: lekcja | `lessons/03_04_gmail/evals/promptfoo/` |
| Porównanie modeli na evalach | **Częściowo** | `agent-evals` + `AGENT_MODEL` / eksperymenty Langfuse |
| Langfuse vs Promptfoo | Już **Langfuse opt-in** w boilerplate | S03E01 research |
| Interpretacja wyników eval przez LLM | **Nie** (workflow) | dokumentacja kursu |
| Automatyzacja optymalizacji schematu | **Nie** (aspiracyjne) | — |

**Reguła kciuka (spójna z S03E02 / S03E03):**

```text
Homework hub (ReAct, ≤5 tur, http_request + własne MCP) → default boilerplate bez envelope hintów.
Integracja wielonarzędziowa z jakością UX (Gmail, produkcja) → lekcja 03_04_gmail lub kod epizodu.
Offline eval narzędzi (Promptfoo) → lekcja / osobny szablon; runtime eval → agent-evals (Langfuse).
```

---

## 2. Funkcjonalności z lekcji (poza zadaniem `negotiations`)

### 2.1 Proces i metodyka (bez kodu w boilerplate)

| # | Funkcjonalność | Opis | Związek z kursem |
| --- | --- | --- | --- |
| P1 | Kontekst z dokumentacji API + SDK | Markdown + kod źródłowy jako input dla agenta kodującego | S01E03, wszystkie integracje |
| P2 | Iteracyjne projektowanie input/output ze wskazówkami | Lista dobrych praktyk → LLM poprawia schemat | Uniwersalne |
| P3 | Decyzje: które akcje, merge, block | Wąskie narzędzia zamiast „pełnego API” | Bezpieczeństwo (S03E02) |
| P4 | Generowanie przykładowych interakcji | Zamiast pytań — syntetyczne dialogi do dopracowania UX | → zestawy testowe |
| P5 | Współpraca człowiek–LLM na każdym etapie | Brak pełnej autonomii w produkcji | Filozofia kursu |

**Wniosek:** To materiał **dydaktyczny** i **promptów/checklist** — boilerplate nie musi go kodować, ale **§2.3 w `boilerplate-documentation.md`** warto uzupełnić (jak po S03E02/S03E03).

### 2.2 Jakość kontraktu narzędzia (schematy Zod / JSON Schema)

| # | Praktyka | Przykład z lekcji / Gmail |
| --- | --- | --- |
| T1 | Opisy **każdej** właściwości w schema | Brak opisów = „iluzja poprawności” |
| T2 | Paginacja jawna w input (`cursor`, `limit`) | `gmail_search` |
| T3 | Poziomy szczegółowości output (`details`, warianty listy) | search/read |
| T4 | Brak base64 / dużych blobów w odpowiedzi narzędzia | załączniki → URL |
| T5 | Rozstrzyganie typu zasobu **w kodzie**, nie przez model | message vs thread w `read` |
| T6 | Odpowiedź `modify` zwraca **zmienione pola** | natychmiastowy feedback |
| T7 | Błędy: co się stało + co zrobić (auth, rate limit, retry) | → envelope `hint` |
| T8 | Puste wyniki: sugestia zmiany zapytania / filtrów | `buildSearchHint` |
| T9 | Wskazówki **łączenia akcji** (search → read → attachment) | `proposeAction` w `nextActions` |

**Stan boilerplate:** `http_request`, `read_file` używają Zod `.describe()` punktowo; **brak** wspólnego envelope ani `proposeAction`. Epizody (`s03e01`, `s03e02`) budują własne MCP z prostym tekstem/JSON.

**Wniosek:** T1–T9 to **wzorzec implementacji narzędzi epizodu**, nie pętli `createAgent`. Runtime już dostarcza: walidację Zod w MCP, `AGENT_MAX_TOOL_OUTPUT_CHARS`, retry 429/503.

### 2.3 Strukturalna odpowiedź narzędzia (eksperyment lekcji)

Lekcja promuje wspólną odpowiedź z polami m.in. **`next_action`**, **`recovery`**, **`diagnostics`** (oraz w kodzie lekcji: `{ data, hint }`).

Implementacja referencyjna: `lessons/03_04_gmail/src/hints/index.ts` — typy `ToolHint`, `ToolEnvelope`, `createHint`, `proposeAction`, `buildErrorHint` (klasyfikacja błędów HTTP/auth/rate limit).

| Aspekt | Korzyść | Koszt w kontekście kursu |
| --- | --- | --- |
| Mniej „zgadywania” następnego kroku | `nextActions` z confidence | **Więcej tokenów** w każdym `tool_result` |
| Spójność błędów | `reasonCode`, `recovery.retryable` | Epizody hub często oczekują krótkiego JSON |
| Lepsze multi-turn bez grubego system promptu | Eval scenariuszy „prawie bez systemu” | Homework `negotiations`: limit **500 B** na odpowiedź — **sprzeczne** z pełnym envelope |

**Wniosek:** Envelope ma sens w **integracjach produkcyjnych / lekcji Gmail**, nie jako domyślny format `mcpOk()` w boilerplate.

### 2.4 Dane testowe i ewaluacja

| # | Funkcjonalność | Lekcja | Boilerplate / monorepo |
| --- | --- | --- | --- |
| E1 | Kategorie testów: per-tool vs scenariusze multi-turn | `evals/promptfoo/` | Brak w `tasks/` |
| E2 | Scenariusze z minimalnym system promptem | test „jakości opisu narzędzia” | Odpowiednik: `agent-evals` + tracing |
| E3 | Testy błędów i nieskutecznych akcji | osobne suite | Wzorzec do epizodów |
| E4 | **Promptfoo** jako dev eval | `bun run eval:tools` / `eval:scenarios` | Tylko `lessons/03_04_gmail` |
| E5 | Porównanie modeli (gpt-5.2, mini, 4.1) | interpretacja wyników | `AGENT_MODEL` + Langfuse experiments |
| E6 | LLM analizuje wyniki eval i same testy | proces | Poza pakietem |

**Relacja do S03E01:** `agent-observability-evals.research.md` już rekomenduje **Langfuse + `@ai-devs/agent-evals`**, nie Promptfoo w boilerplate. S03E04 **uzupełnia** ten obraz o drugi ekosystem eval (Promptfoo) pod **jakość definicji narzędzi**, nie pod runtime agenta.

**Wniosek:** **Nie** scalać Promptfoo do boilerplate. Opcjonalnie w przyszłości: szablon Promptfoo w `tasks/agent-evals/templates/` lub README z linkiem do `03_04_gmail` (osobna decyzja produktowa).

### 2.5 Co należy do homeworku `negotiations` (wyłączone z scope)

Te elementy **nie** powinny wpływać na decyzję o boilerplate:

- Publiczne HTTP endpointy (ngrok), POST `{ params: string }` w języku naturalnym
- Maks. **2** narzędzia, **10** kroków zewnętrznego agenta
- Odpowiedź `{ output }`, **4–500 bajtów**
- Rejestracja URL w `/verify`, async `action: check`
- CSV z hub — logika domenowa w `tasks/s03e04/` (gdy powstanie)

To profil **„tool provider dla cudzego agenta”** — inny niż ReAct w `createAgent`.

---

## 3. Stan `tasks/boilerplate` (mapowanie)

| Potrzeba z lekcji | Już jest | Brakuje |
| --- | --- | --- |
| ReAct + MCP + Zod | ✅ | — |
| Retry 429/503 (HTTP + LLM) | ✅ `fetchWithRetry` | — |
| Ograniczenie rozmiaru wyniku narzędzia | ✅ `AGENT_MAX_TOOL_OUTPUT_CHARS` | Brak twardego limitu bajtów (świadomie — epizod) |
| Tool discovery (>4 narzędzi) | ✅ opt-in | — |
| Planning turn 0 | ✅ opt-in | — |
| Observability (Langfuse) | ✅ opt-in | Promptfoo |
| Eval harness | ✅ pakiet `agent-evals` | Eval **per definicja narzędzia** (Promptfoo style) |
| Kontekstowy feedback po turze | ✅ `MemoryHooks`, hub inject w epizodach | Envelope w MCP |
| Wąskie narzędzia / polityki | ❌ (świadomie) | W kodzie epizodu |
| `proposeAction` / `ToolEnvelope` | ❌ | W lekcji Gmail |

---

## 4. Rekomendacje per funkcjonalność

### 4.1 Dodać do boilerplate (domyślna instalacja)

| Funkcjonalność | Werdykt | Uzasadnienie |
| --- | --- | --- |
| — | **Brak nowych modułów domyślnych** | Żaden element S03E04 nie jest wymagany przez typowy epizod `tasks/sXXeYY/` (hub, ≤5 tur, HTTP). |

### 4.2 Opcje wykluczone (decyzje §8)

| Funkcjonalność | Werdykt | Uzasadnienie |
| --- | --- | --- |
| **Tool hints / envelope** (`nextActions`, `confidence`, …) | **Nie** w publicznym API pakietu | Brak planowanych epizodów `tasks/` z envelope; pola uznane za eksperymentalne — wzorzec pozostaje w `lessons/03_04_gmail/`. |
| **Promptfoo w `agent-evals`** | **Nie** | Oficjalny harness kursu: Langfuse + `@ai-devs/agent-evals`; Promptfoo wyłącznie jako reference w lekcji. |
| **Bogatsze `mcpErr` w `http_request`** | **Nie** | Zmiana formatu może złamać istniejące prompty; epizody owijają wynik lokalnie. |

### 4.3 Tylko dokumentacja (rekomendowane teraz — Opcja A)

| Działanie | Priorytet |
| --- | --- |
| Dodać **§2.3 Tool design & test data (S03E04)** do `tasks/docs/boilerplate-documentation.md` | **Wysoki** |
| Tabela: wzorzec / antywzorzec / gdzie w repo (jak §2.1–2.3) | **Wysoki** |
| Linki: `lessons/03_04_gmail/`, `agent-evals/README.md`, `spec/*.md` | **Wysoki** |
| Krótki akapit w `tasks/boilerplate/README.md` (Feature catalog) | Średni |

Treść §2.3 (szkic):

- Projektuj wąskie narzędzia w epizodzie; nie rozszerzaj `createBoilerplateMcpServer` o integracje domenowe.
- Opisy Zod, paginacja, poziomy `details`, bez base64 w `tool_result`.
- Błędy i puste wyniki: strukturalne komunikaty — własny format epizodu lub kopia wzorca z lekcji (nie eksport pakietu).
- Eval: `agent-evals` (Langfuse) do zachowania agenta; Promptfoo do **jakości narzędzi** — wzorzec w lekcji.
- Nie mylić z limitem 500 B homeworku negotiations.

### 4.4 Zostawić poza monorepo pakietu runtime

| Element | Miejsce |
| --- | --- |
| Gmail OAuth + 5 narzędzi | `lessons/03_04_gmail/` |
| Promptfoo config + HTML reports | `lessons/03_04_gmail/evals/promptfoo/` |
| Checklisty integracji (per API) | `spec/` w lekcji lub `docs/context/` epizodu |
| Automatyczna optymalizacja schematu | Proces / przyszłe lekcje |

---

## 5. Zbieżność z wcześniejszymi researchami

| Temat | Relacja S03E04 |
| --- | --- |
| **S03E01 observability/evals** | Langfuse + `agent-evals` = trajektoria i correctness agenta; S03E04 = **jakość definicji narzędzi** (Promptfoo). Komplementarne, nie duplikaty. |
| **S03E02 constraints** | Wąskie narzędzia, deterministyka w TS, batch — spójne z T3, T5, „nie pełne API”. |
| **S03E03 contextual feedback** | `hint` w odpowiedzi narzędzia to **feedback w warstwie tool_result**, nie `MemoryHooks`; hooki workflow (listen→feedback) nadal poza boilerplate. |
| **Tool discovery (S02E05)** | Discovery redukuje schematy wejściowe; S03E04 redukuje **błędy użycia** przez opisy i hinty wyjściowe — oba mogą współistnieć. |
| **Sandbox / code mode** | Osobna ścieżka orchestracji; S03E04 nie zastępuje. |

---

## 6. Co poprawiłoby boilerplate względem **całego kursu** (synteza)

1. **Jedna tabela decyzyjna §2.3** — studenci przy nowym `tasks/sXXeYY/` widzą, kiedy kopiować wzorzec Gmail vs wystarczy `http_request` + prosty JSON.
2. **Most dokumentacyjny Promptfoo ↔ agent-evals** — bez adaptera w `agent-evals`: Langfuse = harness kursowy; Promptfoo = wyłącznie lekcja `03_04_gmail`.
4. **Bez zmiany domyślnego `mcpOk`/`mcpErr`** — stabilność istniejących zadań (`s03e01`, `s03e02`, …) ważniejsza niż eksperymentalny envelope.

**Nie rekomendowane dla całego kursu:**

- Wbudowanie Promptfoo w `bun test` boilerplate
- Domyślne `nextActions` w każdym narzędziu MCP (szum tokenów w krótkich zadaniach)
- Narzędzia do parsowania NL `params` (specyficzne dla negotiations)

---

## 7. Następne kroki (zatwierdzone)

| Opcja | Zakres | Status |
| --- | --- | --- |
| **A** | Tylko docs: §2.3 w `boilerplate-documentation.md` + README (2 wiersze) + `CHANGELOG.md` | Plan: [s03e04-tool-design-test-data.plan.md](s03e04-tool-design-test-data.plan.md) |
| **B** | Export `src/tool-hints/` | **Wykluczone** (§8) |
| **C** | Promptfoo w `agent-evals` | **Wykluczone** (§8) |
| **D** | Brak zmian | Odrzucone — **A** daje wartość przy zerowej złożoności runtime |

---

## 8. Decyzje (odpowiedzi maintainera)

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Epizody `tasks/` z envelope jak Gmail? | **Nie wiadomo** — brak planu; nie uzasadnia modułu w pakiecie. |
| 2 | Adapter Promptfoo w `agent-evals`? | **Nie** — `lessons/03_04_gmail` pozostaje jedynym reference Promptfoo. |
| 3 | `nextActions` / `confidence` w publicznym API pakietu? | **Nie** — pola eksperymentalne; envelope tylko w lekcji. |

**Implikacja:** jedyna zatwierdzona ścieżka implementacji monorepo to **Opcja A** (dokumentacja). Envelope i Promptfoo nie wchodzą do `@ai-devs/agent-boilerplate` ani `@ai-devs/agent-evals`.

---

## 9. Werdykt końcowy (odpowiedź na pytanie użytkownika)

**Czy zasadne dodanie którejkolwiek funkcjonalności S03E04 do `tasks/boilerplate`?**

- **Tak, zasadne (niska intruzywność):** uzupełnienie dokumentacji produktowej o wzorce projektowania narzędzi i evalów (§2.3), spójne z S03E02/S03E03.
- **Nie zasadne w boilerplate / agent-evals:** moduł `tool-hints`, Promptfoo, integracja Gmail, pełny pipeline „agent buduje narzędzia”, format homework negotiations, domyślne wzbogacanie odpowiedzi MCP o `nextActions`.

**W oderwieniu od zadania z lekcji:** największą wartość dla całego kursu daje **ujednolicenie decyzji „co należy do epizodu vs do pakietu”**, a nie kolejny feature w `createAgent`.
