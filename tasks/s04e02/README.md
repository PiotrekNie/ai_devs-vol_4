# S04E02 — `windpower` (deterministic orchestrator)

Homework for **AI Devs 4 S04E02**: configure a wind turbine schedule before the hub service window (~40 s) closes.

## Architecture

**No LLM on the critical path** — a TypeScript orchestrator handles async hub API (queue + parallel `getResult` polling), schedule building, and verification.

```text
start → parallel get(weather, powerplantcheck)
      → poll (48× parallel) + early storm unlockCodeGenerator queues
      → production slot + unlock codes
      → config → turbinecheck → done → {FLG:...}
```

Reuses from `@ai-devs/agent-boilerplate`:

- `executeSubmitToHub` — hub POST with retry (429/503)
- `extractFlag` — `{FLG:...}` parsing
- Logger tags `[AKCJA]`, `[WYNIK]`, `[SYSTEM]`

### Why not ReAct?

The hub enforces a **40 s service window** after `start`. Weather reports take ~20–25 s; unlock codes queue asynchronously. Sequential ReAct tool calls add LLM latency and cannot match the required parallelism. See [research](docs/specs/s04e02-windpower/s04e02-windpower.research.md) §3 and boilerplate docs §5.2.1.

| Layer | Role |
| --- | --- |
| `orchestrator.ts` | Pipelined poll loop, unlock/config/check/done |
| `schedule.ts` | Storm protection (`idle`, pitch 90°) + production slot |
| `windpower_client.ts` | Thin hub wrapper around `submit_to_hub` |
| `power.ts` | Yield estimation from hub documentation |

## Prerequisites

- [Bun](https://bun.sh)
- `HUB_API_KEY` in `tasks/.env`

## Run

```bash
cd tasks/s04e02
bun install
bun run start
```

Expected: `{FLG:IVEGOTTHEPOWER}` (or another `{FLG:...}`) in under 40 s from `start`.

## Quality

```bash
bun test
bun run typecheck
```

## Specs

- [Research](docs/specs/s04e02-windpower/s04e02-windpower.research.md)
- [Plan](docs/specs/s04e02-windpower/s04e02-windpower.plan.md)
