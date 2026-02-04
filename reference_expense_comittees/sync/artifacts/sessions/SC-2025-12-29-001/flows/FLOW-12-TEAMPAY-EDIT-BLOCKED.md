# Flow 12: Teampay Edit Blocked (Closed Period)

> **Session:** SC-2025-12-29-001  
> **Category:** Edit/Sync  
> **Period:** Closed  
> **Direction:** Teampay → (blocked)  
> **Status:** Gap Analysis Complete

---

## Scenario

- Transaction was synced to ERP
- Accounting period is now **CLOSED**
- User attempts to edit coding in Teampay
- **Edit is BLOCKED**

---

## Key Invariant

> **When period is closed, no edits are allowed in Teampay.**
>
> - User cannot change coding for synced transactions
> - Prevents data divergence
> - All changes must happen in ERP (source of truth)

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              FLOW 12: TEAMPAY EDIT BLOCKED (CLOSED PERIOD)                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   INITIAL STATE                                                                 │
│   ┌─────────────────────┐         ┌─────────────────────┐                       │
│   │ Teampay             │         │ NetSuite            │                       │
│   │                     │         │                     │                       │
│   │ CardTransaction     │◀───────▶│ Vendor Bill         │                       │
│   │ - Department: Sales │  SYNCED │ - Department: Sales │                       │
│   │ - Period: March     │         │ - Period: March     │ ← CLOSED              │
│   │ - Status: Synced    │         │                     │                       │
│   └─────────────────────┘         └─────────────────────┘                       │
│                                                                                 │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                        USER ATTEMPTS EDIT IN TEAMPAY                            │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ Teampay UI - Transaction Detail                                         │   │
│   │                                                                         │   │
│   │ ┌─────────────────────────────────────────────────────────────────┐     │   │
│   │ │ Transaction: SaaS Subscription                                 │     │   │
│   │ │                                                                 │     │   │
│   │ │ Department: [Sales        ▼] ← User clicks dropdown             │     │   │
│   │ │                                                                 │     │   │
│   │ │ ╔══════════════════════════════════════════════════════════════╗│     │   │
│   │ │ ║ 🔒 Edit Blocked                                              ║│     │   │
│   │ │ ║                                                              ║│     │   │
│   │ │ ║ This transaction was posted in a closed accounting period.  ║│     │   │
│   │ │ ║ Changes must be made directly in NetSuite.                  ║│     │   │
│   │ │ ╚══════════════════════════════════════════════════════════════╝│     │   │
│   │ │                                                                 │     │   │
│   │ │ [Cancel]                                                        │     │   │
│   │ └─────────────────────────────────────────────────────────────────┘     │   │
│   │                                                                         │   │
│   │                                                     GAP-PERIOD-002       │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   ALTERNATIVE UI: Read-Only Fields                                              │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                         │   │
│   │ Transaction: SaaS Subscription                                          │   │
│   │                                                                         │   │
│   │ Department: Sales 🔒 ← Field disabled, lock icon shown                  │   │
│   │ Location: NYC 🔒                                                        │   │
│   │ Class: Opex 🔒                                                          │   │
│   │                                                                         │   │
│   │ ┌───────────────────────────────────────────────────────────────┐       │   │
│   │ │ ℹ️ Coding locked - accounting period is closed                │       │   │
│   │ └───────────────────────────────────────────────────────────────┘       │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   LOGIC FLOW:                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                         │   │
│   │  User attempts edit                                                     │   │
│   │        │                                                                │   │
│   │        ▼                                                                │   │
│   │  ┌───────────────────────────────────────┐                              │   │
│   │  │ Check: Is transaction synced to ERP?  │                              │   │
│   │  └───────────────┬───────────────────────┘                              │   │
│   │                  │ YES                                                  │   │
│   │                  ▼                                                      │   │
│   │  ┌───────────────────────────────────────┐                              │   │
│   │  │ Check: Is posting period open?        │                              │   │
│   │  │                                       │                              │   │
│   │  │ Query AccountingPeriod:               │                              │   │
│   │  │   WHERE begin_date <= trandate        │                              │   │
│   │  │     AND end_date >= trandate          │                              │   │
│   │  │     AND is_open = true                │                              │   │
│   │  └───────────────┬───────────────────────┘                              │   │
│   │                  │ NO (period closed)                                   │   │
│   │                  ▼                                                      │   │
│   │  ╔═══════════════════════════════════════╗                              │   │
│   │  ║         BLOCK EDIT                    ║                              │   │
│   │  ║                                       ║                              │   │
│   │  ║  Return: {:error, :period_closed}     ║                              │   │
│   │  ║  Display: Blocking message            ║                              │   │
│   │  ╚═══════════════════════════════════════╝                              │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   RESULT:                                                                       │
│   - No changes saved                                                            │
│   - User informed of reason                                                     │
│   - Directed to make changes in ERP                                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Blocking Message

> **"This transaction was posted in a closed accounting period. Changes must be made directly in NetSuite."**

---

## When to Block

| Condition | Block Edit? |
|-----------|-------------|
| Transaction NOT synced yet | ❌ No - allow edit |
| Transaction synced, period OPEN | ❌ No - allow edit |
| Transaction synced, period CLOSED | ✅ **YES - block edit** |

---

## Verification Checklist

- [ ] Edit blocked for synced transactions in closed periods
- [ ] Appropriate error message displayed
- [ ] User can still VIEW transaction details
- [ ] Non-synced transactions still editable
- [ ] Open period transactions still editable

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-PERIOD-002 | UI | UI blocking for closed-period edits not implemented | 🔴 Critical | 🔴 Missing |
| GAP-PERIOD-002a | Backend | Period check in update action | 🔴 Critical | ⚠️ Needs verification |

---

## Current Implementation Status

| Phase | Component | Status |
|-------|-----------|--------|
| Backend | Period check on transaction update | ⚠️ Needs verification |
| UI | Lock icon / disabled fields | 🔴 Missing |
| UI | Blocking message | 🔴 Missing |
| UI | Period status indicator | 🔴 Missing |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Auto Sync | Part 1 | Flow 10 |
| Manual Sync | Part 2 | Flow 8 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

