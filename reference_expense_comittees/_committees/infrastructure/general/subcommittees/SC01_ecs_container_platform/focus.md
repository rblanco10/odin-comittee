# SC01 Focus Areas

## Current Infrastructure State (from codebase analysis)

### ECS Configuration
```javascript
// From ecs-stack.js and environment-config.js
cpu: 256,           // 0.25 vCPU
memory: 512,        // 512 MB
desiredCount: 1,
minCapacity: 1,
maxCapacity: 2      // dev
```

### Health Check
```javascript
healthCheck: {
  command: 'curl -f http://localhost:4000/health || exit 1',
  startPeriod: 300  // 5 minutes
}
healthCheckGracePeriod: 1800  // 30 minutes (dev)
```

### Scaling
```javascript
scaleOnCpuUtilization: 70%
scaleOnMemoryUtilization: 80%
scaleInCooldown: 300s
scaleOutCooldown: 60s
```

## Priority Review Items

1. **Resource Sizing** - BEAM may need more resources
2. **Scaling Responsiveness** - Startup time affects response
3. **Redundancy** - Single task = no failover
4. **Health Checks** - Long grace period indicates startup issues
