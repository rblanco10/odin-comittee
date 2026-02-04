# Session 009 Goal

> **Session**: `2026-01-08_009_domain-approvals-migration`  
> **Started**: 2026-01-08  
> **Status**: ✅ COMPLETED

---

## Objective

Migrate `ember_approvals` from `flame_teampay_payables` to `domain_approvals` in the Ember Platform umbrella as a **Tier 3 (Domain)** application.

## Scope

### Source
```
campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_approvals/
├── analytics/           # Analytics services
├── execution/           # Approval requests, sessions, tasks, decisions
├── inference/           # AI-powered rule suggestions
├── integrations/        # AI actions, notifications
├── notifications/       # Notification definitions
├── observability/       # Logging, metrics, tracing
├── policies/            # Three-bucket policy engine
├── workflows/           # Multi-stage workflow templates
└── workers/             # Background workers
```

### Target
```
projects/elixir/ember_platform/apps/domain_approvals/
├── lib/domain_approvals/
│   ├── adapters/        # Stubs for external dependencies
│   ├── approvals/       # Migrated approval logic
│   ├── application.ex
│   └── approvals.ex     # Ash domain
├── mix.exs
└── test/
```

## Key Decisions Required

1. **Single Ash Domain**: Use `DomainApprovals.Approvals` for all functionality
2. **Dependencies**: `core_data`, `infra_identity`
3. **Adapter Stubs**: Product tier (ExpenseCard), Audit, Communications

## Success Criteria

- [ ] All 116 files migrated
- [ ] `mix compile` succeeds
- [ ] Module namespaces correctly transformed
- [ ] Adapter stubs created for external dependencies
- [ ] Umbrella configuration updated

---

*"Approvals are the gateway to action; their architecture must be flawless."*
