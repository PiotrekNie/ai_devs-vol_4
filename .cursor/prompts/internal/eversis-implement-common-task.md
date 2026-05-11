---
sidebar_position: 6
title: "Implement common task"
slug: implement-common-task
prompt_role: "Software engineer"
prompt_description: "Implement common feature according to the plan."
upstream_agent: "eversis-software-engineer"
---
# eversis-implement-common-task

:::info
Not invoked directly by users. To trigger implementation, use the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [Software Engineer](../../agents/software-engineer).
:::

**Agent:** Software Engineer
**File:** `.cursor/prompts/internal/eversis-implement-common-task.md`

The standard delegation prompt for general implementation tasks — backend logic, APIs, database changes, and non-UI frontend work.

## How It's Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

The Engineering Manager identifies application code tasks in the plan and delegates them to the Software Engineer automatically.

## What It Does

### 1. Context Discovery

- Reviews the implementation plan and feature context.
- Checks `*.instructions.md` for project-specific conventions and coding standards.
- Loads the `eversis-technical-context-discovering` and `eversis-implementation-gap-analysing` skills.
- Gathers build, test, and lint commands for the project.

### 2. Implementation

- Follows the plan step by step — no deviations without explicit approval.
- Runs tests and linters before starting and after each phase.
- Loads `eversis-sql-and-database-understanding` when working with database schemas, migrations, or ORM-based data access.
- Updates plan checkboxes after completing each task step.

### 3. Verification

- Ensures all tasks in the plan are completed.
- Validates acceptance criteria before handing over to review.
- Documents any changes to the original plan in the Changelog section with timestamps.

## Skills Loaded

- `eversis-technical-context-discovering` — Establishes project conventions before implementing.
- `eversis-implementation-gap-analysing` — Verifies current state before making changes.
- `eversis-sql-and-database-understanding` — When working with databases, migrations, queries, or ORMs.

---

## Executable prompt (attach in Cursor)

Your goal is to implement the feature according to the provided implementation plan and feature context.

Thoroughly review the implementation plan and feature context before starting the implementation. Ensure a clear understanding of the requirements and technical designs to deliver effective solutions.

Use available tools to gather necessary information and document your findings.

Don't deviate from the implementation plan. Follow it step by step to ensure all requirements are met.

If you need to make changes to the original solution during implementation, wait for a confirmation before proceeding. Also, ensure to document those changes in the specified plan file in Changelog section. This helps maintain clarity and ensures that all modifications are tracked.

## Required Skills

Before starting, load and follow these skills:
- `eversis-technical-context-discovering` - to establish project conventions, coding standards, and existing patterns
- `eversis-implementation-gap-analysing` - to verify current state before making changes
- `eversis-sql-and-database-understanding` - when implementing database schemas, migrations, SQL queries, ORM-based data access, or working with transactions and locking
- `eversis-implementing-backend` - when implementing backend API features: REST/GraphQL endpoints, DataGrid filtering/pagination, database handling, JWT authentication, external service adapters, logging, and Docker setup

## Workflow

1. Review the implementation plan and feature context thoroughly.
2. Review all project copilot instructions (`*.instructions.md`) and the codebase to understand the existing architecture, coding standards, and any relevant guidelines.
3. Gather a list of commands you will need during implementation: running tests (unit, integration, E2E and others), linters, building the project, running and generating migrations, etc. Run tests and linters **before** starting implementation and **after** completing each phase.
4. Focus only on the implementation plan. Don't implement anything not part of the plan unless explicitly instructed.
5. Don't implement improvements from the plan's improvements section unless explicitly instructed.
6. Start implementing the feature according to the plan, following each task step by step.
7. After completing each task step, update the relevant plan to reflect progress by checking the box for the completed task step.
8. Before making any changes to the original solution during implementation, ask for confirmation. Document those changes in the plan file's Changelog section with timestamps.
9. Before handing over to review, ensure all tasks in the delegated scope have been completed and the feature meets the defined requirements. Update the acceptance criteria checklist after every verified item.

Ensure to write clean, efficient, and maintainable code following best practices and coding standards for the project.

<!-- Eversis port; upstream: eversis-implement-common-task -->
