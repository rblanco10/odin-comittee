# Grafana Configuration

## Source
`infrastructure/lib/stacks/monitoring-stack.js`

## Deployment
```javascript
// Fargate task
cpu: 256,
memory: 512,
image: 'grafana/grafana:10.0.0'
```

## Access
- URL: `https://{alb-domain}/grafana/`
- Auth: Admin password (see security concern below)

## Data Sources
1. **Prometheus**: Metrics queries
2. **Loki**: Log queries
3. **Tempo**: Trace queries

## Pre-configured Dashboards (Recommended)
- ECS Service Health
- Application Performance
- Database Metrics
- Redis Metrics
- Request Latency

## Security Concern
```javascript
// From code - hardcoded admin password
GF_SECURITY_ADMIN_PASSWORD: 'admin'  // CHANGE THIS
```

## Recommendations
1. Use Secrets Manager for admin password
2. Configure OAuth/SAML for SSO
3. Set up read-only viewer accounts

## Subpath Routing
```javascript
// Environment variables
GF_SERVER_ROOT_URL: 'https://domain/grafana/'
GF_SERVER_SERVE_FROM_SUB_PATH: 'true'
```
