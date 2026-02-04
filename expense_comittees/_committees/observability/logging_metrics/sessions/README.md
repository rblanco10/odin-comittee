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
    ├── code/
    ├── dashboards/
    └── configs/
```

---

## Naming Convention

```
YYYY-MM-DD_NNN_session-code

Examples:
- 2026-01-17_001_current-state-discovery
- 2026-01-17_002_logging-standards-design
- 2026-01-18_001_local-stack-setup
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

## Session Types

| Type | Purpose | Typical Duration |
|------|---------|------------------|
| Discovery | Understand current state | 2-4 hours |
| Design | Create patterns and standards | 2-3 hours |
| Implementation | Build and deploy | Variable |
| Review | Audit existing work | 1-2 hours |
| Incident | Post-incident analysis | 1-2 hours |
| Research | Deep investigation | Variable |

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

