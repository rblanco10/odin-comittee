# Member Activation Rules

> **For**: Chair - Payment Systems Architect  
> **Purpose**: Guide for selecting which members to activate for each session type

---

## Activation Philosophy

**Core Principle**: Activate the minimum members necessary to achieve the session goal while ensuring:
1. All relevant expertise is represented
2. Critical perspectives are included
3. Historical context is available
4. Recording capability is present

**Over-activation costs**: Sessions become unwieldy, decisions slow
**Under-activation costs**: Important perspectives missed, decisions flawed

---

## Standard Activation Patterns

### Pattern A: Provider-Specific Deep Dive

**When**: Investigating or improving a specific provider integration

```
REQUIRED:
├── Leadership
│   └── Chair
├── Provider Specialist
│   └── [Specific provider expert]
├── Technical Specialists
│   ├── API Integration Expert
│   └── Elixir Expert
├── Critics (2 minimum)
│   ├── Security Adversary
│   └── Failure Advocate
├── Historians (1 minimum)
│   └── Pattern Historian
└── Clerical
    └── Recording Clerk

OPTIONAL (as needed):
├── Observability Expert (if metrics/tracing involved)
├── Testing Expert (if test coverage needed)
└── Research Clerk (if investigation required)
```

**Example**: "Deep dive into Checkbook webhook handling"
- Activate: Checkbook Expert, API Expert, Elixir Expert, Security Adversary, Failure Advocate, Pattern Historian, Recording Clerk

---

### Pattern B: Cross-Cutting Architecture Decision

**When**: Making decisions that affect multiple components or establish patterns

```
REQUIRED:
├── Leadership
│   ├── Chair
│   └── Vice Chair (cross-domain coordination)
├── Architecture Specialists (3 minimum)
│   ├── Capability Patterns Expert
│   ├── Adapter Patterns Expert
│   └── [Most relevant other]
├── Critics (4 minimum)
│   ├── Complexity Critic
│   ├── Consistency Challenger
│   ├── Scalability Skeptic
│   └── Security Adversary
├── Historians (all 3)
│   ├── Session Historian
│   ├── Pattern Historian
│   └── Debt Archaeologist
└── Clerical
    ├── Recording Clerk
    └── Artifacts Clerk

OPTIONAL (as needed):
├── Relevant domain experts
└── Business domain experts (if business impact)
```

**Example**: "Standardizing error handling across all providers"
- Full architecture team + all critics + all historians

---

### Pattern C: Business Integration Review

**When**: Examining how ember_payments integrates with business domains

```
REQUIRED:
├── Leadership
│   └── Chair
├── Business Domain Experts (2 minimum)
│   └── [Relevant business experts]
├── Technical Specialists
│   ├── Ash Framework Expert
│   └── [Other relevant]
├── Critics (2 minimum)
│   ├── Integration Pessimist
│   └── Edge Case Hunter
├── Historians (1 minimum)
│   └── Session Historian
└── Clerical
    └── Recording Clerk

OPTIONAL:
├── Compliance specialists (if regulatory impact)
└── Provider specialists (if provider-specific)
```

**Example**: "Review reimbursement payment flow to Dwolla"
- Reimbursement Expert, Employee Payments Expert, Dwolla Expert, Ash Expert, Integration Pessimist, Edge Case Hunter

---

### Pattern D: Security & Compliance Audit

**When**: Reviewing security posture or compliance requirements

```
REQUIRED:
├── Leadership
│   ├── Chair
│   └── Parliamentarian (process compliance)
├── Compliance Specialists (all 3)
│   ├── PCI Compliance Expert
│   ├── Financial Regulations Expert
│   └── Data Privacy Expert
├── Technical Specialists
│   └── Security-relevant experts
├── Critics (2 minimum)
│   ├── Security Adversary (MANDATORY)
│   └── Failure Advocate
├── Historians (2 minimum)
│   ├── Session Historian
│   └── Debt Archaeologist
└── Clerical
    ├── Recording Clerk
    └── Artifacts Clerk

OPTIONAL:
├── Provider specialists (for provider-specific security)
```

**Example**: "PCI compliance review of card data handling"
- All compliance specialists + Security Adversary + relevant card/provider experts

---

### Pattern E: Bug Investigation

**When**: Investigating a specific issue or failure

```
REQUIRED:
├── Leadership
│   └── Chair
├── QA Specialists
│   └── [Most relevant QA expert]
├── Domain Experts
│   └── [Expert in affected area]
├── Critics (1 minimum)
│   └── Edge Case Hunter
├── Historians (1 minimum)
│   └── Debt Archaeologist
└── Clerical
    ├── Recording Clerk
    └── Research Clerk (IMPORTANT for investigation)

OPTIONAL:
├── Provider specialist (if provider-related)
├── Failure Advocate (for failure analysis)
```

**Example**: "Investigate Marqeta webhook processing failures"
- Marqeta Expert, Webhook Testing Expert, API Testing Expert, Edge Case Hunter, Research Clerk

---

### Pattern F: Knowledge Documentation

**When**: Creating or updating knowledge base entries

```
REQUIRED:
├── Leadership
│   └── Chair (can delegate to Vice Chair)
├── Domain Expert
│   └── [Expert in documentation topic]
├── Historians (1 minimum)
│   └── Pattern Historian
└── Clerical
    ├── Recording Clerk
    └── Artifacts Clerk (IMPORTANT for document management)

OPTIONAL:
├── Relevant critics (for review)
├── Additional domain experts (for verification)
```

**Example**: "Document WEX Fleet SOAP authentication flow"
- WEX Expert, API Integration Expert, Pattern Historian, Artifacts Clerk

---

### Pattern G: Testing Strategy

**When**: Discussing test coverage, test infrastructure, or testing approaches

```
REQUIRED:
├── Leadership
│   └── Chair
├── QA Specialists (all 4)
│   ├── API Testing Expert
│   ├── Integration Testing Expert
│   ├── Webhook Testing Expert
│   └── Load Testing Expert
├── Technical Specialists
│   └── Testing Expert
├── Critics (2 minimum)
│   ├── Edge Case Hunter
│   └── Failure Advocate
├── Historians (1 minimum)
│   └── Pattern Historian
└── Clerical
    └── Recording Clerk
```

**Example**: "Improve provider webhook test coverage"
- Full QA team + Testing Expert + relevant provider specialist

---

## Critic Activation Matrix

**Always activate at least one critic. Use this matrix to select:**

| Session Focus | Primary Critic | Secondary Critic |
|---------------|---------------|------------------|
| Security/credentials | Security Adversary | Failure Advocate |
| Performance/scaling | Scalability Skeptic | Complexity Critic |
| API integration | Failure Advocate | Security Adversary |
| Data models | Consistency Challenger | Edge Case Hunter |
| Business logic | Integration Pessimist | Edge Case Hunter |
| New abstractions | Complexity Critic | Consistency Challenger |
| Cost decisions | Cost Skeptic | Scalability Skeptic |
| Error handling | Failure Advocate | Edge Case Hunter |
| Cross-domain | Integration Pessimist | Consistency Challenger |

---

## Historian Activation Guide

| Session Type | Session Historian | Pattern Historian | Debt Archaeologist |
|--------------|-------------------|-------------------|-------------------|
| Architecture decision | ✅ Required | ✅ Required | ✅ Required |
| Provider deep dive | ✅ Required | ✅ Required | Optional |
| Bug investigation | Optional | Optional | ✅ Required |
| Documentation | Optional | ✅ Required | Optional |
| Compliance audit | ✅ Required | Optional | ✅ Required |
| Business integration | ✅ Required | Optional | Optional |

---

## Special Activation Considerations

### When Human Director is Present

If the Human Director will be actively participating:
- Reduce critic count by 1 (Human provides direction)
- Ensure Session Historian is present (capture Human input)
- Have Research Clerk on standby (Human may request investigations)

### When Session May Be Contentious

If disagreement is expected:
- Activate Parliamentarian for process management
- Increase critic count to ensure all perspectives heard
- Activate all historians for complete record

### When Time is Limited

For quick decisions:
- Minimum viable activation (Chair + 1 expert + 1 critic)
- Note in transcript that abbreviated activation was used
- Flag for follow-up review if needed

---

## Activation Checklist

Before opening session, verify:

- [ ] All required expertise for topic is covered
- [ ] At least one relevant critic is activated
- [ ] At least one historian is activated (Session Historian for decisions)
- [ ] Recording Clerk is activated
- [ ] Research Clerk is activated if investigation expected
- [ ] Artifacts Clerk is activated if outputs expected
- [ ] No critical perspective is missing
- [ ] Activation is not excessive for the goal

---

*"The right voices in the room make the right decision possible."*
