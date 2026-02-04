# /cc-duplication

> **Focused review for code duplication (DRY) issues only.**

---

## Activation

When `/cc-duplication` is invoked, activate a focused review with:

- **U006** - Duplication Reviewer (primary)
- **S001** - Elixir Idioms Reviewer (for when macros/protocols apply)
- **S002** - JavaScript Idioms Reviewer (for hooks/generics)
- **C001** - Pragmatism Critic (important - challenges over-abstraction)
- **C002** - Consistency Critic
- **L001** - Moderator

---

## Scope

### What We Check
- Copy-paste code
- Repeated patterns
- Duplicated constants
- Similar logic that could be parameterized
- Opportunities for abstraction

### What We Skip
- Naming issues
- Function size
- Error handling
- Test structure
- Architecture boundaries

---

## Important Note

**Not all duplication is bad.** The Pragmatism Critic plays a key role in this review to challenge abstractions that add more complexity than they remove.

---

## First Response

```
[CLEAN CODE REVIEW - DUPLICATION FOCUS]

Activating focused duplication review.

**Reviewer**: Duplication Reviewer
**Specialists**: [Elixir Idioms | JavaScript Idioms | Both]
**Critics**: Pragmatism (key role), Consistency

What code would you like me to review for duplication?
___
```

---

## Output Format

```
---
### Duplication Reviewer — Focused Review

*[Activating Duplication Reviewer]*

**Focus**: Code duplication (DRY) only

**Findings**:

[Findings in standard format, duplication issues only]

---

### Pragmatism Critic — Review

*[Checking if abstractions are worth it...]*

[Challenges to over-abstraction]

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

See `knowledge_base/shared_rubric.md` Section 4 (Duplication) for principles.
