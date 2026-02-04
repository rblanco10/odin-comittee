# Architecture Overview

## Source
Derived from analysis of `infrastructure/bin/app.js` and CDK stack files.

## Stack Hierarchy
```
NetworkStack (VPC, subnets, security groups)
    ├── AuroraStack (PostgreSQL database)
    ├── RedisStack (ElastiCache)
    ├── S3Stack (File storage)
    ├── AlbStack (Load balancer)
    │       └── EcsStack (Application containers)
    │               └── MonitoringStack (Observability)
    └── SecurityStack (KMS, WAF)
```

## Environment Strategy
- **develop**: Lower resources, no deletion protection
- **staging**: Similar to prod, with testing features
- **production**: Full resources, deletion protection enabled

## Key Design Decisions
1. **AWS CDK (JavaScript)**: Infrastructure as Code
2. **ECS Fargate**: Serverless container orchestration
3. **Aurora Serverless v2**: Pay-per-use PostgreSQL
4. **VPC Endpoints**: Reduce NAT gateway costs
5. **Cloud Map**: Internal service discovery
