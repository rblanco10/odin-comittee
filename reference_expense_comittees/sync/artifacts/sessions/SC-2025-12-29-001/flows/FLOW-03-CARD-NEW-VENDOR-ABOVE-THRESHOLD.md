# Flow 3: Card Transaction → New Vendor Above Threshold (Blocked)

> **Session:** SC-2025-12-29-001 (Spec), SC-2026-01-01-001 (Implementation)  
> **Category:** Card Transaction  
> **Period:** Open  
> **Vendor:** New (above threshold)  
> **Status:** ✅ COMPLETE (Implemented 2026-01-01)

---

## Scenario

- Accounting period is **open**
- Vendor (e.g., Quantum Systems) does **not** exist in ERP
- Transaction amount = **$8,750** (ABOVE $5,000 threshold)
- Vendor auto-create policy: **Threshold mode**
- **Expected: Sync BLOCKED**

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                   FLOW 3: CARD → NEW VENDOR ABOVE THRESHOLD                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   TEAMPAY PRODUCT DOMAIN                                                        │
│   ┌──────────────────────┐                                                      │
│   │ ExpenseCardTransaction│                                                     │
│   │ - amount: $8,750      │ ← ABOVE $5,000 threshold                            │
│   │ - vendor: Quantum(NEW)│ ← Does NOT exist in ERP                             │
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
│   │ │  3. Check: VendorPolicy.should_auto_create?(policy, $8,750)    │   │      │
│   │ │     → $8,750 > $5,000 = FALSE ✗                                │   │      │
│   │ │                                                                │   │      │
│   │ │  ╔════════════════════════════════════════════════════════╗    │   │      │
│   │ │  ║              🛑 SYNC BLOCKED                           ║    │   │      │
│   │ │  ║                                                        ║    │   │      │
│   │ │  ║  Return error:                                         ║    │   │      │
│   │ │  ║  {:error, :vendor_threshold_exceeded}                  ║    │   │      │
│   │ │  ╚════════════════════════════════════════════════════════╝    │   │      │
│   │ │                                                                │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   │                                                                      │      │
│   │ PushRequest.status = :blocked                                        │      │
│   │ PushRequest.error_message = "Vendor auto-creation restricted..."     │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │                         UI NOTIFICATION                              │      │
│   │                                                                      │      │
│   │  ┌─────────────────────────────────────────────────────────────┐    │      │
│   │  │ ⚠️ Transaction blocked                                      │    │      │
│   │  │                                                             │    │      │
│   │  │ Vendor auto-creation is restricted for transactions over   │    │      │
│   │  │ $5,000. Please create or approve this vendor in the ERP    │    │      │
│   │  │ and retry sync.                                            │    │      │
│   │  │                                                             │    │      │
│   │  │    [Create Vendor in ERP]    [Retry Sync]                  │    │      │
│   │  └─────────────────────────────────────────────────────────────┘    │      │
│   │                                                                      │      │
│   │                                                   GAP-VENDOR-002     │      │
│   │                                                   GAP-UI-006         │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   SYNC & BRIDGE: Do not run until vendor created and sync retried               │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ TRANSACTION STATE                                                       │   │
│   │                                                                         │   │
│   │ ExpenseCardTransaction.sync_status = :blocked                           │   │
│   │ ExpenseCardTransaction.sync_error = "Vendor threshold exceeded"         │   │
│   │                                                                         │   │
│   │ Visible in UI:                                                          │   │
│   │ - Transactions tab shows "Blocked" badge                                │   │
│   │ - Detail view shows blocking message                                    │   │
│   │ - "Retry Sync" button available                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Blocking Message

> **"Vendor auto-creation is restricted for transactions over $5,000. Please create or approve this vendor in the ERP and retry sync."**

---

## Resolution Path

See **Flow 14: Resolution - Vendor Created → Retry Sync**

1. Finance creates vendor manually in NetSuite
2. Next sync pulls vendor to Teampay
3. Finance clicks "Retry Sync" on transaction
4. Push succeeds (vendor now exists)

---

## Verification Checklist

- [x] **No ERP vendor created automatically** *(F03-T03)*
- [x] **No Vendor Bill created** *(F03-T03)*
- [x] Transaction status = **Blocked** (not Failed) *(F03-T01)*
- [ ] Blocking message displayed in UI *(OUT OF SCOPE - UI work)*
- [ ] "Retry Sync" button available *(OUT OF SCOPE - UI work, see Flow-14)*
- [x] **No silent posting** *(verified by 0 PushEntityRecords)*

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-VENDOR-001 | Push Step 4 | Threshold check in reactor | 🔴 Critical | ✅ **RESOLVED** (SC-2026-01-01-001) |
| GAP-VENDOR-002 | UI | Blocking message and retry UI | 🔴 High | 🔴 OUT OF SCOPE (UI work) |
| GAP-UI-006 | UI | "Blocked" status display | 🟡 Medium | 🔴 OUT OF SCOPE (UI work) |

---

## Current Implementation Status

| Phase | Component | Status |
|-------|-----------|--------|
| Push | Threshold check in reactor | ✅ Complete (`handle_missing_vendor/3`) |
| Push | `:blocked` status on PushRequest | ✅ Complete (added to enum) |
| Push | `is_blocking_error?/1` detection | ✅ Complete (ExecutePush) |
| Test | 6 lifecycle tests | ✅ Complete |
| UI | Blocking message | 🔴 Future work |
| UI | Retry button | 🔴 Future work (Flow-14) |
| UI | "Blocked" badge | 🔴 Future work |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Vendor Policy | Part 3 | Flow A2 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

