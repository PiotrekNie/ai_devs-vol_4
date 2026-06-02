# Plan wdrożenia — S03E04: homework `negotiations`

**Normatywny research:** [negotiations.research.md](negotiations.research.md) — **zaakceptowany** (2026-06-02)  
**Workspace:** `tasks/s03e04/`  
**README:** [../../../README.md](../../../README.md)  
**Status planu:** **Zaimplementowany lokalnie** (2026-06-02) — oczekuje deploy na azyl + `/verify` + flaga

**Decyzje PO (z research §10):**

| # | Decyzja |
| --- | --- |
| 1 | **2 narzędzia HTTP** (T1 pojedynczy produkt, T2 przecięcie) |
| 2 | Matcher **deterministyczny** (token scoring), bez LLM w handlerze |
| 3 | **Bez** `@ai-devs/agent-boilerplate` / MCP / ReAct |
| 4 | **Hosting azyl** — Bun + Hono na `azyl.ag3nts.org` (`ssh agent11784@azyl.ag3nts.org -p 5022`) |
| 5 | MVP: bez Promptfoo, bez lokalnego agenta testowego |

**Weryfikacja UI:** brak.

---

## 1. Zakres (scope)

**W zakresie:**

| ID | Element | Stan |
| --- | --- | --- |
| P1 | Pakiet npm `tasks/s03e04/` (`package.json`, `tsconfig.json`, skrypty) | ☑ |
| P2 | Wczytanie CSV (`csv/*.csv`) → indeks w pamięci przy starcie | ☑ |
| P3 | Matcher NL → `itemCode` (scoring + normalizacja PL) | ☑ |
| P4 | **T1** `POST /api/find-cities-for-product` → `{ output }` | ☑ |
| P5 | **T2** `POST /api/find-cities-with-all-products` → `{ output }` | ☑ |
| P6 | Guard długości `output` (4–500 bajtów UTF-8) | ☑ |
| P7 | Logowanie żądań (debug Centrali): `params`, bajty `output` | ☑ |
| P8 | Skrypt **`register.ts`** — rejestracja narzędzi w `/verify` | ☑ |
| P9 | Skrypt **`check.ts`** — `action: "check"` + wypisanie flagi | ☑ |
| P10 | Testy jednostkowe matchera i `clampOutput` (`bun test`) | ☑ |
| P11 | **`README.md`** — deploy na azyl (rsync, start, register, check) | ☑ |

**Poza zakresem:**

- `createAgent`, MCP, boilerplate, Langfuse
- Envelope `{ data, hint }` (lekcja Gmail)
- Promptfoo / eval harness
- CI z prawdziwym hubem (wymaga sekretów)
- Automatyczny deploy SSH w CI (instrukcja ręczna w README)

---

## 2. Architektura (as-built)

```text
tasks/s03e04/
├── csv/                              # items, cities, connections
├── config.ts                         # PORT, PUBLIC_BASE_URL, HUB_*, TOOL_DESCRIPTIONS
├── server.ts                         # Hono + Bun.serve (0.0.0.0)
├── register.ts                       # POST /verify (tools)
├── check.ts                          # POST /verify (action: check)
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── catalog/
    │   ├── loadCatalog.ts            # parse CSV → CatalogIndex
    │   ├── loadCatalog.test.ts
    │   └── types.ts
    ├── matcher/
    │   ├── matchProduct.ts           # matchProduct + matchProducts + split
    │   ├── matchProduct.test.ts
    │   └── normalize.ts              # mapa PL diakrytyków, tokeny, 48v/24v
    ├── tools/
    │   ├── findCitiesForProduct.ts
    │   ├── findCitiesWithAllProducts.ts
    │   ├── formatOutput.ts           # clampOutput 4–500 B
    │   └── tools.test.ts             # E1–E6 integracja
    ├── http/
    │   ├── toolRoute.ts              # wspólny handler { params } → { output }
    │   └── fetchWithRetry.ts         # retry 429/503
    └── hub/
        └── verifyClient.ts           # registerTools, checkTask, buildToolUrls
```

**Zależności:** `hono`, `zod` — **bez** `@ai-devs/agent-boilerplate`.

### Przepływ runtime

1. **Deploy:** `rsync` kodu na azyl → `ssh agent11784@azyl.ag3nts.org -p 5022`
2. **Start:** `bun run start` na azyl (`PORT=51784`, bind `0.0.0.0`)
3. **Public URL:** `https://azyl-51784.ag3nts.org` (port aplikacji **51784**, jak S01E03)
4. **Register (lokalnie):** `bun run register` z `PUBLIC_BASE_URL` + `HUB_API_KEY`
5. Po 30–60 s: `bun run check` — `action: "check"`, log flagi

### Zmienne środowiskowe

| Zmienna | Domyślnie | Opis |
| --- | --- | --- |
| `PORT` | `51784` | Port nasłuchu na azyl (agent11784) |
| `PUBLIC_BASE_URL` | `https://azyl-51784.ag3nts.org` | HTTPS bez końcowego `/` |
| `HUB_API_KEY` | — | z `tasks/.env` |
| `HUB_VERIFY_URL` | `https://hub.ag3nts.org/verify` | endpoint weryfikacji |
| `AZYL_SSH` | `agent11784@azyl.ag3nts.org -p 5022` | dokumentacja deploy |

---

## 3. Kontrakty endpointów

### 3.1 Wspólny handler

**Request:** `POST`, `Content-Type: application/json`

```json
{ "params": "turbina wiatrowa 48V" }
```

**Response:** zawsze `200` +

```json
{ "output": "Domatowo, Skolwin" }
```

Walidacja: `params` musi być niepustym stringiem po trim; inaczej `output`: `Podaj opis produktu.`

Dodatkowo: `GET /health` → `{ ok, task, baseUrl }` (smoke na azyl).

### 3.2 T1 — find cities for product

- Match **jeden** produkt z `params`.
- Lookup `connections` → nazwy miast (`cities.name`).
- Sort alfabetyczny (`pl`), join `", "`.
- Brak wyników: `Brak miast.`
- Nierozpoznany produkt: `Nie rozpoznano produktu.`

### 3.3 T2 — find cities with all products

- Split `params` na segmenty: `,`, `;`, ` oraz `, ` i `, ` or `, `+`.
- Match każdy segment → `itemCode`; przy błędzie: `Nie rozpoznano: <fragment>.`
- Przecięcie zbiorów miast; mapowanie na nazwy; sort `pl`.
- Pusty wynik: `Brak miast ze wszystkimi produktami.`

### 3.4 Opisy dla `/verify`

Stałe w `config.ts` → `TOOL_DESCRIPTIONS` (używane przez `verifyClient.buildToolUrls`). Treść zgodna z research §6.5.

---

## 4. Matcher (zaimplementowany)

| Krok | Działanie | Plik |
| --- | --- | --- |
| 1 | `normalizeText` — lowercase + mapa `ąćęłńóśźż` → ASCII | `normalize.ts` |
| 2 | Kod produktu `/^[A-Z0-9]{6}$/` → lookup bezpośredni | `matchProduct.ts` |
| 3 | Tokenizacja (min. 2 znaki) + wzorce `48v`, `\d+w`, `\d+ah` | `normalize.ts` |
| 4 | Score: overlap tokenów (+2 dla długich), bonus substring, bonus napięcia | `matchProduct.ts` |
| 5 | Próg: `MIN_SCORE=2`, `MIN_MARGIN=1` — inaczej `null` | `matchProduct.ts` |

---

## 5. Kryteria akceptacji (Definition of Done)

### Lokalnie (zakończone)

- [x] `cd tasks/s03e04 && bun install && bun test && bunx tsc --noEmit` — OK (13 testów)
- [x] T2 dla zestawu 48 V (NL) → `Domatowo, Skolwin`
- [x] T1 dla `turbina wiatrowa 400W 48V` → Skolwin, Rzeszow, Domatowo
- [x] Pusty / nonsens `params` → czytelny komunikat w `output`
- [x] `register.ts` / `check.ts` + `fetchWithRetry` 503
- [x] README: azyl SSH, rsync, register → wait → check
- [x] Brak zależności `@ai-devs/agent-boilerplate`

### E2E (użytkownik)

- [ ] Serwer działa na azyl; `curl https://azyl-51784.ag3nts.org/health` → OK
- [ ] `bun run register` — Hub przyjmuje 2 URL narzędzi
- [ ] `bun run check` po 30–60 s → `{FLG:...}`

---

## 6. Plan zadań

| ID | Typ | Zadanie | Status |
| --- | --- | --- | --- |
| N1 | [CREATE] | `package.json`, `tsconfig.json`, `config.ts` | ☑ |
| N2 | [CREATE] | `src/catalog/*` — load CSV, typy, test parse | ☑ |
| N3 | [CREATE] | `src/matcher/*` — normalize, matchProduct, matchProducts | ☑ |
| N4 | [CREATE] | `src/tools/formatOutput.ts` — clamp 4–500 B | ☑ |
| N5 | [CREATE] | `src/tools/findCitiesForProduct.ts`, `findCitiesWithAllProducts.ts` | ☑ |
| N6 | [CREATE] | `src/http/toolRoute.ts`, `fetchWithRetry.ts` | ☑ |
| N7 | [CREATE] | `server.ts` — Hono, 2 route, logowanie | ☑ |
| N8 | [CREATE] | `src/hub/verifyClient.ts`, `register.ts`, `check.ts` | ☑ |
| N9 | [CREATE] | Testy: matcher (E1–E5), clampOutput, T2 integracja | ☑ |
| N10 | [CREATE] | `README.md` | ☑ |
| N11 | [MODIFY] | Research + plan — status, as-built, azyl | ☑ |

**Bramki jakości:**

```bash
cd tasks/s03e04
bun test          # 13 pass
bunx tsc --noEmit
bun --env-file=../.env run server.ts   # smoke lokalny
```

---

## 7. Ryzyka

| Ryzyko | Mitygacja |
| --- | --- |
| Matcher źle mapuje NL | testy E1–E3; log `[TOOL]` w handlerze; tuning `MIN_SCORE` |
| Serwer azyl niedostępny | README: rsync + `nohup bun run start`; sprawdź `PUBLIC_BASE_URL` |
| Hub 503 | `fetchWithRetry` w register/check |
| `output` > 500 B | `clampOutput` + test E6 |

---

## 8. Human gate

**Pozostało:** deploy na azyl + `/verify` + `check` (flaga) — krok ręczny użytkownika.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-02 | Plan początkowy — 2 HTTP tools, matcher deterministyczny, bez boilerplate |
| 2026-06-02 | Hosting: azyl SSH zamiast ngrok; implementacja N1–N10 |
| 2026-06-02 | Aktualizacja spec: as-built, DoD, env, poprawione liczby CSV |
