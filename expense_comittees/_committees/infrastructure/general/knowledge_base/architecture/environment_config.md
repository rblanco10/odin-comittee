# Environment Configuration

## Source
`infrastructure/environment-config.js`

## Environment Matrix

| Setting | develop | staging | production |
|---------|---------|---------|------------|
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| RDS Node | - | - | - |
| Aurora Min ACU | 0.5 | 1 | 2 |
| Aurora Max ACU | 4 | 8 | 16 |
| Redis Node | cache.t3.micro | cache.t3.small | cache.r6g.large |
| ECS CPU | 256 | 512 | 1024 |
| ECS Memory | 512 | 1024 | 2048 |
| ECS Min Tasks | 1 | 2 | 2 |
| ECS Max Tasks | 2 | 4 | 10 |
| ALB Deletion Protection | false | true | true |

## Configuration Access
```javascript
const config = require('./environment-config');
const envConfig = config[environmentName];
// Access: envConfig.aurora.minCapacity, envConfig.ecs.cpu, etc.
```

## Key Insights
- **Production** has 4x more CPU/memory than develop
- **Aurora scaling** ranges from 0.5 to 16 ACUs
- **Dev has minimal protection** (no deletion protection)
