# Alerting Configuration

## Source
`infrastructure/lib/stacks/waf-stack.js`, analysis

## Current Alerts

### WAF Alerts (Configured)
```javascript
// From waf-stack.js
new Alarm(this, 'WafBlockedRequestsAlarm', {
  metric: wafBlockedRequestsMetric,
  threshold: 100,
  evaluationPeriods: 5,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD
});

// SNS notification
alarmActions: [alertTopic]
```

### Recommended Application Alerts

#### High Error Rate
```promql
rate(http_requests_total{status=~"5.."}[5m]) 
  / rate(http_requests_total[5m]) > 0.01
```

#### High Latency
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
) > 1
```

#### Database Connections Exhausted
```promql
pg_stat_activity_count >= pg_settings_max_connections * 0.9
```

#### Redis Memory High
```promql
redis_memory_used_bytes / redis_memory_max_bytes > 0.8
```

## Alert Routing
```
Alert → SNS Topic → Email/Slack/PagerDuty
```

## Best Practices
1. **Actionable**: Every alert should have a runbook
2. **Avoid Noise**: Group similar alerts
3. **Severity Levels**: Critical/Warning/Info
4. **On-Call Integration**: PagerDuty recommended
