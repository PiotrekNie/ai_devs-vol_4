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

## Ograniczenia domenowe (wejście do planu w turze 0)

- Zmail: najpierw poznaj API (`help` przez `http_request` z JSON `action` w `body`; `apikey` dokleja MCP — nie podawaj w argumencie).
- Dwuetapowość: metadane (`search_mail` / inbox) → pełna treść (`download_mail_content` / `getMessages`) przed wnioskami o `password`, dacie, `SEC-`.
- Anchor wyszukiwania: Wiktor / `from:proton.me`; rozszerzaj zapytania Gmail-like gdy wynik pusty.
- Hub: `submit_to_hub` z `task_name: mailbox` — iteruj po feedbacku; sukces to `{FLG:...}`.
- **POST** na zmail zawsze wymaga obiektu JSON w `body`.

## Anty-wzorce

- Wyciąganie `password` / `confirmation_code` / daty **tylko** z listy wyników bez `getMessages`.
- Jednorazowe „nie ma w skrzynce” bez ponowienia (nowe maile).
- Wysyłanie niekompletnego `answer` bez dalszego szukania po jasnym komunikacie hubu.

## Operator początkowy (przykład)

`from:proton.me` — następnie łącz z innymi tokenami (`subject:`, słowa kluczowe SEC-, security, hasło, data ataku) w miarę potrzeb.
