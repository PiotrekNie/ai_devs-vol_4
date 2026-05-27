# @ai-devs/s02e05 — drone (DRN-BMB7)

Agent **ReAct** dla zadania kursu **AI Devs 4** S02E05: vision na mapie, live dokumentacja HTML, sekwencja `instructions` i weryfikacja na hubie (`task: drone`).

**Konsument:** [`@ai-devs/agent-boilerplate`](../boilerplate/) przez `file:../boilerplate` (bez vendoringu runtime).

**Kontekst:** [`docs/context/s02e05.md`](./docs/context/s02e05.md)  
**Research / plan:** [`docs/specs/s02e05-drone/`](./docs/specs/s02e05-drone/)

---

## Lekcja vs homework

| Materiał | Gdzie |
| --- | --- |
| Observational Memory (`02_05_agent`) | W boilerplate — włączone w `run.ts` |
| Sandbox / code mode (`02_05_sandbox`) | Lekcja w `lessons/` — **poza** tym epizodem |
| Homework **`drone`** | Ten katalog — ReAct + vision + HTTP + hub |

---

## Wymagania

- [Bun](https://bun.sh/)
- Klucz LLM: `OPENAI_API_KEY` lub `OPENROUTER_API_KEY` w `tasks/.env`
- `HUB_API_KEY` — weryfikacja na hubie
- `DRONE_MAP_URL` — URL mapy PNG z platformy kursu

---

## Instalacja i start

Uruchamiaj **z katalogu epizodu** (`tasks/s02e05/`), żeby ścieżka `data/map.png` była poprawna.

```bash
cd tasks/s02e05
bun install
bun --env-file=../.env run run.ts
# lub
bun run start
```

Przed startem agenta bootstrap **prefetchuje** mapę z `DRONE_MAP_URL` do `data/map.png` (log `[SYSTEM] Map cached: …`).

---

## Zmienne środowiskowe (wybrane)

| Zmienna | Wymagana | Domyślnie | Opis |
| --- | --- | --- | --- |
| `HUB_API_KEY` | **Tak** | — | Hub verify + `submit_to_hub` |
| `DRONE_MAP_URL` | **Tak** | — | URL mapy PNG (prefetch przed agentem) |
| `DRONE_MAP_LOCAL_PATH` | Nie | `data/map.png` | Lokalna ścieżka zapisu mapy |
| `DRONE_DOCS_URL` | Nie | `https://hub.ag3nts.org/dane/drone.html` | Live docs (agent fetch) |
| `AGENT_MODEL` | Nie | `gpt-4o-mini` | Model ReAct |
| `AGENT_VISION_MODEL` | Nie | `gpt-4o-mini` | Vision tool |
| `AGENT_MAX_ITERATIONS` | Nie | `50` (w `config.ts` epizodu) | Limit pętli ReAct; boilerplate domyślnie 10 — epizod nadpisuje przez `maxIterations` |
| `AGENT_ENABLE_PLANNING` | Nie | włączone w kodzie | `false` wyłącza turę 0 |
| `OM_PERSIST_DIR` | Nie | — | Debug logów Observer/Reflector |

Pełna tabela boilerplate: [tasks/boilerplate/README.md](../boilerplate/README.md).

---

## Narzędzia MCP (boilerplate)

| Narzędzie | Rola w `drone` |
| --- | --- |
| `analyze_image_vision` | Odczyt **prefetched** mapy (`data/map.png`) |
| `http_request` | **Live** HTML docs (nie mapa PNG) |
| `submit_to_hub` | `task_name: drone`, `answer.instructions[]` — **nie** podawaj `apikey` (wstrzykiwane z env) |
| `ask_human` | Blokada / brak danych — pytanie na stdin |
| `read_file` | Cache w `data/` (np. pobrana mapa) |
| `finish_task` | Po `{FLG:...}` z huba |

Snapshot dokumentacji dla autorów: [`docs/context/drone-api.md`](./docs/context/drone-api.md) — agent **nie** powinien go czytać w normalnym flow.

Odświeżenie surowego HTML:

```bash
bun run sync-docs
```

---

## Jakość

```bash
bun test
bun run typecheck
```
