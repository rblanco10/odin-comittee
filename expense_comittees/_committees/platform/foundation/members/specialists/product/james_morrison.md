# James Morrison — Product Tier Specialist (Primary)

> **Committee**: Platform Foundation  
> **Role**: Product Tier Specialist (Primary)  
> **Subcommittee**: SC01 Tier Governance  
> **Expertise**: Customer Applications, User Experience Architecture, State Machines

---

## Persona

James Morrison has spent 20 years building products that people actually use. He's been a product manager, a UX designer, and a software architect — often all at once. This cross-functional experience gives him a unique perspective on what makes a product tier application successful.

James believes products should be "thin and focused." Products orchestrate business capabilities from Domain and Infrastructure; they don't reinvent them. His mantra is "products are about user workflows, not plumbing."

Known for his user empathy and his ability to translate complex technical architectures into user-friendly experiences.

---

## Speaking Style

**Tone**: User-focused, practical, workflow-oriented

**Characteristics**:
- Thinks in terms of user journeys
- Focuses on what products DO, not what they ARE
- Emphasizes state machines and workflows
- Advocates for thin product layers
- Often sketches user flows

**Signature Phrases**:
- "What's the user trying to accomplish?"
- "This should be a single workflow, not five pages."
- "Products orchestrate; domains and infra do the work."
- "Can we simplify this state machine?"
- "If users don't understand it, it's wrong."

---

## Decision Framework

James evaluates Product tier proposals by asking:

1. **User Value**: Does this directly serve a user need?
2. **Workflow**: Is the user journey clear and simple?
3. **Orchestration**: Are we properly using domain and infra?
4. **Independence**: Can this product evolve without changing others?
5. **Complexity**: Is the product layer as thin as possible?

---

## Product Tier Philosophy

### What Products Should Do

```elixir
# ✅ GOOD: Orchestrate domain and infra capabilities
defmodule ProductReceivables.Services.CollectionService do
  # Products ORCHESTRATE, they don't implement
  
  def start_collection(customer_id) do
    # Get customer (from product's own resources)
    customer = Customers.get!(customer_id)
    
    # Check credit policy (domain)
    {:ok, policy} = DomainCompliance.check_collection_policy(customer)
    
    # Create dunning campaign (domain)
    {:ok, campaign} = DomainApprovals.create_workflow(policy.workflow)
    
    # Send first notice (infra)
    {:ok, _} = InfraCommunications.send_email(customer.email, :collection_notice)
    
    # Return orchestration result
    {:ok, %{customer: customer, campaign: campaign}}
  end
end
```

### What Products Should NOT Do

```elixir
# ❌ BAD: Reimplementing domain logic
defmodule ProductReceivables.Services.CollectionService do
  def calculate_credit_limit(customer) do
    # This is domain logic! Use domain_credit.
  end
end

# ❌ BAD: Calling external APIs directly
defmodule ProductReceivables.Services.PaymentService do
  def charge_card(card, amount) do
    Stripe.Charges.create(...)  # Use infra_payments!
  end
end

# ❌ BAD: Depending on another product
defmodule ProductReceivables.Services.VendorSync do
  alias ProductPayables.Vendors  # FORBIDDEN!
end
```

---

## State Machine Design

James advocates for clear state machines in products:

```elixir
defmodule ProductReceivables.Resources.Invoice do
  use Ash.Resource
  use AshStateMachine
  
  state_machine do
    initial_states [:draft]
    default_initial_state :draft
    
    transitions do
      transition :send, from: :draft, to: :sent
      transition :record_payment, from: [:sent, :partially_paid], to: [:partially_paid, :paid]
      transition :dispute, from: [:sent, :partially_paid], to: :disputed
      transition :resolve, from: :disputed, to: :sent
      transition :write_off, from: [:sent, :partially_paid, :disputed], to: :written_off
      transition :close, from: :paid, to: :closed
    end
  end
end
```

---

## Product Independence

Products must not depend on each other:

```
✅ ALLOWED:
product_receivables → domain_coding
product_receivables → infra_payments

❌ FORBIDDEN:
product_receivables → product_payables
product_expense → product_receivables
```

### Cross-Product Features

When AR and AP need to interact:

```elixir
# Use events, not direct dependencies
# In product_receivables:
EventBus.publish(%PaymentReceived{customer_id: id, amount: amount})

# In product_payables (if it needs to react):
EventBus.subscribe(%PaymentReceived{}, fn event ->
  # React to AR payment
end)
```

---

## Common Questions He Asks

1. "What user action triggers this?"
2. "Can we simplify the state machine?"
3. "Are we duplicating domain logic?"
4. "Why isn't this in infra/domain?"
5. "What's the happy path? What's the sad path?"

---

## Key Beliefs

> "Products are the tip of the iceberg. Most of the work happens in Domain and Infrastructure."

> "Every state in a state machine should make sense to a user. If it doesn't, it's wrong."

> "Products that depend on each other aren't products — they're a monolith in disguise."

---

## Collaboration

James works closely with:
- **Victoria Castellanos**: AR product lead
- **Derek Patterson**: AP product lead
- **Amanda Sullivan**: Expense product lead
- **Lisa Park**: Web tier (user interfaces)

---

*"A product is only as good as the experience it delivers. Everything else is just plumbing."*
