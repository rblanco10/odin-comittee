# Tier-Prefixed Naming Convention

> **Type**: Architecture Reference  
> **Decision**: ADR-002  
> **Status**: APPROVED (2026-01-08)

---

## Overview

All applications in the Ember Platform umbrella use a tier-prefixed naming convention. The prefix immediately communicates the app's architectural role.

---

## The Convention

| Tier | Prefix | Examples |
|------|--------|----------|
| **1. Core** | `core_` | `core_types`, `core_auth`, `core_behaviors`, `core_telemetry` |
| **2. Infrastructure** | `infra_` | `infra_workspaces`, `infra_payments`, `infra_erp`, `infra_identity` |
| **3. Domain** | `domain_` | `domain_coding`, `domain_approvals`, `domain_audit`, `domain_bulk` |
| **4. Product** | `product_` | `product_expense`, `product_payables`, `product_receivables` |
| **5. Web** | `web_` | `web_internal`, `web_portal` |

---

## Rationale

### 1. Immediate Clarity

Looking at an app name tells you exactly what tier it belongs to:

```elixir
# You instantly know this is a product app
defp deps do
  [{:product_receivables, in_umbrella: true}]
end
```

### 2. Prevents Mistakes

You won't accidentally create forbidden dependencies:

```elixir
# Obviously wrong: product depending on product
defp deps do
  [{:product_payables, in_umbrella: true}]  # 🚫 You'd notice this!
end
```

### 3. Onboarding Simplicity

New developers understand the architecture immediately:

```
apps/
├── core_*        ← "These are pure libraries"
├── infra_*       ← "These talk to external services"
├── domain_*      ← "These are shared business logic"
├── product_*     ← "These are customer-facing products"
└── web_*         ← "These are HTTP/Phoenix apps"
```

### 4. Refactoring Support

When moving functionality between tiers, the rename makes it explicit:

```
# Promoting shared logic from product to domain
product_receivables/lib/cash_matching.ex
→ domain_cash_matching/lib/
```

---

## Naming Rules

### Module Names

Module names follow the folder prefix:

```elixir
# In apps/core_types/lib/
defmodule CoreTypes.Money do
  # ...
end

# In apps/infra_payments/lib/
defmodule InfraPayments.PaymentProvider do
  # ...
end

# In apps/product_receivables/lib/
defmodule ProductReceivables.Invoice do
  # ...
end
```

### Application Names

In `mix.exs`, the application name matches the folder:

```elixir
# apps/infra_payments/mix.exs
def project do
  [
    app: :infra_payments,
    # ...
  ]
end
```

### OTP Application Configuration

```elixir
# config/config.exs
config :infra_payments,
  providers: [:stripe, :dwolla]
```

---

## Alternate Names Considered

| Option | Rejected Because |
|--------|------------------|
| No prefix (`payments`, `receivables`) | Unclear tier, easy to violate dependencies |
| Numeric prefix (`t1_types`, `t2_payments`) | Not readable, requires lookup |
| Suffix (`types_core`, `payments_infra`) | Harder to visually scan in listings |
| Verbose (`tier_1_core_types`) | Too long for practical use |

---

## Migration from Legacy

When migrating from `flame_teampay_payables`:

| Old (Ember) | New (Tier-Prefixed) |
|-------------|---------------------|
| `ember_workspaces` | `infra_workspaces` |
| `ember_payments` | `infra_payments` |
| `ember_erp` | `infra_erp` |
| `ember_coding` | `domain_coding` |
| `ember_approvals` | `domain_approvals` |
| `ember_expense` | `product_expense` |
| `ember_ap_invoices` | `product_payables` |

---

## Exceptions

There are no exceptions to this naming convention. Every app MUST use the appropriate tier prefix.

If an app seems to not fit any tier, this indicates an architectural problem that should be resolved, not accommodated.

---

## Related Documentation

- [Umbrella Structure](umbrella_structure.md)
- [Dependency Rules](dependency_rules.md)
- [ADR-002: Tier Naming Convention](../decisions/ADR-002_tier_naming_convention.md)

---

*Last updated: 2026-01-08*
