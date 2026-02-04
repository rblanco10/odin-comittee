# ⚠️ POST-SESSION CLEANUP REQUIRED

**Session**: 2026-01-20_010_marqeta-webhook-observability
**Created**: 2026-01-20

---

## Action Required

Two dashboard implementations were created for comparison. **After testing, ONE must be deleted.**

### Test Both Dashboards

1. Start Grafana:
   ```bash
   cd campsite/pit/docker
   docker compose -f docker-compose.local.yml up -d grafana
   ```

2. Open in browser:
   - **Idea A (Single Dashboard)**: http://localhost:3000/d/webhook-monitoring-idea-a
   - **Idea D (Overview)**: http://localhost:3000/d/webhook-monitoring-idea-d
   - **Idea D (Detail)**: http://localhost:3000/d/webhook-detail-idea-d

3. Click the provider gauges to see navigation behavior

---

## Cleanup Commands

### If Choosing IDEA A (Single Dashboard with Collapsible Rows)

```bash
# Delete Idea D files
rm campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-idea-d-overview.json
rm campsite/pit/docker/grafana/provisioning/dashboards/webhook-provider-detail-idea-d.json

# Rename Idea A to production name
mv campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-idea-a.json \
   campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-v2.json
```

### If Choosing IDEA D (Two-Level with Drill-Down)

```bash
# Delete Idea A file
rm campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-idea-a.json

# Rename Idea D files to production names
mv campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-idea-d-overview.json \
   campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-v2.json
mv campsite/pit/docker/grafana/provisioning/dashboards/webhook-provider-detail-idea-d.json \
   campsite/pit/docker/grafana/provisioning/dashboards/webhook-provider-detail.json
```

---

## Files Created This Session

| File | Purpose |
|------|---------|
| `webhook-monitoring-idea-a.json` | Single dashboard with collapsible rows (DELETE ONE) |
| `webhook-monitoring-idea-d-overview.json` | Overview dashboard for Idea D (DELETE ONE) |
| `webhook-provider-detail-idea-d.json` | Detail dashboard for Idea D (DELETE ONE) |
| `loki_logging_service.ex` | Added card webhook logging functions (KEEP) |
| `adapter.ex` (Marqeta) | Added structured logging (KEEP) |
| `EVENT_TAXONOMY.md` | Added card webhook documentation (KEEP) |

---

## Delete This File

After cleanup is complete, delete this reminder file:

```bash
rm _committees/observability/logging_metrics/sessions/2026-01-20_010_marqeta-webhook-observability/CLEANUP_REQUIRED.md
```

