# Lineage Mapper Tool

> **Purpose**: Map domains to appropriate Protogenos lineage  
> **Used By**: Khaos (Genesis)

---

## Overview

When creating a new committee, Khaos must determine which Protogenos lineage it descends from. This tool provides the decision logic.

---

## Lineage Decision Tree

```
START: What is the committee's PRIMARY concern?
│
├── STABILITY / DATA / PLATFORM
│   │
│   ├── Is it about infrastructure? ──────────────→ GAIA
│   ├── Is it about databases? ───────────────────→ GAIA
│   ├── Is it about core platform services? ──────→ GAIA
│   └── Is it about DevOps/deployment? ───────────→ GAIA
│
├── SECURITY / COMPLIANCE / ACCESS
│   │
│   ├── Is it about security controls? ───────────→ TARTARUS
│   ├── Is it about regulatory compliance? ───────→ TARTARUS
│   ├── Is it about access management? ───────────→ TARTARUS
│   └── Is it about governance/policy? ───────────→ TARTARUS
│
├── PRODUCT / USER / INNOVATION
│   │
│   ├── Is it about user experience? ─────────────→ EROS
│   ├── Is it about product features? ────────────→ EROS
│   ├── Is it about design? ──────────────────────→ EROS
│   └── Is it about growth/conversion? ───────────→ EROS
│
├── OPERATIONS / MONITORING / SUPPORT
│   │
│   ├── Is it about system health? ───────────────→ NYX
│   ├── Is it about incident response? ───────────→ NYX
│   ├── Is it about monitoring/alerting? ─────────→ NYX
│   └── Is it about customer support? ────────────→ NYX
│
└── FINANCE / RISK / AUDIT
    │
    ├── Is it about financial records? ───────────→ EREBUS
    ├── Is it about ledger/accounting? ───────────→ EREBUS
    ├── Is it about fraud/risk? ──────────────────→ EREBUS
    └── Is it about audit/verification? ──────────→ EREBUS
```

---

## Domain-to-Lineage Quick Reference

| Domain Keywords | Primary Lineage | Secondary (if any) |
|-----------------|-----------------|-------------------|
| Database, Schema, Migration | **Gaia** | - |
| Infrastructure, Kubernetes, Docker | **Gaia** | Nyx |
| Platform, Core Services, Shared Libraries | **Gaia** | - |
| CI/CD, Deployment, DevOps | **Gaia** | Nyx |
| Security, Authentication, Authorization | **Tartarus** | - |
| Compliance, Regulatory, Audit | **Tartarus** | Erebus |
| Encryption, Secrets, Access Control | **Tartarus** | - |
| Privacy, GDPR, Data Protection | **Tartarus** | - |
| Product, Features, Roadmap | **Eros** | - |
| UX, UI, Design | **Eros** | - |
| Growth, Conversion, Retention | **Eros** | Erebus |
| Innovation, R&D, Experiments | **Eros** | - |
| Operations, Uptime, Reliability | **Nyx** | Gaia |
| Monitoring, Alerting, Dashboards | **Nyx** | - |
| Incident Response, On-Call | **Nyx** | Tartarus |
| Support, Customer Issues | **Nyx** | Eros |
| Ledger, Transactions, Accounting | **Erebus** | - |
| Risk, Fraud Detection | **Erebus** | Tartarus |
| Financial Analysis, Reconciliation | **Erebus** | - |
| Internal Audit, Verification | **Erebus** | Tartarus |

---

## Multi-Lineage Considerations

Some committees may touch multiple domains. Guidelines:

### Primary Lineage Selection

The PRIMARY lineage should be:
1. The domain where the committee spends MOST of its time
2. The domain that defines its CORE PURPOSE
3. The domain whose FAILURE would most impact the committee's mission

### Secondary Lineage

When a committee has secondary concerns:
1. Add critics from the secondary lineage
2. Reference secondary lineage's knowledge base
3. Do NOT add secondary constitutional rules (only primary applies)

### Example: Incident Response Team

```
Primary: NYX (Operations)
- Core purpose is incident handling
- Main activity is monitoring and response

Secondary: TARTARUS (Security)
- Security incidents require Tartarus expertise
- Add Security Auditor critic
- Reference security playbooks
```

---

## Lineage Inheritance Summary

| Lineage | Inherited Critics | Key Constitutional Rules |
|---------|------------------|-------------------------|
| **Gaia** | Stability Guardian, Dependency Auditor, Performance Sentinel | No unplanned downtime, Migration safety, Observability |
| **Tartarus** | Security Auditor, Compliance Officer, Access Reviewer, Paranoid Analyst | No security exceptions, Encryption required, Audit everything |
| **Eros** | User Advocate, Simplicity Critic, Accessibility Guardian, Scope Skeptic | User evidence required, Accessibility, Measurement |
| **Nyx** | Reliability Guardian, Observability Auditor, On-Call Advocate, Incident Historian | SLA commitment, Alert hygiene, Runbooks required |
| **Erebus** | Balance Auditor, Evidence Demander, Risk Assessor, Forensic Analyst | Double-entry sacred, No deletion, Evidence required |

---

## Lineage Selection Worksheet

When selecting lineage, fill out:

```markdown
## Lineage Selection for [Committee Name]

### Committee Purpose
[One sentence description]

### Primary Activities
1. [Activity 1]
2. [Activity 2]
3. [Activity 3]

### Domain Keywords Identified
- [keyword 1] → [suggests lineage]
- [keyword 2] → [suggests lineage]
- [keyword 3] → [suggests lineage]

### Critical Failure Scenario
"If this committee fails, the primary impact is [description]"
→ This suggests [lineage] as primary

### Primary Lineage Selected
**[LINEAGE NAME]**

Rationale: [Why this lineage fits best]

### Secondary Lineage (if any)
**[LINEAGE NAME]** or None

Rationale: [Why secondary lineage is needed, or why not needed]

### Inherited Elements
From [Primary Lineage]:
- Critics: [list]
- Rules: [list]
- Knowledge: [list]

From [Secondary Lineage] (if applicable):
- Critics: [list]
```

---

## Edge Cases

### Committee spans multiple domains equally

→ Default to **Tartarus** (security/governance) as it's the most conservative

### Committee is temporary/experimental

→ Use **Working Group** structure, default to **Eros** (innovation-friendly)

### Committee handles money

→ Must include **Erebus** as primary or secondary (financial integrity)

### Committee touches production systems

→ Must include **Nyx** as primary or secondary (operational awareness)

### Committee handles customer data

→ Must include **Tartarus** as primary or secondary (privacy/security)
