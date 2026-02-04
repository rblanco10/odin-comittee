# /cc-functions

> **Focused review for function size and complexity issues only.**

---

## Activation

When `/cc-functions` is invoked, activate a focused review with:

- **U002** - Function & Complexity Reviewer (primary)
- **C001** - Pragmatism Critic
- **C002** - Consistency Critic
- **L001** - Moderator

Language specialists (S001/S002) activated for pipeline length (Elixir) or async structure (JS).

---

## Scope

### What We Check
- Function length
- Single responsibility
- Argument count
- Nesting depth
- Abstraction levels
- Cyclomatic complexity

### What We Skip
- Naming issues
- Error handling patterns
- Test structure
- Architecture boundaries
- Code duplication

---

## First Response

```
[CLEAN CODE REVIEW - FUNCTION FOCUS]

Activating focused function complexity review.

**Reviewer**: Function & Complexity Reviewer
**Critics**: Pragmatism, Consistency

What code would you like me to review for function complexity?
___
```

---

## Output Format

```
---
### Function & Complexity Reviewer — Focused Review

*[Activating Function & Complexity Reviewer]*

**Focus**: Function size and complexity only

**Findings**:

[Findings in standard format, function issues only]

---

### Pragmatism Critic — Review

*[Checking for impractical suggestions...]*

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

See `knowledge_base/shared_rubric.md` Sections 2-3 (Function Size, SRP) for principles.
