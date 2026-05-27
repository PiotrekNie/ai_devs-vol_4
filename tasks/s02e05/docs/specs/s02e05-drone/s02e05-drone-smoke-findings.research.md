# Smoke run — analiza blokady vision / mapy (S02E05 drone)

**Data:** 2026-05-27  
**Status:** Research — **zaimplementowano Opcję A** (2026-05-27). Plan: [s02e05-drone-map-prefetch.plan.md](s02e05-drone-map-prefetch.plan.md).  
**Źródło:** terminal run `bun --env-file=../.env run run.ts` — agent `finish_task` z komunikatem o braku zapisu mapy.

---

## 1. Executive summary

**Diagnoza agenta jest trafna:** obecny zestaw narzędzi boilerplate **nie pozwala** domknąć flow „pobierz mapę PNG → vision → instrukcje”, mimo poprawnego `DRONE_MAP_URL`.

| Problem | Severity | Potwierdzone w kodzie |
| --- | --- | --- |
| Brak narzędzia zapisu pliku (`write_file`) | **BLOCKER** | Tak — tylko `read_file` w MCP |
| `analyze_image_vision` wymaga lokalnej ścieżki | **BLOCKER** | Tak — tylko `filepath`, brak `url` |
| `http_request` nie obsługuje binariów (PNG) | **BLOCKER** (pośredni) | Tak — `response.text()` + JSON wrapper |
| Prompt sugeruje zapis do `data/map.png` bez narzędzia | **SUGGESTION** | Tak — `drone_task.md` |
| `finish_task` przed `{FLG:...}` mimo reguł promptu | **SUGGESTION** | Tak — zachowanie modelu |

**Rekomendacja:** **Opcja A** (prefetch mapy w `run.ts` + aktualizacja promptu) — najmniejszy diff, bez zmian w boilerplate, odblokowuje smoke natychmiast.

---

## 2. Co agent zrobił dobrze

1. Pobrał **live** dokumentację HTML (zgodnie z research §7.1).
2. Iterował **`submit_to_hub`** i czytał feedback huba:
   - `No destination has been selected for this mission.`
   - `I don't know that location.` (hipoteza `DAM731179PL`).
3. **Nie zgadywał** współrzędnych mapy — poprawna dyscyplina.
4. Zidentyfikował wymaganą sekwencję z docs: `setDestinationObject` → `set(x,y)` → `set(Nm)` → cele misji → `flyToLocation`.

---

## 3. Root cause — luka w pipeline mapy

### 3.1 Zamierzony flow (prompt)

```text
http_request(DRONE_MAP_URL) → zapis data/map.png → analyze_image_vision(filepath)
```

### 3.2 Faktyczne narzędzia boilerplate

| Narzędzie | Może zapisać PNG? | Może vision z URL? |
| --- | --- | --- |
| `http_request` | Nie (tylko odczyt HTTP) | Zwraca tekst/JSON, nie plik |
| `read_file` | Nie (tylko odczyt tekstu) | Nie |
| `analyze_image_vision` | Nie | **Nie** — tylko lokalny `filepath` |

**Wniosek:** krok „zapisz” w promptcie **nie ma implementacji** — to błąd specyfikacji epizodu, nie „lenistwo” modelu.

### 3.3 Dlaczego `http_request` nie wystarczy nawet „do odczytu” obrazu

`executeHttpRequest` (`tasks/boilerplate/src/tools/mcp/http_request.ts`):

```typescript
const rawText = await response.text();
// ...
parsed = rawText; // fallback gdy nie JSON
return mcpOk(JSON.stringify({ ok, status, data: parsed }));
```

Dla PNG (~3 MB):

- `response.text()` **niszczy** dane binarne (UTF-8 decode).
- Wynik trafia do kontekstu LLM jako bezużyteczny string — **nie** jako obraz do vision.

### 3.4 `analyze_image_vision`

`executeAnalyzeImageVision` czyta wyłącznie z dysku (`readFile(resolvedPath)`), koduje base64 lokalnie.

---

## 4. Problemy wtórne

### 4.1 Wczesne `finish_task`

Prompt (`system.md`, `drone_task.md`) mówi: nie kończyć przed `{FLG:...}`. Agent wywołał `finish_task` z raportem blokady.

**Mitygacja promptowa:** doprecyzować — przy blokadzie narzędziowej użyć **`ask_human`**, nie `finish_task`; `finish_task` tylko po fladze.

### 4.2 Research / plan — luka nieujęta

Research §4.2 wspominał `data/map.png`, plan Faza D nie przewidywał **prefetch** ani **write_file**. Gap analysis powinien był wychwycić brak mostu HTTP→vision.

---

## 5. Opcje naprawy (ranking)

### Opcja A — Prefetch mapy w bootstrapie `run.ts` (**rekomendowana**)

**Scope:** tylko `tasks/s02e05/`.

Przed `createAgent`:

1. Jeśli `DRONE_MAP_URL` — `fetch` → zapis `data/map.png` (`arrayBuffer`, jak `s02e02/hub.ts`).
2. W **Runtime context** dodać: `Map file ready: data/map.png — use analyze_image_vision directly`.
3. Zaktualizować `drone_task.md`: **nie** pobieraj mapy przez agenta; użyj gotowej ścieżki.

| Plus | Minus |
| --- | --- |
| Minimalny diff, bez nowych MCP | Mapa nie odświeża się w trakcie runu (OK dla statycznego PNG) |
| Bez zmian boilerplate / nowych deps | Logika poza ReAct (mniej „edukacyjne”) |
| Natychmiast odblokowuje smoke | — |

**Szacunek:** ~30–40 LOC w `run.ts`, 5 linii w promptach, test bootstrap opcjonalny.

---

### Opcja B — Epizodowe MCP `analyze_drone_map`

**Scope:** `tasks/s02e05/src/tools/mcp/` + rejestracja na serwerze (wrapper wokół `createBoilerplateMcpServer()`).

Jedno narzędzie: pobiera URL (domyślnie `DRONE_MAP_URL` z env) + wywołuje logikę vision (reuse `executeAnalyzeImageVision` po zapisie tymczasowym **w handlerze**, nie przez LLM).

| Plus | Minus |
| --- | --- |
| Agent jednym calliem robi vision | Więcej kodu epizodu |
| Jawne w logach `[AKCJA] analyze_drone_map` | Duplikacja fetch vs Opcja A |

---

### Opcja C — Rozszerzyć boilerplate: `analyze_image_vision` + opcjonalny `url`

**Scope:** `tasks/boilerplate` — wymaga zgody tech lead (moduł współdzielony).

Dodać do schematu: `filepath` **lub** `url` (XOR). Handler fetchuje obraz gdy podano URL.

| Plus | Minus |
| --- | --- |
| Naprawia klasę zadań vision+URL | Szerszy scope, testy boilerplate |
| Wzorcowe dla przyszłych epizodów | Nowy kontrakt narzędzia |

---

### Opcja D — `write_file` MCP + binary-safe `http_request`

**Scope:** boilerplate — **odradzane** na teraz (duży diff, `http_request` z base64 dla non-text).

---

## 6. Rekomendowany plan zmian (Opcja A)

| ID | Plik | Zmiana |
| --- | --- | --- |
| R1 | `run.ts` | `ensureDroneMapCached()` → `data/map.png` |
| R2 | `run.ts` | Runtime context: ścieżka mapy + „do not re-download” |
| R3 | `src/prompts/drone_task.md` | Vision na `data/map.png`; usuń krok http_request mapy |
| R4 | `src/prompts/system.md` | `finish_task` tylko po `{FLG:...}`; blokada → `ask_human` |
| R5 | `config.ts` | opcjonalnie `DRONE_MAP_LOCAL_PATH = "data/map.png"` |
| R6 | `config.test.ts` / smoke | assert że prefetch tworzy plik gdy URL mock |
| R7 | `README.md`, `CHANGELOG.md` | prefetch mapy przed agentem |

**Poza scope tej poprawki:** zmiana `http_request` na binary (Opcja D) — osobny ticket boilerplate.

---

## 7. Acceptance criteria (po implementacji Opcji A)

- [ ] Po starcie `run.ts` istnieje `data/map.png` (gdy `DRONE_MAP_URL` ustawione).
- [ ] Agent w pierwszych turach woła `analyze_image_vision` z `data/map.png`.
- [ ] Agent **nie** musi wywoływać `http_request` na URL mapy.
- [ ] Kolejny smoke: agent przechodzi poza blokadę vision (może nadal wymagać iteracji hub — to OK).
- [ ] `bun test` + `tsc` green.

---

## 8. Open question

Czy po Opcji A wdrożyć **Opcję C** w boilerplate w osobnym PR (długoterminowo), czy zostawić prefetch tylko dla s02e05?

---

## 9. Referencje

```51:68:tasks/boilerplate/src/tools/mcp/analyze_image_vision.ts
export async function executeAnalyzeImageVision(args) {
  // ...
  const imageBuffer = await readFile(resolvedPath);
```

```63:71:tasks/boilerplate/src/tools/mcp/http_request.ts
const rawText = await response.text();
// ...
parsed = rawText;
```

Wzorzec pobierania binariów w repo: `tasks/s02e02/src/hub.ts` (`arrayBuffer`).
