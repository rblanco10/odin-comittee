# Network Topology

## Source
`infrastructure/lib/stacks/network-stack.js`, `infrastructure/lib/network-config.js`

## VPC Design
- **CIDR**: /16 network (65,536 addresses)
- **AZs**: 2 availability zones
- **Subnet Types**: Public, Private, Isolated

## Subnet Allocation
```
Public Subnets (/20 each):
├── AZ-a: ALB, NAT Gateway
└── AZ-b: ALB (failover)

Private Subnets (/20 each):
├── AZ-a: ECS tasks, monitoring
└── AZ-b: ECS tasks (scaling)

Isolated Subnets (/20 each):
├── AZ-a: Aurora, Redis
└── AZ-b: Aurora replica, Redis failover
```

## Security Groups
- `AlbSecurityGroup`: 80/443 from internet
- `EcsSecurityGroup`: From ALB only
- `RdsSecurityGroup`: 5432 from ECS only
- `RedisSecurityGroup`: 6379 from ECS only

## Traffic Flow
```
Internet → ALB (public) → ECS (private) → Aurora/Redis (isolated)
                                        ↓
                          VPC Endpoints (private AWS access)
```

## VPC Endpoints Configured
- S3 (Gateway)
- ECR API/DKR (Interface)
- CloudWatch Logs (Interface)
- Secrets Manager (Interface)
