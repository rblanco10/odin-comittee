# Subcommittees Overview

> **Total Subcommittees**: 15  
> **Alignment**: Lifecycle-aligned with `docs/agents/architecture/lifecycles/`

---

## Subcommittee Catalog

### Classic Domain Subcommittees (SC01-SC06)

Aligned with Classic MySQL domain resources in `FlamePsAr.Classic.Domain`.

| Code | Name | Lifecycle | Lead | Focus |
|------|------|-----------|------|-------|
| **SC01** | Receivables Sync | receivable_lifecycle | Jonathan Blake | Receivable resources, sync, balance |
| **SC02** | Customer Sync | customer_lifecycle | Rebecca Morrison | Customer records, addresses, terms |
| **SC03** | Collections | collections_lifecycle | Charles Wright | Collection plans, schedules, payments |
| **SC04** | Fees | fees_lifecycle | Diana Foster | Fee schedules, calculations, waivers |
| **SC05** | Payments | payments_lifecycle | Marcus Chen | Payment processing, application, autopay |
| **SC06** | Plan Compilation | plan_lifecycle | Kevin O'Brien | Plans, compilation, statements |

### ERP & Events Subcommittees (SC07-SC10)

Aligned with Events domain (`FlamePsAr.Events`) and Ember ERP domain (`FlamePsAr.EmberErp`).

| Code | Name | Lifecycle | Lead | Focus |
|------|------|-----------|------|-------|
| **SC07** | ERP Pull | erp_pull_lifecycle | Thomas Grant | Inbound sync from ERPs |
| **SC08** | ERP Push | erp_push_lifecycle | Lisa Nakamura | Outbound sync to ERPs |
| **SC09** | Events Domain | events_lifecycle | Dr. Sarah Kim | ChangeEvent capture/dispatch, EventCursor, Handlers |
| **SC10** | Write-to-Accounting | write_to_accounting_lifecycle | Robert Huang | GL posting, journal entries |

### Cross-Cutting Subcommittees (SC11-SC15)

Address concerns spanning multiple lifecycles.

| Code | Name | Focus | Lead |
|------|------|-------|------|
| **SC11** | Legacy Alignment | Loopback2 compatibility | Dr. Victor Kozlov |
| **SC12** | Performance | Query optimization, budgets | Priya Nakamura |
| **SC13** | UI/Surfaces | LiveView, design system | Nicole Chen |
| **SC14** | Testing | Test strategy, coverage | Michael Torres |
| **SC15** | Migration | Data migration, rollout | Samuel Reed |

---

## Subcommittee Operations

### Authority

Subcommittees may:
- ✅ Conduct focused investigations
- ✅ Produce recommendations for full committee
- ✅ Update knowledge base in their domain
- ✅ Review implementations for ratification
- ❌ NOT make binding architectural decisions alone

### Quorum

Subcommittee sessions require minimum 3 members:
- Subcommittee Lead (required)
- At least 1 domain expert or technical specialist
- At least 1 member from another category

### Reporting

All subcommittee findings must be reported to full committee before action is taken.

---

## Lifecycle Alignment Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUBCOMMITTEE LIFECYCLE ALIGNMENT                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      CLASSIC DOMAIN (MySQL)                          │   │
│  │                                                                      │   │
│  │  SC01 ─────┐                                                         │   │
│  │  Receivables   │                                                     │   │
│  │            │   │     SC03 ─────┐     SC04 ─────┐                     │   │
│  │            ├───┼──── Collections   ── Fees     │                     │   │
│  │            │   │            │            │     │                     │   │
│  │  SC02 ─────┘   │            │            │     │     SC06 ─────┐     │   │
│  │  Customers     │            └────────────┴─────┴──── Plans     │     │   │
│  │                │                                           │   │     │   │
│  │                │     SC05 ────────────────────────────────┐│   │     │   │
│  │                └──── Payments                              ├───┘     │   │
│  │                                                            │         │   │
│  └────────────────────────────────────────────────────────────┼─────────┘   │
│                                                                │             │
│  ┌────────────────────────────────────────────────────────────┼─────────┐   │
│  │                 EVENTS DOMAIN (PostgreSQL)                 │         │   │
│  │                                                            ▼         │   │
│  │  SC09 ─────┐  ChangeEvent, EventCursor, HandlerExecution  │         │   │
│  │  Events    │  Capture/Dispatch Reactors, Oban Workers     │         │   │
│  └────────────┴──────────────────────────────────────────────┴─────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  ERP DOMAIN (PostgreSQL)                             │   │
│  │                                                                      │   │
│  │  SC07 ─────┐                    SC08 ──────────────────────┐        │   │
│  │  ERP Pull  │                    ERP Push                   │        │   │
│  │            │                                               │        │   │
│  │            │                    SC10 ──────────────────────┤        │   │
│  │            │                    Write-to-Accounting        │        │   │
│  └────────────┴───────────────────────────────────────────────┴────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      CROSS-CUTTING                                   │   │
│  │                                                                      │   │
│  │  SC11 Legacy ────── SC12 Perf ────── SC13 UI ────── SC14 Test ───── │   │
│  │                                                             │        │   │
│  │                                                      SC15 Migration  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Subcommittee Session Protocol

### Opening a Subcommittee Session

1. Lead declares session open with goal
2. Verify quorum (3 members minimum)
3. Research Clerk begins investigation if needed
4. Discussion proceeds toward goal

### Closing a Subcommittee Session

1. Lead summarizes findings
2. Document recommendations
3. Identify items requiring full committee attention
4. Schedule full committee report if needed

### Subcommittee Report Format

```markdown
## Subcommittee Report

**From**: SC## - [Name]
**Lead**: [Name]
**Session Date**: [Date]
**Topic**: [Topic investigated]

### Findings
1. [Finding 1]
2. [Finding 2]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

### Items for Full Committee
- [ ] [Item requiring full committee decision]

### Knowledge Base Updates
- [ ] [Updates made or needed]
```

---

## Quick Reference

| To... | Contact... |
|-------|------------|
| Investigate receivable sync | SC01 - Jonathan Blake |
| Review customer data | SC02 - Rebecca Morrison |
| Discuss collection workflows | SC03 - Charles Wright |
| Address fee calculations | SC04 - Diana Foster |
| Review payment/autopay processing | SC05 - Marcus Chen |
| Investigate plan compilation | SC06 - Kevin O'Brien |
| Review ERP pull | SC07 - Thomas Grant |
| Review ERP push | SC08 - Lisa Nakamura |
| Review Events domain (capture/dispatch) | SC09 - Dr. Sarah Kim |
| Address GL posting | SC10 - Robert Huang |
| Verify legacy alignment | SC11 - Dr. Victor Kozlov |
| Audit performance | SC12 - Priya Nakamura |
| Review UI patterns | SC13 - Nicole Chen |
| Plan testing strategy | SC14 - Michael Torres |
| Plan migration | SC15 - Samuel Reed |

---

*"Subcommittees provide depth; the full committee provides breadth."*

