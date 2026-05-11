---
sidebar_position: 13
title: "Implement terraform"
slug: implement-terraform
prompt_role: "DevOps engineer"
prompt_description: "Create Terraform modules and provision cloud infrastructure safely."
upstream_agent: "eversis-devops-engineer"
---
# eversis-implement-terraform

:::info
Not invoked directly by users. To trigger Terraform implementation, use the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [DevOps Engineer](../../agents/devops-engineer).
:::

**Agent:** DevOps Engineer
**File:** `.cursor/prompts/internal/eversis-implement-terraform.md`

Creates Terraform modules and provisions cloud infrastructure safely following established IaC patterns and safety guardrails.

## How It’s Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

The Engineering Manager identifies Terraform tasks in the plan and delegates them to the DevOps Engineer automatically.

## What It Does

### 1. Context Discovery

- Identifies existing Terraform modules, state backends, and provider configurations.
- Checks for naming conventions, tagging policies, and module structure.
- Discovers existing patterns for resource configuration and variable management.

### 2. Implementation

- Creates reusable Terraform modules with proper input/output variables.
- Applies consistent naming, tagging, and resource configuration.
- Configures state management and backend settings.
- Generates cost estimates for proposed changes.

### 3. Safety Checks

- Runs `terraform validate` and `terraform plan` before any changes.
- Never runs `terraform apply` without explicit user authorization.
- Includes rollback considerations and state management safeguards.

## Skills Loaded

- `eversis-implementing-terraform-modules` — Reusable Terraform modules for AWS, Azure, and GCP.
- `eversis-optimizing-cloud-cost` — Cost estimation and optimization.
- `eversis-technical-context-discovering` — Project conventions and existing patterns.

---

## Executable prompt (attach in Cursor)

# Terraform Implementation Workflow

This prompt creates or modifies Terraform modules and provisions cloud infrastructure following established IaC patterns and safety guardrails. It ensures consistent resource configuration with proper naming, tagging, state management, and cost estimation before any infrastructure changes are applied.

The workflow respects existing project conventions, validates all changes through `terraform plan`, and automatically escalates architectural decisions (VPC design, service selection, multi-region) to the architect agent. Every implementation includes cost impact analysis and step-by-step apply instructions.

## Required Skills
Before starting, load and follow these skills:
- `eversis-implementing-terraform-modules` - for module patterns, state management, and safe infrastructure changes
- `eversis-technical-context-discovering` - to establish project conventions and existing Terraform patterns

---

## 1. Context

Follow the `eversis-technical-context-discovering` skill to identify existing Terraform setup.

Additionally, always:
- Check `*.instructions.md` → project-specific conventions
- Analyze existing Terraform modules and state configuration
- Discover environment organization (workspaces, Terragrunt)

---

## 2. Implementation

Follow the `eversis-implementing-terraform-modules` skill for:
- Module structure and interfaces
- Resource configurations with proper naming and tagging
- Variable definitions with validation
- State backend configuration

**Guardrails:**
- Always run `terraform plan` before any apply
- Never suggest `terraform apply -auto-approve` for production
- Ensure remote state is configured before applying
- Flag resources with significant cost impact (>10% increase)

---

## 3. Architect Consultation

Escalate to the **Architect** (attach `.cursor/rules` or split a dedicated research task) when:
- Designing new VPC/network topology
- Selecting between competing cloud services (ECS vs EKS, RDS vs Aurora)
- Implementing multi-region or disaster recovery architecture
- Making decisions with significant cost impact (>10% increase)

Skip for: adding resources to existing modules, updating versions, fixing bugs, adding tags.

---

## 4. Summary (required output)

```markdown
## Terraform Implementation Summary

### Current State
- [existing IaC configuration]

### Proposed Configuration
- Provider: [AWS / Azure / GCP]
- Resources: [list of resources to create/modify]

### Variables
| Variable | Type | Required | Description |
|----------|------|----------|-------------|

### State Backend
- [remote state configuration]

### Cost Estimate
- [approximate monthly cost for new resources]

### Apply Instructions
1. `terraform init`
2. `terraform plan -out=tfplan`
3. Review plan output
4. `terraform apply tfplan`

### Files
- NEW/MODIFIED: [list of files created or modified]
```

---

## Scope

**Does NOT handle** (redirect to):
- CI/CD pipelines for Terraform → `@eversis-implement-pipeline`
- Kubernetes workload configuration → `@eversis-deploy-kubernetes`
- Monitoring infrastructure → `@eversis-implement-observability`

<!-- Eversis port; upstream: eversis-implement-terraform -->
