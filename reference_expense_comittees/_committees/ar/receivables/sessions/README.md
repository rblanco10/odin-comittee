# Sessions Directory

> **Purpose**: Store session records for the AR Receivables Committee

---

## Overview

This directory contains all session records. Each session has its own folder with standardized documents.

---

## Session Folder Naming

```
YYYY-MM-DD_NNN_session-code

Where:
- YYYY-MM-DD = Date session opened
- NNN = Sequential number for that date (001, 002, etc.)
- session-code = Short descriptive code (kebab-case)

Examples:
- 2026-01-15_001_collections-architecture
- 2026-01-16_001_erp-push-review
- 2026-01-16_002_performance-audit
```

---

## Session Folder Structure

Every session folder MUST contain:

```
sessions/YYYY-MM-DD_NNN_session-code/
├── goal.md           # REQUIRED: Session objective
├── transcript.md     # REQUIRED: Full discussion record  
├── decisions.md      # REQUIRED: Decisions made
├── action_items.md   # REQUIRED: Follow-up tasks
└── artifacts/        # OPTIONAL: Session outputs
    ├── diagrams/
    └── ...
```

---

## Templates

Templates for session documents are in `_templates/`:

```
sessions/_templates/
├── goal.md
├── transcript.md
├── decisions.md
└── action_items.md
```

Copy these templates to your session folder when creating a new session.

---

## Session History

| Date | Code | Goal | Outcome |
|------|------|------|---------|
| *No sessions yet* | - | - | - |

---

## Creating a New Session

1. Create folder with correct naming convention
2. Copy templates from `_templates/`
3. Fill in `goal.md` with session objective
4. Update `STATUS.md` with active session info
5. Begin session following orchestration protocol

---

*"Every session is documented; every decision is recorded."*

