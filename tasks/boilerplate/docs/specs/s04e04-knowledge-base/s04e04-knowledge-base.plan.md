# Plan wdrożenia — Baza wiedzy dla AI (S04E04) w dokumentacji boilerplate

**Normatywny research:** [s04e04-knowledge-base.research.md](s04e04-knowledge-base.research.md) — zaakceptowany; **Opcja A + B** (§2.8 docs + akapit OM ≠ KB w §4.3).  
**Workspace:** `tasks/docs/boilerplate-documentation.md`, `tasks/boilerplate/README.md`, `tasks/boilerplate/CHANGELOG.md`, `tasks/boilerplate/docs/specs/observational-memory/observational-memory.research.md` (cross-link)  
**Status:** Plan **zrealizowany** (2026-06-28) — D1–D7.

**Decyzje (z research §7–§9, potwierdzone przez użytkownika):**

| # | Pytanie | Decyzja |
| --- | --- | --- |
| 1 | Link do homework `filesystem` w §2.8? | **Tak (D1)** — wiersz w tabeli + reguła kciuka |
| 2 | Wiersz „Knowledge base (S04E04)” w README? | **Tak (D3)** — Quick decision + Related packages (`04_04_system`) |
| 3 | Opcja B (OM ≠ KB)? | **Tak (D6)** — akapit w **§4.3** spec; krótki cross-link w research OM |
| 4 | `list_dir` w core (Opcja E)? | **Nie** — defer; kryteria w research §4.1 |
| 5 | `lessons/04_04_system/README.md` → §2.8 (Opcja C)? | **Opcjonalnie D7** — 1 linia po D1 (niski koszt, spójność) |
| 6 | Zmiany w `tasks/boilerplate/src/`? | **Nie** — docs-only |
| 7 | Homework `filesystem` / `tasks/s04e04/`? | **Poza scope** tego MR |

**Uwaga numeracji:** W `boilerplate-documentation.md` są §2.1–§2.7. Nowa sekcja to **`### 2.8.`** — wstawiona **po** §2.7, **przed** `---` i §3 (Directory Tree).

**Weryfikacja UI:** brak.

---

## Technical Context

| Obszar | Wartość |
| --- | --- |
| **Stack** | Markdown docs; brak zmian TypeScript w boilerplate |
| **Normatywna spec** | `tasks/docs/boilerplate-documentation.md` |
| **Precedens** | [s04e03-contextual-collaboration.plan.md](../s04e03-contextual-collaboration/s04e03-contextual-collaboration.plan.md) (D1–D6 docs-only) |
| **Język §2.8** | Polski — spójnie z §2.1–§2.7 |
| **Linki względne** | Od `tasks/docs/` do research, lekcji, `observational-memory` research |
| **Testy** | Brak `bun test` / `tsc` dla Markdown; `git diff` bez `tasks/boilerplate/src/` |
| **Terminologia** | W §2.8 używać **baza wiedzy / vault** z krótką definicją; ang. *vault* = trwały folder markdown (nie pakiet npm) |

---

## 1. Analiza stanu obecnego (Current Implementation Analysis)

| Element | Stan | Akcja w planie |
| --- | --- | --- |
| `tasks/docs/boilerplate-documentation.md` §2.1–§2.7 | **Istnieje** (S04E03 zrealizowany) | Dodać §2.8; uzupełnić odniesienia §2.7 → §2.8 |
| §2.8 Knowledge base (S04E04) | **Brak** | D1 |
| §4.3 OM — akapit OM vs KB | **Brak** (jest tylko rozróżnienie OM vs Langfuse w §4.4) | D6 |
| `tasks/boilerplate/README.md` — S04E04 | **Brak** wiersza | D3 |
| `tasks/boilerplate/CHANGELOG.md` | Brak wpisu S04E04 | D4 |
| `observational-memory.research.md` — link do §2.8 | **Brak** | D6b (cross-link) |
| `lessons/04_04_system/README.md` — link do §2.8 | **Brak** | D7 (opcjonalnie) |
| `tasks/boilerplate/src/` | Bez zmian | **Poza scope** |
| Research status | „do akceptacji” | D5 → zaakceptowany + link do planu |

**Już pokryte przez runtime (bez kodu):** `read_file`, OM opt-in, `enablePlanningPhase`, `http_request`, `toolDiscovery` — opisać w §2.8 jako **wzorzec epizodu / lekcji**, nie nowe API.

---

## 2. Zakres (scope)

**W zakresie (Opcja A + B):**

| ID | Element | Opis |
| --- | --- | --- |
| D1 | `tasks/docs/boilerplate-documentation.md` | **`### 2.8. Personal knowledge base for AI (S04E04)`** — wstęp + tabela + reguła kciuka + odniesienia |
| D2 | Cross-linki | §2.7 odniesienia → §2.8; §2.8 → §2.1–§2.7, §4.3, research S04E04, OM research, `04_04_system`, `04_01_garden`, `02_04_ops`, `03_02_events` |
| D3 | `tasks/boilerplate/README.md` | **1 wiersz** Quick decision + **1 wiersz** Related packages (`04_04_system`) |
| D4 | `tasks/boilerplate/CHANGELOG.md` | Wpis docs-only S04E04 (Unreleased) |
| D5 | Research | Status „plan zaakceptowany” / po implementacji „zrealizowany”, link do tego pliku |
| D6 | `tasks/docs/boilerplate-documentation.md` §4.3 | Akapit **„Observational Memory ≠ baza wiedzy (vault)”** (~5–8 zdań) + link do §2.8 |
| D6b | `observational-memory.research.md` | 1–2 zdania + link do §2.8 / §4.3 (nie duplikować całego akapitu) |
| D7 | `lessons/04_04_system/README.md` | Opcjonalnie: 1 linia „Normatywna mapa: §2.8 w boilerplate-documentation.md” |

**Poza zakresem (jawnie):**

- `tasks/boilerplate/src/`, testy boilerplate, `package.json`, `config.ts`
- `list_dir` / `write_file` / `delegate` / vault loader w core
- Pakiet `@ai-devs/agent-vault` (Opcja D — defer)
- Homework **`filesystem`** / epizod `tasks/s04e04/`
- RAG, `with-md`, Firecrawl w pakiecie
- Nowe zależności npm

---

## 3. Decyzje projektowe

| # | Decyzja |
| --- | --- |
| 1 | Sekcja **normatywna, edukacyjna** — kiedy vault markdown vs profil hub, nie implementacja KB |
| 2 | **Lokalizacja:** `### 2.8.` **zaraz po** §2.7, **przed** `---` i §3 |
| 3 | **Długość §2.8:** ~55–70 linii — wstęp + tabela (≥11 wierszy z research §8) + reguła kciuka + odniesienia |
| 4 | **Spójność:** §2.5 = garden/vault wdrożeniowy; §2.7 = AI w tle; §2.8 = **struktura KB, szablony, ops/, OM vs vault** |
| 5 | **`list_dir`:** antywzorzec „w core dla vault” + cross-link do research §4.1 (defer); wzorzec: MCP epizodu / `files-mcp` |
| 6 | **Homework `filesystem`:** jeden wiersz tabeli + linia w regule kciuka — **bez** pełnego opisu API |
| 7 | **Opcja B:** akapit w **§4.3** (normatywna spec runtime), nie tylko w research OM |
| 8 | **README:** max **1 wiersz** Quick decision + **1 wiersz** Related packages |
| 9 | **Bramki jakości:** `git diff` — zero plików w `tasks/boilerplate/src/` |

---

## 4. Treść docelowa (szkic do wdrożenia)

Implementujący agent **nie kopiuje** research 1:1 — streszcza do tabeli poniżej.

### Wstęp §2.8 (szkic)

> Lekcja S04E04 uczy projektowania **własnej bazy wiedzy** (vault markdown) jako „kodu źródłowego” agenta poza repozytorium aplikacji — struktura Me/World/Craft/Ops/System, szablony, procesy w `ops/`, jakość notatek dla modelu oraz podział ról: człowiek = treść, AI = organizacja. Runtime boilerplate (`createAgent`, `read_file`, OM opt-in) **pozostaje bez zmian**; pełny vault, zapis plików, multi-agent i workflow w markdown to **lekcja `04_04_system` lub aplikacja** poza pakietem.

### Tabela wzorców vs antywzorców (docelowa — z research §8)

| Obszar | Wzorzec (rób tak) | Antywzorzec (unikaj) | Gdzie w repo |
| --- | --- | --- | --- |
| **Cel KB** | Jedna aktywność na start; iteracja | Pełna struktura „na dzień 1” | lekcja S04E04 |
| **Układ katalogów** | Me / World / Craft / Ops / System (lub własny) | Jedna płaska lista notatek | [04_04_system](../../lessons/04_04_system/) |
| **Format** | Markdown + frontmatter (ACL, tagi) | Binaria bez URL; lokalne obrazy bez planu | §2.8; [04_01_garden](../../lessons/04_01_garden/) |
| **Treść notatki** | Samowystarczalna bez założonego kontekstu | „Ostatnia rozmowa” bez linku | `workspace/system/rules/` |
| **Rola AI** | Organizacja, szablony, audyt | AI pisze merytorykę bez nadzoru | lekcja |
| **Szablony** | `system/templates/` + MoC | Agent wymyśla strukturę za każdym razem | `04_04_system` |
| **Procesy** | Pliki w `ops/` + delegacja faz | Jeden ReAct na cały pipeline | `ops/daily-news/` |
| **Pamięć sesji** | OM opt-in przy długim ReAct | Mylenie OM z vault | [§4.3](#43-zarządzanie-pamięcią-srcagentmemoryts--observational_memory) |
| **Odczyt plików (hub)** | `read_file` chunkowany | Wczytanie całego vault do kontekstu | boilerplate MCP |
| **Zapis / listowanie** | MCP epizodu lub files MCP lekcji | `write_file` / `list_dir` w default pakiecie | [§2.5](#25-production-deployments-s04e01); research §4.1 |
| **Homework hub (`filesystem`)** | `http_request` + batch / TS | 15+ tur ReAct na plik | epizod hub |

### Reguła kciuka (szkic)

```text
Epizod hub (verify, krótka sesja, brak lokalnego vault) → default boilerplate.
Trwała KB + szablony + ops/ + multi-agent → lessons/04_04_system lub aplikacja — nie createAgent.
Długa sesja na wielu plikach → OM opt-in; vault pozostaje na dysku między triggerami (03_02_events).
Zdalny FS / jednorazowa strukturyzacja danych (filesystem) → http_request + kod epizodu — nie moduł KB w pakiecie.
```

### Odniesienia §2.8 (szkic)

- Research: [s04e04-knowledge-base.research.md](../s04e04-knowledge-base/s04e04-knowledge-base.research.md)
- Powiązane: [§2.1](#21-project-constraints-s03e02) · [§2.2](#22-contextual-feedback-s03e03) · [§2.3](#23-tool-design--test-data-s03e04) · [§2.5](#25-production-deployments-s04e01) · [§2.6](#26-active-collaboration-with-ai-s04e02) · [§2.7](#27-contextual-collaboration-in-daily--business-workflows-s04e03) · [§4.3](#43-zarządzanie-pamięcią-srcagentmemoryts--observational_memory) · [§5.2.1](#521-code-mode--wykonanie-kodu-poza-pakietem)
- OM: [observational-memory.research.md](../observational-memory/observational-memory.research.md)
- Lekcje: [04_04_system](../../lessons/04_04_system/) · [04_01_garden](../../lessons/04_01_garden/) · [02_04_ops](../../lessons/02_04_ops/) · [03_02_events](../../lessons/03_02_events/)
- Transkrypt: `markdowns/s04e04-projektowanie-wlasnej-bazy-wiedzy-dla-ai-1775085192.md`

*(Implementujący poprawi anchory nagłówków po wstawieniu §2.8.)*

### Uzupełnienie §2.7 — odniesienia (D2)

Na końcu bloku **Odniesienia** w §2.7 dodać link do §2.8 (jedna linia), np.:

`· [§2.8 Personal knowledge base (S04E04)](#28-personal-knowledge-base-for-ai-s04e04)`

### Akapit §4.3 — OM ≠ KB (D6 — szkic Opcji B)

Wstawić **po** opisie persystencji OM (`OM_PERSIST_DIR`), **przed** `### 4.4`:

**Nagłówek akapitu (pogrubienie w prose):** **Observational Memory ≠ baza wiedzy (vault).**

**Treść (~5–8 zdań):**

- OM kompresuje **historię bieżącej sesji** ReAct do `<observations>` w `instructions` — treść generuje Observer/Reflector.
- **Baza wiedzy** to trwałe pliki markdown między sesjami (vault): szablony, reguły, notatki, `ops/` — źródło prawdy poza kontekstem jednej rozmowy.
- OM i vault **mogą współistnieć** (długa sesja nad wieloma `read_file` + vault na dysku), ale **nie zastępują** się nawzajem.
- Vault, zapis i listowanie katalogów → [§2.8](#28-personal-knowledge-base-for-ai-s04e04); nie implementować vault w `memory.ts`.

### Cross-link `observational-memory.research.md` (D6b)

W §1 Executive summary lub §2 „How OM works” dodać jedno zdanie:

> OM nie zastępuje markdownowej bazy wiedzy (vault) — patrz [§2.8 S04E04](../../tasks/docs/boilerplate-documentation.md#28-…) i akapit w [§4.3 spec](../../../docs/boilerplate-documentation.md#43-…).

*(Ścieżki względne od `tasks/boilerplate/docs/specs/observational-memory/`.)*

---

## 5. Zmiany w README boilerplate (D3 — szkic)

### Related packages — nowy wiersz

| [`lessons/04_04_system`](../../lessons/04_04_system/README.md) | S04E04: markdown vault (Me/World/Craft/Ops/System), templates, `ops/` workflows, multi-agent | Full KB runtime; **not** `@ai-devs/agent-boilerplate` |

### Quick decision guide — nowy wiersz

| Personal knowledge base / markdown vault (templates, ops/, navigation) | [§2.8 in boilerplate-documentation.md](../docs/boilerplate-documentation.md#28-personal-knowledge-base-for-ai-s04e04) + lesson `04_04_system` | `write_file`, `list_dir`, `delegate`, vault loader in boilerplate package |

*(Anchor dopasować po D1.)*

---

## 6. CHANGELOG (D4 — szkic)

```markdown
- **S04E04 (knowledge base):** §2.8 in `tasks/docs/boilerplate-documentation.md` (vault markdown, Me/World/Craft/Ops/System, templates, ops workflows, OM vs KB); §4.3 paragraph Observational Memory ≠ knowledge base; README Quick decision + Related packages row for `04_04_system`; cross-link in observational-memory research.
```

---

## 7. Kryteria akceptacji (Definition of Done)

- [x] W `tasks/docs/boilerplate-documentation.md` istnieje **`### 2.8.`** (S04E04) bezpośrednio pod §2.7
- [x] §2.8: wstęp (≤6 zdań) + tabela **Wzorzec / Antywzorzec / Gdzie** (≥11 wierszy, w tym `filesystem`)
- [x] Reguła kciuka (blok `text`) obecna w §2.8
- [x] Brak obietnic: vault loader, `delegate`, `write_file`, `list_dir` w default pakiecie
- [x] §2.7 odniesienia zawierają link do §2.8
- [x] Cross-linki §2.8 ↔ §2.1–§2.7, §4.3, research, lekcje — działają z `tasks/docs/`
- [x] §4.3 zawiera akapit **OM ≠ baza wiedzy** z linkiem do §2.8
- [x] `observational-memory.research.md`: cross-link do §2.8 / §4.3
- [x] README: **1 wiersz** Quick decision + **1 wiersz** Related packages
- [x] CHANGELOG (Unreleased) zaktualizowany
- [x] D7: `04_04_system/README.md` link do §2.8
- [x] Research: status + link do planu; po implementacji „zrealizowany”
- [x] Review ręczny: §2.1–§2.8 + §4.3 akapit czytelne w <10 min
- [x] `git diff` — zero plików w `tasks/boilerplate/src/`

---

## 8. Plan zadań

| ID | Typ | Zadanie | Definition of done |
| --- | --- | --- | --- |
| D1 | [MODIFY] | Wstawić `### 2.8.` do `tasks/docs/boilerplate-documentation.md` między końcem §2.7 a `---` przed §3 | ✅ |
| D2 | [REUSE] | Cross-linki: §2.7 → §2.8; §2.8 → §2.1–§2.7, §4.3, research, lekcje | ✅ |
| D3 | [MODIFY] | README: 1 wiersz Quick decision + 1 wiersz Related packages (§5 planu) | ✅ |
| D4 | [MODIFY] | `CHANGELOG.md` — wpis docs S04E04 | ✅ |
| D5 | [MODIFY] | Research: status + link do planu; po implementacji „zrealizowany” | ✅ |
| D6 | [MODIFY] | §4.3 — akapit OM ≠ KB (§4 planu) | ✅ |
| D6b | [MODIFY] | `observational-memory.research.md` — cross-link | ✅ |
| D7 | [MODIFY] | `lessons/04_04_system/README.md` — link do §2.8 | ✅ |

**Kolejność:** D1 → D2 → D6 → D3 → D4 → D6b → D7 → D5.

**Bramki jakości:** `git diff` na plikach Markdown; klik 2–3 linków w IDE. Brak `bun test` / `tsc` (tylko docs).

---

## 9. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Duplikacja §2.5 (garden) / §2.7 w §2.8 | §2.8 = struktura KB + OM vs vault; garden = wdrożenie/publikacja |
| Student dodaje `write_file` do core | Antywzorzec w tabeli + README „Skip” |
| Mylenie OM z vault | D6 w §4.3 + wiersz tabeli §2.8 + D6b |
| Zbyt długi §2.8 (konspekt lekcji) | Tabela wzorców, nie powtórka §0 research |
| `filesystem` w docs sugeruje lokalny vault | Jawne: zdalny FS + `http_request` |
| Lekcja scheduled 2026-04-02 | Docs bez zmian runtime |

---

## 10. Bezpieczeństwo

| Obszar | Uwaga |
| --- | --- |
| Docs | Nie sugerować `write_file` w default MCP dla homework hub |
| Vault | Uprawnienia w frontmatter + handler MCP epizodu, nie w prompcie |
| OM persist | `OM_PERSIST_DIR` to debug sesji — nie mylić z vault (D6) |

---

## 11. Testowanie

| Typ | Działanie |
| --- | --- |
| Automatyczne | Brak (tylko Markdown) |
| Manualne | Przejść linki §2.8 → `04_04_system`, §4.3 → §2.8 |
| Manualne | Sprawdzić README Quick decision vs §2.8 |
| Manualne | Przeczytać akapit D6 — czy student rozróżni OM od vault |
| Regresja | `git diff` — zero plików w `tasks/boilerplate/src/` |

---

## 12. Human gate

**Przed implementacją:** akceptacja tego planu (scope = D1–D6b, opcjonalnie D7, docs-only, osobny MR).

**Po implementacji:** krótki review diff — czy §2.1–§2.8 + §4.3 razem opisują linię kursu bez czytania research.

**Homework `filesystem` / `tasks/s04e04/`:** osobna akceptacja scope, gdy zechcesz implementować epizod.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-28 | Plan początkowy — Opcja A+B: §2.8, cross-linki, README (2 wiersze), CHANGELOG, §4.3 OM≠KB, cross-link OM research; D7; bez runtime; bez homework `filesystem` |
| 2026-06-28 | D1–D7 zrealizowane po akceptacji planu |
