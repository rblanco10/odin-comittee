# Committee Validator Tool

> **Purpose**: Validate committee structure for completeness and compliance  
> **Used By**: Khaos (Audit), Hephaestus (Quality Check)

---

## Overview

This tool provides checklists and validation logic for ensuring committees are properly structured and compliant with Khaos governance.

---

## Structural Validation

### Required Files Checklist

```
□ _committees/[name]/README.md
□ _committees/[name]/GOVERNANCE.md
□ _committees/[name]/STATUS.md
□ _committees/[name]/members/roster.md
□ _committees/[name]/members/leadership/ (at least 1 file)
□ _committees/[name]/members/critics/ (at least 2 files)
□ _committees/[name]/members/clerical/ (at least 1 file)
□ _committees/[name]/knowledge_base/ (directory exists)
□ _committees/[name]/sessions/ (directory exists)
□ _committees/[name]/sessions/_templates/ (directory exists)
```

### Directory Structure Validation

```bash
# Verify required directories exist
ls -la _committees/[name]/
# Should contain: README.md, GOVERNANCE.md, STATUS.md, members/, 
#                 knowledge_base/, sessions/

ls -la _committees/[name]/members/
# Should contain: roster.md, leadership/, domain_experts/, critics/, clerical/

ls -la _committees/[name]/sessions/
# Should contain: _templates/
```

---

## Membership Validation

### Minimum Member Requirements

| Committee Type | Min Leadership | Min Experts | Min Critics | Min Clerical |
|----------------|----------------|-------------|-------------|--------------|
| Full Committee | 3 | 5 | 4 | 2 |
| Task Force | 2 | 2 | 2 | 1 |
| Working Group | 1 | 1 | 1 | 0 |

### Critic Validation (CRITICAL)

```
CRITIC VALIDATION CHECKLIST
───────────────────────────

□ At least 2 critics exist (minimum for any committee)
□ Protogenos-inherited critics are present:
  □ Gaia: Stability Guardian, Dependency Auditor
  □ Tartarus: Security Auditor, Compliance Officer
  □ Eros: User Advocate, Simplicity Critic
  □ Nyx: Reliability Guardian, Observability Auditor
  □ Erebus: Balance Auditor, Evidence Demander
□ At least one critic has BLOCK authority
□ Final Validator (C006) exists for committees posting externally
```

### Member File Validation

Each member file must contain:

```
□ ID field (unique within committee)
□ Role field
□ Status field
□ Profile section
□ Background section
□ Responsibilities section
□ Interaction pattern

For Critics additionally:
□ Block authority defined
□ Challenge focus defined
```

---

## Governance Validation

### GOVERNANCE.md Required Sections

```
□ Article I: Committee Composition
  □ Section 1.1: Membership Classes
  □ Section 1.2: Quorum Requirements

□ Article II: Constitutional Rules
  □ Protogenos-inherited rules present
  □ Domain-specific rules defined

□ Article III: Session Management
  □ Session types defined
  □ Session lifecycle documented
  □ Folder naming convention

□ Article IV: Speaking Protocol

□ Article V: Decision Making
  □ Decision types and thresholds
  □ Dissent recording process
  □ Human override process

□ Article VI: Critic Protocol

□ Article VII: Role Capability Matrix

□ Article VIII: Amendments
```

### Constitutional Rules Validation

For each Protogenos lineage, verify inherited rules:

| Lineage | Required Rules |
|---------|----------------|
| **Gaia** | No Unplanned Downtime, Migration Safety, Capacity Planning, Observability |
| **Tartarus** | No Security Exceptions, Encryption by Default, Auth Required, Audit Trail |
| **Eros** | User Evidence Required, Accessibility, Progressive Enhancement, Measurement |
| **Nyx** | SLA Commitment, Alert Hygiene, Runbook Requirement, Incident Response |
| **Erebus** | Double-Entry Inviolable, No Deletion, Evidence Before Conclusion, Reconciliation |

---

## Knowledge Base Validation

### Minimum Knowledge Base Structure

```
□ knowledge_base/ directory exists
□ At least one domain-specific file exists
□ References to Khaos knowledge base where appropriate:
  □ paystand_universe.md (referenced, not duplicated)
  □ regulatory_framework.md (if compliance-related)
  □ architecture_codex.md (if technical)
  □ fintech_lexicon.md (if financial)
```

---

## Session Template Validation

### Required Templates

```
□ sessions/_templates/goal.md
□ sessions/_templates/decisions.md
□ sessions/_templates/action_items.md
□ sessions/_templates/transcript.md (optional but recommended)
```

---

## Audit Report Format

When auditing a committee, produce a report in this format:

```markdown
# Committee Audit Report

**Committee**: [Name]
**Audit Date**: [Date]
**Auditor**: Khaos

## Summary

| Category | Status | Issues |
|----------|--------|--------|
| Structure | ✅/⚠️/❌ | [count] |
| Membership | ✅/⚠️/❌ | [count] |
| Governance | ✅/⚠️/❌ | [count] |
| Knowledge Base | ✅/⚠️/❌ | [count] |
| Sessions | ✅/⚠️/❌ | [count] |

## Critical Issues

[List any blocking issues]

## Warnings

[List any non-blocking concerns]

## Recommendations

[List improvement suggestions]

## Verdict

**Status**: COMPLIANT / NON-COMPLIANT / NEEDS ATTENTION

[Summary statement]
```

---

## Validation Severity Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| ✅ **PASS** | Requirement met | None |
| ⚠️ **WARNING** | Non-critical issue | Should fix |
| ❌ **FAIL** | Critical requirement missing | Must fix |
| 🚫 **BLOCK** | Constitutional violation | Committee suspended |
