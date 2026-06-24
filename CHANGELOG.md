# Changelog

All notable changes to this repository are documented here.

## [Unreleased]

### Added

- **`tasks/s04e03/`** — `@ai-devs/s04e03` domatowo agent: ReAct + 7 thin hub MCP tools, planning phase, memory hooks; mission solved by LLM (no TS solver).
- **`tasks/s04e02/`** — `@ai-devs/s04e02` windpower orchestrator: parallel async hub polling, storm/production schedule, verify `windpower` (no LLM).
- **`tasks/s03e05/`** — `@ai-devs/s03e05` savethem agent: hybrid ReAct (`hub_query` discovery) + deterministic `plan_route` BFS solver, hub verify `savethem`.
- **`tasks/s03e03/`** — `@ai-devs/s03e03` reactor solver: deterministic BFS planner (no LLM), hub loop, fixture-calibrated block simulator.
- **`tasks/s03e02/`** — `@ai-devs/s03e02` firmware agent: ReAct on `@ai-devs/agent-boilerplate`, MCP `shell_exec` (hub VM API), memory hooks after ban/hub errors, Langfuse tracing opt-in.
- **Git submodule** [`third-party/github-collections`](third-party/github-collections) — tracks `PiotrNie-Eversis/cursor-collections` on **`main`**, with [`scripts/link-cursor-collections.sh`](scripts/link-cursor-collections.sh) and [`scripts/sync-cursor-collections.mjs`](scripts/sync-cursor-collections.mjs) for symlink refresh and bumps.

### Changed

- **Cursor Collections — submodule + symlinks (parity with eog)** — prompts, skills, commands, and shared `eversis-*.mdc` rules are **symlinks** into the submodule; only [`eversis-project-stack.mdc`](.cursor/rules/eversis-project-stack.mdc) and [`use-bun-instead-of-node-vite-npm-pnpm.mdc`](.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc) stay as local files. [**`eversis-collections` MCP**](.cursor/mcp.json) builds under `third-party/github-collections/mcp/eversis-collections-mcp/`. [`documentation/cursor-collection.md`](documentation/cursor-collection.md) is a **symlink** into the submodule. [`AGENTS.md`](AGENTS.md), [`README.md`](README.md), [`.cursorignore`](.cursorignore), and [`scripts/README.md`](scripts/README.md) updated; [`scripts/sync-cursor-collections-from-upstream.sh`](scripts/sync-cursor-collections-from-upstream.sh) marked **deprecated** (historical rsync escape hatch only).
- [`tasks/docs/boilerplate-documentation.md`](tasks/docs/boilerplate-documentation.md) — przykładowa ścieżka uruchomienia MCP wskazuje katalog submodułu.

### Removed

- **Vendored Cursor Collections trees at repo root** — usunięto zwendorowane `.cursor/prompts`, `.cursor/skills`, reguły linkowane z upstreamu oraz root **`mcp/eversis-collections-mcp/`**; źródło frameworku jest wyłącznie w submodułach po `git submodule update --init --recursive` i `bash scripts/link-cursor-collections.sh`.

---

## Historical — initial framework in-tree (superseded by submodule model)

The following described the previous vendored layout (commit history may still reference these paths):

- `.cursor/rules/`, `.cursor/prompts/`, `.cursor/skills/` as copied files; root `mcp/eversis-collections-mcp/`
- `scripts/sync-cursor-collections-from-upstream.sh` as the primary sync path (now deprecated)

### Changed (historical)

- `tasks/docs/boilerplate-documentation.md` — section 6 (Cursor IDE integration) rewritten to reference real `eversis-*` rules, prompts, and the `@eversis-implement` / `@eversis-review` workflow instead of placeholder rule filenames

### Removed (historical)

- Per-task Bun rule copies (`tasks/s01e01`, `s01e03`, `s01e04`, `s01e05`, `s02e02`, `s02e03` — `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc`) consolidated into the root rule
- Empty `tasks/s*/.cursor/` directories left over after rule removal
