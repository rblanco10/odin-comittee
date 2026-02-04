# Flow 6: Card Transaction → Auto-Create Disabled (Blocked)

> **Session:** SC-2025-12-29-001 (Spec), SC-2026-01-01-002 (Implementation)  
> **Category:** Card Transaction  
> **Period:** Open  
> **Vendor:** New (policy: manual only)  
> **Status:** ✅ COMPLETE

---

## Scenario

- Accounting period is **open**
- Vendor does **not** exist in ERP
- Transaction amount = **$450** (any amount)
- Vendor auto-create policy: **MANUAL** (disabled)
- **Expected: Sync BLOCKED**

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              FLOW 6: CARD → AUTO-CREATE DISABLED (BLOCKED)                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   CONFIGURATION                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ VendorPolicy                                                            │   │
│   │ - creation_mode: :manual                                                │   │
│   │ - threshold: N/A (not applicable when manual)                           │   │
│   │                                                                         │   │
│   │ "New vendors are never auto-created in the ERP.                         │   │
│   │  All vendors must exist in the ERP before transactions can be posted."  │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   TEAMPAY PRODUCT DOMAIN                                                        │
│   ┌──────────────────────┐                                                      │
│   │ ExpenseCardTransaction│                                                     │
│   │ - amount: $450        │                                                     │
│   │ - vendor: Airtable    │ ← Does NOT exist in ERP                             │
│   │   Pro Services (NEW)  │                                                     │
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
│   │ │     │ - creation_mode: :manual                          │      │   │      │
│   │ │     └───────────────────────────────────────────────────┘      │   │      │
│   │ │                                                                │   │      │
│   │ │  3. Check: VendorPolicy.should_auto_create?(policy, $450)      │   │      │
│   │ │     → creation_mode == :manual → FALSE ✗                       │   │      │
│   │ │                                                                │   │      │
│   │ │  ╔════════════════════════════════════════════════════════╗    │   │      │
│   │ │  ║              🛑 SYNC BLOCKED                           ║    │   │      │
│   │ │  ║                                                        ║    │   │      │
│   │ │  ║  Return error:                                         ║    │   │      │
│   │ │  ║  {:error, :vendor_not_found}                           ║    │   │      │
│   │ │  ╚════════════════════════════════════════════════════════╝    │   │      │
│   │ │                                                                │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   │                                                                      │      │
│   │ PushRequest.status = :blocked                                        │      │
│   │ PushRequest.error_message = "Vendor does not exist in ERP..."        │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │                         UI NOTIFICATION                              │      │
│   │                                                                      │      │
│   │  ┌─────────────────────────────────────────────────────────────┐    │      │
│   │  │ ⚠️ Transaction blocked                                      │    │      │
│   │  │                                                             │    │      │
│   │  │ This vendor does not exist in the ERP.                      │    │      │
│   │  │ Please create the vendor before syncing.                    │    │      │
│   │  │                                                             │    │      │
│   │  │    [Create Vendor in ERP]    [Retry Sync]                  │    │      │
│   │  └─────────────────────────────────────────────────────────────┘    │      │
│   │                                                                      │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   SYNC & BRIDGE: Do not run until vendor created and sync retried               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Blocking Message

> **"This vendor does not exist in the ERP. Please create the vendor before syncing."**

---

## Resolution Path

1. Finance creates vendor in NetSuite
2. Finance re-runs Manual Batch Sync
3. Transaction syncs (vendor now exists)

---

## Verification Checklist

- [x] **Vendor created explicitly** (not auto-created) — F06-T01, F06-T02
- [x] **No automatic vendor creation** — F06-T05 (no PushEntityRecords)
- [x] Transaction syncs **only after ERP vendor exists** — Policy blocks
- [x] Blocking message displayed — F06-T03 (exact message verified)

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-VENDOR-001 | Push Step 4 | Need to verify manual mode check | 🔴 Critical | ✅ RESOLVED (SC-2026-01-01-002) |
| GAP-VENDOR-002 | UI | Blocking message | 🔴 High | 🔴 Missing (UI out of scope) |

---

## Test Coverage (SC-2026-01-01-002)

| Test ID | Description | Status |
|---------|-------------|--------|
| F06-T01 | Small amount ($50) blocked | ✅ PASS |
| F06-T02 | Large amount ($5000) blocked | ✅ PASS |
| F06-T03 | Error message matches spec | ✅ PASS |
| F06-T04 | Status = :blocked (semantic) | ✅ PASS |
| F06-T05 | No PushEntityRecords created | ✅ PASS |
| F06-T06 | Threshold ignored when :manual | ✅ PASS |

**Subcommittee Approvals:**
- ✅ Code Fidelity Auditor
- ✅ Test Coverage Analyst
- ✅ Standards Enforcer

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Vendor Policy | Part 3 | Flow B1, B2 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001 (Spec), SC-2026-01-01-002 (Implementation)*

