# Plan wdrożenia — Niedeterministyczna natura modeli (S03E05) w dokumentacji boilerplate

**Normatywny research:** [s03e05-nondeterministic-models.research.md](s03e05-nondeterministic-models.research.md) — zaakceptowany; **Opcja A** (tylko dokumentacja).  
**Workspace:** `tasks/docs/boilerplate-documentation.md`, `tasks/boilerplate/README.md`, `tasks/boilerplate/CHANGELOG.md`  
**Status:** Zrealizowany (2026-06-03) — D1–D5.

**Decyzje (z research §5–§6):**

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Epizod `tasks/s03e05/` w tym samym PR? | **Nie** — homework osobny wątek |
| 2 | Przykład `http_request` → toolsearch? | **Tak** — jeden blok JSON w §2.4 (nie osobna sekcja Feature catalog) |
| 3 | `toolDiscovery` vs hub toolsearch? | **Tak** — wiersz tabeli + reguła kciuka; bez zmiany `coreToolNames` |
| 4 | Pakiet `@ai-devs/agent-ui` | **Defer** — brak w planie |

**Uwaga numeracji:** W `boilerplate-documentation.md` są §2.1–§2.3. Nowa sekcja to **`### 2.4.`** — wstawiona **po** §2.3, **przed** `---` i §3 (Directory Tree).

**Weryfikacja UI:** brak.

---

## 1. Zakres (scope)

**W zakresie:**

| ID | Element | Opis |
| --- | --- | --- |
| D1 | `tasks/docs/boilerplate-documentation.md` | **`### 2.4. Non-deterministic models as advantage (S03E05)`** — wstęp + tabela + reguła kciuka + przykład toolsearch + odniesienia |
| D2 | Cross-linki | §2.1 ↔ §2.2 ↔ §2.3 ↔ §2.4; research; lekcje `03_05_*`; `tool-discovery` research |
| D3 | `tasks/boilerplate/README.md` | Wiersz **Related packages** + jeden wiersz **Quick decision guide** |
| D4 | `tasks/boilerplate/CHANGELOG.md` | Wpis docs-only S03E05 |
| D5 | Research | Status „plan zaakceptowany”, link do tego pliku |

**Poza zakresem (jawnie):**

- `tasks/boilerplate/src/`, testy, `package.json`, `config.ts`
- Natywne `think` / `recall`, scout, artefakty, JSON Render, MCP Apps host
- MCP `hub_toolsearch` w pakiecie
- Epizod `tasks/s03e05/` (homework `savethem`)
- Zmiany w `lessons/03_05_*`
- Nowe zależności npm
- Domyślna zmiana `system.md` pakietu na „szeroką generalizację”

---

## 2. Decyzje projektowe

| # | Decyzja |
| --- | --- |
| 1 | Sekcja **normatywna, edukacyjna** — *kiedy szeroka przestrzeń zachowań vs deterministyczny hub*, nie roadmapa UI/awareness w core |
| 2 | **Lokalizacja:** `### 2.4.` **zaraz po** §2.3, **przed** `---` i §3 |
| 3 | **Długość:** ~45–60 linii — wstęp + tabela (≥12 wierszy) + reguła kciuka + blok JSON toolsearch (~8 linii) + odniesienia |
| 4 | **Język:** polski — spójnie z §2.1–§2.3 |
| 5 | **Linki względne** od `tasks/docs/`: research S03E05, `lessons/03_05_awareness/` (główny reference), pozostałe demo `03_05_*`, research `tool-discovery` |
| 6 | **Spójność:** §2.2 = metadata / triggery; §2.4 = **proaktywność konwersacyjna** i **generatywne UI** jako lekcje; hub homework = wąski ReAct |
| 7 | **`think`/`recall`:** wyłącznie lekcja awareness — **bez** eksportu do pakietu |
| 8 | **Homework `savethem`:** mapowanie na `http_request` + `submit_to_hub`; toolsearch = HTTP, nie nowe API boilerplate |
| 9 | **README:** minimalna zmiana (2 wiersze tabel) — przykład JSON tylko w §2.4 dokumentacji |
| 10 | **Bramki jakości:** brak `bun test` / `tsc` (tylko Markdown) |

---

## 3. Treść docelowa (szkic do wdrożenia)

Implementujący agent **nie kopiuje** research 1:1 — streszcza do tabeli poniżej.

### Wstęp (szkic)

> Lekcja S03E05 uczy wykorzystania **niedeterminizmu** LLM (szeroka przestrzeń interpretacji, proaktywność, synteza) przy jednoczesnym wyznaczaniu **granic** w kodzie i promptach — architektura kognitywna (CoALA), nie „pełna kontrola skryptem”. Runtime boilerplate (`createAgent`, `http_request`, `toolDiscovery`, `reasoning` w adapterze) **pozostaje bez zmian**; demo `03_05_*` i homework `savethem` realizujesz w lekcjach / epizodzie.

### Tabela wzorców vs antywzorców (docelowa)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Profil agenta hub** | Wąski ReAct, jawne cele, ≤5 tur, deterministyczna weryfikacja hub | Kopiowanie agenta „świadomego” z lekcji do każdego zadania | §2.1; epizody `tasks/sXXeYY/` |
| **Szeroka przestrzeń zachowań** | Ogólne instrukcje + metadata + pamięć plikowa; model wybiera **kiedy** działać | Sztywne if/else w prompcie dla każdej sytuacji | [03_05_awareness](../../lessons/03_05_awareness/) |
| **`think` / `recall`** | Narzędzia „zastanów się” + odkrywanie pamięci | Wymaganie tych narzędzi w boilerplate | `lessons/03_05_awareness/src/core/tools.ts` |
| **Reasoning API** | `reasoning` / `reasoning_effort` per wywołanie w epizodzie (koszt świadomy) | Domyślne `high` dla wszystkich zadań kursu | `src/agent/ai.ts`; env epizodu |
| **Powtarzalność** | Akceptuj podobne wyniki przy tym samym kontekście; testuj trajektorie, nie jeden seed | Traktowanie LLM jak funkcji czystej | `agent-evals` (opcjonalnie) |
| **Hub toolsearch (savethem)** | `http_request` POST na hub; angielskie `query`; odkryte API = ten sam kontrakt | Wbudowany MCP `toolsearch` w pakiecie | epizod `s03e05` (planowany); §2.4 przykład JSON |
| **Lazy discovery (lokalne MCP)** | `toolDiscovery: { enabled: true }` gdy wiele proxy-MCP po odkryciu hub | Mylenie z HTTP toolsearch (inny mechanizm) | [tool-discovery research](../tool-discovery/tool-discovery.research.md); README § Tool discovery |
| **Artefakty HTML** | iframe + biblioteki znane modelowi (Tailwind 3, Chart.js…) | Generowanie UI w default boilerplate | [03_05_artifacts](../../lessons/03_05_artifacts/) |
| **JSON Render** | Stan JSON → szablon; zapis/wczytanie stanu | Pełny HTML z modelu gdy potrzebna kontrola | [03_05_render](../../lessons/03_05_render/) |
| **MCP Apps** | Host UI + sync stanu po interakcji użytkownika | Playwright / MCP Apps w default install | [03_05_apps](../../lessons/03_05_apps/); §2.2 |
| **Generatywne UI na produkcji** | Balans: artefakt vs JSON vs MCP Apps („kiedy X, kiedy Y”) | Jedna ścieżka „zawsze HTML z LLM” | lekcja S03E05 |
| **Homework `savethem`** | ReAct + odkrywanie narzędzi + optymalizacja trasy → tablica ruchów `/verify` | Solver trasy w `createAgent` | markdown S03E05; `submit_to_hub` |

### Reguła kciuka (szkic)

```text
Homework hub (savethem: trasa, /verify) → default boilerplate + http_request; toolsearch i odkryte endpointy w epizodzie (angielskie query).
Agent konwersacyjny / think+recall / szerokie prompty → lekcja 03_05_awareness — nie domyślny pakiet.
Artefakty / JSON Render / MCP Apps → lekcje 03_05_artifacts | _render | _apps — host poza @ai-devs/agent-boilerplate.
Wiele lokalnych MCP po odkryciu API → toolDiscovery opt-in; HTTP toolsearch ≠ activate_tools, ten sam cel pedagogiczny.
```

### Przykład hub toolsearch (szkic — pod regułą)

Krótki opis: *Pierwsze wywołanie w epizodzie `savethem`; dalsze narzędzia zwraca toolsearch — każde z parametrem `query`.*

```json
{
  "url": "https://hub.ag3nts.org/api/toolsearch",
  "method": "POST",
  "body": {
    "apikey": "<HUB_API_KEY>",
    "query": "movement rules and terrain map"
  }
}
```

*(Implementujący: użyć placeholdera spójnego z `.env.example` / innymi przykładami hub w docs.)*

### Odniesienia (szkic)

- Research: [s03e05-nondeterministic-models.research.md](../s03e05-nondeterministic-models/s03e05-nondeterministic-models.research.md)
- Powiązane: [§2.1](./boilerplate-documentation.md#21-project-constraints-s03e02) · [§2.2](./boilerplate-documentation.md#22-contextual-feedback-s03e03) · [§2.3](./boilerplate-documentation.md#23-tool-design--test-data-s03e04)
- Lekcje: [03_05_awareness](../../lessons/03_05_awareness/) · [03_05_artifacts](../../lessons/03_05_artifacts/) · [03_05_render](../../lessons/03_05_render/) · [03_05_apps](../../lessons/03_05_apps/)
- Discovery: [tool-discovery.research.md](../tool-discovery/tool-discovery.research.md)
- Transkrypt: markdown S03E05 w `markdowns/`

*(Implementujący poprawi anchory nagłówków po wstawieniu §2.4.)*

---

## 4. Zmiany w README (D3 — szkic)

### Related packages — nowy wiersz

| Package / location | Purpose | When |
| --- | --- | --- |
| [`lessons/03_05_awareness`](../../lessons/03_05_awareness/README.md) | Situational / cognitive agent patterns (`think`, `recall`, scout); wide behavioral space | Coaching-style demos; **not** default hub homework profile |

*(Opcjonalnie drugi wiersz skrócony: `03_05_artifacts` / `_render` / `_apps` — **jeden wiersz zbiorczy** zamiast trzech, żeby nie puchnąć tabeli:)*

| [`lessons/03_05_*`](../../lessons/03_05_awareness/) | Generative UI (HTML artifacts, JSON render, MCP Apps) | Data viz / interactive UI lessons; **not** in boilerplate |

**Decyzja planu:** **jeden** wiersz zbiorczy `03_05_*` (awareness + UI demos) — łącznie **2 nowe wiersze** w Related packages (awareness + UI bundle) **albo** **1 wiersz** łączący oba — implementujący wybiera **max 2 wiersze** łącznie z Quick decision (patrz §6 DoD).

**Uproszczenie (zalecane):** **1 wiersz** Related packages:

| [`lessons/03_05_*`](../../lessons/03_05_awareness/README.md) | S03E05: awareness (`think`/`recall`) + generative UI demos (artifacts, render, MCP Apps) | Non-deterministic / wide-space agents; **not** default `@ai-devs/agent-boilerplate` |

### Quick decision guide — nowy wiersz

| You need… | Use | Skip |
| --- | --- | --- |
| Wide behavioral space or hub `toolsearch` homework (`savethem`) | [§2.4 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#24-non-deterministic-models-as-advantage-s03e05) + episode MCP/`http_request` | `think`/`recall`/UI host in boilerplate package |

*(Anchor dopasować do faktycznego slug nagłówka po D1.)*

---

## 5. CHANGELOG (D4 — szkic)

```markdown
### Documentation

- **S03E05 (non-deterministic models):** §2.4 in `tasks/docs/boilerplate-documentation.md` — cognitive/wide-space vs hub ReAct, generative UI lesson map, `savethem` + toolsearch via `http_request`; README related-package row for `03_05_*`.
```

---

## 6. Kryteria akceptacji (Definition of Done)

- [x] W `tasks/docs/boilerplate-documentation.md` istnieje **`### 2.4.`** (S03E05) bezpośrednio pod §2.3
- [x] Sekcja: wstęp (≤5 zdań) + tabela **Wzorzec / Antywzorzec / Gdzie** (≥12 wierszy)
- [x] Tabela zawiera: awareness vs hub, think/recall poza pakietem, toolsearch HTTP, toolDiscovery vs hub, trzy ścieżki UI, savethem
- [x] Reguła kciuka (blok `text`) obecna
- [x] Przykład JSON POST `toolsearch` obecny (bez prawdziwego apikey)
- [x] Linki względne do `lessons/03_05_*`, research, tool-discovery — działają z `tasks/docs/`
- [x] Brak obietnic: `think`/`recall`/MCP Apps/artefakty w pakiecie
- [x] Spójność z §2.1–§2.3 (nie duplikuje całych sekcji — odsyłki)
- [x] README: **≤2 nowe wiersze** łącznie (Related + Quick decision), bez innych diffów Feature catalog
- [x] CHANGELOG zaktualizowany
- [x] Research: status zaktualizowany + link do planu
- [x] Review ręczny: §2.1–§2.4 czytelne w <4 min

---

## 7. Plan zadań

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| D1 | [MODIFY] | Wstawić `### 2.4.` do `tasks/docs/boilerplate-documentation.md` między końcem §2.3 a `---` przed §3, według §3 planu | ✅ |
| D2 | [REUSE] | Cross-linki: §2.1–§2.4; research; lekcje; tool-discovery; anchory | ✅ |
| D3 | [MODIFY] | README: max 2 wiersze (Related packages + Quick decision), §4 planu | ✅ |
| D4 | [MODIFY] | `CHANGELOG.md` — wpis docs S03E05 | ✅ |
| D5 | [MODIFY] | Research: status „plan zaakceptowany” / „zrealizowany”, link do planu | ✅ |

**Kolejność:** D1 → D2 → D3 → D4 → D5.

**Bramki jakości:** `git diff` na plikach Markdown; klik 2–3 linków w IDE. Brak `bun test` / `tsc`.

---

## 8. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Student kopiuje awareness do savethem | Wiersz homework + reguła kciuka: hub = wąski ReAct |
| Mylenie toolsearch z `toolDiscovery` | Osobne wiersze tabeli + link do research tool-discovery |
| §2.4 za długa | Limit ~60 linii; UI demos jeden wiersz tabeli zbiorczy |
| Sugestia MCP Apps w boilerplate | Jawny antywzorzec + §2.2 odsyłka |
| Publikacja lekcji 2026-03-27 | Homework może się doprecyzować — aktualizacja §2.4 bez zmian runtime |

---

## 9. Bezpieczeństwo

| Obszar | Uwaga |
| --- | --- |
| Przykład JSON | Placeholder apikey; nie committować `tasks/.env` |
| Artefakty / iframe | Tylko wzmianka w docs — sandbox/uprawnienia w lekcji |
| Szerokie prompty | Docs: nie umieszczać sekretów w „ogólnych” instrukcjach (spójne z §2.1) |

---

## 10. Testowanie

| Typ | Działanie |
| --- | --- |
| Automatyczne | Brak (tylko Markdown) |
| Manualne | Przejść linki z `tasks/docs/boilerplate-documentation.md` do `lessons/03_05_awareness/` |
| Manualne | Sprawdzić spójność z README Feature catalog / toolDiscovery |
| Regresja | `git diff` — zero plików w `src/` |

---

## 11. Human gate

**Przed implementacją:** akceptacja tego planu (scope = D1–D5, docs + minimalny README + CHANGELOG).

**Po implementacji:** krótki review diff — czy §2.1–§2.4 razem opisują linię S03 bez czytania research.

**Homework `tasks/s03e05/`:** osobna akceptacja scope, gdy zechcesz implementować `savethem`.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-03 | Plan początkowy — Opcja A: §2.4 w `boilerplate-documentation.md`, README (≤2 wiersze), CHANGELOG; bez runtime, bez epizodu s03e05 |
| 2026-06-03 | D1–D5 zrealizowane po akceptacji planu |
