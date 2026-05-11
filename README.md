# AI Devs 4 — Course Tasks

Monorepo containing task solutions for the **AI Devs 4** course, integrated with the [Cursor Collections](https://cursor-collections-1ztm.vercel.app/docs/) (Eversis) framework for structured AI-assisted development.

## Repository structure

```text
.cursor/
  rules/       # eversis-*.mdc (always-on + on-demand) + Bun rule
  prompts/     # public/ and internal/ eversis-*.md — attach with @eversis-*
  skills/      # eversis-*/ — loaded via eversis-collections MCP
  mcp.json     # workspace MCP config (eversis-collections + third-party servers)
mcp/
  eversis-collections-mcp/  # local MCP server — build before first use
tasks/
  shared/      # common types and utilities
  docs/        # boilerplate-documentation.md — agent architecture spec
  s01e01/ … s02e03/  # one directory per episode
scripts/
  sync-cursor-collections-from-upstream.sh  # update vendored framework
documentation/
  cursor-collection.md  # Cursor Collections framework reference
AGENTS.md      # entry point for Cursor agent workflow
```

## Tasks

| Task | Description |
| ---- | ----------- |
| `s01e01` | People filtering — hub task with shared `filterPeople` utility |
| `s01e02` | Haversine distance — geolocation tool with hub verify |
| `s01e03` | MCP server — Hono-based HTTP MCP endpoint for hub integration |
| `s01e04` | `sendit` — OCR vision pipeline + Responses API, unit-tested |
| `s01e05` | `railway` — AI SDK planner with help cache, retries (503/429) |
| `s02e01` | `categorize` — token-budget prompt classification with self-repair |
| `s02e02` | `electricity` — 3×3 tile board solver (vision → plan → rotate) |
| `s02e03` | `failurecode` — ReAct agent with MCP tools, Observer/Reflector memory |

## Quick start

```bash
# 1. Copy env template and fill in your keys
cp tasks/.env.example tasks/.env   # or create tasks/.env manually

# 2. Install deps for a task
cd tasks/s02e03
bun install

# 3. Run
bun --env-file=../.env run index.ts
```

Required environment variables (in `tasks/.env`):

| Variable | Description |
| -------- | ----------- |
| `HUB_API_KEY` | AI Devs course hub API key |
| `OPENROUTER_API_KEY` | OpenRouter key (models: GPT-4o, Gemini, Claude) |

## Cursor Collections integration

This repository is fully integrated with the **Cursor Collections** (Eversis) framework — see [AGENTS.md](AGENTS.md) and [documentation/cursor-collection.md](documentation/cursor-collection.md).

### First-time MCP setup

Build the local `eversis-collections` MCP server once after cloning:

```bash
cd mcp/eversis-collections-mcp
npm install && npm run build
```

Then open the repo in Cursor and enable the workspace MCP config when prompted (`Cursor → MCP → Enable workspace config`). The `eversis-collections` server exposes `eversis_skills_list`, `eversis_skills_get`, and related tools for agent use.

### Development workflow

| Goal | How |
| ---- | --- |
| Implement a new task | Attach `@eversis-implement` + task description |
| Review code | Attach `@eversis-review` |
| Browse skills | Agent calls `eversis_skills_list` / `eversis_skills_get` via MCP |
| Sync framework from upstream | `./scripts/sync-cursor-collections-from-upstream.sh` |

### Active rules

| Rule | Applied |
| ---- | ------- |
| `eversis-agent-core.mdc` | Always — core workflow and quality bar |
| `eversis-project-stack.mdc` | Always — Bun/TypeScript stack, quality commands, conventions |
| `use-bun-instead-of-node-vite-npm-pnpm.mdc` | Auto on `tasks/**` and `lessons/**` files |
| `eversis-engineering-manager.mdc` | On demand — attach with `@eversis-implement` |
| `eversis-code-reviewer.mdc` | On demand — attach with `@eversis-review` |

## Adding a new task

1. Create `tasks/sXXeYY/` following the structure in [tasks/docs/boilerplate-documentation.md](tasks/docs/boilerplate-documentation.md).
2. Attach `@eversis-implement` in Cursor Agent with your task description.
3. Run `bun install` and `bun --env-file=../.env run index.ts` to verify.
