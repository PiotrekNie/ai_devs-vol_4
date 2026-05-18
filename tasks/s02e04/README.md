# @ai-devs/s02e04 — mailbox (zmail)

Agent **ReAct** dla zadania kursu **AI Devs 4**: przeszukanie skrzynki **zmail**, zebranie `date` / `password` / `confirmation_code` i weryfikacja na hubie (`task: mailbox`).

**Kontekst zadania (LLM w runtime):** [`src/prompts/mailbox_task.md`](./src/prompts/mailbox_task.md) (złączany z `system.md` w `instructions`).  
**Dokumentacja ludzka / API:** [`docs/context/s02e04.md`](./docs/context/s02e04.md)  
**Research / plan:** [docs/specs/s02e04-mailbox/](./docs/specs/s02e04-mailbox/)

---

## Wymagania

- [Bun](https://bun.sh/)  
- Klucz LLM: `OPENAI_API_KEY` lub `OPENROUTER_API_KEY` w `tasks/.env` (wspólny z `tasks/config.js`)  
- `HUB_API_KEY` — ten sam co do API zmail (`apikey` w body)

---

## Instalacja i start

Z katalogu zadania:

```bash
bun install
bun --env-file=../.env run run.ts
# lub
bun run start
```

---

## Zmienne środowiskowe (wybrane)

| Zmienna | Domyślnie | Opis |
|---------|-----------|------|
| `HUB_API_KEY` | — | **Wymagane** do zmail i `submit_to_hub` |
| `ZMAIL_API_URL` | `https://hub.ag3nts.org/api/zmail` | Endpoint skrzynki |
| `HUB_VERIFY_URL` | `https://hub.ag3nts.org/verify` | Weryfikacja odpowiedzi |
| `AGENT_MODEL` | `gpt-4o-mini` | Model rozumowania (np. tańszy flash wg materiałów kursu) |
| `AGENT_MAX_ITERATIONS` | `10` | Limit pętli ReAct |
| `MAILBOX_MEMORY_TRIM_TOKEN_EST` | `14000` | Szacunek tokenów (~znaki/4); powyżej — skrócenie historii (pierwsza wiadomość + ogon) |
| `MAILBOX_MEMORY_KEEP_TAIL_ITEMS` | `28` | Liczba ostatnich elementów konwersacji zachowanych przy skróceniu |

Pełniejsza tabela (logger, retry, vision) — jak w szablonie boilerplate w [tasks/boilerplate/README.md](../boilerplate/README.md).

---

## MCP narzędzia

| Narzędzie | Rola |
|-----------|------|
| `search_mail` | `action: search` na zmail |
| `download_mail_content` | `action: getMessages` — pełna treść |
| `http_request` | `help` / `getInbox` / `getThread`: `POST` z obowiązkowym `body` (np. `{"action":"help"}`); `apikey` na zmail dodawana z env — nie wpisuj w argumencie narzędzia |
| `submit_to_hub` | `task_name: mailbox` |
| `read_file`, `analyze_image_vision`, `finish_task` | jak w runtime |

---

## Jakość

```bash
bun test
bunx tsc --noEmit
```

---

## Eksporty biblioteki

Z poziomu innych modułów można importować z [`index.ts`](./index.ts) — konfigurację, `createAgent`, `createS02e04McpServer` (alias: `createBoilerplateMcpServer`), klienta MCP itd.
