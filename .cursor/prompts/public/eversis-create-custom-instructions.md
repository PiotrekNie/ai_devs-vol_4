---
sidebar_position: 16
title: "Create custom instructions"
slug: create-custom-instructions
prompt_role: "Cursor customization orchestrator"
prompt_description: "Create or extend project instructions for Cursor: AGENTS.md, .cursor/rules, optional RULE.md. Follows eversis-creating-instructions."
---

# eversis-create-custom-instructions

**Role:** [Cursor customization orchestrator](../../agents/cursor-customization-orchestrator)  
**File:** `.cursor/prompts/public/eversis-create-custom-instructions.md`

Helps the user encode **project-wide instructions** for **Cursor**: primarily **[AGENTS.md](https://github.com/PiotrNie-Eversis/cursor-collections/blob/main/AGENTS.md)** and **`.cursor/rules/*.mdc`**. Optional: scoped **`RULE.md`** in subfolders (Cursor-supported patterns). **Do not** target GitHub Copilot `copilot-instructions.md` — this repository is Cursor-only.

## Usage

```text
@eversis-create-custom-instructions
<conventions or requirements to encode>
```

## What it does

1. **Research** — Read `AGENTS.md`, `.cursor/rules/`, and any existing `RULE.md` or team docs.
2. **Choose surface** — **Repo-wide** behavior → `AGENTS.md` + always-on/conditional **`.mdc`**. **Path-scoped** conventions → `globs` in a dedicated `.mdc` or a folder-level rule file your Cursor version supports.
3. **Clarify** — What to encode (stack, test commands, review bar, security).
4. **Create** — Edit or add files using **`eversis-creating-instructions`**.
5. **Review** — No duplicated content across `AGENTS.md` and multiple always-on rules; keep snippets short.

## Skills loaded

- `eversis-creating-instructions`
- `eversis-technical-context-discovering`
- `eversis-codebase-analysing`

## Output

Updated **`AGENTS.md`** and/or **`.cursor/rules/eversis-*.mdc`** (and optional `RULE.md`).

---

## Executable prompt (attach in Cursor)

1. Open `.cursor/skills/eversis-creating-instructions/SKILL.md` and follow its decision framework (what belongs in rules vs long-form AGENTS).
2. Prefer **one** always-on core rule plus stack-specific `eversis-project-stack.mdc` — avoid ten overlapping always-apply files.
3. Instructions must be **actionable** for the model (clear imperatives, paths to tests, “never do X” where needed).
4. Never instruct the user to add `.github/prompts` or Copilot — those are not part of this framework.

<!-- Cursor Collections -->
