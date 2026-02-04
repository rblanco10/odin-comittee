# Session Goal

> **Session ID**: 2026-01-19_001  
> **Session Code**: marqeta-loki-migration  
> **Date**: 2026-01-19  
> **Type**: Implementation  
> **Chair**: Dr. Alexandra Chen (Chief Orchestrator)

---

## Objective

Implement Loki logging for Marqeta card operations and migrate dashboard queries from Prometheus to Loki, following the patterns established in the previous session for Dwolla/reimbursement logging.

---

## Success Criteria

1. ✅ EmberPayments LokiLoggingService event names follow `{domain}_{entity}_{action}_{phase}` convention
2. ✅ `status` is added as a Loki label for all `_end` events (enabling efficient LogQL filtering)
3. ✅ Dashboard panels for Card Operations, Marqeta, and WEX Fleet use Loki queries
4. ✅ Event naming is consistent across EmberPayments and EmberReimbursements domains
5. ✅ Code formatting follows multi-line pipe chain style guidelines

---

## Scope

### In Scope

- EmberPayments LokiLoggingService event naming updates
- EmberReimbursements LokiLoggingService alignment
- Tier 1 Business Overview dashboard query migration
- Subcommittee quality review

### Out of Scope

- Prometheus metrics removal (to be deprecated later)
- Tempo/distributed tracing integration
- Alert configuration

---

## Expected Outputs

1. Updated `ember_payments/observability/services/loki_logging_service.ex`
2. Updated `ember_reimbursements/observability/services/loki_logging_service.ex`
3. Updated `tier1-business-overview.json` dashboard
4. Session documentation

---

## Participants

| Role | Member | Contribution |
|------|--------|--------------|
| Chair | Dr. Alexandra Chen | Session orchestration |
| SC01 | Marcus Okonkwo | Logging architecture review |
| SC14 | Dr. Sarah Kim | Developer experience review |
| SC18 | Dr. James Chen | Standards compliance review |
| Human Director | — | Direction and approval |

---

*Session opened: 2026-01-19*
*Session closed: 2026-01-19*

