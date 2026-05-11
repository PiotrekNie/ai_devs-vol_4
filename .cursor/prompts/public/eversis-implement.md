---
sidebar_position: 4
title: "Implement"
slug: implement
prompt_role: "Engineering Manager"
prompt_description: "Implement feature according to the plan."
upstream_agent: "eversis-engineering-manager"
---
# eversis-implement

**Agent:** Engineering Manager  
**File:** `.cursor/prompts/public/eversis-implement.md`

Orchestrates the implementation of a feature by delegating tasks from the plan to specialized agents.

## Usage

```text
@eversis-implement
<JIRA_ID or task description — if applicable>
```

In **Cursor**, attach the file above (or open it and reference it with `@`) plus your ticket text and context.

## What It Does

1. Reviews the implementation plan and feature context thoroughly.
2. Creates a **todo for every task** in the plan — each task gets its own tracked item.
3. Delegates codebase analysis to the **Architect** agent to establish project conventions and patterns.
4. Processes each task in plan order, delegating based on task type:
   - **`[CREATE]` / `[MODIFY]`** → delegates to **Software Engineer** (app code), **DevOps Engineer** (infrastructure), or **E2E Engineer** (tests).
   - **`[REUSE]`** → executes as described in the task definition (e.g., UI verification via **UI Reviewer**).
5. After each task, updates plan checkboxes and runs quality checks (tsc, lint, build).
6. Asks for confirmation before deviating from the plan.
7. Documents all changes in the plan's Changelog section.
8. **Automatically runs Code Reviewer** at the end if no review phase is defined.
9. **Produces a mandatory QA comment draft** on declaring **Fine** — follows `eversis-qa-comment` for structure and readability rules; human approves before any Jira post.

## How Delegation Works

The Engineering Manager automatically delegates each task to the right agent based on the plan:

| Task Type | Agent |
|---|---|
| Backend / general code | Software Engineer |
| Frontend with Figma | Software Engineer |
| E2E tests | E2E Engineer |
| Infrastructure (Kubernetes, Terraform, CI/CD, observability) | DevOps Engineer |
| UI verification | UI Reviewer |
| LLM application prompts | Prompt Engineer |

## Key Behaviors

- **Orchestrates, never implements** — Delegates all coding to specialized agents.
- **Strictly follows the plan** — No deviations unless explicitly approved.
- **Tracks progress with todos** — Each plan task gets its own tracked item.
- **Runs quality checks after each task** — Ensures nothing breaks as implementation progresses.
- **Auto-triggers Code Reviewer** — Ensures every implementation gets reviewed.

## Output

- Code changes applied by delegated agents as specified in the plan.
- Updated plan checkboxes showing completion status.
- Changelog entries for any modifications.
- Code review findings from the automatic `eversis-code-reviewer` run.

---

## Executable prompt (attach in Cursor)

Your goal is to implement the feature according to the provided implementation plan and feature context.

## Workflow

1. **Review the current state of the task** - Check what's already done and decide whether you have enough context and information to start the implementation or if you need to delegate to Context engineer agent to gather more context and requirements before starting the implementation. If the plan is missing, delegate to Architect agent to create a detailed implementation plan based on the feature context and requirements.

2. **Review the plan** — Read the implementation plan and feature context thoroughly. Identify every task, its type (`[CREATE]`, `[MODIFY]`, `[REUSE]`), and which agent should handle it. Create a **todo for every task** in the plan — not one per phase. Each task gets its own todo.

   **Inventory UI verification tasks** — Scan the entire plan for `[REUSE]` tasks that involve UI reviewer or Figma verification. Also scan the plan — and the research file (`*.research.md`) if one exists — for all Figma URLs. Build an explicit list of UI components that require verification. You will use this inventory as a checklist — every item must be verified before code review.

3. **Confirm dev server URL** — If your UI verification inventory from step 2 contains ANY tasks, **ask the user in chat** for the dev server URL now (e.g., "What URL is the frontend app running at?"). Do not defer this — you need the confirmed URL before any UI verification can start. Do not guess from running processes or port scans. Store the confirmed URL for all subsequent verifications.

4. **Confirm with user before implementation** — After research and planning, **ask the user in chat** for confirmation before starting broad implementation.

5. **Delegate codebase analysis** — Use Architect agent to perform codebase analysis and technical context discovery to establish project conventions, coding standards, architecture patterns, and existing codebase patterns before implementing any feature. This will help you identify which agents to delegate specific tasks to during implementation.

6. **Process each task in plan order.** For each task, based on its type:
   - **`[CREATE]` or `[MODIFY]`** → delegate to the appropriate agent (Software engineer for application code, DevOps engineer for infrastructure, Prompt engineer for LLM prompts). After the agent completes, run quality checks (tsc, lint, build).

   - **`[REUSE]` — UI verification tasks** → These tasks MUST be processed — do NOT skip them. For each, run a focused **Agent** turn with [`eversis-review-ui.md`](./review-ui) attached, passing: the Figma URL (MCP: `figma`), the confirmed dev server URL from step 3 (MCP: `playwright`), and the component/section name. For the full verify-fix loop, follow [`eversis-implement-ui.md`](../internal/implement-ui).

   - **`[REUSE]` — other tasks** → execute as described in the task definition — the task specifies which agent to delegate to and what context to pass.

7. **After each task**, update the relevant plan to reflect progress by checking the box for the completed task step and:
   - Review the implementation against the plan and feature context to ensure all requirements are met.
   - Run static code analysis, build the project, and run unit and integration tests to verify that the implementation works as expected and does not introduce new issues.

8. **UI Verification Gate — MANDATORY before code review** — Before delegating code review, verify that **every** `[REUSE]` UI verification task from your step 2 inventory has been processed. Check each item:
   - Was it delegated to UI reviewer?
   - Did it receive a PASS, or was it escalated to the user with explicit approval to skip?

   If ANY UI verification task was not processed, go back and process it now. Do NOT proceed to code review with unverified UI components. If verification cannot be completed (tool errors, missing Figma links), document it in the plan's Changelog and get explicit user approval before continuing.

9. **Delegate code review** — Run code review with [`eversis-review.md`](./review) attached. Include E2E test execution as part of the review. The reviewer runs all quality gates (unit, integration, E2E tests, linting, build).

10. **Declare Fine and produce the QA comment draft** — When declaring **Fine**, produce the QA comment draft **in the same response** following the **`eversis-qa-comment`** skill (load via `eversis-collections` MCP / `eversis_skills_get`, or read `.cursor/skills/eversis-qa-comment/SKILL.md` directly). Label it: `**Draft QA comment — review before posting to Jira**`. Do **not** post to Jira in this turn. Only call `addCommentToJiraIssue` (Atlassian MCP) after the human **explicitly** approves the text and provides the issue key.

11. **Before making any changes** to the original solution during implementation, ask for confirmation. Document changes in the plan file's Changelog section with timestamps.

Ensure to write clean, efficient, and maintainable code following best practices and coding standards for the project.

<!-- Eversis port; upstream: eversis-implement -->
