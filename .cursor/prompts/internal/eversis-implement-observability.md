---
sidebar_position: 15
title: "Implement observability"
slug: implement-observability
prompt_role: "DevOps engineer"
prompt_description: "Implement observability solutions including metrics, logs, traces, and alerting."
upstream_agent: "eversis-devops-engineer"
---
# eversis-implement-observability

:::info
Not invoked directly by users. To trigger observability implementation, use the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [DevOps Engineer](../../agents/devops-engineer).
:::

**Agent:** DevOps Engineer
**File:** `.cursor/prompts/internal/eversis-implement-observability.md`

Implements comprehensive observability solutions covering metrics, logs, traces, and alerting.

## How It’s Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

The Engineering Manager identifies observability tasks in the plan and delegates them to the DevOps Engineer automatically.

## What It Does

### 1. Context Discovery

- Identifies existing monitoring stack (Prometheus, Grafana, Datadog, CloudWatch, etc.).
- Checks for existing dashboards, alert rules, and log aggregation patterns.
- Discovers service level objectives (SLOs) and key performance indicators (KPIs).

### 2. Implementation

- Sets up metrics collection with appropriate instrumentation.
- Configures log aggregation with structured logging patterns.
- Implements distributed tracing across services.
- Creates alerting rules with appropriate thresholds and escalation paths.
- Builds dashboards for system health visibility.

### 3. Verification

- Validates that metrics are being collected correctly.
- Ensures alert rules fire as expected with test scenarios.
- Verifies trace propagation across service boundaries.

## Skills Loaded

- `eversis-implementing-observability` — Observability patterns for logging, monitoring, alerting, tracing.
- `eversis-technical-context-discovering` — Project conventions and existing patterns.

---

## Executable prompt (attach in Cursor)

# Observability Implementation Workflow

This prompt implements comprehensive observability solutions covering metrics, logs, traces, and alerting. It establishes monitoring infrastructure that enables teams to understand system behavior, detect issues proactively, and maintain service level objectives through well-designed dashboards and alert rules.

The workflow follows RED/USE methodology for metrics collection, configures appropriate SLOs/SLIs with error budgets, and creates actionable alerts linked to runbooks. Decisions about new observability stacks, cross-service tracing architecture, or compliance-sensitive logging are escalated to the architect agent.

## Required Skills
Before starting, load and follow these skills:
- `eversis-implementing-observability` - for metrics, logs, traces, alerting patterns, SLO definitions, and dashboard design
- `eversis-technical-context-discovering` - to establish project conventions and existing monitoring patterns

---

## 1. Context

Follow the `eversis-technical-context-discovering` skill to identify existing observability setup.

Additionally, always:
- Check `*.instructions.md` → project-specific conventions
- Analyze existing monitoring configurations (Prometheus, Grafana, CloudWatch, etc.)
- Discover existing alerting rules and dashboards

---

## 2. Implementation

Follow the `eversis-implementing-observability` skill for:
- Metrics collection configuration
- Log aggregation setup
- Distributed tracing instrumentation
- SLO/SLI definitions with error budgets
- Alert rules with runbooks
- Dashboard design

---

## 3. Architect Consultation

Escalate to the **Architect** (attach `.cursor/rules` or split a dedicated research task) when:
- Selecting observability stack for greenfield projects
- Designing cross-service tracing architecture
- Implementing centralized logging with compliance requirements

Skip for: adding alerts, creating dashboards, configuring log retention, adding metrics to existing stack.

---

## 4. Summary (required output)

```markdown
## Observability Implementation Summary

### Current State
- [existing observability infrastructure]

### Proposed Stack
- Metrics: [tool and configuration]
- Logs: [tool and configuration]
- Traces: [tool and configuration]

### SLO Definitions
| Service | SLI | Target | Error Budget |
|---------|-----|--------|--------------|

### Alert Rules
| Alert | Condition | Severity | Runbook |
|-------|-----------|----------|---------|

### Dashboards
- [list of dashboard definitions]

### Instrumentation Guide
- [what application teams need to add, if any]

### Files
- NEW/MODIFIED: [list of files created or modified]
```

---

## Scope

**Does NOT handle** (redirect to):
- Application code instrumentation → coordinate with software engineer
- Infrastructure provisioning → `@eversis-implement-terraform`
- CI/CD pipelines → `@eversis-implement-pipeline`

<!-- Eversis port; upstream: eversis-implement-observability -->
