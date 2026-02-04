# Tool: Handoff Validator

> **Primary Users**: L001 (Chair), L003 (Parliamentarian)  
> **Workflow**: Implementation Handoff

---

## Purpose

Validate that a handoff document is complete and ready for the Agentic system.

---

## When to Use

- Before signing off on a handoff document
- During handoff generation workflow
- Before invoking `/arch-manager` bridge

---

## Completeness Checklist

### 1. Session Reference (Required)

- [ ] Session ID present and valid format
- [ ] Committee decision reference present
- [ ] Vote count recorded
- [ ] Date recorded

```
Session ID: _____________
Decision Ref: _____________
Approved: ___ for / ___ against
```

### 2. Implementation Specification (Required)

- [ ] Objective is one clear sentence
- [ ] Success criteria are present
- [ ] All criteria are testable (can write a test for each)
- [ ] At least 3 success criteria

```
Objective: _____________
Criteria Count: _______
All Testable: [ ] Yes [ ] No
```

### 3. Architectural Decisions (Required)

- [ ] Table has at least one row
- [ ] Each decision has rationale
- [ ] Challenger responses documented (if challenged)

| Decision | Has Rationale? | Has Challenger Response? |
|----------|----------------|--------------------------|
| | [ ] | [ ] |
| | [ ] | [ ] |

### 4. Legacy Alignment (If Classic Domain)

- [ ] Legacy reference file specified
- [ ] Behavior table present
- [ ] Evidence column has line numbers

```
Legacy File: _____________
Behaviors Documented: [ ] Yes [ ] N/A (not Classic domain)
```

### 5. Out of Scope (Required)

- [ ] Out of scope section present
- [ ] At least one item listed (or explicit "None")
- [ ] Items are specific, not vague

```
Out of Scope Items: _______
```

### 6. Performance Budget (Required)

- [ ] Budget table present
- [ ] Target times specified
- [ ] Max queries specified

| Operation | Target Present? | Queries Present? |
|-----------|-----------------|------------------|
| | [ ] | [ ] |
| | [ ] | [ ] |

### 7. Handoff Routing (Required)

- [ ] Target lifecycle specified
- [ ] Lifecycle path is valid
- [ ] Gap references listed (if applicable)
- [ ] Entry point specified

```
Target Lifecycle: _____________
Entry Point: _____________
Gap References: _____________
```

### 8. Ratification Requirements (Required)

- [ ] Evidence requirements listed
- [ ] Reviewers identified
- [ ] Timeline specified (if applicable)

---

## Constitutional Compliance Check

**Parliamentarian must verify:**

### Rule 1: Legacy Compatibility First

- [ ] Legacy requirements section present (if Classic domain)
- [ ] OR marked N/A for Ash-native features

### Rule 2: Decimal for Money

- [ ] If financial fields involved, Decimal requirement stated
- [ ] OR no financial fields in this handoff

### Rule 3: Tenant Isolation

- [ ] Tenant isolation requirement stated
- [ ] owner_id or workspace_id specified

### Rule 4: State Machine Consistency

- [ ] If status field involved, valid transitions listed
- [ ] No "removed" status mentioned

### Rule 5: Performance Budget

- [ ] Performance budget section present
- [ ] Budgets are constitutional-compliant

---

## Schema Validation

Cross-reference with `schemas/handoff.schema.yaml`:

- [ ] All required fields present
- [ ] Field formats correct
- [ ] No unknown fields

---

## Output Template

```markdown
## Tool: Handoff Validator
**Run By**: [Member ID and Name]
**Run Date**: [Date]
**Target**: [Handoff ID]

### Completeness
- Session Reference: [ ] Complete [ ] Incomplete
- Implementation Spec: [ ] Complete [ ] Incomplete
- Architectural Decisions: [ ] Complete [ ] Incomplete
- Legacy Alignment: [ ] Complete [ ] N/A
- Out of Scope: [ ] Complete [ ] Incomplete
- Performance Budget: [ ] Complete [ ] Incomplete
- Handoff Routing: [ ] Complete [ ] Incomplete
- Ratification Req: [ ] Complete [ ] Incomplete

### Constitutional Compliance
- Legacy Compatibility: [ ] PASS [ ] FAIL [ ] N/A
- Decimal for Money: [ ] PASS [ ] FAIL [ ] N/A
- Tenant Isolation: [ ] PASS [ ] FAIL
- State Machine: [ ] PASS [ ] FAIL [ ] N/A
- Performance Budget: [ ] PASS [ ] FAIL

### Verdict
[ ] VALID - Ready for Agentic system
[ ] INVALID - Issues must be resolved (see below)

### Issues
1. [Issue description]
2. [Issue description]

### Missing Elements
1. [Missing element]
```

---

## Failure Handling

If validation fails:

1. Return to Specification Writing phase
2. Chair assigns corrections to appropriate member
3. Re-run validation after corrections
4. Do NOT sign off until VALID

---

## Quick Validation Commands

For Chair during session:

```
"Parliamentarian, please validate this handoff document."
"Research Clerk, verify the legacy references are accurate."
"Domain Expert, confirm the success criteria are testable."
```

---

*"A valid handoff is the bridge between deliberation and implementation."*

