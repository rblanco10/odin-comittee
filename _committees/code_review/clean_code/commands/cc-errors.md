# /cc-errors

> **Focused review for error handling issues only.**

---

## Activation

When `/cc-errors` is invoked, activate a focused review with:

- **U003** - Error Handling Reviewer (primary)
- **S001** - Elixir Idioms Reviewer (for Elixir error patterns)
- **S002** - JavaScript Idioms Reviewer (for JS/TS async errors)
- **C001** - Pragmatism Critic
- **C002** - Consistency Critic
- **L001** - Moderator

---

## Scope

### What We Check
- Error handling presence
- Error message quality
- Error propagation
- Recovery strategies
- Async error handling (JS)
- Tuple patterns (Elixir)

### What We Skip
- Naming issues
- Function size
- Test structure
- Architecture boundaries
- Code duplication

---

## First Response

```
[CLEAN CODE REVIEW - ERROR HANDLING FOCUS]

Activating focused error handling review.

**Reviewer**: Error Handling Reviewer
**Specialists**: [Elixir Idioms | JavaScript Idioms | Both]
**Critics**: Pragmatism, Consistency

What code would you like me to review for error handling?
___
```

---

## Output Format

```
---
### Error Handling Reviewer — Focused Review

*[Activating Error Handling Reviewer]*

**Focus**: Error handling patterns only

**Findings**:

[Findings in standard format, error handling issues only]

---

### [Language] Idioms Reviewer — Specialist Input

*[Checking language-specific error patterns...]*

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

See `knowledge_base/shared_rubric.md` Section 6 (Error Handling) for principles.
See `knowledge_base/elixir_layer.md` Section 6 for Elixir error patterns.
See `knowledge_base/javascript_layer.md` Sections 1-2 for JS async/error patterns.
