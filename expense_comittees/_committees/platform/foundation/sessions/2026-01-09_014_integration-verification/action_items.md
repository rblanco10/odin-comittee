# Action Items

> **Session**: 2026-01-09_014_integration-verification  
> **Status**: PENDING HUMAN DIRECTOR INPUT

---

## Immediate Actions (Pre-Decision)

### AI-001: Smoke Test the Umbrella
**Assignee**: Technical team  
**Priority**: 🔴 IMMEDIATE  
**Estimated Effort**: 1 hour

Verify the umbrella can:
1. Start all applications
2. Connect to database
3. Run a basic Ash query
4. Execute cross-tier call (e.g., Product → Domain → Infra)

### AI-002: Document All Stub Entry Points
**Assignee**: Research Clerk  
**Priority**: 🟡 HIGH  
**Estimated Effort**: 2 hours

Create a map of every location where production code calls a stub, categorized by:
- Can be wired now (migrated code exists)
- Requires migration
- Architectural (expected to remain stub)

---

## Pending Human Director Decision

### AI-003: Workforce Migration or Shim
**Depends on**: DECISION-001  
**Options**:
- A) Full migration (2-3 sessions)
- B) Minimal shim (1 session)
- C) Accept limitations (0 sessions)

### AI-004: Budget Module Strategy
**Depends on**: DECISION-002  
**Options**:
- A) Full migration (1-2 sessions)
- B) Defer entirely
- C) Minimal stubs

---

## Recommended Immediate Actions (Post-Decision)

### AI-005: Wire Communications
**Priority**: 🔴 HIGH  
**Estimated Effort**: 0.5 session

Connect:
- `InfraIdentity.Adapters.Communications` → `InfraCommunications`
- `InfraPayments.Adapters.Communications` → `InfraCommunications`
- `DomainApprovals.Adapters.Communications` → `InfraCommunications`
- `ProductExpense.*` → `InfraCommunications`

### AI-006: Wire Audit
**Priority**: 🟡 HIGH  
**Estimated Effort**: 0.5 session

Connect:
- All `Adapters.Audit` → `DomainAudit`

### AI-007: Wire Coding Domain Integration
**Priority**: 🟡 MEDIUM  
**Estimated Effort**: 0.5 session

Connect:
- `DomainApprovals.Adapters.DomainStubs.Coding` → `DomainCoding`
- `InfraErp.Adapters.Coding` → `DomainCoding`

---

## Divide and Conquer Strategy

### Phase 1: Verify & Wire (1-2 sessions)
1. Smoke test umbrella
2. Wire Communications
3. Wire Audit
4. Wire Coding integration

### Phase 2: Core Missing Module (2-3 sessions)
1. Migrate Workforce OR create shim (DECISION-001)
2. Complete approval routing (role, relationship, group)

### Phase 3: Budget & Polish (1-2 sessions)
1. Migrate Budget (DECISION-002)
2. Wire remaining integrations
3. End-to-end workflow tests

### Phase 4: Secondary Modules (Optional, 2-3 sessions)
1. Open Banking
2. Observability (Loki/Tempo/Prometheus)
3. Tags, Comments, etc.

---

## Estimated Total Effort

| Scenario | Sessions | Outcome |
|----------|----------|---------|
| **Minimal** (shim + wiring) | 3-4 | ~75% functional parity |
| **Standard** (workforce + budget + wiring) | 6-8 | ~90% functional parity |
| **Full** (all modules) | 10-12 | ~100% functional parity |

---

*Action items pending Human Director prioritization.*
