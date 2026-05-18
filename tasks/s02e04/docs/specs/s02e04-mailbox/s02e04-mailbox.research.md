# Research — S02E04: agent dla zadania `mailbox` (zmail + weryfikacja)

**Data:** 2026-05-15  
**Źródła:** `markdowns/s02e04-organizowanie-kontekstu-dla-wielu-watkow-1773922583.md`, `tasks/s02e04/docs/context/s02e04.md`, `tasks/s02e04/` (osobny pakiet npm — decyzja §9).

---

## 1. Cel i zakres

Zaprojektować i zaimplementować agenta ReAct, który:

1. Komunikuje się z **API zmail** (`POST https://hub.ag3nts.org/api/zmail`), w tym na starcie wywołuje **`help`**.
2. **Wyszukuje** maile (składnia zbliżona do Gmail: `from:`, `to:`, `subject:`, `OR`, `AND`, frazy w cudzysłowie, wykluczenia).
3. **Pobiera pełną treść** wybranych wiadomości po identyfikatorach (rowID / messageID), bez zgadywania treści z samych metadanych.
4. **Ekstrahuje trzy pola** odpowiedzi i weryfikuje je na hubie **iteracyjnie**, korzystając z **feedbacku** (co jest puste / błędne), aż do flagi `{FLG:...}` lub limitu iteracji.
5. Uwzględnia **aktywną skrzynkę** — ponawia przegląd / wyszukiwanie, gdy brakuje informacji (nowe maile mogą wpływać w trakcie pracy).

**Nazwa zadania w hubie:** `mailbox` (pole `task` w `/verify`).

---

## 2. Wymagane artefakty wyjściowe

| Pole | Znaczenie | Format / reguły |
|------|-----------|-------------------|
| `date` | Dzień planowanego ataku działu bezpieczeństwa na elektrownię | `YYYY-MM-DD` |
| `password` | Hasło do systemu pracowniczego, prawdopodobnie nadal obecne na skrzynce | string (dokładna wartość z treści maili) |
| `confirmation_code` | Kod z ticketa działu bezpieczeństwa | dokładnie **36 znaków**: prefiks `SEC-` + 32 znaki |

**Wskazówka narracyjna:** Wiktor pisał z domeny **`proton.me`** — sensowny punkt startu dla zapytań `from:`.

---

## 3. API zmail — model mentalny (dwuetapowość)

Zgodnie z kontekstem zadania:

- **Krok A — lista / metadane:** `getInbox`, `search` (paginacja `page`, `perPage` 5–20), ewentualnie `getThread` (identyfikatory wątku bez treści).
- **Krok B — treść:** `getMessages` z `ids` = rowID, 32-znakowy messageID lub tablica.

**Zasada:** żadnych wniosków o `password` / `confirmation_code` / dokładną datę z samego subject/from bez **pobrania treści** przez `getMessages`.

Dostępne akcje i parametry należy potwierdzić w runtime przez **`action: "help"`** (documentation może się rozminąć z faktycznym API).

---

## 4. Weryfikacja na hubie

- Endpoint: **`POST`** do `/verify` (w projekcie: `HUB_VERIFY_URL`, domyślnie `https://hub.ag3nts.org/verify`).
- Body przykładowo:

```json
{
  "apikey": "<HUB_API_KEY>",
  "task": "mailbox",
  "answer": {
    "password": "...",
    "date": "YYYY-MM-DD",
    "confirmation_code": "SEC-..."
  }
}
```

- Odpowiedź hubu powinna być traktowana jako **sygnał kontrolny**: które pola uzupełnić lub poprawić. Agent nie powinien zakładać sukcesu po jednej próbie, jeśli hub zwraca częściowy błąd.

W boilerplate narzędzie **`submit_to_hub`** przyjmuje `task_name` i `answer`; dla tego zadania `task_name` = `mailbox`.

---

## 5. Lekcja S02E04 a to zadanie — mapowanie koncepcji

Materiał z markdowna opisuje **architektury wieloagentowe** (pipeline, blackboard, orchestrator, drzewo oraz event-driven), narzędzia **`delegate` / `message`**, konflikty w **globalnym kontekście** i rolę **agenta zarządzającego**.

**Wniosek praktyczny dla `mailbox`:** pełna implementacja wielu agentów z delegate/message **nie jest wymagana** przez treść zadania domowego — wymagana jest **iteracyjna pętla** „szukaj → czytaj → aktualizuj stan → ewentualnie verify → szukaj dalej”. Idee z lekcji przenoszą się tu jako:

- **Stan roboczy (blackboard-light):** jawna struktura „co już wiemy” (`date` \| `password` \| `confirmation_code` + krótkie uzasadnienie / źródło), przekazywana w promptach użytkownika lub utrzymywana w pamięci hooków — żeby uniknąć utraty faktów przy długiej rozmowie.
- **Orchestrator = jeden LLM:** jedna rola koordynuje narzędzia; ewentualny „pod-agent” to tylko konwencja promptu, nie osobny proces.
- **Obsługa konkurencji / aktywnej skrzynki:** podobnie jak przy konfliktach zapisu — nie zakładać zamkniętego świata; **re-run** inbox/search po nieudanym odczycie lub po feedbacku huba.

---

## 6. Stan repozytorium `tasks/s02e04` (snapshot researchu)

- Kod wywodzi się z **wzorca agent-boilerplate** (`http_request`, `submit_to_hub`, `read_file`, `analyze_image_vision`, `finish_task`).
- **`src/prompts/system.md`** — do uzupełnienia treścią domenową `mailbox` / zmail.
- **Narzędzia zmail:** wybrano **ścieżkę A** — cienkie narzędzia MCP **`search_mail`** / **`download_mail_content`** (opakowanie API, walidacja Zod, `HUB_API_KEY` w body).

**Pakiet npm (decyzja §9):** `tasks/s02e04` ma być **osobnym pakietem** (własny `name`, np. `@ai-devs/s02e04` lub `ai-devs-s02e04-mailbox`, `description`, **entrypoint uruchomieniowy** — typowo `bun run index.ts` / `src/main.ts` przez pole `"main"`/`"scripts.start"`). Nie wymuszamy już wyłącznie wzorca `file:../boilerplate` z „Project stack”; epizod jest samodzielnym artefaktem do `bun install` + `bun run` z katalogu zadania (evolucja: późniejsze wyciągnięcie runtime do współdzielonego pakietu możliwe, ale poza scope tej decyzji).

---

## 7. Ryzyka i edge case’y

| Ryzyko | Mitygacja |
|--------|-----------|
| Nowe maile podczas runu | Po „braku wyniku” — ponowny `getInbox` / `search`; nie kończyć od razu `finish_task`. |
| Zbyt szerokie / wąskie zapytania | Zacząć od `from:proton.me` (lub równoważnego); rozszerzać zapytania; unikać przedwczesnego filtrowania. |
| Halucynacja treści bez `getMessages` | Prompt + code review: „never infer body from subject line”. |
| Limit iteracji / koszt LLM | Materiał sugeruje tańszy model (`google/gemini-3-flash-preview`); ustawić sensowne `AGENT_MAX_ITERATIONS` i monitorować liczbę tur. |
| Truncation wyników narzędzi | Duże odpowiedzi zmail — `AGENT_MAX_TOOL_OUTPUT_CHARS`; ewentualnie paginacja `getInbox`/`search`. |
| Hub zwraca błędy pól | Parser odpowiedzi verify → następna iteracja z celowanym wyszukiwaniem. |

---

## 8. Rekomendacje dla następnego kroku (plan implementacji)

1. **Entrypoint** (`run` / `index.ts` epizodu): wczytanie `system.md`, budowa MCP, `createAgent`, query z pełnym opisem zadania + reminder o formacie odpowiedzi.
2. **Prompt systemowy:** adres URL zmail, kolejność `help` → akcje, dwuetapowość, Gmail-like query, aktywna skrzynka, format JSON dla `submit_to_hub`, polityka verify-and-iterate.
3. **Narzędzia:** `search_mail` + `download_mail_content` (MCP zmail) + `submit_to_hub` + `finish_task`; `http_request` pomocniczo (np. `help` / `getInbox`) lub jako jeden dodatkowy cienki wrapper — do ustalenia w planie.
4. **Inject `HUB_API_KEY`:** do body zmail zgodnie z API (jak w `help`); nie logować klucza.
5. **Testy:** mock HTTP dla zmail i verify (jak w innych epizodach), test ekstrakcji / walidacji formatu `SEC-`.
6. **Opcjonalnie `MemoryHooks`:** skrócone „journal” znalezionych faktów w `beforeTurn`, jeśli kontekst rośnie.

---

## 9. Decyzje zamykające (EM)

### 9.1. Osobny pakiet npm dla `tasks/s02e04`

**Decyzja:** tak — **`tasks/s02e04` jest samodzielnym pakietem npm** (nie jako wyłączny konsument `file:../boilerplate` przygotowanym według obecnego opisu w „Project stack”).

**Implikacje implementacyjne:**

- Jawnie ustawić w `package.json`: `name` (np. `@ai-devs/s02e04`), `version`, `private: true`, `description`, `type: "module"`, zależności (`zod`, `@modelcontextprotocol/sdk`, itd. wg faktycznego kodu).
- **`scripts`:** np. `"start": "bun --env-file=../.env run index.ts"`, `"test": "bun test"`, `"typecheck": "bunx tsc --noEmit"` — zgodnie z `eversis-project-stack.mdc` dla epizodów (ścieżka do `.env` może być `../.env` względem `tasks/`).
- **Entrypoint uruchomieniowy:** osobny plik startowy (np. `index.ts` w root pakietu) ładujący prompt, MCP i `createAgent`, odróżniony od ewentualnego `index.ts` będącego tylko re-eksportem biblioteki (jeśli oba są potrzebne — rozdzielić nazewnictwem, np. `run.ts` vs `package-exports`).
- Runtime może pozostać **z vendorem / kopią** kodu boilerplate wewnątrz `tasks/s02e04` albo zostać później skonsolidowany z `tasks/boilerplate` — decyzja ta nie blokuje **osobnej tożsamości pakietu** epizodu.

---

### 9.2. Jeden agent vs rozdzielenie „szukający” / „weryfikujący”

**Ocena — bardziej optymalne dla zadania `mailbox`: jedna pętla ReAct (jeden agent, jeden zestaw narzędzi, jeden kontekst dialogu).**

| Kryterium | Jeden agent (ReAct) | Dwa agenty (szukający + weryfikujący) |
|-----------|---------------------|---------------------------------------|
| **Złożoność** | Niższa: brak orchestracji `delegate` / przekazywania stanu między sesjami. | Wyższa: dwa wywołania LLM, synchronizacja „co zweryfikowano”, ryzyko rozjazdu kontekstu. |
| **Feedback z `/verify`** | Naturalny: wynik `submit_to_hub` trafia do tego samego łańcucha — model od razu planuje kolejne `search` / `getMessages`. | Wymaga jawnego protokołu (np. blackboard, druga instancja) — dla trzech pól i jednej skrzynki to nadmiarowe. |
| **Koszt i czas** | Mniej rund koordynacyjnych, jeden billing „wątku”. | Zazwyczaj więcej tokenów i opóźnień (druga rola musi dostać skondensowany stan). |
| **Zgodność z treścią zadania** | Zadanie wprost proponuje pętlę: szukaj → czytaj → wyciągnij wnioski → hub → kontynuuj. | Materiał lekcji (wieloagentowość) ilustruje **wzorce**, nie nakazuje dwóch procesów dla tej konkretnej pracy domowej. |
| **Kiedy rozdział miałby sens** | — | Osobny model polityk bezpieczeństwa, izolacja zaufania, lub bardzo duże rozłączenie kosztów (tańszy „worker” + drogi „audytor”) — tu **nie uzasadnione**. |

**Uzupełnienie:** jeśli chce się odtworzyć *klimat* lekcji (role), można to zrobić **w jednym agencie**: sekcje promptu („najpierw działasz jak analityk skrzynki…”, „przy `submit_to_hub` traktuj odpowiedź huba jak kontrolę jakości…”) — bez drugiego runtime’u LLM.

**Wniosek:** **nie** wymagać jawnego rozdzielenia na dwóch agentów; **optymalizacja = jedna pętla + mocny prompt + ewentualnie `MemoryHooks` na skondensowany stan faktów**.

---

## 10. Podsumowanie wniosków

- Zadanie operacyjne to **jednoagentowa** pętla ReAct z narzędziami zmail + hubem, z naciskiem na **wyszukiwanie + pełne treści + iteracyjny feedback**.
- Lekcja o **wielu wątkach kontekstu** jest **motywacją projektową** (stan roboczy, ponowne odpytywanie, aktywna skrzynka), nie wymogiem wielu procesów LLM.
- **Pakiet:** `tasks/s02e04` jako **osobny npm package** z czytelnym entrypointem uruchomieniowym.
- **Kolejne braki w kodzie:** domenowy **system prompt**, ewentualnie dopracowanie **MCP zmail** (`search_mail` / `download_mail_content`) oraz realny **plik startowy** zgodny z §9.1.
