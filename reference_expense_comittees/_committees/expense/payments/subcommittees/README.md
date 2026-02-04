# Subcommittees

> **Total Subcommittees**: 20  
> **Purpose**: Focused investigation and recommendation on specialized topics

---

## Subcommittee Index

### General Domain Subcommittees (SC01-SC10)
| Code | Name | Focus |
|------|------|-------|
| SC01 | Provider Integration | Cross-provider patterns and integration |
| SC02 | Card Operations | Card issuance, lifecycle, transactions |
| SC03 | Payment Operations | ACH, checks, payment flows |
| SC04 | Identity Verification | KYB, KYC, documents |
| SC05 | Webhook Processing | Webhook handling and reliability |
| SC06 | Reconciliation & Audit | Financial matching and audit trails |
| SC07 | Resilience & Observability | Circuit breakers, metrics, logging |
| SC08 | Testing & Quality | Test coverage and strategies |
| SC09 | Security & Compliance | Security posture, PCI, regulations |
| SC10 | Business Integration | Cross-domain integration |

### Architectural Subcommittees (SC11-SC13)
| Code | Name | Focus |
|------|------|-------|
| SC11 | Capability Architecture | Capability pattern design |
| SC12 | Reactor Workflows | Ash Reactor patterns |
| SC13 | Credential Management | Credential handling and security |

### Provider Deep Dive Subcommittees (SC14-SC17)
| Code | Name | Focus |
|------|------|-------|
| SC14 | Checkbook Deep Dive | Checkbook.io integration |
| SC15 | Dwolla Deep Dive | Dwolla integration |
| SC16 | Marqeta Deep Dive | Marqeta integration |
| SC17 | WEX Fleet Deep Dive | WEX Fleet integration |

### Specialized Subcommittees (SC18-SC20)
| Code | Name | Focus |
|------|------|-------|
| SC18 | Ash Resources | Ash resource design patterns |
| SC19 | Error Handling | Error handling and recovery |
| SC20 | Onboarding | Provider and workspace onboarding |

---

## Subcommittee Operation

### Authority
- Investigate assigned topics
- Produce recommendations
- Update knowledge base in domain
- CANNOT make binding architectural decisions (full committee only)

### Quorum
- Minimum 3 members including lead
- At least 1 critic recommended

### Reporting
- Reports to full committee
- Findings presented before action
- Recommendations require committee vote

---

## Folder Structure

Each subcommittee has:
```
subcommittees/
├── SC##_name/
│   ├── charter.md         # Purpose and scope
│   ├── members.md         # Assigned members
│   └── findings/          # Investigation outputs
```
