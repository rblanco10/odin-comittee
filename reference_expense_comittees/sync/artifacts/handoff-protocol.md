# Committee-to-Implementor Handoff Protocol

**Document ID:** PROTOCOL-HANDOFF-001  
**Created:** 2024-12-21  
**Status:** Active

---

## Purpose

This document defines how Sync Committee artifacts integrate with the main ERP documentation and how implementors (manager/coder personas) consume committee work.

---

## Knowledge Architecture

```
docs/agents/architecture/integrations/erps/
│
├── gaps.md                          ← ENTRY POINT for implementors
│   └── "Committee Reviews" section  ← Links to committee artifacts
│
├── personas/                        ← Manager/Coder work from here
│   ├── manager.md
│   └── coder.md
│
└── committees/sync/
    └── artifacts/reviews/           ← Committee produces artifacts here
        └── {review-date}/
            ├── design-proposal.md   ← Architecture decisions
            ├── implementation-plan.md ← Phased tasks
            ├── testing-strategy.md  ← Test requirements
            └── gaps.md              ← Specific gaps identified
```

---

## Handoff Process

### Step 1: Committee Produces Artifacts

When the Sync Committee completes a review, it produces:

1. **Design Proposal** — Architecture and technical decisions
2. **Implementation Plan** — Phased task breakdown
3. **Testing Strategy** — Verification requirements
4. **Gaps Document** — Specific issues identified

All artifacts live in: `committees/sync/artifacts/reviews/{date}/`

### Step 2: Scribe Adds Reference to Main Gaps File

The Scribe adds a "Committee Review" entry to `erps/gaps.md`:

```markdown
## Committee Reviews

### {Review Name} ({Date})
**Review ID:** {ID}
**Committee:** Sync Committee
**Status:** Approved, Ready for Implementation

**Artifacts:**
- [Design Proposal](committees/sync/artifacts/reviews/{date}/design-proposal.md)
- [Implementation Plan](committees/sync/artifacts/reviews/{date}/implementation-plan.md)
- [Testing Strategy](committees/sync/artifacts/reviews/{date}/testing-strategy.md)
- [Gaps](committees/sync/artifacts/reviews/{date}/gaps.md)

**Summary:**
{Brief description of what was reviewed and decided}

**Implementor Instructions:**
1. Read artifacts in order: Design → Plan → Testing
2. Follow phased implementation approach
3. Verify with Tier 1-3 tests as defined in testing strategy
4. Committee available for clarification questions
```

### Step 3: Implementor Reads and Executes

The manager/coder personas:

1. Check `erps/gaps.md` as their entry point
2. See the Committee Review entry
3. Follow links to read artifacts
4. Implement according to the plan
5. Test according to the testing strategy
6. Optionally request committee review of implementation

---

## Principles

1. **Single Entry Point** — Implementors always start at `erps/gaps.md`
2. **No Duplication** — Committee artifacts stay in committee folder, linked from gaps
3. **Clear Ownership** — Committee owns design/review, implementors own code
4. **Traceability** — Every implementation links back to its committee review

---

## Scope Boundaries

### Committee Owns
- Design specifications
- Testing requirements (what to test)
- Acceptance criteria
- Post-implementation audit (optional)

### Implementors Own
- Writing code
- Running tests
- Debugging issues
- Submitting PRs

---

## Process Diagram

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  Human Request   │────▶│  Sync Committee   │────▶│  Artifacts       │
│                  │     │  (Design/Review)  │     │  (in committee/) │
└──────────────────┘     └───────────────────┘     └────────┬─────────┘
                                                            │
                                                            ▼
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  Implementation  │◀────│  Manager/Coder    │◀────│  gaps.md         │
│  Complete        │     │  (Execution)      │     │  (links to       │
└──────────────────┘     └───────────────────┘     │   artifacts)     │
                                                   └──────────────────┘
```

---

## Version History

| Date | Change | Author |
|------|--------|--------|
| 2024-12-21 | Initial protocol established | Sync Committee |

