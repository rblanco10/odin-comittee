# Observability Stack Overview

## Source
`infrastructure/lib/stacks/monitoring-stack.js`

## Components
```
┌─────────────┐  ┌────────┐  ┌───────┐  ┌─────────┐
│ Prometheus  │  │  Loki  │  │ Tempo │  │ Grafana │
│  (metrics)  │  │ (logs) │  │(traces│  │ (viz)   │
└──────┬──────┘  └───┬────┘  └───┬───┘  └────┬────┘
       │             │           │           │
       └─────────────┴───────────┴───────────┘
                     │
              Service Discovery
              (AWS Cloud Map)
```

## Deployment
- Each component runs as separate ECS Fargate task
- Shared ECS cluster with application (optional)
- Cloud Map namespace for internal discovery

## Access
- Grafana: ALB path `/grafana/`
- Internal: Cloud Map DNS names
  - `prometheus.monitoring.local`
  - `loki.monitoring.local`
  - `tempo.monitoring.local`

## Data Flow
1. **Metrics**: App → Prometheus scrape → Grafana
2. **Logs**: CloudWatch → Loki → Grafana
3. **Traces**: App → Tempo → Grafana
