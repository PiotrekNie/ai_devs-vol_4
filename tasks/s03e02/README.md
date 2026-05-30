# @ai-devs/s03e02 — firmware (shell VM)

Agent **ReAct** dla zadania kursu **AI Devs 4** (S03E02): uruchomienie sterownika chłodzenia ECCS na zdalnej maszynie wirtualnej i wysłanie kodu potwierdzenia na hub (`task: firmware`).

**Kontekst zadania (LLM):** [`src/prompts/firmware_task.md`](./src/prompts/firmware_task.md) + [`src/prompts/system.md`](./src/prompts/system.md)  
**Research / plan:** [docs/specs/s03e02-firmware/](./docs/specs/s03e02-firmware/)

---

## Wymagania

- [Bun](https://bun.sh/)
- Klucz LLM: `OPENAI_API_KEY` lub `OPENROUTER_API_KEY` w `tasks/.env`
- `HUB_API_KEY` — shell API i weryfikacja na hubie
- Opcjonalnie Langfuse: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` (tracing w `run.ts`)
- Model reasoning zalecany przez kurs: `anthropic/claude-sonnet-4-6` (domyślnie przez `AGENT_MODEL`)

---

## Instalacja i start

Z katalogu zadania:

```bash
bun install
bun run start
```

Typowy czas solve: **~10–20 min** (wiele sekwencyjnych poleceń shell + reasoning).

---

## Architektura

```text
Turn 0: plan eksploracji VM
  → shell_exec (help → explore → cooler.bin → settings.ini)
    → submit_to_hub({ confirmation: "ECCS-..." })
      → finish_task → {FLG:...}
```

| Narzędzie | Rola |
| --- | --- |
| `shell_exec` | Jedno polecenie na wywołanie — POST `https://hub.ag3nts.org/api/shell` |
| `submit_to_hub` | `task_name: firmware`, `answer.confirmation` |
| `finish_task` | Po fladze z huba |

Epizod **nie** eksponuje `read_file`, `http_request` ani vision — tylko powyższe narzędzia + pamięć po ban/błędzie hub.

---

## Zmienne środowiskowe (wybrane)

| Zmienna | Domyślnie | Opis |
| --- | --- | --- |
| `HUB_API_KEY` | — | **Wymagane** — shell API + submit |
| `SHELL_API_URL` | `https://hub.ag3nts.org/api/shell` | Endpoint VM |
| `AGENT_MODEL` | `anthropic/claude-sonnet-4-6` | Model ReAct |
| `AGENT_MAX_ITERATIONS` | `30` | Limit pętli ReAct |
| `AGENT_ENABLE_PLANNING` | — | Turn 0 plan (domyślnie włączone w `run.ts`) |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` | — | Opcjonalnie — tracing |
| `TRACING_SERVICE_NAME` | `@ai-devs/s03e02` | Nazwa serwisu OTel |

Pełniejsza tabela env — [tasks/boilerplate/README.md](../boilerplate/README.md).

---

## Jakość

```bash
bun test
bunx tsc --noEmit
```

---

## Eksporty

[`index.ts`](./index.ts) — re-export `config.ts`.
