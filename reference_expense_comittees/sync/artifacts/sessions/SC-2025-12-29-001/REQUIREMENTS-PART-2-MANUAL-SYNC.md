# Requirements Part 2: Manual Sync

> **Session:** SC-2025-12-29-001  
> **Source:** Product Requirements  
> **Captured:** 2025-12-29  
> **Status:** Documented (Pending Implementation)  
> **Related:** Part 1 (Auto Sync)

---

## Executive Summary

This document captures the Manual / Batch Sync End-to-End Demo requirements for NetSuite integration. Manual sync shares identical accounting behavior with Auto-Sync but differs in **timing control**: finance explicitly triggers sync rather than the system triggering automatically.

---

## 1. Invariant Rules (Unchanged from Part 1)

> These rules ALWAYS apply regardless of sync mode.

| # | Invariant |
|---|-----------|
| 1 | Teampay records transactions using the **actual transaction date** |
| 2 | If that date falls in a **closed accounting period**, Teampay posts to the **next open period** while preserving the original transaction date |
| 3 | **Cards create vendor payables**; reimbursements do not |
| 4 | **Vendors are auto-created in the ERP only for card/AP spend** |
| 5 | While a period is **open**, transaction edits are **bi-directionally synced** |
| 6 | Once a period is **closed**, the **ERP is authoritative** and Teampay becomes **read-only** |
| 7 | **Coding rules are updated only when explicitly edited in Teampay** |

---

## 2. Manual Sync-Specific Rules (NEW)

> Additional invariants that apply specifically to Manual Sync mode.

### 2.1 Card Transactions

| Rule |
|------|
| In the **Cards tab**, finance can initiate synchronization using a **Sync button** |
| Sync button available as **bulk action** on transactions list AND on **individual card transaction detail views** |
| Sync actions operate on the **card transaction object** |
| Sync actions are **idempotent** |

### 2.2 Reimbursements — Two Distinct ERP Objects

| Object | Purpose | Sync Eligibility |
|--------|---------|------------------|
| **Reimbursement Report** | Represents the expense | Eligible once **approved** |
| **Reimbursement Payment** | Represents the cash movement | Eligible only after **payment execution** |

### 2.3 Reimbursement Report Sync Rules

| Rule |
|------|
| A Reimbursement Report becomes eligible for sync once it is **approved** |
| Can be synced from: **Ready to Pay tab**, **All tab**, or **individual reimbursement detail view** |
| Sync actions always operate on the **reimbursement report object** rather than the tab |
| Each reimbursement report is synced **exactly once** |
| Once synced, the report is marked as **Synced** |
| Synced state is reflected **consistently across both Ready to Pay and All tabs** |
| This **prevents duplicate ERP postings** |

### 2.4 Reimbursement Payment Sync Rules

| Rule |
|------|
| Reimbursement Payments become eligible for sync **only after payment execution** |
| Can be synced from: **Paid tab** or **payment detail view** |
| Tabs represent **lifecycle state** |
| Sync availability is determined by **object readiness** |
| **Shared sync state across all tabs** ensures consistency and prevents duplication |

---

## 3. Manual Sync Model — What's Different from Auto-Sync

| Aspect | Auto-Sync | Manual Sync |
|--------|-----------|-------------|
| **Trigger** | System-driven (on settlement/approval) | Finance-initiated (Sync button) |
| **Timing** | Automatic | Finance-controlled |
| **Posting rules** | Identical | Identical |
| **Period handling** | Identical | Identical |
| **Vendor behavior** | Identical | Identical |

**Key Mental Model:**
> - **Auto-sync** = system-driven timing
> - **Manual sync** = finance-controlled timing
> - **Accounting behavior is identical**

### 3.1 Sync Button Locations

| Location | Scope | Applies To |
|----------|-------|------------|
| Transaction list (Cards tab) | Bulk action | Card transactions |
| Individual transaction detail | Single record | Card transactions |
| Ready to Pay tab | Bulk action | Reimbursement reports |
| All tab | Bulk action | Reimbursement reports |
| Individual reimbursement detail | Single record | Reimbursement reports |
| Paid tab | Bulk action | Reimbursement payments |
| Individual payment detail | Single record | Reimbursement payments |

---

## 4. Setup Configuration (One-Time)

> "Everything you're about to see is driven by these setup choices."

### 4.1 ERP & Sync Configuration

| Setting | Value |
|---------|-------|
| ERP Connected | NetSuite |
| **Manual sync enabled** | ✅ Yes |
| AP Clearing + bank accounts mapped | ✅ Yes |
| Pause posting | 0 days before close |
| Closed-period fallback posting | ✅ **ENABLED** |

### 4.2 Required Dimensions

| Dimension |
|-----------|
| GL Account |
| Department |
| Location |
| Class |
| Project |

### 4.3 Vendor Configuration

| Setting | Value |
|---------|-------|
| All ERP vendors synced into Teampay | ✅ Yes |
| New vendor auto-create | ✅ ON (no threshold) |
| Auto-create applies to | **Card / AP spend only** |

### 4.4 Sample Coding Rules

| Vendor/Trigger | GL Account | Department | Location | Class | Project |
|----------------|------------|------------|----------|-------|---------|
| Figma | Software Subscriptions | Engineering | SF | Opex | Platform |
| Delta Airlines | Travel | Sales | Remote | Opex | Customer Growth |
| MCC 5734 | Software Subscriptions | IT | SF | Opex | Internal Tools |
| **Default** | Misc Expense | Ops | HQ | Opex | General |

---

## 5. PART 1 — Accounting Period OPEN

### Flow 1: Card Transaction — Existing Vendor (Manual Sync)

**Scenario:**
- Accounting period is **open**
- Vendor (Figma) **exists** in ERP

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee makes a $120 card transaction at Figma |
| 2 | Transaction settles and appears in the Transactions tab with status **not synced** |
| 3 | Employee is notified in Teams to upload a receipt |
| 4 | Receipt is submitted, auto-captured, and matched |
| 5 | Auto-coding applies → transaction marked **Auto-coded** |
| 6 | **Finance initiates Manual Batch Sync** |
| 7 | Eligible transactions are pushed to NetSuite |

**NetSuite Records Created:**

#### Vendor Bill
| Field | Value |
|-------|-------|
| Vendor | Figma |
| Amount | $120 |
| trandate | Settlement date |
| Posting Period | Same (open) |
| GL Account | 6100 (Software Subscriptions) |
| Department | Engineering |
| Location | SF |
| Class | Opex |
| Project | Platform |
| Attachments | Receipt attached to Vendor Bill |

#### Bill Payment
| Field | Value |
|-------|-------|
| Amount | $120 |
| Account | AP Clearing |
| Applied To | Vendor Bill |

**Verification:**
- ✅ Transaction Date = ERP Posting Date
- ✅ No vendor creation
- ✅ Status = **Synced**

---

### Flow 2: Reimbursement — Existing Vendor (Manual Sync)

**Scenario:**
- Accounting period is **open**
- Vendor exists (Delta)

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee submits $450 reimbursement for Delta flight |
| 2 | Receipt attached; auto-coding applies |
| 3 | Manager approves |
| 4 | Reimbursement appears in **Ready to Pay** and in **All Tab** |
| 5 | **Finance initiates Manual Batch Sync** from either Ready to Pay or All tab |
| 6 | Expense Report is created in NetSuite |
| 7 | Admin pays reimbursement via ACH |
| 8 | **Finance initiates Manual Batch Sync for payments** |

**NetSuite Records:**

| Record | Details |
|--------|---------|
| Expense Report | Line-level, receipts attached |
| AP Payment | Employee as payee |

**Verification:**
- ✅ Vendor attribution visible for reporting
- ❌ No vendor liability
- ✅ Status = **Synced**

---

### Flow 3: Card Transaction — New Vendor (Manual Sync)

**Scenario:**
- Accounting period is **open**
- Vendor does **not** exist in ERP

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee makes $80 card transaction at Notion |
| 2 | Transaction settles and is **Ready to Sync** |
| 3 | Auto-coding applies |
| 4 | **Finance runs Manual Batch Sync** |
| 5 | During sync: **Vendor auto-created in NetSuite** |
| 6 | Vendor Bill + Bill Payment created |

**Verification:**
- ✅ **Vendor created**
- ✅ Transaction Date = ERP Posting Date
- ✅ Status = **Synced**

---

### Flow 4: Reimbursement — New Vendor (Manual Sync)

**Scenario:**
- Accounting period is **open**
- Vendor has **never appeared** in Teampay or ERP
- Reimbursements are **employee-payable**

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee submits reimbursement for Blue Bottle Coffee ($18.75) |
| 2 | Teampay creates **VendorDetail only** |
| 3 | Manager approves |
| 4 | **Finance runs Manual Batch Sync** |
| 5 | Expense Report created |
| 6 | Reimbursement paid to employee |
| 7 | **Finance runs Manual Batch Sync on payment record** |

**Verification:**
- ✅ Vendor visible in Teampay reporting as Reimbursement
- ❌ **No ERP vendor created**
- ❌ **No vendor liability**
- ✅ Status = **Synced**

---

### Flow 5: Admin Edits Coding in NetSuite (Period Open)

**Flow:**

| Step | Action |
|------|--------|
| 1 | Admin edits coding on a Vendor Bill in NetSuite |
| 2 | NetSuite saves the change |
| 3 | **Next Manual Sync Pull** updates the transaction in Teampay |

**What Does NOT Happen:**
- ❌ Coding rules are **not** updated
- ❌ No learning or memory stored

**Rule:**
> **Coding rules only update when explicitly edited in Teampay.**

---

## 6. PART 2 — Accounting Period CLOSED

### Flow 6: Card Transaction — Ready After Close (Manual Sync)

**Scenario:**
- Transaction date in **closed period**
- Transaction **not ready** before close

**Flow:**

| Step | Action |
|------|--------|
| 1 | Transaction settles **March 28** |
| 2 | Missing receipt → **not Ready to Sync** |
| 3 | March closes |
| 4 | Receipt uploaded after close |
| 5 | Transaction becomes **Ready to Sync** |
| 6 | **Finance runs Manual Batch Sync** |
| 7 | System posts to **next open period (April)** |

**NetSuite Result:**

| Field | Value |
|-------|-------|
| Vendor Bill trandate | **March 28** |
| ERP Posting Date | **April 1** |
| Bill Payment posted | April 1 |

**Verification:**
- ✅ Transaction date **preserved**
- ✅ ERP posting period **shifted**
- ✅ Status = **Synced**

---

### Flow 7: Reimbursement — Expense Dated in Closed Period (Manual Sync)

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee submits reimbursement dated in closed period |
| 2 | Manager approves |
| 3 | **Finance runs Manual Batch Sync** |
| 4 | Expense Report posts to **next open period** |
| 5 | Payment posts on payment date |

**Verification:**
- ✅ Expense date **preserved**
- ❌ No vendor liability
- ✅ Status = **Synced**

---

### Flow 8: Card Transaction — New Vendor (Closed Period, Manual Sync)

**Flow:**

| Step | Action |
|------|--------|
| 1 | Transaction settles in closed period |
| 2 | **Finance runs Manual Batch Sync** |
| 3 | **Vendor auto-created** |
| 4 | Transaction posts to **next open period** |

---

## 7. Closed-Period Edit Behavior (Same as Auto-Sync)

| Scenario | Result |
|----------|--------|
| ERP edit, period **closed** | ❌ **Not synced back** to Teampay |
| Teampay edit, period **closed** | ❌ **Blocked** with message |

**Blocked Edit Message:**
> "This transaction is in a closed accounting period. Edits must be made directly in the ERP."

---

## 8. Quick Reference: Manual Sync vs Auto-Sync

### 8.1 What's Different

| Aspect | Auto-Sync | Manual Sync |
|--------|-----------|-------------|
| Trigger timing | Automatic on settlement/approval | Finance clicks Sync button |
| Sync initiation | System-driven | Human-initiated |
| Batch capability | N/A (immediate) | ✅ Bulk actions available |
| Transaction status before sync | N/A | "Not synced" |

### 8.2 What's Identical

| Aspect | Both Modes |
|--------|------------|
| Posting rules | Same |
| Period handling | Same |
| Vendor auto-creation | Same (card/AP only) |
| Closed-period fallback | Same |
| Bi-directional editing (open) | Same |
| Read-only (closed) | Same |
| Coding rule updates | Same (Teampay-only) |

---

## 9. Reimbursement Object Model (Critical)

> Reimbursements have TWO distinct ERP objects with separate sync lifecycles.

```
┌─────────────────────────────────────────────────────────────────┐
│                    REIMBURSEMENT LIFECYCLE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────┐         ┌─────────────────────┐       │
│   │ Reimbursement       │         │ Reimbursement       │       │
│   │ Report              │         │ Payment             │       │
│   ├─────────────────────┤         ├─────────────────────┤       │
│   │ • Represents expense│         │ • Represents cash   │       │
│   │ • Sync on APPROVAL  │         │ • Sync on PAYMENT   │       │
│   │ • Creates: Expense  │         │ • Creates: AP       │       │
│   │   Report in ERP     │         │   Payment in ERP    │       │
│   └─────────────────────┘         └─────────────────────┘       │
│            │                               │                     │
│            ▼                               ▼                     │
│   ┌─────────────────────┐         ┌─────────────────────┐       │
│   │ Sync Locations:     │         │ Sync Locations:     │       │
│   │ • Ready to Pay tab  │         │ • Paid tab          │       │
│   │ • All tab           │         │ • Payment detail    │       │
│   │ • Detail view       │         │   view              │       │
│   └─────────────────────┘         └─────────────────────┘       │
│                                                                  │
│   SHARED SYNC STATE: Prevents duplicate postings across tabs    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.1 Key Principles

| Principle | Description |
|-----------|-------------|
| **Object-centric sync** | Sync operates on objects, not tabs |
| **Exactly-once** | Each object synced exactly once |
| **Shared state** | Sync state visible across all tabs |
| **No duplicates** | Prevents duplicate ERP postings |
| **Idempotent** | Re-clicking sync has no effect on already-synced objects |

---

## 10. Cross-Reference Tags

For future committee sessions, this document covers:

- `#manual-sync` — Manual sync functionality
- `#batch-sync` — Batch/bulk sync operations
- `#sync-button` — UI sync trigger locations
- `#reimbursement-objects` — Two-object reimbursement model
- `#finance-workflow` — Finance-initiated actions
- `#idempotent` — Sync idempotency requirements

---

*Captured by Sync Committee Intake Coordinator*  
*Session: SC-2025-12-29-001*

