---
name: eversis-creating-agents
description: "Create Cursor project rules for roles: .cursor/rules/eversis-*.mdc (YAML: description, globs, alwaysApply). Maps legacy agent-identity content into rule bodies; use with skills and attachable .cursor/prompts. Use when creating or reviewing role rules — not .github/agents (removed in Cursor Collections)."
user-invokable: false
---

# Creating agents (Cursor rules)

Creates well-structured **Cursor rules** (`.mdc`) that define **role behavior** for the Eversis / Cursor Collections framework. Enforces the same separation of concerns as before: **rules** = who/when, **skills** = how, **prompts** = runnable workflow text under **`.cursor/prompts/`**.

> **This repository** no longer ships `.github/agents/*.agent.md`. Use **`.cursor/rules/eversis-*.mdc`** and optional `website/docs/agents/*.md` documentation.

## Core Design Principles

<principles>
<separation-of-concerns>
A **role rule** (`.mdc`) defines WHO the model should “be” when the rule applies. It must NOT define HOW a full multi-step workflow runs end-to-end (that lives in **skills** and **prompts**).

- **Rule / role** = behavior, responsibilities, and boundaries (`.cursor/rules/*.mdc`)
- **Skills** = reusable workflows (`SKILL.md` under `.cursor/skills/`)
- **Prompts** = attachable markdown under `.cursor/prompts/public/` and `internal/`
</separation-of-concerns>

<xml-syntax>
All structured content inside the agent body MUST use XML-like tags for explicit structure. This ensures reliable parsing across all LLM model tiers.

Use Markdown only for inline formatting (bold, code blocks, tables, lists) within XML sections.
</xml-syntax>

<minimal-scope>
An agent should only describe what is necessary for its specific role. Avoid duplicating instructions that belong in skills, **AGENTS.md**, or other **`.mdc`** files.
</minimal-scope>
</principles>

## Creation Process

Use the checklist below and track your progress:

```
Creation progress:
- [ ] Step 1: Define the agent's purpose
- [ ] Step 2: Write the agent role and responsibilities
- [ ] Step 3: Determine tools and write tool usage guidelines
- [ ] Step 4: Determine skills and write skills usage guidelines
- [ ] Step 5: Configure handoffs (if applicable)
- [ ] Step 6: Add domain standards (if applicable)
- [ ] Step 7: Add constraints (if applicable)
- [ ] Step 8: Assemble the agent file using the template
- [ ] Step 9: Validate the agent file
```

**Step 1: Define the agent's purpose**

Answer these questions before writing anything:
- What specific role does this agent fulfill? (e.g., architect, reviewer, engineer)
- What problems does it solve?
- What is the agent's primary focus area?
- Which other agents does it collaborate with?
- What makes this agent distinct from existing agents?

**Step 2: Write the agent role and responsibilities**

Write the `<agent-role>` section. This is the core of the agent. It must describe:
- A clear role statement starting with "Role: You are..."
- The agent's primary responsibilities and focus areas
- The agent's behavioral guidelines (how it approaches work)
- Skip-level instructions for skill and tool usage (always check skills first, always use tools to gather context)

Follow the pattern from existing agents. Keep the role focused. Do not include workflow-specific steps — those belong in skills.

**Step 3: Tools and execution**

In Cursor, tool access is **not** configured in the rule file the same way as legacy Copilot `tools:` arrays. Instead, document **when to use MCP, terminal, or repo search** inside `<tool-usage>` as *behavioral guidance* for the Agent. Be explicit: read-only review roles should avoid destructive commands.

**Step 4: Determine skills and write skills usage guidelines**

Review available skills and select those the agent should load:
- For each skill, write a short entry explaining WHEN to use it
- Use the format: `skill-name` - brief description of when to use it

Do not duplicate skill content in the agent file. The agent only references skills.

**Step 5: Handoffs (if applicable)**

Describe how this role **passes work** to another (e.g. “after research, stop for approval before plan”). In Cursor, handoffs are **narrative** in the rule and in public prompts — not `handoffs` YAML in `.mdc` (legacy Copilot). Link to the next prompt or rule with file paths.

**Step 6: Add domain standards (if applicable)**

If the agent's role requires enforcing domain-specific standards (e.g., testing conventions, security rules, UI patterns), add a `<domain-standards>` section. This section is optional and should only appear when the agent genuinely needs domain-specific rules that are NOT covered by skills.

**Step 7: Add constraints (if applicable)**

If the agent has specific limitations or anti-patterns to avoid, add a `<constraints>` section. Common constraints include:
- What the agent must NOT produce (e.g., "don't create implementation plans")
- Scope boundaries (e.g., "don't provide deployment instructions")
- Delegation rules (e.g., "escalate architectural decisions to the architect")

**Step 8: Assemble the rule file using the template**

Use `./agent.template.md` as a **structural** guide: produce **`.cursor/rules/eversis-<role>.mdc`** with YAML frontmatter (`description`, `globs` or `alwaysApply`) and a body that follows the same XML-like sections where helpful. Do **not** write `.github/agents/`.

**Step 9: Validate the agent file**

Verify the agent file against this checklist:
- [ ] YAML frontmatter is valid and parseable
- [ ] `description` is present and concise
- [ ] `description` / `globs` / `alwaysApply` in `.mdc` frontmatter are correct
- [ ] Tool usage is documented in `<tool-usage>` (behavioral, not a Copilot tool manifest)
- [ ] All skills referenced in `<skills-usage>` are existing skills in the project
- [ ] XML-like tags are properly opened and closed
- [ ] No workflow-specific instructions are embedded (those belong in skills)
- [ ] No coding standards are embedded (those belong in `AGENTS.md` or `eversis-project-stack.mdc`)
- [ ] Role is focused and distinct from existing rules
- [ ] Handoffs (if present) name the next **prompt** or **rule** to use

## Rule file structure (`.mdc`)

### Frontmatter (Cursor)

| Field | Required | Description |
|---|---|---|
| `description` | **Yes** | Short description; used for rule pickers and context. |
| `globs` | No | File patterns when the rule is auto-attached. Use a **YAML list** (one pattern per line, e.g. `- "**/*.tsx"`). |
| `alwaysApply` | No | `true` for always-on core behavior (use sparingly). |

**Three activation modes — choose one per rule:**

| Mode | When | Example rules |
|------|------|---------------|
| `alwaysApply: true` | Core behaviors present in every session. Keep minimal. | `eversis-agent-core.mdc`, `eversis-project-stack.mdc` |
| `globs: [...]` (YAML list) | Technology or layer-specific standards; activates when matching files are open. Prefix with `**/` for recursive matching. | `eversis-accessibility.mdc` |
| `globs: []`, `alwaysApply: false` | Role rules attached on demand with `@` in a prompt or Chat. | `eversis-engineering-manager.mdc`, `eversis-code-reviewer.mdc` |

### Body Sections

| Section | Required | Purpose |
|---|---|---|
| `<agent-role>` | **Yes** | Role definition, responsibilities, behavioral guidelines. |
| `<skills-usage>` | **Yes** | List of skills the agent uses with guidance for each. |
| `<tool-usage>` | **Yes** | Tool access rules and usage guidelines per tool. |
| `<domain-standards>` | No | Domain-specific standards and rules the agent enforces. |
| `<collaboration>` | No | Interaction patterns with other agents or team members. |
| `<constraints>` | No | Explicit limitations and anti-patterns for the agent. |
| `<output-format>` | No | Expected structure or format of the agent's deliverables. |

## XML Syntax Guidelines

All body content in the agent file must use XML-like tags for structure. Rules:

1. Every section uses a matching opening and closing tag: `<section-name>` ... `</section-name>`
2. Tags use lowercase-kebab-case naming
3. Nesting is allowed for sub-sections: `<tool>` inside `<tool-usage>`
4. Markdown formatting (bold, lists, tables, code blocks) is used inside XML tags for content
5. Avoid XML attributes for structural content — use nested tags or Markdown content instead. Exception: identifier attributes (e.g., `<tool name="...">`) are acceptable when they improve readability.

Example structure:
```xml
<agent-role>
Role: You are a...
</agent-role>

<tool-usage>
<tool name="context7">
- **MUST use when**: ...
- **SHOULD NOT use for**: ...
</tool>
</tool-usage>
```

## Connected Skills

- `eversis-creating-prompts` - to understand how prompts reference agents and ensure agents don't overlap with prompt responsibilities
- `eversis-creating-skills` - to ensure this skill's own structure follows the canonical skill creation requirements
- `eversis-technical-context-discovering` - to understand existing agent patterns in the project before creating a new one
- `eversis-codebase-analysing` - to analyze existing agents and identify patterns to follow
- `eversis-creating-instructions` - to understand when coding standards and project conventions belong in instruction files rather than agent definitions
