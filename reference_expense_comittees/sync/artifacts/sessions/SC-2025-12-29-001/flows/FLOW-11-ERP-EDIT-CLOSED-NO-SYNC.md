# Flow 11: ERP Edit (Closed Period) - No Sync Back to Teampay

> **Session:** SC-2025-12-29-001  
> **Category:** Edit/Sync  
> **Period:** Closed  
> **Direction:** ERP only (no bi-directional)  
> **Status:** Gap Analysis Complete

---

## Scenario

- Transaction was pushed from Teampay to ERP
- Accounting period is now **CLOSED**
- Finance admin edits coding in NetSuite
- **ERP changes are NOT synced back to Teampay**

---

## Key Invariant

> **When period is closed, ERP is authoritative.**
>
> - ERP changes do NOT propagate to Teampay
> - Teampay retains original values (for historical reference)
> - ERP record is the "source of truth" for GL

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              FLOW 11: ERP EDIT (CLOSED) - NO SYNC BACK                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   INITIAL STATE (Period is CLOSED)                                              │
│   ┌─────────────────────┐         ┌─────────────────────┐                       │
│   │ Teampay             │         │ NetSuite            │                       │
│   │                     │         │                     │                       │
│   │ CardTransaction     │◀───────▶│ Vendor Bill         │                       │
│   │ - Department: Sales │  SYNCED │ - Department: Sales │                       │
│   │ - Period: March     │         │ - Period: March     │ ← CLOSED              │
│   └─────────────────────┘         └─────────────────────┘                       │
│                                                                                 │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                        ADMIN EDITS IN NETSUITE                                  │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ NetSuite UI                                                             │   │
│   │                                                                         │   │
│   │ Finance admin re-opens period temporarily for adjustment                │   │
│   │                                                                         │   │
│   │ BEFORE:                        AFTER:                                   │   │
│   │ Department: Sales      →       Department: Marketing ← CHANGE           │   │
│   │                                                                         │   │
│   │ [Save] → Period re-closed                                               │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                        NEXT SCHEDULED SYNC                                      │
│   ═══════════════════════════════════════════════════════════════════════════   │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                    S Y N C   P H A S E                           │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────┐                                              │
│   │   WorkspaceSyncReactor       │                                              │
│   │                              │                                              │
│   │ 1. Fetch bills from NS       │                                              │
│   │ 2. Find Bill with changes    │                                              │
│   │    - Department: Marketing   │ ← Change detected                            │
│   │ 3. Upsert to Bill mirror     │ ← Mirror DOES update                         │
│   └──────────┬───────────────────┘                                              │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                   B R I D G E   P H A S E                        │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ BridgeReactor                                                        │      │
│   │                                                                      │      │
│   │ Step 9: BillReconciliationService                                    │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │  1. Find linked transaction                                    │   │      │
│   │ │                                                                │   │      │
│   │ │  2. Check: Is period OPEN?                                     │   │      │
│   │ │     → NO (March 2025 is CLOSED)                                │   │      │
│   │ │                                                                │   │      │
│   │ │  ╔════════════════════════════════════════════════════════╗    │   │      │
│   │ │  ║           SKIP BI-DIRECTIONAL SYNC                     ║    │   │      │
│   │ │  ║                                                        ║    │   │      │
│   │ │  ║  - Do NOT update product domain                        ║    │   │      │
│   │ │  ║  - ERP is authoritative for closed periods             ║    │   │      │
│   │ │  ║  - Teampay retains original values                     ║    │   │      │
│   │ │  ╚════════════════════════════════════════════════════════╝    │   │      │
│   │ │                                                                │   │      │
│   │ │  3. Log: "Period closed - ERP edit not synced to Teampay"      │   │      │
│   │ │                                                                │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   RESULT:                                                                       │
│   ┌─────────────────────┐         ┌─────────────────────┐                       │
│   │ Teampay             │         │ NetSuite            │                       │
│   │                     │         │                     │                       │
│   │ CardTransaction     │    ≠    │ Vendor Bill         │                       │
│   │ - Department: Sales │ DIFFERS │ - Department:       │                       │
│   │   (unchanged)       │         │   Marketing         │                       │
│   └─────────────────────┘         └─────────────────────┘                       │
│                                                                                 │
│   ERP Mirror:                                                                   │
│   ┌─────────────────────┐                                                       │
│   │ Bill                │                                                       │
│   │ - Department:       │ ← Mirror has ERP values                               │
│   │   Marketing         │                                                       │
│   └─────────────────────┘                                                       │
│                                                                                 │
│   ACCEPTABLE DIVERGENCE:                                                        │
│   - Teampay shows historical "original coding"                                  │
│   - ERP shows "as adjusted for GL"                                              │
│   - Reporting can choose which source to use                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Why This is Acceptable

| Perspective | Value | Reason |
|-------------|-------|--------|
| **ERP/GL** | Marketing | Source of truth for closed books |
| **Teampay** | Sales | Historical record of original coding |
| **Reporting** | Either | Query can choose ERP mirror or product domain |

---

## Verification Checklist

- [ ] ERP edit detected during sync
- [ ] Period is **closed** → bi-directional sync **skipped**
- [ ] ERP mirror updated with new value
- [ ] Product domain **unchanged**
- [ ] Log entry created

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-BIDI-001 | Bridge | Period check before bi-directional sync | 🔴 Critical | 🔴 Missing |

Same gap as Flow 10 - the bi-directional mechanism needs to be implemented with period checking.

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Auto Sync | Part 1 | Flow 9 |
| Manual Sync | Part 2 | Flow 7 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

