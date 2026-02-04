# Domain Overview

> **Location**: `flame_teampay_payables/ember_payments/`  
> **Domain Module**: `FlameTeampayPayables.EmberPayments.Domain`

---

## Purpose

ember_payments provides unified payment operations through external providers. It abstracts provider-specific implementations behind consistent interfaces.

---

## Core Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Business Domains                          │
│  (ember_expense_card, ember_reimbursements, ember_ap_payments)│
├─────────────────────────────────────────────────────────────┤
│                    ember_payments                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Resources (Ash)        │  Services                   │  │
│  │  - CardIssuance         │  - KYB Orchestrators        │  │
│  │  - PayoutBatch/Item     │  - Reconciliation           │  │
│  │  - KybApplication       │  - Circuit Breaker          │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  Reactors               │  Capabilities               │  │
│  │  - IssueCardReactor     │  - CardIssuance.Behavior    │  │
│  │  - SubmitPayoutBatch    │  - PayoutDisbursement       │  │
│  │  - SubmitKybApplication │  - IdentityVerification     │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  Adapters                                              │  │
│  │  - CapabilityRouter     │  AdapterRegistry            │  │
│  │  - Checkbook Adapter    │  Dwolla Adapter             │  │
│  │  - Marqeta Adapter      │  WEX Fleet Adapter          │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                External Provider APIs                        │
│        (Checkbook, Dwolla, Marqeta, WEX Fleet)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
ember_payments/
├── domain.ex                    # Ash domain definition
├── adapters/
│   ├── adapter_registry.ex      # Provider registration
│   ├── capability_router.ex     # Provider selection
│   └── providers/
│       ├── checkbook/
│       ├── dwolla/
│       ├── marqeta/
│       └── wex_fleet/
├── capabilities/                # Capability behaviors/types
├── resources/                   # Ash resources
├── services/                    # Business logic
├── reactors/                    # Multi-step workflows
├── webhooks/                    # Webhook handling
├── observability/               # Metrics/logging/tracing
├── workers/                     # Background jobs
└── test_runner/                 # Test infrastructure
```

---

## Key Concepts

### Capabilities
Define WHAT operations are possible (abstract interface).
```elixir
# capabilities/card_issuance/behavior.ex
@callback issue_card(params, credentials) :: {:ok, result} | {:error, reason}
```

### Adapters
Define HOW operations are performed (provider-specific).
```elixir
# adapters/providers/marqeta/capabilities/card_issuance.ex
def issue_card(params, credentials) do
  # Marqeta-specific implementation
end
```

### Resources
Ash resources store payment domain data.
```elixir
# resources/card/card_issuance.ex
defmodule CardIssuance do
  use Ash.Resource
  # ...
end
```

### Reactors
Multi-step workflows for complex operations.
```elixir
# reactors/card/issue_card_reactor.ex
defmodule IssueCardReactor do
  use Ash.Reactor
  # Steps: validate → create_user → issue_card → create_record
end
```

---

## Providers Supported

| Provider | Capabilities | Status |
|----------|--------------|--------|
| Checkbook | Checks (digital/physical) | Production |
| Dwolla | ACH, KYB, Funding | Available |
| Marqeta | Cards, KYB | Development |
| WEX Fleet | Fleet cards | Development |

---

*"ember_payments is the abstraction layer; it speaks many provider languages but presents one interface."*
