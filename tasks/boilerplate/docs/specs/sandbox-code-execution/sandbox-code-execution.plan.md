# Plan wdrożenia — Sandbox / code mode (Opcja A, dokumentacja)

**Normatywny research:** [sandbox-code-execution.research.md](sandbox-code-execution.research.md) — **zaakceptowany** (2026-05-30): **Opcja A** (dokumentacja only, bez kodu sandbox w boilerplate).  
**Workspace:** `tasks/boilerplate/`, `tasks/docs/`, `lessons/02_05_sandbox/`  
**Powiązane:** [tool-discovery.plan.md](../tool-discovery/tool-discovery.plan.md) (warstwa C bez `execute_code`).

Ten dokument jest planem wdrożenia zgodnym z `@eversis-implement`: typy zadań `[CREATE]` / `[MODIFY]` / `[REUSE]`. **Implementacja** następuje po akceptacji tego planu przez człowieka.

**Weryfikacja UI:** brak — zmiany dotyczą dokumentacji Markdown i pliku promptu lekcji.

**Poza zakresem tego planu:**

- QuickJS / `execute_code` w `@ai-devs/agent-boilerplate` (Opcja B — osobny research/plan).
- Pakiet `@ai-devs/agent-code-mode` z WASM (Opcja D — tylko gdy pojawi się zadanie w `tasks/` wymagające batch MCP).
- Deno sandbox z `lessons/03_02_code` — pozostaje w lekcji.
- Integracja code mode z `createAgent` / Responses API.
- Pilot sandboxa w `tasks/s02e05` (homework `drone` = ReAct + vision — już udokumentowane w README epizodu).

---

## 1. Zakres (scope)

**W zakresie:**

| Element | Opis |
| --- | --- |
| **README boilerplate** | Sekcja „Code mode / sandbox (not in boilerplate)” — trzy warstwy sandbox, linki do lekcji, profil homework `drone`, wskazówka na przyszły pakiet code-mode. |
| **Spec produktowa** | `tasks/docs/boilerplate-documentation.md` — podrozdział rozróżniający discovery (§5.2) od code execution (§5.2.1). |
| **CHANGELOG** | Wpis [Unreleased] — dokumentacja, bez zmian runtime. |
| **Research** | Link do planu; status implementacji Opcji A. |
| **Lekcja `02_05_sandbox`** | Brakujący `workspace/agents/sandbox.agent.md` — **osobny PR** (zgoda człowieka 2026-05-30). |
| **Weryfikacja spójności** | Cross-linki: tool-discovery README ↔ sandbox research; brak sprzecznych twierdzeń „sandbox w boilerplate”. |

**Już zrobione (draft przed planem):**

- [x] Sekcja README w `tasks/boilerplate/README.md` (Code mode / sandbox).
- [x] Research zamknięty — §11, §12, §13.
- [x] `tasks/s02e05/README.md` — tabela „Lekcja vs homework” (bez zmian w tym planie, tylko weryfikacja linków).

---

## 2. Decyzje projektowe (zatwierdzone)

| # | Decyzja |
| --- | --- |
| 1 | **Opcja A** — zero nowego kodu runtime w boilerplate; tylko dokumentacja + naprawa materiału lekcji. |
| 2 | **Trzy warstwy „sandbox”** w docs — file chroot (`read_file`), lazy discovery (`toolDiscovery`), code execution (lekcje) — spójnie z research §2.1. |
| 3 | **Homework kursowy** — domyślnie ReAct; S02E05 `drone` bez QuickJS. |
| 4 | **QuickJS vs Deno** — oba tylko w lekcjach; przy ewentualnym B w przyszłości: QuickJS w osobnym pakiecie (D), Deno w `03_02_code`. |
| 5 | **`sandbox.agent.md`** — osobny PR do `lessons/`, nie w tym samym diffie co boilerplate docs (mniejsze review, sync z upstream lekcji). |
| 6 | **Nowe zależności npm** — brak. |

---

## 3. Analiza stanu obecnego (gap)

| Komponent | Stan | Gap |
| --- | --- | --- |
| `tasks/boilerplate/README.md` | Sekcja Code mode dodana (draft) | Dopracować link do planu/spec; spójność z §5.2 boilerplate-documentation |
| `tasks/docs/boilerplate-documentation.md` | §5.2 wspomina brak QuickJS jednym zdaniem | Brak dedykowanego podrozdziału: kiedy lekcja, macierz decyzyjna, linki |
| `CHANGELOG.md` | Brak wpisu o sandbox docs | Dodać pod [Unreleased] → Documentation |
| `sandbox-code-execution.research.md` | Zaakceptowany; „plan pominięty” | Zaktualizować §13 — plan istnieje (Opcja A) |
| `lessons/02_05_sandbox/README.md` | Wymaga `workspace/agents/sandbox.agent.md` | Plik **nie istnieje** — demo pada na `loadAgent()` |
| `lessons/02_05_sandbox/src/tools.ts` | 4 meta-narzędzia zdefiniowane | Prompt agenta musi je opisać w systemPrompt |
| Tool discovery w boilerplate | Zaimplementowane (plan M) | README już oddziela discovery od `execute_code` — utrzymać |

---

## 4. Architektura docelowa (dokumentacja)

```text
Student / maintainer
  │
  ├─ tasks/sXXeYY/          → createAgent + MCP (domyślnie)
  │     optional: toolDiscovery (lazy schemas, bez execute_code)
  │
  ├─ tasks/boilerplate/     → README + boilerplate-documentation.md
  │     wyjaśnia: co JEST vs co NIE JEST w pakiecie
  │
  └─ lessons/
        ├─ 02_05_sandbox/   → QuickJS + execute_code + sandbox.agent.md
        └─ 03_02_code/      → Deno + TS (osobna lekcja)
```

**Przepływ decyzyjny (dla docs — skrót z research §2.7):**

```text
≤5 tur ReAct, ≤4 narzędzia     → boilerplate (bez code mode)
Wiele MCP + transformacja danych → lekcja 02_05_sandbox lub przyszły agent-code-mode
TS + pliki + PDF               → lekcja 03_02_code
```

---

## 5. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| Studenci mylą `toolDiscovery` z pełnym sandboxem | Explicit tabela warstw w README i boilerplate-documentation |
| Dokumentacja sugeruje port QuickJS do boilerplate | Każda sekcja kończy się „not in this package” + link do research |
| `sandbox.agent.md` rozjedzie się z wideo kursu | Krótki prompt oparty na `tools.ts`; PR z adnotacją „sync upstream” |
| Dwa PRy (boilerplate docs vs lekcja) — review rozproszony | Plan explicite: fazy A–D = jeden PR docs; faza E = osobny PR lekcji |

---

## 6. Bezpieczeństwo (dokumentacja)

- Docs **nie** zachęcają do uruchamiania `execute_code` w zadaniach hubowych bez izolacji — odesłanie do lekcji.
- Przypomnienie: QuickJS izoluje JS gościa, ale mosty wołają **prawdziwe** MCP (research §2.8).
- Brak zmian w kodzie bezpieczeństwa — tylko edukacyjne ostrzeżenia w Markdown.

---

## 7. Kryteria akceptacji (Definition of Done)

### Dokumentacja boilerplate (fazy A–D)

- [x] README: sekcja Code mode kompletna, linki do lekcji i research działają względem repo root.
- [x] `boilerplate-documentation.md`: §5.2.1 (lub równoważny) — code mode vs discovery vs file sandbox.
- [x] CHANGELOG [Unreleased]: wpis Documentation (sandbox/code mode guidance).
- [x] Research §13 wskazuje na ten plan; status „Opcja A — zaimplementowano”.
- [x] Brak sprzeczności z `tool-discovery` docs (discovery ≠ execute_code).

### Lekcja (faza E — osobny PR)

- [x] `lessons/02_05_sandbox/workspace/agents/sandbox.agent.md` istnieje.
- [x] `loadAgent('sandbox')` — plik parsowalny (gray-matter smoke); pełny `bun src/index.ts` wymaga `.env` + API.
- [x] Frontmatter: `name`, `model`, `tools` = cztery nazwy z `tools.ts`.
- [x] System prompt opisuje workflow: discovery → `get_tool_schema` → `execute_code` (sync, `console.log`).

### Weryfikacja (faza F)

- [x] `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate/` — bez regresji.
- [x] Smoke lekcji: gray-matter + readFile OK; pełny run agenta — manual z API key.

---

## 8. Plan fazowy i zadania

### Faza A — Dopracowanie README boilerplate

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| A1 | [MODIFY] | **`tasks/boilerplate/README.md`:** Zweryfikować sekcję „Code mode / sandbox”; dodać link do tego planu i research; upewnić się, że ścieżki `../../lessons/...` są poprawne. | [x] Sekcja czytelna bez znajomości research. |
| A2 | [REUSE] | **Cross-check** z sekcją Tool discovery — jedno zdanie: discovery to warstwa C bez `execute_code`. | [x] Brak duplikacji >30 linii między sekcjami. |

### Faza B — Spec produktowa (`boilerplate-documentation.md`)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| B1 | [MODIFY] | **`tasks/docs/boilerplate-documentation.md`:** Dodać **§5.2.1 Code mode / wykonanie kodu (poza pakietem)** po §5.2 discovery. Treść: trzy warstwy sandbox; tabela lekcji QuickJS vs Deno; kiedy ReAct wystarczy; link do `docs/specs/sandbox-code-execution/`. | [x] §5.2 discovery nadal aktualny; brak sugestii QuickJS w core. |
| B2 | [MODIFY] | **§1 lub §4 (filozofia):** Jedno zdanie — boilerplate = jawny ReAct; code mode = lekcje / przyszły opt-in package. | [x] Spójne z README. |

### Faza C — CHANGELOG i research

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| C1 | [MODIFY] | **`tasks/boilerplate/CHANGELOG.md`:** [Unreleased] → Documentation: sandbox/code mode guidance (Opcja A). | [x] Wpis pod Documentation. |
| C2 | [MODIFY] | **`sandbox-code-execution.research.md`:** §13 — link do planu; status implementacji Opcji A. | [x] Research ↔ plan spójne. |
| C3 | [MODIFY] | **`sandbox-code-execution.plan.md`:** Changelog planu po zakończeniu faz. | [x] Daty i checkboxy DoD. |

### Faza D — Spójność epizodów (minimalna)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| D1 | [REUSE] | **`tasks/s02e05/README.md`:** Potwierdzić tabela „Lekcja vs homework”; opcjonalnie jeden link do README boilerplate § Code mode. | [x] Link do boilerplate README dodany. |

### Faza E — Lekcja: `sandbox.agent.md` (**osobny PR**)

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| E1 | [CREATE] | **`lessons/02_05_sandbox/workspace/agents/sandbox.agent.md`:** Gray-matter: `name: sandbox`, `model: openai:gpt-4.1-mini` (jak domyślny w `agent.ts`), `tools`: `list_servers`, `list_tools`, `get_tool_schema`, `execute_code`. | [x] Plik parsowalny przez `gray-matter`. |
| E2 | [CREATE] | **Treść systemPrompt:** Workflow discovery (todo server); `get_tool_schema` przed użyciem API w kodzie; `execute_code` — sync calls, `console.log` dla outputu; nie używać async/await w gościu (zgodnie z opisem w `tools.ts`). | [x] Prompt EN, ~40 linii. |
| E3 | [MODIFY] | **`lessons/02_05_sandbox/README.md` (opcjonalnie):** Potwierdzić ścieżkę `workspace/agents/`; nota „wymaga pliku w repo”. | [x] README zaktualizowany. |
| E4 | [REUSE] | **Smoke:** gray-matter + readFile; pełny `bun src/index.ts` — manual z API key. | [x] Smoke parsowania OK. |

**Szablon frontmatter (E1):**

```yaml
---
name: sandbox
model: openai:gpt-4.1-mini
tools:
  - list_servers
  - list_tools
  - get_tool_schema
  - execute_code
---
```

### Faza F — Quality gate

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| F1 | [REUSE] | `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate/`. | [x] Zero fail. |
| F2 | [REUSE] | Przegląd diffu pod kątem: zero plików `.ts` sandbox w boilerplate, zero nowych deps. | [x] Tylko Markdown + `.agent.md`. |

---

## 9. Kolejność wdrożenia (zalecana)

```text
PR 1 (boilerplate docs):  A → B → C → D → F
PR 2 (lekcja):            E → F2 (smoke lekcji)
```

Fazy A–C można w jednym commicie. Faza E **nie blokuje** merge PR1.

---

## 10. Ulepszenia poza zakresem (future)

| Temat | Kiedy |
| --- | --- |
| `@ai-devs/agent-code-mode` (QuickJS, Opcja D) | Gdy zadanie w `tasks/` wymaga batch MCP (research §2.3) |
| Rozszerzenie `toolDiscovery` o `get_tool_schema` / `execute_code` | Tylko z pakietem code-mode — nie w tym planie |
| Sync `sandbox.agent.md` z upstream submodule kursu | Po publikacji oficjalnej treści z lekcji wideo |

---

## 11. Changelog planu

| Data | Zmiana |
| --- | --- |
| 2026-05-30 | Utworzenie planu — Opcja A zaakceptowana; README draft; PR lekcji wydzielony (faza E). |
| 2026-05-30 | Implementacja zakończona — fazy A–F; docs + `sandbox.agent.md`. |

---

## 12. Po implementacji (workflow)

1. `@eversis-review` na diffie docs (+ opcjonalnie PR lekcji).
2. Zaktualizować research — status: *Zaimplementowano (Opcja A — dokumentacja)*.
3. **Fine** + draft QA comment (tylko docs — krótki test plan: przeczytaj README § Code mode, uruchom smoke lekcji po PR2).
