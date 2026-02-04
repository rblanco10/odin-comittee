# Common Issues Log

> **Purpose**: Track recurring issues to identify patterns and improve guidance  
> **Last Updated**: 2026-02-04  
> **Total Issues Logged**: 0

---

## How This Works

1. After each review, 📝 **Clerical: Review Recorder** logs any **Must Fix** or repeated **Should Fix** issues here
2. Issues that appear 3+ times get flagged for knowledge base update
3. Patterns inform future reviews and may lead to new guidance

---

## Issue Categories

### 🏷️ Naming Issues

| Issue | Count | Languages | Example | Action |
|-------|-------|-----------|---------|--------|
| *No issues logged yet* | | | | |

<!-- Template for new entries:
| Vague variable names (`data`, `info`) | 0 | Both | `const data = fetch()` | Add to shared_rubric.md |
-->

---

### 📐 Function Issues

| Issue | Count | Languages | Example | Action |
|-------|-------|-----------|---------|--------|
| *No issues logged yet* | | | | |

<!-- Template:
| Functions >40 lines | 0 | Both | `process_all()` 80 lines | Emphasize in reviews |
-->

---

### 🚨 Error Handling Issues

| Issue | Count | Languages | Example | Action |
|-------|-------|-----------|---------|--------|
| *No issues logged yet* | | | | |

<!-- Template:
| Silent catch blocks | 0 | JS/TS | `catch (e) {}` | Add to javascript_layer.md |
-->

---

### 🧪 Test Issues

| Issue | Count | Languages | Example | Action |
|-------|-------|-----------|---------|--------|
| *No issues logged yet* | | | | |

---

### 🏗️ Architecture Issues

| Issue | Count | Languages | Example | Action |
|-------|-------|-----------|---------|--------|
| *No issues logged yet* | | | | |

---

### 🔄 Duplication Issues

| Issue | Count | Languages | Example | Action |
|-------|-------|-----------|---------|--------|
| *No issues logged yet* | | | | |

---

### 💜 Elixir-Specific Issues

| Issue | Count | Example | Action |
|-------|-------|---------|--------|
| *No issues logged yet* | | | |

<!-- Template:
| Missing `?` on boolean functions | 0 | `def valid(user)` | Add to elixir_layer.md |
-->

---

### 💛 JavaScript-Specific Issues

| Issue | Count | Example | Action |
|-------|-------|---------|--------|
| *No issues logged yet* | | | |

<!-- Template:
| Floating promises | 0 | `fetchData().then(...)` no catch | Add to javascript_layer.md |
-->

---

## Threshold Actions

| Count | Action |
|-------|--------|
| **3+** | Flag for knowledge base review |
| **5+** | Add explicit guidance to relevant layer file |
| **10+** | Consider adding to severity_guide.md as Must Fix |

---

## Recent Additions

| Date | Issue | Category | Count | Added By |
|------|-------|----------|-------|----------|
| *No entries yet* | | | | |

---

## Graduated to Knowledge Base

Issues that have been added to the knowledge base:

| Date | Issue | Added To | Reason |
|------|-------|----------|--------|
| *No entries yet* | | | |

---

## How to Log an Issue

After a review, if a **Must Fix** or repeated **Should Fix** appears:

```markdown
### [Category] Issues

| Issue | Count | Languages | Example | Action |
|-------|-------|-----------|---------|--------|
| [Description] | 1 | [Elixir/JS/Both] | `[code example]` | [Pending/Added to X] |
```

Then add to **Recent Additions**:

```markdown
| [Date] | [Issue] | [Category] | 1 | 📝 Clerical: Review Recorder |
```

---

*"Those who cannot remember the past are condemned to repeat it."*
