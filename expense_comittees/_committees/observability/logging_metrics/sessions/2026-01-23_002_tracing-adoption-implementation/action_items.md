# Action Items

**Session**: 2026-01-23_002_tracing-adoption-implementation

---

## Completed This Session

| ID | Item | Owner | Status | Completed |
|----|------|-------|--------|-----------|
| AI-092 | Add tracesToLogsV2 to Tempo datasource | SC04 Dashboard | ✅ Done | 2026-01-23 |
| AI-093 | Add nodeGraph and lokiSearch to Tempo config | SC04 Dashboard | ✅ Done | 2026-01-23 |
| AI-094 | Create comprehensive implementation plan | Committee | ✅ Done | 2026-01-23 |
| AI-095 | Document all concerns and resolutions | Committee | ✅ Done | 2026-01-23 |

---

## Pending Human Director Execution

| ID | Item | Owner | Priority | Status |
|----|------|-------|----------|--------|
| AI-096 | Restart Grafana to pick up datasources.yml changes | Human Director | 🔴 High | ⏳ Pending |
| AI-097 | Execute verification procedure (Phase 2 of plan) | Human Director | 🔴 High | ⏳ Pending |
| AI-098 | Confirm traces visible in Tempo via Loki link | Human Director | 🔴 High | ⏳ Pending |
| AI-099 | Confirm Tempo → Loki link works (Logs tab in trace view) | Human Director | 🔴 High | ⏳ Pending |

---

## Future Enhancements (Not Blocking)

| ID | Item | Owner | Priority | Status |
|----|------|-------|----------|--------|
| AI-100 | Add HTTP client tracing for WEX/Marqeta API calls | SC03 Tracing | 🟡 Medium | ⏳ Future |
| AI-101 | Add Oban job tracing with trace context propagation | SC03 Tracing | 🟡 Medium | ⏳ Future |
| AI-102 | Add "Slow Traces" panel to Tier 1 dashboard | SC04 Dashboard | 🟢 Low | ⏳ Future |
| AI-103 | Add trace sampling when volume exceeds threshold | SC03 Tracing | 🟢 Low | ⏳ Future |

---

## Verification Commands

```bash
# 1. Restart Grafana
cd campsite/pit/docker
docker-compose -f docker-compose.local.yml restart grafana

# 2. Verify Tempo is running
curl -s http://localhost:3200/ready

# 3. Open Grafana
open http://localhost:3000

# 4. Test in IEx (trigger a traced operation)
iex -S mix
# Then freeze/unfreeze a card to generate traces
```
