# Session Goal: Marqeta Webhook Observability

**Session ID**: 2026-01-20_010
**Date**: January 20, 2026
**Status**: ✅ CLOSED (Pending User Dashboard Selection)

## Objective

Implement world-class observability for Marqeta webhooks, including structured Loki logging and Grafana dashboards. Establish patterns that can extend to future providers (WEX).

## Scope

1. **Logging Infrastructure** ✅
   - Add card provider webhook logging functions to `LokiLoggingService`
   - Implement structured logging in Marqeta adapter
   - Define event taxonomy for card provider webhooks

2. **Dashboard Options** (User to Test & Decide)
   - **Idea A**: Single dashboard with collapsible rows per provider
   - **Idea D**: Two-level dashboard (overview + detail drill-down)

## Requirements Met

✅ Structured logging with low-cardinality labels
✅ High-cardinality fields for debugging
✅ Generic event names for multi-provider support
✅ Webhook category extraction
✅ Duration tracking
✅ Error classification
✅ Two dashboard variants for comparison

## Success Criteria

- [ ] User selects preferred dashboard approach
- [x] Marqeta webhooks emit structured Loki logs
- [x] Dashboard displays health gauges for all 4 providers
- [x] Drill-down capability to provider-specific metrics
- [x] Latency percentiles (P50/P95/P99) tracked
- [x] Error logging with classification

## Post-Session Action Required

⚠️ **DELETE UNUSED DASHBOARD FILES** — After user tests both dashboards and decides:
- If Idea A selected: Delete `webhook-monitoring-idea-d-overview.json` and `webhook-provider-detail-idea-d.json`
- If Idea D selected: Delete `webhook-monitoring-idea-a.json`
- Rename selected dashboard to `webhook-monitoring.json`

## References

- `LOGGING_STANDARDS.md` - Core logging patterns
- `EVENT_TAXONOMY.md` - Updated with card provider events
- Previous session: `2026-01-17_001_current-state-discovery`
