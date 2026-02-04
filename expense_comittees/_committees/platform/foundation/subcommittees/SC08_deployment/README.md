# SC08: Deployment Subcommittee

> **Code**: SC08  
> **Lead**: Rachel Kim  
> **Co-Lead**: Marcus Webb  
> **Focus**: Release management, deployment, operations

---

## Mission

The Deployment Subcommittee is responsible for getting the Ember Platform to production safely and keeping it running reliably. We own the deployment pipeline, release process, and operational excellence.

We ensure that:
1. Releases are safe and reversible
2. Deployments are automated and reliable
3. Operations are observable and debuggable
4. Incidents are handled effectively

---

## Jurisdiction

### Primary Responsibilities

- Define release and deployment process
- Maintain deployment infrastructure
- Monitor production health
- Handle incident response
- Review deployment-related decisions

### Decision Authority

| Decision Type | Authority Level |
|---------------|-----------------|
| Deployment process changes | Subcommittee approval |
| Infrastructure changes | Subcommittee + relevant specialists |
| Incident response | Subcommittee (emergency authority) |
| Release scheduling | Subcommittee approval |

---

## Members

| Name | Role | Expertise |
|------|------|-----------|
| Rachel Kim | Lead | Releases, K8s |
| Marcus Webb | Co-Lead | Operations |
| Antonio Ferreira | Member | Observability |
| Dr. Maria Santos | Member | External APIs |
| Benjamin Park | Member | Webhooks |
| Thomas Schwarzenberg | Critic | Cost efficiency |
| Jennifer Walsh | Security | Secure deployment |

---

## Deployment Architecture

### Infrastructure

```
┌─────────────────────────────────────────────────┐
│  AWS EKS (Kubernetes)                           │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐              │
│  │ Web Pods    │  │ Worker Pods │              │
│  │ (Phoenix)   │  │ (Oban)      │              │
│  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐              │
│  │ PostgreSQL  │  │ Redis       │              │
│  │ (RDS)       │  │ (ElastiCache)│             │
│  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────┘
```

### Environments

| Environment | Purpose | Auto-Deploy |
|-------------|---------|-------------|
| Development | Local development | N/A |
| Staging | Pre-production testing | On merge to main |
| Production | Live traffic | Manual approval |

---

## Release Process

### Umbrella Releases

The umbrella builds as a single OTP release:

```elixir
# mix.exs
def project do
  [
    apps_path: "apps",
    releases: [
      ember_platform: [
        applications: [
          web_internal: :permanent,
          product_receivables: :permanent,
          product_payables: :permanent,
          product_expense: :permanent,
          # ... all apps
        ]
      ]
    ]
  ]
end
```

### Release Steps

1. **Version Bump**: Update version in mix.exs
2. **Changelog**: Update CHANGELOG.md
3. **Tag**: Create git tag
4. **Build**: Build release in CI
5. **Deploy Staging**: Auto-deploy to staging
6. **Smoke Test**: Run smoke tests
7. **Approve**: Manual production approval
8. **Deploy Production**: Rolling deployment
9. **Monitor**: Watch metrics for issues

---

## Deployment Strategies

### Rolling Deployment (Default)
- Gradual pod replacement
- Zero downtime
- Easy rollback

### Canary Deployment (Major Changes)
- Deploy to small percentage first
- Monitor for errors
- Gradually increase traffic

### Blue-Green (Database Migrations)
- Full parallel environment
- Instant switch
- Instant rollback

---

## Observability

### Metrics (Prometheus)
- Request latency
- Error rates
- Queue depths
- Resource usage

### Logging (Loki)
- Structured JSON logs
- Correlation IDs
- Log levels

### Tracing (Tempo)
- Distributed traces
- Cross-service correlation
- Performance analysis

### Alerting
- PagerDuty integration
- Escalation policies
- Runbooks

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P1 | Production down | 15 minutes |
| P2 | Major feature broken | 1 hour |
| P3 | Minor issue | 4 hours |
| P4 | Cosmetic/Low impact | Best effort |

### Incident Process

1. **Detect**: Alert fires or user report
2. **Triage**: Assess severity
3. **Respond**: Page on-call if needed
4. **Mitigate**: Stop the bleeding
5. **Resolve**: Fix the root cause
6. **Postmortem**: Document and learn

---

## Runbooks

Runbooks live in the knowledge base:
- `knowledge_base/operations/runbooks/`

Each runbook includes:
- Symptoms
- Investigation steps
- Resolution steps
- Escalation path

---

## Meeting Cadence

- **Regular**: Weekly
- **Incident Review**: After each P1/P2
- **Capacity Planning**: Monthly

---

## Related Documentation

- [Umbrella Structure](../../knowledge_base/architecture/umbrella_structure.md)
- [Runbooks](../../knowledge_base/operations/) (TBD)

---

*"Good ops is invisible. Great ops prevents incidents before they happen."*
