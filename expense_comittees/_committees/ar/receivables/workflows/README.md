# Workflow Templates

> **Purpose**: Standard operating procedures for committee activities  
> **Inspired by**: ChatDev/MetaGPT workflow patterns  
> **Last Updated**: 2026-01-14

---

## Overview

Workflow templates provide structured, repeatable processes for common committee activities. They define phases, participants, and expected outputs.

---

## Available Workflows

| Workflow | Purpose | File |
|----------|---------|------|
| **Architecture Review** | Review architectural proposals | `architecture_review.yaml` |
| **Implementation Handoff** | Bridge to Agentic system | `implementation_handoff.yaml` |
| **Ratification** | Approve Agentic implementation | `ratification.yaml` |
| **Legacy Alignment Check** | Verify Loopback2 compatibility | `legacy_alignment_check.yaml` |
| **Performance Audit** | Verify performance budgets | `performance_audit.yaml` |

---

## Workflow Structure

Each workflow follows this structure:

```yaml
name: Workflow Name
version: "1.0"
description: What this workflow accomplishes

triggers:
  - When to initiate this workflow

participants:
  required:
    - List of required members
  optional:
    - List of optional members

phases:
  - name: Phase Name
    owner: Who leads this phase
    activities:
      - Activity 1
      - Activity 2
    outputs:
      - Expected output
    next: Next phase or "complete"

outputs:
  - Final workflow outputs
```

---

## Using Workflows

### 1. Select Appropriate Workflow

Choose based on session goal:
- Reviewing new architecture → `architecture_review.yaml`
- Creating handoff → `implementation_handoff.yaml`
- Reviewing implementation → `ratification.yaml`
- Checking legacy → `legacy_alignment_check.yaml`
- Auditing performance → `performance_audit.yaml`

### 2. Verify Participants

Ensure all required participants are activated.

### 3. Follow Phases

Progress through phases sequentially, completing all activities.

### 4. Produce Outputs

Ensure all required outputs are generated.

---

## Customization

Workflows may be adapted for specific needs, but:
- Core phases should not be skipped
- Required participants must be present
- Constitutional rules always apply

---

*"Workflows transform ad-hoc into systematic."*

