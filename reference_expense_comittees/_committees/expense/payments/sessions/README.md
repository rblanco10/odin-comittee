# Sessions

> **Purpose**: Historical record of committee deliberations  
> **Naming Convention**: `YYYY-MM-DD_NNN_session-code`

---

## Session Folder Structure

Each session creates a folder with this structure:

```
sessions/YYYY-MM-DD_NNN_session-code/
├── goal.md           # REQUIRED: Session objective
├── transcript.md     # REQUIRED: Full discussion record
├── decisions.md      # REQUIRED: Decisions made
├── action_items.md   # REQUIRED: Follow-up tasks
└── artifacts/        # OPTIONAL: Session outputs
    ├── diagrams/
    ├── guides/
    └── code_reviews/
```

---

## Naming Convention

```
YYYY-MM-DD_NNN_session-code

Examples:
- 2026-01-05_001_initial-review
- 2026-01-05_002_checkbook-webhook-audit
- 2026-01-06_001_kyb-flow-analysis
```

- **YYYY-MM-DD**: Date session opened
- **NNN**: Sequential number for that date (001, 002, etc.)
- **session-code**: Short kebab-case description

---

## Session Lifecycle

```
1. Chair creates folder with goal.md
2. Session opens, transcript begins
3. Discussion proceeds per protocol
4. Decisions recorded as made
5. Session closes, action items captured
6. STATUS.md updated
```

---

## Template Files

Template files are provided in `_templates/` for convenience.

---

## Historical Access

Sessions are indexed by:
- Date
- Topic
- Decisions made
- Participants

Session Historian maintains cross-references.

---

*"Every session is history; record it well."*
