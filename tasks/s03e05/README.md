# S03E05 — savethem

Hybrid ReAct agent for the **savethem** homework (S03E05): the LLM **discovers** hub APIs via `hub_query`; a deterministic **solver** computes the route via `plan_route`.

## Run

```bash
cd tasks/s03e05
bun install
bun run start          # full agent (needs tasks/.env + LLM key)
bun run probe          # probe hub APIs (no LLM)
bun test
bun run typecheck
```

## Environment (`tasks/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `HUB_API_KEY` | yes | Course hub key |
| `OPENROUTER_API_KEY` (or provider key) | yes for agent | LLM |
| `AGENT_MODEL` | no | Default `anthropic/claude-sonnet-4-6` |
| `AGENT_MAX_ITERATIONS` | no | Default `30` |

## Architecture

| Tool | Role |
| --- | --- |
| `hub_query` | POST `/api/{path}` with English `query` (toolsearch → maps / wehicles / books) |
| `plan_route` | BFS solver → `["vehicle", "up", ...]` |
| `submit_to_hub` | Verify `task_name: savethem` |
| `finish_task` | After `{FLG:...}` |

**Not exposed:** generic `http_request`, `read_file`, vision, `toolDiscovery`.

## Known optimal route (Skolwin map probe 2026-06-11)

Verified manually: `rocket` + moves with `dismount` before final water crossing → `{FLG:INTACTCITY}`.

Preview: https://hub.ag3nts.org/savethem_preview.html

## Docs

- [savethem.research.md](docs/specs/savethem/savethem.research.md)
- [savethem.plan.md](docs/specs/savethem/savethem.plan.md)
- [docs/context/savethem.md](docs/context/savethem.md)
