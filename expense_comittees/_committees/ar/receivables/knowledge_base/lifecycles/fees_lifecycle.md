# Fees Lifecycle

> **Subcommittee**: SC04 - Fees  
> **Lead**: Diana Foster (DE004)  
> **Location**: `lib/flame_ps_ar/classic/fees/`  
> **Status**: 🔴 Planning

---

## Overview

The Fees lifecycle manages **fee calculation, application, and waiver** across receivables. Fees include late fees, convenience fees, processing fees, and custom fee types.

---

## State Machine

```
┌────────────────────────────────────────────────────────────────────────┐
│                          FEE STATE MACHINE                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐    calculate     ┌──────────┐     apply      ┌────────┐ │
│   │ pending  │─────────────────►│calculated│───────────────►│ applied│ │
│   └──────────┘                  └──────────┘                └────────┘ │
│        │                             │                           │     │
│        │                             │ waive                     │     │
│        │                             ▼                           │     │
│        │                        ┌──────────┐                    │     │
│        └───────────────────────►│  waived  │◄───────────────────┘     │
│              waive              └──────────┘      waive               │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## States

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| `pending` | Fee scheduled, not yet calculated | `calculate`, `waive` |
| `calculated` | Amount determined | `apply`, `waive` |
| `applied` | Fee added to balance | `waive` |
| `waived` | Fee forgiven | Terminal state |

---

## Core Resources

### Fee Resource

```
lib/flame_ps_ar/classic/fees/
├── resources/
│   ├── fee.ex                     # Fee instance
│   ├── fee_setting.ex             # Fee configuration
│   ├── fee_setting_plan.ex        # Fee plans/schedules
│   ├── fee_waiver.ex              # Waiver records
│   ├── collected_fee.ex           # Applied fees
│   └── fee_schedule.ex            # Timing schedules
├── changes/
│   ├── calculate_fee.ex           # Calculate amount
│   └── apply_fee.ex               # Apply to receivable
├── manual_actions/
│   ├── waive_fee.ex               # Waive action
│   └── recalculate_fees.ex        # Recalculation
├── validations/
│   ├── validate_fee_limits.ex     # Max fee limits
│   ├── validate_waiver.ex         # Waiver rules
│   ├── validate_timing.ex         # Grace period checks
│   └── validate_stacking.ex       # Fee stacking rules
└── reactors/
    └── apply_late_fee.ex          # Automated late fee
```

---

## Fee Types

### Late Fees

Applied when payment is overdue:

```elixir
FeeSetting.create(%{
  owner_id: owner_id,
  fee_type: :late_fee,
  calculation_method: :percentage,
  rate: Decimal.new("0.015"),  # 1.5%
  grace_period_days: 15,
  max_amount: Decimal.new("500.00")
})
```

### Convenience Fees

Applied for specific payment methods:

```elixir
FeeSetting.create(%{
  owner_id: owner_id,
  fee_type: :convenience_fee,
  calculation_method: :flat,
  amount: Decimal.new("3.99"),
  applies_to: [:credit_card, :debit_card]
})
```

### Processing Fees

Passed-through payment processing costs:

```elixir
FeeSetting.create(%{
  owner_id: owner_id,
  fee_type: :processing_fee,
  calculation_method: :percentage_plus_flat,
  rate: Decimal.new("0.029"),  # 2.9%
  flat_amount: Decimal.new("0.30")  # + $0.30
})
```

### Custom Fees

Merchant-defined fee types:

```elixir
FeeSetting.create(%{
  owner_id: owner_id,
  fee_type: :custom,
  name: "Returned Check Fee",
  calculation_method: :flat,
  amount: Decimal.new("35.00")
})
```

---

## Calculation Methods

| Method | Description | Example |
|--------|-------------|---------|
| `flat` | Fixed amount | $5.00 |
| `percentage` | % of balance | 1.5% × $1000 = $15 |
| `percentage_plus_flat` | Combined | 2.9% + $0.30 |
| `tiered` | Amount-based tiers | 1% up to $500, 2% above |
| `scheduled` | Time-based escalation | Day 1-15: $10, Day 16+: $25 |

---

## Fee Application Flow

### Automated Late Fee

```
┌────────────────┐     grace period     ┌───────────────┐
│  Receivable    │      expires         │  Fee Engine   │
│  (past due)    │─────────────────────►│  (scheduler)  │
└────────────────┘                      └───────┬───────┘
                                                │
                                                │ calculate
                                                ▼
                                        ┌───────────────┐
                                        │  Fee Record   │
                                        │  (calculated) │
                                        └───────┬───────┘
                                                │
                                                │ apply
                                                ▼
                                        ┌───────────────┐
                                        │  Receivable   │
                                        │  (balance +)  │
                                        └───────────────┘
```

### Convenience Fee at Payment

```
┌────────────────┐     payment          ┌───────────────┐
│  Payment       │     with card        │  Fee Engine   │
│  Initiated     │─────────────────────►│               │
└────────────────┘                      └───────┬───────┘
                                                │
                                                │ check settings
                                                ▼
                                        ┌───────────────┐
                                        │  Convenience  │──► Add to payment total
                                        │  Fee Applied  │
                                        └───────────────┘
```

---

## Waiver Process

### Manual Waiver

```elixir
Fee.waive(%{
  fee_id: fee_id,
  reason: :customer_goodwill,
  waived_by: user_id,
  notes: "First-time customer, one-time courtesy waiver"
})
```

### Bulk Waiver

```elixir
# Waive all late fees for affected customers during outage
Fee.bulk_waive(%{
  owner_id: owner_id,
  fee_type: :late_fee,
  date_range: {~D[2026-01-01], ~D[2026-01-15]},
  reason: :system_outage,
  waived_by: admin_id
})
```

---

## Integration Points

### Receivables (SC01)

Fees increase receivable balance:

```
Fee Applied ──► Receivable.balance += Fee.amount
```

### Collections (SC03)

Fee waivers often part of collection settlements:

```
Collection Plan ──► Partial Fee Waiver ──► Settlement
```

### Payments (SC05)

Convenience fees added at payment time:

```
Payment Method ──► Fee Check ──► Total = Payment + Fee
```

### Plans (SC06)

Fees aggregated during statement compilation:

```
Statement Period ──► Fee Aggregator ──► Statement Total
```

---

## Constitutional Considerations

### Decimal for Money (Article II, Section 2.2)

All fee amounts MUST use Decimal:

```elixir
# CORRECT
attribute :amount, :decimal, precision: 12, scale: 2
attribute :rate, :decimal, precision: 8, scale: 6  # For percentages

# INCORRECT
attribute :amount, :float
```

### Legacy Compatibility (Article II, Section 2.1)

Fee records must be readable by Loopback2:
- `collected_fees` table structure matches legacy
- KSUID format for all IDs
- `owner_id` for tenant isolation

### Performance Budget (Article II, Section 2.5)

Fee calculations must be efficient:
- Bulk fee application: Background job
- Single fee check: < 50ms

---

## Validation Rules

### Maximum Fee Limits

```elixir
validate max_fee_limit do
  # State regulations may cap fees
  max_late_fee = owner_settings.max_late_fee_percent
  calculated <= receivable.amount * max_late_fee
end
```

### Grace Period Enforcement

```elixir
validate grace_period do
  days_past_due = Date.diff(Date.utc_today(), receivable.due_date)
  days_past_due > fee_setting.grace_period_days
end
```

### Fee Stacking Prevention

```elixir
validate no_double_fees do
  # Can't apply same fee type twice in same period
  not Enum.any?(existing_fees, &(&1.fee_type == fee_type and &1.period == period))
end
```

---

## Related Documentation

- Receivables: `lifecycles/receivable_lifecycle.md`
- Collections: `lifecycles/collections_lifecycle.md`
- Plans: `lifecycles/plan_lifecycle.md`

---

*"Fees should be fair, transparent, and consistently applied."*
