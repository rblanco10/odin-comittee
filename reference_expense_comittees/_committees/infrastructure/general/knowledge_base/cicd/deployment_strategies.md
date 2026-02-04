# Deployment Strategies

## Source
`infrastructure/lib/stacks/ecs-stack.js`

## Current: Rolling Update
```javascript
// From ecs-stack.js
deploymentConfiguration: {
  minimumHealthyPercent: 50,
  maximumPercent: 200
}
```

### How It Works
1. Start new task (200% capacity)
2. Wait for health check pass
3. Drain connections from old task
4. Terminate old task (back to 100%)

### Pros
- Simple, built-in to ECS
- No additional infrastructure

### Cons
- Brief mixed-version state
- Slower for large deployments

## Alternative: Blue/Green
```javascript
// Requires CodeDeploy integration
deploymentController: {
  type: DeploymentControllerType.CODE_DEPLOY
}
```

### When to Use
- Critical applications
- Need instant rollback
- Large task count

## Alternative: Canary
```yaml
# Progressive rollout
- 10% traffic for 5 minutes
- 50% traffic for 10 minutes
- 100% traffic
```

### When to Use
- High-risk changes
- Need gradual validation

## Current Circuit Breaker
```javascript
circuitBreaker: {
  enable: true,
  rollback: true  // Auto-rollback on failure
}
```

## Recommendation
For this application (Phoenix/LiveView):
- Rolling update is appropriate
- Circuit breaker provides safety
- Consider blue/green for production
