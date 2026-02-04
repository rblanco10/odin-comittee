# Handoff Templates

> **For**: All Committee Members  
> **Purpose**: Standard templates for member-to-member handoffs

---

## Basic Handoff

```markdown
---
**[CURRENT MEMBER NAME]**: I've completed my analysis of [TOPIC].

**Summary**: [Brief summary of contribution]

**Key Finding**: [Most important point]

**Handoff**: I now yield to **[NEXT MEMBER NAME]**, [Role], who can address [REASON].

---
```

---

## Handoff with Concern

```markdown
---
**[CURRENT MEMBER NAME]**: I've reviewed [TOPIC] and have a concern.

**Finding**: [What you found]

**Concern**: [What worries you]

**Question for Next Member**: [Specific question]

**Handoff**: I yield to **[NEXT MEMBER NAME]**, [Role], to address this concern.

---
```

---

## Handoff to Skeptic

```markdown
---
**[CURRENT MEMBER NAME]**: I've proposed [PROPOSAL].

**Rationale**: [Why this is a good idea]

**Anticipated Challenges**: [What skeptics might raise]

**Handoff**: Before we proceed, I request **[SKEPTIC NAME]**, [Role], 
challenge this proposal.

---
```

---

## Handoff from Skeptic

```markdown
---
**[SKEPTIC NAME]**: I've challenged [PROPOSAL] on [GROUNDS].

**Challenge**: [Specific concern]

**Severity**: [Critical/Significant/Minor]

**Resolution Required**: [What must be addressed]

**Handoff**: I yield back to **[PROPOSER NAME]** to respond, or to 
**[ALTERNATIVE MEMBER]** if they can address this concern.

---
```

---

## Handoff to Research

```markdown
---
**[CURRENT MEMBER NAME]**: We need more information about [TOPIC].

**Unknown**: [What we don't know]

**Impact**: [Why this matters for our decision]

**Handoff**: I request **[RESEARCH LIBRARIAN]** investigate [SPECIFIC QUESTION].

---
```

---

## Handoff from Research

```markdown
---
**[RESEARCH LIBRARIAN]**: Research complete on [TOPIC].

**Search Locations**:
- [File/location 1]
- [File/location 2]

**Findings**:
1. [Finding 1]
2. [Finding 2]

**Relevant Code**:
```elixir
# [file path]
[relevant code snippet]
```

**Handoff**: I yield to **[REQUESTING MEMBER]** to interpret these findings,
or to **[DOMAIN EXPERT]** for technical analysis.

---
```

---

## Handoff to Historian

```markdown
---
**[CURRENT MEMBER NAME]**: This topic may have historical context.

**Question**: [What we need to know about the past]

**Relevance**: [Why history matters here]

**Handoff**: I request **[HISTORIAN NAME]**, [Role], provide historical context.

---
```

---

## Handoff from Historian

```markdown
---
**[HISTORIAN NAME]**: Historical context on [TOPIC].

**Past Sessions**: 
- [Session ID]: [Relevant decision/discussion]

**Past Decisions**:
- [Decision]: [Outcome and rationale]

**Patterns Observed**:
- [Pattern]: [How it applies]

**Caution**: [What we should avoid repeating]

**Handoff**: I yield to **[NEXT MEMBER]** to apply this context.

---
```

---

## Handoff to Chair

```markdown
---
**[CURRENT MEMBER NAME]**: I believe we've reached a decision point.

**Options Before Us**:
1. [Option A]
2. [Option B]

**My Recommendation**: [Which option and why]

**Handoff**: I yield to **Chair** to call for decision or further discussion.

---
```

---

## Handoff to Human Director

```markdown
---
**[CHAIR]**: We require Human Director input.

**Context**: [Brief summary of discussion]

**Decision Needed**: [What we need the human to decide]

**Options**:
1. [Option A]: [Pros/Cons]
2. [Option B]: [Pros/Cons]

**Committee Recommendation**: [If any]

**Handoff**: Human Director, we await your guidance.

---
```

---

## Emergency Handoff

```markdown
---
**[CURRENT MEMBER NAME]**: URGENT - [ISSUE]

**Severity**: [Critical/High]

**Immediate Action Needed**: [What must happen]

**Handoff**: I yield immediately to **[MOST RELEVANT EXPERT]** for emergency response.

---
```

---

## Cross-Subcommittee Handoff

```markdown
---
**[CURRENT MEMBER NAME]** (SC[XX]): This topic crosses into [OTHER DOMAIN].

**Our Perspective**: [What our subcommittee thinks]

**Cross-Cutting Concern**: [What affects the other subcommittee]

**Handoff**: I request **[OTHER SUBCOMMITTEE LEAD]** (SC[YY]) provide their perspective.

---
```

---

## Implementation Handoff

```markdown
---
**[CURRENT MEMBER NAME]**: Design is complete. Ready for implementation.

**Approved Design**: [Summary]

**Implementation Requirements**:
1. [Requirement 1]
2. [Requirement 2]

**Test Requirements**:
1. [Test 1]
2. [Test 2]

**Handoff**: I yield to **[IMPLEMENTER]** to begin implementation, with 
**[QA SPECIALIST]** to define test criteria.

---
```

---

## Session Continuation Handoff

```markdown
---
**[CHAIR]**: Session pausing. Recording state for continuation.

**Current State**: [Where we are]

**Pending Items**:
1. [Item 1]
2. [Item 2]

**Next Speaker on Resume**: **[MEMBER NAME]** to address [TOPIC]

**Handoff**: Session Clerk, please record state. Continuity Officer, 
prepare for session resume.

---
```

---

## Observability-Specific Handoffs

### Handoff for Log Pattern Review

```markdown
---
**[LOGGING EXPERT]**: I've proposed a logging pattern.

**Pattern**:
```elixir
Logger.info("expense_submitted", %{
  expense_id: expense.id,
  amount: expense.amount,
  correlation_id: correlation_id
})
```

**Rationale**: [Why this pattern]

**Handoff**: I yield to **Structured Logging Purist** to validate structure,
then to **Performance Paranoid** to assess overhead.

---
```

### Handoff for Metric Design Review

```markdown
---
**[METRICS EXPERT]**: I've proposed a new metric.

**Metric**:
```
expense_submission_duration_seconds{
  workspace_id="...",
  status="success|failure"
}
```

**Type**: Histogram
**Labels**: workspace_id, status

**Handoff**: I yield to **Cardinality Guardian** to assess label cardinality,
then to **Cost Hawk** to assess storage impact.

---
```

### Handoff for Dashboard Review

```markdown
---
**[DASHBOARD EXPERT]**: I've designed a dashboard panel.

**Panel**: [Description]
**Query**: [PromQL/LogQL]
**Purpose**: [What question it answers]

**Handoff**: I yield to **Dashboard Clutter Critic** to assess necessity,
then to **Dashboard Performance Optimizer** to assess query cost.

---
```

---

*"Clear handoffs prevent dropped context and ensure continuity."*

