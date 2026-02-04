# SC04 Focus Areas

## Current Observability State

### Prometheus
- Deployed as Fargate service ✓
- Phoenix scraping **commented out** ⚠️
- Cloud Map discovery available

### Loki
- Deployed ✓
- Grafana datasource configured ✓
- Trace correlation configured ✓

### Tempo
- Deployed with OTLP receiver ✓
- OTLP_ENDPOINT configured in ECS ✓
- Question: Is app sending traces?

### Grafana
- Deployed ✓
- All datasources configured ✓
- No dashboards provisioned yet

## Priority Items
1. Enable Prometheus Phoenix scraping
2. Verify Tempo receiving traces
3. Create core dashboards
4. Set up essential alerts
