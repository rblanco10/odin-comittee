# Session 008 Transcript

> **Session**: `2026-01-08_008_domain-coding-migration`

---

## Session Opening

### Dr. Marcus Blackwell — Chair

*This is Dr. Marcus Blackwell, Chair of the Platform Foundation Committee. Opening session 008: Domain Coding Migration.*

**Today's Goal**: Fully migrate ember_coding from flame_teampay_payables to domain_coding (Tier 3), ensuring compilation and proper Tier 2 integration.

**Activated Members**:
- Dr. Marcus Blackwell (Chair)
- Dr. Sarah Lin (Domain Tier Expert)
- Robert Chen (Infrastructure Tier Expert)
- Dr. Robert Fitzgerald (Coding Domain Expert)
- Emily Chen (Recording Clerk)

---

## Research Phase

### Dr. Marcus Blackwell — Chair

*Researching ember_coding structure and dependencies.*

**Findings**:

1. **Source Location**: `campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_coding/`

2. **File Count**: ~107 files

3. **Structure**:
   - `definitions/` — Core Ash resources (CodingCategory, CodingValue, CodingAssignment)
   - `rules/` — Full rules engine with conditions, actions, evaluation
   - `inference/` — ML-based pattern recognition for auto-coding
   - `bulk_operations/` — Import/export functionality
   - `integrations/erp/` — ERP sync for GL accounts
   - `observability/` — Metrics, logging, tracing
   - `reactors/` — Workflow reactors
   - `services/` — Query and utility services
   - `notifications/` — Notification definitions

4. **Dependencies Identified**:
   - `FlameTeampayPayables.Repo` → `CoreData.Repo`
   - `FlameTeampayPayables.EmberWorkspaces` → `InfraIdentity.Workspaces`
   - `FlameTeampayPayables.EmberIdentity` → `InfraIdentity.Identity`
   - `FlameTeampayPayables.EmberErp` → `InfraErp.Erp`
   - `FlameTeampayPayables.EmberCommunications` → Stub (optional notifications)

---

## Architectural Decision

### Dr. Sarah Lin — Domain Tier Expert

*This is Dr. Sarah Lin, Domain Tier Expert. Reviewing the domain_coding architecture.*

**Recommendation**: Single Ash domain `DomainCoding.Coding`

**Rationale**:
- Coding is a cohesive bounded context
- All resources relate to GL coding functionality
- Follows pattern established in Tier 2 (infra_documents has single domain)

**Handoff**: → Dr. Robert Fitzgerald for coding-specific concerns

---

### Dr. Robert Fitzgerald — Coding Domain Expert

*This is Dr. Robert Fitzgerald, Coding Domain Expert. Validating the domain structure.*

**Key Components**:

1. **Core Resources** (definitions/):
   - `CodingCategory` — GL account categories (e.g., "Department", "Cost Center")
   - `CodingValue` — Values within categories (e.g., "Engineering", "Marketing")
   - `CodingAssignment` — Links coding to codable records

2. **Rules Engine** (rules/):
   - `CodingRule` — Rule definitions
   - `CodingRuleCondition` — Condition evaluation
   - `CodingRuleAction` — Actions to take (set_value, lock_field, etc.)
   - `evaluation_engine.ex` — Core evaluation logic

3. **Inference/ML** (inference/):
   - Pattern recognition for auto-coding suggestions
   - ML model training and prediction
   - Heuristic analysis

**Approval**: Structure is sound for migration.

---

## Migration Execution

*Proceeding with migration script creation and execution...*
