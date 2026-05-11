---
sidebar_position: 9
title: "Research"
slug: research
prompt_role: "Context engineer"
prompt_description: "Prepare a context for a specific task or feature from a context engineering perspective."
upstream_agent: "eversis-context-engineer"
---
# eversis-research

:::info
Not invoked directly by users. To trigger research, use the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [Context Engineer](../../agents/context-engineer) when research is needed.
:::

**Agent:** Context Engineer  
**File:** `.cursor/prompts/internal/eversis-research.md`

Prepares a comprehensive context document for a task from a context engineering perspective.

## How It's Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

The Engineering Manager identifies that the task is missing necessary context and delegates research to the Context Engineer automatically.

## What It Does

1. Gathers all information related to the task from the codebase, Jira, Confluence, and other sources.
2. Analyzes the task thoroughly, including parent tasks and subtasks.
3. Analyzes the tech stack, industry, and domain for best practices.
4. Checks external links and Confluence pages linked to the task.
5. Reviews Figma designs via Figma MCP (if linked to the task).
6. Identifies ambiguities and asks for clarification before finalizing.
7. Focuses on requirements, user stories, acceptance criteria, and key flows.

## Skills Loaded

- `eversis-task-analysing` — Structured research process and output template.
- `eversis-codebase-analysing` — Analyze existing codebase in the context of task requirements.

## Output

A `.research.md` file placed in `specifications/<task-name>/`:

```text
specifications/
  user-authentication/
    user-authentication.research.md
```

The file contains all relevant information needed to build comprehensive context: task summary, requirements, user stories, acceptance criteria, assumptions, open questions, and suggested next steps.

:::tip
Review the generated research document carefully. Verify accuracy and iterate as many times as needed until the context is complete and correct.
:::

---

## Executable prompt (attach in Cursor)

Research the task based on the provided Jira ID or task description.

The file outcome should be a markdown file named after the task Jira ID in kebab-case format or after task name (if no Jira task provided) with `.research.md` suffix (e.g., `user-authentication.research.md`). The file should be placed in `docs/specs/` (or your team's `specifications/` folder) under a folder named after the issue ID or the shortened task name in kebab-case format.

It should contain every relevant information needed to build a comprehensive context for the task or feature.

## Required Skills

Before starting, load and follow these skills:
- `eversis-task-analysing` - for the structured research process and output template
- `eversis-codebase-analysing` - for analyzing the existing codebase in the context of task requirements

## Workflow

1. Gather all information related to the task from the codebase, Atlassian tools (Jira, Confluence) and other relevant sources.
2. Analyze the task thoroughly, including its parents and subtasks if applicable, to get the full picture of the requirements.
3. Analyse the tech stack, industry and domain of the project to understand best practices that should be applied during implementation.
4. Check all external links added to the task. Make sure to check the confluence pages linked to the task to gather more information about requirements and processes. If any PDF documents are attached, referenced, or linked, use the `pdf-reader` tool to extract and review their content.
5. Unless asked to research only non-frontend aspects, in case there are Figma designs linked to the task, review all of them using `figma` (it's very important) and include relevant information in the context.
6. Analyze if there are any ambiguities or missing information in the task description. If there are any ask for clarification before finalizing the context.
7. Don't provide implementation details, focus on gathering requirements, user stories, acceptance criteria and key flows.
8. Save the gathered information following the `research.example.md` template from the `eversis-task-analysing` skill.
9. Ensure that the research file is clear, concise, and tailored to the needs of the development team.

Follow the template structure and naming conventions strictly to ensure clarity and consistency.

In case of any ambiguities or missing information in the task description, ask for clarification before finalizing the context.

Update the research file after each interaction if new information is gathered.

<!-- Eversis port; upstream: eversis-research -->
