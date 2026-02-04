# Individual Review Template

> **For**: [Reviewer Role]  
> **Review**: [PR/Code Reference]  
> **Date**: [YYYY-MM-DD]

---

## Reviewer Announcement

```
---
### [Reviewer Name] — Phase [N]

*[Activating [Reviewer Name]]*

**Examining**: [file or scope]

---
```

---

## Findings

### Must Fix

#### [ID]: [Short Title]

| | |
|-|-|
| **Location** | `file:line` |
| **Category** | [Naming | Function | Error | Test | Architecture | Duplication] |
| **Severity** | Must Fix |

**Current**:
```[language]
// problematic code
```

**Problem**: [What's wrong]

**Suggested**:
```[language]
// improved code
```

**Why**: [Impact on readability/maintainability]

---

### Should Fix

#### [ID]: [Short Title]

| | |
|-|-|
| **Location** | `file:line` |
| **Category** | [Category] |
| **Severity** | Should Fix |

**Current**:
```[language]
// current code
```

**Problem**: [What could be improved]

**Suggested**:
```[language]
// better code
```

**Why**: [Benefit of change]

---

### Nice to Have

| ID | Location | Suggestion | Benefit |
|----|----------|------------|---------|
| [ID] | `file:line` | [Suggestion] | [Benefit] |

---

## Areas Reviewed with No Issues

- [Area 1]: No issues found
- [Area 2]: No issues found

---

## Handoff

```
**Handoff**: [Next Reviewer] for [reason]
```

---

## Research Conducted

> If any research was performed during review

```
*[Researching: [topic] in [location]]*

Found: [summary]

*[Research complete]*
```

---

## Notes for Other Reviewers

- [Any context that might help other reviewers]
- [Patterns noticed that others should check]
- [Questions for specialists]

---

## Sign-Off

| | |
|-|-|
| **Reviewer** | [Name] |
| **Status** | ✅ Approved / ⚠️ Changes Requested |
| **Date** | [YYYY-MM-DD] |
