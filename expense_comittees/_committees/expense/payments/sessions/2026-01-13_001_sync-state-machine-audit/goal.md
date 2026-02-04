# Session Goal

> **Session ID**: 2026-01-13_001_sync-state-machine-audit  
> **Type**: Deliberative Session  
> **Status**: ACTIVE  
> **Opened**: 2026-01-13  
> **Chair**: Victoria Sterling

---

## Objective

Audit and fix the sync/push state machine to address three critical production issues:

1. **GAP-SYNC-STATUS-001**: Card transaction `erp_synced_at` never updated after push (stuck "Pending")
2. **GAP-DUPLICATE-001**: Duplicate records created due to missing `erp_connection_id` in reconciliation queries
3. **GAP-RETRY-001**: Failed push status not persisted to database (stays "Pending" instead of "Failed")

---

## Human Director Request

> "i have had a couple of experiences:
> - it seems the sync state is always pending even after sync, on the txn and on the actual worker or job
> - sometimes it creates 2 records instead of one, not sure what causes it
> - when a sync fails, it stays pending and when i try to sync again it doesnt let me cause it says it already synced"

---

## Scope

### Entity Types Affected

| Entity Type | GAP-SYNC-STATUS-001 | GAP-DUPLICATE-001 | GAP-RETRY-001 |
|-------------|---------------------|-------------------|---------------|
| Card Transactions | ✅ AFFECTED | ✅ AFFECTED | ✅ AFFECTED |
| Expense Reports | ❌ (already working) | ✅ AFFECTED | ✅ AFFECTED |

### Files to Modify

1. `push_card_spend_reactor.ex` - Add step to update source transaction
2. `execute_push.ex` - Fix status persistence on failure
3. All 10 reconciliation services - Add `erp_connection_id` to queries

---

## Success Criteria

1. After successful card transaction push, `ExpenseCardTransaction.erp_synced_at` is populated
2. Reconciliation queries include `erp_connection_id` to prevent cross-connection matches
3. Failed push requests are persisted as `:failed` in database, not left as `:pending`
4. User can retry failed pushes after fixing the underlying issue

---

## Activated Members

### Leadership
- Victoria Sterling (Chair)
- Adrian Cross (Vice Chair - Integration)
- Patricia Thornton (Parliamentarian)

### Domain Experts
- Linda Tran (Financial Reconciliation Expert)

### Critics
- Dr. Eleanor Vance (Security Adversary)
- Priya Sharma (Integration Pessimist)
- Elena Rodriguez (Failure Advocate)
- Gregory Stein (Consistency Challenger)

### Technical Specialists
- Brandon Taylor (Ash Framework Expert)
- James Wright (Reactor Specialist)

### Historians
- Dr. Henry Blackwood (Session Historian)

---

## Agenda

1. **Opening** - Chair presents findings from prior analysis
2. **Plan Presentation** - Present proposed fixes for all three gaps
3. **Critic Challenge Round** - Each critic challenges the plan
4. **Iteration** - Refine plan based on challenges
5. **Decision** - Vote on final implementation plan
6. **Action Items** - Assign implementation tasks

---

*"Excellence emerges from structured deliberation, not chaotic debate."*
