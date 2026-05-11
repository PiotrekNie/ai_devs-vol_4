---
sidebar_position: 8
title: "Implement ui"
slug: implement-ui
prompt_role: "Engineering Manager"
prompt_description: "Implement UI feature according to the plan, orchestrating iterative Figma verification until pixel-perfect."
upstream_agent: "eversis-engineering-manager"
---
# eversis-implement-ui

:::info
Not invoked directly by users. The UI implementation workflow is triggered via the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) uses this internal prompt to orchestrate UI tasks with Figma verification.
:::

**Agent:** Engineering Manager  
**File:** `.cursor/prompts/internal/eversis-implement-ui.md`

Orchestrates the implementation of UI features with iterative Figma verification, delegating to specialized agents.

## How It's Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

When the implementation plan contains UI tasks with Figma references, the Engineering Manager automatically uses this internal prompt to manage the verification loop.

## What It Does

Everything from the [eversis-implement](../public/implement) public prompt, plus:

1. **Extracts Figma URLs** from the research and plan files.
2. **Confirms dev server URL** with the user before the first verification.
3. **Delegates UI implementation** to the Software Engineer with Figma design context.
4. **Delegates UI verification** to the `eversis-ui-reviewer` subagent after each UI component:
   - If PASS → moves to next component.
   - If FAIL → delegates fix to Software Engineer, then re-runs verification.
   - Maximum **5 iterations** per component, then escalates.
5. **Produces a UI Verification Summary** before handing off to code review.

## Verification Loop

```
BEFORE starting:
    0. Ensure Figma URL is available → if not, ASK user

REPEAT (max 5 iterations):
    1. Run eversis-ui-reviewer subagent to verify current implementation
    2. If PASS → done, exit loop
    3. If FAIL → fix reported differences → go to step 1
```

:::warning
The Software Engineer never verifies UI itself. It delegates to the `eversis-ui-reviewer` subagent which uses Figma MCP and Playwright to extract and compare data. Mental comparison or code reading is not verification.
:::

### Confidence Levels

- **HIGH** — Fix code to match EXPECTED values exactly.
- **MEDIUM** — Fix obvious differences, manually verify unclear ones.
- **LOW** — Manually verify before making changes; tool data may be incomplete.

### Escalation (after 5 iterations)

Stops the loop and prepares an escalation report with:

- Summary of each iteration.
- Remaining mismatches.
- Suspected root causes.
- Recommended next steps.

## Additional Skills Loaded

- `eversis-implementing-frontend` — Component patterns, design system usage, composition.
- `eversis-ui-verifying` — Verification criteria, tolerances, PASS/FAIL definitions.
- `eversis-ensuring-accessibility` — WCAG 2.1 AA compliance, semantic HTML, ARIA.
- `eversis-technical-context-discovering` — Project conventions before implementing.

## Output

Everything from `eversis-implement` (the public prompt), plus:

- UI Verification Summary listing verified components, iterations per component, design gaps, and deviations with rationale.

---

## Executable prompt (attach in Cursor)

Your goal is to implement the UI feature according to the provided implementation plan and feature context, orchestrating iterative verification against Figma designs until the implementation matches within agreed tolerances.

## Design References from Research & Plan

Before delegating tasks, open the research file (`*.research.md`) and plan file (`*.plan.md`) to find all Figma URLs:

- In the **research file**, look for:
  - Figma URLs in the `Relevant Links` section.
  - Specific component/node links mentioned in `Gathered Information`.
- In the **plan file**, look for:
  - Figma URLs and design references in `Task details`.
  - A structured "Design References" subsection mapping views/components to Figma URLs or node IDs.

Use these URLs when delegating to both Software engineer (implementation context) and UI reviewer (verification target).

### When Figma link is missing

If you cannot find a Figma URL for a component/section that needs verification:

1. **Stop** — do not delegate implementation or verification for that component
2. **Ask the user** to provide the Figma link for the specific section
3. **Wait for the link** before proceeding
4. **Add the link** to the plan file once provided (in `Task details` or `Design References`)

Do NOT skip verification or delegate without a Figma reference.

## Workflow

1. **Review the plan** — Review the implementation plan and feature context thoroughly. Identify which tasks are UI implementation tasks (need Figma verification) and which are non-visual tasks. Extract all Figma URLs from the research/plan files.

2. **Delegate codebase analysis** — Use Architect agent to perform codebase analysis and technical context discovery to establish project conventions, coding standards, architecture patterns, and existing codebase patterns before implementing.

3. **Confirm dev server URL** — **Ask the user in chat** for the dev server URL now (e.g., "What URL is the frontend app running at? Is it http://localhost:3000?"). Do not defer this to later — you need the confirmed URL before any verification can start. Do not guess from running processes or port scans — multiple services may run on different ports. Use the confirmed URL for all subsequent verifications in this session.

4. **Delegate UI implementation** — For each UI implementation task, delegate to Software engineer using [`eversis-implement-ui-common-task.md`](./implement-ui-common-task). Pass the relevant Figma URLs, component context, and plan section. For non-Figma frontend and backend tasks, use [`eversis-implement-common-task.md`](./implement-common-task).

5. **Delegate UI verification** — After each UI implementation task completes, delegate verification to UI reviewer: run a focused Agent turn with [`eversis-review-ui.md`](../public/review-ui) attached. Pass: the Figma URL, the user-confirmed dev server URL from step 3, and the component/section name. The UI reviewer compares the Figma design against the running implementation and returns a structured report. **Note:** You may not have `figma` or `playwright` in this session; the verification prompt assumes those MCP tools are available to the sub-task. Never skip verification because tools are not in your own list—delegate the verification turn instead.

6. **Handle verification results**:
   - If **PASS** → mark the task and its verification step as complete in the plan. Move to the next task.
   - If **FAIL** → delegate fix to Software engineer — pass the **complete** verification report and explicitly instruct the engineer to fix **ALL** listed differences, not just the first one. After the fix, re-delegate verification to UI reviewer. Repeat up to **5 iterations per component**.
   - After 5 failed iterations → **escalate**: list remaining mismatches with the Figma URL, describe what was tried in each iteration, state the suspected root cause, document in the plan's Changelog, and ask the user for guidance.

7. **Handle confidence levels** from verification reports:
   - **HIGH** confidence: fix exactly as reported
   - **MEDIUM** confidence: fix obvious issues, ask user about unclear ones
   - **LOW** confidence: ask user before making any changes — tool data may be incomplete

8. **Update the plan** — After completing each task step, update the plan to reflect progress (check the box). Note the verification result (PASS, number of iterations, or escalation).

9. **Run quality checks after each phase** — Run static code analysis, build the project, run unit and integration tests to verify nothing is broken.

10. **Before code review — UI Verification Summary** — Before delegating code review, compile:

- Components/sections verified by UI reviewer
- Number of verification iterations per component
- Design gaps discovered and how they were handled
- Any deviations from design with rationale

11. **Delegate code review** — Use [`eversis-review.md`](../public/review). Include E2E test execution as part of the review. The reviewer runs all quality gates (unit, integration, E2E tests, linting, build).

## Verification Rules

1. Every UI component must be verified by UI reviewer — minimum once per component, no exceptions
2. Fix all reported differences — do not skip or rationalize
3. Re-delegate verification after every fix — never assume a fix worked
4. Maximum 5 iterations per component — escalate if still failing
5. Check confidence level — LOW confidence means tool data may be incomplete

## Verification Gate — Do Not Proceed Without Real Verification

Before proceeding from a UI verification step to the next task or to code review, confirm that the UI reviewer actually performed a **real Figma+Playwright comparison**. A valid verification report must contain:

- Data extracted from Figma via `figma` (design specifications)
- Data captured from the running app via `playwright` (screenshots, computed styles, accessibility snapshot)
- A structured comparison with EXPECTED vs ACTUAL values

**If the report is missing either side of the comparison** (e.g., the reviewer only read source code files, or skipped Playwright because of a blocker), the verification is **INVALID**. Do not accept it. Instead:

1. Identify why verification failed (wrong URL? auth blocker? tool error?)
2. Ask the user to resolve the blocker (provide correct URL, credentials, or manual verification)
3. Re-delegate to UI reviewer once the blocker is resolved
4. Only proceed when you have a valid verification report or the user explicitly instructs you to skip

**Never proceed to code review with unverified UI components.** If verification cannot be completed for a component, document it in the plan's Changelog and get explicit user approval before moving to code review.

## Fallback: When UI reviewer Returns Errors

If UI reviewer consistently returns LOW confidence or tool errors:

1. Do not continue the loop blindly
2. Ask the user if they can verify manually (open Figma + app side-by-side)
3. Document the issue in the plan's Changelog
4. Continue with next component or escalate

<!-- Eversis port; upstream: eversis-implement-ui -->
