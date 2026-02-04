# Data Flow Architecture

## Source
Analysis of `ecs-stack.js`, `aurora-stack.js`, `redis-stack.js`, `s3-stack.js`

## Request Flow
```
User Request
    ↓
┌─────────────────┐
│   AWS WAF       │ ← Block malicious traffic
└────────┬────────┘
         ↓
┌─────────────────┐
│ Application     │ ← SSL termination, routing
│ Load Balancer   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ ECS Fargate     │ ← Phoenix application
│ (Phoenix App)   │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ↓         ↓          ↓
┌───────┐ ┌───────┐ ┌─────────┐
│Aurora │ │ Redis │ │   S3    │
│  RDS  │ │ Cache │ │ Uploads │
└───────┘ └───────┘ └─────────┘
```

## Data Storage Responsibilities

| Store | Purpose | Persistence |
|-------|---------|-------------|
| Aurora PostgreSQL | Primary data | Durable, backed up |
| Redis | Sessions, cache, Oban | Ephemeral |
| S3 | User uploads | Durable, versioned |

## Connection Details
- **Aurora**: Port 5432, TLS required, secret rotation enabled
- **Redis**: Port 6379, AUTH token required, TLS in transit
- **S3**: HTTPS only, pre-signed URLs for uploads

## Observability Data Flow
```
ECS Tasks → CloudWatch Logs
         → Prometheus (metrics)
         → Loki (logs aggregation)
         → Tempo (traces)
         → Grafana (visualization)
```
