# Security Layers

## Source
`infrastructure/lib/stacks/security-stack.js`, `infrastructure/lib/stacks/waf-stack.js`, `infrastructure/lib/stacks/network-stack.js`

## Defense in Depth

### Layer 1: Edge (WAF)
- AWS Managed Rules (OWASP Top 10)
- Rate limiting (2000 req/5min per IP)
- Bot control
- Known bad inputs blocking
- **LiveView-aware**: Special handling for `/live/websocket`

### Layer 2: Network (VPC)
- Isolated subnets for data
- Security group chaining
- VPC Flow Logs enabled
- No public IPs on ECS tasks

### Layer 3: Transport
- TLS 1.2+ on ALB
- TLS in transit to Redis
- IAM authentication capable (Aurora)

### Layer 4: Data
- KMS encryption at rest (Aurora, S3)
- Secrets Manager with rotation
- S3 versioning enabled

### Layer 5: Application
- Secrets injected at runtime
- No hardcoded credentials
- Least privilege IAM roles

## WAF Rules Applied
```javascript
// From waf-stack.js
- AWSManagedRulesCommonRuleSet
- AWSManagedRulesKnownBadInputsRuleSet
- AWSManagedRulesSQLiRuleSet
- AWSManagedRulesLinuxRuleSet
- Custom rate limiting rule
```
