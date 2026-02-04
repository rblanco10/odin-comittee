# Flow Documentation

This directory contains detailed documentation for key operational flows in the EmberPayments domain.

## What is a Flow?

A **Flow** is an end-to-end operational sequence that accomplishes a specific business outcome. Flows typically span multiple capabilities, resources, and potentially external provider interactions.

## Flow Documentation Structure

Each flow document covers:

1. **Purpose**: What business outcome the flow achieves
2. **Sequence Diagram**: Visual representation of the steps
3. **Actors**: Who/what initiates and participates
4. **Steps**: Detailed breakdown of each step
5. **Error Handling**: What happens when things go wrong
6. **Observability**: Logs, traces, and metrics emitted
7. **Code References**: Where to find the implementation

## Available Flow Documentation

| Flow | Description | Key Components |
|------|-------------|----------------|
| [Payment Initiation](./payment_initiation_flow.md) | End-to-end outbound payment | InitiatePaymentReactor |
| [Card Issuance](./card_issuance_flow.md) | Virtual/physical card creation | IssueCardReactor |
| [KYB Onboarding](./kyb_onboarding_flow.md) | Business identity verification | KybVerification, KybApplication |
| [Webhook Processing](./webhook_processing_flow.md) | Handling provider events | PaymentWebhookEvent |
| [Reconciliation](./reconciliation_flow.md) | Transaction matching & audit | ReconciliationRecord |

## Flow Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Business Layer                                 │
│  (LiveViews, Services, External APIs)                                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ calls Ash Action
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Ash Resource                                   │
│  (PaymentTransaction, CardIssuance, KybVerification)                    │
│  - Defines actions                                                      │
│  - Invokes Reactors for complex flows                                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ delegates to
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Ash Reactor                                    │
│  (Multi-step workflow orchestration)                                    │
│  - Input validation                                                     │
│  - Step sequencing                                                      │
│  - Compensation on failure                                              │
│  - Observability hooks                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│ Capability    │        │ Resource      │        │ External      │
│ Router        │        │ CRUD          │        │ Service       │
│               │        │               │        │               │
│ - Provider    │        │ - Create      │        │ - Logging     │
│   selection   │        │ - Update      │        │ - Metrics     │
│ - Adapter     │        │ - Query       │        │ - Tracing     │
│   invocation  │        │               │        │               │
└───────────────┘        └───────────────┘        └───────────────┘
```

## Dual Model Support

All major flows support two credential models:

### Platform Model (Modern)

- Credentials resolved via `CredentialResolver`
- Uses workspace-level configuration
- Entity has sub-account at provider (`EntityProviderAccount`)
- Newer, recommended approach

### Direct Model (Legacy)

- Credentials from `PaymentConnection` resource
- Per-entity connection configuration
- Direct adapter calls
- Backward compatible

## Reactor-Based Flow Execution

Complex flows are implemented as Ash Reactors:

```elixir
# Example reactor structure
defmodule FlameTeampayPayables.EmberPayments.Reactors.ExampleReactor do
  use Reactor, extensions: [Ash.Reactor]

  input :workspace_id
  input :entity_id
  input :params

  # Step 1: Validate/prepare
  step :validate do
    run fn args, _context -> 
      # Validation logic
    end
  end

  # Step 2: Call provider
  step :call_provider do
    wait_for [:validate]
    run fn args, _context -> 
      # Provider API call
    end
  end

  # Step 3: Persist result
  step :create_record do
    wait_for [:call_provider]
    run fn args, _context -> 
      # Database write
    end
    
    # Compensation if this step fails after provider call succeeded
    compensate fn args, error, _context ->
      # Undo provider-side changes
    end
  end

  return :create_record
end
```

## Observability Across Flows

All flows emit consistent observability data:

### Tracing (Tempo)

- Root span per flow
- Child spans per step
- Trace ID correlation across services

### Logging (Loki)

- Structured JSON logs
- Trace ID included for correlation
- Severity-based filtering

### Metrics (Prometheus)

- Operation counters
- Duration histograms
- Error rate tracking

## Error Handling Patterns

### Compensation

If a later step fails after provider changes were made, earlier steps can be compensated (reversed):

```elixir
# If DB write fails after payment was initiated
compensate fn args, error, _context ->
  # Cancel the payment at the provider
  AdapterExecutor.execute(
    args.provider,
    :payment_initiation,
    :cancel_payment,
    [args.payment_id]
  )
end
```

### Retry Logic

Transient failures can be retried with backoff:

```elixir
step :call_provider do
  max_retries 3
  retry_delay :timer.seconds(5)
  
  run fn args, _context ->
    # API call that might fail transiently
  end
end
```

### Circuit Breaking

Provider calls are protected by circuit breakers:

```elixir
# Circuit breaker prevents cascading failures
PaymentsCircuitBreaker.call(provider, fn ->
  adapter.send_payment(config, params)
end)
```

## Related Documentation

- [Reactor Pattern](../architecture/reactor_pattern.md)
- [Capability Pattern](../architecture/capability_pattern.md)
- [Provider Guides](../providers/)
