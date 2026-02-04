# Receivable Lifecycle

> **Subcommittee**: SC01  
> **Resource**: `FlamePsAr.Classic.Receivables.Resources.Receivable`  
> **Domain**: `FlamePsAr.Classic.Domain`  
> **Last Verified**: 2026-01-14

---

## Overview

The receivable lifecycle governs the creation, management, and resolution of receivables (invoices) in the AR system.

---

## Lifecycle States

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECEIVABLE LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────┐      activate       ┌─────────┐                  │
│    │ created │────────────────────►│ active  │                  │
│    └─────────┘                     └────┬────┘                  │
│                                         │                        │
│                          ┌──────────────┼──────────────┐        │
│                          │              │              │        │
│                          ▼              ▼              │        │
│                     ┌────────┐    ┌───────────┐       │        │
│                     │  paid  │    │ cancelled │◄──────┘        │
│                     └────────┘    └───────────┘                 │
│                          │              │                        │
│                          │  reactivate  │                        │
│                          └──────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Machine Definition

From `receivable.ex`:

```elixir
state_machine do
  initial_states([:created])
  default_initial_state(:created)
  state_attribute(:status)

  transitions do
    transition :activate do
      from(:created)
      to(:active)
    end

    transition :mark_as_paid do
      from(:active)
      to(:paid)
    end

    transition :cancel do
      from([:active, :paid])
      to(:cancelled)
    end

    transition :reactivate do
      from(:cancelled)
      to(:active)
    end
  end
end
```

---

## State Definitions

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| `created` | Initial state on creation | → `active` (via `:activate`) |
| `active` | Ready for payment processing | → `paid` (via `:mark_as_paid`), → `cancelled` (via `:cancel`) |
| `paid` | Fully paid receivable | → `cancelled` (via `:cancel`) |
| `cancelled` | Voided/cancelled receivable | → `active` (via `:reactivate`) |

---

## Key Processes

### 1. Receivable Creation

- **Trigger**: ERP sync, manual creation, API
- **Initial State**: `created`
- **Key Fields Set**: `amount`, `currency`, `payer_name`, `payer_email`, `date_due`, `owner_id`

### 2. Activation

- **Trigger**: `:activate` action
- **Transition**: `created` → `active`
- **Purpose**: Mark receivable as ready for payment

### 3. Payment Completion

- **Trigger**: `:mark_as_paid` action (when `amount_paid` = `amount`)
- **Transition**: `active` → `paid`
- **Side Effect**: `date_paid` timestamp set

### 4. Cancellation

- **Trigger**: `:cancel` action
- **Transition**: `active` or `paid` → `cancelled`
- **Side Effect**: `date_cancelled` timestamp set

### 5. Reactivation

- **Trigger**: `:reactivate` action
- **Transition**: `cancelled` → `active`
- **Purpose**: Restore previously cancelled receivable

---

## Related Resources

| Resource | Location | Relationship |
|----------|----------|--------------|
| `ReceivableAttachment` | `classic/receivables/resources/` | has_many |
| `ReceivableFund` | `classic/receivables/resources/` | has_many |
| `ReceivableGroup` | `classic/receivables/resources/` | belongs_to (optional) |
| `ReceivableHistory` | `classic/receivables/resources/` | has_many |
| `ReceivableSettings` | `classic/receivables/resources/` | has_one |
| `ReceivableTransactions` | `classic/receivables/resources/` | has_many |
| `PayerCustomer` | `classic/customers/resources/` | belongs_to |
| `FeeSettingPlan` | `classic/fees/resources/` | belongs_to |
| `Attachment` | `classic/system/resources/` | belongs_to |
| `Preset` | `classic/subscriptions/resources/` | belongs_to |

---

## Context Module

The `FlamePsAr.Classic.Receivables` module provides:

- `get_receivable_stats/1` - Dashboard statistics
- `load_for_table/1` - AshTable integration with filtering/sorting
- `get_by_id/2` - Single receivable lookup
- `get_with_customer/2` - Receivable with customer data

---

## Key Attributes

| Attribute | Type | Source Column | Description |
|-----------|------|---------------|-------------|
| `amount` | Decimal | `amount` | Total receivable amount |
| `amount_paid` | Decimal | `amountPaid` | Amount paid so far |
| `currency` | String | `currency` | Currency code |
| `status` | Atom | `status` | State machine status |
| `date` | DateTime | `date` | Receivable date |
| `date_due` | DateTime | `dateDue` | Payment due date |
| `date_paid` | DateTime | `datePaid` | When fully paid |
| `date_cancelled` | DateTime | `dateCancelled` | When cancelled |
| `payer_name` | String | `payerName` | Payer display name |
| `payer_email` | String | `payerEmail` | Payer email address |
| `ext_id` | String | `extId` | External/ERP ID |
| `owner_id` | String | `ownerId` | Tenant ID (KSUID) |

---

## Status Change Side Effects

The `CompleteReceivableActionOnStatusChange` change module triggers when status changes:

```elixir
update :update do
  change(FlamePsAr.Classic.Receivables.Changes.CompleteReceivableActionOnStatusChange,
    where: [changing(:status)]
  )
end
```

---

## Constitutional Considerations

- **Legacy**: MySQL table `Receivable` with camelCase columns
- **Decimal**: `amount`, `amount_paid` use `{:decimal, precision: 24, scale: 8}`
- **Tenant**: `owner_id` required for multitenancy
- **Performance**: Custom indexes on `status`, `date_due`, `payer_email`, `ext_id`

---

## Code References

```
lib/flame_ps_ar/classic/receivables/
├── receivables.ex                              # Context module
├── resources/
│   ├── receivable.ex                           # Main resource
│   ├── receivable_attachment.ex
│   ├── receivable_fund.ex
│   ├── receivable_group.ex
│   ├── receivable_history.ex
│   ├── receivable_settings.ex
│   └── receivable_transactions.ex
├── changes/
│   └── complete_receivable_action_on_status_change.ex
└── reactors/
    ├── receivable_sync.ex
    ├── set_receivable_action.ex
    └── steps/
```

---

*"Every dollar owed starts as a receivable."*

