# Research — `http_request`: pusty POST do zmail (boilerplate)

**Data:** 2026-05-18  
**Zakres:** `@ai-devs/agent-boilerplate` (`tasks/boilerplate/`)  
**Powiązanie:** incydent w `tasks/s02e04` (agent wywołał `http_request` bez `body` → hub `-103` „Missing request body”); logika zmail (w tym **`ZMAIL_API_URL`**) należy **wyłącznie do epizodu** `tasks/s02e04`, nie do boilerplate.

**Status:** Research — **czeka na akceptację człowieka** przed planem i implementacją.

---

## 1. Problem (objaw)

Podczas uruchomienia agenta (mailbox / zmail) model wywołał narzędzie MCP w przybliżeniu tak:

```json
{ "url": "https://hub.ag3nts.org/api/zmail", "method": "POST" }
```

Efekt w logu:

- `body: undefined`, nagłówek `Content-Type: application/json`
- Odpowiedź hubu: `ok: false`, `status: 400`, `code: -103`, komunikat *„Missing request body. Send raw JSON.”*

**Skutek biznesowy:** agent traci turę na błędzie technicznym zamiast od razu wywołać `help` / dalsze akcje zmail; rośnie liczba iteracji i ryzyko „zgadywania” API.

---

## 2. Kontekst architektury

| Warstwa | Odpowiedzialność |
|--------|-------------------|
| **LLM + prompty epizodu** (np. s02e04) | Kolejność myślenia (`help` → search → treść); kształt JSON akcji; **`ZMAIL_API_URL`** |
| **`http_request` (boilerplate)** | **Generyczne** GET/POST z retry — bez stałych / logiki specyficznej dla zmail |
| **Narzędzia domenowe s02e04** (`search_mail`, `download_mail_content`, `postZmail`, fork `http_request`) | Zmail: pełne body, `apikey`, `ZMAIL_API_URL` z `tasks/s02e04/config.ts` |

**Decyzja produktowa (EM):** `ZMAIL_API_URL` występuje **jedynie** w `tasks/s02e04` (`config.ts`, `zmail_client.ts`, fork `http_request.ts`). Boilerplate **nie** wprowadza tej stałej ani `isZmailEndpoint` / merge `apikey` dla `/api/zmail`.

Epizody mogą zależeć od `file:../boilerplate` (np. `s02e03`) albo utrzymywać własny fork MCP (s02e04). Poprawka w boilerplate = **wspólna walidacja POST**; poprawka zmail = **scope s02e04**.

**Stan repo (snapshot 2026-05-18):**

| Lokalizacja | `http_request` | `ZMAIL_API_URL` |
|-------------|----------------|-----------------|
| `tasks/boilerplate` | stara wersja (`body` opcjonalne przy POST) | **brak** (zgodnie z decyzją) |
| `tasks/s02e04` | nowsza wersja (walidacja POST + merge `apikey` dla URL z `ZMAIL_API_URL`) | **tak** — `tasks/s02e04/config.ts` |

---

## 3. Przyczyny (root cause)

### 3.1 Kontrakt narzędzia — boilerplate (główna, wspólna)

- Schemat Zod: `body` jest **optional** przy `method: POST`.
- Implementacja wysyła `init.body` tylko gdy `body !== undefined`, ale **zawsze** ustawia `Content-Type: application/json`.
- Model może legalnie wywołać POST bez ciała → dowolne API JSON (w tym zmail) odrzuca żądanie.

**Mitigacja w boilerplate:** wymusić `body` przy każdym `POST` (bez znajomości zmail).

### 3.2 Logika zmail — wyłącznie s02e04 (nie boilerplate)

- `postZmail` / `search_mail` doklejają `apikey` i używają `ZMAIL_API_URL`.
- Fork `http_request` w s02e04 może dodatkowo merge’ować `apikey` dla URL zgodnego z `ZMAIL_API_URL`.
- Incydent `-103` wystąpił przy **pustym** POST — walidacja `body` w s02e04 (lub boilerplate po aktualizacji paczki) to pierwsza linia obrony; merge `apikey` to druga (tylko w epizodzie).

### 3.3 Prompty i opisy

- Szablon `tasks/boilerplate/src/prompts/system.md` — brak ogólnej reguły „POST wymaga JSON `body`”.
- Prompty s02e04 — powinny opisywać `help` / `action` (już częściowo w `mailbox_task.md` / `system.md` epizodu).
- Opis MCP w boilerplate — nie wspomina obowiązkowego `body` przy POST.

### 3.4 Zachowanie agenta (wtórne)

- Prompty nie zastępują walidacji w narzędziu.

---

## 4. Wymagania — podział zakresu

### 4.1 Boilerplate (`tasks/boilerplate`) — **[MODIFY] w planie**

1. **POST bez `body`** — odrzucone **przed** HTTP (błąd narzędzia, nie hub -103).
2. **POST z `body`** — serializacja JSON jak dziś; **bez** automatycznego `apikey`, **bez** `ZMAIL_API_URL` w `config.ts`.
3. **GET** — bez zmiany semantyki.
4. Opis narzędzia MCP + szablon `system.md`: POST zawsze wymaga obiektu JSON w `body` (bez dokumentacji zmail w boilerplate).
5. Testy jednostkowe: POST bez `body` → błąd; POST z `body` na dowolny URL → wysłany JSON bez doklejania `apikey`.

### 4.2 Epizod s02e04 — **poza planem boilerplate** (już częściowo zrobione / utrzymać w fork)

1. `ZMAIL_API_URL` w `tasks/s02e04/config.ts` — **bez zmiany miejsca**.
2. `postZmail`, `search_mail`, `download_mail_content` — źródło prawdy dla zmail.
3. Fork `http_request` w s02e04: walidacja POST + `isZmailEndpoint` względem **`ZMAIL_API_URL` epizodu** + merge `HUB_API_KEY`.
4. Prompty epizodu: `{"action":"help"}`, brak `apikey` w argumentach narzędzia (dokleja serwer epizodu).

### 4.3 Poza zakresem boilerplate

- `ZMAIL_API_URL`, `postZmail`, `zmail_*` w pakiecie `@ai-devs/agent-boilerplate`.
- Deduplikacja fork s02e04 ↔ boilerplate (osobna decyzja / task).

---

## 5. Opcje rozwiązania

### 5.1 Boilerplate

| Opcja | Opis | Zalety | Wady |
|-------|------|--------|------|
| **B1. Tylko walidacja POST** | `superRefine`: POST ⇒ wymagane `body`; opis MCP + system.md | Mały scope; brak coupling do zmail; chroni wszystkich konsumentów paczki | Nie dokleja `apikey` — zmail nadal wymaga epizodu lub pełnego body z kluczem w URL arg |
| **B2. Prompty tylko** | Bez zmian TS | — | Nie blokuje -103 |
| ~~B3. Zmail w boilerplate~~ | `ZMAIL_API_URL` + merge w paczce | — | **Odrzucone** — zmail tylko w s02e04 |

**Rekomendacja (boilerplate):** **B1**.

### 5.2 s02e04 (referencja, nie ten research)

| Opcja | Opis |
|-------|------|
| **E1** | Utrzymać fork `http_request` + `postZmail` + prompty (obecny kierunek) |
| **E2** | Po B1 w boilerplate — uprościć fork s02e04 (zostawić tylko merge `apikey` / `isZmailEndpoint`) |

---

## 6. Konsumenci boilerplate

| Pakiet | Zależność | Efekt B1 |
|--------|-----------|----------|
| `tasks/s02e03` | `file:../boilerplate` | POST bez `body` zablokowany lokalnie w narzędziu |
| `tasks/s02e04` | Własny MCP; nie polega na boilerplate `http_request` dla zmail | Bez zmian w paczce boilerplate dla zmail; ewentualnie mniej duplikacji walidacji POST w przyszłości |
| Przyszłe epizody | Kopiują boilerplate | Standard: POST ⇒ `body` |

---

## 7. Kryteria akceptacji

### Boilerplate (ten research → plan → implementacja)

- [ ] `POST` bez `body` → `mcpErr` / walidacja Zod, **bez** wywołania HTTP.
- [ ] `POST` z `body` na dowolny URL → JSON jak podany, **bez** auto-`apikey`.
- [ ] W `tasks/boilerplate/config.ts` **nie** dodano `ZMAIL_API_URL`.
- [ ] `bun test` + `bunx tsc --noEmit` w `tasks/boilerplate` OK.
- [ ] README / CHANGELOG / `boilerplate-documentation.md` / `system.md` — POST wymaga `body` (bez sekcji zmail API).

### s02e04 (osobny plan epizodu, jeśli potrzebny)

- [ ] `ZMAIL_API_URL` pozostaje tylko w `tasks/s02e04`.
- [ ] Zmail: `postZmail` / fork `http_request` + prompty — `help` z `action`, merge `apikey`.

---

## 8. Otwarte pytania

1. Czy po **B1** w boilerplate s02e04 ma **usunąć** zduplikowaną walidację POST z forka i zostawić tylko logikę `ZMAIL_API_URL` + merge? (opcjonalna faza 2)
2. Czy debug `console.log` w s02e04 `isZmailEndpoint` zostaje — osobny ticket?
3. ~~Czy boilerplate ma znać zmail?~~ — **rozstrzygnięte: nie.**

---

## 9. Następny krok (po akceptacji researchu)

1. **`http-request-post-body.plan.md`** w `tasks/boilerplate/docs/specs/http-request-post-body/` — wyłącznie zadania **[MODIFY]** dla boilerplate (B1); **bez** `config.ts` / `ZMAIL_API_URL`.
2. Implementacja boilerplate po akceptacji planu.
3. Weryfikacja s02e04: upewnić się, że fork + prompty nadal spełniają §4.2 (osobna turka lub plan epizodu).

---

## 10. Źródła

- Log terminala: POST zmail, `body: undefined`, `-103`.
- `tasks/boilerplate/src/tools/mcp/http_request.ts`, `config.ts` (brak zmail).
- `tasks/s02e04/config.ts` (`ZMAIL_API_URL`), `zmail_client.ts`, `http_request.ts` (fork).
- Ustalenie EM: **`ZMAIL_API_URL` tylko w s02e04**.
