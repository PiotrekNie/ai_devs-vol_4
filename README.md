# AI Devs 4 — Course Tasks

Monorepo containing task solutions for the **AI Devs 4** course, integrated with the [Cursor Collections](https://cursor-collections-1ztm.vercel.app/docs/) (Eversis) framework for structured AI-assisted development.

## Repository structure

```text
third-party/github-collections/   # Git submodule — Cursor Collections (Eversis) upstream
.cursor/
  rules/       # eversis-project-stack + use-bun (local); other rules symlink → submodule
  prompts/     # symlink → submodule — attach @eversis-*
  skills/      # symlink → submodule — eversis-collections MCP
  commands/    # symlink → submodule — /eversis-* project commands
  mcp.json     # workspace MCP (eversis-collections path → submodule + optional third-party servers)
tasks/
  shared/      # common types and utilities
  docs/        # boilerplate-documentation.md — agent architecture spec
  s01e01/ …    # one directory per episode
scripts/
  link-cursor-collections.sh     # refresh .cursor symlinks after submodule init
  sync-cursor-collections.mjs    # bump submodule + optional MCP build
documentation/
  cursor-collection.md           # symlink → submodule framework reference
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
| `s03e01` | `evaluation` — sensor anomaly scan + batch classify + hub verify |
| `s03e02` | `firmware` — ReAct agent + remote shell VM (S03E02) |
| `s03e03` | `reactor` — deterministic BFS planner, no LLM (S03E03) |
| `s03e05` | `savethem` — hub tool discovery + hybrid route solver (S03E05) |
| `s04e02` | `windpower` — async hub orchestrator, no LLM (S04E02) |
| `s04e03` | `domatowo` — ReAct rescue mission agent, thin MCP, no solver (S04E03) |

## Clone (submodules)

Use recursive clone so **Cursor Collections** is checked out:

```bash
git clone --recurse-submodules <repo-url>
# existing checkout without submodules:
git submodule update --init --recursive
bash scripts/link-cursor-collections.sh
```

On **Windows**, enable symlinks for Git (`core.symlinks true`) so `.cursor/` links resolve.

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

Build the local `eversis-collections` MCP server once after cloning (lives in the submodule):

```bash
cd third-party/github-collections/mcp/eversis-collections-mcp
npm ci && npm run build
```

Or from `scripts/`: `npm run build:mcp`.

Then open the repo in Cursor and enable the workspace MCP config when prompted (`Cursor → MCP → Enable workspace config`). The `eversis-collections` server exposes `eversis_skills_list`, `eversis_skills_get`, and related tools for agent use.

### Development workflow

| Goal | How |
| ---- | --- |
| Implement a new task | Attach `@eversis-implement` + task description |
| Review code | Attach `@eversis-review` |
| Browse skills | Agent calls `eversis_skills_list` / `eversis_skills_get` via MCP |
| Bump framework submodule | `node scripts/sync-cursor-collections.mjs` (optional `--build-mcp`) |

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
