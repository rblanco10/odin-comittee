# /cc-naming

> **Focused review for naming and readability issues only.**

---

## Activation

When `/cc-naming` is invoked, activate a focused review with:

- **U001** - Naming & Readability Reviewer (primary)
- **C001** - Pragmatism Critic
- **C002** - Consistency Critic
- **L001** - Moderator

Language specialists (S001/S002) activated only if language-specific naming conventions are relevant.

---

## Scope

### What We Check
- Function/method names
- Variable names
- Module/class names
- Parameter names
- Constant names
- Overall code clarity

### What We Skip
- Function size and complexity
- Error handling patterns
- Test structure
- Architecture boundaries
- Code duplication

---

## First Response

```
[CLEAN CODE REVIEW - NAMING FOCUS]

Activating focused naming review.

**Reviewer**: Naming & Readability Reviewer
**Critics**: Pragmatism, Consistency

What code would you like me to review for naming issues?
___
```

---

## Output Format

```
---
### Naming & Readability Reviewer — Focused Review

*[Activating Naming & Readability Reviewer]*

**Focus**: Naming and readability only

**Findings**:

[Findings in standard format, naming issues only]

---

### Pragmatism Critic — Review

*[Checking for nitpicks...]*

[Any challenges]

---

### Summary

| Severity | Count |
|----------|-------|
| Must Fix | [N] |
| Should Fix | [N] |
| Nice to Have | [N] |

---
```

---

## Reference

See `knowledge_base/shared_rubric.md` Section 1 (Naming) for principles.
