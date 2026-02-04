# Session Decisions

> **Session**: 2026-01-08_007_infra-documents-migration  
> **Status**: COMPLETED ✅

---

## Approved Decisions

### DEC-001: Domain Structure
**Status**: ✅ APPROVED  
**Decision**: Single Ash domain `InfraDocuments.Documents`  
**Rationale**: Follows established pattern from infra_identity, infra_payments, infra_erp, infra_communications  
**Participants**: Dr. Marcus Blackwell (Chair), Robert Chen (Infra Expert)

### DEC-002: Dependencies
**Status**: ✅ APPROVED  
**Decision**: infra_documents depends on core_data and infra_identity  
**Rationale**: 
- Needs Repo from core_data
- Needs Workspace, Entity, User references from infra_identity
- Does NOT depend on infra_payments, infra_erp, or infra_communications (peer infra apps)
**Participants**: Dr. Marcus Blackwell (Chair), Robert Chen (Infra Expert)

### DEC-003: Stub Strategy for External Dependencies
**Status**: ✅ APPROVED  
**Decision**: Create stubs for product-tier references in policies  
**Rationale**: 
- DocumentInbox has policies referencing ExpenseCard, Reimbursements
- These are product-tier apps that don't exist yet
- Stub the relationship definitions to allow compilation
- Real relationships will be established when product tier is migrated
**Participants**: Dr. Marcus Blackwell (Chair), Robert Chen (Infra Expert)

### DEC-004: Audit Extension Handling
**Status**: ✅ APPROVED  
**Decision**: Create stub for AshAudit extension  
**Rationale**: 
- DocumentInbox uses `FlameTeampayPayables.EmberAudit.AshAudit` extension
- EmberAudit is not yet migrated
- Create a no-op stub extension to allow compilation
**Participants**: Dr. Marcus Blackwell (Chair)

### DEC-005: Migration Script Approach
**Status**: ✅ APPROVED  
**Decision**: Use shell script with sed transformations (same as sessions 003-006)  
**Rationale**: Consistent with established migration pattern  
**Participants**: Migration Team

---

*Decisions recorded by Emily Chen, Recording Clerk.*
