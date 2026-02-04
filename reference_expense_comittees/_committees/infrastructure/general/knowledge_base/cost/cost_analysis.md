# Cost Analysis

## Source
Analysis of `infrastructure/environment-config.js`, AWS pricing

## Monthly Cost Estimate (Develop)

| Component | Configuration | Est. Monthly |
|-----------|--------------|--------------|
| ECS Fargate | 256 CPU, 512 MB, 1 task | ~$15 |
| Aurora Serverless v2 | 0.5-4 ACU | ~$30-50 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| ALB | 1 LCU average | ~$20 |
| VPC Endpoints | 4 interface endpoints | ~$30 |
| Monitoring Stack | 4 Fargate tasks | ~$60 |
| CloudWatch Logs | ~5 GB/month | ~$3 |
| S3 | ~10 GB storage | ~$0.25 |
| **Total (Dev)** | | **~$170-200/mo** |

## Monthly Cost Estimate (Production)

| Component | Configuration | Est. Monthly |
|-----------|--------------|--------------|
| ECS Fargate | 1024 CPU, 2048 MB, 2-10 tasks | ~$100-500 |
| Aurora Serverless v2 | 2-16 ACU | ~$150-400 |
| ElastiCache Redis | cache.r6g.large | ~$200 |
| ALB | Higher traffic | ~$50 |
| WAF | Request-based | ~$10-50 |
| **Total (Prod)** | | **~$500-1200/mo** |

## Cost Optimizations Already Implemented
1. **VPC Endpoints**: Reduce NAT Gateway traffic costs
2. **Aurora Serverless**: Pay only for capacity used
3. **S3 Lifecycle Rules**: Auto-delete old versions

## Additional Optimization Opportunities
1. **ECR Lifecycle Policy**: Clean old images
2. **Fargate Spot**: For non-critical dev workloads
3. **Reserved Capacity**: For predictable prod loads
4. **Monitoring Stack**: Consider managed alternatives
