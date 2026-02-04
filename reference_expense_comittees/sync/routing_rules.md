# Sync Committee Routing Rules

> **Defines when and why work routes to specific committee members.**

---

## Routing Philosophy

Routing is **context-driven**, not procedural. The committee doesn't follow a fixed sequence; instead, each contribution creates signals that determine who should respond next.

### Routing Inputs
1. **Keywords/phrases** in the contribution
2. **Artifact types** produced (gaps, findings, questions)
3. **Current session state**
4. **Explicit handoff recommendations** from members
5. **Unresolved items** in session state

### Routing Outputs
- 1-5 members to route to next
- Whether routing is parallel (independent) or sequential (dependent)
- Whether a human checkpoint is triggered

---

## Keyword-Based Routing

When a contribution contains these keywords/phrases, route to the corresponding members:

### Architectural Concerns
| Trigger Phrase | Route To |
|----------------|----------|
| "architectural concern", "structural issue", "design problem" | Sync Architect |
| "doesn't fit the pattern", "violates abstraction" | Sync Architect, Standards Enforcer |
| "this changes the data model" | Sync Architect, Data Mapping Specialist |
| "breaks the dependency order" | Dependency Guardian |

### Provider-Specific
| Trigger Phrase | Route To |
|----------------|----------|
| "NetSuite", "NS", "SuiteScript" | NetSuite Domain Expert |
| "Intacct", "Sage" | Sage Intacct Domain Expert |
| "QuickBooks", "QBO" | QuickBooks Domain Expert |
| "all ERPs", "every provider", "provider-agnostic" | Multi-ERP Generalist |
| "provider-specific quirk" | Relevant Provider Expert |

### Business Domain
| Trigger Phrase | Route To |
|----------------|----------|
| "AP", "accounts payable", "vendor", "invoice", "bill" | Accounts Payable Expert |
| "expense", "reimbursement", "receipt" | Expense Management Expert |
| "GL", "general ledger", "chart of accounts", "COA" | GL & Chart of Accounts Expert |
| "month-end", "close", "period", "finance team" | Finance Operations Generalist |

### Technical Quality
| Trigger Phrase | Route To |
|----------------|----------|
| "edge case", "what if", "failure mode" | Edge Case Hunter |
| "can we trace", "observable", "telemetry" | Observability Auditor |
| "test coverage", "tested", "unit test" | Test Coverage Analyst |
| "code matches", "implementation matches" | Code Fidelity Auditor |
| "pattern", "convention", "standard" | Standards Enforcer |

### Mapping & Data
| Trigger Phrase | Route To |
|----------------|----------|
| "mapping", "transform", "field mapping" | Data Mapping Specialist |
| "data quality", "malformed", "null", "invalid" | Data Quality Specialist |
| "sync order", "dependency", "must exist first" | Dependency Guardian |

### Context & History
| Trigger Phrase | Route To |
|----------------|----------|
| "why is it this way", "current state", "history" | Architecture Presenter |
| "decided before", "precedent", "past discussion" | Precedent Keeper |
| "defend this", "argue for", "advocate" | Path Defender |

### Process
| Trigger Phrase | Route To |
|----------------|----------|
| "scope creep", "off topic", "refocus" | Chair |
| "document this", "capture this" | Scribe |
| "how will users", "user experience" | End User Advocate |
| "customer onboarding", "implementation" | Implementation Consultant |

---

## Artifact-Based Routing

When specific artifact types are produced, trigger additional routing:

| Artifact Type | Auto-Route To | Reason |
|---------------|---------------|--------|
| **Gap identified** | Scribe | Capture in gaps.md |
| **Conflict/disagreement** | Path Defender, Chair | Mediation needed |
| **Implementation question** | Code Fidelity Auditor | Verify against code |
| **New pattern proposed** | Standards Enforcer, Sync Architect | Pattern review |
| **Provider-specific concern** | Relevant Provider Expert | Domain validation |
| **User impact identified** | End User Advocate | UX review |

---

## State-Based Routing

Default routing based on session state:

| Session State | Default Routing | Notes |
|---------------|-----------------|-------|
| `AWAITING_INTAKE` | Intake Coordinator | Begin preparation |
| `INTAKE_PREPARED` | Chair | Convene meeting |
| `MEETING_ACTIVE` | Per pending handoffs | Normal flow |
| `AWAITING_HUMAN` | (wait) | Paused for human |
| `CONVERGING` | Chair + any dissenters | Final resolution |
| `DECISION_PENDING` | (wait for human) | Ready for sign-off |

---

## Parallel vs. Sequential Routing

### Route in Parallel When:
- Multiple perspectives are **independent** (don't depend on each other's output)
- Time efficiency matters
- Broad coverage is needed

Example:
```
New sync handler proposed → Route in parallel:
├── Sync Architect (structure)
├── Data Mapping Specialist (transformations)
├── NetSuite Domain Expert (provider quirks)
└── Standards Enforcer (patterns)
```

### Route Sequentially When:
- One member's output is needed before another can contribute
- A decision must be made before proceeding
- Deep expertise chain is required

Example:
```
"Is this the right pattern?" 
→ Standards Enforcer first
→ Then Sync Architect (with Standards Enforcer context)
→ Then Path Defender (to argue if disagreement)
```

---

## Handoff Priority

When multiple handoffs are pending, prioritize:

1. **Blocking items** — Things that prevent other work (conflicts, missing context)
2. **Domain expertise** — Provider or business context needed to proceed
3. **Technical review** — Architectural, pattern, or implementation concerns
4. **Documentation** — Capturing findings and decisions
5. **Peripheral concerns** — Nice-to-have perspectives

---

## Human Checkpoint Triggers

Route to human (pause the committee) when:

| Trigger | Checkpoint Type |
|---------|-----------------|
| 5+ turns since last human input | Direction Check |
| Unresolved conflict after Path Defender attempt | Conflict Resolution |
| Member explicitly says "human needed" | Explicit Request |
| Scope expansion proposed | Scope Decision |
| Committee has formed recommendation | Decision Gate |
| Major finding that changes direction | Direction Check |

---

## Routing Examples

### Example 1: Initial Review
```
Human: "Review the new vendor sync handler"

Intake Coordinator prepares materials
→ Chair convenes, sets agenda: "Review vendor sync handler"
→ Routes in parallel:
   ├── Sync Architect
   ├── Data Mapping Specialist
   ├── NetSuite Domain Expert (vendor is NS-specific concern)
   └── Accounts Payable Expert (vendors are AP domain)
```

### Example 2: Conflict Emerges
```
Sync Architect: "This should use batch upsert"
NetSuite Domain Expert: "NetSuite's batch API has a 200-record limit and is unreliable"

→ Conflict detected
→ Routes to: Path Defender (mediate)
→ If unresolved: Routes to Chair + Human checkpoint
```

### Example 3: Deep Dive Requested
```
Chair: "Let's focus specifically on how custom dimensions sync"

→ Routes to dimension experts:
   ├── GL & Chart of Accounts Expert
   ├── NetSuite Domain Expert
   ├── Data Mapping Specialist
   └── Multi-ERP Generalist
→ Other pending handoffs paused until deep dive completes
```

