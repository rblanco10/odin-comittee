# Autopay Lifecycle

> **Subcommittee**: SC05  
> **Resource**: `FlamePsAr.Classic.Payments.Resources.Autopay`  
> **Domain**: `FlamePsAr.Classic.Payments`  
> **Last Verified**: 2026-01-14

---

## Overview

The Autopay lifecycle governs automatic payment scheduling and execution for receivables and payers.

---

## Lifecycle States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTOPAY LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────┐     activate      ┌─────────┐     start_processing          │
│    │ created │─────────────────►│ active  │─────────────────────►          │
│    └────┬────┘                  └────┬────┘                                │
│         │                            │                                      │
│         │ pause_on_create            │ pause                               │
│         │                            │                        ┌────────────┐│
│         ▼                            ▼                        ▼            ││
│    ┌────────┐     reactivate    ┌────────┐             ┌────────────┐     ││
│    │ paused │◄──────────────────│ paused │             │ processing │     ││
│    └────────┘                   └────────┘             └─────┬──────┘     ││
│         │                            ▲                       │            ││
│         │ reactivate                 │                       │            ││
│         └────────────────────────────┘      ┌────────────────┼────────────┘│
│                                              │                │             │
│                                              │ retry          │             │
│                                              │                ▼             │
│                              ┌───────────────┴───────┐  ┌───────────┐      │
│                              │                       │  │ completed │      │
│                              │ failed                │  └─────┬─────┘      │
│                              │                       │        │            │
│                              └───────────────────────┘        │            │
│                                                               │            │
│                           reactivate_completed                │            │
│                              ┌────────────────────────────────┘            │
│                              ▼                                             │
│                         ┌─────────┐                                        │
│                         │ active  │ (cycle continues)                      │
│                         └─────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## State Machine Definition

From `autopay.ex`:

```elixir
state_machine do
  initial_states([:created, :active, :paused])
  default_initial_state(:created)
  state_attribute(:status)

  transitions do
    transition(:activate, from: :created, to: :active)
    transition(:pause_on_create, from: :created, to: :paused)
    transition(:pause, from: :active, to: :paused)
    transition(:start_processing, from: :active, to: :processing)
    transition(:reactivate, from: :paused, to: :active)
    transition(:complete, from: :processing, to: :completed)
    transition(:fail, from: :processing, to: :failed)
    transition(:retry, from: :processing, to: :active)
    transition(:reactivate_completed, from: :completed, to: :active)
  end
end
```

---

## State Definitions

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| `created` | Initial state | → `active`, → `paused` |
| `active` | Ready for processing | → `processing`, → `paused` |
| `paused` | Temporarily suspended | → `active` |
| `processing` | Payment in progress | → `completed`, → `failed`, → `active` (retry) |
| `completed` | Payment succeeded | → `active` (reactivate for recurring) |
| `failed` | Payment failed | (terminal, or retry logic) |

---

## Actions

### State Transition Actions

| Action | From State | To State | Purpose |
|--------|------------|----------|---------|
| `:activate` | `created` | `active` | Enable autopay |
| `:pause_on_create` | `created` | `paused` | Create but keep paused |
| `:pause` | `active` | `paused` | Temporarily suspend |
| `:reactivate` | `paused` | `active` | Resume from pause |
| `:start_processing` | `active` | `processing` | Begin payment attempt |
| `:complete` | `processing` | `completed` | Payment succeeded |
| `:fail` | `processing` | `failed` | Payment failed |
| `:retry` | `processing` | `active` | Retry after transient failure |
| `:reactivate_completed` | `completed` | `active` | Re-enable for next cycle |

### Custom Actions

| Action | Type | Purpose |
|--------|------|---------|
| `:create_receivable_autopay` | Generic | Create autopay linked to receivable |
| `:create_payer_autopay` | Generic | Create autopay linked to payer |
| `:mark_completed` | Update | Mark as completed when receivable paid/cancelled |

---

## Autopay Types

### 1. Receivable Autopay

- **Resource Binding**: `resource_id` → Receivable ID, `resource_type` = "Receivable"
- **Settings Level**: `"receivable"`
- **Trigger**: When receivable's `date_due` approaches

### 2. Payer Autopay

- **Resource Binding**: No specific receivable
- **Settings Level**: `"payer"`
- **Trigger**: Applies to all receivables for a payer

---

## Key Attributes

| Attribute | Type | Source Column | Description |
|-----------|------|---------------|-------------|
| `resource_id` | String | `resourceId` | ID of linked resource (Receivable) |
| `resource_type` | String | `resourceType` | Type of resource ("Receivable") |
| `fund_id` | String | `fundId` | Payment method ID |
| `fund_type` | String | `fundType` | Payment method type (card/bank/ach) |
| `payer_id` | String | `payerId` | Payer ID |
| `status` | Atom | `status` | State machine status |
| `transaction_date` | DateTime | `transactionDate` | When to process |
| `date_due` | DateTime | `dateDue` | Linked receivable due date |
| `reminder_date` | DateTime | `reminderDate` | Pre-calculated reminder date |
| `send_reminder` | Boolean | `sendReminder` | Send reminder before processing |
| `days_before_reminder` | Integer | `daysBeforeReminder` | Days before `transaction_date` |
| `attempts` | Integer | `attempts` | Number of processing attempts |
| `settings_level` | String | `settingsLevel` | "receivable" or "payer" |
| `owner_id` | String | `ownerId` | Tenant ID (KSUID) |

---

## Relationships

| Relationship | Target | Description |
|--------------|--------|-------------|
| `resource` | `System.Resources.Resource` | Polymorphic resource link |
| `payer` | `Customers.Resources.Payer` | Payer who will pay |
| `customer` | `Accounts.Resources.Customer` | Tenant customer |

---

## Validations

```elixir
validations do
  validate one_of(:fund_type, ["card", "bank", "ach"]) do
    message("fundType should be one of card, bank or ach")
  end
end
```

---

## Manual Actions

### CreateReceivableAutopay

Location: `classic/payments/manual_actions/create_receivable_autopay.ex`

Creates autopay linked to a specific receivable with:
- Pre-calculated `reminder_date` accounting for business days (BACS/SEPA)
- Fund validation
- Payer settings lookup

### CreatePayerAutopay

Location: `classic/payments/manual_actions/create_payer_autopay.ex`

Creates autopay at the payer level (applies to all receivables).

---

## Related Resources

| Resource | Location | Relationship |
|----------|----------|--------------|
| `AutopayEvent` | `classic/payments/resources/` | Event log |
| `AutopayEventAdapter` | `classic/payments/resources/` | Event adapter |
| `Schedule` | `classic/payments/resources/` | Scheduling config |
| `ScheduledPayment` | `classic/payments/resources/` | Scheduled payments |

---

## Services

| Service | Location | Purpose |
|---------|----------|---------|
| `AutopayBulkOperations` | `classic/payments/services/` | Bulk pause/resume |
| `FundValidator` | `classic/payments/services/` | Validate payment methods |
| `TransactionDateCalculator` | `classic/payments/services/` | Calculate business day dates |

---

## Constitutional Considerations

- **Legacy**: MySQL table `Autopay` with camelCase columns
- **Decimal**: Financial amounts use proper precision
- **Tenant**: `owner_id` required for multitenancy
- **Fund Validation**: Fund type must be `card`, `bank`, or `ach`
- **Business Days**: Reminder dates account for BACS/SEPA lead times

---

## Code References

```
lib/flame_ps_ar/classic/payments/
├── payments.ex                                 # Domain definition
├── resources/
│   ├── autopay.ex                              # Main resource
│   ├── autopay_event.ex
│   ├── autopay_event_adapter.ex
│   ├── schedule.ex
│   ├── scheduled_payment.ex
│   └── ...
├── manual_actions/
│   ├── create_receivable_autopay.ex
│   ├── create_payer_autopay.ex
│   ├── complete_autopay.ex
│   ├── pause_autopay.ex
│   └── resume_autopay_for_replacement.ex
└── services/
    ├── autopay_bulk_operations.ex
    ├── fund_validator.ex
    └── transaction_date_calculator.ex
```

---

*"Autopay: set it and forget it."*
