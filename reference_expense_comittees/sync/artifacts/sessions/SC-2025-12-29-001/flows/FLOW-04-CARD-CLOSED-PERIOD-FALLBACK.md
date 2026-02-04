# Flow 4: Card Transaction → Closed Period Fallback

> **Session:** SC-2025-12-29-001  
> **Category:** Card Transaction  
> **Period:** Closed (fallback to next open)  
> **Vendor:** Existing  
> **Status:** Gap Analysis Complete

---

## Scenario

- Transaction date (March 28) falls in a **closed period**
- Transaction was blocked before close (missing receipt or incomplete coding)
- Closed-period fallback posting: **ENABLED**
- Receipt uploaded **after** period closes

---

## Timeline

```
March 28        March 31           April 1           April 2
   │               │                  │                 │
   ▼               ▼                  ▼                 ▼
Card txn        Period            Receipt           Sync
settles         closes            uploaded          triggered
                                  (after close)
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              FLOW 4: CARD → CLOSED PERIOD (FALLBACK POSTING)                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   TEAMPAY PRODUCT DOMAIN                                                        │
│   ┌──────────────────────┐                                                      │
│   │ ExpenseCardTransaction│                                                     │
│   │ - amount: $240        │                                                     │
│   │ - vendor: Figma       │                                                     │
│   │ - date: March 28      │ ← Transaction date                                  │
│   │ - receipt: uploaded   │ ← Uploaded after March closed                       │
│   │   April 2             │                                                     │
│   │ - status: ready_sync  │                                                     │
│   └──────────┬───────────┘                                                      │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                    P U S H   P H A S E                           │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ PushCardSpendReactor                                           │      │
│   │                                                                      │      │
│   │ [CRITICAL STEP] Validate Accounting Period                           │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │                                                                │   │      │
│   │ │  transaction_date = March 28, 2025                             │   │      │
│   │ │                                                                │   │      │
│   │ │  Step 1: Query for open period containing March 28             │   │      │
│   │ │  ┌──────────────────────────────────────────────────────────┐  │   │      │
│   │ │  │ SELECT * FROM accounting_periods                         │  │   │      │
│   │ │  │ WHERE begin_date <= 'March 28'                           │  │   │      │
│   │ │  │   AND end_date >= 'March 28'                             │  │   │      │
│   │ │  │   AND is_open = true                                     │  │   │      │
│   │ │  │                                                          │  │   │      │
│   │ │  │ Result: NO ROWS (March period is CLOSED)                 │  │   │      │
│   │ │  └──────────────────────────────────────────────────────────┘  │   │      │
│   │ │                                                                │   │      │
│   │ │  Step 2: Fallback - Find next open period                      │   │      │
│   │ │  ┌──────────────────────────────────────────────────────────┐  │   │      │
│   │ │  │ SELECT * FROM accounting_periods                         │  │   │      │
│   │ │  │ WHERE begin_date > 'March 28'                            │  │   │      │
│   │ │  │   AND is_open = true                                     │  │   │      │
│   │ │  │ ORDER BY begin_date ASC                                  │  │   │      │
│   │ │  │ LIMIT 1                                                  │  │   │      │
│   │ │  │                                                          │  │   │      │
│   │ │  │ Result: April 2025 (begins April 1)                      │  │   │      │
│   │ │  └──────────────────────────────────────────────────────────┘  │   │      │
│   │ │                                                                │   │      │
│   │ │  Step 3: Apply fallback                                        │   │      │
│   │ │  ┌──────────────────────────────────────────────────────────┐  │   │      │
│   │ │  │                                                          │  │   │      │
│   │ │  │  PRESERVE: transaction_date = March 28                   │  │   │      │
│   │ │  │  SET:      posting_period = "Apr 2025"                   │  │   │      │
│   │ │  │  SET:      posting_date = April 1                        │  │   │      │
│   │ │  │                                                          │  │   │      │
│   │ │  └──────────────────────────────────────────────────────────┘  │   │      │
│   │ │                                                                │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   │                                                      GAP-PERIOD-001  │      │
│   │                                                      GAP-PERIOD-003  │      │
│   │                                                                      │      │
│   │ Push to NetSuite:                                                    │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │  Vendor Bill:                                                  │   │      │
│   │ │    trandate: "2025-03-28"    ← Original date PRESERVED         │   │      │
│   │ │    postingperiod: "Apr 2025" ← Moved to next open period       │   │      │
│   │ │    amount: $240                                                │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   │                                                                      │      │
│   │  Bill Payment: Posted April 1, same pattern                          │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │               S Y N C  &  B R I D G E                            │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   Normal sync and bridge flow (same as Flow 1)                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Dates

| Date Type | Value | Notes |
|-----------|-------|-------|
| **Transaction Date** | March 28, 2025 | **PRESERVED** - for reporting/audit |
| **ERP Posting Date** | April 1, 2025 | Moved to next open period |
| **Posting Period** | April 2025 | Open period |

---

## ERP Records Created

### Vendor Bill

| Field | Value |
|-------|-------|
| Vendor | Figma |
| Amount | $240 |
| **trandate** | **March 28** (preserved) |
| **postingperiod** | **Apr 2025** (fallback) |
| GL Account | 6100 (Software Subscriptions) |
| Receipt | Attached |

### Bill Payment

| Field | Value |
|-------|-------|
| Amount | $240 |
| **Posting Date** | **April 1** |
| Account | AP Clearing |

---

## Verification Checklist

- [ ] Transaction Date: **March 28** (preserved)
- [ ] ERP Posting Date: **April 1**
- [ ] Posting Period: **April 2025**
- [ ] Vendor: Existing (no creation)
- [ ] Status = **Synced**
- [ ] No error on closed period

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-PERIOD-001 | Push | Period validation may be missing in `PushCardSpendReactor` | 🔴 Critical | ⚠️ Needs verification |
| GAP-PERIOD-003 | Push | Need to verify `trandate` vs `postingperiod` are set correctly (not just adjusting trandate) | 🔴 High | ⚠️ Needs verification |

---

## Current Implementation Status

| Phase | Component | Status |
|-------|-----------|--------|
| Sync | `AccountingPeriod` resource with `is_open` | ✅ Exists |
| Push | Period validation in `PushJournalEntryReactor` | ✅ Confirmed |
| Push | Period validation in `PushCardSpendReactor` | ⚠️ Needs verification |
| Push | Fallback to next open period | ⚠️ Needs verification |
| Push | Preserve trandate, adjust postingperiod | ⚠️ Needs verification |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Auto Sync | Part 1 | Flow 6 |
| Manual Sync | Part 2 | Flow 6 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

