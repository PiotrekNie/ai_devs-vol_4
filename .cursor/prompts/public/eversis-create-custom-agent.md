---
sidebar_position: 13
title: "Create custom agent"
slug: create-custom-agent
prompt_role: "Cursor customization orchestrator"
prompt_description: "Create new Cursor role packaging — typically .cursor/rules/eversis-*.mdc and optional agent docs. Researches existing rules, designs the role, and validates against the eversis-creating-agents skill."
---

# eversis-create-custom-agent

**Role:** [Cursor customization orchestrator](../../agents/cursor-customization-orchestrator) (workflow pattern)  
**File:** `.cursor/prompts/public/eversis-create-custom-agent.md`

Creates **Cursor-native role behavior**: prefer **`.cursor/rules/eversis-*.mdc`** (YAML frontmatter, scoped globs) plus optional **documentation** under `website/docs/agents/` in this monorepo. This repository does **not** ship GitHub Copilot `*.agent.md` files.

## Usage

```text
@eversis-create-custom-agent
<role requirements or description>
```

In **Cursor**, attach the file above (or open it and reference it with `@`) plus your context.

## What it does

1. **Research** — Review existing **`.cursor/rules/*.mdc`** and [AGENTS.md](https://github.com/PiotrNie-Eversis/cursor-collections/blob/main/AGENTS.md) for patterns; optionally read `website/docs/agents/`.
2. **Clarify** — Scope, responsibilities, which prompts attach this rule, and globs (`alwaysApply` vs `globs`).
3. **Design** — File name, description, section outline, and how the role composes with `eversis-agent-core.mdc`.
4. **Create** — Write the `.mdc` (and short agent doc if needed) following **`eversis-creating-agents`** (skill path: `.cursor/skills/eversis-creating-agents/SKILL.md`).
5. **Review** — Check consistency, length, and overlap with other rules.

## Skills loaded

- `eversis-creating-agents` (as **eversis-creating-agents** when copied to user skills) — structure and checklists
- `eversis-technical-context-discovering` — project conventions
- `eversis-codebase-analysing` — pattern discovery

## Output

New or updated **`.cursor/rules/eversis-*.mdc`** (and optional doc under `website/docs/agents/` for this framework).

For large efforts, follow the phased **research → create → review** pattern in [Cursor customization orchestrator](../../agents/cursor-customization-orchestrator).

---

## Executable prompt (attach in Cursor)

You are helping the user add a **new role** to their Cursor setup (this repo: under `.cursor/rules/`).

1. Load **`eversis-creating-agents`** from `.cursor/skills/eversis-creating-agents/SKILL.md` and follow its workflow.
2. Read existing rules in **`.cursor/rules/`** to match tone, frontmatter, and section order.
3. Propose a **single-purpose** `.mdc` file; avoid duplicating `eversis-agent-core.mdc`.
4. After authoring, self-review: globs correct, `description` accurate, no conflicting always-on rules.
5. If the user’s message is incomplete, ask clarifying questions before writing files.

<!-- Cursor Collections -->
