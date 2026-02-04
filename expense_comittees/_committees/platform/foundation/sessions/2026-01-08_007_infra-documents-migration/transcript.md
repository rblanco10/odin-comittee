# Session Transcript

> **Session**: 2026-01-08_007_infra-documents-migration  
> **Started**: 2026-01-08

---

## Opening

### Dr. Marcus Blackwell — Chair

*This is Dr. Marcus Blackwell, Chair of the Platform Foundation Committee. Opening session 007: infra-documents-migration*

**Today's Goal**: Complete migration of `ember_document_intake` to `infra_documents`

**Context**: The Human Director has requested we continue infrastructure migration, following the pattern established in sessions 003-006. This is the fifth and final infrastructure app migration (completing the 80% → 100% progress).

**Activated Members**:
- Dr. Marcus Blackwell (Chair) - Session orchestration
- Robert Chen (Infrastructure Expert) - Tier 2 architecture
- David Okonkwo (Research Clerk) - Code investigation
- Emily Chen (Recording Clerk) - Session documentation

---

## Research Phase

### David Okonkwo — Research Clerk

*This is David Okonkwo, Research Clerk. I am researching the ember_document_intake structure.*

**Looking for**: File structure, dependencies, Ash domain configuration

**Findings**:

1. **Domain**: Single Ash domain `FlameTeampayPayables.EmberDocumentIntake`
2. **Resources**: 8 Ash resources
3. **File Count**: ~100 .ex files
4. **Provider Adapters**: 7 (Anthropic, Email, OpenAI, PDF, Tesseract, Textract, Upload)

**Key Dependencies Identified**:
- `FlameTeampayPayables.Repo` → `CoreData.Repo`
- `FlameTeampayPayables.EmberWorkspaces` → `InfraIdentity.Workspaces`
- `FlameTeampayPayables.EmberIdentity` → `InfraIdentity.Identity`
- `FlameTeampayPayables.EmberAudit` → Needs stub
- Product-tier resources (ExpenseCard, Reimbursements) → Needs stubs for policies

**Handoff**: → Robert Chen for architectural validation

---

### Robert Chen — Infrastructure Tier Expert

*This is Robert Chen, Infrastructure Tier Expert. I am validating the architectural placement.*

**Assessment**:

✅ **Tier 2 (Infrastructure) is correct** because:
- Has database tables (8 Ash resources)
- Integrates with external APIs (Anthropic, OpenAI, AWS Textract, Tesseract)
- Provides shared document processing for multiple products (Expense receipts, AP invoices, etc.)
- No product-specific business logic (that's delegated to domain routers)

**Dependency Validation**:
- ✅ Depends on `core_data` (Repo) - Allowed (Tier 2 → Tier 1)
- ✅ Depends on `infra_identity` (Workspace, Entity, User) - Allowed (Tier 2 peer)
- ❌ Should NOT depend on `infra_payments`, `infra_erp`, `infra_communications` (no circular deps)

**Recommendation**: Proceed with migration using established pattern.

**Handoff**: → Chair for migration execution

---

## Migration Execution

### Dr. Marcus Blackwell — Chair

*Proceeding with migration. Creating infra_documents app structure...*

---

*Transcript continues as session progresses...*
