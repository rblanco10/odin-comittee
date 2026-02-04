# Session Goal

## Session ID: 2026-01-20_006_ai044-ai045-verification

**Primary Objective**: Verify the AI-044 and AI-045 fixes are working correctly in the live environment.

## Success Criteria

- [ ] AI-045: Grafana Tier 1 dashboard time picker affects Loki-based panels
- [ ] AI-044: Error events in Loki contain `card_request_id` and `trace_id` fields

## Scope Boundaries

**IN SCOPE**:
- Restart Grafana to load updated dashboard
- Test time picker with different ranges
- Run IEx error simulation to generate error logs
- Query Loki to verify correlation IDs appear in error events

**OUT OF SCOPE**:
- Code changes (implementation is complete)
- New dashboard panels
- Additional logging

## Expected Outputs

- [ ] Verification that AI-045 is working (time picker affects panels)
- [ ] Verification that AI-044 is working (correlation IDs in error logs)
- [ ] STATUS.md update marking both items as verified
