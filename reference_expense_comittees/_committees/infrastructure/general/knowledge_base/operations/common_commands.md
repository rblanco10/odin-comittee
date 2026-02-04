# Common Operational Commands

## Source
`MONITORING_GUIDE.md`, AWS CLI documentation

## ECS Operations

### View Service Status
```bash
aws ecs describe-services \
  --cluster flame-teampay-$ENV \
  --services flame-teampay-payables-$ENV
```

### Force New Deployment
```bash
aws ecs update-service \
  --cluster flame-teampay-$ENV \
  --service flame-teampay-payables-$ENV \
  --force-new-deployment
```

### Scale Service
```bash
aws ecs update-service \
  --cluster flame-teampay-$ENV \
  --service flame-teampay-payables-$ENV \
  --desired-count 3
```

### List Running Tasks
```bash
aws ecs list-tasks \
  --cluster flame-teampay-$ENV \
  --service-name flame-teampay-payables-$ENV
```

## Log Operations

### Tail Application Logs
```bash
aws logs tail /ecs/flame-teampay/$ENV/app --follow
```

### Search for Errors
```bash
aws logs filter-log-events \
  --log-group-name /ecs/flame-teampay/$ENV/app \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s000)
```

## Database Operations

### Get RDS Endpoint
```bash
aws rds describe-db-clusters \
  --db-cluster-identifier flame-teampay-$ENV \
  --query 'DBClusters[0].Endpoint'
```

### Get Secret (for debugging)
```bash
aws secretsmanager get-secret-value \
  --secret-id flame-teampay/$ENV/aurora-credentials \
  --query SecretString --output text | jq
```

## Health Checks

### ALB Target Health
```bash
aws elbv2 describe-target-health \
  --target-group-arn $TARGET_GROUP_ARN
```

### Application Health
```bash
curl -I https://$APP_HOST/health
```
