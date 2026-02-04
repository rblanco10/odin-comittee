# Scaling Operations

## Source
`infrastructure/lib/stacks/ecs-stack.js`, `infrastructure/environment-config.js`

## Auto-Scaling Configuration

### ECS Service Scaling
```javascript
// From ecs-stack.js
scalableTarget.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,
  scaleOutCooldown: Duration.seconds(60),
  scaleInCooldown: Duration.seconds(300)
});

scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
  targetUtilizationPercent: 80
});
```

### Aurora Auto-Scaling
```javascript
// Serverless v2 scales automatically
serverlessV2MinCapacity: 0.5,  // Min ACUs
serverlessV2MaxCapacity: 4,    // Max ACUs (dev)
```

## Manual Scaling

### Scale ECS Immediately
```bash
aws ecs update-service \
  --cluster flame-teampay-$ENV \
  --service flame-teampay-payables-$ENV \
  --desired-count 5
```

### Adjust Auto-Scaling Limits
```bash
# Update min/max capacity
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/flame-teampay-$ENV/flame-teampay-payables-$ENV \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

## Scaling Considerations

### When to Scale Up
- CPU consistently > 70%
- Memory consistently > 80%
- Response latency increasing
- Error rate increasing

### When to Scale Down
- CPU consistently < 30%
- Memory consistently < 50%
- After peak traffic period
- Cost optimization needed

### Constraints
- Min tasks: 1 (dev), 2 (prod)
- Max tasks: 2 (dev), 10 (prod)
- Startup time: ~5 minutes
