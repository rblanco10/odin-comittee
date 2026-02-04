# Severity Guide

> **Purpose**: Define severity levels and provide examples for consistent classification

---

## Severity Levels

| Level | Definition | Action Required |
|-------|------------|-----------------|
| **Must Fix** | Will cause bugs, significant confusion, or maintenance nightmares | Blocking - must address before approval |
| **Should Fix** | Hurts maintainability but code works | Should address before merge |
| **Nice to Have** | Would polish the code | Optional - address if time permits |

---

## Severity Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEVERITY DECISION TREE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Is it a bug or will it cause bugs?                              │
│  ├── YES → MUST FIX                                              │
│  └── NO ↓                                                        │
│                                                                  │
│  Will a new team member be confused or misled?                   │
│  ├── Significantly → MUST FIX                                    │
│  ├── Somewhat → SHOULD FIX                                       │
│  └── Slightly → NICE TO HAVE                                     │
│                                                                  │
│  Does it violate a core Clean Code principle?                    │
│  ├── Clearly → SHOULD FIX                                        │
│  └── Arguably → NICE TO HAVE                                     │
│                                                                  │
│  Would you actually change this in inherited code?               │
│  ├── Immediately → MUST FIX                                      │
│  ├── When touching the file → SHOULD FIX                         │
│  └── Probably not → DON'T RAISE IT                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Must Fix Examples

### Naming

| Example | Why Must Fix |
|---------|--------------|
| `getUserData()` returns user + orders + preferences | Misleading - name doesn't match behavior |
| `validate()` also saves to database | Hidden side effect - will cause bugs |
| `x`, `temp`, `data` for important business values | Impossible to understand without context |

### Functions

| Example | Why Must Fix |
|---------|--------------|
| 80-line function doing 5 different things | Unmaintainable, untestable |
| Function with 6 boolean parameters | Impossible to call correctly |
| Deeply nested code (5+ levels) | Cognitive overload |

### Error Handling

| Example | Why Must Fix |
|---------|--------------|
| Empty catch block | Silent failure - bugs go unnoticed |
| Floating promise (no await, no .catch) | Unhandled rejection crashes |
| Returning null to signal error | Caller can't distinguish error from "not found" |

### Architecture

| Example | Why Must Fix |
|---------|--------------|
| Circular dependency | Build/runtime issues |
| God module (1000+ lines, 50+ functions) | Unmaintainable |
| Core business logic depending on UI framework | Wrong dependency direction |

### Tests

| Example | Why Must Fix |
|---------|--------------|
| Test with no assertions | Provides false confidence |
| Test depends on other tests running first | Flaky, unreliable |
| Test that always passes regardless of code | Useless |

---

## Should Fix Examples

### Naming

| Example | Why Should Fix |
|---------|----------------|
| `data`, `info`, `item` without context | Vague, requires reading more code |
| Inconsistent verbs (`get`, `fetch`, `retrieve`) | Cognitive overhead |
| Name slightly inaccurate | Minor confusion |

### Functions

| Example | Why Should Fix |
|---------|----------------|
| 30-line function that could be 15 | Harder to understand than necessary |
| 4 parameters when 2 would work | Harder to use correctly |
| Mixed abstraction levels | Harder to follow |

### Error Handling

| Example | Why Should Fix |
|---------|----------------|
| Generic "Something went wrong" message | Hard to debug |
| Catching too broadly | May hide real issues |
| Inconsistent error patterns | Cognitive overhead |

### Architecture

| Example | Why Should Fix |
|---------|----------------|
| Low cohesion (unrelated functions grouped) | Harder to find things |
| Too much public API | Harder to maintain |
| Missing module documentation | Harder to understand purpose |

### Tests

| Example | Why Should Fix |
|---------|----------------|
| Test testing 5 things | Hard to know what failed |
| Unclear test name | Hard to understand what's tested |
| Complex setup for simple test | Hard to maintain |

---

## Nice to Have Examples

### Naming

| Example | Why Nice to Have |
|---------|------------------|
| `userName` could be `userFullName` | Slightly clearer |
| `process()` could be `processPayment()` | More specific |
| Abbreviation that's clear in context | Minor improvement |

### Functions

| Example | Why Nice to Have |
|---------|------------------|
| 18-line function could be 12 | Minor improvement |
| Could extract one small helper | Minor clarity gain |
| Slightly better parameter order | Minor ergonomics |

### Error Handling

| Example | Why Nice to Have |
|---------|------------------|
| Error message could include more context | Minor debugging help |
| Could use custom error class | Minor improvement |

### Architecture

| Example | Why Nice to Have |
|---------|------------------|
| Could make one more function private | Minor API improvement |
| Module could be slightly more cohesive | Minor organization |

### Tests

| Example | Why Nice to Have |
|---------|------------------|
| Test name could be slightly clearer | Minor readability |
| Could extract test helper | Minor DRY |

---

## Nitpick Detection

A finding is a **nitpick** (don't raise it) if:

| Criterion | Example |
|-----------|---------|
| Purely stylistic with no readability impact | Preferring `const` over `let` when never reassigned |
| Personal preference not backed by principles | Preferring early returns over if/else |
| Negligible benefit from fixing | Renaming `idx` to `index` in a 3-line loop |
| Contradicts established project conventions | Suggesting new pattern when existing works |

### The Nitpick Test

> "If I inherited this codebase and saw this code, would I actually change it?"
>
> - **YES, immediately** → Must Fix
> - **YES, when I touch this file** → Should Fix
> - **Maybe, if I had time** → Nice to Have
> - **Probably not** → Don't raise it

---

## Severity Adjustment

### Upgrade Severity When

- Issue appears in frequently-modified code
- Issue is in critical path (payments, auth)
- Issue has caused bugs before
- Issue affects many files

### Downgrade Severity When

- Code is rarely touched
- Code is scheduled for deletion
- Fix would require large refactoring
- Issue is in non-critical path

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEVERITY QUICK REFERENCE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MUST FIX                                                        │
│  - Bugs or will cause bugs                                       │
│  - Significantly misleading                                      │
│  - Silent failures                                               │
│  - Unmaintainable code                                           │
│                                                                  │
│  SHOULD FIX                                                      │
│  - Hurts maintainability                                         │
│  - Somewhat confusing                                            │
│  - Violates Clean Code principles                                │
│  - Would fix when touching file                                  │
│                                                                  │
│  NICE TO HAVE                                                    │
│  - Polish and refinement                                         │
│  - Minor improvements                                            │
│  - Slightly clearer alternatives                                 │
│                                                                  │
│  DON'T RAISE                                                     │
│  - Purely stylistic                                              │
│  - Personal preference                                           │
│  - Negligible benefit                                            │
│  - Contradicts conventions                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

*"Severity reflects impact, not personal preference."*
