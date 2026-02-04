# Cost Optimization Strategies

## Immediate Opportunities

### 1. ECR Image Lifecycle
```javascript
// Add to ecs-stack.js
new ecr.CfnLifecyclePolicy(this, 'LifecyclePolicy', {
  lifecyclePolicyText: JSON.stringify({
    rules: [{
      rulePriority: 1,
      description: 'Keep last 10 images',
      selection: {
        countType: 'imageCountMoreThan',
        countNumber: 10
      },
      action: { type: 'expire' }
    }]
  })
});
```
Savings: ~$1-5/month

### 2. Fargate Spot for Dev
```javascript
// For non-critical workloads
capacityProviderStrategies: [
  { capacityProvider: 'FARGATE_SPOT', weight: 1 }
]
```
Savings: Up to 70% on compute

### 3. Right-Size Redis
- Dev: `cache.t3.micro` (adequate)
- Staging: `cache.t3.small` (may be oversized)
- Monitor actual memory usage

### 4. Aurora Min Capacity
- Current min: 0.5 ACU
- Consider 0 ACU for dev (with pause enabled)
- Tradeoff: Cold start latency

## Long-Term Strategies

### Compute Savings Plans
```
1-year commitment: 20-30% savings
3-year commitment: 40-50% savings
```

### Reserved Capacity for Production
- Database: Reserved instances if predictable
- Redis: Reserved nodes

### Observability Alternatives
- Consider AWS-native (CloudWatch Container Insights)
- Or managed Grafana Cloud
- Current self-hosted stack: ~$60/month

## Monitoring Costs
```bash
# AWS Cost Explorer CLI
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE
```
