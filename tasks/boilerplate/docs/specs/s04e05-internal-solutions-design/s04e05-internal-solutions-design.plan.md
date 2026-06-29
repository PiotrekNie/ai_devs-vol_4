# Plan wdrożenia — Projektowanie rozwiązań wewnątrzfirmowych (S04E05) w dokumentacji boilerplate

**Normatywny research:** [s04e05-internal-solutions-design.research.md](s04e05-internal-solutions-design.research.md) — **zaakceptowany** (2026-06-29); **Opcja A** (§2.9 docs-only).  
**Workspace:** `tasks/docs/boilerplate-documentation.md`, `tasks/boilerplate/README.md`, `tasks/boilerplate/CHANGELOG.md`, `lessons/04_05_review/README.md`, `lessons/04_05_apps/README.md`  
**Status:** Plan **zrealizowany** (2026-06-29) — D1–D7b.

**Decyzje (z research §7–§9, potwierdzone przez użytkownika przy research):**

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Link do homework `foodwarehouse` w §2.9? | **Tak (D1)** — wiersz w tabeli + reguła kciuka |
| 2 | Aktualizacja §2.4 / §2.6 o `04_05_apps`? | **Tak (D2b)** — po jednej linii w blokach **Odniesienia** |
| 3 | Wiersz w README Feature catalog? | **Tak (D3)** — Quick decision + Related packages |
| 4 | Ekstrakcja `runAgent` / review-engine do core? | **Nie** — lekcja zostaje reference |
| 5 | `lessons/04_05_*/README.md` → §2.9? | **Tak (D7)** — po 1 linii w obu README (jak D7 S04E04) |
| 6 | Zmiany w `tasks/boilerplate/src/`? | **Nie** — docs-only |
| 7 | Homework `foodwarehouse` / `tasks/s04e05/`? | **Poza scope** tego MR |

**Uwaga numeracji:** W `boilerplate-documentation.md` są §2.0–§2.8. Nowa sekcja to **`### 2.9.`** — wstawiona **po** §2.8, **przed** `---` i §3 (Directory Tree).

**Weryfikacja UI:** brak.

---

## Technical Context

| Obszar | Wartość |
| --- | --- |
| **Stack** | Markdown docs; brak zmian TypeScript w boilerplate |
| **Normatywna spec** | `tasks/docs/boilerplate-documentation.md` |
| **Precedens** | [s04e04-knowledge-base.plan.md](../s04e04-knowledge-base/s04e04-knowledge-base.plan.md) (D1–D7 docs-only) |
| **Język §2.9** | Polski — spójnie z §2.1–§2.8 |
| **Linki względne** | Od `tasks/docs/` do research, lekcji `04_05_*`, `03_05_apps` |
| **Testy** | Brak `bun test` / `tsc` dla Markdown; `git diff` bez `tasks/boilerplate/src/` |
| **Terminologia** | **rozwiązanie wewnątrzfirmowe** = lekki dokument → dedykowane narzędzie → MCP Apps; **orchestrator** = kod poza `createAgent` |

---

## 1. Analiza stanu obecnego (Current Implementation Analysis)

| Element | Stan | Akcja w planie |
| --- | --- | --- |
| `tasks/docs/boilerplate-documentation.md` §2.0–§2.8 | **Istnieje** (S04E04 zrealizowany) | Dodać §2.9; uzupełnić odniesienia §2.8 → §2.9 |
| §2.9 Internal solutions (S04E05) | **Brak** | D1 |
| §2.4 / §2.6 — link do `04_05_apps` | Tylko `03_05_apps` | D2b |
| `tasks/boilerplate/README.md` — S04E05 | **Brak** wiersza | D3 |
| `tasks/boilerplate/CHANGELOG.md` | Brak wpisu S04E05 | D4 |
| `lessons/04_05_review/README.md` — link do §2.9 | **Brak** | D7a |
| `lessons/04_05_apps/README.md` — link do §2.9 | **Brak** | D7b |
| `tasks/boilerplate/src/` | Bez zmian | **Poza scope** |
| Research status | „oczekuje na akceptację” | D5 → zaakceptowany + link do planu |

**Już pokryte przez runtime (bez kodu):** `createAgent`, `read_file`, `ask_human`, `enablePlanningPhase`, `http_request`, `toolDiscovery`, OM — opisać w §2.9 jako **wzorzec epizodu / lekcji**, nie nowe API.

---

## 2. Zakres (scope)

**W zakresie (Opcja A):**

| ID | Element | Opis |
| --- | --- | --- |
| D1 | `tasks/docs/boilerplate-documentation.md` | **`### 2.9. Internal solutions design (S04E05)`** — wstęp + tabela (≥11 wierszy) + reguła kciuka + odniesienia |
| D2 | Cross-linki §2.9 | §2.8 odniesienia → §2.9; §2.9 → §2.1–§2.8, research S04E05, `04_05_review`, `04_05_apps`, `03_05_apps` |
| D2b | Cross-linki §2.4 / §2.6 | W blokach **Odniesienia** dodać `04_05_apps` + link do §2.9 (bez duplikacji tabel) |
| D3 | `tasks/boilerplate/README.md` | **1 wiersz** Quick decision + **2 wiersze** Related packages (`04_05_review`, `04_05_apps`) |
| D4 | `tasks/boilerplate/CHANGELOG.md` | Wpis docs-only S04E05 (Unreleased) |
| D5 | Research | Status „plan zaakceptowany” / po implementacji „zrealizowany”, link do tego pliku |
| D7a | `lessons/04_05_review/README.md` | 1 linia: normatywna mapa → §2.9 |
| D7b | `lessons/04_05_apps/README.md` | 1 linia: normatywna mapa → §2.9 |

**Poza zakresem (jawnie):**

- `tasks/boilerplate/src/`, testy boilerplate, `package.json`, `config.ts`
- Moduł `documentReview`, MCP Apps SDK, streaming w `createAgent`
- Pakiet `@ai-devs/agent-review` (defer — research Opcja F)
- Hooki `beforeToolCall` w `createAgent` (defer — research Opcja D)
- Homework **`foodwarehouse`** / epizod `tasks/s04e05/`
- Nowe zależności npm
- Zmiany w §4.3 (brak nowego akapitu — OM≠KB już w S04E04)

---

## 3. Decyzje projektowe

| # | Decyzja |
| --- | --- |
| 1 | Sekcja **normatywna, edukacyjna** — spektrum wdrożeń firmowych (dokument → narzędzie → MCP Apps), nie implementacja review hosta |
| 2 | **Lokalizacja:** `### 2.9.` **zaraz po** §2.8, **przed** `---` i §3 |
| 3 | **Długość §2.9:** ~50–65 linii — wstęp + tabela (≥11 wierszy z research §6) + reguła kciuka + odniesienia |
| 4 | **Spójność:** §2.8 = vault/KB; §2.9 = **procesy firmowe, UI, HITL, MCP Apps produkcyjne**; §2.4/§2.6 = uzupełnione o `04_05_apps` |
| 5 | **Orchestrator:** podkreślić wzorzec wielokrotnego `processQuery` / `runAgent` **poza** jedną pętlą `createAgent` |
| 6 | **Homework `foodwarehouse`:** jeden wiersz tabeli + linia w regule kciuka — **bez** pełnego opisu API |
| 7 | **README:** 1 wiersz Quick decision + 2 wiersze Related packages (review vs apps — różne role) |
| 8 | **Bramki jakości:** `git diff` — zero plików w `tasks/boilerplate/src/` |

---

## 4. Treść docelowa (szkic do wdrożenia)

Implementujący agent **nie kopiuje** research §0 1:1 — streszcza do tabeli poniżej.

### Wstęp §2.9 (szkic)

> Lekcja S04E05 uczy projektowania **wewnątrzfirmowych** rozwiązań AI: od lekkich dokumentów (checklisty, onboarding, style) przez dedykowane narzędzia procesowe z **UI i człowiekiem w pętli** po **MCP Apps** łączące wiele usług. To uzupełnienie [§2.8](#28-personal-knowledge-base-for-ai-s04e04) (dokumenty jako wiedza) i [§2.6](#26-active-collaboration-with-ai-s04e02) (kanał dostarczenia). Runtime boilerplate (`createAgent`, `read_file`, `ask_human`) **pozostaje bez zmian**; chunking dokumentu, streaming, accept/reject i embedded UI to **lekcje `04_05_review` / `04_05_apps` lub aplikacja** poza pakietem.

### Tabela wzorców vs antywzorców (docelowa — z research §6)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Adopcja** | Metryki, HITL, świadome ograniczenia modelu | Obietnica pełnej automatyzacji w core | lekcja S04E05; [§2.1](#21-project-constraints-s03e02) |
| **Lekki ROI** | Checklista / styl / onboarding jako `.md` | Nowy moduł w `createAgent` na każdy dokument | `read_file`; [§2.8](#28-personal-knowledge-base-for-ai-s04e04) |
| **Skills poza kodem** | Współdzielone instrukcje (Slack, eksport) | Jeden ogromny system prompt | `src/prompts/`; Cursor skills |
| **Proces z UI** | Orchestrator + wiele `processQuery` + UI akceptacji | Jedna długa pętla ReAct na cały dokument | [04_05_review](../../lessons/04_05_review/) |
| **Narzędzie procesowe** | Wąskie MCP (`add_comment`) | Model mutuje plik bez nadzoru | `04_05_review/src/tools.js` |
| **Chunking dokumentu** | Kod hosta (AST / bloki) | Wklejenie całego pliku do kontekstu | `review-engine.js` |
| **Bezpieczeństwo** | Uprawnienia w handlerze; brak nieodwracalnych tooli w core | „Zaufany Bedrock” = pełne zaufanie do modelu | [§2.1](#21-project-constraints-s03e02); lekcja |
| **Wiele usług** | MCP Apps + deterministyczne akcje w UI | Jeden agent NL na cały CRM+Stripe+mail | [04_05_apps](../../lessons/04_05_apps/) |
| **Zdalny MCP** | Serwer HTTP dla klientów (Claude.ai) | Monolit bez podziału host/MCP | `04_05_apps/mcp/` |
| **Streaming postępu** | NDJSON / SSE w aplikacji | Wymaganie streamingu w `createAgent` | `review-engine.js` |
| **Homework hub (`foodwarehouse`)** | `http_request` + SQLite w epizodzie; explore → plan → execute | ReAct zgadywający API magazynu | epizod `tasks/s04e05/` (planowany) |

### Reguła kciuka (szkic)

```text
Epizod hub (verify, krótka sesja) → default boilerplate.
Checklista / onboarding / styl → markdown + read_file lub vault (§2.8) — nie nowe API.
Recenzja dokumentów z accept/reject → lessons/04_05_review — orchestrator poza createAgent.
Procesy stanowiskowe (wiele SaaS) → MCP Apps (04_05_apps) — host poza pakietem.
Ryzyko nieodwracalne → człowiek w pętli + wąskie narzędzia — nie pełny dostęp API w MCP kursu.
```

### Odniesienia §2.9 (szkic)

- Research: [s04e05-internal-solutions-design.research.md](../s04e05-internal-solutions-design/s04e05-internal-solutions-design.research.md)
- Powiązane: [§2.1](#21-project-constraints-s03e02) · [§2.4](#24-non-deterministic-models-as-advantage-s03e05) · [§2.6](#26-active-collaboration-with-ai-s04e02) · [§2.7](#27-contextual-collaboration-in-daily--business-workflows-s04e03) · [§2.8](#28-personal-knowledge-base-for-ai-s04e04) · [§5.2.1](#521-code-mode--wykonanie-kodu-poza-pakietem)
- Lekcje: [04_05_review](../../lessons/04_05_review/) · [04_05_apps](../../lessons/04_05_apps/) · [03_05_apps](../../lessons/03_05_apps/)
- Transkrypt: `markdowns/s04e05-projektowanie-rozwiazan-wewnatrzfirmowych-1775189135.md`

*(Implementujący poprawi anchory nagłówków po wstawieniu §2.9.)*

### Uzupełnienie §2.8 — odniesienia (D2)

Na końcu bloku **Odniesienia** w §2.8 dodać link do §2.9 (jedna linia), np.:

`· [§2.9 Internal solutions design (S04E05)](#29-internal-solutions-design-s04e05)`

### Uzupełnienie §2.4 — odniesienia (D2b)

W bloku **Odniesienia** §2.4 dodać:

`· [04_05_apps](../../lessons/04_05_apps/) (S04E05 — MCP Apps pod procesy biznesowe) · [§2.9](#29-internal-solutions-design-s04e05)`

### Uzupełnienie §2.6 — odniesienia (D2b)

W bloku **Odniesienia** §2.6 dodać:

`· [04_05_apps](../../lessons/04_05_apps/) · [§2.9](#29-internal-solutions-design-s04e05)`

---

## 5. Zmiany w README boilerplate (D3 — szkic)

### Related packages — nowe wiersze

| [`lessons/04_05_review`](../../lessons/04_05_review/README.md) | S04E05: document review agent, paragraph chunking, HITL accept/reject UI | Full review host; **not** `@ai-devs/agent-boilerplate` |
| [`lessons/04_05_apps`](../../lessons/04_05_apps/README.md) | S04E05: remote MCP + MCP Apps for business workflows (sales, newsletter, todos) | MCP Apps host / `AppBridge`; **not** `@ai-devs/agent-boilerplate` |

### Quick decision guide — nowy wiersz

| Internal / enterprise AI (checklists, document review UI, MCP Apps for multi-SaaS) | [§2.9 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#29-internal-solutions-design-s04e05) + lessons `04_05_review` / `04_05_apps` | `documentReview` module, MCP Apps SDK, streaming UI in boilerplate package |

*(Anchor dopasować po D1.)*

---

## 6. CHANGELOG (D4 — szkic)

```markdown
- **S04E05 (internal solutions):** §2.9 in `tasks/docs/boilerplate-documentation.md` (enterprise adoption, light docs, review orchestrator + HITL, MCP Apps); cross-links in §2.4, §2.6, §2.8; README Quick decision + Related packages rows for `04_05_review` / `04_05_apps`; lesson README links.
```

---

## 7. Kryteria akceptacji (Definition of Done)

- [x] W `tasks/docs/boilerplate-documentation.md` istnieje **`### 2.9.`** (S04E05) bezpośrednio pod §2.8
- [x] §2.9: wstęp (≤6 zdań) + tabela **Wzorzec / Antywzorzec / Gdzie** (≥11 wierszy, w tym `foodwarehouse`)
- [x] Reguła kciuka (blok `text`) obecna w §2.9
- [x] Brak obietnic: `documentReview`, MCP Apps, streaming w `createAgent`
- [x] §2.8 odniesienia zawierają link do §2.9
- [x] §2.4 i §2.6 odniesienia zawierają `04_05_apps` + §2.9
- [x] Cross-linki §2.9 ↔ §2.1, §2.4, §2.6, §2.7, §2.8, research, lekcje — działają z `tasks/docs/`
- [x] README: **1 wiersz** Quick decision + **2 wiersze** Related packages
- [x] CHANGELOG (Unreleased) zaktualizowany
- [x] D7: `04_05_review/README.md` i `04_05_apps/README.md` — link do §2.9
- [x] Research: status + link do planu; po implementacji „zrealizowany”
- [x] Review ręczny: §2.1–§2.9 czytelne w <10 min
- [x] `git diff` — zero plików w `tasks/boilerplate/src/`

---

## 8. Plan zadań

| ID | Typ | Zadanie | Definition of done |
| --- | --- | --- | --- |
| D1 | [MODIFY] | Wstawić `### 2.9.` do `tasks/docs/boilerplate-documentation.md` między końcem §2.8 a `---` przed §3 | ✅ |
| D2 | [REUSE] | Cross-linki: §2.8 → §2.9; §2.9 → §2.1–§2.8, research, lekcje | ✅ |
| D2b | [MODIFY] | §2.4 i §2.6 — uzupełnić **Odniesienia** o `04_05_apps` + §2.9 | ✅ |
| D3 | [MODIFY] | README: 1 wiersz Quick decision + 2 wiersze Related packages (§5 planu) | ✅ |
| D4 | [MODIFY] | `CHANGELOG.md` — wpis docs S04E05 | ✅ |
| D5 | [MODIFY] | Research: status + link do planu; po implementacji „zrealizowany” | ✅ |
| D7a | [MODIFY] | `lessons/04_05_review/README.md` — link do §2.9 | ✅ |
| D7b | [MODIFY] | `lessons/04_05_apps/README.md` — link do §2.9 | ✅ |

**Kolejność:** D1 → D2 → D2b → D3 → D4 → D7a → D7b → D5.

**Bramki jakości:** `git diff` na plikach Markdown; klik 2–3 linków w IDE. Brak `bun test` / `tsc` (tylko docs).

---

## 9. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Duplikacja §2.4 / §2.6 / §2.8 w §2.9 | §2.9 = wdrożenie firmowe + UI + orchestrator; vault w §2.8; MCP Apps intro w §2.4 |
| Student dodaje review-engine do core | Antywzorzec w tabeli + README „Skip” |
| Mylenie `ask_human` z UI accept/reject | Jawne: terminal vs Svelte tooltip w lekcji |
| Zbyt długi §2.9 (konspekt adopcji) | Tabela wzorców, nie powtórka §0 research |
| `foodwarehouse` sugeruje agenta magazynowego | Jawne: deterministyczna orchestracja HTTP/SQLite |
| Lekcja scheduled 2026-04-03 | Docs bez zmian runtime |

---

## 10. Bezpieczeństwo

| Obszar | Uwaga |
| --- | --- |
| Docs | Nie sugerować nieodwracalnych narzędzi w default MCP |
| Review | Akceptacja zmian przez człowieka w UI — nie w `createAgent` |
| MCP Apps | Deterministyczne przyciski w hostcie — komplement do ReAct |

---

## 11. Testowanie

| Typ | Działanie |
| --- | --- |
| Automatyczne | Brak (tylko Markdown) |
| Manualne | Przejść linki §2.9 → `04_05_review`, `04_05_apps` |
| Manualne | Sprawdzić README Quick decision vs §2.9 |
| Manualne | §2.4 / §2.6 — czy link do `04_05_apps` nie duplikuje całej §2.9 |
| Regresja | `git diff` — zero plików w `tasks/boilerplate/src/` |

---

## 12. Human gate

**Przed implementacją:** akceptacja tego planu (scope = D1–D7b, docs-only, osobny MR).

**Po implementacji:** krótki review diff — czy §2.1–§2.9 razem opisują linię kursu bez czytania research.

**Homework `foodwarehouse` / `tasks/s04e05/`:** osobna akceptacja scope, gdy zechcesz implementować epizod.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-29 | Plan początkowy — Opcja A: §2.9, cross-linki §2.4/§2.6/§2.8, README (3 wiersze), CHANGELOG, lesson README links D7; bez runtime; bez homework `foodwarehouse` |
| 2026-06-29 | D1–D7b zrealizowane po akceptacji planu |
