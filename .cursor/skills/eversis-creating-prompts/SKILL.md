---
name: eversis-creating-prompts
description: "Create attachable Cursor prompts: .cursor/prompts/public|internal/eversis-*.md (Docusaurus frontmatter + body). Replaces legacy .github/prompts/*.prompt.md. Use when creating or reviewing prompt markdown in this framework."
user-invokable: false
---

# Creating prompts (Cursor markdown)

Creates well-structured **attachable prompts** for Cursor Collections: Markdown under **`.cursor/prompts/`** with `eversis-` names (synced into `website/docs/prompts/` for Docusaurus in this monorepo). Ensures clear separation between **prompt bodies**, **`.cursor/rules/`** role behavior, and **skills**.

## Core Design Principles

<principles>

<separation-of-concerns>
A **prompt file** (`eversis-*.md`) defines WHAT workflow to execute. It must NOT redefine WHO the model is in depth — that belongs in **`.cursor/rules/`**.

- **Prompt** = workflow steps, expected artifacts, when to stop for human review
- **Role rules** = stable behavior in `.cursor/rules/eversis-*.mdc`
- **Skills** = procedural `SKILL.md` packages under `.cursor/skills/`
  </separation-of-concerns>

<workflow-focus>
A **public** prompt in this monorepo is a **Docusaurus doc** and a **User attachable** body. It must:

- Use YAML frontmatter: `title`, `slug`, `sidebar_position`, `prompt_role`, `prompt_description` (see existing `eversis-*.md`)
- Describe the **workflow steps** and which **rules** the user should attach
- Point to **internal** `eversis-*.md` files when the workflow composes them

A prompt must NOT:

- Redefine full role behavior (put that in **`.mdc`**)
- Duplicate skill bodies (link skills by name)
- Put stack-wide standards here (put those in **AGENTS.md** / `eversis-project-stack.mdc`)
  </workflow-focus>

<xml-syntax>
All structured content inside the prompt body MUST use XML-like tags for explicit structure. This ensures reliable parsing across all LLM model tiers.

Use Markdown only for inline formatting (bold, code blocks, tables, lists) within XML sections.
</xml-syntax>

<minimal-scope>
A prompt should only describe what is necessary for the specific workflow it triggers. Delegate domain knowledge to skills, coding standards to instructions, and behavioral guidelines to agents.
</minimal-scope>

</principles>

## Creation Process

Use the checklist below and track your progress:

```
Creation progress:
- [ ] Step 1: Define the prompt's purpose
- [ ] Step 2: Choose the target agent and model
- [ ] Step 3: Determine tool requirements
- [ ] Step 4: Identify required skills
- [ ] Step 5: Design the workflow steps
- [ ] Step 6: Define output expectations
- [ ] Step 7: Assemble the prompt file using the template
- [ ] Step 8: Validate the prompt file
```

**Step 1: Define the prompt's purpose**

Answer these questions before writing anything:

- What specific workflow does this prompt trigger? (e.g., research a task, implement a feature, run e2e tests)
- What is the expected outcome? (e.g., a research document, implemented code, test suite)
- What inputs does the workflow require? (e.g., Jira ID, plan file, feature description)
- Does this prompt extend or depend on another prompt?
- What makes this workflow distinct from existing prompts?

**Step 2: Choose the target role and rules**

- Read **`.cursor/rules/`** and [website/docs/agents/](https://github.com/PiotrNie-Eversis/cursor-collections/tree/main/website/docs/agents) to pick the **conceptual** role (Business Analyst, Engineering Manager, …).
- In the prompt body, tell the user which **`eversis-*.mdc`** files to @-attach. Model choice is a **user setting in Cursor**, not frontmatter in these Markdown prompts.

**Step 3: Determine tool requirements**

Document MCP expectations in the prompt body (e.g. “ensure Atlassian and Figma MCP are enabled”). Do not use a `tools` YAML key in `eversis-*.md` — Cursor does not use Copilot’s prompt `tools` array.

**Step 4: Identify required skills**

Determine which skills the workflow depends on:

- Review existing skills in `.cursor/skills/` to find relevant ones
- Each referenced skill will be loaded by the agent before starting the workflow
- List skills with a brief explanation of why they are needed for THIS workflow
- Do not reference skills that are not directly used in the workflow steps

**Step 5: Design the workflow steps**

Outline the workflow as a numbered sequence:

- Each step should be a clear, actionable instruction
- Steps should reference skills and tools where appropriate
- Include decision points and branching logic if the workflow is not purely linear
- Include automatic handoffs to other agents if the workflow spans multiple specializations
- Keep steps focused on WHAT to do, not HOW to think about it (the agent's personality handles the how)

**Step 6: Define output expectations**

Specify the expected deliverables of the workflow:

- File name conventions and output locations
- Document structure or template to follow (reference skill templates where applicable)
- Summary format if the workflow produces a report
- Success criteria — how to know the workflow is complete
- This step is optional if the workflow outcome is self-evident (e.g., implemented code)

**Step 7: Assemble the prompt file using the template**

Use `./prompt.template.md` for section ordering. Write **`.cursor/prompts/public/eversis-<name>.md`** (or **`internal/`** for delegation prompts). In this monorepo, **`npm run build`** (or **`sync-prompts`**) in **`website/`** copies prompts into `website/docs/prompts/` for Docusaurus; sidebars are autogenerated.

**Step 8: Validate the prompt file**

- [ ] Frontmatter matches other `eversis-*.md` files
- [ ] `prompt_role` / `prompt_description` are accurate
- [ ] All skills referenced exist under `.cursor/skills/`
- [ ] No long-term role definition duplicated (belongs in `.mdc`)
- [ ] No stack-wide policy duplicated (belongs in `AGENTS.md` / stack rule)
- [ ] Workflow steps are clear; internal prompts linked by path

## Prompt File Structure Reference

### Frontmatter fields (Docusaurus + framework)

| Field                | Required | Description                  |
| -------------------- | -------- | ---------------------------- |
| `title`              | **Yes**  | Page title in docs           |
| `slug`               | **Yes**  | URL path under prompts       |
| `sidebar_position`   | **Yes**  | Sidebar ordering             |
| `prompt_role`        | **Yes**  | Short role label for catalog |
| `prompt_description` | **Yes**  | One-line description         |

Legacy Copilot `agent` / `model` / `tools` keys are **not** used.

### Body Sections

| Section                  | Required | Purpose                                                                          |
| ------------------------ | -------- | -------------------------------------------------------------------------------- |
| Goal statement           | **Yes**  | 1-2 paragraphs describing what the prompt accomplishes and the expected outcome. |
| `<prerequisites>`        | No       | Dependencies on other prompts or files that must be completed first.             |
| `<input-requirements>`   | No       | Describes what context or inputs the workflow needs to start.                    |
| Required Skills          | **Yes**  | Skills to load before starting the workflow, with brief rationale for each.      |
| Workflow                 | **Yes**  | Numbered steps defining the workflow sequence.                                   |
| `<output-specification>` | No       | File naming, document structure, summary format, or success criteria.            |
| `<handoff>`              | No       | Automatic handoff to another agent at the end of the workflow.                   |
| `<constraints>`          | No       | Workflow-specific limitations, anti-patterns, or scope boundaries.               |

## XML Syntax Guidelines

All body content in the prompt file must use XML-like tags for structure. Rules:

1. Every section uses a matching opening and closing tag: `<section-name>` ... `</section-name>`
2. Tags use lowercase-kebab-case naming
3. Nesting is allowed for sub-sections
4. Markdown formatting (bold, lists, tables, code blocks) is used inside XML tags for content
5. Avoid XML attributes for structural content — use nested tags or Markdown content instead. Exception: identifier attributes (e.g., `<tool name="...">`) are acceptable when they improve readability.

## Variables Reference

Prompt files support variables that are resolved at runtime. Use them to make prompts more flexible:

| Variable                            | Description                            |
| ----------------------------------- | -------------------------------------- |
| `${workspaceFolder}`                | Absolute path to the workspace root    |
| `${workspaceFolderBasename}`        | Name of the workspace folder           |
| `${file}`                           | Path to the currently open file        |
| `${fileBasename}`                   | Filename of the currently open file    |
| `${fileDirname}`                    | Directory of the currently open file   |
| `${fileBasenameNoExtension}`        | Filename without extension             |
| `${selection}` / `${selectedText}`  | Currently selected text in the editor  |
| `${input:variableName}`             | Prompts user for text input at runtime |
| `${input:variableName:placeholder}` | User input with placeholder hint       |

Variables are useful for prompts that operate on dynamic context (e.g., the current file, user-provided identifiers).

## Connected Skills

- `eversis-creating-agents` - to understand agent patterns and ensure prompts don't overlap with agent responsibilities
- `eversis-creating-skills` - to ensure this skill's own structure follows the canonical skill creation requirements
- `eversis-technical-context-discovering` - to understand existing prompt patterns and project conventions before creating a new one
- `eversis-codebase-analysing` - to analyze existing prompts and identify patterns to follow
- `eversis-creating-instructions` - to understand when coding standards belong in instruction files rather than prompt definitions
