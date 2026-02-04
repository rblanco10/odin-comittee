# Session Goal

> **Session**: 2026-01-08_005_infra-erp-migration  
> **Chair**: Dr. Marcus Blackwell  
> **Type**: Migration

---

## Primary Objective

Migrate `ember_erp` from `flame_teampay_payables` into the new `infra_erp` Tier 2 infrastructure app within the Ember Platform umbrella.

## Success Criteria

1. **Compilation**: `infra_erp` compiles successfully with zero errors
2. **Integration**: Properly depends on `core_data`, `infra_identity`, and `infra_payments`
3. **Pattern Compliance**: Follows established adapter stub pattern
4. **Domain Structure**: Single or dual Ash domain(s) as appropriate for ERP
5. **Provider Coverage**: All ERP provider adapters migrated and compiling:
   - NetSuite
   - Sage Intacct
   - QuickBooks
   - Xero
   - Acumatica
   - Business Central
   - SAT Mexico

## Scope

### In Scope
- All `ember_erp` resources, services, adapters, workers
- Configuration and sync infrastructure
- Push orchestration and logging
- Provider-specific adapters and mappers
- Webhook handling
- Observatory resources (health, confidence, intervention)

### Out of Scope
- Product-specific ERP integration logic (stays in product tier)
- Web/LiveView components (stays in web tier)
- Test files (future session)

## Dependencies

| App | Reason |
|-----|--------|
| `core_data` | Shared Repo and Vault |
| `infra_identity` | Workspace, Entity relationships |
| `infra_payments` | Payment-related ERP sync (optional) |

---

*This session follows the successful patterns established in sessions 003 (infra_identity) and 004 (infra_payments).*
