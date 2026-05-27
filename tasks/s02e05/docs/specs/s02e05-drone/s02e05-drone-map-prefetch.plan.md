# Plan wdrożenia — S02E05: prefetch mapy PNG (Opcja A)

**Normatywny research:** [s02e05-drone-smoke-findings.research.md](s02e05-drone-smoke-findings.research.md) (Opcja A — zaakceptowana 2026-05-27)  
**Kontekst:** smoke run — agent zablokowany: brak zapisu mapy + `analyze_image_vision` wymaga lokalnego pliku  
**Workspace:** `tasks/s02e05/`  
**Poza scope:** zmiany w `tasks/boilerplate/` (Opcje C/D — osobny ticket)

**Weryfikacja UI:** brak.

---

## 1. Zakres (scope)

**W zakresie:**

- Pobranie mapy z `DRONE_MAP_URL` **przed** startem pętli ReAct (bootstrap w `run.ts`).
- Zapis do `data/map.png` (gitignored).
- Stała `DRONE_MAP_LOCAL_PATH` w `config.ts`.
- Aktualizacja promptów: vision na gotowej ścieżce; **nie** pobieraj mapy przez `http_request`.
- Runtime context w `instructions`: ścieżka lokalna + informacja, że plik jest już gotowy.
- Doprecyzowanie reguł `finish_task` vs `ask_human` przy blokadzie.
- Test jednostkowy modułu prefetch (mock `fetch` lub test helpera).
- README + CHANGELOG + wpis w głównym planie epizodu.

**Poza zakresem:**

- Nowe narzędzia MCP (`analyze_drone_map`, `write_file`).
- Rozszerzenie `analyze_image_vision` o `url` w boilerplate.
- Binary-safe `http_request`.
- Gwarancja sukcesu huba / flagi `{FLG:...}` (tylko odblokowanie vision).

---

## 2. Cel i zachowanie docelowe

```text
run.ts start
  → ensureDroneMapCached(DRONE_MAP_URL) → data/map.png
  → instructions zawierają: "Map file: data/map.png (ready)"
  → createAgent → processQuery
  → agent: analyze_image_vision({ filepath: "data/map.png", query: "..." })
  → http_request(DRONE_DOCS_URL) → submit_to_hub → …
```

Mapa jest **statyczna** na czas runu — brak re-fetch w trakcie sesji (akceptowalne dla homework).

---

## 3. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
| --- | --- |
| Brak `DRONE_MAP_URL` | `ensureDroneMapCached` rzuca czytelny błąd + exit 1 przed agentem (zamiast samego warn) |
| `fetch` mapy fail (403/404) | Sprawdzenie `response.ok`; komunikat z URL bez klucza |
| CWD ≠ katalog epizodu | Ścieżka względem `import.meta.url` / `process.cwd()` — dokumentacja: uruchamiaj z `tasks/s02e05/` |
| Duży PNG (~3 MB) | OK; zapis binarny `arrayBuffer`; `data/` w `.gitignore` |
| Agent nadal woła `http_request` na mapę | Prompt + runtime context: „do not download map” |

---

## 4. Kryteria akceptacji (Definition of Done)

- [ ] Przy ustawionym `DRONE_MAP_URL`: start `run.ts` tworzy `data/map.png` przed pierwszą turą LLM.
- [ ] Przy braku `DRONE_MAP_URL`: proces kończy się czytelnym błędem (nie startuje agenta).
- [ ] `drone_task.md` / runtime context wskazują `data/map.png` jako źródło vision — bez kroku pobierania mapy przez agenta.
- [ ] `system.md`: `finish_task` wyłącznie po `{FLG:...}`; przy blokadzie — `ask_human`.
- [ ] Smoke: agent woła `analyze_image_vision` na `data/map.png` (brak `finish_task` z raportem o braku zapisu).
- [ ] `bun test` + `bunx tsc --noEmit` z `tasks/s02e05/` — green.
- [ ] README opisuje prefetch i wymóg uruchomienia z katalogu epizodu.

---

## 5. Plan fazowy i zadania

### Faza P1 — Config i moduł prefetch

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| P1.1 | [CREATE] | **`src/ensureDroneMapCached.ts`:** `ensureDroneMapCached(url, localPath)` — `mkdir` parent, `fetch`, `arrayBuffer`, `writeFile`; walidacja `content-type` zawiera `image/` lub rozszerzenie `.png`; throw przy !ok. | [ ] Eksport funkcji; brak logowania URL z sekretami. |
| P1.2 | [MODIFY] | **`config.ts`:** `DRONE_MAP_LOCAL_PATH = "data/map.png"` (env override opcjonalny `DRONE_MAP_LOCAL_PATH`). | [ ] Stała używana w run + testach. |
| P1.3 | [CREATE] | **`src/ensureDroneMapCached.test.ts`:** mock global `fetch` → zapis pliku tymczasowego / asercja wywołania write. | [ ] Test bez sieci. |

### Faza P2 — Bootstrap i prompty

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| P2.1 | [MODIFY] | **`run.ts`:** przed `createAgent` — `await ensureDroneMapCached(DRONE_MAP_URL, DRONE_MAP_LOCAL_PATH)`; hard fail gdy URL pusty. | [ ] `[SYSTEM]` log: map cached path + byte size. |
| P2.2 | [MODIFY] | **`run.ts`:** runtime context — `Map file (ready): ${DRONE_MAP_LOCAL_PATH}`; user query: vision na tej ścieżce. | [ ] Brak sugestii http_request na mapę. |
| P2.3 | [MODIFY] | **`src/prompts/drone_task.md`:** sekcja mapy → `analyze_image_vision` na `data/map.png` (prefetched); usuń http_request mapy. | [ ] Zachować live HTML docs. |
| P2.4 | [MODIFY] | **`src/prompts/system.md`:** `finish_task` tylko po fladze; blokada → `ask_human`. | [ ] Bez sprzeczności z drone_task. |

### Faza P3 — Dokumentacja i plan nadrzędny

| ID | Typ | Zadanie | DoD |
| --- | --- | --- | --- |
| P3.1 | [MODIFY] | **`README.md`:** sekcja prefetch mapy przed agentem; wymóg `DRONE_MAP_URL`; CWD. | [ ] |
| P3.2 | [MODIFY] | **`CHANGELOG.md`:** wpis o prefetch / smoke fix. | [ ] |
| P3.3 | [MODIFY] | **`docs/context/s02e05.md`:** mapa prefetch w bootstrap, nie przez agenta. | [ ] |
| P3.4 | [MODIFY] | **`s02e05-drone-smoke-findings.research.md`:** status → zaakceptowany / zaimplementowany po merge. | [ ] |
| P3.5 | [MODIFY] | **`s02e05-drone.plan.md`:** changelog + opcjonalna Faza G (prefetch) odhaczona po implementacji. | [ ] |

---

## 6. Szkic implementacji (referencja)

```typescript
// src/ensureDroneMapCached.ts (szkic)
export async function ensureDroneMapCached(
  mapUrl: string,
  localPath: string,
): Promise<{ bytes: number; localPath: string }> {
  if (!mapUrl.trim()) {
    throw new Error("DRONE_MAP_URL is required — set it in tasks/.env");
  }
  const response = await fetch(mapUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch map: HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  await mkdir(dirname(localPath), { recursive: true });
  await writeFile(localPath, bytes);
  return { bytes: bytes.length, localPath };
}
```

Wzorzec binarny: `tasks/s02e02/src/hub.ts` — `fetchBoardPng`.

---

## 7. Bramki jakości

```bash
cd tasks/s02e05
bun test
bun run typecheck
```

Smoke (ręcznie):

```bash
bun --env-file=../.env run run.ts
# Oczekiwane: [SYSTEM] map cached … → analyze_image_vision(data/map.png) w logach [AKCJA]
```

---

## 8. Decyzje zamknięte

| # | Temat | Decyzja |
| --- | --- | --- |
| 1 | Wybrana opcja | **A** — prefetch w bootstrap |
| 2 | Ścieżka lokalna | `data/map.png` (domyślnie) |
| 3 | Brak URL | **exit 1** przed agentem |
| 4 | Boilerplate | **bez zmian** |
| 5 | Opcja C (vision+url) | **odłożona** — osobny ticket po smoke |

---

## 9. Changelog planu

| Data | Zmiana |
| --- | --- |
| 2026-05-27 | Plan prefetch mapy (Opcja A) po smoke findings research. |

---

## 10. Checklist postępu (`@eversis-implement`)

- [x] Faza P1 — P1.1, P1.2, P1.3
- [x] Faza P2 — P2.1, P2.2, P2.3, P2.4
- [x] Faza P3 — P3.1–P3.5
- [ ] Kryteria akceptacji §4 — smoke hub (poza prefetch)
- [ ] Smoke ręczny — vision odblokowane
