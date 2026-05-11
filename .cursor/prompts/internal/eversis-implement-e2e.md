---
sidebar_position: 8
title: "Implement e2e"
slug: implement-e2e
prompt_role: "E2E engineer"
prompt_description: "Create, maintain, and execute E2E tests for given feature or user story."
upstream_agent: "eversis-e2e-engineer"
---
# eversis-implement-e2e

:::info
Not invoked directly by users. To trigger E2E test implementation, use the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [E2E Engineer](../../agents/e2e-engineer).
:::

**Agent:** E2E Engineer  
**File:** `.cursor/prompts/internal/eversis-implement-e2e.md`

Creates comprehensive end-to-end tests for a feature using Playwright.

## How It’s Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

The Engineering Manager identifies E2E test tasks in the plan and delegates them to the E2E Engineer automatically.

## What It Does

### 1. Context Gathering

- Determines input source (research/plan files, Jira ID, or prompt message).
- Checks `*.instructions.md` for project-specific conventions.
- Analyzes `playwright.config.ts` and existing Page Objects.
- Discovers existing test patterns and locator strategies.

### 2. Planning

Maps acceptance criteria to test scenarios:

| Acceptance Criterion | Scenario Type | Test Name |
|---|---|---|
| User can log in | Happy path | `should navigate to dashboard when login succeeds` |
| Invalid password shows error | Error | `should display error when login fails` |

### 3. Implementation & Verification

- Creates Page Objects with accessibility-first locators.
- Writes test files following `should [behavior] when [condition]` naming.
- Uses Playwright MCP for real-time browser interaction.
- Verifies tests pass 3+ consecutive times in headless mode.
- Follows the `eversis-e2e-testing` skill for patterns, mocking, and CI readiness.

### 4. Automatic Code Review

Runs `eversis-code-reviewer` agent automatically at the end to review E2E test quality.

## Skills Loaded

- `eversis-task-analysing` — Determine input source and gather requirements.
- `eversis-e2e-testing` — Page Object patterns, test structure, mocking strategies, verification loop.
- `eversis-technical-context-discovering` — Project conventions and test patterns.

## Output

```markdown
## E2E Test Summary

### Coverage
| Criterion | Test | Status |

### Results
| File | Pass | Fail | Flaky | CI |

### Issues
- BUG: [desc] → test.fixme()
- FLAKY: [desc] → needs investigation

### Files
- NEW: tests/auth/login.spec.ts
- NEW: pages/login.page.ts
```

---

## Executable prompt (attach in Cursor)

# E2E Test Workflow

**Non-interactive** - make reasonable decisions, document them.

## Required Skills

Before starting, load and follow these skills:
- `eversis-task-analysing` - to determine the input source and gather task requirements
- `eversis-technical-context-discovering` - to establish test conventions, existing patterns, and project configuration
- `eversis-e2e-testing` - for Page Object patterns, test structure, mocking strategies, verification loop rules, error recovery, and CI readiness checklist

---

## 1. Context

Follow the `eversis-task-analysing` skill's **Step 0 (Determine input source)** to identify whether context comes from research/plan files, a Jira ID, or directly from the prompt message.

Additionally, always:
- Check `*.instructions.md` → project-specific conventions
- Analyze `playwright.config.ts` + existing Page Objects
- Discover existing test patterns and locator strategies in the codebase

---

## 2. Planning

Map acceptance criteria to scenarios:

| Acceptance Criterion | Scenario Type | Test Name |
|---------------------|---------------|-----------|
| [from plan/prompt] | Happy/Error/Edge | `should [behavior] when [condition]` |

Checklist:
- [ ] Each criterion → at least one test
- [ ] API mocking needs documented
- [ ] Page Objects to create listed

---

## 3. Implementation & Verification

Follow the `eversis-e2e-testing` skill for:
- Page Object patterns and test structure
- Mocking strategies (external APIs only)
- Verification loop rules and iteration limits
- Error recovery procedures
- CI readiness checklist

---

## 4. Summary (required output)

```markdown
## E2E Test Summary

### Coverage
| Criterion | Test | Status |
|-----------|------|--------|
| [from plan/prompt] | [file#test] | ✅/❌ |

Coverage: X/Y (Z%)

### Results
| File | Pass | Fail | Flaky | CI |
|------|------|------|-------|-----|
| login.spec.ts | 5 | 0 | 0 | ✅ |

### Issues
- 🐛 BUG: [desc] → test.fixme()
- ⚠️ FLAKY: [desc] → needs investigation

### Files
- NEW: tests/auth/login.spec.ts
- NEW: pages/login.page.ts
```

Update plan (if plan file exists): check acceptance criteria, add files to Change Log.

---

## 5. Code Review (next step)

After completing E2E test implementation, run a review with [`eversis-review.md`](../public/review) attached, scoped to the new tests. Update the plan changelog with review findings.

<!-- Eversis port; upstream: eversis-implement-e2e -->
