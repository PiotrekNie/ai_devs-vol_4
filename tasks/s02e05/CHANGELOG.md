# Changelog — @ai-devs/s02e05

## 0.1.1 — 2026-05-27

- **Map prefetch (smoke fix):** `ensureDroneMapCached()` downloads `DRONE_MAP_URL` → `data/map.png` before the agent loop.
- **`maxIterations`:** pass episode `MAX_ITERATIONS` (default 50) to `createAgent` — boilerplate alone defaults to 10.
- **`ask_human`:** registered in `run.ts` (prompts referenced it but tool was missing).
- **Prompts:** clarify `submit_to_hub` vs full POST body in HTML docs (`apikey` injected by tool).
- Prompts updated: vision on local path; no `http_request` for map; `ask_human` on blocker instead of early `finish_task`.

## 0.1.0 — 2026-05-27

- Initial episode scaffold on `@ai-devs/agent-boilerplate` (`file:../boilerplate`).
- `run.ts`: ReAct agent with default MCP, planning phase (default on), Observational Memory.
- Domain prompts: `system.md`, `drone_task.md` (live docs + vision flow).
- Author snapshot: `docs/context/drone-api.md`, `drone-api.raw.html`.
- Minimal tests: config, prompts, API snapshot keywords.
- `scripts/sync-drone-docs.ts` to refresh raw HTML.
