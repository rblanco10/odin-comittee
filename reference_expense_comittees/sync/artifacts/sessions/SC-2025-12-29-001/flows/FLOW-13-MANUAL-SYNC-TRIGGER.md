# Flow 13: Manual Sync Trigger Flow

> **Session:** SC-2025-12-29-001  
> **Category:** Sync Configuration  
> **Mode:** Manual  
> **Status:** Gap Analysis Complete

---

## Scenario

- Workspace configured for **Manual Sync mode**
- Transactions are ready but NOT pushed automatically
- Finance user clicks "Sync" button to trigger push

---

## Key Invariants

> **Manual sync gives finance complete control over when transactions post to ERP.**
>
> - Transactions accumulate in "Ready to Sync" state
> - Finance reviews and triggers sync on their schedule
> - Supports batch sync (all ready) or individual sync

---

## Configuration

```elixir
# SyncPreferencesService
%{
  push_mode: :manual,  # :automatic or :manual
  sync_mode: :auto,    # Inbound sync still automatic
}
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FLOW 13: MANUAL SYNC TRIGGER                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   CONFIGURATION: push_mode = :manual                                            │
│                                                                                 │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                      TRANSACTIONS ACCUMULATE                                    │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ Teampay Product Domain                                                  │   │
│   │                                                                         │   │
│   │ Card transactions settle, receipts uploaded...                          │   │
│   │                                                                         │   │
│   │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐             │   │
│   │ │ CardTransaction │ │ CardTransaction │ │ CardTransaction │             │   │
│   │ │ status: ready   │ │ status: ready   │ │ status: ready   │             │   │
│   │ │ amount: $120    │ │ amount: $85     │ │ amount: $450    │             │   │
│   │ │ synced: NO      │ │ synced: NO      │ │ synced: NO      │             │   │
│   │ └─────────────────┘ └─────────────────┘ └─────────────────┘             │   │
│   │                                                                         │   │
│   │ Reimbursements approved, ready to pay...                                │   │
│   │                                                                         │   │
│   │ ┌─────────────────┐ ┌─────────────────┐                                 │   │
│   │ │ Reimbursement   │ │ Reimbursement   │                                 │   │
│   │ │ status: approved│ │ status: approved│                                 │   │
│   │ │ amount: $275    │ │ amount: $89     │                                 │   │
│   │ │ synced: NO      │ │ synced: NO      │                                 │   │
│   │ └─────────────────┘ └─────────────────┘                                 │   │
│   │                                                                         │   │
│   │ NO AUTOMATIC PUSH (push_mode = :manual)                                 │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                      FINANCE UI - SYNC DASHBOARD                                │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ 📊 Sync Dashboard                                                       │   │
│   │                                                                         │   │
│   │ ┌─────────────────────────────────────────────────────────────────────┐ │   │
│   │ │ Ready to Sync                                                       │ │   │
│   │ │                                                                     │ │   │
│   │ │ 5 transactions ready ($1,019 total)                                 │ │   │
│   │ │                                                                     │ │   │
│   │ │ ┌─────────────────────────────────────────────────────────────┐     │ │   │
│   │ │ │ [✓] Mar 15  Figma         $120   Sales/NYC     [Sync]      │     │ │   │
│   │ │ │ [✓] Mar 16  Notion        $85    Eng/SF        [Sync]      │     │ │   │
│   │ │ │ [✓] Mar 17  AWS           $450   Infra/AWS     [Sync]      │     │ │   │
│   │ │ │ [✓] Mar 18  Delta         $275   Sales/Travel  [Sync]      │     │ │   │
│   │ │ │ [✓] Mar 19  Coffee        $89    Marketing     [Sync]      │     │ │   │
│   │ │ └─────────────────────────────────────────────────────────────┘     │ │   │
│   │ │                                                                     │ │   │
│   │ │ [Sync Selected (5)]  [Sync All]                                     │ │   │
│   │ │                                           GAP-UI-001..005           │ │   │
│   │ └─────────────────────────────────────────────────────────────────────┘ │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                      USER CLICKS "SYNC ALL"                                     │
│   ═══════════════════════════════════════════════════════════════════════════   │
│              │                                                                  │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ ManualSyncService.sync_batch(transaction_ids, actor: current_user)   │      │
│   │                                                                      │      │
│   │ For each transaction:                                                │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │  1. Validate transaction is ready                              │   │      │
│   │ │  2. Create PushRequest                                         │   │      │
│   │ │  3. Invoke appropriate Push Reactor:                           │   │      │
│   │ │     - Card → PushCardSpendReactor                        │   │      │
│   │ │     - Reimbursement → PushExpenseReportReactor                 │   │      │
│   │ │  4. Process vendor policy (if applicable)                      │   │      │
│   │ │  5. Process period validation (if applicable)                  │   │      │
│   │ │  6. Push to ERP                                                │   │      │
│   │ │  7. Update PushRequest status                                  │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ UI Updates (Real-time)                                               │      │
│   │                                                                      │      │
│   │ ┌──────────────────────────────────────────────────────────────┐     │      │
│   │ │ Syncing...                                                   │     │      │
│   │ │                                                              │     │      │
│   │ │ ✅ Figma          $120   Synced                              │     │      │
│   │ │ ✅ Notion         $85    Synced                              │     │      │
│   │ │ ⏳ AWS            $450   Syncing...                          │     │      │
│   │ │ ⬜ Delta          $275   Pending                             │     │      │
│   │ │ ⬜ Coffee         $89    Pending                             │     │      │
│   │ │                                                              │     │      │
│   │ │ [Cancel]                                                     │     │      │
│   │ └──────────────────────────────────────────────────────────────┘     │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│              ▼                                                                  │
│   RESULT: All 5 transactions synced to ERP                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Sync Button Locations

| Location | Button | Scope | Gap ID |
|----------|--------|-------|--------|
| Transaction List | "Sync" (per row) | Single transaction | GAP-UI-001 |
| Transaction Detail | "Sync to ERP" | Single transaction | GAP-UI-002 |
| Ready to Pay Tab | "Sync Selected" / "Sync All" | Batch | GAP-UI-003 |
| All Transactions Tab | "Sync" (per row) | Single | GAP-UI-004 |
| Sync Dashboard | "Sync All" | All ready | GAP-UI-005 |

---

## Manual vs Auto Comparison

| Aspect | Auto Sync | Manual Sync |
|--------|-----------|-------------|
| Trigger | On status change (settled, approved) | User clicks "Sync" |
| Timing | Immediate | On-demand |
| Control | System | Finance |
| Batch Support | N/A (always individual) | ✅ Yes |
| Review Before Sync | ❌ No | ✅ Yes |

---

## Verification Checklist

- [ ] Transactions accumulate when push_mode = :manual
- [ ] "Sync" buttons visible in all required locations
- [ ] Single transaction sync works
- [ ] Batch sync works
- [ ] Progress shown during sync
- [ ] Errors displayed clearly

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-UI-001 | Transaction List | No "Sync" button per row | 🔴 Critical | 🔴 Missing |
| GAP-UI-002 | Transaction Detail | No "Sync to ERP" button | 🔴 Critical | 🔴 Missing |
| GAP-UI-003 | Ready to Pay Tab | No batch sync buttons | 🔴 Critical | 🔴 Missing |
| GAP-UI-004 | All Transactions Tab | No "Sync" button per row | 🔴 Critical | 🔴 Missing |
| GAP-UI-005 | Sync Dashboard | Dashboard doesn't exist | 🔴 Critical | 🔴 Missing |
| GAP-SERVICE-001 | Backend | `ManualSyncService` not implemented | 🔴 Critical | ⚠️ Needs verification |

---

## Current Implementation Status

| Component | Status |
|-----------|--------|
| `SyncPreferencesService` (push_mode) | ✅ Exists |
| `ManualSyncService` | ⚠️ Needs verification |
| UI - Sync buttons | 🔴 Missing |
| UI - Sync dashboard | 🔴 Missing |
| UI - Progress indicators | 🔴 Missing |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Manual Sync | Part 2 | All flows |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

