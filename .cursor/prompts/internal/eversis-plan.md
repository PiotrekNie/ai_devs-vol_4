---
sidebar_position: 10
title: "Plan"
slug: plan
prompt_role: "Architect"
prompt_description: "Prepare detailed implementation plan for given feature."
upstream_agent: "eversis-architect"
---
# eversis-plan

:::info
Not invoked directly by users. To trigger implementation planning, use the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [Architect](../../agents/architect) when a plan is needed.
:::

**Agent:** Architect  
**File:** `.cursor/prompts/internal/eversis-plan.md`

Creates a detailed, phased implementation plan from the research context.

## How It's Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

The Engineering Manager identifies that no implementation plan exists and delegates planning to the Architect automatically.

## What It Does

1. **Analyzes context** — Reviews the `.research.md` file and cross-checks with best practices.
2. **Analyzes tech stack** — Identifies domain-specific best practices.
3. **Verifies current implementation** — Searches the codebase for existing components, functions, and utilities related to the feature.
4. **Understands project standards** — Reviews `*.instructions.md` files.
5. **Prepares implementation plan** — Creates detailed phases with code changes.
6. **Defines tasks** — Each task has a clear title, description, action type (`[CREATE]`/`[MODIFY]`/`[REUSE]`), and definition of done checklist.
7. **Addresses security** — Includes security considerations.
8. **Defines testing** — Guidelines for validation.
9. **Controls scope** — Only plans changes for THIS task; documents improvements separately.

## Skills Loaded

- `eversis-architecture-designing` — Architecture design process and plan template.
- `eversis-codebase-analysing` — Analyze existing codebase.
- `eversis-implementation-gap-analysing` — Verify what exists vs what needs to be built.
- `eversis-technical-context-discovering` — Understand project conventions and patterns.
- `eversis-sql-and-database-understanding` — When the feature involves database changes.

## Output

A `.plan.md` file placed in `specifications/<task-name>/`:

```text
specifications/
  user-authentication/
    user-authentication.research.md
    user-authentication.plan.md    ← new
```

The plan includes checklist-style phases, tasks with `[CREATE]`/`[MODIFY]`/`[REUSE]` action types, acceptance criteria, security considerations, and testing guidelines.

:::tip
Review the plan thoroughly. Confirm scope, phases, and acceptance criteria before starting implementation.
:::

---

## Executable prompt (attach in Cursor)

Analyze the feature context file for the provided task or Jira ID. Based on it, prepare a detailed implementation plan that a software engineer can follow step by step to deliver the feature.

The file outcome should be a markdown file named after the task Jira ID in kebab-case format or after task name (if no Jira task provided) with `.plan.md` suffix (e.g., `user-authentication.plan.md`). The file should be placed in `docs/specs/` (or your team's `specifications/` folder) under a folder named after the issue ID or the shortened task name in kebab-case format.

## Required Skills

Before starting, load and follow these skills:

- `eversis-architecture-designing` - for the architecture design process and output template (`plan.example.md`)
- `eversis-codebase-analysing` - for analyzing the existing codebase
- `eversis-implementation-gap-analysing` - for verifying what exists vs what needs to be built
- `eversis-technical-context-discovering` - for understanding project conventions and patterns
- `eversis-sql-and-database-understanding` - when the feature involves database schema design, data model changes, migrations, or query-heavy implementation

## Workflow

1. **Analyze context**: Review the feature context file (`.research.md`) thoroughly to understand the requirements and scope. Cross-check with industry, domain, and company best practices.
2. **Analyze tech stack**: Understand the project's tech stack, industry, and domain to identify best practices for implementation.
3. **Verify current implementation**: Before planning, perform a thorough analysis of the existing codebase:
   - Use semantic search to find components, functions, hooks, utilities, or files related to the feature requirements.
   - Identify what is already implemented and functional.
   - Identify what exists but needs modification or extension.
   - Identify what needs to be created from scratch.
   - Document findings in the "Current Implementation Analysis" section.
4. **Understand project standards**: Review project best practices and quality standards (check `*.instructions.md` files).
5. **Prepare implementation plan**: Create detailed code changes broken down into phases.
6. **Define tasks**: For each phase, identify specific tasks with:
   - Clear title
   - Description of what the task entails
   - Action type: `[CREATE]`, `[MODIFY]`, or `[REUSE]`
   - Definition of done as a checkbox list for each task
7. **Address security**: Include security considerations relevant to the implementation.
8. **UI verification tasks**: For features with UI components based on Figma designs, add a `[REUSE]` UI verification task immediately after each implementation task that produces visible UI. The verification task should reference UI reviewer agent, include the Figma URL, and describe the verify-fix loop (max 5 iterations). Non-visual tasks (data fetching, state management, API integration) do not need verification tasks.
9. **Save the plan**: Follow the `plan.example.md` template from the `eversis-architecture-designing` skill strictly.
10. **Scope control**: Focus ONLY on changes specific to THIS task. Do not include prerequisite work or dependencies - assume those are already done. Do not plan features not in the original requirements (document them separately in an Improvements section).
11. **Avoid duplication**: Never plan to create components, functions, or utilities that already exist. Use the "Current Implementation Analysis" section and plan to reuse or modify existing code.
12. **Bug fixes**: When planning bug fixes, include steps to reproduce the issue, root cause analysis, and implementation of a fix verified by tests.

Don't provide deployment plans, code pushing instructions, or code review instructions in the repository.

Follow the template structure and naming conventions strictly to ensure clarity and consistency.

In case of any ambiguities or missing information for the planning, ask for clarification before finalizing the plan.

Update the plan file after each interaction if new information is gathered.

<!-- Eversis port; upstream: eversis-plan -->
