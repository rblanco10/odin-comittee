# Consolidated Product Requirements: ERP Sync

> **Session:** SC-2025-12-29-001  
> **Source:** Product Requirements (3-Part Series)  
> **Captured:** 2025-12-29  
> **Status:** Complete Documentation

---

## Quick Navigation

| Part | Document | Focus |
|------|----------|-------|
| 1 | [Auto Sync](REQUIREMENTS-PART-1-AUTO-SYNC.md) | System-driven sync, bi-directional editing |
| 2 | [Manual Sync](REQUIREMENTS-PART-2-MANUAL-SYNC.md) | Finance-controlled sync, reimbursement objects |
| 3 | [Vendor Policy](REQUIREMENTS-PART-3-VENDOR-POLICY.md) | Threshold-based vendor creation |

---

## Universal Invariants

> These 7 rules ALWAYS apply regardless of sync mode or vendor policy.

| # | Invariant |
|---|-----------|
| 1 | Teampay posts transactions using the **actual transaction date** |
| 2 | If that date falls in a **closed accounting period**, Teampay posts to the **next open period** while preserving the original transaction date |
| 3 | **Cards create vendor payables**; reimbursements do not |
| 4 | **Vendors are auto-created in the ERP only for card/AP spend** (subject to policy) |
| 5 | While a period is **open**, transaction edits are **bi-directionally synced** |
| 6 | Once a period is **closed**, the **ERP is authoritative** and Teampay becomes **read-only** |
| 7 | **Coding rules are updated only when explicitly edited in Teampay** |

---

## Sync Mode Comparison

| Aspect | Auto-Sync | Manual Sync |
|--------|-----------|-------------|
| **Trigger** | System-driven (on settlement/approval) | Finance clicks Sync button |
| **Timing** | Automatic | Finance-controlled |
| **Posting rules** | Identical | Identical |
| **Period handling** | Identical | Identical |
| **Vendor behavior** | Identical | Identical |
| **Bi-directional sync** | ✅ Open periods | ✅ Open periods |
| **Closed period behavior** | ERP authoritative | ERP authoritative |

---

## Transaction Type → ERP Records

| Transaction Type | ERP Records Created |
|------------------|---------------------|
| **Card Transaction** | Vendor Bill + Bill Payment |
| **Reimbursement Report** | Expense Report |
| **Reimbursement Payment** | AP Payment (employee as payee) |

---

## Vendor Creation Rules

| Spend Type | Auto-Create in ERP? | Notes |
|------------|---------------------|-------|
| Card/AP | ✅ Yes (if policy allows) | Subject to threshold |
| Reimbursement | ❌ **Never** | Teampay-only VendorDetail |

### Vendor Policy Options

| Policy | Auto-Create | Threshold | Behavior |
|--------|-------------|-----------|----------|
| **Full Auto** | ON | None (∞) | All new vendors auto-created |
| **Threshold** | ON | e.g., $5,000 | Auto-create below threshold, block above |
| **Manual Only** | OFF | N/A | All vendors must exist in ERP |

---

## Reimbursement Object Model

> Critical: Reimbursements have TWO distinct ERP objects with separate sync lifecycles.

| Object | Purpose | Sync Trigger | ERP Record |
|--------|---------|--------------|------------|
| Reimbursement Report | Represents expense | On approval | Expense Report |
| Reimbursement Payment | Represents cash movement | On payment execution | AP Payment |

---

## Period State → Editing Rules

| Period State | Teampay Edit | ERP Edit | Sync Direction |
|--------------|--------------|----------|----------------|
| **Open** | ✅ Allowed | ✅ Allowed | Bi-directional |
| **Closed** | ❌ Blocked | ✅ Allowed | ERP → (no sync back) |

---

## Blocking Messages Reference

| Scenario | Message |
|----------|---------|
| Closed period edit in Teampay | "This transaction is in a closed accounting period. Edits must be made directly in the ERP." |
| New vendor, above threshold | "Vendor auto-creation is restricted for transactions over $5,000. Please create or approve this vendor in the ERP and retry sync." |
| New vendor, auto-create disabled | "This vendor does not exist in the ERP. Please create the vendor before syncing." |

---

## Complete Flow Index

### Part 1: Auto Sync (10 Flows)

| # | Flow | Period | Key Behavior |
|---|------|--------|--------------|
| 1 | Card — Existing Vendor | Open | Vendor Bill + Bill Payment |
| 2 | Reimbursement — Existing Vendor | Open | Expense Report + AP Payment to employee |
| 3 | Card — New Vendor | Open | Auto-create vendor + Vendor Bill |
| 4 | Reimbursement — New Vendor | Open | Teampay-only VendorDetail, no ERP vendor |
| 5 | ERP Edits Coding | Open | Sync back to Teampay, no rule update |
| 6 | Card — Ready After Close | Closed | Post to next period, preserve date |
| 7 | Reimbursement — Closed Period | Closed | Post to next period |
| 8 | Card — New Vendor (Closed) | Closed | Auto-create + post to next period |
| 9 | ERP Edits | Closed | No sync back, ERP authoritative |
| 10 | Teampay Edit Blocked | Closed | Edit blocked with message |

### Part 2: Manual Sync (8 Flows)

| # | Flow | Key Difference |
|---|------|----------------|
| 1-4 | Same as Auto 1-4 | Finance triggers sync manually |
| 5 | ERP Edits | "Next Manual Sync Pull" updates Teampay |
| 6-8 | Same as Auto 6-8 | Finance triggers sync manually |

### Part 3: Vendor Policy (5 Flows)

| # | Flow | Policy | Key Behavior |
|---|------|--------|--------------|
| A1 | New Vendor Below Threshold | Threshold $5K | Auto-create + sync |
| A2 | New Vendor Above Threshold | Threshold $5K | Blocked, manual resolution |
| A3 | Vendor Created After Approval | Threshold $5K | Re-sync succeeds |
| B1 | Existing Vendor | No Auto-Create | Normal sync |
| B2 | New Vendor (Disabled) | No Auto-Create | Blocked until vendor created |

---

## Key Concepts Glossary

| Term | Definition |
|------|------------|
| **Transaction Date** | The actual date the expense occurred (always preserved) |
| **ERP Posting Date** | The date the transaction posts to the ERP accounting period |
| **Closed-Period Fallback** | When enabled, posts to next open period if transaction date is in closed period |
| **VendorDetail** | Teampay-only vendor record for attribution/reporting (not synced to ERP) |
| **AP Clearing Account** | Card clearing account used for Bill Payments |
| **Auto-coding** | Automatic application of coding rules based on vendor/MCC |
| **Bi-directional Sync** | Open-period transactions sync edits both ways |
| **Idempotent** | Sync operations can be safely repeated without side effects |
| **Object-centric Sync** | Sync operates on objects (Report, Payment), not UI tabs |

---

## Cross-Reference Tag Index

| Tag | Description | Document(s) |
|-----|-------------|-------------|
| `#auto-sync` | System-driven sync | Part 1 |
| `#manual-sync` | Finance-triggered sync | Part 2 |
| `#batch-sync` | Bulk sync operations | Part 2 |
| `#sync-button` | UI sync trigger locations | Part 2 |
| `#closed-period` | Closed period handling | Part 1, 2 |
| `#vendor-creation` | When/how vendors are created | Part 1, 3 |
| `#vendor-policy` | Vendor creation policy config | Part 3 |
| `#threshold` | Amount-based auto-creation | Part 3 |
| `#blocking` | Sync blocking scenarios | Part 3 |
| `#reimbursement` | Reimbursement-specific flows | Part 1, 2 |
| `#reimbursement-objects` | Two-object model | Part 2 |
| `#card-spend` | Card transaction flows | Part 1, 2, 3 |
| `#bi-directional` | Two-way edit sync | Part 1 |
| `#coding-rules` | Coding rule behavior | Part 1, 2 |
| `#netsuite` | NetSuite-specific | Part 1, 2, 3 |
| `#finance-workflow` | Finance-initiated actions | Part 2, 3 |
| `#idempotent` | Sync idempotency | Part 2 |
| `#resolution` | Resolution paths | Part 3 |

---

## Configuration Summary

### ERP & Sync Settings

| Setting | Options |
|---------|---------|
| Sync Mode | Auto-Sync / Manual Sync |
| Closed-period fallback posting | Enabled / Disabled |
| Pause posting | N days before close |

### Vendor Settings

| Setting | Options |
|---------|---------|
| New vendor auto-create | ON / OFF |
| Auto-create threshold | $0 - $∞ |
| Applies to | Card/AP spend only |

### Required Dimensions

| Dimension |
|-----------|
| GL Account |
| Department |
| Location |
| Class |
| Project |

---

*Consolidated by Sync Committee Intake Coordinator*  
*Session: SC-2025-12-29-001*

