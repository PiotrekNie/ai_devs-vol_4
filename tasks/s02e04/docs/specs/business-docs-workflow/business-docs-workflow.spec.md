# Specyfikacja Projektowa: Automatyzacja Aktualizacji Dokumentacji Biznesowej (Business Manager Docs)

## 1. Kontekst i Cel Biznesowy

- **Problem:** Ręczna aktualizacja obszernych dokumentów projektowych (np. plików `.docx` powyżej 400 stron, takich jak COS2, WUM czy DAWIS) po każdym TTO/Release jest czasochłonna, podatna na błędy i wymaga żmudnego dopasowywania zmian w kodzie/zadaniach Jira do nietechnicznego języka biznesowego.
- **Cel:** Stworzenie w pełni zintegrowanego z Cursor IDE workflow, opartego na agentach AI i architekturze **Relay Race** (sztafety), który zredukuje czas aktualizacji dokumentacji o 70%, zachowując przy tym oryginalne formatowanie dokumentów bazowych (w tym strukturę tabel i diagramów).

## 2. Architektura Rozwiązania

Zgodnie z zasadami frameworka Cursor Collections, proces unika trzymania całości w oknie kontekstowym i bazuje na narzędziach serwerowych. Podejście **"Single Source of Truth"** zapewnia, że wytyczne dotyczące dokumentów są zaczytywane dynamicznie z zewnętrznych źródeł (Confluence).

### 2.1. Komponenty Główne

- **Atlassian MCP Server** (Kluczowy element integrujący Jira i Confluence):
- **Zadania (Jira):** Służy do pobierania surowego kontekstu biznesowego (Epiki, Taski, komentarze z Release'u) z Jiry.
- **Reguły biznesowe (Confluence):** Służy do dynamicznego pobierania aktualnych zasad aktualizacji dokumentacji dla danego projektu (np. "DAWIS Documentation Definitions & Updating Rules").

- **Narzędzia `.docx` na serwerze MCP `eversis-collections`** (`mcp/eversis-collections-mcp/`, Node: JSZip + `@xmldom/xmldom` na `word/document.xml`): Bezpieczna interakcja z plikami `.docx` przy zachowaniu stylów (bez pełnego round-tripu przez Pandoc).
- `generate_summary_map(docx_path)` -> Tworzy plik nawigacyjny `summary.md`.
- `read_chapter(docx_path, chapter_id)` -> Pobiera treść konkretnego rozdziału.
- `update_chapter(docx_path, chapter_id, new_content)` -> Nadpisuje treść.
- `upload_to_sharepoint(docx_path)` -> Publikacja po akceptacji.

- **Plik Nawigacyjny (summary.md):** Mapa drogowa fizycznego dokumentu `.docx`. Zawiera spis treści i tagi dla Agenta, umożliwiające szybką nawigację strukturalną.

## 3. Role i Instrukcje (Cursor: prompty + reguły)

Workflow opiera się na dwóch wyspecjalizowanych agentach współpracujących ze sobą i komunikujących się przez wspólny artefakt (`docs-update-plan.md`).

### 3.0. Prompty (`@eversis-ba-docs-*`) vs reguły (`.mdc`) w Cursor Collections

Zgodnie z konwencją monorepo **Cursor Collections** rozdzielamy:

- **Publiczny prompt** — `.cursor/prompts/public/eversis-*.md`: treść **wykonywalnego workflow** (frontmatter Docusaurus + kroki SOP). W Cursorze **`@` + stem pliku** (np. `@eversis-ba-docs-planner`) zwykle rozwiązuje **właśnie ten prompt**.
- **Reguła roli** — `.cursor/rules/eversis-*.mdc`: **kim jest agent**, granice, zachowanie przy narzędziach MCP; dołączana na żądanie (**`@`** do pliku `.mdc` lub wybór z pickera), często z `alwaysApply: false`.

W praktyce dla tego workflow **obydwa artefakty są normatywne**: prompt uruchamia tor; reguła utrwala rolę i spójność z frameworkiem. Jeśli `@` nie łączy obu w jednej sesji, użytkownik **jawnie dołącza** drugi plik (pełna ścieżka pod `.cursor/…`), tak jak w [AGENTS.md](../../../AGENTS.md).

### Role 1: Główny Analityk (Planner)

- **Prompt (workflow):** `.cursor/prompts/public/eversis-ba-docs-planner.md`
- **Reguła roli:** `.cursor/rules/eversis-ba-docs-planner.mdc`
- **Odpowiedzialność:** Zrozumienie zakresu Release'u, zweryfikowanie wytycznych na Confluence i zmapowanie zmian na odpowiednie sekcje w dokumentach.
- **Wejście:** ID Release'u w Jirze + tytuł strony na Confluence z zasadami aktualizacji + plik `summary.md`.
- **Wyjście:** Artefakt `docs-update-plan.md`.
- **Zasady (Rules):**

1. **[KROK KRYTYCZNY]** Zanim przystąpisz do analizy zadań z Release'u, użyj narzędzia Atlassian MCP, aby przeczytać stronę Confluence (np. "DAWIS Documentation Definitions & Updating Rules"). Wykorzystaj te zasady jako matrycę decyzyjną określającą warunki brzegowe aktualizacji (np. czy dokument dostaje status "N/A", wymogi co do wersji).
2. Używaj Atlassian MCP do pobrania wszystkich zadań powiązanych z Release'em w Jirze.
3. Zidentyfikuj, które taski wpływają na wymagania biznesowe i zestaw je ze spisem treści `summary.md`.
4. Oznacz numery rozdziałów w dokumencie, które wymagają aktualizacji, i krótko opisz, CO musi zostać zmienione.
5. Jeśli zmiana dotyczy architektury/diagramu UML/Visio, dodaj do planu flagę `[WYMAGA_AKTUALIZACJI_GRAFIKI]`.

### Role 2: Technical Writer (Implementer)

- **Prompt (workflow):** `.cursor/prompts/public/eversis-ba-docs-writer.md`
- **Reguła roli:** `.cursor/rules/eversis-ba-docs-writer.mdc`
- **Odpowiedzialność:** Fizyczna aktualizacja treści w pliku `.docx` za pomocą narzędzi Eversis Docs MCP.
- **Wejście:** Plik `docs-update-plan.md`.
- **Wyjście:** Zmodyfikowany dokument gotowy do weryfikacji.
- **Zasady (Rules):**

1. Pracuj iteracyjnie. Czytaj plan `docs-update-plan.md` sekcja po sekcji.
2. Używaj narzędzia `read_chapter`, modyfikuj tekst, tłumacząc ewentualny język techniczny na opis zachowania systemu.
3. Używaj narzędzia `update_chapter`, aby zapisać zmianę.
4. Gdzie napotkasz flagę `[WYMAGA_AKTUALIZACJI_GRAFIKI]`, wstaw w dokumencie Word wyraźny, czerwony komentarz tekstowy: `>>> DO WERYFIKACJI BA: SPRAWDŹ I ZAKTUALIZUJ DIAGRAM ZGODNIE Z RELEASE <<<`.

## 4. Przepływ Pracy (Workflow Sztafetowy)

Procedura działania (SOP) z perspektywy Analityka Biznesowego używającego Cursora:

### Krok 1: Research i Planowanie

1. **Człowiek:** Wpisuje w oknie chatu/Composerze komendę z dołączonym promptem workflow (stem odpowiada plikowi z §3.0), np.:
   `@eversis-ba-docs-planner Przygotuj plan aktualizacji dokumentacji DAWIS dla Release 2.4.5. Reguły projektowe znajdziesz na stronie Confluence "DAWIS Documentation Definitions & Updating Rules".`
   W razie potrzeby **dodatkowo** dołącza regułę roli `.cursor/rules/eversis-ba-docs-planner.mdc` (pełna ścieżka), jeśli w danej sesji ma być wymuszony opis roli z `.mdc`.
2. **Agent (Planner):** Pobiera zasady z Confluence przez MCP, następnie pobiera taski z Jiry (Release 2.4.5), filtruje je zgodnie z pobranymi zasadami i generuje listę ToDo w pliku `docs-update-plan.md`.
3. **Bramka Weryfikacji (Człowiek):** BA przegląda wygenerowany plan. Odrzuca, koryguje lub zatwierdza wnioski Agenta w pliku markdown.

### Krok 2: Egzekucja (Wdrożenie zmian)

1. **Człowiek:** Wydaje komendę drugiemu agentowi (prompt Writer z §3.0), ewentualnie z równoległym dołączeniem `.cursor/rules/eversis-ba-docs-writer.mdc`:
   `@eversis-ba-docs-writer Wdróż zmiany do odpowiednich dokumentów zgodnie z planem w docs-update-plan.md`
2. **Agent (Writer):** Korzystając ze swojego MCP (odpowiedzialnego za dokumenty), otwiera konkretne dokumenty Word, aktualizuje wskazane rozdziały, nadaje nowe numery wersji (zgodnie z zasadami wyciągniętymi w Kroku 1) i zapisuje pliki.

### Krok 3: Review i Publikacja

1. **Człowiek:** Przegląda gotowe pliki `.docx` (zwracając szczególną uwagę na czerwone znaczniki przy diagramach UML/Visio). Wprowadza ewentualne poprawki manualne na grafikach.
2. **Człowiek:** Wywołuje skrypt/komendę wysyłającą pliki na docelowy SharePoint lub Confluence.

## 5. Kamienie Milowe Wdrożenia (Implementation Milestones)

- [ ] **Faza 1:** Utworzenie w repozytorium **par: prompt publiczny** (`.cursor/prompts/public/eversis-ba-docs-*.md`) + **reguła roli** (`.cursor/rules/eversis-ba-docs-*.mdc`) dla Planner i Writer; prompty kierują m.in. na pobieranie zasad z Confluence (por. §3.0).
- [ ] **Faza 2:** Skonfigurowanie serwera Atlassian MCP i dodanie dostępu do tokena Confluence (do odczytu przestrzeni z dokumentacją DAWIS / COS2).
- [ ] **Faza 3:** Stworzenie serwera Eversis Docs MCP w Pythonie (`python-docx`), zdolnego do czytania i edycji tekstu z zachowaniem styli (zamiast formatu Markdown).
- [ ] **Faza 4:** Przygotowanie skryptu lub akcji MCP generującej plik nawigacyjny `summary.md` (spis treści i metadane pliku `.docx`).
- [ ] **Faza 5:** Wykonanie testu "na sucho" (E2E) aktualizacji dokumentu z historycznego sprintu i porównanie efektu z pracą wykonaną manualnie przez człowieka.
