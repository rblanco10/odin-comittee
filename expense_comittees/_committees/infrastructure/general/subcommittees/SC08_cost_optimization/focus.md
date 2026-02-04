# SC08 Focus: Cost Management

## Cost Optimizations Already Implemented
- VPC endpoints (reduce NAT costs) ✓
- Aurora Serverless (pay per ACU) ✓
- S3 lifecycle policies ✓

## Areas to Review
1. Right-size ECS tasks
2. Consider Fargate Spot for dev
3. ECR image lifecycle
4. Reserved capacity for prod

## Monitoring Stack Consideration
- 4 Fargate tasks for monitoring
- ~$120/month for observability
- Consider necessity in dev
