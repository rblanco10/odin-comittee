# Prometheus Configuration

## Source
`infrastructure/lib/stacks/monitoring-stack.js`

## Deployment
```javascript
// Fargate task
cpu: 256,
memory: 512,
image: 'prom/prometheus:v2.45.0'
```

## Service Discovery
```yaml
# prometheus.yml scrape config
scrape_configs:
  - job_name: 'ecs-services'
    ec2_sd_configs:
      - region: ${AWS_REGION}
    relabel_configs:
      - source_labels: [__meta_ec2_tag_Name]
        target_label: instance
```

## Cloud Map Registration
```javascript
cloudMapOptions: {
  name: 'prometheus',
  cloudMapNamespace: namespace
}
```

## Metrics Collected
- ECS task metrics
- Application metrics (/metrics endpoint)
- Container metrics

## Retention
- Default: 15 days (in-memory/ephemeral)
- No persistent storage configured

## Concerns
- Ephemeral storage = data loss on restart
- Consider EFS or remote storage for production
