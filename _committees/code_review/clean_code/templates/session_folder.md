# Session Folder Template

> Template for creating new session folders.

---

## Folder Structure

When a new session is created, the following structure is generated:

```
sessions/[target-name]_[YYYY-MM-DD]/
├── SESSION_STATE.md      # Current state of the session
├── context.md            # Initial analysis from Code Researcher
├── findings/             # Individual reviewer findings
│   ├── naming.md
│   ├── complexity.md
│   ├── errors.md
│   ├── tests.md
│   ├── architecture.md
│   ├── duplication.md
│   └── language_specific.md
├── challenges/           # Critic challenges
│   ├── pragmatism.md
│   └── consistency.md
├── report.md             # Final consolidated report (when complete)
└── artifacts/            # Any additional documents created
```

---

## SESSION_STATE.md Template

```markdown
# Session: [Session ID]

## Metadata
| Field | Value |
|-------|-------|
| **Session ID** | [target-name]_[YYYY-MM-DD] |
| **Status** | 🟢 ACTIVE |
| **Target** | [file or folder path] |
| **Language** | [TypeScript/JavaScript/Elixir] |
| **Started** | [timestamp] |
| **Last Activity** | [timestamp] |

---

## Progress

| Phase | Status | Completed By |
|-------|--------|--------------|
| 1. Session Opening | ⏳ In Progress | 🎯 Moderator |
| 2. Code Analysis | ⬜ Pending | 🔍 Code Researcher |
| 3. Universal Review | ⬜ Pending | Universal Reviewers |
| 4. Language Review | ⬜ Pending | Language Specialist |
| 5. Critical Review | ⬜ Pending | Critics |
| 6. Report Compilation | ⬜ Pending | 📝 Review Recorder |
| 7. Quality Validation | ⬜ Pending | 📏 Standards Keeper |
| 8. Human Approval | ⬜ Pending | Human Director |
| 9. Session Closing | ⬜ Pending | 🎯 Moderator |

---

## Current Turn

**Active Member**: 🎯 Leadership: Moderator
**Phase**: Session Opening
**Waiting For**: Human to confirm scope

---

## Open Issues

| ID | Issue | Raised By | Status |
|----|-------|-----------|--------|
| *none yet* | - | - | - |

---

## Decisions Made

| Decision | Made By | Rationale |
|----------|---------|-----------|
| *none yet* | - | - |

---

## Notes

[Any session-specific notes]
```

---

## Usage

When `/cc-session-open` is invoked:
1. Create the session folder
2. Copy this template structure
3. Initialize SESSION_STATE.md with target info
4. Update SESSION_INDEX.md with new session
5. Begin the review workflow
