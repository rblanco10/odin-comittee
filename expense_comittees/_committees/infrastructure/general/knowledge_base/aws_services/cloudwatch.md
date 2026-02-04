# CloudWatch Configuration

## Source
`infrastructure/lib/stacks/ecs-stack.js`, `infrastructure/lib/stacks/network-stack.js`, `MONITORING_GUIDE.md`

## Log Groups
```javascript
// ECS Application Logs
logGroup: new LogGroup(this, 'AppLogGroup', {
  logGroupName: `/ecs/${projectName}/${env}/app`,
  retention: RetentionDays.ONE_MONTH
})

// VPC Flow Logs
const flowLogGroup = new LogGroup(this, 'FlowLogGroup', {
  retention: RetentionDays.ONE_WEEK
});
```

## Log Insights Queries
```sql
-- Error logs
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- Request latency
fields @timestamp, request_path, response_time_ms
| stats avg(response_time_ms), max(response_time_ms) by bin(5m)
```

## Metrics Available
- ECS: CPUUtilization, MemoryUtilization
- ALB: RequestCount, TargetResponseTime, HTTPCode_Target_5XX
- Aurora: CPUUtilization, DatabaseConnections, FreeableMemory
- Redis: CurrConnections, CacheMisses, EngineCPUUtilization

## Alarms Configured
```javascript
// From waf-stack.js
new Alarm(this, 'WafBlockedRequestsAlarm', {
  metric: wafBlockedRequestsMetric,
  threshold: 100,
  evaluationPeriods: 5
});
```

## Operational Commands
```bash
# Tail logs
aws logs tail /ecs/${PROJECT}/${ENV}/app --follow

# Get recent errors
aws logs filter-log-events \
  --log-group-name /ecs/${PROJECT}/${ENV}/app \
  --filter-pattern "ERROR"
```
