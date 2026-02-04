# Troubleshooting Guide

## Common Issues

### 1. ECS Task Won't Start

**Symptoms**: Tasks stuck in PENDING or PROVISIONING

**Checks**:
```bash
# Check task stopped reason
aws ecs describe-tasks \
  --cluster $CLUSTER \
  --tasks $TASK_ARN \
  --query 'tasks[0].stoppedReason'
```

**Common Causes**:
- Image pull failure (ECR permissions)
- Secret retrieval failure (Secrets Manager permissions)
- Resource constraints (no capacity)
- Network configuration (subnets, security groups)

### 2. Health Check Failures

**Symptoms**: Tasks start but marked unhealthy

**Checks**:
```bash
# Check ALB target health
aws elbv2 describe-target-health --target-group-arn $TG_ARN

# Check application logs during startup
aws logs tail /ecs/flame-teampay/$ENV/app --since 10m
```

**Common Causes**:
- Application not ready within grace period
- /health endpoint returning non-200
- Port mismatch
- Security group blocking ALB

### 3. Database Connection Issues

**Symptoms**: "could not connect to server" errors

**Checks**:
```bash
# Verify security group allows ECS → RDS
# Check secret is accessible
aws secretsmanager get-secret-value --secret-id $SECRET_ID

# Verify Aurora is running
aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID
```

### 4. High Latency

**Symptoms**: Slow response times

**Checks**:
- Aurora ACU utilization (may need scaling)
- ECS CPU/Memory (may need more resources)
- Database query logs (slow queries)
- Redis hit ratio (cache effectiveness)

### 5. Memory OOM

**Symptoms**: Tasks killed unexpectedly

**Checks**:
```bash
# Look for OOMKilled in stopped reason
aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK
```

**Resolution**: Increase task memory or investigate memory leak
