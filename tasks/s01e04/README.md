# s01e04 — zadanie **sendit**

Wymaga w katalogu `tasks/.env` (ładowany przez `tasks/config.js` przy imporcie):

- `HUB_API_KEY` — pobieranie dokumentacji z Huba i `POST /verify` (`task: sendit`)
- `OPENROUTER_API_KEY` — Responses API (`gpt-4o-mini`) oraz OCR wizyjny (Gemini przez OpenRouter)

Instalacja:

```bash
bun install
```

Uruchomienie:

```bash
bun run index.ts
```

Testy jednostkowe (`unit_normalization`, `count_fee`):

```bash
bun test
```
