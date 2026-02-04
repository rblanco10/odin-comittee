# Session Decisions

> **Session**: {{SESSION_CODE}}  
> **Date**: {{DATE}}

---

## Decisions Made

### Decision 1: {{DECISION_TITLE}}

**Status**: {{DECISION_STATUS}}  
**Type**: {{DECISION_TYPE}}

**Description**:
{{DECISION_DESCRIPTION}}

**Rationale**:
{{DECISION_RATIONALE}}

**Vote**:
- In Favor: {{IN_FAVOR_COUNT}}
- Opposed: {{OPPOSED_COUNT}}
- Abstained: {{ABSTAINED_COUNT}}

{{#IF_DISSENT}}
**Dissenting Opinion** ({{DISSENTER_NAME}}):
> {{DISSENT_TEXT}}
{{/IF_DISSENT}}

**Implementation**:
{{IMPLEMENTATION_NOTES}}

---

### Decision 2: ...

---

## Deferred Decisions

| Decision | Reason | Deferred To |
|----------|--------|-------------|
{{DEFERRED_DECISIONS_TABLE}}

---

## Human Director Overrides

{{#IF_OVERRIDES}}
### Override: {{OVERRIDE_TITLE}}

**Original Decision**: {{ORIGINAL_DECISION}}  
**Override Reason**: {{OVERRIDE_REASON}}  
**Recorded**: Per Governance Article V, Section 5.3
{{/IF_OVERRIDES}}

{{#IF_NO_OVERRIDES}}
*No overrides in this session.*
{{/IF_NO_OVERRIDES}}
