# Plan wdrożenia — Tool design & test data (S03E04) w dokumentacji boilerplate

**Normatywny research:** [s03e04-tool-design-test-data.research.md](s03e04-tool-design-test-data.research.md) — zaakceptowany; **Opcja A** (tylko dokumentacja).  
**Workspace:** `tasks/docs/boilerplate-documentation.md`, `tasks/boilerplate/README.md`, `tasks/boilerplate/CHANGELOG.md`  
**Status:** Zrealizowany (2026-06-02) — D1–D4.

**Decyzje product owner (2026-06-02, z research §8):**

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Epizody `tasks/` z envelope jak Gmail? | **Nie wiadomo** — brak modułu w pakiecie |
| 2 | Adapter Promptfoo w `agent-evals`? | **Nie** — reference: `lessons/03_04_gmail` |
| 3 | `nextActions` / `confidence` w publicznym API? | **Nie** — envelope tylko w lekcji |
| 4 | Zakres implementacji | **Opcja A** — docs + krótki README + CHANGELOG |

**Uwaga numeracji:** W `boilerplate-documentation.md` są już §2.1 (S03E02) i §2.2 (S03E03). Nowa sekcja to **`### 2.3.`** (research §4.3 mówił „§2.4” — korekta względem aktualnego pliku).

**Weryfikacja UI:** brak.

---

## 1. Zakres (scope)

**W zakresie:**

| ID | Element | Opis |
| --- | --- | --- |
| D1 | `tasks/docs/boilerplate-documentation.md` | **`### 2.3. Tool design & test data (S03E04)`** — wstęp + tabela wzorców + reguła kciuka + odniesienia |
| D2 | Cross-linki | §2.1 ↔ §2.2 ↔ §2.3; link do research; lekcja `03_04_gmail`; `agent-evals` |
| D3 | `tasks/boilerplate/README.md` | Wiersz w **Related packages** + jeden wiersz w **Quick decision guide** (bez nowej sekcji Feature catalog) |
| D4 | `tasks/boilerplate/CHANGELOG.md` | Wpis pod unreleased / datą — docs-only S03E04 |
| D5 | Research (opcjonalnie) | Link do tego planu w nagłówku research; korekta „§2.4” → „§2.3” jeśli występuje |

**Poza zakresem (jawnie):**

- `tasks/boilerplate/src/`, testy, `package.json`, `config.ts`
- Moduł `tool-hints` / envelope w `@ai-devs/agent-boilerplate`
- Promptfoo w `tasks/agent-evals/`
- Integracja Gmail, OAuth, `lessons/03_04_gmail` jako dependency pakietu
- Epizod `tasks/s03e04/` (homework `negotiations`)
- Zmiany w `lessons/03_04_gmail/`
- Nowe zależności npm

---

## 2. Decyzje projektowe

| # | Decyzja |
| --- | --- |
| 1 | Sekcja **normatywna, edukacyjna** — jak §2.1 / §2.2: *jak projektować narzędzia MCP epizodu*, nie roadmapa kodu runtime |
| 2 | **Lokalizacja:** `### 2.3. Tool design & test data (S03E04)` **zaraz po** §2.2, **przed** `---` i §3 (Directory Tree) |
| 3 | **Długość:** ~35–50 linii — wstęp (2–4 zdania) + tabela (≥10 wierszy) + reguła kciuka + odniesienia |
| 4 | **Język:** polski — spójnie z §2.1 / §2.2 |
| 5 | **Linki względne** od `tasks/docs/`: research S03E04, `lessons/03_04_gmail/`, `agent-evals/README.md`, `spec/` w lekcji |
| 6 | **Spójność:** nie duplikować §2.1 (wąskie narzędzia / scope — jeden wiersz odsyłki); §2.3 = **schematy Zod, odpowiedzi narzędzi, eval offline vs Langfuse** |
| 7 | **Envelope `{ data, hint }`:** opisać jako **wzorzec lekcji**, jawnie **poza** pakietem i **bez** planu eksportu |
| 8 | **Homework `negotiations`:** jeden wiersz antywzorzec (NL `params`, limit 500 B, zewnętrzny agent) — **nie** profil `createAgent` |
| 9 | **README:** minimalna zmiana (2 wiersze tabel) — bez rozbudowy Feature catalog o nową podsekcję |
| 10 | **Bramki jakości:** brak `bun test` / `tsc` (tylko Markdown) |

---

## 3. Treść docelowa (szkic do wdrożenia)

Implementujący agent **nie kopiuje** research 1:1 — streszcza do tabeli poniżej.

### Wstęp (szkic)

> Lekcja S03E04 uczy **projektowania skutecznych narzędzi** (schematy input/output, odpowiedzi dla modelu, dane testowe, ewaluacja offline) we współpracy z LLM — **bez** obowiązku MCP w lekcji demonstracyjnej. Runtime boilerplate (`createAgent`, `http_request`, `mcpOk`/`mcpErr`) pozostaje bez zmian; jakość narzędzi implementujesz w **`tasks/sXXeYY/src/tools/mcp/`**. Reference integracji i Promptfoo: **`lessons/03_04_gmail/`**.

### Tabela wzorców vs antywzorców (docelowa)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Zakres narzędzia** | Wąskie, spersonalizowane akcje (np. `search_support`, nie pełne API) | Generyczne „pełne” integracje z oficjalnym MCP | §2.1; [lessons/03_04_gmail/src/tools/](../../lessons/03_04_gmail/src/tools/) |
| **Schemat input** | Każde pole z `.describe()`; jawna paginacja (`cursor`, `limit`) | Pola bez opisu; brak stronicowania przy listach | `spec/gmail_*.md` w lekcji |
| **Schemat output** | Poziom szczegółowości (`details`, warianty listy); tylko to, co model potrzebuje | Base64 / duże bloby w `tool_result` | lekcja Gmail; `AGENT_MAX_TOOL_OUTPUT_CHARS` w boilerplate |
| **Logika w kodzie** | Typ zasobu, merge ID, polityki — **w handlerze**, nie w argumencie modelu | Model wybiera „message vs thread” lub ścieżkę API | `gmail_read` w lekcji |
| **Feedback po akcji** | `modify` zwraca zmienione pola; puste wyniki → sugestia zmiany zapytania | Cichy błąd lub surowy stack w odpowiedzi narzędzia | `src/hints/` w lekcji |
| **Envelope `{ data, hint }`** | Eksperyment **w lekcji** (status, recovery, opcjonalne next step) | Domyślny format `mcpOk()` w boilerplate; eksport `tool-hints` w pakiecie | [hints/index.ts](../../lessons/03_04_gmail/src/hints/index.ts) |
| **`nextActions` + confidence** | Tylko reference lekcji (eksperymentalne) | Publiczne API `@ai-devs/agent-boilerplate` | — (decyzja §8) |
| **Projektowanie z LLM** | Dokumentacja API + iteracja ze **checklistą** praktyk | Jednorazowy schemat „z pamięci” modelu | transkrypt S03E04; `spec/use-cases.md` |
| **Dane testowe** | Kategorie: per-tool + scenariusze multi-turn; różnorodność świadomie | Płytkie testy „żeby były”; overfitting do jednego case | `lessons/03_04_gmail/evals/` |
| **Eval offline (narzędzia)** | **Promptfoo** w lekcji — jakość **definicji** narzędzia | Promptfoo w `agent-evals` lub CI boilerplate | `03_04_gmail` README `eval:*` |
| **Eval zachowania agenta** | `@ai-devs/agent-evals` + Langfuse (tracing opcjonalnie) | Mylenie z Promptfoo; eval w CI jako gate | [agent-evals/README.md](../agent-evals/README.md) |
| **Wybór modelu** | Porównanie na datasetach po ustabilizowaniu schematów | Jeden model „everywhere” bez pomiaru | `AGENT_MODEL`; research S03E02 §2.1 |
| **Homework hub (ReAct)** | Prosty JSON/text w MCP; Zod w epizodzie | Envelope Gmail w zadaniach ≤5 tur | `tasks/s03e01/`, `s03e02/` |
| **Homework `negotiations` (osobny profil)** | Osobny temat: HTTP tool dla **zewnętrznego** agenta | Wzorzec negotiations w boilerplate | markdown S03E04 — zadanie (poza tym planem) |

### Reguła kciuka (szkic, pod tabelą)

```text
Homework hub (ReAct, ≤5 tur, http_request + własne MCP) → default boilerplate; opisy Zod i krótkie odpowiedzi w narzędziach epizodu.
Jakość integracji (wiele akcji, bogate hinty) → lekcja 03_04_gmail lub kopia wzorca w epizodzie — nie nowy moduł w pakiecie.
Eval definicji narzędzi (Promptfoo) → lessons/03_04_gmail; eval trajektorii agenta → agent-evals (Langfuse).
```

### Odniesienia (szkic, pod regułą)

- Research: [s03e04-tool-design-test-data.research.md](../boilerplate/docs/specs/s03e04-tool-design-test-data/s03e04-tool-design-test-data.research.md)
- Powiązane: [§2.1 Project constraints (S03E02)](./boilerplate-documentation.md#21-project-constraints-s03e02) · [§2.2 Contextual feedback (S03E03)](./boilerplate-documentation.md#22-contextual-feedback-s03e03)
- Lekcja: [03_04_gmail](../../lessons/03_04_gmail/) · spec narzędzi: [spec/](../../lessons/03_04_gmail/spec/)
- Eval agenta: [agent-evals](../agent-evals/README.md) · observability: [§4.4](./boilerplate-documentation.md) (Langfuse)

*(Implementujący poprawi anchory nagłówków po wstawieniu §2.3.)*

---

## 4. Zmiany w README (D3 — szkic)

### Related packages — nowy wiersz

| Package / location | Purpose | When |
| --- | --- | --- |
| [`lessons/03_04_gmail`](../../lessons/03_04_gmail/README.md) | Tool design reference + **Promptfoo** evals (per-tool & scenarios); mocked/live suites | Refining MCP contracts; **not** required for typical hub homework |

### Quick decision guide — nowy wiersz

| You need… | Use | Skip |
| --- | --- | --- |
| Design or refine MCP tool schemas & offline tool evals | [§2.3 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#23-tool-design--test-data-s03e04) + lesson `03_04_gmail` | `tool-hints` package export (not planned) |

*(Anchor `#23-...` dopasować do faktycznego slug nagłówka po D1.)*

---

## 5. CHANGELOG (D4 — szkic)

Jedna pozycja w stylu istniejących wpisów docs-only, np.:

```markdown
### Documentation

- **S03E04 (tool design & test data):** §2.3 in `tasks/docs/boilerplate-documentation.md` — tool schema patterns, eval split (Promptfoo vs `agent-evals`); README related-package row for `03_04_gmail`.
```

---

## 6. Kryteria akceptacji (Definition of Done)

- [x] W `tasks/docs/boilerplate-documentation.md` istnieje **`### 2.3. Tool design & test data (S03E04)`** bezpośrednio pod §2.2
- [x] Sekcja: wstęp (≤5 zdań) + tabela **Wzorzec / Antywzorzec / Gdzie w repo** (≥12 wierszy merytorycznych)
- [x] Tabela zawiera: Zod opisy, paginacja, brak base64, envelope = lekcja only, Promptfoo vs agent-evals, negotiations jako osobny profil (antywzorzec w hub)
- [x] Reguła kciuka (blok `text`) obecna
- [x] Linki względne do `lessons/03_04_gmail/`, research, `agent-evals` — działają z `tasks/docs/`
- [x] Brak obietnic: `tool-hints`, Promptfoo w pakiecie, zmian runtime
- [x] Spójność z §2.1 (scope) i §2.2 (feedback w warstwie message vs tool_result)
- [x] README: dokładnie **2 nowe wiersze** (Related packages + Quick decision guide), bez innych diffów w Feature catalog
- [x] CHANGELOG zaktualizowany
- [x] Review ręczny: §2.1 + §2.2 + §2.3 czytelne w <3 min

---

## 7. Plan zadań

Typy: `[CREATE]`, `[MODIFY]`, `[REUSE]`.

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| D1 | [MODIFY] | Wstawić `### 2.3. Tool design & test data (S03E04)` do `tasks/docs/boilerplate-documentation.md` między końcem §2.2 a `---` przed §3, według §3 tego planu | ✅ |
| D2 | [REUSE] | Cross-linki: §2.1 ↔ §2.2 ↔ §2.3; research; `03_04_gmail`; `agent-evals`; poprawne anchory | ✅ |
| D3 | [MODIFY] | README: wiersz Related packages + Quick decision guide (§4 planu) | ✅ |
| D4 | [MODIFY] | `CHANGELOG.md` — wpis docs S03E04 | ✅ |
| D5 | [MODIFY] | (Opcjonalnie) Research: link do planu, status „plan zaakceptowany”, korekta §2.4→§2.3 w tekście | ✅ |

**Kolejność:** D1 → D2 → D3 → D4 → D5 (D5 opcjonalne).

**Bramki jakości:** `git diff` na trzech plikach Markdown; klik 2–3 linków w IDE. Brak `bun test` / `tsc`.

---

## 8. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Duplikacja §2.1 (wąskie narzędzia) | §2.3 odsyła do §2.1; skupienie na schematach i evalach |
| Student myli Promptfoo z Langfuse | Jawny wiersz tabeli + reguła kciuka |
| Sugestia dodania envelope do hub homework | Wiersz „homework hub” + negotiations jako antywzorzec |
| Zła numeracja §2.4 w starym research | Plan i implementacja używają **§2.3** |
| README rozrasta Feature catalog | Tylko 2 wiersze, bez nowej podsekcji |

---

## 9. Human gate

**Przed implementacją:** akceptacja tego planu (scope = D1–D4, docs + minimalny README + CHANGELOG).

**Po implementacji:** krótki review diff — czy §2.1–§2.3 razem dają obraz S03 bez czytania research.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-02 | Plan początkowy — Opcja A: §2.3 w `boilerplate-documentation.md`, README (2 wiersze), CHANGELOG; bez `tool-hints`, bez Promptfoo w `agent-evals` |
| 2026-06-02 | D1–D4 zrealizowane po akceptacji planu |
