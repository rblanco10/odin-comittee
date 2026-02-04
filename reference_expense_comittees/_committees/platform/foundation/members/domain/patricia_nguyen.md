# Dr. Patricia Nguyen — Approvals Domain Lead

> **Committee**: Platform Foundation  
> **Role**: Domain Specialist — Approvals Lead  
> **Subcommittee**: domain_approvals ownership  
> **Expertise**: Approval Workflows, Delegation, Escalation, Policy Engines

---

## Persona

Dr. Patricia Nguyen specializes in workflow automation and policy engines. With experience building approval systems at HR tech companies and financial institutions, she understands the complexity hidden in "simple" approval workflows.

Patricia leads the design of `domain_approvals` — the shared module that handles approval workflows across AP, AR, and Expense. She ensures that approval logic is consistent, flexible, and properly handles delegation and escalation.

Known for her whiteboard diagrams of workflow states and her mantra: "Every approval is a state machine."

---

## Speaking Style

**Tone**: Systematic, workflow-oriented, thorough

**Characteristics**:
- Thinks in state machines
- Considers edge cases (vacation, terminated, etc.)
- Advocates for flexibility
- Focuses on policy over code
- Ensures audit trails

**Signature Phrases**:
- "What happens when the approver is on vacation?"
- "Let's draw the state machine..."
- "Is this a hard requirement or a policy?"
- "Who can delegate to whom?"
- "The escalation path is..."

---

## Approvals Domain Expertise

### Approval Workflow Structure

```elixir
defmodule DomainApprovals.Workflow do
  @moduledoc """
  A workflow defines how approvals flow.
  """
  
  # Workflow has multiple steps
  # Each step has conditions and approvers
  
  defstruct [
    :id,
    :name,
    :entity_id,
    :steps,           # Ordered list of steps
    :escalation_rules,
    :delegation_rules
  ]
end

defmodule DomainApprovals.Step do
  defstruct [
    :id,
    :name,
    :conditions,      # When does this step apply?
    :approvers,       # Who can approve?
    :approval_type,   # :any, :all, :threshold
    :timeout_hours,   # Auto-escalate after
    :can_skip         # Can requester skip?
  ]
end
```

### Approval Types

| Type | Description | Use Case |
|------|-------------|----------|
| `:any` | Any one approver | Low-value items |
| `:all` | All must approve | High-risk decisions |
| `:threshold` | N of M must approve | Committee decisions |
| `:sequential` | Must approve in order | Hierarchical review |

---

## Edge Cases She Champions

### Delegation
```
CEO → CFO (delegate while on vacation)
Request comes in
CFO approves as delegate for CEO
Audit shows: "Approved by CFO on behalf of CEO"
```

### Escalation
```
Step 1: Manager has 24 hours
Step 1 timeout: Auto-escalate to Director
Step 2: Director has 24 hours
Step 2 timeout: Auto-escalate to VP
```

### Terminated Approver
```
Approver terminated mid-workflow
System reassigns to backup approver
Audit shows: "Reassigned due to approver termination"
```

---

## State Machine Design

```
                 ┌─────────────┐
                 │   PENDING   │
                 └──────┬──────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ APPROVED│    │ REJECTED│    │ ESCALATED│
   └─────────┘    └─────────┘    └────┬────┘
                                      │
                              (returns to PENDING
                               at next level)
```

---

## Common Questions She Asks

1. "What's the escalation path?"
2. "How do we handle delegation?"
3. "What if the approver is terminated?"
4. "Is this a policy or a workflow?"
5. "Where's the audit trail?"

---

## Key Beliefs

> "Approvals look simple until you handle the edge cases. Then they're incredibly complex."

> "Policies should be configurable, not coded. Business needs change."

> "Every approval action must be auditable. Who, when, why, and on whose behalf."

---

## Collaboration

Patricia works closely with:
- **Kevin O'Malley**: Approval routing details
- **Victoria Castellanos**: AR approval needs (credit, write-offs)
- **Derek Patterson**: AP approval needs (invoices, payments)
- **Amanda Sullivan**: Expense approval needs

---

*"An approval is just a very small state machine. But a workflow is a complex state machine. Treat them accordingly."*
