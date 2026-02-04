# Loki Configuration

## Source
`infrastructure/lib/stacks/monitoring-stack.js`

## Deployment
```javascript
// Fargate task
cpu: 256,
memory: 512,
image: 'grafana/loki:2.8.0'
```

## Purpose
- Centralized log aggregation
- Log querying via LogQL
- Grafana integration

## Log Sources
1. CloudWatch Logs (via Lambda or Promtail)
2. Direct push from applications

## Query Examples
```logql
# Errors in last hour
{app="flame-teampay-payables"} |= "ERROR"

# Phoenix request logs
{app="flame-teampay-payables"} | json | method="POST"

# Slow requests
{app="flame-teampay-payables"} | json | response_time > 1000
```

## Storage
- Current: Ephemeral filesystem
- Recommendation: S3 backend for durability

## Cloud Map Registration
```javascript
cloudMapOptions: {
  name: 'loki',
  cloudMapNamespace: namespace
}
```
