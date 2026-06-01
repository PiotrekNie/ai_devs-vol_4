# S03E03 — `reactor` (deterministic planner)

Homework for **AI Devs 4 S03E03**: guide a transport robot across a 7×5 reactor grid without being crushed by moving blocks.

## Architecture

**No LLM** — a pure TypeScript BFS planner reads structured JSON from the hub after each move and chooses `right`, `wait`, or `left`.

```text
start → loop: BFS/heuristic → POST /verify { command } → until {FLG:...}
```

Reuses from `@ai-devs/agent-boilerplate`:

- `fetchWithRetry` — hub HTTP with 503 retry
- Logger tags `[MYŚL]`, `[AKCJA]`, `[WYNIK]`, `[SYSTEM]`
- `HUB_API_KEY`, `HUB_VERIFY_URL`

## Prerequisites

- [Bun](https://bun.sh)
- `HUB_API_KEY` in `tasks/.env` (same as other episodes)

## Run

```bash
cd tasks/s03e03
bun install
bun run start
```

Expected output ends with `{FLG:INSTALLED}` (or another `{FLG:...}` flag).

## Quality

```bash
bun test
bun run typecheck
```

Unit tests calibrate the block simulator against JSON fixtures recorded from the live hub API.

## Debug

Visual preview (optional): https://hub.ag3nts.org/reactor_preview.html

## Specs

- [Research](docs/specs/s03e03-reactor/s03e03-reactor.research.md)
- [Plan](docs/specs/s03e03-reactor/s03e03-reactor.plan.md)
