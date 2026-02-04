# Session Goal

**Session ID**: 2026-01-22_002_wex-dashboard-visibility-fix  
**Session Type**: Investigation → Implementation Plan  
**Opened**: 2026-01-22  
**Requested By**: Human Director

---

## Primary Objective

Fix critical AI-084: WEX data is not visible in the Tier 2 Card Operations dashboard due to provider variable mismatch (`wex` vs `wex_fleet`).

---

## Success Criteria

- [ ] Root cause fully understood and documented
- [ ] Impact scope identified (which panels/queries affected)
- [ ] Fix designed and validated
- [ ] Detailed implementation plan created for engineering handoff
- [ ] Verification steps documented

---

## Scope Boundaries

**IN SCOPE**:
- Tier 2 Card Operations dashboard provider variable
- Any other dashboards with the same mismatch
- LogQL query implications

**OUT OF SCOPE**:
- Step-level logging gaps (AI-085, AI-086)
- Webhook dashboard updates (AI-087)
- Code changes to Elixir logging

---

## Expected Outputs

1. Root cause analysis document
2. Impact assessment (all affected queries/panels)
3. Implementation plan with exact file changes
4. Verification procedure

---

## Activated Members

- **Dr. Alexandra Chen** (Chair) — Session orchestration
- **Dr. William Park** (SC04-001, Dashboard Architect) — Dashboard expertise
- **Derek Patterson** (SC04-005, Variable Template Expert) — Template variable expertise
- **Dr. Kenji Tanaka** (CL002, Research Librarian) — Codebase research
- **Elena Vasquez** (SK002, Complexity Auditor) — Skeptic challenge
