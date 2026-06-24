# S04E03 — domatowo

ReAct agent for the **domatowo** homework (S04E03): the **LLM** plans and executes the rescue mission via thin hub MCP tools — **no solver** in TypeScript.

## Run

```bash
cd tasks/s04e03
bun install
bun run start   # uses tasks/.env
```

Recommended model (set in `tasks/.env`):

```env
AGENT_MODEL=anthropic/claude-sonnet-4-6
AGENT_MAX_ITERATIONS=40
AGENT_MAX_OUTPUT_TOKENS=512
AGENT_PLANNING_MAX_OUTPUT_TOKENS=512
AGENT_MAX_TOOL_OUTPUT_CHARS=6000
HUB_API_KEY=...
```

On **OpenRouter**, HTTP 402 means your account has **no credits left** (or not enough for the next request). This is not an agent bug.

**Fix (pick one):**

1. **Top up OpenRouter:** https://openrouter.ai/settings/credits — then `bun run start` again.
2. **Switch provider:** add `OPENAI_API_KEY` to `tasks/.env` and set `AI_PROVIDER=openai` (requires OpenAI billing).
3. **Cheaper model** after top-up: `AGENT_MODEL=openai/gpt-4o-mini` uses fewer credits per turn than Sonnet.

While credits are low, keep:

```env
AGENT_MAX_OUTPUT_TOKENS=512
AGENT_PLANNING_MAX_OUTPUT_TOKENS=512
AGENT_MAX_TOOL_OUTPUT_CHARS=6000
```

Optional Langfuse: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`.

## Architecture

| Layer | Role |
| --- | --- |
| `run.ts` | `createAgent` + planning turn 0 + Langfuse |
| `src/mcp/server.ts` | 7 thin tools → `POST /verify` `task: domatowo` |
| `src/prompts/` | Mission spec + radio signal in `domatowo_task.md` |
| `src/agent/domatowo_memory.ts` | Inject revised plan on low points / hub errors |

**Not included:** `planner.ts`, `pathfind.ts`, or any mission-solving logic in code.

## Tools

| MCP | Hub actions |
| --- | --- |
| `domatowo_recon` | help, actionCost, getMap, getObjects, getLogs, expenses, searchSymbol |
| `domatowo_reset` | reset |
| `domatowo_create` | create |
| `domatowo_move` | move |
| `domatowo_inspect` | inspect |
| `domatowo_dismount` | dismount |
| `domatowo_call_helicopter` | callHelicopter |

Plus native `finish_task` after `{FLG:...}`.

Preview: https://hub.ag3nts.org/domatowo_preview

## Quality

```bash
bun test
bun run typecheck
```

## Specs

- [s04e03-domatowo.research.md](docs/specs/s04e03-domatowo/s04e03-domatowo.research.md)
- [s04e03-domatowo.plan.md](docs/specs/s04e03-domatowo/s04e03-domatowo.plan.md)
