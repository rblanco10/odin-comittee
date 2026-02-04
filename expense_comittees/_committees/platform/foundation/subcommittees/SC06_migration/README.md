# SC06: Migration Subcommittee

> **Code**: SC06  
> **Lead**: Carlos Rivera  
> **Co-Lead**: Sarah Lindqvist  
> **Focus**: Legacy migration from flame_teampay_payables

---

## Mission

The Migration Subcommittee is responsible for the safe, incremental migration from the legacy `flame_teampay_payables` monolith to the new `ember_platform` umbrella architecture.

We ensure that migration:
1. Causes zero production disruption
2. Maintains backward compatibility during transition
3. Is incremental and reversible
4. Is thoroughly tested at each step

---

## Jurisdiction

### Primary Responsibilities

- Define migration sequence and phases
- Create migration shims and adapters
- Coordinate with product subcommittees
- Track migration progress
- Handle migration rollbacks if needed

### Decision Authority

| Decision Type | Authority Level |
|---------------|-----------------|
| Migration sequence | Subcommittee approval |
| Shim approach | Subcommittee approval |
| Migration phase go/no-go | Subcommittee + affected product leads |
| Rollback decision | Subcommittee (emergency authority) |

---

## Members

| Name | Role | Expertise |
|------|------|-----------|
| Carlos Rivera | Lead | Migration strategy |
| Sarah Lindqvist | Co-Lead | Shim patterns |
| Helena Andersen | Advisor | Umbrella architecture |
| Derek Patterson | Product Liaison | AP migration |
| Amanda Sullivan | Product Liaison | Expense migration |
| Dr. Elena Popov | Technical | Database migrations |
| Rachel Kim | Technical | Deployment |
| Dr. Priya Sharma | Quality | Testing strategy |

---

## Migration Strategy

### Phase 0: Foundation (Current)
- ✅ Architectural decisions made
- ✅ Committee established
- ⏳ Create umbrella scaffold
- ⏳ Create core tier apps

### Phase 1: Core + Infra Foundation
- Create `core_types`, `core_auth`, `core_behaviors`, `core_telemetry`
- Create `infra_workspaces` (foundational)
- Shim: Legacy imports from new core

### Phase 2: Infrastructure Migration
- Migrate `ember_payments` → `infra_payments`
- Migrate `ember_erp` → `infra_erp`
- Migrate `ember_workspaces` → `infra_workspaces`
- Shim: Legacy code uses new infra via shims

### Phase 3: Domain Migration
- Migrate `ember_coding` → `domain_coding`
- Migrate `ember_approvals` → `domain_approvals`
- Create `domain_audit`, `domain_bulk`, `domain_compliance`

### Phase 4: Product Extraction
- Extract `ember_expense` → `product_expense`
- Extract `ember_ap_invoices` → `product_payables`
- Build `product_receivables` (new)

### Phase 5: Web Layer
- Create `web_internal`
- Create `web_portal`
- Migrate LiveView components

### Phase 6: Cleanup
- Remove legacy shims
- Remove `flame_teampay_payables`
- Update all documentation

---

## Shim Strategy

### Purpose
Shims allow legacy code to continue working while migration progresses.

### Example: Payments Shim

```elixir
# During migration, legacy code uses shim
defmodule FlameTeampayPayables.EmberPayments.PaymentService do
  @moduledoc """
  SHIM: Delegates to new infra_payments.
  Remove after migration Phase 2 complete.
  """
  
  defdelegate process_payment(params), 
    to: InfraPayments.Services.PaymentService
    
  defdelegate get_connection(id),
    to: InfraPayments.Services.ConnectionService
end
```

### Shim Lifecycle

```
1. CREATE: Shim wraps new implementation
2. MIGRATE: Callers use shim (unchanged imports)
3. UPDATE: Callers migrate to new module
4. DEPRECATE: Shim logs warnings
5. REMOVE: Shim deleted
```

---

## Database Migration

### Strategy: Shared Database
During migration, both old and new code share the same database.

### Schema Evolution
- New tables use new naming (`infra_*`, `product_*`)
- Views/aliases for backward compatibility
- Ecto migrations in appropriate apps

---

## Risk Mitigation

### Rollback Plan
Each phase has a documented rollback procedure.

### Feature Flags
Use feature flags to gradually shift traffic.

### Monitoring
Enhanced monitoring during migration phases.

### Testing
- Unit tests for new code
- Integration tests for shims
- End-to-end tests for user workflows

---

## Meeting Cadence

- **Regular**: Twice weekly during active migration
- **Phase Review**: Before each phase start
- **Go/No-Go**: Before each phase deployment

---

## Related Documentation

- [Umbrella Structure](../../knowledge_base/architecture/umbrella_structure.md)
- [Migration Log](../../knowledge_base/migration/) (TBD)

---

*"Good migrations are invisible to users and liberating to developers."*
