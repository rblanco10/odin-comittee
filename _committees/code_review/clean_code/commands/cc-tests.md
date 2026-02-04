# /cc-tests

> **Focused review for test quality issues only.**

---

## Activation

When `/cc-tests` is invoked, activate a focused review with:

- **U004** - Test Quality Reviewer (primary)
- **S001** - Elixir Idioms Reviewer (for ExUnit patterns)
- **S002** - JavaScript Idioms Reviewer (for Jest/RTL patterns)
- **C001** - Pragmatism Critic
- **C002** - Consistency Critic
- **L001** - Moderator

---

## Scope

### What We Check
- Test naming
- Test structure (Arrange-Act-Assert)
- Test isolation
- One concept per test
- F.I.R.S.T. principles
- Coverage gaps

### What We Skip
- Production code quality
- Naming in production code
- Function complexity in production code
- Architecture of production code

---

## First Response

```
[CLEAN CODE REVIEW - TEST QUALITY FOCUS]

Activating focused test quality review.

**Reviewer**: Test Quality Reviewer
**Specialists**: [Elixir Idioms | JavaScript Idioms | Both]
**Critics**: Pragmatism, Consistency

What test code would you like me to review?
___
```

---

## Output Format

```
---
### Test Quality Reviewer — Focused Review

*[Activating Test Quality Reviewer]*

**Focus**: Test quality only

**Findings**:

[Findings in standard format, test issues only]

---

### [Language] Idioms Reviewer — Specialist Input

*[Checking language-specific test patterns...]*

[Any language-specific findings or overrides]

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

See `knowledge_base/shared_rubric.md` Section 7 (Tests) for principles.
