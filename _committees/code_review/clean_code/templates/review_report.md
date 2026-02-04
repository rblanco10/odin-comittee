# Clean Code Review Report

**PR**: [Title] (#[Number])  
**Author**: [Name]  
**Date**: [YYYY-MM-DD]  
**Languages**: [Elixir | JavaScript | TypeScript | Mixed]

---

## Summary

| | |
|-|-|
| **Verdict** | ✅ APPROVED / ⚠️ CHANGES REQUESTED / ❌ BLOCKED |
| **Must Fix** | [count] |
| **Should Fix** | [count] |
| **Nice to Have** | [count] |

**Overview**: [2-3 sentences on code quality and main findings]

---

## Strengths

> What this PR does well (required section)

- [Positive observation 1]
- [Positive observation 2]
- [Positive observation 3]

---

## Must Fix

> These issues must be addressed before approval. They represent bugs, 
> significant maintainability problems, or violations that will cause issues.

### MF-001: [Short title]

| | |
|-|-|
| **Location** | `path/to/file.ex:42` |
| **Reviewer** | [Reviewer Name] |
| **Category** | [Naming | Function | Error Handling | Test | Architecture | Duplication] |

**Current Code**:
```[language]
// problematic code here
```

**Problem**: [Clear explanation of what's wrong]

**Suggested Fix**:
```[language]
// improved code here
```

**Why This Matters**: [Explanation of impact on readability/maintainability]

---

### MF-002: [Next issue...]

[Same format]

---

## Should Fix

> These issues should be addressed to improve code quality. They represent 
> Clean Code violations that hurt maintainability but aren't blocking.

### SF-001: [Short title]

| | |
|-|-|
| **Location** | `path/to/file.ts:15-28` |
| **Reviewer** | [Reviewer Name] |
| **Category** | [Category] |

**Current Code**:
```[language]
// current approach
```

**Problem**: [What could be improved]

**Suggested Fix**:
```[language]
// cleaner approach
```

**Why This Matters**: [Benefit of making this change]

---

## Nice to Have

> Optional improvements that would polish the code. Address if time permits.

| ID | Location | Suggestion | Benefit |
|----|----------|------------|---------|
| NH-001 | `file.ex:100` | [Brief suggestion] | [Brief benefit] |
| NH-002 | `file.js:50` | [Brief suggestion] | [Brief benefit] |
| NH-003 | `file.ts:75` | [Brief suggestion] | [Brief benefit] |

---

## Overrides Applied

> Where language specialists or critics overrode universal findings

### Override 1

| | |
|-|-|
| **Original Finding** | [What universal reviewer said] |
| **Override By** | [Elixir Idioms / JavaScript Idioms / Pragmatism Critic / Consistency Critic] |
| **New Recommendation** | [What we're recommending instead] |
| **Reason** | [Why the override applies] |

---

## Conflicts Resolved

> Any disagreements between reviewers and how they were resolved

[If none: "No conflicts arose during this review."]

[If any:]

### Conflict 1

| | |
|-|-|
| **Between** | [Reviewer A] vs [Reviewer B] |
| **Issue** | [What they disagreed about] |
| **Resolution** | [What was decided] |
| **Reasoning** | [Why this resolution] |

---

## Reviewer Sign-Off

### Universal Reviewers

| Reviewer | Status |
|----------|--------|
| Naming & Readability | ✅ Approved / ⚠️ Changes Requested |
| Function & Complexity | ✅ Approved / ⚠️ Changes Requested |
| Error Handling | ✅ Approved / ⚠️ Changes Requested |
| Test Quality | ✅ Approved / ⚠️ Changes Requested |
| Architecture Boundaries | ✅ Approved / ⚠️ Changes Requested |
| Duplication | ✅ Approved / ⚠️ Changes Requested |

### Language Specialists

| Specialist | Status |
|------------|--------|
| Elixir Idioms | ✅ Approved / ⚠️ Changes Requested / N/A |
| JavaScript Idioms | ✅ Approved / ⚠️ Changes Requested / N/A |

### Critics

| Critic | Concerns Raised |
|--------|-----------------|
| Pragmatism Critic | None / [List concerns] |
| Consistency Critic | None / [List concerns] |

### Final Approval

| | |
|-|-|
| **Moderator** | [Name] |
| **Decision** | ✅ APPROVED / ⚠️ CHANGES REQUESTED / ❌ BLOCKED |
| **Date** | [YYYY-MM-DD] |

---

## Author Response Section

> To be completed by the code author

| ID | Finding | Response | Notes |
|----|---------|----------|-------|
| MF-001 | [Title] | ✅ Fixed / ❌ Declined / 💬 Discuss | [Author notes] |
| MF-002 | [Title] | ✅ Fixed / ❌ Declined / 💬 Discuss | [Author notes] |
| SF-001 | [Title] | ✅ Fixed / ❌ Declined / 💬 Discuss | [Author notes] |

---

## Review History

| Date | Action | By |
|------|--------|-----|
| [Date] | Initial review completed | Moderator |
| [Date] | Author response received | [Author] |
| [Date] | Re-review completed | [Reviewers] |
| [Date] | Final approval | Moderator |

---

*This review was conducted by the Clean Code Review Committee following 
Clean Code principles adapted for [Elixir/JavaScript/TypeScript] idioms.*
