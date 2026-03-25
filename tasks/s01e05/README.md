# s01e05 — Railway (Hub API + OpenRouter planner)

Self-documenting `railway` task: cache `help` to `concepts.json`, plan steps with AI SDK + OpenRouter, execute with retries (503/429).

## Setup

- Copy `tasks/.env` with `HUB_API_KEY` and `OPENROUTER_API_KEY`.
- Optional: `OPENROUTER_HTTP_REFERER`, `OPENROUTER_APP_NAME`, `RAILWAY_REFRESH_HELP=1`.

## Run

```bash
cd tasks/s01e05
bun install
bun --env-file=../.env run index.ts
```

Force refresh of `help` (ignore / overwrite cache):

```bash
bun --env-file=../.env run index.ts --refresh-help
```
