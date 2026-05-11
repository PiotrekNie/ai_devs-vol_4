---
sidebar_position: 7
title: "Implement ui common task"
slug: implement-ui-common-task
prompt_role: "Software engineer"
prompt_description: "Implement UI feature according to the plan with frontend-specific setup and design reference handling."
upstream_agent: "eversis-software-engineer"
---
# eversis-implement-ui-common-task

:::info
Not invoked directly by users. To trigger UI implementation, use the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [Software Engineer](../../agents/software-engineer) via the internal [`eversis-implement-ui`](./implement-ui) prompt.
:::

**Agent:** Software Engineer
**File:** `.cursor/prompts/internal/eversis-implement-ui-common-task.md`

Extends the standard implementation workflow with UI-specific behaviors — Figma design references, frontend component patterns, and accessibility compliance.

## How It's Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

The Engineering Manager identifies UI tasks in the plan and delegates them to the Software Engineer via the internal `eversis-implement-ui` prompt, which passes Figma design context.

## What It Does

### 1. Design Reference Extraction

- Reads the research file (`*.research.md`) for Figma URLs in `Relevant Links` and `Gathered Information`.
- Reads the plan file (`*.plan.md`) for Figma URLs in `Task details` and `Design References`.
- If a Figma link is missing for a component, **stops and asks the user** before proceeding.

### 2. Implementation

- Follows the base workflow from `eversis-implement-common-task` plus UI-specific skills.
- Uses `figma` to extract exact design specs — spacing, color tokens, typography, component variants.
- Implements semantic HTML, design system tokens, and WCAG 2.1 AA accessibility patterns.

### 3. Verification

- After implementation, the Engineering Manager triggers the [eversis-review-ui](../public/review-ui) public prompt via the UI Reviewer for automated Figma comparison.
- Mismatches are fixed and re-verified in a loop (up to 5 iterations).

## Skills Loaded

- Everything from `eversis-implement-common-task`, plus:
- `eversis-implementing-frontend` — Component patterns, design system usage, composition, and performance.
- `eversis-ensuring-accessibility` — WCAG 2.1 AA compliance, semantic HTML, ARIA, keyboard navigation.
- `eversis-technical-context-discovering` — Project conventions before implementing.

---

## Executable prompt (attach in Cursor)

> **PREREQUISITE**: This prompt extends [`eversis-implement-common-task.md`](./implement-common-task). You MUST read and follow **all steps** from that base workflow first. This prompt adds UI-specific behaviors on top — it does not remove or replace any base workflow steps.

Implement the UI feature according to the **research context** and **implementation plan**, using Figma designs as the source of truth for visual implementation.

## Required Skills

In addition to the skills required by the base workflow, load and follow these skills before starting:

- `eversis-implementing-frontend` — for component patterns, design system usage, composition, and performance guidelines
- `eversis-ensuring-accessibility` — for WCAG 2.1 AA compliance, semantic HTML, ARIA, and automated axe-core verification
- `eversis-technical-context-discovering` — to establish project conventions before implementing

---

## Design References from Research & Plan

Always treat the **research** and **plan** files as the single source of truth for design links:

- Before starting implementation (during step 1–2 of the base workflow):
  - Open the **research file** (`*.research.md`) and look for:
    - Figma URLs in the `Relevant Links` section.
    - Any specific component/node links mentioned in `Gathered Information`.
  - Open the **plan file** (`*.plan.md`) and look for:
    - Figma URLs and design references in `Task details`.
    - If present, a structured "Design References" subsection mapping views/components to Figma URLs or node IDs.
- Use these Figma URLs as the **default source** for all `figma` calls during implementation.

### When Figma link is missing

If you cannot find a Figma URL for the component/section you are about to implement:

1. **Stop** — do not proceed with that component
2. **Ask the user** to provide the Figma link for the specific section
3. **Wait for the link** before proceeding with implementation
4. **Add the link** to the plan file once provided (in `Task details` or `Design References`)

Do NOT:

- Skip implementation because the link is missing
- Guess what the design should look like
- Proceed with implementation without a Figma reference

When you discover missing or updated design links during implementation, add them to the appropriate sections in the **plan** under `Task details` (and, if needed, note them in the Changelog).

---

## Additional Setup (before starting implementation)

Before step 6 of the base workflow (starting implementation), ensure:

- The local development server is running.
- You can access the page you're implementing (authenticated if needed).
- You have identified all relevant Figma URLs from the research/plan files.
- You understand the design system tokens and components available in the project.

---

## UI Verification Note

**UI verification against Figma is NOT your responsibility.** The Engineering Manager handles the verify-fix loop by delegating to UI reviewer. Focus only on implementing the UI according to the plan and design references. If you receive a verification report with issues to fix, apply the fixes and report back.

<!-- Eversis port; upstream: eversis-implement-ui-common-task -->
