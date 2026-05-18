# Zadanie operacyjne — mailbox

## Kontekst narracyjny (skrót)

Działasz na skrzynce mailowej operatora Systemu. Interesują Cię informacje z donosu Wiktora (kontakt z ruchem oporu / elektrownia / dział bezpieczeństwa). **Skrzynka jest aktywna** — w trakcie sesji mogą wpadać nowe wiadomości; jeśli czegoś brakuje, **powtórz** `search_mail` później.

## Deliverables (obowiązkowe — `submit_to_hub`)

Przekaż **`task_name`: `mailbox`** oraz `answer` jako obiekt:

| Klucz | Constraint | Semantyka |
|-------|------------|-----------|
| `date` | `YYYY-MM-DD` | Dzień planowanego ataku działu bezpieczeństwa na elektrownię |
| `password` | dokładny string z maila | Hasło do systemu pracowniczego z **treści** wiadomości |
| `confirmation_code` | **36 znaków**: `SEC-` + 32 znaki (hex) | Kod z **treści** ticketa — nie numer w temacie |

**Bez halucynacji:** wartości wyłącznie z pola **`message`** po `download_mail_content`, nie z `subject` / `snippet` / `rowID`.

## Składanie odpowiedzi (merge — krytyczne)

Trzy pola pochodzą z **trzech różnych wiadomości** (zwykle trzy osobne `search` + `download`):

1. **`password`** — mail resetu hasła (`subject:hasło` / security@… „Nowe hasło…”).
2. **`date`** — mail działu bezpieczeństwa opisujący **dzień bombardowania / ataku** w polu `message` (np. „poniedziałek tj. 2026-03-23”), nie data w nagłówku maila korekty.
3. **`confirmation_code`** — **najnowszy** mail w wątku ticketu SEC z **pełnym** kodem 36 znaków; jeśli jeden mail ma kod bez ostatniej litery, a kolejny pisze „Poprawny to: SEC-…”, użyj **korekty**.

**Nie** bierz wszystkich trzech pól z jednego maila SEC.

## Ograniczenia domenowe

- **Pobieranie treści:** po każdym trafnym `search_mail` wywołaj `download_mail_content({ ids: "<messageID>" })` — **messageID** (32 znaki hex) z tego samego elementu `items[]`.
- **URL zmail:** `https://hub.ag3nts.org/api/zmail` tylko przy `http_request`; na co dzień `search_mail` + `download_mail_content`.
- **Hub:** po `-960` zmień tylko pole, które jest błędne (np. sama `date`), **zachowaj** poprawne `password` i pełny `confirmation_code`. Po błędzie walidacji długości kodu — pobierz / użyj kod z maila korekty, nie skracaj.
- **`finish_task`:** tylko po `{FLG:...}` z hubu.

## Anty-wzorce

- Submit z datą z nagłówka maila korekty zamiast daty ataku z planu.
- Submit z kodem 35-znakowym z maila planu ataku, gdy w wątku jest mail z kodem 36-znakowym.
- `finish_task` po dwóch odrzuceniach hubu bez trzeciego `submit_to_hub`.
- Długi tekst zamiast kolejnego narzędzia.

## Operator początkowy (przykład)

`from:proton.me` → download → `subject:hasło` → download → `SEC-` / security → download **wszystkich** trafnych hitów w wątku (najpierw najnowszy SEC) → złóż `answer` → `submit_to_hub`.
