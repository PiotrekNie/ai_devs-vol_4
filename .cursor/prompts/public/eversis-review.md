---
sidebar_position: 6
title: "Review"
slug: review
prompt_role: "Code reviewer"
prompt_description: "Check the implementation against the plan and feature context."
upstream_agent: "eversis-code-reviewer"
---
# eversis-review

**Agent:** Code Reviewer  
**File:** `.cursor/prompts/public/eversis-review.md`

Performs a structured code review against the implementation plan and feature context.

## Usage

```text
@eversis-review
<JIRA_ID or task description — if applicable>
```

In **Cursor**, attach the file above (or open it and reference it with `@`) plus your ticket text and context.

## What It Does

1. **Understands context** — Loads `.research.md` and `.plan.md` files, reviews `*.instructions.md` for project guidelines.
2. **Reviews implementation** — Focuses on correctness, code quality, security, testing, and documentation.
3. **Verifies definition of done** — Checks each item from the plan's task definitions; marks completed items.
4. **Verifies acceptance criteria** — Checks each item from the plan's acceptance criteria checklist.
5. **Summarizes findings** — Provides a summary with issues and recommendations.
6. **Documents results** — Adds a "Code Review Findings" section to the plan file.
7. **Updates changelog** — Records that code review was performed.

## Skills Loaded

- `eversis-code-reviewing` — Structured review covering correctness, quality, security, testing, best practices, scalability.
- `eversis-implementation-gap-analysing` — Compare implementation against the plan for completeness.
- `eversis-technical-context-discovering` — Understand project conventions and coding standards.
- `eversis-sql-and-database-understanding` — When reviewing database-related changes.

## Output

- Updated plan file with checked definition-of-done and acceptance criteria items.
- "Code Review Findings" section added to the plan file.
- Changelog entry indicating code review was performed.

## Review Categories

| Category | What It Covers |
|---|---|
| **Correctness** | Code functions as intended, meets requirements |
| **Code Quality** | Clean, efficient, maintainable, follows standards |
| **Security** | No vulnerabilities, proper security measures |
| **Testing** | Appropriate tests covering necessary scenarios |
| **Documentation** | Well-documented code with comments |
| **Acceptance Criteria** | Each item verified individually |

---

## Executable prompt (attach in Cursor)

Your goal is to review the implementation against the provided implementation plan and feature context.

Make sure to review not only the code and its acceptance criteria but also consider security aspects, code quality, testing coverage, and documentation.

## Required Skills

Before starting, load and follow these skills:
- `eversis-code-reviewing` - for the structured code review process covering correctness, quality, security, testing, best practices, and scalability
- `eversis-implementation-gap-analysing` - to compare the implemented solution against the plan and verify completeness
- `eversis-technical-context-discovering` - to understand project conventions and coding standards to review against
- `eversis-sql-and-database-understanding` - when reviewing database-related changes: schema design, migration safety, query performance, index coverage, and ORM usage
- `eversis-engineering-prompts` - when reviewing LLM prompt code: verify prompt structure, injection defenses, delimiter separation, output format specification, anti-patterns, and optimization opportunities

## Workflow

1. **Understand context**: Load the `*.research.md` and `*.plan.md` files to understand the task requirements and implementation plan. Ensure to review `*.instructions.md` files for project-specific guidelines.
2. **Review implementation**: Focus on code correctness, code quality, security, testing, and documentation.
3. **Verify definition of done**: Check each item from the tasks' definition of done defined in the plan phases. When the definition of done is met, check the box for the completed item in the plan document.
4. **Verify acceptance criteria**: Check each item from the acceptance criteria checklist in the plan file. When the acceptance criteria is met, check the box for the completed item.
5. **Verify quality gates**: Run all relevant tests (unit, integration, E2E) and ensure they pass. Run static code analysis tools, linters, and formatting tools to ensure code quality. Make sure to check app build and docker build if applicable.
6. **Summarize findings**: Provide a summary of findings, including any issues identified and recommendations for improvement.
7. **Document results**: Add findings to the plan file at the end in a new section named "Code Review Findings".
8. **Update changelog**: Add information that code review was performed to the changelog section of the plan file.

When it comes to updating the definition of done and acceptance criteria checklist, you can only update those by checking the box for completed items. Do not modify the text of those sections.

<!-- Eversis port; upstream: eversis-review -->
