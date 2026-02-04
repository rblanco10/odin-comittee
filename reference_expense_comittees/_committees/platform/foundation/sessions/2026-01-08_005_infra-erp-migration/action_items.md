# Action Items

> **Session**: 2026-01-08_005_infra-erp-migration  
> **Status**: ✅ COMPLETED

---

## Completed Items

| # | Item | Assignee | Status |
|---|------|----------|--------|
| 1 | Create infra_erp app scaffold | Robert Chen | ✅ Done |
| 2 | Create external_stubs.ex for dependencies | Robert Chen | ✅ Done |
| 3 | Create Ash domain (InfraErp.Erp) | Robert Chen | ✅ Done |
| 4 | Migrate adapters (~293 files) | Migration Script | ✅ Done |
| 5 | Migrate resources (~90 files) | Migration Script | ✅ Done |
| 6 | Migrate services (~70 files) | Migration Script | ✅ Done |
| 7 | Migrate workers (~5 files) | Migration Script | ✅ Done |
| 8 | Update umbrella config | Robert Chen | ✅ Done |
| 9 | Verify compilation | Dr. Marcus Blackwell | ✅ Done |
| 10 | Update STATUS.md | Dr. Marcus Blackwell | ✅ Done |

---

## Follow-Up Items (Future Sessions)

### High Priority

| # | Item | Context | Recommended Session |
|---|------|---------|---------------------|
| 1 | Add Phoenix.PubSub dependency | Required for ERP event broadcasting | Infrastructure Review |
| 2 | Add Redix dependency (optional) | For Redis-based session/token caching | Infrastructure Review |
| 3 | Add X509 dependency (optional) | For NetSuite certificate generation | Infrastructure Review |

### Medium Priority

| # | Item | Context | Recommended Session |
|---|------|---------|---------------------|
| 4 | Migrate infra_communications | Next infrastructure app | Session 006 |
| 5 | Migrate infra_documents | Document storage infrastructure | Session 007 |
| 6 | Begin Domain Tier migration (domain_coding) | First domain tier app | After Infrastructure complete |

### Low Priority

| # | Item | Context | Recommended Session |
|---|------|---------|---------------------|
| 7 | Clean up unused warnings | Decimal.parse pattern warnings | Code quality session |
| 8 | Add test files | Test infrastructure | Testing session |

---

## Dependencies Status

### Infrastructure Tier (Tier 2)

| App | Status | Files | Notes |
|-----|--------|-------|-------|
| **core_data** | ✅ Compiles | ~10 | Shared Repo + Vault |
| **infra_identity** | ✅ Compiles | 343+ | Identity + Workspaces + Auth |
| **infra_payments** | ✅ Compiles | 324 | Payments + Instruments |
| **infra_erp** | ✅ Compiles | 485 | ERP Integration |
| infra_communications | ⏳ Next | - | Email/SMS/Push notifications |
| infra_documents | ⏳ Pending | - | Document storage, OCR |

### Domain Tier (Tier 3)

| App | Status | Notes |
|-----|--------|-------|
| domain_coding | ⏳ Pending | GL coding rules, dimensions |
| domain_approvals | ⏳ Pending | Approval workflows |
| domain_audit | ⏳ Pending | Audit trails |
| domain_bulk | ⏳ Pending | Bulk operations |

---

## Umbrella Structure After Session 005

```
projects/elixir/ember_platform/
├── apps/
│   ├── core_data/           # Tier 1: Shared Repo + Vault ✅
│   ├── infra_identity/      # Tier 2: Identity + Workspaces + Auth ✅
│   ├── infra_payments/      # Tier 2: Payments + Instruments ✅
│   └── infra_erp/           # Tier 2: ERP Integration ✅ NEW!
├── config/
│   ├── config.exs           # Updated with infra_erp domain
│   ├── dev.exs
│   ├── prod.exs
│   └── test.exs
├── scripts/
│   ├── migrate_infra_identity.sh
│   ├── migrate_infra_payments.sh
│   └── migrate_infra_erp.sh  # NEW!
└── mix.exs
```

---

*Action items tracked and prioritized for follow-up sessions.*
