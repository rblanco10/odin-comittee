# Deployment Verification

## Source
`.gitlab-ci.yml`, `MONITORING_GUIDE.md`

## Verification Steps

### 1. ECS Task Health
```bash
aws ecs describe-services \
  --cluster $CLUSTER \
  --services $SERVICE \
  --query 'services[0].deployments'
```

Expected: `runningCount == desiredCount`

### 2. Target Group Health
```bash
aws elbv2 describe-target-health \
  --target-group-arn $TARGET_GROUP
```

Expected: All targets `healthy`

### 3. Application Health Check
```bash
curl -f https://$APP_HOST/health
```

Expected: HTTP 200

### 4. Log Verification
```bash
aws logs tail /ecs/$PROJECT/$ENV/app \
  --since 5m \
  --filter-pattern "ERROR"
```

Expected: No new errors

## Automated Verification Pipeline
```yaml
verify:
  stage: verify
  script:
    - ./scripts/wait_for_deployment.sh
    - ./scripts/health_check.sh
    - ./scripts/smoke_test.sh
  allow_failure: false
```

## Rollback Triggers
- Health check failures (3 consecutive)
- Error rate spike (> 5%)
- Circuit breaker triggered
- Manual intervention

## Smoke Tests
```elixir
# Basic functionality tests
- User login
- Database connectivity
- Redis connectivity
- Background job execution
```
