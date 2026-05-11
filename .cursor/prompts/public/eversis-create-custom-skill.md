---
sidebar_position: 14
title: "Create custom skill"
slug: create-custom-skill
prompt_role: "Cursor customization orchestrator"
prompt_description: "Create a new Agent Skill: SKILL.md under .cursor/skills/ with gerund-style folder name. Follows eversis-creating-skills."
---
# eversis-create-custom-skill

**Role:** [Cursor customization orchestrator](../../agents/cursor-customization-orchestrator)  
**File:** `.cursor/prompts/public/eversis-create-custom-skill.md`

Creates a new **skill package** (`SKILL.md`): a directory under **`.cursor/skills/<name>/`** with optional `references/`, `assets/`, `examples/`. In this framework, the agent **reads** skills through the **`eversis-collections` MCP** server (`eversis_skills_*` tools) after you build [`mcp/eversis-collections-mcp/`](https://github.com/PiotrNie-Eversis/cursor-collections/tree/main/mcp/eversis-collections-mcp) — do not rely on a separate **Agent Skills** path in Cursor settings.

## Usage

```text
@eversis-create-custom-skill
<skill requirements or description>
```

## What it does

1. **Research** — Study existing **`.cursor/skills/eversis-*/SKILL.md`** for frontmatter, gerund folder names, and progressive disclosure.
2. **Clarify** — Domain, when the skill applies, and what templates/references to add.
3. **Create** — New folder with `SKILL.md` per **`eversis-creating-skills`**.
4. **Review** — Naming, description field quality, and folder layout.

## Output

A new **`.cursor/skills/<gerund-name>/`** tree.

## Skills loaded

- `eversis-creating-skills`
- `eversis-technical-context-discovering`
- `eversis-codebase-analysing`

---

## Executable prompt (attach in Cursor)

1. Load `.cursor/skills/eversis-creating-skills/SKILL.md` and follow it end-to-end.
2. New skill folders use **gerund** names (e.g. `reviewing-invoices`) matching the skill’s `name` in frontmatter.
3. Ensure the **description** field is specific so Cursor matches the skill when appropriate.
4. Do not reference VS Code Copilot — skills are consumed in **Cursor** via the **`eversis-collections` MCP** and `eversis_skills_*` tools.

<!-- Cursor Collections -->
