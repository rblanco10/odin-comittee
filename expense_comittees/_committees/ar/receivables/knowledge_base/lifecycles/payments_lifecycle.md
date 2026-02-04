# Payments Lifecycle

> **Subcommittee**: SC05  
> **Domain**: `FlamePsAr.Classic.Payments`  
> **Location**: `lib/flame_ps_ar/classic/payments/`  
> **Last Verified**: 2026-01-14

---

## Overview

The Payments domain governs payment processing, autopay scheduling, banking, and card transactions in the AR system.

---

## Domain Resources

The Payments domain (`FlamePsAr.Classic.Payments`) contains:

| Category | Resources | Count |
|----------|-----------|-------|
| **Core Payments** | Payment, PaymentRequest, PaymentErp, Payout, PayoutRequest, etc. | 11 |
| **Autopay** | Autopay, AutopayEvent, Schedule, ScheduledPayment, etc. | 12 |
| **Banking** | Bank, ACH, Sessions, BankConnect, etc. | 23 |
| **Cards** | Card, WEX fleet cards, Amex, etc. | 15 |

---

## Payment Resource (Not a State Machine)

The `Payment` resource does NOT use AshStateMachine. Payment status is managed via attributes and business logic.

**Key Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| `status` | String | Payment status |
| `amount` | Decimal | Payment amount |
| `currency` | String | Currency code |
| `owner_id` | String | Tenant ID |

---

## Autopay Lifecycle

Autopay IS a state machine. See dedicated documentation:

📄 **`knowledge_base/lifecycles/autopay_lifecycle.md`**

```
┌─────────┐     ┌─────────┐     ┌────────────┐     ┌───────────┐
│ created │────►│ active  │────►│ processing │────►│ completed │
└─────────┘     └─────────┘     └────────────┘     └───────────┘
      │              │                │
      ▼              ▼                ▼
  ┌────────┐    ┌────────┐       ┌────────┐
  │ paused │    │ paused │       │ failed │
  └────────┘    └────────┘       └────────┘
```

---

## Related Resources by Category

### Core Payments

| Resource | Location | Purpose |
|----------|----------|---------|
| `Payment` | `resources/payment.ex` | Payment records |
| `PaymentRequest` | `resources/payment_request.ex` | Payment requests |
| `PaymentErp` | `resources/payment_erp.ex` | ERP sync data |
| `PaymentTransfer` | `resources/payment_transfer.ex` | Transfer links |
| `PaymentWire` | `resources/payment_wire.ex` | Wire payments |
| `Payout` | `resources/payout.ex` | Payout records |

### Autopay & Scheduling

| Resource | Location | Purpose |
|----------|----------|---------|
| `Autopay` | `resources/autopay.ex` | Autopay configuration |
| `AutopayEvent` | `resources/autopay_event.ex` | Event log |
| `Schedule` | `resources/schedule.ex` | Scheduling config |
| `ScheduledPayment` | `resources/scheduled_payment.ex` | Scheduled payments |
| `ScheduledPayout` | `resources/scheduled_payout.ex` | Scheduled payouts |

### Banking

| Resource | Location | Purpose |
|----------|----------|---------|
| `Bank` | `banking/resources/bank.ex` | Bank accounts |
| `AchPush` | `banking/resources/ach_push.ex` | ACH push payments |
| `BankSession` | `banking/resources/bank_session.ex` | Auth sessions |
| `BankConnect` | `banking/resources/bank_connect.ex` | Bank linking |

### Cards

| Resource | Location | Purpose |
|----------|----------|---------|
| `Card` | `cards/resources/card.ex` | Credit/debit cards |
| `WexCard` | `cards/resources/wex_card.ex` | WEX fleet cards |
| `AmexAccount` | `cards/resources/amex_account.ex` | Amex accounts |

---

## Services

| Service | Location | Purpose |
|---------|----------|---------|
| `AutopayBulkOperations` | `services/` | Bulk pause/resume |
| `FundValidator` | `services/` | Validate payment methods |
| `TransactionDateCalculator` | `services/` | Business day calculations |

---

## Manual Actions

| Action | Location | Purpose |
|--------|----------|---------|
| `CreateReceivableAutopay` | `manual_actions/` | Create autopay for receivable |
| `CreatePayerAutopay` | `manual_actions/` | Create payer-level autopay |
| `CompleteAutopay` | `manual_actions/` | Mark autopay complete |
| `PauseAutopay` | `manual_actions/` | Pause autopay |
| `ResumeAutopayForReplacement` | `manual_actions/` | Resume with new fund |

---

## Constitutional Considerations

- **Legacy**: MySQL tables with camelCase columns
- **Decimal**: Financial amounts use proper precision
- **Tenant**: `owner_id` required for multitenancy
- **Fund Types**: Must be `card`, `bank`, or `ach`
- **Business Days**: Account for BACS/SEPA lead times

---

## Code References

```
lib/flame_ps_ar/classic/payments/
├── payments.ex                     # Domain definition
├── resources/
│   ├── autopay.ex                  # Autopay (state machine)
│   ├── autopay_event.ex
│   ├── payment.ex                  # Payment records
│   ├── payment_request.ex
│   ├── payout.ex
│   ├── schedule.ex
│   └── ...                         # 25+ resources
├── banking/
│   └── resources/                  # 23 banking resources
├── cards/
│   └── resources/                  # 15 card resources
├── manual_actions/
│   ├── create_receivable_autopay.ex
│   ├── create_payer_autopay.ex
│   └── ...
└── services/
    ├── autopay_bulk_operations.ex
    ├── fund_validator.ex
    └── transaction_date_calculator.ex
```

---

*"A payment is a promise fulfilled."*

