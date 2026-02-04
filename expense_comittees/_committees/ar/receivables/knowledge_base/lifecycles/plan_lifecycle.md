# Plan Lifecycle

> **Subcommittee**: SC06 - Plan Compilation  
> **Lead**: Kevin O'Brien (DE009)  
> **Location**: `lib/flame_ps_ar/classic/accounts/plan/`  
> **Status**: ✅ Complete (85%)

---

## Overview

The Plan lifecycle manages **statement compilation, collection plan creation, and scheduled billing** in the AR domain. Plans consolidate receivables into periodic statements and define payment schedules.

---

## State Machine

```
┌────────────────────────────────────────────────────────────────────────┐
│                         PLAN STATE MACHINE                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐     compile      ┌──────────┐     finalize    ┌───────┐ │
│   │  draft   │─────────────────►│ compiled │───────────────►│ final │ │
│   └──────────┘                  └──────────┘                └───────┘ │
│        │                             │                           │     │
│        │ cancel                      │ cancel                    │     │
│        ▼                             ▼                           │     │
│   ┌──────────┐                  ┌──────────┐                    │     │
│   │ cancelled│◄─────────────────│ cancelled│◄───────────────────┘     │
│   └──────────┘                  └──────────┘                          │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## States

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| `draft` | Plan created, awaiting compilation | `compile`, `cancel` |
| `compiled` | Receivables aggregated, amounts calculated | `finalize`, `cancel` |
| `final` | Locked for payment processing | `cancel` (with restrictions) |
| `cancelled` | Voided, no longer active | Terminal state |

---

## Core Resources

### Plan

The main compilation resource:

```
lib/flame_ps_ar/classic/accounts/plan/
├── resources/
│   └── plan.ex                    # Core Plan resource
├── compilation/
│   ├── compiler.ex                # Compilation logic
│   ├── statement_builder.ex       # Build statements
│   └── aggregators/
│       ├── receivable_aggregator.ex
│       ├── fee_aggregator.ex
│       └── payment_aggregator.ex
└── reactors/
    ├── compile_plan.ex            # Compile draft → compiled
    └── finalize_plan.ex           # Compiled → final
```

### Key Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | KSUID | Primary key |
| `owner_id` | KSUID | Tenant identifier |
| `status` | Enum | draft/compiled/final/cancelled |
| `period_start` | Date | Statement period start |
| `period_end` | Date | Statement period end |
| `total_amount` | Decimal | Compiled total |
| `due_date` | Date | Payment due date |
| `compiled_at` | DateTime | When compilation occurred |
| `finalized_at` | DateTime | When finalized |

---

## Plan Types

### Statement Plan

Periodic billing statements consolidating receivables:

```elixir
# Monthly statement compilation
Plan.compile(%{
  owner_id: owner_id,
  payer_id: payer_id,
  plan_type: :statement,
  period_start: ~D[2026-01-01],
  period_end: ~D[2026-01-31]
})
```

### Collection Plan

Structured payment arrangements for overdue amounts:

```elixir
# Collection plan with payment schedule
Plan.compile(%{
  owner_id: owner_id,
  payer_id: payer_id,
  plan_type: :collection,
  installments: 6,
  first_payment_date: ~D[2026-02-01]
})
```

---

## Compilation Process

### Phase 1: Gather Receivables

```elixir
# Aggregator gathers all receivables in period
receivables = ReceivableAggregator.aggregate(%{
  owner_id: owner_id,
  payer_id: payer_id,
  period_start: period_start,
  period_end: period_end,
  status: [:active]
})
```

### Phase 2: Calculate Fees

```elixir
# Fee aggregator calculates applicable fees
fees = FeeAggregator.aggregate(%{
  receivables: receivables,
  fee_settings: owner_fee_settings
})
```

### Phase 3: Apply Payments

```elixir
# Payment aggregator credits existing payments
payments = PaymentAggregator.aggregate(%{
  payer_id: payer_id,
  period_end: period_end
})
```

### Phase 4: Build Statement

```elixir
# Statement builder creates final statement
statement = StatementBuilder.build(%{
  receivables: receivables,
  fees: fees,
  payments: payments,
  plan: plan
})
```

---

## Integration with Other Lifecycles

### Receivable Lifecycle (SC01)

Plans pull receivables in specific states:

```
Receivable (active) ──► Plan Compilation ──► Statement Line Item
```

### Fee Lifecycle (SC04)

Fees are calculated during compilation:

```
Fee Settings ──► Fee Aggregator ──► Statement Fees
```

### Payments Lifecycle (SC05)

Payments credited against plan balance:

```
Payment (completed) ──► Payment Aggregator ──► Plan Credit
```

### Collections Lifecycle (SC03)

Collection plans create scheduled collection actions:

```
Collection Plan ──► Collection Actions ──► Scheduled Payments
```

---

## Constitutional Considerations

### Decimal for Money (Article II, Section 2.2)

All amounts MUST use Decimal:

```elixir
# CORRECT
attribute :total_amount, :decimal, precision: 12, scale: 2

# INCORRECT
attribute :total_amount, :float
```

### Legacy Compatibility (Article II, Section 2.1)

Plans are readable by Loopback2:
- Column names match legacy schema
- KSUID format for IDs
- Timestamps in UTC

### Performance Budget (Article II, Section 2.5)

Compilation queries must respect budgets:
- Statement view: < 200ms
- Compilation: Background job (no timeout)

---

## Related Documentation

- Receivables: `lifecycles/receivable_lifecycle.md`
- Collections: `lifecycles/collections_lifecycle.md`
- Fees: `lifecycles/fees_lifecycle.md`

---

*"Plans consolidate chaos into structured obligations."*
