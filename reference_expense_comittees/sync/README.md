# Sync Committee

> **The governance body ensuring all sync-related plans and implementations are architecturally sound, faithfully executed, and aligned with real-world ERP and finance operations.**

---

## Charter

The Sync Committee is a **perpetual governance machine** — a dynamic, state-driven collaborative system that reviews, validates, and governs all work related to ERP data ingestion. It is NOT a runtime operational system; it is a **code and plan evaluation body** that ensures the intent of sync operations is sound before they reach production.

### This Committee Is:
- A design review and code governance body
- A collaborative system where 25 members contribute different perspectives
- A perpetual process that loops indefinitely, evolving with each cycle
- Driven by human-in-the-loop triggers that push it forward

### This Committee Is NOT:
- An operational runtime system
- A linear pipeline (Plan → Audit → Sign-Off)
- A one-time review that "completes"

---

## Remit

> **The Sync Committee ensures that all data ingested from external ERP systems is accurate, complete, properly mapped, and maintains referential integrity with Teampay's domain model — while being fully observable and resilient to provider-specific quirks.**

### Key Responsibilities:

1. **Plan Review** — Evaluate proposed sync designs for completeness, edge case coverage, and architectural alignment
2. **Implementation Audit** — Verify that committed code faithfully implements the approved plan
3. **Gap Identification** — Discover what's missing, underspecified, or risky in both plans and implementations
4. **Standards Enforcement** — Ensure all sync code follows established patterns
5. **Mapping Validation** — Review data transformation logic for semantic correctness
6. **Dependency Verification** — Confirm sync ordering respects entity dependencies
7. **Failure Strategy Assessment** — Evaluate failure/recovery approaches contextually (not by blanket policy)
8. **Domain Alignment** — Ensure designs match how ERPs and finance teams actually work

---

## Goal

> **Ensure that Teampay's view of ERP data is a faithful, timely, and auditable mirror of the source system — never stale, never corrupt, never orphaned.**

---

## Outcome

A sync system where:

1. Every sync operation is traceable end-to-end
2. No data silently fails — all errors are captured and surfaced
3. Dependencies are enforced — entities sync in correct order
4. Mappings are validated — unknown fields are flagged, not guessed
5. Incremental syncs are trustworthy
6. Recovery is deterministic — we know exactly how to resume from any failure point
7. Provider onboarding is mechanical — adding a new ERP follows a predictable checklist
8. Designs match reality — how finance teams and ERPs actually work

---

## How It Works

The committee operates as a **dynamic conversation graph**, not a linear pipeline:

1. **Meeting convenes** — Chair opens based on current session state
2. **Context-aware routing** — Based on state + what just happened, work routes to 1-5 relevant members
3. **Member contributes** — Member performs their work, adds to shared context
4. **Handoff decision** — System determines who needs to respond next based on what was produced
5. **Context accumulates** — Shared context grows with each contribution
6. **Human checkpoint** — At natural breakpoints, human can review, redirect, or push forward
7. **Loop continues** — The cycle never truly ends; it's continuous governance

See [workflow.md](./workflow.md) for the full dynamic routing logic.

---

## Membership

The committee has **25 members** across 7 categories:

| Category | Members | Purpose |
|----------|---------|---------|
| **Process** | 3 | Drive meetings, document findings, prepare materials |
| **Context** | 3 | Explain current state, defend proposals, recall precedents |
| **Technical** | 5 | Evaluate architectural soundness |
| **Verification** | 3 | Audit implementation fidelity |
| **ERP Domain** | 4 | Bring provider-specific expertise |
| **Business Domain** | 4 | Bring real-world finance operations knowledge |
| **User & Integration** | 3 | Represent end-users and implementation realities |

See [members/_index.md](./members/_index.md) for the full roster.

---

## Invoking the Committee

To convene or continue a committee session:

```
/sync-committee
```

The committee will:
1. Load current session state
2. Review shared context
3. Determine which members should be active
4. Route work to those members
5. Accumulate findings in shared context
6. Pause at human checkpoints for input

---

## Key Files

| File | Purpose |
|------|---------|
| [workflow.md](./workflow.md) | Dynamic routing logic, handoff rules, state machine |
| [session_state.md](./session_state.md) | Current state: active members, pending handoffs, goal |
| [shared_context.md](./shared_context.md) | Accumulating context that grows each turn |
| [routing_rules.md](./routing_rules.md) | Who gets routed to based on triggers |
| [human_in_the_loop.md](./human_in_the_loop.md) | When and how humans intervene |
| [members/_index.md](./members/_index.md) | Full member registry |

