# Flow 5: Card Transaction → New Vendor + Closed Period

> **Session:** SC-2025-12-29-001 (Spec), SC-2026-01-01-003 (Implementation)  
> **Category:** Card Transaction  
> **Period:** Closed (fallback to next open)  
> **Vendor:** New (below threshold)  
> **Status:** ✅ COMPLETE (Verified 2026-01-01)

---

## Scenario

- Transaction date falls in a **closed period**
- Vendor does **not** exist in ERP
- Amount is **below threshold** (auto-create allowed)
- **Combined behavior**: Vendor auto-creation + Period fallback

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              FLOW 5: CARD → NEW VENDOR + CLOSED PERIOD                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   This flow combines:                                                           │
│   • Flow 2: New vendor auto-creation (below threshold)                          │
│   • Flow 4: Closed period fallback                                              │
│                                                                                 │
│   TEAMPAY PRODUCT DOMAIN                                                        │
│   ┌──────────────────────┐                                                      │
│   │ ExpenseCardTransaction│                                                     │
│   │ - amount: $500        │ ← Below threshold                                   │
│   │ - vendor: Airtable    │ ← NEW vendor                                        │
│   │ - date: March 25      │ ← In CLOSED period                                  │
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
│   │ │  1. Query: Does vendor exist? → NO                             │   │      │
│   │ │  2. Check policy: should_auto_create?($500) → YES              │   │      │
│   │ │  3. AUTO-CREATE vendor "Airtable" in NetSuite                  │   │      │
│   │ │     → Vendor created with external_id                          │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   │                                                                      │      │
│   │ Step 5: Validate Accounting Period                                   │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │  1. Check: Is March 25 in open period? → NO (March closed)     │   │      │
│   │ │  2. Find next open period → April 2025                         │   │      │
│   │ │  3. Apply fallback:                                            │   │      │
│   │ │     - PRESERVE trandate: March 25                              │   │      │
│   │ │     - SET postingperiod: April 2025                            │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   │                                                                      │      │
│   │ Step 6-10: Push Bill + Payment to April period                       │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │               S Y N C  &  B R I D G E                            │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ WorkspaceSyncReactor                                                 │      │
│   │ → Syncs newly created vendor                                         │      │
│   │ → Syncs Bill + Payment                                               │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ BridgeReactor                                                        │      │
│   │ → VendorWrapperService: Link new ERP vendor                          │      │
│   │ → BillReconciliation: Link Bill to transaction                       │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   RESULT:                                                                       │
│   ✓ Vendor created in ERP                                                       │
│   ✓ Transaction Date: March 25 (preserved)                                      │
│   ✓ ERP Posting Period: April 2025 (fallback)                                   │
│   ✓ Status = Synced                                                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Dates

| Date Type | Value |
|-----------|-------|
| Transaction Date | March 25 (preserved) |
| ERP Posting Period | April 2025 (fallback) |

---

## Verification Checklist

- [x] **Vendor created** automatically *(SC-2026-01-01-003)*
- [x] Transaction Date **preserved** *(SC-2026-01-01-003)*
- [x] ERP Posting Period **moved forward** *(SC-2026-01-01-003)*
- [x] Status = **Synced** *(verified via lifecycle test)*

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-VENDOR-001 | Push Step 4 | Vendor policy check | 🔴 Critical | ✅ RESOLVED (SC-2026-01-01-003) |
| GAP-PERIOD-001 | Push Step 5 | Period validation | 🔴 Critical | ✅ RESOLVED (SC-2026-01-01-003) |

This flow combines Flow-02 and Flow-04 behavior - both have been verified.

---

## Test Coverage (SC-2026-01-01-003)

| Test ID | Description | Status |
|---------|-------------|--------|
| F05-T01 | New vendor + closed period → push succeeds | ✅ PASS |
| F05-T02 | Verify 3 PushEntityRecords created | ✅ PASS |
| F05-T03 | Bill has original trandate + adjusted postingperiod | ✅ PASS |
| F05-T04 | Full lifecycle: Push → Sync → Bridge | ✅ PASS |
| F05-T05 | Amount just below threshold | ✅ PASS |
| F05-T06 | Amount above threshold (blocked) | ✅ PASS |
| F05-T07 | Vendor auto-creation metadata | ✅ PASS |
| F05-T08 | Amount at threshold (blocked) | ✅ PASS |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Auto Sync | Part 1 | Flow 8 |
| Manual Sync | Part 2 | Flow 8 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

