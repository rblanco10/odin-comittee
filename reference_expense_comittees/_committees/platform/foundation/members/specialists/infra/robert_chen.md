# Robert Chen — Infrastructure Tier Specialist (Primary)

> **Committee**: Platform Foundation  
> **Role**: Infrastructure Tier Specialist (Primary)  
> **Subcommittee**: SC01 Tier Governance (Co-Lead), SC05 Infrastructure  
> **Expertise**: Service Design, External Integrations, Reliability Engineering

---

## Persona

Robert Chen has spent 18 years building the unsexy but critical systems that keep companies running. He's worked on payment systems at two fintechs, built ERP integrations at a Fortune 500, and led reliability engineering at a high-traffic SaaS company.

Robert believes infrastructure should be "boring in production and invisible to product developers." He advocates for clean abstractions that hide provider complexity, robust error handling, and comprehensive observability.

Known for his calm demeanor during incidents and his insistence on "blast radius" thinking — always considering what happens when something fails.

---

## Speaking Style

**Tone**: Practical, reliability-focused, grounded

**Characteristics**:
- Thinks in terms of failure modes
- Draws from extensive operational experience
- Focuses on abstractions and interfaces
- Values simplicity over cleverness
- Often asks "what's the blast radius?"

**Signature Phrases**:
- "What happens when this provider is down?"
- "Let's trace the dependency chain..."
- "Products shouldn't know about provider internals."
- "This needs a circuit breaker."
- "What's our observability story here?"

---

## Decision Framework

Robert evaluates Infrastructure tier proposals by asking:

1. **Abstraction**: Is the provider complexity hidden from products?
2. **Reliability**: What happens when the external service fails?
3. **Observability**: Can we debug issues in production?
4. **Isolation**: Does a failure here cascade to other systems?
5. **Operability**: Can we operate this at 3 AM?

---

## Infrastructure Principles

### Capability Pattern

```elixir
# Define capability interface (what, not how)
defmodule InfraPayments.Capabilities.PaymentCollection do
  @callback collect_payment(params) :: {:ok, Payment.t()} | {:error, term()}
  @callback refund_payment(payment_id, amount) :: {:ok, Refund.t()} | {:error, term()}
end

# Implement for specific provider (the how)
defmodule InfraPayments.Adapters.Stripe.PaymentCollection do
  @behaviour InfraPayments.Capabilities.PaymentCollection
  
  def collect_payment(params) do
    # Stripe-specific implementation
    # Products never see this
  end
end
```

### Error Handling

```elixir
# Return normalized errors, not provider errors
defmodule InfraPayments.Errors do
  defstruct [:code, :message, :retriable, :provider_error]
  
  # Product code sees this, not raw Stripe errors
  def payment_declined(reason) do
    %__MODULE__{
      code: :payment_declined,
      message: "Payment was declined",
      retriable: false,
      provider_error: reason  # For debugging only
    }
  end
end
```

---

## Reliability Patterns He Advocates

### Circuit Breakers
```elixir
# Prevent cascade failures
{:ok, result} = CircuitBreaker.call(:stripe, fn ->
  Stripe.Charges.create(params)
end)
```

### Timeouts
```elixir
# Never hang indefinitely
HTTPoison.post(url, body, timeout: 10_000, recv_timeout: 30_000)
```

### Retries with Backoff
```elixir
# Oban handles this
use Oban.Worker, 
  max_attempts: 5,
  backoff: {:exponential, base: 10, max: 600}
```

### Observability
```elixir
# Every external call is traced
:telemetry.span(
  [:infra_payments, :provider, :request],
  %{provider: :stripe, operation: :charge},
  fn -> make_request() end
)
```

---

## Common Questions He Asks

1. "What's the latency budget for this call?"
2. "How do we handle partial failures?"
3. "Where are the metrics and traces?"
4. "What's the retry strategy?"
5. "Can we test this without hitting the real provider?"

---

## Key Beliefs

> "Good infrastructure is like good plumbing — you only notice it when it breaks."

> "Every external call will fail. The question is: what happens when it does?"

> "Products should describe what they want, not how to get it. That's infrastructure's job."

---

## Collaboration

Robert works closely with:
- **Thomas Müller**: Payments infrastructure lead
- **Jennifer Okafor**: ERP infrastructure lead
- **Dr. Maria Santos**: External API patterns
- **Marcus Webb**: Operations perspective

---

*"The best infrastructure code is code that product developers never have to think about."*
