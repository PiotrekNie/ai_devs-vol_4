# Plan wdrożenia — Wdrożenia rozwiązań AI (S04E01) w dokumentacji boilerplate

**Normatywny research:** [s04e01-production-deployments.research.md](s04e01-production-deployments.research.md) — zaakceptowany; **Opcja A** (tylko dokumentacja).  
**Workspace:** `tasks/docs/boilerplate-documentation.md`, `tasks/boilerplate/README.md`, `tasks/boilerplate/CHANGELOG.md`, opcjonalnie `lessons/04_01_garden/README.md`  
**Status:** Zrealizowany (2026-06-11) — D1–D6.

**Decyzje (z research §5–§7):**

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Link do homework `okoeditor` w §2.5? | **Nie** — tylko ogólny profil „epizody hub” |
| 2 | Diagram hub vs garden w README? | **Nie** — jeden wiersz Quick decision z linkiem do §2.5 |
| 3 | Pakiet `@ai-devs/agent-garden`? | **Defer** — brak w planie |
| 4 | Daytona w §5.2.1? | **Tak** — wiersz w tabeli lekcji + odsyłka z §2.5 |
| 5 | `04_01_garden` konsumuje boilerplate? | **Poza scope** — lekcja pozostaje osobnym runtime |
| 6 | Opcja B (README lekcji)? | **Tak (D6)** — brak `lessons/04_01_garden/README.md` w repo |

**Uwaga numeracji:** W `boilerplate-documentation.md` są §2.1–§2.4. Nowa sekcja to **`### 2.5.`** — wstawiona **po** §2.4, **przed** `---` i §3 (Directory Tree).

**Weryfikacja UI:** brak.

---

## 1. Zakres (scope)

**W zakresie:**

| ID | Element | Opis |
| --- | --- | --- |
| D1 | `tasks/docs/boilerplate-documentation.md` | **`### 2.5. Production deployments (S04E01)`** — wstęp + tabela + reguła kciuka + odniesienia |
| D2 | Cross-linki + §5.2.1 | §2.1–§2.5 wzajemnie; research S04E01; `04_01_garden`; `03_02_events`; **wiersz Daytona** w tabeli lekcji §5.2.1 |
| D3 | `tasks/boilerplate/README.md` | **≤2 nowe wiersze** (Related packages + Quick decision guide) |
| D4 | `tasks/boilerplate/CHANGELOG.md` | Wpis docs-only S04E01 |
| D5 | Research | Status „plan zaakceptowany” / po implementacji „zrealizowany”, link do tego pliku |
| D6 | `lessons/04_01_garden/README.md` | Krótki README (~40–60 linii): cel lekcji, `npm start` / `preview`, relacja do boilerplate (**nie** import pakietu) |

**Poza zakresem (jawnie):**

- `tasks/boilerplate/src/`, testy, `package.json`, `config.ts`
- Daytona, `terminal`, `git_push`, skills loader, workflows, `write_file` w core
- Pakiet `@ai-devs/agent-garden` lub `@ai-devs/agent-code-mode`
- Epizod `tasks/s04e01/` (homework `okoeditor`)
- Zmiany w kodzie `lessons/04_01_garden/src/` (tylko opcjonalny README)
- Nowe zależności npm
- Pełny port garden do boilerplate

---

## 2. Decyzje projektowe

| # | Decyzja |
| --- | --- |
| 1 | Sekcja **normatywna, edukacyjna** — *profil wdrożeniowy vs epizod hub*, nie roadmapa produktowa |
| 2 | **Lokalizacja:** `### 2.5.` **zaraz po** §2.4, **przed** `---` i §3 |
| 3 | **Długość §2.5:** ~50–65 linii — wstęp + tabela (≥14 wierszy) + reguła kciuka + odniesienia |
| 4 | **Język:** polski — spójnie z §2.1–§2.4 |
| 5 | **Linki względne** od `tasks/docs/`: research S04E01, `lessons/04_01_garden/`, `03_02_events`, `sandbox-code-execution` |
| 6 | **Spójność:** §2.2 = sync metadata; §2.5 = **sync vs async wdrożenie** + garden jako **aplikacja referencyjna** |
| 7 | **Garden:** wyłącznie lekcja — **bez** sugestii importu `@ai-devs/agent-boilerplate` w `04_01_garden` |
| 8 | **§5.2.1:** jeden wiersz `lessons/04_01_garden` \| Daytona \| terminal + code_mode + git — bez rozbudowy całego research sandbox |
| 9 | **README boilerplate:** max **2 wiersze** łącznie (Related + Quick decision) |
| 10 | **Bramki jakości:** brak `bun test` / `tsc` (Markdown); D6 nie wymaga uruchomienia lekcji |

---

## 3. Treść docelowa (szkic do wdrożenia)

Implementujący agent **nie kopiuje** research 1:1 — streszcza do tabeli poniżej.

### Wstęp (szkic)

> Lekcja S04E01 uczy **wdrażania** rozwiązań AI: oczekiwania vs ograniczenia, współpraca synchroniczna vs asynchroniczna, balans kodu i modelu oraz szybkie testy hipotez przed pełnym produktem. Runtime boilerplate (`createAgent`, MCP, `http_request`, `/verify`) **pozostaje bez zmian** dla typowych epizodów hub; referencyjna aplikacja **Cyfrowy Ogród** (`04_01_garden`) — osobna lekcja, nie rozszerzenie pakietu.

### Tabela wzorców vs antywzorców (docelowa)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Profil systemu** | Epizod hub: wąski ReAct, `http_request`, `/verify`, brak mutacji repo | Kopiowanie `04_01_garden` do każdego `tasks/sXXeYY/` | [§2.1](./boilerplate-documentation.md#21-project-constraints-s03e02); epizody `tasks/` |
| **Wdrożenie produkcyjne** | Dogfooding, iteracje, jawne „czego nie robimy” | „Pełna automatyzacja” bez guardów | lekcja S04E01; [04_01_garden](../../lessons/04_01_garden/) |
| **Oczekiwania vs rzeczywistość** | Limity kontekstu/kosztu w MCP i promptach | Obietnica „dowolnej automatyzacji” w core | [§2.1](./boilerplate-documentation.md#21-project-constraints-s03e02) |
| **Sync (człowiek w pętli)** | `ask_human`, krótka sesja, nadzór przy destrukcyjnych akcjach | Terminal/git w default pakiecie | `ask_human`; [§2.2](./boilerplate-documentation.md#22-contextual-feedback-s03e03) |
| **Async (tło)** | Osobny entrypoint, cron, `tasks.md` | Heartbeat w `createAgent` | [03_02_events](../../lessons/03_02_events/) |
| **Balans kod / AI** | Deterministyczna logika w MCP TypeScript | Model wybiera ścieżkę API / merge ID | [§2.1](./boilerplate-documentation.md#21-project-constraints-s03e02) |
| **Sandbox plików (hub)** | `read_file` chroot, chunking | `write_file` / shell w core | [§5.2.1](./boilerplate-documentation.md#521-code-mode--wykonanie-kodu-poza-pakietem) |
| **Sandbox wykonania** | Lekcja: QuickJS, Deno lub **Daytona** (garden) | `execute_code` w default install | [02_05_sandbox](../../lessons/02_05_sandbox/); [03_02_code](../../lessons/03_02_code/); [04_01_garden](../../lessons/04_01_garden/) |
| **Code mode (garden)** | Node w VM + `codemode.vault.*` w lekcji | Wbudowany code mode w boilerplate | `lessons/04_01_garden/src/tools/code-mode.ts` |
| **Skills / workflows** | `SKILL.md`, `/invoke`, workflows w hoście aplikacji | Publiczne API skills w `createAgent` | [04_01_garden/vault/system/](../../lessons/04_01_garden/vault/system/) |
| **Publikacja treści** | CI (GitHub Actions) + static site poza agentem | `git_push` w MCP kursu | garden `.github/workflows/` |
| **Static site (grove)** | MD → HTML w kodzie buildera | Generowanie HTML z modelu w boilerplate | [grove/](../../lessons/04_01_garden/grove/) |
| **Test hipotez** | Frontmatter w MD, dataset + eval przed chatbotem | Pełny RAG/chat „na wszelki wypadek” | [§2.3](./boilerplate-documentation.md#23-tool-design--test-data-s03e04); [agent-evals](../../agent-evals/README.md) |
| **Dostępność wiedzy** | Wyszukiwarka / link do dokumentu | Obowiązkowy chatbot | decyzja produktowa — docs |
| **`@ai-devs/agent-garden`** | Defer — osobny pakiet gdy ≥2 epizody | Port garden do core boilerplate | research §5 Opcja C |

### Reguła kciuka (szkic)

```text
Epizod hub (HTTP, ≤5 tur, brak mutacji repo) → default boilerplate.
Wdrożenie jak Digital Garden (terminal, git, publikacja, skills) → lessons/04_01_garden — nie rozszerzaj pakietu.
Orchestracja czasu / agenci w tle → lessons/03_02_events — nie createAgent.
Potrzebujesz write/terminal → lekcja garden lub epizod z jawnymi guardami — nie core.
```

### Odniesienia (szkic)

- Research: [s04e01-production-deployments.research.md](../s04e01-production-deployments/s04e01-production-deployments.research.md)
- Powiązane: [§2.1](./boilerplate-documentation.md#21-project-constraints-s03e02) · [§2.2](./boilerplate-documentation.md#22-contextual-feedback-s03e03) · [§2.3](./boilerplate-documentation.md#23-tool-design--test-data-s03e04) · [§2.4](./boilerplate-documentation.md#24-non-deterministic-models-as-advantage-s03e05) · [§5.2.1](./boilerplate-documentation.md#521-code-mode--wykonanie-kodu-poza-pakietem)
- Lekcje: [04_01_garden](../../lessons/04_01_garden/) · [03_02_events](../../lessons/03_02_events/)
- Sandbox: [sandbox-code-execution.research.md](../sandbox-code-execution/sandbox-code-execution.research.md)
- Transkrypt: `markdowns/s04e01-wdrozenia-rozwiazan-ai-1774824465.md`

*(Implementujący poprawi anchory nagłówków po wstawieniu §2.5.)*

### Uzupełnienie §5.2.1 (D2 — wiersz tabeli lekcji)

Dodać **po** wierszu `03_02_code`:

| `lessons/04_01_garden` | Daytona (zdalny VM), `terminal`, `code_mode`, sync `vault/` | Wdrożeniowy Digital Garden; publikacja przez CI — **nie** profil homework hub |

Krótki akapit (1–2 zdania) pod tabelą: odsyłka do §2.5 dla mapowania profilu wdrożeniowego.

---

## 4. Zmiany w README boilerplate (D3 — szkic)

### Related packages — nowy wiersz

| [`lessons/04_01_garden`](../../lessons/04_01_garden/README.md) | S04E01: Digital Garden — Daytona sandbox, skills/workflows, static site publish | Production-style deployment demo; **not** `@ai-devs/agent-boilerplate` |

### Quick decision guide — nowy wiersz

| Production deployment / Digital Garden (terminal, git, publish) | [§2.5 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#25-production-deployments-s04e01) + lesson `04_01_garden` | Daytona, `git_push`, skills in boilerplate package |

*(Anchor dopasować do faktycznego slug nagłówka po D1.)*

---

## 5. README lekcji `04_01_garden` (D6 — szkic)

Plik **nowy** — krótka dokumentacja startowa:

1. **Cel** — conversation-driven vault + `npm run preview` + opcjonalny deploy Pages  
2. **Wymagania** — `OPENAI_API_KEY`, klucze Daytona (jeśli używane), `npm install`  
3. **Komendy** — `npm start`, `npm run preview` (z `package.json` lekcji)  
4. **Relacja do boilerplate** — *„Osobny runtime (Responses API, własna pętla). Epizody hub używają `@ai-devs/agent-boilerplate` — patrz [§2.5](../../../tasks/docs/boilerplate-documentation.md).”*  
5. **Linki** — `vault/system/agent-architecture-concepts.md`, transkrypt S04E01

**Nie** dodawać zależności od boilerplate w `package.json` lekcji.

---

## 6. CHANGELOG (D4 — szkic)

```markdown
### Documentation

- **S04E01 (production deployments):** §2.5 in `tasks/docs/boilerplate-documentation.md` — hub vs deployment profile, Digital Garden lesson map, sync/async, hypothesis testing; §5.2.1 Daytona row; README rows for `04_01_garden`; optional `lessons/04_01_garden/README.md`.
```

---

## 7. Kryteria akceptacji (Definition of Done)

- [x] W `tasks/docs/boilerplate-documentation.md` istnieje **`### 2.5.`** (S04E01) bezpośrednio pod §2.4
- [x] Sekcja: wstęp (≤5 zdań) + tabela **Wzorzec / Antywzorzec / Gdzie** (≥14 wierszy)
- [x] Tabela zawiera: hub vs garden, sync/async, Daytona, skills/workflows, git/publish poza pakietem, test hipotez, defer `agent-garden`
- [x] Reguła kciuka (blok `text`) obecna
- [x] Brak obietnic: terminal/Daytona/skills w pakiecie
- [x] §5.2.1: wiersz `04_01_garden` + krótka odsyłka do §2.5
- [x] Cross-linki §2.1–§2.5 i research — działają z `tasks/docs/`
- [x] README boilerplate: **≤2 nowe wiersze** łącznie
- [x] CHANGELOG zaktualizowany
- [x] Research: status + link do planu
- [x] `lessons/04_01_garden/README.md` istnieje (D6)
- [x] Review ręczny: §2.1–§2.5 czytelne w <5 min
- [x] `git diff` — zero plików w `tasks/boilerplate/src/`

---

## 8. Plan zadań

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| D1 | [MODIFY] | Wstawić `### 2.5.` do `tasks/docs/boilerplate-documentation.md` między końcem §2.4 a `---` przed §3, według §3 planu | ✅ |
| D2 | [REUSE] | Cross-linki §2.1–§2.5; wiersz Daytona w §5.2.1; anchory | ✅ |
| D3 | [MODIFY] | README boilerplate: max 2 wiersze (Related + Quick decision), §4 planu | ✅ |
| D4 | [MODIFY] | `CHANGELOG.md` — wpis docs S04E01 | ✅ |
| D5 | [MODIFY] | Research: status + link do planu | ✅ |
| D6 | [CREATE] | `lessons/04_01_garden/README.md` — szkic §5 planu | ✅ |

**Kolejność:** D1 → D2 → D3 → D4 → D5 → D6.

**Bramki jakości:** `git diff` na plikach Markdown; klik 2–3 linków w IDE. Brak `bun test` / `tsc`.

---

## 9. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Student kopiuje garden do epizodu hub | Reguła kciuka + wiersz profilu hub w tabeli |
| Mylenie Daytona z `read_file` chroot | Osobne wiersze sandbox + §5.2.1 |
| §2.5 za długa | Limit ~65 linii; garden jeden wiersz zbiorczy w tabeli |
| Sugestia `@ai-devs/agent-garden` jako planowanego core | Jawny wiersz **Defer** w tabeli |
| Lekcja scheduled 2026-03-30 | Aktualizacja docs bez zmian runtime |
| D6 wymaga kluczy Daytona | README opisuje env bez commitowania sekretów |

---

## 10. Bezpieczeństwo

| Obszar | Uwaga |
| --- | --- |
| Docs | Nie sugerować `git_push` / terminal w homework hub |
| D6 README | Nie committować `.env`; odwołanie do `.env.example` jeśli istnieje |
| Garden | Pozostaje poza default install — destrukcyjne narzędzia tylko w lekcji |

---

## 11. Testowanie

| Typ | Działanie |
| --- | --- |
| Automatyczne | Brak (tylko Markdown) |
| Manualne | Przejść linki z `tasks/docs/boilerplate-documentation.md` do `lessons/04_01_garden/` |
| Manualne | Sprawdzić spójność README Feature catalog z §2.5 |
| Regresja | `git diff` — zero plików w `src/` |

---

## 12. Human gate

**Przed implementacją:** akceptacja tego planu (scope = D1–D6, docs + minimalny README + CHANGELOG + README lekcji).

**Po implementacji:** krótki review diff — czy §2.1–§2.5 razem opisują linię kursu bez czytania research.

**Homework `okoeditor` / `tasks/s04e01/`:** osobna akceptacja scope, gdy zechcesz implementować epizod.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-11 | Plan początkowy — Opcja A: §2.5, §5.2.1 Daytona, README (≤2 wiersze), CHANGELOG, `04_01_garden/README.md`; bez runtime |
| 2026-06-11 | D1–D6 zrealizowane po akceptacji planu |
