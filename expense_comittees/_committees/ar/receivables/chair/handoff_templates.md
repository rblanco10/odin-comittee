# Handoff Templates

> **For**: Chair - Dr. Alexandra Chen  
> **Purpose**: Standard templates for handoffs within committee and to Agentic system

---

## Internal Handoff Template

When yielding to another member during session:

```markdown
---
**[Current Speaker Name]** ([Role])

[Substantive contribution]

**Handoff**: I yield to **[Next Speaker Name]** ([Role]) to address [specific topic].

---
```

### Example:

```markdown
---
**Jonathan Blake** (Receivables Expert)

I've identified that the receivable sync currently uses a polling approach 
with a 5-minute interval. The sync_status field tracks whether the receivable 
is pending, synced, or failed.

**Handoff**: I yield to **Dr. Victor Kozlov** (Legacy Alignment Adversary) to 
verify this approach matches the Loopback2 expectations.

---
```

---

## Subcommittee Handoff Template

When routing a topic to a subcommittee:

```markdown
## Subcommittee Referral

**From**: Full Committee Session [Session ID]
**To**: [Subcommittee Code] - [Subcommittee Name]
**Date**: [Date]

### Topic for Investigation
[Description of what the subcommittee should investigate]

### Context
[Relevant background from the full committee discussion]

### Questions to Answer
1. [Specific question 1]
2. [Specific question 2]
3. [Specific question 3]

### Constitutional Considerations
- [ ] Legacy compatibility implications
- [ ] Performance budget implications
- [ ] Tenant isolation implications

### Expected Output
[What the subcommittee should produce]

### Timeline
[When the full committee needs the response]

### Assigned Members
| Member | Role |
|--------|------|
| [SC Lead] | Lead |
| [Member 2] | [Role] |
| [Critic] | Challenger |
```

---

## Agentic System Handoff Template

**CRITICAL**: This is the bridge document between Committee deliberation and Agentic implementation.

```markdown
# Implementation Handoff Document

> **Document Type**: Committee-to-Agentic Bridge  
> **Generated**: [Timestamp]  
> **Status**: READY FOR IMPLEMENTATION

---

## Session Reference

- **Session ID**: [YYYY-MM-DD_NNN_session-code]
- **Committee Decision**: [Link to decisions.md#decision-XXX]
- **Approved By**: [Vote count and result]
- **Human Director**: [Approved/Not Required]

---

## Implementation Specification

### Objective
[One sentence - what must be built]

### Success Criteria (from Committee)
- [ ] Criterion 1 (testable)
- [ ] Criterion 2 (testable)
- [ ] Criterion 3 (testable)

### Architectural Decisions (BINDING)

These decisions were made by the committee and are BINDING on implementation:

| Decision | Rationale | Challenger Response |
|----------|-----------|---------------------|
| [Decision 1] | [Why] | [How critic concern was addressed] |
| [Decision 2] | [Why] | [How critic concern was addressed] |

---

## Constitutional Requirements (NON-NEGOTIABLE)

### Legacy Alignment
- [ ] Records MUST be readable by Loopback2
- [ ] Column names MUST use camelCase via `source:` option
- [ ] Status values MUST match legacy format

📎 Legacy Reference: `roadrunner_samples/[file].js`

| Legacy Behavior | Must Match | Evidence |
|-----------------|------------|----------|
| [behavior 1] | Yes | line:XX |
| [behavior 2] | Yes | line:XX |

### Financial Data
- [ ] All money fields use Decimal, never Float
- [ ] Decimal arithmetic for calculations

### Tenant Isolation
- [ ] All queries include tenant (owner_id or workspace_id)
- [ ] No cross-tenant data access possible

### State Machine
- [ ] States: created, active, inactive only
- [ ] Transitions follow standard pattern
- [ ] No "removed" status

### Performance Budget
| Operation | Target | Max Queries |
|-----------|--------|-------------|
| [operation 1] | <Xms | N |
| [operation 2] | <Xms | N |

---

## Scope

### In Scope
- [Item 1]
- [Item 2]
- [Item 3]

### Out of Scope (DO NOT IMPLEMENT)
- [Item 1] - [Reason]
- [Item 2] - [Reason]

---

## Handoff to Agentic System

- **Target Lifecycle**: `docs/agents/architecture/lifecycles/[lifecycle]/`
- **Assigned Gaps**: GAP-XXX, GAP-YYY
- **Agentic Entry Point**: `/arch-manager`
- **Domain**: Classic (MySQL) | Ember (PostgreSQL)

### Files Likely Affected
```
lib/flame_ps_ar/classic/[domain]/resources/[resource].ex
lib/flame_ps_ar/classic/[domain]/services/[service].ex
lib/flame_ps_ar/classic/[domain]/reactors/[reactor].ex
```

---

## Ratification Requirements

Upon implementation completion:

1. **Coder** updates `implementation_log.md` with:
   - Files changed (with line numbers)
   - Tests added (if any)
   - Evidence of constitutional compliance

2. **Gapper** produces gap report checking:
   - Legacy alignment verification
   - Performance budget compliance
   - State machine consistency

3. **Committee** schedules Ratification Session:
   - Subcommittee: [SC##]
   - Required Critics: [List]
   - Expected Duration: [Time]

4. **Ratification Vote**:
   - Approval: Implementation accepted
   - Rejection: Returns to Agentic with feedback

---

## Committee Sign-Off

| Role | Name | Signature |
|------|------|-----------|
| Chair | Dr. Alexandra Chen | ✅ |
| Parliamentarian | Judge Helena Thornton | ✅ Constitutional compliance verified |
| Primary Critic | [Name] | ✅ Concerns addressed |
| Domain Expert | [Name] | ✅ Requirements accurate |

---

*This handoff document is the authoritative specification for implementation.*
```

---

## Ratification Feedback Template

When implementation is rejected during ratification:

```markdown
# Ratification Feedback

> **Handoff ID**: [Original handoff ID]  
> **Ratification Session**: [Session ID]  
> **Result**: REJECTED - REQUIRES REVISION

---

## Issues Identified

### Issue 1: [Title]
**Raised by**: [Critic Name] ([Role])
**Severity**: Critical / High / Medium

**Description**:
[What is wrong]

**Evidence**:
📎 File: `path/to/file.ex`
📎 Lines: XX-YY

**Required Fix**:
[What needs to change]

### Issue 2: [Title]
...

---

## Constitutional Violations (if any)

| Rule | Violation | Required Fix |
|------|-----------|--------------|
| [Rule] | [What violated] | [How to fix] |

---

## Next Steps

1. Address all issues above
2. Update `implementation_log.md` with fixes
3. Request re-ratification via Chair
4. Committee will schedule follow-up ratification

---

## Timeline

**Expected Fix Duration**: [Estimate]
**Re-Ratification Target**: [Date]
```

---

## Human Director Escalation Template

When escalating to Human Director:

```markdown
# Human Director Escalation

> **From**: AR Receivables Committee  
> **Session**: [Session ID]  
> **Urgency**: High / Medium / Low

---

## Situation

[Brief description of what the committee is deliberating]

## Deadlock/Decision Point

[Why the committee cannot proceed without Human input]

### Position A
**Supported by**: [Members]
**Argument**: [Summary]

### Position B
**Supported by**: [Members]
**Argument**: [Summary]

## Committee Recommendation

[If the committee has a leaning, state it]

## Required Input

[Specific question for Human Director]

## Impact of Decision

| Choice | Impact |
|--------|--------|
| Position A | [Consequences] |
| Position B | [Consequences] |

---

*Awaiting Human Director guidance.*
```

---

*"Clear handoffs prevent dropped balls."*

