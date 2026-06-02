# S03E04 — homework `negotiations` (research)

**Task:** Przygotować 1–2 publiczne endpointy HTTP, których użyje **zewnętrzny** agent Centrali, aby znaleźć miasta oferujące **wszystkie** potrzebne produkty do turbiny wiatrowej.  
**Data:** 2026-06-02  
**Status:** Research **zaakceptowany** · implementacja **zakończona lokalnie** (2026-06-02)  
**Plan:** [negotiations.plan.md](negotiations.plan.md)  
**Kod:** [tasks/s03e04/](../../../) · [README operacyjny](../../../README.md)

**Źródła:**

- `markdowns/s03e04-budowanie-narzedzi-na-podstawie-danych-testowych-1774477151.md` — opis zadania
- `tasks/s03e04/csv/` — `items.csv`, `cities.csv`, `connections.csv`
- `tasks/boilerplate/docs/specs/s03e04-tool-design-test-data/` — profil homework vs boilerplate
- Wzorzec HTTP: Bun + Hono (jak S01E03), hosting: **azyl.ag3nts.org**

---

## 1. Executive summary

**Decyzja (zrealizowana): 2 wąskie narzędzia HTTP + deterministyczne dopasowanie NL → produkt (bez LLM w handlerze).**

| Narzędzie | Endpoint | Rola |
| --- | --- | --- |
| **T1** | `POST /api/find-cities-for-product` | Jeden produkt (NL w `params`) → **nazwy miast** |
| **T2** | `POST /api/find-cities-with-all-products` | Wiele produktów w `params` → miasta z **przecięcia** zbiorów |

**Dlaczego 2, a nie 1:** zewnętrzny agent ma tylko **10 kroków**. T2 domyka zadanie w 1–2 wywołaniach; T1 pomaga przy eksploracji pojedynczego komponentu.

**Dlaczego nie envelope Gmail / MCP boilerplate:** odpowiedź `{ "output": string }`, **4–500 bajtów** — bez `nextActions`, bez JSON w `output`.

**Odpowiedź fabularna (zestaw 48 V):** trójka `WITR48 + A94MAZ + 06OTEA` → **`Domatowo, Skolwin`** (sort alfabetyczny `pl`).

---

## 2. Wymagania (kontrakt Centrali)

### 2.1 Rejestracja (`POST /verify`)

```json
{
  "apikey": "...",
  "task": "negotiations",
  "answer": {
    "tools": [
      {
        "URL": "https://azyl-51784.ag3nts.org/api/find-cities-for-product",
        "description": "..."
      },
      {
        "URL": "https://azyl-51784.ag3nts.org/api/find-cities-with-all-products",
        "description": "..."
      }
    ]
  }
}
```

Rejestracja: `bun run register` (lokalnie, z `HUB_API_KEY`).

### 2.2 Wywołanie narzędzia (Centrala → Twój serwer)

```json
{ "params": "naturalny język, np. turbina wiatrowa 48V" }
```

### 2.3 Odpowiedź narzędzia

```json
{ "output": "Domatowo, Skolwin" }
```

| Ograniczenie | Implikacja |
| --- | --- |
| **4–500 bajtów** UTF-8 | Nazwy miast (`cities.name`), nie kody; `clampOutput()` przy overflow |
| **≤ 10 kroków** agenta | Mocne opisy T1/T2 w `/verify` (`config.TOOL_DESCRIPTIONS`) |
| **≤ 2 narzędzia** | 2 endpointy — limit wypełniony |
| Brak odpowiedzi → agent **przerywa** | Zawsze `200` + JSON; błędy jako krótki tekst w `output` |
| Weryfikacja **async** | Po rejestracji `action: "check"` po ~30–60 s; debug: https://hub.ag3nts.org/debug |

### 2.4 Co jest poza Twoim kodem

- Agent Centrali wybiera **3 produkty** (fabuła turbiny).
- Agent składa **ostateczną odpowiedź** — Ty dostarczasz tylko narzędzia.
- Brak ReAct / MCP / `createAgent` w tym homeworku.

---

## 3. Model danych

| Plik | Kolumny | Wiersze w repo |
| --- | --- | --- |
| `items.csv` | `name`, `code` | **2137** produktów |
| `cities.csv` | `name`, `code` | **50** miast |
| `connections.csv` | `itemCode`, `cityCode` | **5349** relacji |

**Relacje:** każdy wiersz `connections` = produkt dostępny w mieście.  
**Odpowiedź dla agenta:** zawsze **`cities.name`** (np. `Skolwin`), nie kod `H1P6ZQ`.

### 3.1 Produkty fabularne (turbina)

| Kod | Nazwa |
| --- | --- |
| `WITR48` | Turbina wiatrowa 400W 48V |
| `WITR24` | Turbina wiatrowa 400W 24V |
| `A94MAZ` | Inwerter DC/AC 48V 3000W |
| `A94ZZ4` | Inwerter DC/AC 12V 1500W |
| `06OTEA` | Akumulator AGM 48V 150Ah |
| `06OTEB` | Akumulator kwasowy 12V 200Ah |

---

## 4. Analiza danych testowych (kluczowe wnioski)

### 4.1 Zestaw 48 V (najbardziej spójny fabularnie)

Produkty: **WITR48 + A94MAZ + 06OTEA**

| Produkt | Miasta (T1) |
| --- | --- |
| WITR48 | Skolwin, Rzeszow, Domatowo |
| A94MAZ | Skolwin, Bydgoszcz, Domatowo |
| 06OTEA | Skolwin, Jaworzno, Domatowo |

**Przecięcie (T2, wszystkie 3):** **`Domatowo`**, **`Skolwin`**.

### 4.2 Inne potrójne zestawy z powyższej szóstki

- **Jedyny** triple z niepustym przecięciem: 48 V turbina + inwerter 48 V + akumulator AGM 48 V.
- Zestaw 24 V (`WITR24 + A94ZZ4 + 06OTEB`) → **0 miast** wspólnych (`06OTEB` bez połączeń w CSV).

**Wniosek:** weryfikacja fabularna najpewniej użyje trójki 48 V; matcher musi działać dla **całego** katalogu.

### 4.3 Wyzwanie NL (~2137 produktów)

Agent może wysłać pełną nazwę, skrót („turbina 48V”) lub opis przybliżony. **Bez LLM w handlerze** — scoring deterministyczny (§6.2).

---

## 5. Opcje architektury narzędzi

| Opcja | Werdykt |
| --- | --- |
| **A — 2 narzędzia (T1 + T2)** | **Wybrane** — minimalna liczba kroków agenta |
| B — 1 uniwersalne | Odrzucone — gorsza discoverability |
| C — 3× T1, agent robi przecięcie | Odrzucone — marnuje kroki |
| D — envelope Gmail | Odrzucone — limit 500 B |

---

## 6. Design zaimplementowany

### 6.1 Runtime

```text
Bun + Hono (server.ts, bind 0.0.0.0)
  → loadCatalog() przy starcie
  → POST /api/find-cities-for-product
  → POST /api/find-cities-with-all-products
  → clampOutput 4–500 B
  → deploy na azyl.ag3nts.org
  → register.ts → /verify
  → check.ts → action: check
```

| SSH | `ssh agent11784@azyl.ag3nts.org -p 5022` |
| Port aplikacji | **`51784`** |
| Publiczny HTTPS | **`https://azyl-51784.ag3nts.org`** |

### 6.2 Matcher NL → `itemCode`

Pliki: `src/matcher/normalize.ts`, `src/matcher/matchProduct.ts`.

1. **Normalizacja:** lowercase + jawna mapa polskich znaków (`ą→a`, `ł→l`, …).
2. **Kod produktu:** `/^[A-Z0-9]{6}$/` → lookup bezpośredni.
3. **Tokenizacja** (min. 2 znaki) + wzorce `48v`, `\d+w`, `\d+ah`.
4. **Scoring:** overlap tokenów (+2 dla długich), bonus substring, bonus napięcia/mocy.
5. **Próg:** `MIN_SCORE=2`, `MIN_MARGIN=1` — inaczej komunikat błędu.

### 6.3 T2 — wiele produktów

Split: `(,|;|\boraz\b|\bi\b|\bor\b|\+)` → match każdego segmentu → przecięcie `Set<cityCode>` → sort `pl` → join.

### 6.4 Format odpowiedzi

| Sytuacja | Przykład `output` |
| --- | --- |
| Sukces T2 | `Domatowo, Skolwin` |
| Brak wspólnych miast | `Brak miast ze wszystkimi produktami.` |
| Brak dla T1 | `Brak miast.` |
| Nierozpoznany produkt | `Nie rozpoznano produktu.` |
| Pusty `params` | `Podaj opis produktu.` |

### 6.5 Opisy narzędzi dla `/verify`

Zdefiniowane w `config.ts` → `TOOL_DESCRIPTIONS`:

**T1:** sprawdza miasta dla **jednego** produktu; `params` po polsku; zwraca nazwy miast oddzielone przecinkami.

**T2:** miasta ze **wszystkimi** produktami naraz; `params` = cały zestaw (przecinek / „oraz” / „i”); użyć przy kompletnym zakupie.

---

## 7. Mapowanie na lekcję S03E04

| Praktyka lekcji (Gmail) | Homework `negotiations` |
| --- | --- |
| Wąskie narzędzia | T1 vs T2 |
| Opisy zachowania | `description` w `/verify` |
| Hint / nextActions | **Nie** |
| Eval Promptfoo | Poza scope MVP |
| Dane testowe | CSV + testy E1–E6 |

---

## 8. Scenariusze testowe

Zaimplementowane w `src/tools/tools.test.ts`, `src/matcher/matchProduct.test.ts`.

| ID | Scenariusz | Oczekiwany wynik | Status |
| --- | --- | --- | --- |
| E1 | T2: turbina 48V + inwerter 48V 3000W + akumulator AGM 48V | `Domatowo, Skolwin` | ☑ |
| E2 | T1: turbina wiatrowa 400W 48V | Skolwin, Rzeszow, Domatowo | ☑ |
| E3 | nonsens xyz | `Nie rozpoznano produktu.` | ☑ |
| E4 | pusty string | `Podaj opis produktu.` | ☑ |
| E5 | T2: WITR24 + A94ZZ4 + 06OTEB (NL) | `Brak miast ze wszystkimi produktami.` | ☑ |
| E6 | clampOutput | 4–500 B | ☑ |

---

## 9. Ryzyka i mitygacja

| Ryzyko | Mitygacja |
| --- | --- |
| Zły match NL | scoring + próg; testy E1–E3; log `[TOOL]` |
| `output` > 500 B | `clampOutput()` |
| Serwer azyl niedostępny | README: rsync + restart; MOTD → `PUBLIC_BASE_URL` |
| Agent używa tylko T1 | mocny opis T2 w `/verify` |
| Produkty spoza turbiny | matcher na cały katalog |

---

## 10. Decyzje (zaakceptowane)

| # | Decyzja | Status |
| --- | --- | --- |
| 1 | 2 narzędzia HTTP (T1 + T2) | ☑ zaimplementowane |
| 2 | Matcher deterministyczny, bez LLM | ☑ |
| 3 | Kod w `tasks/s03e04/` | ☑ |
| 4 | Hosting azyl (`ssh agent11784@azyl.ag3nts.org -p 5022`) | ☑ skonfigurowane; deploy użytkownika |
| 5 | MVP bez Promptfoo / boilerplate | ☑ |

---

## 11. Stan implementacji

| Obszar | Stan |
| --- | --- |
| Kod + testy (`bun test`, `tsc`) | **Gotowe** (13 testów) |
| README operacyjny | **Gotowe** |
| Deploy na azyl | **Do wykonania** przez użytkownika |
| `/verify` + flaga | **Do wykonania** po deploy |

**Nie stosowane w tym homeworku:** envelope Gmail `{ data, hint }`, `@ai-devs/agent-boilerplate`, lokalny agent ReAct.

---

## Changelog

| Data | Zmiana |
| --- | --- |
| 2026-06-02 | Research początkowy — analiza CSV, 2 narzędzia, matcher |
| 2026-06-02 | Decyzje zaakceptowane; hosting azyl |
| 2026-06-02 | Aktualizacja po implementacji: as-built, liczby CSV, testy E1–E6, status E2E |
