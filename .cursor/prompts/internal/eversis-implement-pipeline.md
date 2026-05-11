---
sidebar_position: 14
title: "Implement pipeline"
slug: implement-pipeline
prompt_role: "DevOps engineer"
prompt_description: "Create or modify CI/CD pipelines with deployment stages and environment protection."
upstream_agent: "eversis-devops-engineer"
---
# eversis-implement-pipeline

:::info
Not invoked directly by users. To trigger CI/CD pipeline implementation, use the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [DevOps Engineer](../../agents/devops-engineer).
:::

**Agent:** DevOps Engineer
**File:** `.cursor/prompts/internal/eversis-implement-pipeline.md`

Creates or modifies CI/CD pipelines with proper deployment stages, environment protection, and secure authentication.

## How It’s Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

The Engineering Manager identifies CI/CD pipeline tasks in the plan and delegates them to the DevOps Engineer automatically.

## What It Does

### 1. Context Discovery

- Identifies the CI/CD platform (GitHub Actions, GitLab CI, Bitbucket Pipelines, Jenkins).
- Checks for existing pipeline patterns, caching strategies, and environment configurations.
- Discovers secret management and authentication patterns.

### 2. Implementation

- Creates pipeline configuration following the project's CI/CD platform conventions.
- Implements deployment stages with proper environment protection rules.
- Configures caching and parallelization for optimal build times.
- Sets up secure authentication for deployments.

### 3. Safety Checks

- Validates pipeline configuration syntax.
- Ensures environment protection rules are in place for production deployments.
- Verifies secrets are properly referenced, not hardcoded.

## Skills Loaded

- `eversis-implementing-ci-cd` — CI/CD pipeline design patterns and deployment strategies.
- `eversis-managing-secrets` — Secrets management for CI/CD environments.
- `eversis-technical-context-discovering` — Project conventions and existing patterns.

---

## Executable prompt (attach in Cursor)

# CI/CD Pipeline Implementation Workflow

This prompt creates or modifies CI/CD pipelines with proper deployment stages, environment protection, and secure authentication. It implements pipelines that follow established patterns for the project's platform (GitHub Actions, GitLab CI, Bitbucket Pipelines) with optimized caching and parallelization.

The workflow configures OIDC authentication for cloud providers, sets up environment-specific secrets handling, and implements appropriate deployment strategies (rolling, blue-green, canary). Complex GitOps workflows and multi-environment promotion pipelines are escalated to the architect agent for design validation.

## Required Skills
Before starting, load and follow these skills:
- `eversis-implementing-ci-cd` - for pipeline patterns, deployment strategies, and GitOps workflows
- `eversis-managing-secrets` - for OIDC authentication setup and secrets handling
- `eversis-technical-context-discovering` - to establish project conventions and existing pipeline patterns

---

## 1. Context

Follow the `eversis-technical-context-discovering` skill to identify existing CI/CD setup.

Additionally, always:
- Check `*.instructions.md` → project-specific conventions
- Analyze existing pipeline configurations (GitHub Actions, GitLab CI, Bitbucket, etc.)
- Discover branching strategy and deployment targets

---

## 2. Implementation

Follow the `eversis-implementing-ci-cd` skill for:
- Pipeline stages (lint, test, build, deploy)
- Deployment strategies (rolling, blue-green, canary)
- Caching and optimization

Follow the `eversis-managing-secrets` skill for:
- OIDC authentication for cloud providers
- Secrets configuration in CI/CD platform
- Environment-specific variables

---

## 3. Architect Consultation

Escalate to the **Architect** (attach `.cursor/rules` or split a dedicated research task) when:
- Designing new deployment strategies (blue-green, canary)
- Setting up multi-environment promotion pipelines
- Implementing complex GitOps workflows

Skip for: adding test stages, fixing pipeline bugs, updating versions, adding caching.

---

## 4. Summary (required output)

```markdown
## CI/CD Pipeline Summary

### Current State
- [existing CI/CD configuration]

### Proposed Pipeline
- Platform: [GitHub Actions / GitLab CI / etc.]
- Stages: [list of stages]
- Deployment strategy: [rolling / blue-green / canary]

### Required Setup
| Secret/Variable | Description | Where to configure |
|-----------------|-------------|-------------------|

### Testing Instructions
- [how to validate the pipeline works]

### Files
- NEW/MODIFIED: [list of files created or modified]
```

---

## Scope

**Does NOT handle** (redirect to):
- Infrastructure provisioning → `@eversis-implement-terraform`
- Kubernetes deployment configuration → `@eversis-deploy-kubernetes`
- Monitoring and alerting → `@eversis-implement-observability`

<!-- Eversis port; upstream: eversis-implement-pipeline -->
