---
sidebar_position: 12
title: "Deploy kubernetes"
slug: deploy-kubernetes
prompt_role: "DevOps engineer"
prompt_description: "Create Kubernetes deployments, Helm charts, and configure workload resources."
upstream_agent: "eversis-devops-engineer"
---
# eversis-deploy-kubernetes

:::info
Not invoked directly by users. To trigger Kubernetes deployments, use the [eversis-implement](../public/implement) public prompt — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [DevOps Engineer](../../agents/devops-engineer).
:::

**Agent:** DevOps Engineer
**File:** `.cursor/prompts/internal/eversis-deploy-kubernetes.md`

Creates Kubernetes deployments, Helm charts, and configures workload resources following production-ready patterns.

## How It’s Triggered

```text
@eversis-implement
<JIRA_ID or task description>
```

In **Cursor**, attach the **Implement** prompt (`eversis-implement`) from the path above; the Engineering Manager delegates to this internal prompt when the workflow requires it.

The Engineering Manager identifies Kubernetes tasks in the plan and delegates them to the DevOps Engineer automatically.

## What It Does

### 1. Context Discovery

- Identifies existing Kubernetes manifests, Helm charts, and Kustomize overlays.
- Checks for project-specific infrastructure instructions.
- Discovers existing deployment patterns, naming conventions, and namespace structure.

### 2. Implementation

- Creates deployments with proper health probes, resource limits, and scaling policies.
- Generates Helm charts with values files for multi-environment support.
- Configures secrets handling, ConfigMaps, and service accounts.
- Implements network policies and security configurations.

### 3. Safety Checks

- Validates manifests before applying.
- Prefers `--dry-run` for initial verification.
- Includes rollback strategies and deployment safeguards.

## Skills Loaded

- `eversis-implementing-kubernetes` — Deployment patterns, Helm charts, cluster management.
- `eversis-managing-secrets` — Secrets management for Kubernetes environments.
- `eversis-technical-context-discovering` — Project conventions and existing patterns.

---

## Executable prompt (attach in Cursor)

# Kubernetes Deployment Workflow

This prompt creates Kubernetes deployments, Helm charts, and workload configurations following production-ready patterns for high availability, resource management, and secrets handling. It ensures consistent deployment practices across environments with proper health probes, scaling policies, and security configurations.

The workflow matches existing project conventions (raw manifests, Helm, or Kustomize), configures appropriate QoS classes and resource limits, and validates all manifests before deployment. Architectural decisions involving service mesh, multi-cluster, or microservices topology are escalated to the architect agent.

## Required Skills
Before starting, load and follow these skills:
- `eversis-implementing-kubernetes` - for deployment patterns, Helm charts, resource configuration, and high availability settings
- `eversis-managing-secrets` - for Kubernetes secrets management (Secrets, external-secrets, sealed-secrets)
- `eversis-technical-context-discovering` - to establish project conventions and existing Kubernetes patterns

---

## 1. Context

Follow the `eversis-technical-context-discovering` skill to identify existing Kubernetes setup.

Additionally, always:
- Check `*.instructions.md` → project-specific conventions
- Analyze existing Kubernetes manifests, Helm charts, or Kustomize overlays
- Discover namespace organization and resource patterns

---

## 2. Implementation

Follow the `eversis-implementing-kubernetes` skill for:
- Deployment/StatefulSet configuration
- Service and Ingress setup
- Resource requests/limits and QoS classes
- Health probes (liveness, readiness, startup)
- HPA, PDB, pod anti-affinity, topology spread

Follow the `eversis-managing-secrets` skill for:
- Kubernetes Secrets or external secrets management
- Secret injection configuration

---

## 3. Architect Consultation

Escalate to the **Architect** (attach `.cursor/rules` or split a dedicated research task) when:
- Designing new service architecture or microservices topology
- Implementing service mesh (Istio, Linkerd)
- Setting up multi-cluster or multi-region deployments

Skip for: HPA/PDB configuration, probes, resource limits, manifest fixes.

---

## 4. Summary (required output)

```markdown
## Kubernetes Deployment Summary

### Current State
- [existing Kubernetes configuration]

### Proposed Configuration
- Deployment method: [raw manifests / Helm / Kustomize]
- Namespace: [target namespace]
- Replicas: [count] with HPA [min-max]

### Prerequisites
| Resource | Description |
|----------|-------------|
| [namespace/secret/etc.] | [what must exist before deployment] |

### Deployment Instructions
1. [step-by-step instructions to apply]

### Verification Steps
1. [how to confirm successful deployment]

### Files
- NEW/MODIFIED: [list of files created or modified]
```

---

## Scope

**Does NOT handle** (redirect to):
- Cluster provisioning → `@eversis-implement-terraform`
- CI/CD pipeline for deployment → `@eversis-implement-pipeline`
- Monitoring and alerting → `@eversis-implement-observability`

<!-- Eversis port; upstream: eversis-deploy-kubernetes -->
