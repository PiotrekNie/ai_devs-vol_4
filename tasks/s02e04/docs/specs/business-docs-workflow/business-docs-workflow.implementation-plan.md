# Plan implementacji: Business Manager Docs

**Normatywna specyfikacja (SSOT wymagań):** [business-docs-workflow.spec.md](business-docs-workflow.spec.md)

**Dokumentacja frameworka (Cursor Collections):** [documentation/cursor-collection.md](../../../documentation/cursor-collection.md)

Ten dokument utrwala **plan wdrożenia** workflow opisany w specyfikacji i skonsolidowany z analizą zgodności z aktualnymi konwencjami monorepo. **Wdrożenie kodu / plików reguł** następuje dopiero po osobnej akceptacji zakresu (bramki z `eversis-agent-core.mdc`).

---

## Zakres (scope)

Następujące elementy są **w zakresie** tego planu wdrożenia (monorepo Cursor Collections + artefakty workflowu BA):

- **Dokumentacja frameworka — osobny wariant playbook:** aktualizacja [documentation/cursor-collection.md](../../../documentation/cursor-collection.md) o **nową podsekcję „Workflow variants”** (lub równorzędny blok) dla toru **Business Manager Docs / dokumentacja biznesowa (.docx)** — **obok** istniejących wariantów (standard backend/full-stack, frontend/Figma, E2E, workshop/ideate). Opis musi **jednoznacznie rozróżniać** ten tor od `**eversis-implement`**: tam orchestruje **Engineering Manager** wdrożenie **kodu produktu** (research → plan → delegacje SWE/DevOps/E2E); tutaj **Planner → `docs-update-plan.md` → Writer** i edycja **Word** przez narzędzia **`.docx`** na serwerze **`eversis-collections`** (`mcp/eversis-collections-mcp/`), bez obowiązku toru `eversis-review-ui` / URL dev servera.
- **Prompty vs reguły (oba artefakty w zakresie):** framework **Cursor Collections** rozdziela `**.cursor/prompts/public/eversis-*.md`** (wykonywalny workflow, SOP; w Cursorze `**@` + stem** zwykle trafia tu) od `**.cursor/rules/eversis-*.mdc`** (rola agenta, granice, narzędzia; dołączanie `**@**` do pliku lub ścieżka jawna). Wywołanie w stylu `**@eversis-ba-docs-***` musi mieć w repozytorium **parę**: prompt + reguła; w SOP i w [business-docs-workflow.spec.md](business-docs-workflow.spec.md) jest **jawny zapis**, że przy potrzebie wymuszenia roli użytkownik **dołącza drugi plik pełną ścieżką** (por. §3.0 specyfikacji). Realizacja: zadania **B1–B4** oraz **B5** (§3).
- **Narzędzia `.docx` na `eversis-collections`** (`mcp/eversis-collections-mcp/`) — kontrakt narzędzi, test na fixture `.docx` (wg faz C w §3).
- **Konfiguracja workspace** — dokumentacja wpisów MCP w `AGENTS.md` / `.cursor/mcp.json` (bez sekretów w repozytorium).

**Poza zakresem** (chyba że osobna decyzja): pełna integracja produkcyjna SharePoint/tenant, szkolenie zespołu BA, szczegółowe SLA jakości dokumentów poza testem „na sucho” z § specyfikacji.

---

## 1. Skrót researchu (kontekst planu)


| Element        | Opis                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cel biznesowy  | Redukcja czasu aktualizacji dużych `.docx` po release, „relay race” w Cursor, zachowanie stylów.                                                               |
| SSOT dla reguł | Confluence (dynamicznie przez Atlassian MCP), nie statyczny kontekst w jednym prompcie.                                                                        |
| Artefakty      | `summary.md` (mapa dokumentu), `docs-update-plan.md` (wejście/wyjście Planner → Writer), zmiany w `.docx` przez narzędzia **`.docx`** na serwerze **`eversis-collections`** (`mcp/eversis-collections-mcp/`, OOXML przez JSZip / `@xmldom/xmldom`). |
| Integracje     | Atlassian MCP; docelowo SharePoint lub Confluence (publikacja — poza zakresem samego narzędzia Cursor).                                                        |


---

## 2. Analiza zgodności z cursor-collections

### 2.1. Zgodne


| Obszar                | Uzasadnienie                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Relay race / sztafety | Artefakt pośredni (`docs-update-plan.md`) + **bramka ludzka** przed Writerem — spójne z opisem batonów w `documentation/cursor-collection.md`. |
| MCP                   | Unikanie trzymania całości dokumentu w oknie; użycie serwerów narzędzi (m.in. Atlassian) zgodne z dokumentacją frameworka.                     |
| Prefiks `eversis-*`   | Spójne z `AGENTS.md` i layoutem `.cursor/prompts/` oraz `.cursor/rules/`.                                                                      |


### 2.2. Luki do domknięcia w implementacji docs + narzędzi

1. **Prompty vs reguły** — Patrz **§ Zakres (scope)** (para prompt + `.mdc`, jawne dołączenie ścieżką); normatywnie też [business-docs-workflow.spec.md](business-docs-workflow.spec.md) §3.0; realizacja **B1–B5** w §3.
2. **Wariant playbook w dokumentacji** — Patrz **§ Zakres (scope)** — normatywnie w zakresie planu; szczegóły realizacji w zadaniu **A1** (§3).
3. **Konwencja `docs/specs`** — Zestaw `*.spec.md` + towarzyszący `*.implementation-plan.md` jest zgodny ze strukturą folderu `business-docs-workflow/`; indywidualne README `docs/specs/` można uzupełnić jedną linią o `*.implementation-plan.md` (opcjonalnie).
4. **Ryzyko techniczne** — „Czerwony komentarz” w Word vs warstwa OOXML w implementacji: patrz **§7.1**.

---

## 3. Plan fazowy i zadania

Typy zgodne z `@eversis-implement`: `[CREATE]`, `[MODIFY]`, `[REUSE]`.

### Faza A — Dokumentacja frameworka i kontrakty


| ID  | Typ      | Zadanie                                                                                                                                                                                                    |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | [MODIFY] | Dodać w `documentation/cursor-collection.md` wariant workflow **Business / regulatory docs (.docx)** — Planner → `docs-update-plan.md` → Writer; MCP Atlassian + narzędzia `.docx` na **`eversis-collections`**.                                     |
| A2  | [MODIFY] | Opcjonalnie: jedna linia w [docs/specs/README.md](../README.md) o plikach `*.implementation-plan.md` obok `*.spec.md`.                                                                                     |
| A3  | [CREATE] | Po dodaniu publicznych promptów: upewnić się, że katalog `website/docs/prompts/overview.md` (jeśli stosowany) opisuje nowe stems po `sync-prompts`; nie dublować procedury poza SSOT w `.cursor/prompts/`. |


### Faza B — Role: reguły + prompty (`eversis-ba-docs-*`)


| ID  | Typ      | Zadanie                                                                                                                                                                                                                              |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B1  | [CREATE] | `.cursor/prompts/public/eversis-ba-docs-planner.md` — frontmatter Docusaurus; kroki: najpierw Confluence jako matryca, potem Jira Release, mapowanie do `summary.md`, wyjście `docs-update-plan.md`.                                 |
| B2  | [CREATE] | `.cursor/rules/eversis-ba-docs-planner.mdc` — rola Planner (Atlassian MCP; bez edycji `.docx` w tej roli).                                                                                                                           |
| B3  | [CREATE] | `.cursor/prompts/public/eversis-ba-docs-writer.md` — wejście `docs-update-plan.md`; wywołania narzędzi `.docx` (`eversis-collections`); obsługa flagi `[WYMAGA_AKTUALIZACJI_GRAFIKI]` zgodnie ze specyfikacją.                                      |
| B4  | [CREATE] | `.cursor/rules/eversis-ba-docs-writer.mdc` — rola Writer; granice (np. nie zmieniać źródeł reguł Confluence bez eskalacji).                                                                                                          |
| B5  | [REUSE]  | Walidacja spójności z [eversis-creating-prompts](../../../.cursor/skills/eversis-creating-prompts/SKILL.md) i [eversis-creating-agents](../../../.cursor/skills/eversis-creating-agents/SKILL.md) — krótkie reguły, SOP w promptach. |


### Faza C — Narzędzia `.docx` w `mcp/eversis-collections-mcp/` i konfiguracja workspace


| ID  | Typ      | Zadanie                                                                                                                                                                                   |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | [MODIFY] | Realizacja w `**mcp/eversis-collections-mcp/src/docx/**`: narzędzia `generate_summary_map`, `read_chapter`, `update_chapter`; stub `upload_to_sharepoint` z dokumentacją wymagań auth (jeden proces MCP z skillami i Wordem). |
| C2  | [MODIFY] | [AGENTS.md](../../../AGENTS.md) i/lub `[.cursor/mcp.json](../../../.cursor/mcp.json)` — wpis dokumentacyjny + instrukcja buildu; **bez** commitowania sekretów.                           |
| C3  | [CREATE] | Test integracyjny na małym fixture `.docx`: read/update bez niszczenia stylów; zdefiniować stabilny kontrakt `chapter_id`.                                                                |


### Faza D — Utrwalenie bramek procesowych


| ID  | Typ      | Zadanie                                                                                                                                                                                 |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | [MODIFY] | W playbooku / promptach Planner+Writer: po wygenerowaniu planu **obowiązkowa akceptacja ludzka** przed startem Writer; nawiązanie do `eversis-agent-core.mdc` (draft do zatwierdzenia). |


---

## 4. Lista TODO komplementarna z Cursor IDE

Sekcja **1:1 z ID z §3** — przeznaczona do:

- wklejenia jako **osobne pozycje w panelu zadań Agenta** (jedna pozycja = jedno ID; aktualizuj status po każdej fazie), albo
- odhaczania **checkboxów** w edytorze podczas pracy nad tym planem.

**Konfiguracja workspace (zanim zaczniesz implementację w repozytorium)**

- **IDE-CFG-01** — W *Cursor Settings → MCP* włączyć **Atlassian** (Jira + Confluence) dla przestrzeni z dokumentacją projektu; potwierdzić logowanie / token zgodnie z polityką firmy.
- **IDE-CFG-02** — Włączyć wpis **`eversis-collections`** w `[.cursor/mcp.json](../../../.cursor/mcp.json)` (stdio → `mcp/eversis-collections-mcp/dist/index.js`) po `npm install && npm run build` w [eversis-collections-mcp](../../../mcp/eversis-collections-mcp/); **zrestartować** serwery MCP w Cursorze po zmianie JSON.
- **IDE-CFG-03** — Zbudować [eversis-collections MCP](../../../mcp/eversis-collections-mcp/) przed użyciem Agenta: obejmuje zarówno `eversis_skills_*` (**B5**), jak i narzędzia `.docx` dla Writer.
- **IDE-CFG-04** — Upewnić się, że w *Cursor Settings → Indexing / Docs* nie indeksujesz duplikatów promptów: w tym monorepo `website/docs/prompts/` jest w `[.cursorignore](../../../.cursorignore)` — **SSOT to `.cursor/prompts/`**.

**Implementacja w repozytorium (mapowanie na §3)**

- **A1** — Zmiana `documentation/cursor-collection.md`: wariant *Business / regulatory docs (.docx)*.
- **A2** — Jedna linia w `docs/specs/README.md` o `*.implementation-plan.md`.
- **A3** — Po **B1/B3**: `sync-prompts` + uzupełnienie `website/docs/prompts/overview.md`, jeśli katalog ma wymieniać nowe stems.
- **B1** — Utworzyć `.cursor/prompts/public/eversis-ba-docs-planner.md`.
- **B2** — Utworzyć `.cursor/rules/eversis-ba-docs-planner.mdc` (`alwaysApply: false`, dołączanie `**@`** wg potrzeby).
- **B3** — Utworzyć `.cursor/prompts/public/eversis-ba-docs-writer.md`.
- **B4** — Utworzyć `.cursor/rules/eversis-ba-docs-writer.mdc`.
- **B5** — Nawigować Agentem do skilli [eversis-creating-prompts](../../../.cursor/skills/eversis-creating-prompts/SKILL.md) / [eversis-creating-agents](../../../.cursor/skills/eversis-creating-agents/SKILL.md); poprawić reguły/prompty tak, by nie duplikować długich SOP w `.mdc`.
- **C1** — Narzędzia `.docx` w `mcp/eversis-collections-mcp/` + dokumentacja uruchomienia (build serwera).
- **C2** — Zaktualizować `AGENTS.md` i/lub `.cursor/mcp.json` (bez sekretów w Git).
- **C3** — Fixture `.docx` + test read/update + kontrakt `chapter_id`.
- **D1** — W promptach **B1/B3** dopisać bramkę: plan = draft do akceptacji BA (nawiązanie do `eversis-agent-core.mdc`).

**Opcjonalnie — spójność z innymi promptami Eversis w tym repo**

- **IDE-CMD-01** — (Opcjonalnie) Cienkie pliki `[.cursor/commands/](../../../.cursor/commands/)` (`eversis-ba-docs-planner.md`, `eversis-ba-docs-writer.md`) wzorowane na `[eversis-implement.md](../../../.cursor/commands/eversis-implement.md)`, aby wywoływać flow z **/** w Chat/Agent.

**Tor operacyjny BA w Cursorze (po wdrożeniu artefaktów)**

- **OPS-01** — W **Composer / Agent** dołączyć `@eversis-ba-docs-planner` + kontekst: ID releasu Jira, tytuł strony Confluence z regułami, ścieżka lub treść `summary.md`.
- **OPS-02** — **Bramka:** przejrzeć i zaakceptować lub poprawić wygenerowany `docs-update-plan.md` przed kolejnym krokiem.
- **OPS-03** — Dołączyć `@eversis-ba-docs-writer` + `@docs-update-plan.md` + MCP **`eversis-collections`** uruchomiony (narzędzia `.docx`); po zapisie — przegląd ręczny `.docx` (grafika, tabela).
- **OPS-04** — Publikacja poza Cursorem (SharePoint / Confluence) zgodnie z procedurą organizacji.

> **Uwaga:** Ten tor **nie** wymaga podawania URL dev servera ani `eversis-review-ui` — inaczej niż frontendowy playbook z `[eversis-implement.md](../../../.cursor/prompts/public/eversis-implement.md)`.

---

## 5. Mapowanie na kamienie milowe ze specyfikacji


| Milestone w `.spec.md`               | Główny pokrycie w planie                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Faza 1 (instrukcje `.mdc` + prompty) | **B1–B5**, częściowo **A1**                                                                             |
| Faza 2 (Atlassian MCP + token)       | Konfiguracja u użytkownika / docs — **C2**, przypomnienia w **B1–B2**                                   |
| Faza 3 (narzędzia `.docx` / `eversis-collections`) | **C1**, **C3**                                                                                          |
| Faza 4 (`summary.md`)                | **C1** (`generate_summary_map`), kontrakt w **C3**                                                      |
| Faza 5 (E2E na sucho)                | **C3** rozszerzone o scenariusz „release historyczny” vs baseline manualny (wg acceptance w `.spec.md`) |


---

## 6. Kryteria akceptacji (wysoki poziom)

- Da się uruchomić workflow przez `**@`** + stem zgodnie z [AGENTS.md](../../../AGENTS.md) (prompty publiczne + ewentualnie jawne dołączenie reguł).
- `documentation/cursor-collection.md` opisuje ten tor obok pozostałych wariantów.
- Narzędzia `.docx` w `mcp/eversis-collections-mcp/` mają **udokumentowany kontrakt** rozdziałów (`chapter_id`) i test na realnym lub minimalnym `.docx`.
- Strategia znacznika grafiki jest **technicznie wykonalna** lub świadomie uproszczona po spike’u (bez obietnic sprzecznych z biblioteką).

---

## 7. Ryzyka


| Ryzyko                                        | Mitygacja                                                                                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| „Czerwony komentarz” w Word vs warstwa edycji OOXML | Krótki **spike** na kopii `.docx`; decyzja MVP po uzgodnieniu z BA (treść vs „prawdziwy” komentarz recenzji). **Szczegóły: §7.1.** |
| `chapter_id` / struktura dokumentów 400+ str. | Konwencja w `summary.md`; walidacja na kilku dokumentach pilotażowych.                                                             |
| SharePoint / tenant                           | Zakres `upload_to_sharepoint` tylko z dokumentacją i stubem do czasu uzgodnienia integracji z IT.                                  |


### 7.1. „Czerwony komentarz” — dwa znaczenia i warstwa edycji OOXML

W specyfikacji Writer wstawia **wyraźny, czerwony komentarz tekstowy** przy fladze `[WYMAGA_AKTUALIZACJI_GRAFIKI]`. W praktyce można to rozumieć na dwa sposoby:

1. **Komentarz recenzenta Worda** (*Recenzja → Komentarz*) — balon z boku, autor, często powiązanie z zakresem; typowy dla trybu recenzji.
2. **Zwykła treść sformatowana jak ostrzeżenie** — np. stały tekst `>>> … <<<` z **czerwoną czcionką** / pogrubieniem w akapicie (zgodnie z brzmieniem „komentarz tekstowy” w spec).

**Implementacja w tym repozytorium** (`mcp/eversis-collections-mcp`, JSZip + `@xmldom/xmldom`) operuje na OOXML (`word/document.xml`). **Formatowanie znaków i akapitów** (kolor, bold) jest zwykle realizowalne przy wariancie (2) przez manipulację `w:r` / `w:rPr` / `w:pPr` — MVP należy potwierdzić krótkim **spike’iem** na dokumentach pilotażowych.

**Pełne natywne komentarze recenzji** (wariant 1) wymagają w OOXML elementów typu `w:comment` i powiązań z zakresami; biblioteki wysokiego poziomu często ich nie udostępniają, a ręczny OOXML jest **ryzykowny** (wersja Worda, dalsza edycja dokumentu).

**Strategie MVP (po spike’u):**


| Strategia                          | Opis                                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stylizowany tekst ostrzegawczy** | Ten sam komunikat co w specyfikacji, jako treść w dokumencie — typowy MVP przy edycji treści przez `w:p`/`w:r`.                                 |
| **Komentarz recenzenta**           | Tylko jeśli BA / compliance wymaga balonów; wtedy osobna decyzja: inna biblioteka, rozszerzony OOXML, makro lub krótki krok ręczny po automatycznej treści. |


Nie należy obiecywać w implementacji **„zawsze natywny komentarz Worda”** bez potwierdzenia spike’u i akceptacji uproszczenia albo alternatywnej ścieżki.

---

## 8. Bramki ludzkie

1. **Akceptacja `docs-update-plan.md`** przez BA przed komendą Writer (`@eversis-ba-docs-writer`).
2. **Akceptacja planu implementacji** (ten plik) przed szerokimi zmianami w repozytorium.
3. **Brak obowiązkowego UI verification** w tym torze — krok z dev server URL z `eversis-implement.md` nie dotyczy tego workflow.

---

## 9. Changelog planu


| Data | Zmiana                                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------------- |
| —    | Utworzenie / wypełnienie planu jako pełny Markdown (fazy A–D, tabele zadań, analiza zgodności).                         |
| —    | Dodano §4: lista TODO komplementarna z Cursor IDE (MCP, indeksowanie, mapowanie A–D, OPS, opcjonalne `/` commands).     |
| —    | Dodano § Zakres (scope): m.in. wariant playbook w `documentation/cursor-collection.md` vs `eversis-implement`.          |
| —    | Rozszerzono § Zakres o **prompty vs reguły** (para `eversis-ba-docs-`*, jawne `@` ścieżką); §2.2 skrócono do odsyłaczy. |
| —    | §7: dodano **§7.1** (ryzyko „czerwony komentarz” / warstwa OOXML); §2.2 pkt 4 → odsyłacz do §7.1.                       |
| 2026-05-13 | Wdrożenie planu: playbook, `eversis-ba-docs-*` (prompty/reguły/komendy), narzędzia `.docx` w `mcp/eversis-collections-mcp/`, wpis `eversis-collections` w `.cursor/mcp.json`, `AGENTS.md`, `docs/specs/README.md`. |
| 2026-05-13 | Usunięto osobne pakiety `mcp/eversis-docs-mcp*`; jedyny proces MCP dla Word + skillów: **`eversis-collections`**. §3 fazę C oraz §7.1 dostosowano do `eversis-collections-mcp`. |

```mermaid
flowchart LR
  spec[Spec_business_docs]
  implPlan[Implementation_plan_md]
  repoWork[Repo_and_MCP_work]
  spec --> implPlan
  implPlan --> repoWork
```



