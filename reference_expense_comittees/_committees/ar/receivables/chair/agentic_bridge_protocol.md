# Agentic Bridge Protocol

> **For**: Chair - Dr. Alexandra Chen  
> **Purpose**: Protocol for bridging between Committee deliberation and Agentic implementation

---

## Overview

The AR Receivables Committee operates **complementarily** with the Agentic system in `campsite/flames/flame_ps_ar/docs/agents/`. This document defines the bridge protocol.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMMITTEE-AGENTIC BRIDGE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐                    ┌─────────────────────┐         │
│  │   AR COMMITTEE      │                    │   AGENTIC SYSTEM    │         │
│  │   (Deliberation)    │                    │   (Implementation)  │         │
│  │                     │                    │                     │         │
│  │  • Reviews          │   HANDOFF DOC      │  • Manager          │         │
│  │  • Decides          │ ─────────────────► │  • Coder            │         │
│  │  • Documents        │                    │  • Gapper           │         │
│  │  • Approves         │ ◄───────────────── │  • Architect        │         │
│  │                     │   IMPL REPORT      │                     │         │
│  └─────────────────────┘                    └─────────────────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Committee Deliberation

### Responsibilities
- Review architecture proposals
- Make decisions on approach
- Document requirements and constraints
- Embed constitutional rules
- Generate handoff document

### Outputs
- `decisions.md` with approved approach
- Handoff document in `handoffs/`

### Chair Actions
1. Conduct session following orchestration protocol
2. Ensure all constitutional rules are considered
3. Record decisions with dissent
4. Generate handoff when consensus reached

---

## Phase 2: Handoff Generation

### When to Generate Handoff

Generate a handoff document when:
- ✅ Decision has been made requiring code implementation
- ✅ Committee has reached consensus (or majority vote)
- ✅ Human Director has approved (for major changes)
- ✅ Constitutional compliance verified by Parliamentarian

### Handoff Document Location

```
_committees/ar/receivables/handoffs/[session-id]_handoff.md
```

### Handoff Announcement

```markdown
---
**CHAIR**: I am generating a handoff document for the Agentic system.

**Handoff ID**: [Session ID]_handoff
**Target Lifecycle**: [lifecycle name]
**Constitutional Compliance**: Verified by Parliamentarian

The following decisions are BINDING on implementation:
1. [Decision 1]
2. [Decision 2]

The handoff document has been created at:
`handoffs/[session-id]_handoff.md`

Implementation may proceed via `/arch-manager` with this handoff as input.
---
```

---

## Phase 3: Agentic Implementation

### Agentic System Entry Points

| Command | Purpose |
|---------|---------|
| `/arch-manager` | Create implementation prompt from handoff |
| `/arch-coder` | Execute implementation |
| `/arch-gapper` | Hunt for gaps in implementation |
| `/arch-architect` | Challenge implementation architecture |

### Agentic Workflow

```
1. Manager reads handoff document
2. Manager creates implementation prompt incorporating:
   - All BINDING decisions from committee
   - Constitutional requirements
   - Performance budgets
   - Legacy alignment requirements
3. Coder implements
4. Manager reviews
5. Gapper hunts for gaps
6. Architect challenges
7. Implementation report generated
```

### Agentic Outputs

The Agentic system produces:
- Implementation in `lib/flame_ps_ar/`
- `implementation_log.md` with evidence
- Gap reports (if any gaps found)

---

## Phase 4: Ratification

### Triggering Ratification

When Agentic system completes implementation:
1. Chair is notified (or monitors progress)
2. Chair reviews `implementation_log.md`
3. Chair schedules Ratification Session

### Ratification Session

**Minimum Attendees**:
- Chair (Dr. Alexandra Chen)
- Relevant Subcommittee Lead
- Primary Critic from original session
- Legacy Alignment Adversary (C001) - for MySQL changes
- Performance Skeptic (C002) - for query changes
- Session Historian

**Ratification Agenda**:
1. Review original handoff requirements
2. Review implementation evidence
3. Critics challenge implementation
4. Vote on ratification

### Ratification Outcomes

| Outcome | Action |
|---------|--------|
| **APPROVED** | Implementation accepted, STATUS.md updated |
| **APPROVED WITH NOTES** | Minor follow-up items documented |
| **REJECTED** | Feedback document generated, returns to Agentic |
| **TABLED** | Requires more information, session paused |

---

## Phase 5: Feedback Loop

### If Ratification Rejected

1. Chair generates Ratification Feedback document
2. Feedback sent to Agentic system
3. Agentic addresses issues
4. Re-ratification scheduled

### Feedback Document Location

```
_committees/ar/receivables/handoffs/[session-id]_feedback.md
```

---

## Bridge Commands

During committee sessions, the following commands relate to the bridge:

| Command | Effect |
|---------|--------|
| `handoff` | Generate Implementation Handoff Document |
| `bridge [lifecycle]` | Route to Agentic system for implementation |
| `ratify` | Begin ratification of completed implementation |
| `feedback` | Generate feedback for rejected implementation |

---

## Lifecycle Mapping

Each subcommittee maps to an Agentic lifecycle:

| Subcommittee | Agentic Lifecycle | Location |
|--------------|-------------------|----------|
| SC01 | receivable_lifecycle | `docs/agents/architecture/lifecycles/receivable_lifecycle/` |
| SC02 | customer_lifecycle | `docs/agents/architecture/lifecycles/customer_lifecycle/` |
| SC03 | collections_lifecycle | `docs/agents/architecture/lifecycles/collections_lifecycle/` |
| SC04 | fees_lifecycle | `docs/agents/architecture/lifecycles/fees_lifecycle/` |
| SC05 | payments_lifecycle | `docs/agents/architecture/lifecycles/payments_lifecycle/` |
| SC06 | plan_lifecycle | `docs/agents/architecture/lifecycles/plan_lifecycle/` |
| SC07 | erp_pull_lifecycle | `docs/agents/architecture/lifecycles/erp_pull_lifecycle/` |
| SC08 | erp_push_lifecycle | `docs/agents/architecture/lifecycles/erp_push_lifecycle/` |
| SC09 | change_event_lifecycle | `docs/agents/architecture/lifecycles/change_event_lifecycle/` |
| SC10 | write_to_accounting_lifecycle | `docs/agents/architecture/lifecycles/write_to_accounting_lifecycle/` |

---

## Constitutional Embedding

Every handoff document MUST embed constitutional rules:

### Required Sections in Handoff

1. **Legacy Alignment Requirements**
   - Specific column mappings
   - Status value formats
   - Loopback2 compatibility notes

2. **Financial Data Rules**
   - Decimal requirements
   - Arithmetic patterns

3. **Tenant Isolation Requirements**
   - Required tenant parameters
   - Query patterns

4. **State Machine Requirements**
   - Valid states
   - Valid transitions

5. **Performance Budget**
   - Response time targets
   - Query count limits

---

## Monitoring Bridge Health

### Metrics to Track

| Metric | Target |
|--------|--------|
| Handoffs generated | Track count |
| Ratification rate | ≥ 90% first-pass approval |
| Feedback cycles | ≤ 2 per implementation |
| Time to ratification | ≤ 48 hours |

### Signs of Bridge Problems

- 🔴 Multiple ratification rejections for same issue
- 🔴 Constitutional violations in implementation
- 🔴 Handoff missing critical requirements
- 🔴 Agentic ignoring BINDING decisions

### Remediation

If bridge problems occur:
1. Document the failure mode
2. Identify root cause (Committee or Agentic side)
3. Update handoff templates if needed
4. Update Agentic patterns if needed
5. Document in knowledge base

---

## Example Bridge Flow

```
1. Committee Session: 2026-01-15_001_collections-reactor
   - Decides to use Reactor pattern for collection plan creation
   - Legacy Alignment Adversary verifies compatibility
   - Performance Skeptic approves query budget

2. Handoff Generated:
   - File: handoffs/2026-01-15_001_collections-reactor_handoff.md
   - BINDING: Use Reactor, specific state transitions
   - Constitutional: Legacy column mapping, Decimal for amounts

3. Agentic Implementation:
   - Manager creates prompt from handoff
   - Coder implements CreateCollectionPlanReactor
   - Gapper verifies legacy alignment
   - Architect challenges pattern

4. Ratification:
   - Chair schedules session
   - SC03 Lead + Critics review
   - Vote: APPROVED
   - STATUS.md updated

5. Complete:
   - Implementation merged
   - Knowledge base updated
   - Pattern documented
```

---

*"The bridge connects wisdom to action."*

