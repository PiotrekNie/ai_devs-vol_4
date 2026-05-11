# Changelog

All notable changes to this repository are documented here.

## [Unreleased]

### Added

- **Cursor Collections integration** — full Eversis framework layer in the repository root:
  - `.cursor/rules/` — `eversis-agent-core.mdc`, `eversis-project-stack.mdc` (customised for Bun/TypeScript/tasks), `eversis-engineering-manager.mdc`, `eversis-code-reviewer.mdc`, `eversis-testing-and-terminal.mdc`, `eversis-accessibility.mdc`
  - `.cursor/prompts/public/` and `internal/` — 23 `eversis-*.md` prompt files, attachable via `@eversis-*` in Cursor Chat or Agent
  - `.cursor/skills/` — 33 `eversis-*` skill packages (procedural how-to guides), served by the `eversis-collections` MCP server
  - `.cursor/mcp.json` — workspace MCP config (full upstream set: `eversis-collections`, AWS, GCP, Playwright, Context7, Sequential Thinking, Figma, Atlassian, PDF Reader)
- **Local MCP server** `mcp/eversis-collections-mcp/` — vendored source + built `dist/`; exposes `eversis_skills_list`, `eversis_skills_get`, `eversis_skills_validate`, and `eversis_skill_run_script`
- **`AGENTS.md`** — repo entry point for the Ideate → Implement → Review workflow
- **`documentation/cursor-collection.md`** — authoritative Cursor Collections framework reference
- **`.cursorignore`** — excludes secrets, `node_modules`, generated outputs, and lesson media from Cursor indexing
- **`scripts/sync-cursor-collections-from-upstream.sh`** — rsync script for repeatable framework updates from a local upstream clone; protects `eversis-project-stack.mdc`, `AGENTS.md`, and `.cursorignore` from being overwritten
- **`README.md`** — root repository documentation with task inventory, quick start, and Cursor workflow guide
- **Consolidated Bun rule** — single `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc` with `globs` covering `tasks/**` and `lessons/**`; replaces six per-task duplicate copies

### Changed

- `tasks/docs/boilerplate-documentation.md` — section 6 (Cursor IDE integration) rewritten to reference real `eversis-*` rules, prompts, and the `@eversis-implement` / `@eversis-review` workflow instead of placeholder rule filenames

### Removed

- Per-task Bun rule copies (`tasks/s01e01`, `s01e03`, `s01e04`, `s01e05`, `s02e02`, `s02e03` — `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc`) consolidated into the root rule
- Empty `tasks/s*/.cursor/` directories left over after rule removal
