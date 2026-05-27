# Research — S02E05 drone: analiza nieudanego runu (terminal smoke)

**Data:** 2026-05-27  
**Status:** Research — **oczekuje na akceptację** przed planem / implementacją  
**Trigger:** terminal `bun --env-file=../.env run run.ts` — agent utknął na `setDestinationObject`, `ask_human`, błędne ID od operatora, rezygnacja mimo `hardReset`

**Powiązane:**

- [s02e05-drone-smoke-findings.research.md](s02e05-drone-smoke-findings.research.md) — prefetch mapy (Opcja A ✅)
- [boilerplate-runtime-hardening.research.md](../../../../boilerplate/docs/specs/boilerplate-runtime-hardening/boilerplate-runtime-hardening.research.md) — submit_to_hub / ask_human / maxIterations
- [s02e05-drone.research.md](s02e05-drone.research.md) — scaffold epizodu

---

## 1. Executive summary

**Werdykt:** run **nie** wskazuje na regresji runtime po ostatnich poprawkach (`submit_to_hub`, prefetch mapy, `ask_human`, `maxIterations`). Główne błędy to **logika agenta / prompt / interpretacja huba** oraz **myląca odpowiedź operatora**.

| # | Problem | Severity | Typ |
| --- | --- | --- | --- |
| 1 | Zły sektor mapy `(2,2)` zamiast `(4,2)` (siatka **4×3**) | **BLOCKER** misji | Agent / prompt |
| 2 | Operator podał **`PWR6132PL`** (elektrownia z lore s02e04), nie ID tamy | **BLOCKER** | Human-in-the-loop |
| 3 | Brak **`hardReset` → `getConfig`** przed misją; sticky state na hubie | **HIGH** | Agent / prompt |
| 4 | Zła interpretacja **`-880`** (rezygnacja zamiast korekty ID/sektora) | **HIGH** | Agent / prompt |
| 5 | Brak strategii odkrycia ID (UUID w `HUB_API_KEY` / `DRONE_MAP_URL`) | **HIGH** | Prompt |
| 6 | Hipoteza **`DAM731179PL`** nadal zwraca **`-945`** | **MEDIUM** | Homework puzzle (otwarte) |

**Rekomendacja:** **nie** rozszerzać scope o nowe MCP ani boilerplate binary HTTP. W tej fazie wystarczy **twardnienie promptów + runtime context + opcjonalny bootstrap `hardReset`** w `run.ts`. Osobno domknąć [boilerplate-runtime-hardening](../../../../boilerplate/docs/specs/boilerplate-runtime-hardening/boilerplate-runtime-hardening.research.md) (helper native tools, README).

---

## 2. Chronologia runu (terminal)

```text
1. Vision → tama w sektorze (2,2)                    ← podejrzane (patrz §4.1)
2. Brute prefiksów: DAM*, HYD*, OBJ*, BLD* + 1234   → -945 „I don't know that location.”
3. ask_human → operator: PWR6132PL                   ← pułapka (§4.2)
4. submit PWR6132PL + (2,2) + destroy               → -880 „pretending to destroy power plants…”
5. submit PWR6132PL + (2,2) + video/image           → ten sam -880 (sticky state + zły ID)
6. hardReset w tej samej paczce + video/image       → nadal -880
7. ask_human / rezygnacja                            ← przedwczesne (§4.4)
```

**Uwaga:** `submit_to_hub` działa poprawnie — odpowiedzi huba docierają jako JSON z kodem błędu; problem leży w treści `instructions`, nie w narzędziu.

---

## 3. Weryfikacja empiryczna (hub + vision, 2026-05-27)

Testy wykonane skryptem `bun --env-file=../.env` z tym samym `HUB_API_KEY` co run użytkownika.

### 3.1 Siatka i sektor tamy (vision)

`analyze_image_vision` na `data/map.png`:

| Pole | Wynik |
| --- | --- |
| Siatka | **4 kolumny × 3 wiersze** (czerwona siatka na mapie) |
| Tama (jasnon niebieska woda) | **(4, 2)** — prawy środkowy kwadrant |
| Tekst / ID na mapie | **Brak** widocznych etykiet `XXX123PL` |

**Wniosek:** agentowe `(2,2)` jest **najpewniej błędne** (o jedną kolumnę w lewo).

### 3.2 Korelacja UUID → numer obiektu (hipoteza kursu)

| Źródło | Prefix UUID |
| --- | --- |
| `HUB_API_KEY` | `731179b9-…` |
| `DRONE_MAP_URL` | `…/data/731179b9-…/drone.png` |

Naturalna hipoteza ID: **`DAM731179PL`** (prefiks typu + 6 cyfr z UUID + `PL`).

**Wynik hub:** `DAM731179PL` + sektor `(4,2)` + `destroy` → nadal **`-945`** (nieznana lokalizacja).  
Hipoteza **niewystarczająca** — prefiks `DAM` lub reguła numeru wymaga dalszej iteracji / innego źródła (nie zapisano poprawnego ID w repo).

### 3.3 Pułapka `PWR6132PL`

| Scenariusz | Kod | Komunikat |
| --- | --- | --- |
| `PWR6132PL`, `(2,2)`, `destroy` | **-880** | „…pretending to destroy **power plants**…” |
| `PWR6132PL`, `(4,2)`, `destroy` | **-880** | „I don't think you'll hit the **dam**. You'll drop it somewhere nearby.” |
| `PWR6132PL`, `(4,2)`, `image` | **-880** | ten sam komunikat o tamie |
| `DAM731179PL`, dowolny sektor 4×3 | **-945** | „I don't know that location.” |

**Wnioski:**

- **`PWR6132PL` jest rozpoznawane przez hub** (nie dostaje `-945`) — to **znany obiekt** z fabuły kursu (mail s02e04: „Zapis z kamer w obiekcie PWR6132PL”).
- To **decoy / red herring** dla misji tamy — nie ID docelowe homeworku.
- Komunikat o „dam” przy `PWR6132PL` + `(4,2)` sugeruje, że **sektor `(4,2)` jest bliżej oczekiwania huba**, ale **ID nadal złe**.

### 3.4 Sticky state drona (`getConfig`)

Po serii nieudanych submitów, samo `getConfig` zwraca:

```json
{
  "destination": "PWR6132PL",
  "sektor_x": 4,
  "sektor_y": 2,
  "goal": []
}
```

**`hardReset` w osobnym submitcie** czyści stan:

```json
{
  "destination": null,
  "sektor_x": null,
  "sektor_y": null,
  "goal": []
}
```

**Wniosek:** agent powinien **najpierw** wysłać sam `hardReset`, potem **`getConfig`** (weryfikacja), dopiero potem składać misję. Łączenie `hardReset` z pełną misją w jednej paczce **nie gwarantuje** oczyszczenia przed interpretacją błędów z poprzednich tur sesji.

### 3.5 Endpoint `/dane/` (403 JPEG)

`GET https://hub.ag3nts.org/dane/` → **403** + obraz JPEG (GIMP placeholder).  
**Nie** zawiera listingu ani ID obiektów — agent słusznie uznał to za ślepy trop; **nie** warto promować w promptcie.

---

## 4. Root cause analysis

### 4.1 Błędny sektor mapy

| | Agent | Weryfikacja |
| --- | --- | --- |
| Siatka | domyślnie / halucynacja 8×6 lub `(2,2)` | **4×3**, tama **(4,2)** |
| Skutek | `set(2,2)` | Hub ocenia lot w złym miejscu |

**Mitygacja prompt:** w `drone_task.md` — jawne pytanie vision o **wymiary siatki** i **współrzędne jasnon niebieskiej wody**; zakaz `set(x,y)` bez wcześniejszej odpowiedzi vision.

### 4.2 Decoy `PWR6132PL` od operatora

Operator podał ID z **innego epizodu kursu** (elektrownia jądrowa). Agent **zaufał** odpowiedzi z `ask_human` zamiast:

- odrzucić `PWR*` przy misji **zniszczenia tamy**,
- kontynuować iterację prefiksów / numerów powiązanych z UUID.

**Mitygacja prompt:** sekcja „Pułapki fabularne” — `PWR6132PL` znane z s02e04; przy `-880` o power plants **nie** traktować ID jako poprawne dla tamy.

### 4.3 Brak diagnostyki stanu (`getConfig`)

Prompt wspomina `hardReset` przy chaosie, ale **nie** wymusza `getConfig` do odczytu `destination` / `sektor_x/y` / `goal` po błędach.

**Mitygacja:** dodać obowiązkowy krok: po `-880` / sprzecznych komunikatach → `["hardReset"]` → `["getConfig"]` → analiza → nowa misja.

### 4.4 Przedwczesna rezygnacja

Agent uznał, że „problem z ID od operatora”, mimo że:

- `-880` z `video`/`image` przy `PWR6132PL` **nie** oznacza trwałego „destroy” w paczce,
- właściwa reakcja: **odrzucić PWR**, wrócić do odkrycia ID + `(4,2)`.

**Mitygacja:** w `system.md` — mapowanie kodów błędów huba (§5.2); zakaz `finish_task` / rezygnacji po jednej odpowiedzi `ask_human` jeśli ID jest typu `PWR*`.

---

## 5. Propozycje zmian (ranking)

### 5.1 Opcja A — **Rekomendowana:** prompty + runtime context (tylko `tasks/s02e05/`)

| ID | Plik | Zmiana |
| --- | --- | --- |
| P1 | `src/prompts/drone_task.md` | Sekcja **Mapa:** siatka 4×3; vision musi zwrócić **kolumny×wiersze** i cell tamy; przykład `(4,2)` jako ilustracja, nie stała |
| P2 | `src/prompts/drone_task.md` | Sekcja **ID obiektu:** format z docs; numer często koreluje z prefiksem UUID `HUB_API_KEY` / `DRONE_MAP_URL`; iteruj prefiksy (`DAM`, `BLD`, …) + hub; **nie** używaj `PWR6132PL` do tamy |
| P3 | `src/prompts/drone_task.md` | Sekcja **Diagnostyka:** po błędach → `hardReset` (osobny submit) → `getConfig` → dopiero misja |
| P4 | `src/prompts/drone_task.md` | Sekcja **Kody błędów:** `-945` nieznane ID; `-880` + „power plants” = zły typ obiektu; `-880` + „hit the dam” = zły ID przy dobrym sektorze |
| P5 | `src/prompts/system.md` | `ask_human` tylko gdy wyczerpano UUID-prefix + iterację prefiksów; waliduj odpowiedź operatora (odrzuć `PWR*` dla tamy) |
| P6 | `run.ts` | Runtime context: „UUID mapy i apikey mają ten sam prefiks — użyj go przy budowie ID”; opcjonalnie **preflight `hardReset`** przed agentem (flaga env `DRONE_PREFLIGHT_RESET=1`) |
| P7 | `docs/context/s02e05.md` | Nota dla autora: poprawny sektor z vision to **(4,2)**; `PWR6132PL` to pułapka |

**Scope:** brak nowych zależności; brak zmian boilerplate MCP.

### 5.2 Opcja B — bootstrap preflight reset (dodatek do A)

W `run.ts` przed `createAgent`:

```typescript
await preflightHubReset(HUB_API_KEY); // POST { instructions: ["hardReset"] }
```

| Plus | Minus |
| --- | --- |
| Czyści sticky state między runami | Ukrywa naukę `hardReset` w ReAct |
| Stabilniejszy smoke CI | Wymaga `HUB_API_KEY` przy każdym starcie |

**Rekomendacja:** domyślnie **wyłączone**; włączyć env `DRONE_PREFLIGHT_RESET=1` do debug/smoke.

### 5.3 Opcja C — epizodowe MCP `drone_get_config` (odradzane)

Wrapper na submit z samym `getConfig`.  
**Minus:** duplikacja; wystarczy instrukcja w `instructions[]` przez istniejący `submit_to_hub`.

### 5.4 Poza scope (już zaplanowane elsewhere)

- [boilerplate-runtime-hardening](../../../../boilerplate/docs/specs/boilerplate-runtime-hardening/boilerplate-runtime-hardening.research.md) — `createNativeToolBundle`, README
- Rozwiązanie pełnej sekwencji do `{FLG:...}` — **homework modelu**, nie runtime; poprawne ID tamy **nie potwierdzone** w testach (§3.2)

---

## 6. Acceptance criteria (po implementacji Opcji A)

- [ ] Prompt zawiera: siatka 4×3, vision-first dla `(x,y)`, UUID hint, pułapka PWR, workflow hardReset→getConfig, mapowanie `-945`/`-880`
- [ ] Kolejny smoke: agent **nie** woła `ask_human` po 3–5 losowych prefiksach; iteruje dalej lub używa UUID
- [ ] Agent **nie** akceptuje `PWR6132PL` jako ID tamy po `-880`
- [ ] Po błędach agent wysyła `getConfig` i loguje `destination` / sektor
- [ ] `bun test` + `tsc` green w `tasks/s02e05/`
- [ ] (Opcjonalnie) smoke z `DRONE_PREFLIGHT_RESET=1` startuje ze `destination: null`

---

## 7. Open questions

1. **Poprawne ID tamy** — czy zespół ma referencyjne `{FLG:...}` / ID z platformy kursu? (Testy: `DAM731179PL` **nie** przechodzi.)
2. **Preflight reset** — włączyć domyślnie w `run.ts`, czy tylko env?
3. **Scope implementacji** — tylko prompty (A), czy A+B+C z hardening boilerplate w jednym PR?
4. **ask_human** — czy ograniczyć pytania operatora wyłącznie do braku `HUB_API_KEY` / `DRONE_MAP_URL`, a ID zostawić hubowi?

---

## 8. Proponowane next steps

1. **Ty:** zaakceptuj ten research lub odpowiedz na §7.
2. **Po akceptacji:** plan `s02e05-drone-run-failure.plan.md` (fazy P1–P7) + ewentualnie merge z hardening boilerplate.
3. **Implement:** prompty + opcjonalny preflight; **bez** commitów bez prośby.
4. **Verify:** smoke run + ręczna checklista §6.

---

## 9. Changelog

| Data | Autor | Opis |
| --- | --- | --- |
| 2026-05-27 | EM / Context | Analiza terminala, testy hub + vision, propozycje zmian prompt/runtime |
