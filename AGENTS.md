# Agent instructions (Cursor) — AI Devs vol. 4

This repository uses **Cursor Collections (Eversis)** as a **Git submodule** at [`third-party/github-collections`](third-party/github-collections).

- **Upstream agent guide:** [third-party/github-collections/AGENTS.md](third-party/github-collections/AGENTS.md)
- **Workflow reference:** [third-party/github-collections/documentation/cursor-collection.md](third-party/github-collections/documentation/cursor-collection.md) (also [`documentation/cursor-collection.md`](documentation/cursor-collection.md) — symlink)
- **This repo’s rules:** [`.cursor/rules/`](.cursor/rules/) — `eversis-project-stack.mdc` and [`use-bun-instead-of-node-vite-npm-pnpm.mdc`](.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc) are **AI-Devs-specific**; other `eversis-*.mdc` files in `.cursor/rules/` symlink into the submodule (plus BA docs rules from upstream when present).
- **Prompts & skills:** [`.cursor/prompts/`](.cursor/prompts/) and [`.cursor/skills/`](.cursor/skills/) (symlinks into the submodule). Attach with `@eversis-*` (e.g. `@eversis-implement`).
- **Editor snippets** (optional): [third-party/github-collections/.vscode/eversis-prompts.code-snippets](third-party/github-collections/.vscode/eversis-prompts.code-snippets) — copy path into workspace or open from the submodule.
- **Fine → QA comment (contract):** When Implement finishes, the agent declares **Fine** and outputs the QA draft **in the same response**, following [`.cursor/skills/eversis-qa-comment/SKILL.md`](.cursor/skills/eversis-qa-comment/SKILL.md) — see [workflow overview — Status: Fine](third-party/github-collections/website/docs/workflow/overview.md). Normative procedure is **`SKILL.md`** or MCP `eversis_skills_get`; not the Docusaurus overview page alone. Reinforced in **`.cursor/rules/eversis-project-stack.mdc`** (always-on) and **`.cursor/commands/eversis-implement.md`**.
- **MCP:** [`.cursor/mcp.json`](.cursor/mcp.json) — build the local server after first clone or any submodule bump:

  ```sh
  # Preferred: clone with submodules
  git clone --recurse-submodules <repo-url>

  # Or, for an existing checkout:
  git submodule update --init --recursive

  bash scripts/link-cursor-collections.sh

  # Then build (run after every submodule bump):
  cd third-party/github-collections/mcp/eversis-collections-mcp && npm ci && npm run build
  ```

  Or from `scripts/`: `npm run build:mcp`.

**Bump framework / stay aligned with upstream cursor-collections:**

- From repo root:

  ```sh
  node scripts/sync-cursor-collections.mjs
  # optional: rebuild MCP after bump
  node scripts/sync-cursor-collections.mjs --build-mcp
  ```

- From `scripts/`:

  ```sh
  cd scripts
  npm run sync:collections
  npm run build:mcp   # optional: install + build MCP
  npm run start:mcp    # optional: run MCP locally (stdio server)
  ```

- Check that symlinks match the submodule **without** fetching (fails if `.cursor/` is out of sync with the submodule): `node scripts/sync-cursor-collections.mjs --check-only`.

Open the **repository root** as the Cursor workspace so MCP and paths resolve correctly.
