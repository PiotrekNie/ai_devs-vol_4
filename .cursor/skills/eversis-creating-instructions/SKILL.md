---
name: eversis-creating-instructions
description: "Create project instructions for Cursor: AGENTS.md, .cursor/rules/*.mdc, optional per-folder RULE.md. No GitHub copilot-instructions.md in this framework."
user-invokable: false
---

# Creating instructions (Cursor)

Helps place **declarative rules** in the right surface for **Cursor**: **[AGENTS.md](https://github.com/PiotrNie-Eversis/cursor-collections/blob/main/AGENTS.md)**, **`.cursor/rules/eversis-*.mdc`**, and optional scoped `RULE.md` files. Use **skills** for procedural how-to, not long policies.

## Instruction surfaces (this framework)

| Surface                  | Location                                                                     | When to use                                              |
| ------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| **AGENTS.md**            | Repo root                                                                    | Short map: where prompts live, which rules to read first |
| **Project stack / core** | `.cursor/rules/eversis-project-stack.mdc`                                    | Stack, commands, test/lint invocations                   |
| **Always-on core**       | `.cursor/rules/eversis-agent-core.mdc`                                       | Relay workflow, human gates, quality bar                 |
| **Role rules**           | `.cursor/rules/eversis-role-*.mdc` or `eversis-engineering-manager.mdc`      | When to behave as which role                             |
| **Scoped**               | `globs` in a `.mdc` or a folder `RULE.md` (if your Cursor build supports it) | Directory- or file-type-specific constraints             |

**Deprecated for this repo:** `.github/copilot-instructions.md` and Copilot `*.instructions.md` — do not add them here.

## Instructions vs skills (unchanged idea)

| Content                                                | Belongs in…                                |
| ------------------------------------------------------ | ------------------------------------------ |
| Project rule (“always use pnpm”, “no console in prod”) | `AGENTS.md` / `.mdc`                       |
| Step-by-step workflow (how to run a migration review)  | `SKILL.md` under `.cursor/skills/`         |
| Runnable task text                                     | `.cursor/prompts/public/eversis-*.md` |

## Process

1. **Discover** — Read `AGENTS.md` and existing `.cursor/rules/*.mdc`.
2. **Choose surface** — Constitution-level → `eversis-project-stack.mdc` + `AGENTS.md` pointers. Narrow scope → new `.mdc` with `globs`.
3. **Write** — Short bullets; point to skills for long procedures.
4. **Validate** — No duplicate always-on rules; no procedural novel-length content.

Templates (rename concepts, not paths):

- [`assets/cursor-project-constitution.template.md`](./assets/cursor-project-constitution.template.md) — starting outline for “stack + commands + non-obvious rules”
- [`assets/scoped-conventions.template.md`](./assets/scoped-conventions.template.md) — scoped rules when using globs

## Connected skills

- `eversis-creating-agents` — role **rules** (`.mdc`) vs long instructions
- `eversis-creating-skills` — procedural vs declarative boundary
- `eversis-creating-prompts` — prompts should reference rules, not restate the constitution
- `eversis-technical-context-discovering` — where to look first
- `eversis-codebase-analysing` — mirror existing instruction style
