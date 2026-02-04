# Reconciliation Flow

## Purpose

Matches and verifies transactions between the local system and payment provider records, identifies discrepancies (variances), maintains audit trails, and ensures financial accuracy across all payment operations.

## Actors

| Actor | Role |
|-------|------|
| **Scheduled Job / Manual Trigger** | Initiates reconciliation |
| **ReconciliationRecord Resource** | Tracks reconciliation state |
| **ReconciliationTrace Resource** | Detailed audit log |
| **VarianceRecord Resource** | Captures discrepancies |
| **Provider Adapter** | Fetches provider data |
| **Domain Resources** | Local transaction records |

## High-Level Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         RECONCILIATION FLOW                                │
│                                                                            │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │    FETCH     │──▶│    MATCH     │──▶│   IDENTIFY   │──▶│   REPORT    │ │
│  │  PROVIDER    │   │   RECORDS    │   │  VARIANCES   │   │  & ALERT    │ │
│  │    DATA      │   │              │   │              │   │             │ │
│  └──────────────┘   └──────────────┘   └──────────────┘   └─────────────┘ │
│         │                  │                  │                  │         │
│         ▼                  ▼                  ▼                  ▼         │
│   Provider API       Local DB query     VarianceRecord    Notifications   │
│   transactions       matching logic      creation           dashboards    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Reconciliation Types

| Type | Frequency | Scope | Primary Use |
|------|-----------|-------|-------------|
| **Daily** | Once per day | Previous day's transactions | Standard operations |
| **Real-time** | Per webhook | Individual transactions | Immediate validation |
| **Weekly** | Weekly | Full week's activity | Cross-check |
| **Monthly** | End of month | Month-end close | Financial reporting |
| **Ad-hoc** | On demand | Specific date range | Investigation |

## Sequence Diagram

```
┌──────────────┐  ┌──────────────────┐  ┌────────────────┐  ┌───────────────┐
│  Scheduler   │  │ReconciliationJob │  │Provider Adapter│  │Local Resources│
└──────┬───────┘  └────────┬─────────┘  └───────┬────────┘  └───────┬───────┘
       │                   │                    │                   │
       │ trigger recon     │                    │                   │
       │──────────────────▶│                    │                   │
       │                   │                    │                   │
       │                   │ create ReconciliationRecord            │
       │                   │────────────────────────────────────────▶
       │                   │                    │                   │
       │                   │ fetch_transactions │                   │
       │                   │───────────────────▶│                   │
       │                   │                    │                   │
       │                   │ [provider_txns]    │                   │
       │                   │◀───────────────────│                   │
       │                   │                    │                   │
       │                   │ query local transactions               │
       │                   │─────────────────────────────────────────▶
       │                   │                    │                   │
       │                   │ [local_txns]       │                   │
       │                   │◀────────────────────────────────────────│
       │                   │                    │                   │
       │                   │ match_and_reconcile                    │
       │                   │────────────────────────────────────────▶
       │                   │                    │                   │
       │                   │ create VarianceRecords (if any)        │
       │                   │────────────────────────────────────────▶
       │                   │                    │                   │
       │                   │ update ReconciliationRecord            │
       │                   │────────────────────────────────────────▶
       │                   │                    │                   │
       │ {:ok, summary}    │                    │                   │
       │◀──────────────────│                    │                   │
```

## Phase 1: Fetch Provider Data

### Fetch Transactions from Provider

```elixir
defp fetch_provider_transactions(provider, date_range, opts) do
  adapter = AdapterRegistry.get_adapter!(provider)
  config = get_provider_config(provider, opts[:workspace_id])
  
  adapter.get_transactions(config, %{
    start_date: date_range.start,
    end_date: date_range.end,
    status: [:completed, :failed, :returned],
    limit: 1000  # Paginate for large datasets
  })
end
```

### Provider Response Normalization

```elixir
defp normalize_provider_transaction(provider, txn) do
  %{
    external_id: get_external_id(provider, txn),
    amount: normalize_amount(provider, txn),
    status: normalize_status(provider, txn),
    rail: normalize_rail(provider, txn),
    timestamp: normalize_timestamp(provider, txn),
    metadata: txn
  }
end
```

## Phase 2: Match Records

### Matching Algorithm

```elixir
defp match_transactions(provider_txns, local_txns) do
  # Build lookup map for local transactions
  local_map = Map.new(local_txns, &{&1.external_payment_id, &1})
  
  Enum.reduce(provider_txns, {[], [], []}, fn provider_txn, {matched, provider_only, local_only} ->
    case Map.get(local_map, provider_txn.external_id) do
      nil ->
        # Provider has transaction we don't have
        {matched, [provider_txn | provider_only], local_only}
      
      local_txn ->
        # Found match - verify details
        match_result = verify_match(provider_txn, local_txn)
        {[match_result | matched], provider_only, local_only}
    end
  end)
  |> add_local_only(local_map, provider_txns)
end
```

### Match Verification

```elixir
defp verify_match(provider_txn, local_txn) do
  discrepancies = []
  
  # Amount check
  discrepancies = if provider_txn.amount != local_txn.amount do
    [{:amount_mismatch, provider_txn.amount, local_txn.amount} | discrepancies]
  else
    discrepancies
  end
  
  # Status check
  discrepancies = if map_status(provider_txn.status) != local_txn.state do
    [{:status_mismatch, provider_txn.status, local_txn.state} | discrepancies]
  else
    discrepancies
  end
  
  %{
    local_txn: local_txn,
    provider_txn: provider_txn,
    matched: true,
    discrepancies: discrepancies
  }
end
```

## Phase 3: Identify Variances

### Variance Types

| Variance Type | Description | Severity |
|---------------|-------------|----------|
| `missing_local` | Provider has record, we don't | High |
| `missing_provider` | We have record, provider doesn't | High |
| `amount_mismatch` | Amounts don't match | Critical |
| `status_mismatch` | Status differs | Medium |
| `timing_variance` | Timestamp differs significantly | Low |
| `metadata_mismatch` | Non-critical field differs | Low |

### Create Variance Records

```elixir
defp create_variance_records(reconciliation, discrepancies) do
  Enum.map(discrepancies, fn discrepancy ->
    VarianceRecord.create(%{
      reconciliation_record_id: reconciliation.id,
      variance_type: discrepancy.type,
      local_value: discrepancy.local_value,
      provider_value: discrepancy.provider_value,
      local_transaction_id: discrepancy.local_txn_id,
      external_transaction_id: discrepancy.external_id,
      amount_difference: calculate_difference(discrepancy),
      severity: determine_severity(discrepancy.type),
      status: :open,
      notes: nil
    })
  end)
end
```

### Severity Determination

```elixir
defp determine_severity(type) do
  case type do
    :amount_mismatch -> :critical
    :missing_local -> :high
    :missing_provider -> :high
    :status_mismatch -> :medium
    :timing_variance -> :low
    :metadata_mismatch -> :low
    _ -> :unknown
  end
end
```

## Phase 4: Report & Alert

### Reconciliation Summary

```elixir
defp build_summary(results) do
  %{
    total_provider_transactions: length(results.provider_txns),
    total_local_transactions: length(results.local_txns),
    matched_count: length(results.matched),
    variance_count: length(results.variances),
    missing_local_count: count_by_type(results.variances, :missing_local),
    missing_provider_count: count_by_type(results.variances, :missing_provider),
    amount_variance_total: sum_amount_variances(results.variances),
    status: determine_reconciliation_status(results)
  }
end
```

### Alerting

```elixir
defp maybe_alert(reconciliation, summary) do
  cond do
    summary.variance_count == 0 ->
      :ok  # No alert needed
    
    has_critical_variance?(summary) ->
      AlertService.send_alert(:reconciliation_critical, %{
        reconciliation_id: reconciliation.id,
        summary: summary
      })
    
    summary.variance_count > threshold() ->
      AlertService.send_alert(:reconciliation_warning, %{
        reconciliation_id: reconciliation.id,
        summary: summary
      })
    
    true ->
      :ok  # Minor variances, log only
  end
end
```

## Data Models

### ReconciliationRecord

```elixir
%ReconciliationRecord{
  id: "recon_uuid",
  workspace_id: "ws_uuid",
  provider: :dwolla,
  reconciliation_type: :daily,
  date_range_start: ~D[2024-01-15],
  date_range_end: ~D[2024-01-15],
  status: :completed,  # :pending, :in_progress, :completed, :failed
  provider_transaction_count: 150,
  local_transaction_count: 152,
  matched_count: 148,
  variance_count: 4,
  total_provider_amount: Money.new(150_000_00, :USD),
  total_local_amount: Money.new(152_500_00, :USD),
  amount_variance: Money.new(2_500_00, :USD),
  started_at: ~U[2024-01-16 02:00:00Z],
  completed_at: ~U[2024-01-16 02:05:32Z],
  error_message: nil
}
```

### ReconciliationTrace

```elixir
%ReconciliationTrace{
  id: "trace_uuid",
  reconciliation_record_id: "recon_uuid",
  step: :fetch_provider_data,  # :match, :identify_variance, :complete
  status: :completed,
  started_at: ~U[2024-01-16 02:00:00Z],
  completed_at: ~U[2024-01-16 02:01:15Z],
  details: %{
    transactions_fetched: 150,
    pages_processed: 2
  },
  error: nil
}
```

### VarianceRecord

```elixir
%VarianceRecord{
  id: "var_uuid",
  reconciliation_record_id: "recon_uuid",
  variance_type: :amount_mismatch,
  local_transaction_id: "txn_uuid",
  external_transaction_id: "ext_12345",
  local_value: "10000",  # Amount in cents as string
  provider_value: "10050",
  amount_difference: Money.new(50, :USD),
  severity: :critical,
  status: :open,  # :open, :investigating, :resolved, :ignored
  resolution: nil,
  resolved_at: nil,
  resolved_by_id: nil,
  notes: nil
}
```

## Variance Resolution Workflow

```
┌──────────┐                  ┌───────────────┐                  ┌───────────┐
│   OPEN   │  investigate     │ INVESTIGATING │   resolve        │ RESOLVED  │
│          │─────────────────▶│               │─────────────────▶│           │
└──────────┘                  └───────────────┘                  └───────────┘
     │                              │
     │ ignore                       │ escalate
     ▼                              ▼
┌──────────┐                  ┌───────────────┐
│ IGNORED  │                  │  ESCALATED    │
│          │                  │               │
└──────────┘                  └───────────────┘
```

### Resolution Actions

```elixir
# Mark variance as resolved
VarianceRecord.resolve(%{
  variance_id: variance.id,
  resolution: :provider_corrected,  # or :local_corrected, :expected_timing, etc.
  notes: "Provider confirmed correction applied",
  resolved_by_id: user.id
})

# Ignore variance (with reason)
VarianceRecord.ignore(%{
  variance_id: variance.id,
  notes: "Timing difference within acceptable threshold",
  resolved_by_id: user.id
})
```

## Scheduling

### Daily Reconciliation Job

```elixir
defmodule ReconciliationScheduler do
  use Oban.Worker, queue: :reconciliation
  
  @impl Oban.Worker
  def perform(%{args: %{"provider" => provider, "workspace_id" => workspace_id}}) do
    yesterday = Date.add(Date.utc_today(), -1)
    
    ReconciliationService.run_reconciliation(%{
      provider: String.to_atom(provider),
      workspace_id: workspace_id,
      date_range: %{start: yesterday, end: yesterday},
      type: :daily
    })
  end
end

# Schedule nightly
Oban.insert(%{
  worker: ReconciliationScheduler,
  args: %{provider: "dwolla", workspace_id: "ws_123"},
  scheduled_at: next_2am_utc()
})
```

## Observability

### Metrics

```elixir
:telemetry.execute(
  [:ember_payments, :reconciliation, :completed],
  %{
    duration_ms: duration,
    transaction_count: summary.total_provider_transactions,
    variance_count: summary.variance_count
  },
  %{
    provider: reconciliation.provider,
    type: reconciliation.reconciliation_type,
    status: summary.status
  }
)
```

### Dashboard Queries

```elixir
# Get variance trend
VarianceRecord
|> Ash.Query.filter(inserted_at >= ^thirty_days_ago)
|> Ash.Query.aggregate(:count, :id)
|> Ash.Query.group_by([:variance_type, fragment("date_trunc('day', inserted_at)")])
|> Ash.read!()

# Get open variances by severity
VarianceRecord
|> Ash.Query.filter(status == :open)
|> Ash.Query.aggregate(:count, :id)
|> Ash.Query.group_by(:severity)
|> Ash.read!()
```

## Code References

- **ReconciliationRecord**: `lib/ember_payments/resources/reconciliation/reconciliation_record.ex`
- **ReconciliationTrace**: `lib/ember_payments/resources/reconciliation/reconciliation_trace.ex`
- **VarianceRecord**: `lib/ember_payments/resources/reconciliation/variance_record.ex`
