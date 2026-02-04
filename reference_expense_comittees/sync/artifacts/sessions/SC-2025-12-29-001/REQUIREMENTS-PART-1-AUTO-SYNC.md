# Requirements Part 1: Auto Sync

> **Session:** SC-2025-12-29-001  
> **Source:** Product Requirements  
> **Captured:** 2025-12-29  
> **Status:** Documented (Pending Implementation)

---

## Executive Summary

This document captures the complete Auto-Sync End-to-End Demo requirements for NetSuite integration. It defines how Teampay synchronizes transactions with ERPs, handling both open and closed accounting periods, vendor management, and bi-directional editing rules.

---

## 1. Invariant Rules

> These rules ALWAYS apply and represent the core behavioral contracts of the system.

| # | Invariant |
|---|-----------|
| 1 | Teampay posts transactions using the **actual transaction date** |
| 2 | If that date falls in a **closed accounting period**, Teampay posts to the **next open period** while preserving the original transaction date |
| 3 | **Cards create vendor payables**; reimbursements do not |
| 4 | **Vendors are auto-created in the ERP only for card/AP spend** |
| 5 | While a period is **open**, transaction edits are **bi-directionally synced** |
| 6 | Once a period is **closed**, the **ERP is authoritative** and Teampay becomes **read-only** |
| 7 | **Coding rules are updated only when explicitly edited in Teampay** |

---

## 2. Bi-Directional Editing Rules

> Rules governing how edits flow between Teampay and ERP for already-synced transactions.

| Scenario | Teampay Action | ERP Action |
|----------|----------------|------------|
| ERP edit, period **open** | Sync back to Teampay | Allowed |
| ERP edit, period **closed** | Ignore (ERP authoritative) | Allowed |
| Teampay edit, period **open** | Allowed + synced | Receives update |
| Teampay edit, period **closed** | **Blocked** | N/A |

---

## 3. Setup Configuration (One-Time)

> "Everything you're about to see is driven by these setup choices."

### 3.1 ERP & Sync Configuration

| Setting | Value |
|---------|-------|
| ERP Connected | NetSuite |
| Auto-sync enabled | ✅ Yes |
| AP Clearing + bank accounts mapped | ✅ Yes |
| Pause posting | 0 days before close |
| Closed-period fallback posting | ✅ **ENABLED** |

### 3.2 Required Dimensions

| Dimension |
|-----------|
| GL Account |
| Department |
| Location |
| Class |
| Project |

### 3.3 Vendor Configuration

| Setting | Value |
|---------|-------|
| All ERP vendors synced into Teampay | ✅ Yes |
| New vendor auto-create | ✅ ON (no threshold) |
| Auto-create applies to | **Card / AP spend only** |

### 3.4 Sample Coding Rules

| Vendor/Trigger | GL Account | Department | Location | Class | Project |
|----------------|------------|------------|----------|-------|---------|
| Figma | Software Subscriptions | Engineering | SF | Opex | Platform |
| Delta Airlines | Travel | Sales | Remote | Opex | Customer Growth |
| MCC 5734 (Software) | Software Subscriptions | IT | SF | Opex | Internal Tools |
| **Default** | Misc Expense | Ops | HQ | Opex | General |

---

## 4. PART 1 — Accounting Period OPEN

### Flow 1: Card Transaction — Existing Vendor

**Scenario:**
- Accounting period is **open**
- Vendor (Figma) **exists** in ERP

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee makes a $120 card transaction at Figma |
| 2 | Transaction settles and is visible on the transaction tab |
| 3 | Employee is notified in Teams to upload a receipt |
| 4 | Receipt is submitted and auto-captured and matched - visible in the transaction tab |
| 5 | Auto-coding applies → transaction marked "Auto-coded" |
| 6 | Auto-sync triggers on settlement |

**NetSuite Records Created:**

#### Vendor Bill
> A Vendor Bill is created in NetSuite for Figma in the amount of $120. The transaction date (trandate) is set to the card settlement date, and because the accounting period is open, the posting period matches the transaction date. The bill contains a single line coded to account 6100 (Software Subscriptions) with Department = Engineering, Location = SF, Class = Opex, and Project = Platform. The receipt image is attached directly to the Vendor Bill as a file attachment.

| Field | Value |
|-------|-------|
| Vendor | Figma |
| Amount | $120 |
| Transaction Date | Card settlement date |
| Posting Period | Matches transaction date |
| GL Account | 6100 (Software Subscriptions) |
| Department | Engineering |
| Location | SF |
| Class | Opex |
| Project | Platform |
| Attachments | Receipt image |

#### Bill Payment
> A Bill Payment is then created for Figma in the amount of $120 using the AP Clearing (card clearing) account. The payment is applied to the Vendor Bill and inherits the same coding and dimensional context for consistency.

| Field | Value |
|-------|-------|
| Vendor | Figma |
| Amount | $120 |
| Account | AP Clearing (card clearing) |
| Applied To | Vendor Bill |
| Coding | Inherited from Bill |

**Verification:**
- ✅ Transaction Date = ERP Posting Date
- ✅ Vendor already exists → no vendor creation
- ✅ Status = **Synced** in Teampay

---

### Flow 2: Reimbursement — Existing Vendor

**Scenario:**
- Accounting period is **open**
- Vendor exists (Delta)

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee submits $450 reimbursement for Delta flight |
| 2 | Receipt attached |
| 3 | Auto-coding applies (Delta rule) |
| 4 | Employee submits report |
| 5 | Manager approves |
| 6 | Reimbursement is now "ready to pay" in ready to pay tab and marked as "fully approved" |
| 7 | Reimbursement is also visible in the "All tab" as fully approved |

**NetSuite Record Created — Expense Report:**
> An Expense Report is created in NetSuite for the requesting employee. The report includes line items categorized to GL account 6250 (Travel), with Department, Location, Class, and Project populated according to the applied coding rules. The original expense date is preserved on each line item, and the receipt images are attached at the line level of the Expense Report.

| Field | Value |
|-------|-------|
| Employee | Requesting employee |
| GL Account | 6250 (Travel) |
| Dimensions | Per coding rules |
| Expense Date | Original date (preserved) |
| Attachments | Receipt at line level |

**Payment Flow:**

| Step | Action |
|------|--------|
| 8 | Admin pays reimbursement via ACH |
| 9 | Reimbursement report payment status is updated as "pending" on All tab |
| 10 | Reimbursement payment record (ACH) is updated to "pending" on the "paid tab" |
| 11 | Employee + Admin are notified of payment initiated |
| 12 | ACH credit settles successfully |
| 13 | Reimbursement payment status updates to **Paid** in the Paid tab |
| 14 | Reimbursement report reflects **Paid** status in the All tab |

**NetSuite Record Created — AP Payment:**
> An AP Payment is then created with the employee as the payee in the amount of $450, using the configured cash or clearing account. The payment is applied directly to the Expense Report, completing the reimbursement without creating any vendor liability.

| Field | Value |
|-------|-------|
| Payee | **Employee** (not vendor) |
| Amount | $450 |
| Account | Cash or clearing account |
| Applied To | Expense Report |

**Verification:**
- ✅ Vendor attribution visible for reporting
- ❌ **No vendor liability**
- ✅ Payment is to **employee**
- ✅ Status = **Synced**

---

### Flow 3: Card Transaction — New Vendor

**Scenario:**
- Accounting period is **open**
- Vendor does **not** exist in ERP

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee makes $80 card transaction at Notion |
| 2 | Transaction settles |
| 3 | Auto-coding applies |
| 4 | Auto-sync triggers |
| 5 | During sync: **New vendor auto-created in NetSuite** |
| 6 | Vendor Bill + Bill Payment created with coding and receipt attached |

**Verification:**
- ✅ **Vendor created automatically**
- ✅ Transaction Date = ERP Posting Date
- ✅ Status = **Synced**

---

### Flow 4: Reimbursement — New Vendor

**Scenario:**
- Accounting period is **open**
- Vendor has **never appeared** in Teampay or ERP
- Reimbursements are **employee-payable, not vendor-payable**

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee incurs out-of-pocket expense at Blue Bottle Coffee |
| 2 | Expense date = April 5 |
| 3 | Employee submits reimbursement: Amount $18.75, Vendor: Blue Bottle Coffee (new), Receipt attached |
| 4 | **Teampay creates a Teampay-only vendor record (VendorDetail)** |
| 5 | Used for attribution, reporting, auto-coding |
| 6 | **Not promoted to ERP-backed** |
| 7 | Manager approves |
| 8 | Auto-sync creates: Expense Report (line-level) |
| 9 | Reimbursement is paid to employee |
| 10 | ERP records: AP Payment (employee as payee) |

**Verification:**
- ✅ Vendor visible in Teampay reporting as Reimbursement
- ❌ **No ERP vendor created**
- ❌ **No vendor liability**
- ✅ Status = **Synced**

---

### Flow 5: Admin Edits Coding in NetSuite (Period Open)

**Context:**
- Accounting period is **open**
- A Figma card transaction has already synced to NetSuite
- Vendor Bill and Bill Payment exist
- Bi-directional sync is enabled for open periods

**What Happens:**

| Step | Action |
|------|--------|
| 1 | An admin opens the Vendor Bill in NetSuite |
| 2 | The admin updates the transaction coding (e.g., department or project) |
| 3 | NetSuite saves the changes |
| 4 | Teampay detects the update and syncs the revised coding back to the transaction record |
| 5 | The transaction remains in **Synced** status and reflects the ERP-approved coding |
| 6 | An audit log records the change as ERP-originated |

**What Does NOT Happen (Explicit):**
- ❌ Coding rules are **not** updated
- ❌ No "learning" or memory is created from this change
- ❌ The edit applies **only to this transaction**
- ❌ Future transactions continue to follow existing rules

**Rule (State Plainly):**
> **Teampay only stores or updates coding rules when an admin explicitly changes them inside Teampay. Changes made in the ERP never create or modify coding rules.**

---

## 5. PART 2 — Accounting Period CLOSED

> "Now we'll show what happens when transactions aren't ready before close."
> 
> Transactions dated in a closed period; become ready after close.

---

### Flow 6: Card Transaction — Existing Vendor (Ready After Close)

**Scenario:**
- Transaction date falls in a **closed period**
- Transaction was blocked before close (missing receipt or incomplete coding)
- Closed-period fallback posting **enabled**

> **Fallback posting** ensures the transaction is not blocked due to timing issues while preserving the true transaction date for reporting and audit.

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee makes $240 card transaction at Figma on **March 28** |
| 2 | Transaction settles |
| 3 | Receipt missing → transaction **not ready to sync** |
| 4 | March period closes |
| 5 | After close: Employee uploads receipt |
| 6 | Finance confirms coding |
| 7 | Transaction becomes **Ready to Sync** |
| 8 | Auto-sync trigger |
| 9 | System detects closed period |
| 10 | Transaction posts to **next open period (April)** |

**NetSuite Vendor Bill:**
> A Vendor Bill is created in NetSuite for Figma in the amount of $240. The **Transaction Date (trandate) is set to March 28**, reflecting when the expense actually occurred. Because the March accounting period is closed, the **ERP Posting Date is set to April 1**, posting the bill into the next open accounting period. The bill contains a single line coded to account 6100 (Software Subscriptions) with Department = Engineering, Location = SF, Class = Opex, and Project = Platform. The receipt image is attached directly to the Vendor Bill as a file attachment.

| Field | Value |
|-------|-------|
| Transaction Date | **March 28** (preserved) |
| ERP Posting Date | **April 1** |
| Amount | $240 |
| GL Account | 6100 (Software Subscriptions) |

**NetSuite Bill Payment:**
> A Bill Payment is then created for Figma in the amount of $240 using the AP Clearing (card clearing) account. The payment is posted on April 1, applied to the Vendor Bill, and retains the same dimensional coding for consistency.

**Verification:**
- ✅ Transaction Date: **March 28** (preserved)
- ✅ ERP Posting Date: **April 1**
- ✅ Vendor: Existing
- ✅ Status = **Synced**

---

### Flow 7: Reimbursement — Expense Dated in Closed Period

**Scenario:**
- Expense occurred in a **closed period**
- Reimbursement submitted and approved in an **open period**

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee submits reimbursement with expense date in closed period |
| 2 | Receipt attached |
| 3 | Auto-coding applies |
| 4 | Manager approves |
| 5 | Auto-sync triggers |
| 6 | Expense Report posts to **next open period** |
| 7 | Payment posts on payment date |

**Verification:**
- ✅ Expense Date **preserved**
- ✅ ERP Posting Period **moved forward**
- ✅ Payment to **employee**
- ❌ **No vendor liability**
- ✅ Status = **Synced**

---

### Flow 8: Card Transaction — New Vendor (Closed Period)

**Scenario:**
- Transaction date is in **closed period**
- Vendor does **not** exist in ERP

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee makes card transaction at new vendor |
| 2 | Transaction settles |
| 3 | Auto-coding applies |
| 4 | Auto-sync triggers |
| 5 | During sync: **Vendor auto-created** |
| 6 | Transaction posts to **next open period** |

**Verification:**
- ✅ **Vendor created**
- ✅ Transaction Date **preserved**
- ✅ ERP Posting Period **moved forward**
- ✅ Status = **Synced**

---

### Flow 9: Admin Edits a Transaction in NetSuite (Period Closed)

**Context:**
- The accounting period is **closed**
- A card transaction has already posted to NetSuite
- An admin makes a coding change directly in NetSuite (e.g., via reclass or allowed edit)

**What Happens:**

| Step | Action |
|------|--------|
| 1 | NetSuite accepts and records the change |
| 2 | **Teampay does not sync the update back** |
| 3 | Teampay continues to show the original coding |

**Result:**
- ✅ NetSuite is **authoritative** for closed-period changes
- ✅ Teampay remains **unchanged**
- ❌ No coding rules are updated
- ❌ No memory or learning is stored

**Demo Statement:**
> "Once the period is closed, NetSuite is the source of truth. Any adjustments stay in NetSuite and are not synced back to Teampay."

---

### Flow 10: Admin Attempts to Edit a Transaction in Teampay (Period Closed)

**Context:**
- The accounting period is **closed**
- The transaction has already posted to NetSuite
- An admin attempts to edit coding in Teampay

**What Happens:**

| Step | Action |
|------|--------|
| 1 | **Teampay blocks the edit** |
| 2 | Editable fields are **disabled** |
| 3 | A message is shown: |

**UI Message:**
> "This transaction is in a closed accounting period. Edits must be made directly in the ERP."

**Result:**
- ❌ No changes are saved
- ❌ No sync is attempted
- ❌ No coding rules are updated

---

## 6. Quick Reference Tables

### 6.1 Transaction Type → ERP Records Created

| Transaction Type | Vendor Exists | Period | ERP Records |
|------------------|---------------|--------|-------------|
| Card | Yes | Open | Vendor Bill + Bill Payment |
| Card | No | Open | **Create Vendor** + Vendor Bill + Bill Payment |
| Card | Yes | Closed | Vendor Bill + Bill Payment (next period) |
| Card | No | Closed | **Create Vendor** + Vendor Bill + Bill Payment (next period) |
| Reimbursement | Yes | Open | Expense Report + AP Payment (to employee) |
| Reimbursement | No | Open | Expense Report + AP Payment (to employee), **Teampay-only vendor** |
| Reimbursement | Yes | Closed | Expense Report (next period) + AP Payment |
| Reimbursement | No | Closed | Expense Report (next period) + AP Payment, **Teampay-only vendor** |

### 6.2 Vendor Creation Rules

| Spend Type | Vendor Created in ERP? |
|------------|------------------------|
| Card/AP Spend | ✅ Yes (auto-create) |
| Reimbursement | ❌ No (Teampay-only VendorDetail) |

### 6.3 Period State → Editing Rules

| Period State | Teampay Edit | ERP Edit | Sync Direction |
|--------------|--------------|----------|----------------|
| **Open** | ✅ Allowed | ✅ Allowed | Bi-directional |
| **Closed** | ❌ Blocked | ✅ Allowed | ERP → (no sync) |

---

## 7. Key Concepts Glossary

| Term | Definition |
|------|------------|
| **Transaction Date** | The actual date the expense occurred (preserved in all records) |
| **ERP Posting Date** | The date the transaction posts to the ERP accounting period |
| **Closed-Period Fallback** | When enabled, posts to next open period if transaction date is in closed period |
| **VendorDetail** | Teampay-only vendor record for attribution/reporting (not synced to ERP) |
| **AP Clearing Account** | Card clearing account used for Bill Payments |
| **Auto-coding** | Automatic application of coding rules based on vendor/MCC |
| **Bi-directional Sync** | Open-period transactions sync edits both ways |

---

## 8. Cross-Reference Tags

For future committee sessions, this document covers:

- `#auto-sync` — Core auto-sync functionality
- `#closed-period` — Closed period handling
- `#vendor-creation` — When/how vendors are created
- `#reimbursement` — Reimbursement-specific flows
- `#card-spend` — Card transaction flows
- `#bi-directional` — Two-way edit sync
- `#coding-rules` — Coding rule behavior
- `#netsuite` — NetSuite-specific implementation

---

*Captured by Sync Committee Intake Coordinator*  
*Session: SC-2025-12-29-001*

