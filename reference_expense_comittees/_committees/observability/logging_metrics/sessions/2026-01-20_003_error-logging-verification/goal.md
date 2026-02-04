# Session Goal: Error Logging Verification

> **Session ID**: 2026-01-20_003_error-logging-verification  
> **Type**: Investigation → Verification  
> **Opened**: 2026-01-20  
> **Status**: ACTIVE

---

## Primary Objective

Determine the optimal verification strategy for confirming that error logging in the WEX card issuance flow works correctly—ensuring errors are visible in Grafana/Loki dashboards when steps fail.

## Success Criteria

- [ ] Review existing error logging implementation in CardIssuanceReactor and IssueCardReactor
- [ ] Identify all error paths that should emit Loki logs
- [ ] Recommend verification approach (manual test vs iex simulation vs code-based error injection)
- [ ] Provide concrete steps for verification
- [ ] Document expected LogQL queries to confirm errors appear in dashboards

## Scope Boundaries

**IN SCOPE:**
- CardIssuanceReactor (Business Layer) error paths
- IssueCardReactor (Payment Layer) error paths  
- LokiLoggingService error logging functions
- Dashboard visibility verification

**OUT OF SCOPE:**
- Adding new error logging (already implemented in previous session)
- Changes to error handling logic itself
- Production error testing

## Expected Outputs

- [ ] Verification strategy recommendation (with rationale)
- [ ] Step-by-step verification procedure
- [ ] LogQL queries for confirming dashboard visibility
- [ ] Risk assessment for each verification approach
