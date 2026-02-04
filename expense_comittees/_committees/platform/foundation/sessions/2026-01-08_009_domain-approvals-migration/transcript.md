# Session 009 Transcript

> **Session**: `2026-01-08_009_domain-approvals-migration`  
> **Date**: 2026-01-08  
> **Duration**: ~30 minutes

---

## Session Opening

### Dr. Marcus Blackwell (Chair)
Opening session 009: domain-approvals-migration

Today's Goal: Migrate ember_approvals from flame_teampay_payables to domain_approvals as Tier 3 application.

Activated Members:
- Dr. Sarah Lin — Domain Tier Expert (Lead)
- Dr. Patricia Nguyen — Approvals Lead
- Kevin O'Malley — Approvals Routing Expert
- Robert Chen — Infrastructure Tier Expert
- Dr. William Chang — Ash Framework Expert
- Professor Miranda Okonkwo — Critic (Complexity)
- Dr. Priya Sharma — Critic (Testing)
- David Okonkwo — Research Clerk
- Emily Chen — Recording Clerk

---

## Research Phase

### David Okonkwo (Research Clerk)
Conducted research on:
1. Previous domain_coding migration session for pattern reference
2. Approval-related code in flame_teampay_payables
3. The domain_coding structure to replicate

Findings:
- 116 files in ember_approvals
- Uses FlameTeampayPayables.Approvals.* namespace
- Three-layer structure: Execution, Policies, Workflows
- Additional layers: Inference, Analytics, Observability

---

## Architecture Review

### Dr. Sarah Lin (Domain Tier Expert)
Presented migration plan:
- 116 files to migrate
- Single Ash domain: DomainApprovals.Approvals
- Dependencies: core_data, infra_identity
- Adapter stubs needed for: Product tier, Audit, domain_coding

### Dr. Patricia Nguyen (Approvals Lead)
Validated three-bucket policy model must be preserved:
1. Gate policies — Fast blocking rules
2. Approval policies — First-match routing
3. Review rules — Non-blocking alerts

Approved proceeding with migration.

---

## Implementation

### Step 1: Create App Scaffold
- Created mix.exs with dependencies
- Created application.ex
- Created domain_approvals.ex module doc

### Step 2: Create Migration Script
- scripts/migrate_domain_approvals.sh
- 30+ sed transformations for module names

### Step 3: Execute Migration
- Ran migration script
- 116 files copied and transformed

### Step 4: Create Ash Domain
- DomainApprovals.Approvals with 24 resources

### Step 5: Create Adapter Stubs
Created 17 stub files for:
- AuditStub (Spark DSL extension)
- ProductStubs (ExpenseCard, Reimbursements)
- DomainStubs (Workforce, Coding, BulkOperations)
- ErpStubs (Department, Location, ExpenseCategory)
- BudgetStubs (Budget integration services)
- Communications, Observability, Conduit, etc.

### Step 6: Fix Remaining References
- Fixed FlameTeampayPayables.EmberApprovals references
- Fixed FlameTeampayPayables.PubSub to use wrapper
- Created DomainApprovals.PubSub wrapper module

### Step 7: Update Umbrella Config
- Added domain_approvals to config/config.exs

### Step 8: Verify Compilation
- mix compile: SUCCESS with only warnings

---

## Session Closing

### Dr. Marcus Blackwell (Chair)
Concluding session 009.

Summary:
- 133 total files (116 migrated + 17 new)
- Compilation successful
- All architecture decisions documented
- Adapter stubs enable independent compilation

Next Steps:
- Continue with domain_audit or domain_bulk migration

Session 009 is now CONCLUDED.
