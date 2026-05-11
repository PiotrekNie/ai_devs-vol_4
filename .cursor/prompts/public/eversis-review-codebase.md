---
sidebar_position: 9
title: "Review codebase"
slug: review-codebase
prompt_role: "Architect"
prompt_description: "Perform a comprehensive code quality analysis: dead code, duplications, and improvement opportunities."
upstream_agent: "eversis-architect"
---
# eversis-review-codebase

**Agent:** Architect  
**File:** `.cursor/prompts/public/eversis-review-codebase.md`

Performs a comprehensive code quality analysis covering dead code, duplications, and improvement opportunities.

## Usage

```text
@eversis-review-codebase
(no arguments — optional focus in chat)
```

In **Cursor**, attach the file above (or open it and reference it with `@`) plus your ticket text and context.

## What It Does

### Phase 1: Context Discovery

- Loads project conventions from `eversis-technical-context-discovering` skill.
- Identifies repository type (monorepo vs single system).
- Identifies tech stack, frameworks, and dependencies per layer/app.

### Phase 2: Codebase Analysis

Runs parallel subagents per layer/app to detect:

**Dead Code:**
- Unused imports, exports, components, routes, and endpoints.
- Unreachable code paths.
- Deprecated code no longer referenced.
- Files not imported anywhere.
- Code only imported in its own test file.

**Duplications:**
- Duplicated functions, UI components, API patterns.
- Duplicated validation logic, utilities, type definitions.
- Copy-pasted code blocks differing only in variable names.

**Improvement Opportunities:**
- High cyclomatic complexity, deeply nested logic.
- Single Responsibility Principle violations.
- Missing or inconsistent error handling.
- Excessive use of `any` in TypeScript.
- Outdated patterns that could be modernized.
- Performance issues and security concerns.

### Phase 3: Architecture Review

- Module/package boundary evaluation.
- Shared code extraction assessment.
- Dependency graph analysis (circular dependencies).
- Separation of concerns verification.

### Phase 4: Report Generation

All findings are prioritized:
- 🔴 **Critical** — Must be fixed (bugs, security issues, maintenance burden).
- 🟡 **Important** — Should be fixed (quality, readability, maintainability).
- 🟢 **Nice to Have** — Optional (polish, optimization).

## Skills Loaded

- `eversis-codebase-analysing` — Structured analysis process.
- `eversis-technical-context-discovering` — Project conventions and architecture patterns.
- `eversis-code-reviewing` — Code quality standards and security considerations.

## Output

A `code-quality-report.md` file saved to the repository root, containing:

- Executive summary of overall code health.
- Findings organized by layer/app.
- Dead code, duplications, and improvement tables with file paths and line numbers.
- Architecture observations.
- Summary counts by severity.
- Recommended action plan (immediate, short-term, long-term).

---

## Executable prompt (attach in Cursor)

Your goal is to perform a thorough code quality analysis of the repository. The analysis should cover dead code detection, code duplication identification, and improvement proposals. The results must be saved to a markdown report file.

## Required Skills

Before starting, load and follow these skills:
- `eversis-codebase-analysing` - for the structured codebase analysis process only (note: this prompt's "Report Structure" section overrides any report/template instructions from the skill)
- `eversis-technical-context-discovering` - to understand project conventions, architecture patterns, and established practices
- `eversis-code-reviewing` - for code quality standards, best practices verification, and security considerations

## Workflow

### Phase 1: Context Discovery

1. Load and follow the `eversis-technical-context-discovering` skill to understand project conventions, coding standards, and existing patterns.
2. Identify the repository type (monorepo vs single system). If it is a monorepo, identify all apps, packages, and shared libraries. Each layer/app must be analyzed and reported separately.
3. Identify the tech stack, frameworks, and key dependencies for each layer/app.

### Phase 2: Codebase Analysis (parallel passes)

For each layer/app, run a **separate** Agent (or sub-task) in parallel with focused instructions:
- The specific layer/app path and tech stack to analyze
- What to search for (dead code, duplications, improvement areas)
- The skills to load (`eversis-codebase-analysing`, `eversis-code-reviewing` from `.cursor/skills/`)
- Return structured findings in the format matching the report template

For each layer/app, the parallel pass should:

#### 2a. Dead Code Detection
- Search for unused imports across all source files.
- Search for unused exported functions, classes, types, interfaces, and constants that are never imported elsewhere.
- Search for unused components (frontend) that are not referenced in any route, page, or other component.
- Search for unreachable code paths (e.g., after return/throw statements, impossible conditions).
- Search for unused configuration files, environment variables, or feature flags.
- Search for deprecated code marked with `@deprecated` or similar annotations that is no longer referenced.
- Search for files that are not imported or required anywhere.
- Search for dead routes or endpoints that are defined but not reachable.
- Cross-reference test files: find code that is only imported in its own test file and nowhere else in production code.

#### 2b. Duplication Detection
- Search for duplicated functions or methods with identical or near-identical logic across different files.
- Search for duplicated UI components that render similar structures with minor variations.
- Search for duplicated API call patterns, data fetching logic, or error handling patterns.
- Search for duplicated validation logic, utility functions, or helper methods.
- Search for duplicated type definitions, interfaces, or schemas.
- Search for duplicated configuration or constant definitions across modules.
- Search for copy-pasted code blocks that differ only in variable names or string literals.
- Identify components/functions that are highly similar and can be merged into a single configurable version.

#### 2c. Improvement Opportunities
- Identify overly complex functions (high cyclomatic complexity, deeply nested logic).
- Identify functions or classes with too many responsibilities (SRP violations).
- Identify missing or inconsistent error handling patterns.
- Identify inconsistent naming conventions or coding styles.
- Identify missing TypeScript types or excessive use of `any`.
- Identify opportunities to extract shared logic into reusable utilities or hooks.
- Identify outdated patterns that could be modernized (e.g., callbacks to async/await, class components to functional).
- Identify missing or insufficient test coverage for critical paths.
- Identify potential performance issues (unnecessary re-renders, N+1 queries, missing indexes).
- Identify security concerns (exposed secrets, missing input validation, SQL injection risks).

### Phase 3: Architecture Review

Use the Architect perspective to evaluate:
- Whether the current module/package boundaries are well-defined.
- Whether shared code is properly extracted and reusable.
- Whether the dependency graph between modules is clean (no circular dependencies).
- Whether the separation of concerns is properly maintained.
- Whether the current patterns are scalable and maintainable.

### Phase 4: Report Generation

1. Compile all findings from Phase 2 and Phase 3.
2. For monorepos, organize findings by layer/app with clear section headers.
3. Prioritize all findings into severity levels:
   - 🔴 **Critical** — Must be fixed; causes bugs, security issues, or significant maintenance burden
   - 🟡 **Important** — Should be fixed; improves quality, readability, or maintainability
   - 🟢 **Nice to Have** — Optional improvements; polish and optimization
4. Save the report as `code-quality-report.md` in the repository root.

## Report Structure

The report must follow this structure:

```markdown
# Code Quality Report - <repository-name>

## Overview

| Field | Value |
|---|---|
| Repository | <name> |
| Repository Type | Monorepo / Single System |
| Date | <date> |
| Layers/Apps Analyzed | <list> |

## Executive Summary

<2-3 paragraph summary of overall code health, major findings, and recommended priorities>

---

## Findings by Layer/App

### <Layer/App Name> (`<path>`)

#### Dead Code

| # | Severity | Type | Location | Description |
|---|---|---|---|---|
| 1 | 🔴/🟡/🟢 | <type> | `<file:line>` | <description> |

#### Duplications

| # | Severity | Type | Locations | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🔴/🟡/🟢 | <type> | `<path1>`, `<path2>` | <description> | <action> |

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🔴/🟡/🟢 | <category> | `<file:line>` | <description> | <action> |

<!-- Repeat for each Layer/App -->

---

## Architecture Observations

<architectural-findings-and-recommendations>

## Summary

| Category | 🔴 Critical | 🟡 Important | 🟢 Nice to Have | Total |
|---|---|---|---|---|
| Dead Code | <count> | <count> | <count> | <count> |
| Duplications | <count> | <count> | <count> | <count> |
| Improvements | <count> | <count> | <count> | <count> |
| **Total** | <count> | <count> | <count> | <count> |

## Recommended Action Plan

### Immediate (Critical)
1. <action-item>

### Short-term (Important)
1. <action-item>

### Long-term (Nice to Have)
1. <action-item>
```

## Guidelines

- Be specific: always include file paths and line numbers when referencing findings.
- Be actionable: every finding must include a clear recommendation for how to fix it.
- Avoid false positives: verify that "unused" code is truly unused by checking all import paths, dynamic imports, and re-exports.
- For monorepos, clearly separate findings per layer/app — do not mix them.
- Use parallel Agent passes efficiently: delegate file-level scanning to separate focused runs; keep one pass for architectural assessment.
- The final report must be self-contained and understandable without additional context.

<!-- Eversis port; upstream: eversis-review-codebase -->
