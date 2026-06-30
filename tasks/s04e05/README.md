# S04E05 — foodwarehouse (agent + hub tools)

ReAct agent that solves the **foodwarehouse** homework via `createAgent` and thin MCP proxies (`fw_*`). No deterministic warehouse solver in this episode — the LLM explores API/SQLite and creates orders at runtime.

## Quick start

```bash
cd tasks/s04e05
bun install
bun --env-file=../.env run run.ts
```

## Environment (`tasks/.env`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | yes | — | LLM |
| `HUB_API_KEY` | yes | — | Hub verify |
| `AGENT_MODEL` | no | `gpt-4o` | Model override |
| `AGENT_MAX_ITERATIONS` | no | `45` | ReAct cap (override in `tasks/.env` if set) |
| `AGENT_MAX_OUTPUT_TOKENS` | no | `4096` | LLM output cap |
| `AGENT_MAX_TOOL_OUTPUT_CHARS` | no | `12000` | Tool echo cap |

## Agent tools

| Tool | Role |
| --- | --- |
| `read_file` | Local `data/food4cities.json` (handler from boilerplate) |
| `fw_help` | Hub API manual |
| `fw_database` | Read-only SQLite queries |
| `fw_signature` | Generate order signature hash |
| `fw_orders` | get / create / append / delete orders |
| `fw_done` | Final validation → `{FLG:...}` |
| `fw_reset` | Reset order state |
| `finish_task` | Native — after flag |

## Dev

```bash
bun run probe    # print hub help JSON
bun test
bun run typecheck
```

## Architecture

- **Pattern:** same as `tasks/s04e04` (filesystem) — one `createS04e05McpServer()` with `read_file` import + episode `fw_*`.
- **Not used:** `createBoilerplateMcpServer()` (avoids `http_request` / `submit_to_hub` noise).
- **Specs:** [docs/specs/foodwarehouse/](docs/specs/foodwarehouse/)

## Troubleshooting

- If the agent runs out of turns, raise `AGENT_MAX_ITERATIONS` in `.env`.
- For repeated `fw_done` failures, try `AGENT_MODEL=anthropic/claude-sonnet-4-6`.
- Several runs may differ slightly (non-deterministic LLM) — that is expected.
