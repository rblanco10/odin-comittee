# Committee Tools

> **Purpose**: Structured checklists and calculators for committee operations  
> **Inspired by**: [ChatDev](https://github.com/OpenBMB/ChatDev) functions/tools pattern

---

## Overview

Tools are structured aids that help committee members perform their duties consistently. Unlike workflows (which define processes), tools are utilities invoked within workflows.

---

## Available Tools

| Tool | Purpose | Primary Users |
|------|---------|---------------|
| `legacy_compatibility_checker.md` | Verify Loopback2/MySQL compatibility | C001, IS004, TS004 |
| `performance_budget_calculator.md` | Check against performance budgets | C002, QA003 |
| `handoff_validator.md` | Validate handoff document completeness | L001, L003 |

---

## Tool vs. Workflow

| Aspect | Tool | Workflow |
|--------|------|----------|
| **Scope** | Single task | Multi-phase process |
| **Duration** | Minutes | Session-length |
| **Output** | Checklist/calculation | Decision/handoff |
| **Invocation** | By individual member | By Chair |

---

## Usage Pattern

During a workflow phase:

```
1. Member identifies need for tool
2. Member announces: "I will use the [Tool Name] tool"
3. Member works through checklist
4. Member reports findings to committee
```

---

## Tool Output Format

All tools produce structured output:

```markdown
## Tool: [Name]
**Run By**: [Member ID and Name]
**Run Date**: [Date]
**Target**: [What was checked]

### Results
[Tool-specific results]

### Verdict
[ ] PASS - All checks passed
[ ] FAIL - Issues identified (see below)
[ ] WARN - Passed with warnings

### Issues (if any)
1. [Issue 1]
2. [Issue 2]
```

---

## Creating New Tools

New tools should be created when:
1. A check is performed repeatedly in multiple workflows
2. Consistency is critical (constitutional checks)
3. Calculation is complex enough to warrant documentation

Tool template:
```markdown
# Tool: [Name]

## Purpose
[One sentence description]

## When to Use
[Triggers for using this tool]

## Checklist
- [ ] Check 1
- [ ] Check 2

## Output Format
[How to report results]
```

---

*"Good tools make good decisions easier."*

