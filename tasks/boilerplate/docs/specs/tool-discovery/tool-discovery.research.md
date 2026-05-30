# Tool discovery (S02E05 → boilerplate) — research

**Task:** Jak lekcja S02E05 może **poprawić boilerplate** — w szczególności **odkrywalność narzędzi przez LLM** zamiast wrzucania pełnych schematów wszystkich funkcji do każdej tury.

**Data:** 2026-05-27  
**Status:** Zaimplementowano (ścieżka **M**). Plan: [tool-discovery.plan.md](tool-discovery.plan.md).

**Powiązane:** [sandbox-code-execution.research.md](../sandbox-code-execution/sandbox-code-execution.research.md) (code mode + QuickJS — osobny wątek).

**Źródła:**

- `lessons/02_05_sandbox/` — `list_servers`, `list_tools`, `get_tool_schema`, lazy load
- `markdowns/s02e05-projektowanie-agentow-1773962356.md` — motywacja: mały zestaw meta-narzędzi, reszta odkrywana dynamicznie
- `tasks/boilerplate/` — `createAgent`, `mcpToolsToOpenAI`, `listMcpTools`, planning turn 0
- `tasks/s02e04/run.ts` — przykład epizodu z **7** narzędziami (6 MCP + `finish_task`), wszystkie w każdej turze

---

## 1. Executive summary

**Werdykt: tak — wzorzec odkrywania z S02E05 może sensownie ulepszyć boilerplate, ale nie jako kopia lekcji 1:1.**

| Warstwa | Rekomendacja |
| --- | --- |
| **Pełny pakiet lekcji** (4 meta-narzędzia + QuickJS `execute_code`) | **Opcjonalnie** — patrz research sandbox; nie wymagane do samej discoverability |
| **Discoverability w ReAct** (meta-narzędzia + **dynamiczny** zestaw `tools` przekazywanych do API) | **Tak — warto** jako moduł opt-in w boilerplate |
| **Domyślnie dla wszystkich epizodów** | **Nie** — przy 4–7 narzędziach zysk tokenów jest mały; koszt to +1–2 tury discovery i zmiana pętli |
| **Domyślnie gdy epizod ma wiele MCP** (np. ≥8) lub „pułapkowa” dokumentacja API | **Rozważyć** |

**Kluczowy wniosek techniczny:** Samo zwrócenie schematu w wyniku narzędzia (`get_tool_schema` → tekst) **nie wystarczy**, jeśli model ma **wywoływać** MCP przez function calling — nazwa musi trafić do tablicy `tools` w `generateResponse`. Lekcja rozwiązuje to przez **execute_code**; boilerplate bez sandboxa potrzebuje **aktywacji narzędzia w pętli agenta** (np. `activate_tools` → rozszerzenie `tools` od następnej tury).

---

## 2. Stan obecny w boilerplate

### 2.1 Jak narzędzia trafiają do modelu

Typowy bootstrap (README, `s02e04/run.ts`):

```text
listMcpTools(mcpClient) → mcpToolsToOpenAI(...) → allTools
createAgent({ tools: allTools, handlers: { ... wszystkie nazwy ... } })
```

W **każdej** turze ReAct (`agent.ts`):

```typescript
const response = await ai.generateResponse(conversation, tools, currentInstructions, ...);
```

- Tablica `tools` jest **stała** od momentu `createAgent`.
- Każdy wpis zawiera **pełny JSON Schema** (`parameters`) + `description`.
- Koszt: schematy są ponawiane **przy każdym** wywołaniu LLM (nie tylko w system prompt).

### 2.2 Co już częściowo robi „odkrywanie”

| Mechanizm | Co daje | Czego nie daje |
| --- | --- | --- |
| **`system.md`** | Krótki opis kluczowych narzędzi w prompcie | Nie zastępuje schematów w API `tools` |
| **Planning turn 0** | Nazwy narzędzi w instrukcji; **pusta** tablica `tools` + `tool_choice: none` | Tylko tura 0; tury 1..N nadal mają pełne schematy |
| **`listMcpTools` w kodzie** | Deweloper widzi listę | Model nie może sam „przeglądać” katalogu bez natywnego/MCP meta-narzędzia |

### 2.3 Skala problemu dziś

| Epizod | Narzędzia w kontekście API (szac.) | Discoverability |
| --- | --- | --- |
| Boilerplate minimal | 4 MCP + `finish_task` | Niski zysk |
| `s02e04` mailbox | 6 MCP + `finish_task` | Umiarkowany (długie opisy + złożone schematy) |
| Przyszły epizod z wieloma serwerami MCP | 10+ | **Wysoki** zysk (jak w lekcji) |

Przy **≤7** narzędziach główną korzyścią discoverability jest często **jakość wyboru** (model najpierw czyta katalog), nie tylko oszczędność tokenów.

---

## 3. Co daje lekcja S02E05 (warstwa discovery)

Z materiału kursu i `02_05_sandbox`:

1. Model na starcie widzi tylko **meta-narzędzia** (~4), nie dziesiątki schematów MCP.
2. **`list_servers` / `list_tools`** — eksploracja przestrzeni nazw (nazwa + krótki opis).
3. **`get_tool_schema`** — **lazy load**: pełna sygnatura (w lekcji: TypeScript) dopiero gdy potrzebna; narzędzie trafia do sesji wykonania kodu.
4. **`execute_code`** — właściwe wywołania MCP odbywają się **wewnątrz** sandboxa, nie jako kolejne function calls w ReAct.

**Efekt pedagogiczny:** mniejsze okno kontekstu na wejściu; model **świadomie** wybiera, które API poznać, zamiast losowo strzelać w 15 podobnych funkcji.

**Różnica względem boilerplate:** lekcja **rozdziela** „poznanie narzędzia” od „wywołania narzędzia w ReAct”. Boilerplate dziś **scala** oba w jednym kroku (pełny schemat zawsze w `tools`).

---

## 4. Jak to może poprawić boilerplate (warianty)

### 4.1 Wariant L — „Katalog w prompcie” (najlżejszy)

- W `instructions` lub tura 0: lista `{ name, oneLineDescription }` z `listMcpTools`.
- Tablica `tools` w API **bez zmian** (pełne schematy).

| Plus | Minus |
| --- | --- |
| Brak zmian w `agent.ts` | **Brak oszczędności** tokenów w API |
| Lepsza świadomość nazw | Duplikacja: opis w prompcie + pełny schema w `tools` |

**Zasadność:** słaba jako główna poprawa; sensowne tylko jako uzupełnienie planning / episode prompt.

### 4.2 Wariant M — Meta-narzędzia ReAct + **aktywacja** (rekomendowany kierunek)

Nowe narzędzia **natywne** (lub cienki MCP „meta-server”):

| Narzędzie | Działanie |
| --- | --- |
| `list_tools` | Zwraca JSON: `[{ name, description }]` z `listMcpTools` (opcjonalnie grupy: `core` / `extended`) |
| `describe_tool` | Zwraca pełny schema + opis **jako tekst wyniku** (do przeczytania przez model) |
| `activate_tools` | Argument: `{ names: string[] }` — dodaje narzędzia do **aktywnego zestawu** na kolejne tury |

Zmiana w **`createAgent` / `runLoop`:**

- Stan sesji: `activeToolNames: Set<string>` (start: `core` + meta + `finish_task`).
- `generateResponse(..., filterTools(allTools, activeToolNames), ...)`.
- Handlery dla **wszystkich** MCP pozostają w mapie — tylko **widoczność** w API się zmienia.

```text
Tura 1: tools = [list_tools, describe_tool, activate_tools, finish_task, http_request?, submit_to_hub?]
        → model: list_tools → activate_tools(["search_mail", "download_mail_content"])
Tura 2+: tools += pełne schematy search_mail, download_mail_content
        → model wywołuje search_mail jak dziś
```

| Plus | Minus |
| --- | --- |
| Zgodne z duchem S02E05 **bez** QuickJS | Wymaga zmiany kontraktu `createAgent` + testów |
| Mniejsze `tools` na wczesnych turach | +1–3 tury overhead discovery |
| Lepszy wybór przy wielu podobnych narzędziach | Model może zapomnieć `activate_tools` — prompt + fallback |
| Reuse `listMcpTools` / `mcpToolsToOpenAI` | Polityka `core` musi być jawna per epizod |

**Zasadność:** **wysoka** jako opt-in `enableToolDiscovery: true` w boilerplate.

### 4.3 Wariant H — Tier „core” + „extended” (konfiguracja epizodu)

Bez meta-narzędzi — epizod deklaruje w `index.ts`:

```typescript
createAgent({
  tools: allTools,
  toolTiers: {
    core: ["http_request", "submit_to_hub", "finish_task"],
    extended: ["search_mail", "download_mail_content", ...],
  },
  initialTier: "core",
  // rozszerzenie: po pierwszym describe w prompcie lub po explicit activate
});
```

| Plus | Minus |
| --- | --- |
| Prostsze mentalnie niż pełne discovery | Mniej autonomiczne — tier ustawia człowiek |
| Przewidywalne dla zadań kursowych | Nie skaluje się na „nieznane” serwery MCP jak w lekcji |

**Zasadność:** **średnia** — dobry kompromis na `s02e04` / `s02e05` bez pełnego registry.

### 4.4 Wariant pełny S02E05 (meta + `execute_code`)

Patrz [sandbox-code-execution.research.md](../sandbox-code-execution/sandbox-code-execution.research.md). Discoverability jest **wbudowana**, ale cena to QuickJS, inny model debugowania.

**Zasadność discoverability:** maksymalna; **zasadność w boilerplate domyślnym:** niska.

---

## 5. Mapowanie korzyści S02E05 → boilerplate

| Korzyść z lekcji | Wariant L | Wariant M | Wariant H | Pełny sandbox |
| --- | --- | --- | --- | --- |
| Mniejszy początkowy kontekst `tools` | ✗ | ✓ | ✓ (częściowo) | ✓ |
| Lazy load schematu | ✗ | ✓ (`describe` + `activate`) | ✓ (tier) | ✓ (`get_tool_schema`) |
| Model sam odkrywa potrzebne MCP | △ (tylko tekst) | ✓ | △ | ✓ |
| Jawny ReAct + logi `[AKCJA]` | ✓ | ✓ | ✓ | ✗ (ukryte w kodzie) |
| Bez nowych zależności WASM | ✓ | ✓ | ✓ | ✗ |
| Batch wielu wywołań MCP | ✗ | ✗ | ✗ | ✓ |

---

## 6. Interakcja z istniejącymi mechanizmami

### 6.1 Planning phase (turn 0)

- Turn 0 już podaje **nazwy** narzędzi bez rejestracji w API — **spójne** z discoverability.
- Przy Wariancie M: w turn 0 można dodać instrukcję: „najpierw `list_tools` / `activate_tools` dla narzędzi spoza core”.
- **Unikać konfliktu:** planning nie powinien wymagać wywołań, których model nie ma w `tools` w turze 0 (zachować `tools: []` na turn 0).

### 6.2 Observational Memory

- Krótsza lista `tools` w API **nie zmniejsza** historii wiadomości — OM nadal potrzebne przy długich sesjach.
- Discoverability i OM są **komplementarne** (kontekst wejściowy vs historia).

### 6.3 Epizody z „pułapkową” dokumentacją (np. przyszły `drone`)

- Kurs sugeruje: nie czytać całej dokumentacji upfront — **iteracja na feedback**.
- Discoverability **nie zastępuje** tego — pomaga przy **wielu** funkcjach API w **narzędziach**, nie przy jednym hub `instructions[]`.
- Dla `drone`: tier **core** (`http_request`, `analyze_image_vision`, `submit_to_hub`) wystarczy; pełne discovery opcjonalne.

---

## 7. Ryzyka i mitigacje (Wariant M)

| Ryzyko | Mitigacja |
| --- | --- |
| Model nie wywoła `activate_tools` | Core zawsze aktywne; prompt: „przed pierwszym użyciem narzędzia spoza listy — activate”; opcjonalnie auto-activate on failed `Unknown tool` |
| Dodatkowe tury = koszt LLM | Próg włączenia: tylko gdy `allTools.length > N` (np. 8) |
| `Unknown tool` po activate | Walidacja nazw w handlerze `activate_tools`; zwrot dostępnych nazw |
| Regresje testów agenta | Testy: start z 2 active → activate → kolejna tura widzi nowe narzędzie w mock `generateResponse` |
| Rozjazd handler vs active tools | Jedna factory `buildToolCatalog(mcpClient)` — źródło prawdy |

---

## 8. Rekomendacja produktowa

1. **Wdrożyć discoverability w boilerplate jako Wariant M (opt-in)**, nie jako zamiennik domyślnego `allTools`.
2. **API (propozycja):**

   ```typescript
   createAgent({
     // ...
     toolDiscovery?: {
       enabled: boolean;
       coreToolNames?: string[];  // default: http_request, submit_to_hub, finish_task
       includeMetaTools?: boolean; // list_tools, describe_tool, activate_tools
     };
   });
   ```

3. **Dokumentacja:** sekcja w README — kiedy włączyć (`≥8` narzędzi, wiele serwerów MCP, długie opisy); link do `lessons/02_05_sandbox`.
4. **Nie wiązać** z QuickJS — osobna decyzja (sandbox research).
5. **Pilot:** opcjonalnie `s02e04` z `core` + mailbox tools jako `extended` (porównanie tokenów / skuteczności — poza scope researchu, do planu).

---

## 9. Acceptance criteria (wybór ścieżki)

- [ ] **0** — bez zmian; tylko dokumentacja w README o lekcji S02E05  
- [x] **M** — meta-narzędzia + dynamiczny `activeToolNames` w `createAgent` — **wybrane**  
- [ ] **H** — tylko tier core/extended (konfiguracja epizodu)  
- [ ] **M+H** — discovery w runtime + epizod podaje `coreToolNames`  
- [ ] **Pełny sandbox** — osobny track (sandbox research §9)

Plan: [tool-discovery.plan.md](tool-discovery.plan.md).

---

## 10. Open questions

1. Próg automatycznego włączenia: stałe **8** narzędzi, czy wyłącznie flaga epizodu?
2. Czy `list_servers` ma sens w boilerplate (jeden `McpServer` in-process) — czy wystarczy `list_tools`?
3. Czy `describe_tool` zwraca JSON Schema (OpenAI) czy też skróconą wersję dla modelu?
4. Auto-aktywacja przy pierwszej próbie wywołania nieaktywnego narzędzia — włączyć czy trzymać strict?

---

## 11. Suggested next steps

1. ~~Wybór ścieżki~~ → **M** (plan gotowy).  
2. **Ty:** zaakceptuj [tool-discovery.plan.md](tool-discovery.plan.md) — potem implementacja (fazy A→G).  
3. Bez nowych zależności npm (Wariant M).

---

## 12. Referencje

Stała tablica `tools` w pętli:

```180:185:tasks/boilerplate/src/agent/agent.ts
      const response = await ai.generateResponse(
        conversation,
        tools,
        currentInstructions,
        chatOptions,
      );
```

Turn 0 bez narzędzi w API:

```95:100:tasks/boilerplate/src/agent/planning.ts
  // Turn 0 must not register tools — otherwise some models call tools despite
  // tool_choice: "none", and [PLAN] never appears as a dedicated plan turn.
  const response = await args.ai.generateResponse(
    args.conversation,
    [],
```

Lekcja — meta-narzędzia na starcie:

```22:41:lessons/02_05_sandbox/src/tools.ts
export const tools: Tool[] = [
  {
    definition: {
      type: "function",
      name: "list_servers",
      description: "List all available MCP servers",
```
