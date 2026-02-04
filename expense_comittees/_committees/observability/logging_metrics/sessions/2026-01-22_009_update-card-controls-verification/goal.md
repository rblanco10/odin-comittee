# Session Goal

> **Session**: 2026-01-22_009_update-card-controls-verification
> **Type**: Verification
> **Requested By**: Human Director

---

## Primary Objective

Verify that AI-086 implementation (step-level logging for UpdateCardControlsReactor) is working correctly by executing a live test and confirming all logging events appear in Grafana Loki.

---

## Success Criteria

- [ ] Execute UpdateCardControlsReactor via IEx with a real WEX card
- [ ] Confirm all 8 logging events appear in Grafana Loki
- [ ] Verify step timing (`step_duration_ms`) is captured for all steps
- [ ] Verify trace correlation (`trace_id`) is consistent across all events
- [ ] Confirm Tier 2 Card Operations dashboard shows the operation
- [ ] Document verification results

---

## Scope Boundaries

**IN SCOPE**:
- IEx verification procedure for update_card_controls
- Loki event verification
- Dashboard visibility confirmation
- Step-level logging validation

**OUT OF SCOPE**:
- Error case testing (separate session)
- Performance benchmarking
- Other reactor verifications

---

## Expected Outputs

- [ ] Verification transcript with IEx commands
- [ ] Screenshot/confirmation of Loki events
- [ ] Dashboard visibility confirmation
- [ ] AI-086 status update (Verified)
