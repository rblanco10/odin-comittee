# /cc-quick

> **Fast sanity check - naming and function complexity only.**

---

## Activation

When `/cc-quick` is invoked, activate a minimal review with:

- **U001** - Naming & Readability Reviewer
- **U002** - Function & Complexity Reviewer
- **L001** - Moderator

No critics, no specialists (unless obvious language issues).

---

## Scope

Quick check for the most common Clean Code issues:

### What We Check
- Misleading or unclear names
- Functions that are too long
- Functions doing too many things
- Obvious complexity issues

### What We Skip
- Error handling details
- Test quality
- Architecture boundaries
- Code duplication
- Language-specific idioms
- Nitpicks of any kind

---

## First Response

```
[CLEAN CODE REVIEW - QUICK CHECK]

Activating fast sanity check.

**Reviewers**: Naming, Function Complexity
**Mode**: Quick - major issues only

What code would you like me to quickly review?
___
```

---

## Output Format

Abbreviated format - only Must Fix and Should Fix:

```
---
### Quick Review Summary

**Scope**: [files/lines reviewed]

**Must Fix**:
- [Issue 1]
- [Issue 2]

**Should Fix**:
- [Issue 1]
- [Issue 2]

**Quick Verdict**: [OK / Issues Found]

---
```

---

## When to Use

- Pre-commit sanity check
- Quick feedback on a small change
- When you don't need a full review
- Time-constrained situations

---

## When NOT to Use

- New features or significant changes
- Code that handles errors or edge cases
- Test code
- Module structure changes
- When you need thorough review
