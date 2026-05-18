# Zadanie operacyjne — mailbox

## Kontekst narracyjny (skrót)

Działasz na skrzynce mailowej operatora Systemu. Interesują Cię informacje z donosu Wiktora (kontakt z ruchem oporu / elektrownia / dział bezpieczeństwa). **Skrzynka jest aktywna** — w trakcie sesji mogą wpadać nowe wiadomości; jeśli czegoś brakuje, **powtórz** inbox / `search_mail` później.

## Deliverables (obowiązkowe — `submit_to_hub`)

Przekaż **`task_name`: `mailbox`** oraz `answer` jako obiekt:

| Klucz | Constraint | Semantyka |
|-------|------------|-----------|
| `date` | `YYYY-MM-DD` | Dzień planowanego przez dział bezpieczeństwa ataku na elektrownię |
| `password` | dokładny string z maila | Hasło do systemu pracowniczego nadal obecne w korespondencji |
| `confirmation_code` | **36 znaków**: `SEC-` + 32 znaki | Kod z ticketa działu bezpieczeństwa |

**Bez halucynacji:** wartości muszą pochodzić z **treści** wiadomości pobranych przez `download_mail_content`, nie z samych tematów ani nagłówków.

## Strategia (kolejność myślenia)

1. **`help`** (`http_request` → zmail) — potwierdź akcje i parametry API.
2. **Odkrycie:** `search_mail` z operatorami Gmail-like (`from:`, `subject:`, `OR`, `AND`, `"frazy"`). **Anchor:** Wiktor → `from:proton.me`; rozszerz zapytania gdy wynik pusty lub niekompletny.
3. **Treść:** dla każdego kandydata wywołaj `download_mail_content` z `rowID` lub `messageID` (z listy / wątku).
4. **Weryfikacja:** `submit_to_hub` — analizuj treść odpowiedzi hubu (braki / błędne pola). Poprawiaj kwerendy i czytaj kolejne maile.
5. **Sukces:** odpowiedź ze wzorcem `{FLG:...}` → krótkie podsumowanie i **`finish_task`**.

## Anty-wzorce

- Wyciąganie `password` / `confirmation_code` / daty **tylko** z listy wyników bez `getMessages`.
- Jednorazowe „nie ma w skrzynce” bez ponowienia (nowe maile).
- Wysyłanie niekompletnego `answer` bez dalszego szukania po jasnym komunikacie hubu.

## Operator początkowy (przykład)

`from:proton.me` — następnie łącz z innymi tokenami (`subject:`, słowa kluczowe SEC-, security, hasło, data ataku) w miarę potrzeb.
