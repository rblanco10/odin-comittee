# Flow 2: Card Transaction → New Vendor Below Threshold (Open Period)

> **Session:** SC-2025-12-29-001 (Spec), SC-2025-12-31-001 (Implementation)  
> **Category:** Card Transaction  
> **Period:** Open  
> **Vendor:** New (below threshold)  
> **Status:** ✅ COMPLETE (Verified 2026-01-01)

---

## Scenario

- Accounting period is **open**
- Vendor (e.g., Notion) does **not** exist in ERP
- Transaction amount = **$80** (below $5,000 threshold)
- Vendor auto-create policy: **Threshold mode**

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                   FLOW 2: CARD → NEW VENDOR BELOW THRESHOLD                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   TEAMPAY PRODUCT DOMAIN                                                        │
│   ┌──────────────────────┐                                                      │
│   │ ExpenseCardTransaction│                                                     │
│   │ - amount: $80         │ ← Below $5,000 threshold                            │
│   │ - vendor: Notion (NEW)│ ← Does NOT exist in ERP                             │
│   └──────────┬───────────┘                                                      │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                    P U S H   P H A S E                           │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ PushCardSpendReactor                                           │      │
│   │                                                                      │      │
│   │ Step 4: Ensure vendor exists                                         │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │                                                                │   │      │
│   │ │  1. Query: Does vendor exist in ERP?                           │   │      │
│   │ │     → Result: NO                                               │   │      │
│   │ │                                                                │   │      │
│   │ │  2. Load VendorPolicy for connection                           │   │      │
│   │ │     ┌───────────────────────────────────────────────────┐      │   │      │
│   │ │     │ VendorPolicy                                      │      │   │      │
│   │ │     │ - creation_mode: :threshold                       │      │   │      │
│   │ │     │ - threshold: $5,000                               │      │   │      │
│   │ │     └───────────────────────────────────────────────────┘      │   │      │
│   │ │                                                                │   │      │
│   │ │  3. Check: VendorPolicy.should_auto_create?(policy, $80)       │   │      │
│   │ │     → $80 < $5,000 = TRUE ✓                                    │   │      │
│   │ │                                                                │   │      │
│   │ │  4. AUTO-CREATE vendor in NetSuite                             │   │      │
│   │ │     → Push minimal vendor: { name: "Notion" }                  │   │      │
│   │ │     → Receive external_id: "VEND-789"                          │   │      │
│   │ │                                                                │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   │                                                        ▲             │      │
│   │                                                        │             │      │
│   │                                             GAP-VENDOR-001           │      │
│   │                                             Is this implemented?     │      │
│   │                                                                      │      │
│   │ Step 5-10: Push Bill + Payment (same as Flow 1)                      │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                    S Y N C   P H A S E                           │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────┐                                              │
│   │   WorkspaceSyncReactor       │                                              │
│   │                              │                                              │
│   │ → Syncs newly created vendor │ ← Vendor now exists in ERP                   │
│   │ → Syncs Bill + Bill Payment  │                                              │
│   └──────────┬───────────────────┘                                              │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                   B R I D G E   P H A S E                        │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────┐                                              │
│   │      BridgeReactor           │                                              │
│   │                              │                                              │
│   │ Step 20: VendorWrapper       │ → Links ERP Vendor → VendorDetail            │
│   │ Step 9: BillReconciliation   │ → Links Bill → Invoice                       │
│   └──────────────────────────────┘                                              │
│                                                                                 │
│   RESULT: Vendor auto-created, transaction synced                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Vendor Policy Logic

```elixir
# From VendorPolicy resource
def should_auto_create?(%{creation_mode: :auto_create}, _amount), do: true
def should_auto_create?(%{creation_mode: :manual}, _amount), do: false
def should_auto_create?(%{creation_mode: :threshold, threshold: nil}, _amount), do: false
def should_auto_create?(%{creation_mode: :threshold, threshold: threshold}, amount) do
  amount <= threshold
end
```

---

## ERP Records Created

### New Vendor (Auto-Created)

| Field | Value |
|-------|-------|
| Name | Notion |
| Status | Active |
| Created By | Teampay Integration |

### Vendor Bill

| Field | Value |
|-------|-------|
| Vendor | Notion (newly created) |
| Amount | $80 |
| Transaction Date | Settlement date |
| Posting Period | Current open period |

### Bill Payment

| Field | Value |
|-------|-------|
| Amount | $80 |
| Account | AP Clearing |

---

## Verification Checklist

- [x] Vendor **created automatically** in ERP *(SC-2025-12-31-001)*
- [x] Transaction Date = ERP Posting Date *(SC-2025-12-31-001)*
- [x] Status = **Synced** *(verified via lifecycle test)*
- [x] Vendor synced back to Teampay mirrors *(verified via lifecycle test)*
- [x] VendorWrapper links ERP Vendor to VendorDetail *(via VendorReconciliationService)*
- [x] PushEntityRecord(:vendor) created with external_id *(SC-2025-12-31-001)*
- [x] Threshold blocking works correctly *(3rd test case)*

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-VENDOR-001 | Push Step 4 | `VendorPolicy.should_auto_create?` integration | 🔴 Critical | ✅ **RESOLVED** (SC-2025-12-31-001) |

---

## Current Implementation Status

| Phase | Component | Status |
|-------|-----------|--------|
| Push | `PushCardSpendReactor` Step 4 (vendor ensure) | ✅ Complete |
| Push | `handle_missing_vendor/3` | ✅ Complete (lines 426-472) |
| Push | `auto_create_vendor/3` | ✅ Complete (lines 474-530) |
| Push | `VendorPolicy` resource | ✅ Complete |
| Push | `VendorPolicy.should_auto_create?/2` | ✅ Complete |
| Sync | Vendor sync | ✅ Complete |
| Bridge | `VendorReconciliationService` | ✅ Complete |
| Bridge | `BillReconciliationService` | ✅ Complete |
| Test | Full Lifecycle (Push → Sync → Bridge) | ✅ 3 tests passing |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Auto Sync | Part 1 | Flow 3 |
| Manual Sync | Part 2 | Flow 3 |
| Vendor Policy | Part 3 | Flow A1 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

