# Decisions

> **Session**: 2026-01-09_014_integration-verification  
> **Status**: IN PROGRESS

---

## Summary of Findings

### Migration Status
- **Files Migrated**: ~1,792 (62%)
- **Files Not Migrated**: ~700 (38%)
- **Compiles**: Yes
- **Functional at Runtime**: Partial (~50-55% for Expense)

### Critical Gaps Identified

| Gap | Impact | Files | Priority |
|-----|--------|-------|----------|
| **Workforce** | Blocks manager chains, departments, org chart | 157 | 🔴 CRITICAL |
| **Budget** | No budget tracking functionality | 89 | 🔴 HIGH |
| **Open Banking** | No bank account verification | 154 | 🟡 MEDIUM |
| **Observability** | No Loki/Tempo/Prometheus | 43 | 🟡 MEDIUM |
| **Communications (wiring)** | Emails don't actually send | — | 🔴 HIGH |
| **Audit (wiring)** | Audit logs don't persist | — | 🟡 MEDIUM |

### Stub Categories

1. **Architectural Stubs** (Expected): Lower tiers stubbing higher tier types — these are correct
2. **Missing Functionality Stubs** (Critical): Code that needs to be migrated
3. **Wiring Stubs** (Fixable): Migrated code not yet connected

---

## Pending Decisions

### DECISION-001: Workforce Migration Strategy
**Status**: PENDING HUMAN DIRECTOR INPUT

**Options**:
1. **Full Migration** — Migrate all 157 files from `ember_workforce` to `infra_workforce`
   - Pros: Complete functionality, proper architecture
   - Cons: 2-3 sessions of work
   
2. **Minimal Shim** — Create lightweight Employee/Department resources in `infra_identity`
   - Pros: Quick unblock (~1 session)
   - Cons: Technical debt, duplicate concepts later
   
3. **Accept Limitations** — Ship with specific-user-only approvals
   - Pros: Ship faster
   - Cons: Major feature gaps, poor UX

### DECISION-002: Budget Module
**Status**: PENDING

**Options**:
1. Migrate `ember_budget` to `product_expense` (product-tier budget tracking)
2. Defer budget functionality entirely
3. Create minimal budget stubs to unblock workflows

### DECISION-003: Communications Wiring
**Status**: RECOMMENDED FOR IMMEDIATE ACTION

`infra_communications` is migrated but not wired. Recommendation:
- Wire the actual email/notification delivery
- This is a wiring task, not a migration task
- Estimated: ~0.5 session

### DECISION-004: Audit Wiring
**Status**: RECOMMENDED FOR IMMEDIATE ACTION

`domain_audit` is migrated but adapters still stub. Recommendation:
- Wire audit adapters across all apps to call `domain_audit`
- This is a wiring task, not a migration task
- Estimated: ~0.5 session

---

## Approved This Session

*None yet — awaiting Human Director input on priorities.*

---

## Deferred

| Item | Reason |
|------|--------|
| `product_receivables` | Human Director guidance: aspirational |
| `product_payables` | Human Director guidance: aspirational |
| `product_treasury` | Human Director guidance: aspirational |
| Tier 5 Web | Pending product completion |
