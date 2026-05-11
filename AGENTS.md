# Agent instructions (Cursor)

This repository implements the **Eversis Cursor** workflow: **Ideate → Implement → Review**, using Cursor rules, attachable markdown prompts, MCP, and procedural **`SKILL.md` packages** under **`.cursor/skills/`** (consumed in Agent through the **`eversis-collections` MCP** server and `eversis_*` tools — build `mcp/eversis-collections-mcp/` first).

- **Framework doc:** [documentation/cursor-collection.md](documentation/cursor-collection.md)
- **Project rules:** [.cursor/rules/](.cursor/rules/) — start with `eversis-agent-core.mdc` and edit `eversis-project-stack.mdc` per repo. For Implement / Review, optionally attach `eversis-engineering-manager.mdc` and `eversis-code-reviewer.mdc` when using the matching prompts.
- **Prompts:** Canonical **`eversis-*.md`** files live under **`.cursor/prompts/public/`** (user-facing) and **`.cursor/prompts/internal/`** (delegated). In Chat or Agent, **attach with `@` and the file stem** (e.g. **`@eversis-implement`**, **`@eversis-review`**) so Cursor can resolve the file by name. Use a repo path (e.g. **`.cursor/prompts/public/eversis-implement.md`**) only if the picker does not disambiguate. Optional: editor **snippets** in [`.vscode/eversis-prompts.code-snippets`](.vscode/eversis-prompts.code-snippets) expand short prefixes (e.g. `evimpl`) to the same **`@`** text. Catalog: [website/docs/prompts/overview.md](website/docs/prompts/overview.md).

**Prefixes:** The **`eversis-`** name is used for rules, prompt files, and **skill package directories** in this framework (e.g. `.cursor/skills/eversis-creating-skills/`). **Do not** register **`.cursor/skills/`** as Cursor **Agent Skills**; use the **`eversis-collections`** entry in [`.cursor/mcp.json`](.cursor/mcp.json) after building the local MCP package.
