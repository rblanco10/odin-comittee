# Session 009 Decisions

> **Session**: `2026-01-08_009_domain-approvals-migration`

---

## Decision 1: Second Domain Tier App Selection

**Decision**: Select `domain_approvals` as the second Domain Tier (Tier 3) application.

**Rationale**:
- Most critical domain library — approval workflows power all products
- 116 files — substantial scope with complex three-bucket policy engine
- Clear dependencies on Tier 2 (identity) and Tier 1 (core_data)
- Natural follow-on from domain_coding migration

**Alternatives Considered**:
- `domain_audit` — Cross-cutting but less critical for initial product migration
- `domain_bulk` — Generic utility, approvals needed first for bulk approval features

**Status**: ✅ Approved

---

## Decision 2: Single Ash Domain

**Decision**: Use single Ash domain `DomainApprovals.Approvals` for all approval functionality.

**Rationale**:
- Approvals is a cohesive bounded context
- All resources relate to approval workflow functionality
- Follows pattern established in domain_coding
- Simpler dependency management

**Resources Registered**:
- 6 Execution resources (ApprovalRequest, ApprovalSession, ApprovalTask, ApprovalDecision, ApprovalReminder, WorkspaceApprovalConfig)
- 8 Policy resources (PolicySet, PolicyRule, PolicyRuleGroup, PolicyRuleCondition, PolicyRuleOutcome, PolicyRuleOutcomeGroup, PolicyRuleOutcomeCondition, PolicyRuleEvaluationLog)
- 6 Workflow resources (ApprovalWorkflow, ApprovalStage, ApprovalGroup, ApprovalGroupMembership, ApprovalRequirement, DelegationRule)
- 4 Inference resources (InferenceJob, InferencePattern, SuggestedPolicyRule, SuggestedWorkflow)

**Status**: ✅ Approved

---

## Decision 3: Tier 2 Dependencies

**Decision**: `domain_approvals` depends on:
- `core_data` — Shared Repo
- `infra_identity` — Workspace, Entity, User references

**Rationale**:
- Core data provides database access
- Identity provides multi-tenancy context
- No direct dependency on infra_erp (stubs provided)

**Dependency Direction**: Tier 3 → Tier 2 → Tier 1 (compliant with governance)

**Status**: ✅ Approved

---

## Decision 4: Comprehensive Adapter Stub Strategy

**Decision**: Create adapter stubs for:
- Product-level dependencies (ExpenseCard, Reimbursements callbacks)
- Peer domain dependencies (Coding, Workforce, BulkOperations)
- Infrastructure services (ERP dimensions, Communications, Audit)
- Budget integration (product-level budget services)

**Rationale**:
- Domain tier should not depend on Product tier
- Peer domain apps not yet migrated need stubs
- Stubs allow compilation while other tiers are migrated
- Follows established pattern from domain_coding migration

**Stubs Created**: 17 adapter files

**Status**: ✅ Approved

---

## Decision 5: PubSub Wrapper Module

**Decision**: Create `DomainApprovals.PubSub` wrapper module for Phoenix.PubSub.

**Rationale**:
- Approval workflows broadcast real-time events (progress, completion, failure)
- Wrapper provides stub mode when no PubSub server configured
- Cleaner interface than direct Phoenix.PubSub calls
- Configurable via application environment

**Status**: ✅ Approved

---

## Decision 6: Audit Extension Stub

**Decision**: Create `DomainApprovals.Adapters.AuditStub` as Spark DSL extension.

**Rationale**:
- Approval resources use `EmberAudit.AshAudit` extension for audit trails
- Extension DSL must be implemented to allow compilation
- Stub accepts DSL configuration but performs no operations
- Will be replaced with real audit integration later

**Status**: ✅ Approved
