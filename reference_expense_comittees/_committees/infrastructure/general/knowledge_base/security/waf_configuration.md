# WAF Configuration

## Source
`infrastructure/lib/stacks/waf-stack.js`, `infrastructure/lib/stacks/security-stack.js`

## WAF WebACL Rules

### AWS Managed Rules Applied
```javascript
// From waf-stack.js
AWSManagedRulesCommonRuleSet     // OWASP Top 10 basics
AWSManagedRulesKnownBadInputsRuleSet  // Known malicious patterns
AWSManagedRulesSQLiRuleSet      // SQL injection
AWSManagedRulesLinuxRuleSet     // Linux-specific attacks
```

### Rate Limiting
```javascript
// Custom rate-based rule
{
  name: 'RateLimitRule',
  statement: {
    rateBasedStatement: {
      limit: 2000,  // Per 5-minute window
      aggregateKeyType: 'IP'
    }
  },
  action: { block: {} }
}
```

## Phoenix LiveView Considerations

### From security-stack.js
```javascript
// LiveView WebSocket path needs special handling
// May need exemptions from certain rules to avoid
// false positives on long-running connections
```

### Known Exemptions
- `/live/websocket` - WebSocket endpoint
- Long-poll fallback connections

## Alerting
```javascript
// SNS notification on high block rate
new Alarm(this, 'WafBlockedRequestsAlarm', {
  threshold: 100,
  evaluationPeriods: 5
});
```

## Logging (Recommendation)
```javascript
// Not visible in current config - should add:
new CfnLoggingConfiguration(this, 'WafLogging', {
  logDestinationConfigs: [logBucket.bucketArn],
  resourceArn: webAcl.attrArn
});
```

## Testing WAF Rules
```bash
# Test SQL injection blocking
curl "https://$HOST/?id=1' OR '1'='1"

# Should return 403 Forbidden
```
