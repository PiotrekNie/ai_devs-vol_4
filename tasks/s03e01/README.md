# @ai-devs/s03e01 — evaluation (anomalie sensorów)

Agent **ReAct** dla zadania kursu **AI Devs 4**: wykrycie anomalii w ~10k odczytach JSON sensorów i wysłanie listy ID na hub (`task: evaluation`).

**Kontekst zadania (LLM):** [`src/prompts/evaluation_task.md`](./src/prompts/evaluation_task.md) + [`src/prompts/system.md`](./src/prompts/system.md)  
**Research / plan:** [docs/specs/s03e01-evaluation/](./docs/specs/s03e01-evaluation/)

---

## Wymagania

- [Bun](https://bun.sh/)
- Klucz LLM: `OPENAI_API_KEY` lub `OPENROUTER_API_KEY` w `tasks/.env`
- `HUB_API_KEY` — weryfikacja na hubie
- Opcjonalnie Langfuse: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` (tracing w `run.ts`)
- Dane: katalog `sensors/` (~9999 plików JSON z zip kursu)

---

## Instalacja i start

Z katalogu zadania:

```bash
bun install

# Agent ReAct + planning turn 0 + Langfuse (~10–15 min z classify)
bun run start

# Bezpośredni pipeline (bez agenta, ~4–5 min classify) — szybszy solve
bun run pipeline

# Pipeline bez submitu na hub (tylko obliczenie recheck[])
SUBMIT=0 bun run pipeline
```

---

## Architektura

```text
scan_sensors (TS, 0 tokenów ReAct)
  → classify_operator_notes (batch LLM, cache)
    → build_recheck
      → submit_to_hub → {FLG:...}
```

| Tryb | Plik | Kiedy |
| --- | --- | --- |
| **Agent** | `run.ts` | Pełny flow kursowy: plan, ReAct, tracing, memory przy błędzie hub |
| **Pipeline** | `scripts/run-pipeline.ts` | Szybka weryfikacja / regresja logiki domenowej |

---

## Zmienne środowiskowe (wybrane)

| Zmienna | Domyślnie | Opis |
| --- | --- | --- |
| `HUB_API_KEY` | — | **Wymagane** do `submit_to_hub` / pipeline submit |
| `HUB_VERIFY_URL` | `https://hub.ag3nts.org/verify` | Endpoint weryfikacji |
| `S03E01_SENSORS_DIR` | `sensors` | Katalog z plikami JSON |
| `S03E01_NOTE_MODEL` | `gpt-4o-mini` | Model klasyfikacji `operator_notes` |
| `AGENT_MODEL` | `gpt-4o-mini` | Model ReAct (boilerplate) |
| `AGENT_MAX_ITERATIONS` | `10` | Limit pętli ReAct |
| `AGENT_ENABLE_PLANNING` | — | `true` — turn 0 plan (domyślnie włączone w `run.ts`) |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` | — | Opcjonalnie — tracing w Langfuse |
| `TRACING_SERVICE_NAME` | `@ai-devs/s03e01` | Nazwa serwisu OTel |

Pełniejsza tabela env — [tasks/boilerplate/README.md](../boilerplate/README.md).

---

## MCP narzędzia (epizod)

| Narzędzie | Rola |
| --- | --- |
| `scan_sensors` | Deterministyczny skan 10k plików; anomalie pomiarowe |
| `classify_operator_notes` | Batch LLM unikalnych notatek (cache) |
| `build_recheck` | Merge → tablica ID do hub |
| `submit_to_hub` | `task_name: evaluation`, `answer.recheck[]` |
| `read_file`, `http_request`, `analyze_image_vision`, `finish_task` | Boilerplate |

---

## Jakość

```bash
bun test
bunx tsc --noEmit
```

---

## Eksporty

[`index.ts`](./index.ts) — re-export `config.ts`.
