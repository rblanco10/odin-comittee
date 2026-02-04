# ECS Fargate Configuration

## Source
`infrastructure/lib/stacks/ecs-stack.js`

## Task Definition
```javascript
// From ecs-stack.js
cpu: envConfig.ecs.cpu,        // 256 (dev) → 1024 (prod)
memoryLimitMiB: envConfig.ecs.memory,  // 512 (dev) → 2048 (prod)
runtimePlatform: {
  cpuArchitecture: ecs.CpuArchitecture.X86_64,
  operatingSystemFamily: ecs.OperatingSystemFamily.LINUX
}
```

## Container Configuration
- **Image**: ECR repository `flame-teampay-payables`
- **Port**: 4000 (Phoenix default)
- **Health Check**: `/health` endpoint
- **Logging**: CloudWatch via awslogs driver

## Environment Variables (from code)
- `DATABASE_URL`: Aurora connection string
- `SECRET_KEY_BASE`: From Secrets Manager
- `REDIS_URL`: ElastiCache endpoint
- `PHX_HOST`: Application hostname
- `PHX_SERVER`: true
- `POOL_SIZE`: 10

## Auto-Scaling
```javascript
// Target tracking policies
cpuTargetUtilizationPercent: 70
memoryTargetUtilizationPercent: 80
scaleOutCooldown: Duration.seconds(60)
scaleInCooldown: Duration.seconds(300)
```

## Deployment Configuration
- Rolling update: minHealthy 50%, maxHealthy 200%
- Circuit breaker: enabled (prod), rollback enabled
- Health check grace: 30 min (dev), 15 min (prod)

## Concerns Noted
- 256 CPU = ~0.25 vCPU (limited for BEAM)
- 512 MB may be tight for Phoenix+Ash+Oban
- Long startup suggests heavy boot process
