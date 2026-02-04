# Write-to-Accounting Lifecycle

> **Subcommittee**: SC10 - Write-to-Accounting  
> **Lead**: Robert Huang (DE010)  
> **Location**: `lib/flame_ps_ar/ember_erp/` (Push operations)  
> **Status**: ✅ Complete

---

## Overview

The Write-to-Accounting lifecycle manages **GL posting, journal entries, and accounting record synchronization** to external ERP systems. This is the outbound accounting flow where AR transactions are pushed to the general ledger.

---

## State Machine

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ACCOUNTING ENTRY STATE MACHINE                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐     validate     ┌──────────┐      post      ┌────────┐ │
│   │  draft   │─────────────────►│ validated│───────────────►│ posted │ │
│   └──────────┘                  └──────────┘                └────────┘ │
│        │                             │                           │     │
│        │ void                        │ fail                      │     │
│        ▼                             ▼                           │     │
│   ┌──────────┐                  ┌──────────┐      reverse       │     │
│   │  voided  │                  │  failed  │◄────────────────────┘     │
│   └──────────┘                  └──────────┘                          │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## States

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| `draft` | Entry created, pending validation | `validate`, `void` |
| `validated` | Debits = Credits, ready to post | `post`, `fail` |
| `posted` | Successfully written to ERP | `reverse` |
| `failed` | ERP rejected the entry | Retry or manual fix |
| `voided` | Cancelled before posting | Terminal state |

---

## Entry Types

### Invoice Entry

When receivable is created:

```
Debit:  Accounts Receivable      $1,000.00
Credit: Revenue                  $1,000.00
```

### Payment Entry

When payment is received:

```
Debit:  Cash/Bank               $1,000.00
Credit: Accounts Receivable     $1,000.00
```

### Fee Entry

When fee is applied:

```
Debit:  Accounts Receivable       $15.00
Credit: Fee Revenue               $15.00
```

### Adjustment Entry

When balance is adjusted:

```
Debit:  Bad Debt Expense         $500.00
Credit: Accounts Receivable      $500.00
```

### Refund Entry

When refund is issued:

```
Debit:  Revenue                  $200.00
Credit: Cash/Bank                $200.00
```

---

## Push Flow

### Event-Driven Push

Changes trigger accounting entries via Events domain:

```
┌────────────────┐     change      ┌───────────────┐
│  Receivable    │     event       │  Events       │
│  (created)     │────────────────►│  Domain       │
└────────────────┘                 └───────┬───────┘
                                           │
                                           │ dispatch to handler
                                           ▼
                                   ┌───────────────┐
                                   │  Push Handler │
                                   │               │
                                   └───────┬───────┘
                                           │
                                           │ create entry
                                           ▼
                                   ┌───────────────┐
                                   │  Accounting   │
                                   │  Entry        │
                                   └───────┬───────┘
                                           │
                                           │ push to ERP
                                           ▼
                                   ┌───────────────┐
                                   │  ERP System   │
                                   │  (Sage, NS)   │
                                   └───────────────┘
```

### Batch Push

Periodic batch posting:

```elixir
# Daily batch push of all unposted entries
AccountingEntry
|> Ash.Query.filter(status == :validated)
|> Ash.Query.filter(created_at <= ^cutoff_time)
|> Ash.bulk_update(:post)
```

---

## GL Account Mapping

### Mapping Structure

```elixir
# GL account mapping per owner
GlMapping.create(%{
  owner_id: owner_id,
  entry_type: :invoice,
  debit_account: "1200",    # AR Control
  credit_account: "4000",   # Revenue
  dimension_rules: %{
    department: :from_customer,
    location: :from_receivable,
    class: :fixed_value
  }
})
```

### Dimension Mapping

ERP dimensions (departments, locations, classes) are mapped:

```elixir
# Resolve dimensions for an entry
dimensions = DimensionMapper.resolve(%{
  entry: entry,
  customer: customer,
  receivable: receivable,
  mapping: gl_mapping
})

# Result: %{department: "SALES", location: "US-WEST", class: "RECURRING"}
```

---

## ERP Provider Integration

### Sage Intacct

```elixir
# Push journal entry to Sage
SageIntacct.Capabilities.Push.JournalEntry.execute(%{
  workspace_id: workspace_id,
  entry: accounting_entry,
  connection: sage_connection
})
```

### NetSuite

```elixir
# Push journal entry to NetSuite
NetSuite.Capabilities.Push.JournalEntry.execute(%{
  workspace_id: workspace_id,
  entry: accounting_entry,
  connection: netsuite_connection
})
```

### QuickBooks

```elixir
# Push journal entry to QuickBooks
QuickBooks.Capabilities.Push.JournalEntry.execute(%{
  workspace_id: workspace_id,
  entry: accounting_entry,
  connection: qbo_connection
})
```

---

## Validation Rules

### Balance Validation

```elixir
validate balanced_entry do
  total_debits = Enum.sum(entry.lines, & &1.debit_amount)
  total_credits = Enum.sum(entry.lines, & &1.credit_amount)
  
  Decimal.eq?(total_debits, total_credits)
end
```

### Account Existence

```elixir
validate accounts_exist do
  all_accounts = Enum.map(entry.lines, & &1.gl_account)
  
  Enum.all?(all_accounts, fn account ->
    GlAccount.exists?(owner_id: entry.owner_id, account_number: account)
  end)
end
```

### Period Open

```elixir
validate period_open do
  period = AccountingPeriod.for_date(entry.posting_date)
  period.status == :open
end
```

---

## Reversal Process

### Automatic Reversal

When a posted entry needs reversal:

```elixir
AccountingEntry.reverse(%{
  original_entry_id: entry_id,
  reason: :payment_bounced,
  reversal_date: Date.utc_today()
})

# Creates inverse entry:
# Original: Debit AR, Credit Revenue
# Reversal: Debit Revenue, Credit AR
```

### Partial Reversal

For partial adjustments:

```elixir
AccountingEntry.partial_reverse(%{
  original_entry_id: entry_id,
  reversal_amount: Decimal.new("500.00"),
  reason: :partial_refund
})
```

---

## Error Handling

### ERP Rejection

When ERP rejects an entry:

```elixir
case push_result do
  {:ok, erp_reference} ->
    Entry.mark_posted(entry, erp_reference)
    
  {:error, :invalid_account} ->
    Entry.mark_failed(entry, "GL account not found in ERP")
    Alert.notify(:accounting_push_failed, entry)
    
  {:error, :period_closed} ->
    Entry.mark_failed(entry, "Accounting period closed in ERP")
    Entry.queue_for_next_period(entry)
end
```

### Retry Logic

```elixir
# Failed entries retry with backoff
PushWorker.schedule_retry(%{
  entry_id: entry.id,
  attempt: entry.push_attempts + 1,
  delay: exponential_backoff(entry.push_attempts)
})
```

---

## Constitutional Considerations

### Decimal for Money (Article II, Section 2.2)

All amounts MUST use Decimal:

```elixir
attribute :debit_amount, :decimal, precision: 15, scale: 2
attribute :credit_amount, :decimal, precision: 15, scale: 2
```

### Audit Trail

All accounting entries must be immutable after posting:

```elixir
# Posted entries cannot be modified, only reversed
validate no_modification_after_post do
  if changing?(:any) and entry.status == :posted do
    raise "Posted entries cannot be modified. Use reversal instead."
  end
end
```

### Balanced Books

Every entry must balance to zero:

```elixir
# Constitutional requirement: Debits = Credits
validate balanced do
  sum(debits) == sum(credits)
end
```

---

## Integration Points

### Events Domain (SC09)

Changes trigger push via events:

```
Change Event ──► Handler ──► Accounting Entry ──► ERP Push
```

### ERP Push (SC08)

Accounting entries use ERP Push infrastructure:

```
Accounting Entry ──► Push Reactor ──► ERP Adapter ──► External ERP
```

### Receivables (SC01)

Receivable changes create accounting entries:

```
Receivable Created ──► Invoice Entry
Receivable Paid ──► Payment Entry
```

---

## Related Documentation

- Events domain: `architecture/events_domain.md`
- ERP Push: `lifecycles/erp_push_lifecycle.md`
- Receivables: `lifecycles/receivable_lifecycle.md`

---

*"Every dollar must have a story; every entry must balance."*
