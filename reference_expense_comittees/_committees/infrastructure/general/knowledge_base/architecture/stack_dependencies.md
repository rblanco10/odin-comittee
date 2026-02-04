# Stack Dependencies

## Source
`infrastructure/bin/app.js` lines defining stack instantiation order.

## Dependency Chain
```javascript
// Network is the foundation
const network = new NetworkStack(...)

// Data layer depends on network
const aurora = new AuroraStack(..., { vpc: network.vpc, ... })
const redis = new RedisStack(..., { vpc: network.vpc, ... })

// Storage is independent (only needs network)
const s3 = new S3Stack(...)

// ALB needs network and is foundation for services
const alb = new AlbStack(..., { vpc: network.vpc, ... })

// ECS needs everything
const ecs = new EcsStack(..., {
  vpc: network.vpc,
  rdsSecret: aurora.secret,
  redisEndpoint: redis.endpoint,
  ...
})

// Monitoring needs ECS to exist
const monitoring = new MonitoringStack(..., { cluster: ecs.cluster, ... })
```

## Cross-Stack References
- Network exports: VPC, subnets, security groups
- Aurora exports: endpoint, secret ARN, security group
- Redis exports: endpoint, auth secret ARN
- ALB exports: listener, target groups
- ECS exports: cluster, service

## Deployment Order
1. NetworkStack
2. SecurityStack (parallel with data stacks)
3. AuroraStack, RedisStack, S3Stack (parallel)
4. AlbStack
5. EcsStack
6. MonitoringStack
