# S04E04 — filesystem (agent-first)

Homework **filesystem** from lesson S04E04: an **AI agent** reads Natan Rams's trade notes and organizes them into the hub virtual filesystem (`/miasta`, `/osoby`, `/towary`).

**This episode delivers tools only** — no deterministic parsers. The LLM solves the task at runtime.

## Architecture

| Layer | Responsibility |
| --- | --- |
| `run.ts` | `createAgent` + ReAct loop |
| `read_file` | Read extracted notes from `data/natan_notes/` |
| `fs_*` MCP | Thin proxies to `POST /verify` (`task: filesystem`) |
| Agent (runtime) | Extract entities, build `fs_batch`, call `fs_done` |

Pattern: same as [`s04e03/domatowo`](../s04e03/) — agent-first, no solver in TypeScript.

## Run

```bash
cd tasks/s04e04
bun install
bun --env-file=../.env run run.ts
```

### Environment (`tasks/.env`)

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `HUB_API_KEY` | yes | — | Course hub key |
| `OPENAI_API_KEY` or OpenRouter | yes | — | Per `AI_PROVIDER` in `tasks/config` |
| `AGENT_MODEL` | no | `gpt-4o` | Escalation: `anthropic/claude-sonnet-4-6` |
| `AGENT_MAX_OUTPUT_TOKENS` | no | `4096` | Large `fs_batch` payloads |
| `AGENT_MAX_ITERATIONS` | no | `15` | ReAct cap |

See [research §8](docs/specs/filesystem/filesystem.research.md) for model cost/quality notes.

## Tools visible to the agent

| Tool | Purpose |
| --- | --- |
| `read_file` | Local Natan notes |
| `fs_help` | Hub API manual |
| `fs_batch` | `batch_mode` create/delete/reset |
| `fs_done` | Validation → `{FLG:...}` |
| `fs_list` | Debug listing |
| `fs_reset` | Clear hub FS before retry |
| `finish_task` | After flag |

## Quality

```bash
bun test
bunx tsc --noEmit
```

## Specs

- [filesystem.research.md](docs/specs/filesystem/filesystem.research.md)
- [filesystem.plan.md](docs/specs/filesystem/filesystem.plan.md)

## Related

- Boilerplate §2.8 — [filesystem homework profile](../docs/boilerplate-documentation.md#28-personal-knowledge-base-for-ai-s04e04)
- Lesson KB demo (different profile): [`lessons/04_04_system`](../../lessons/04_04_system/)
