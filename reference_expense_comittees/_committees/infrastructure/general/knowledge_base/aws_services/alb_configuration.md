# Application Load Balancer

## Source
`infrastructure/lib/stacks/alb-stack.js`

## ALB Setup
```javascript
// From alb-stack.js
const alb = new ApplicationLoadBalancer(this, 'ALB', {
  vpc,
  internetFacing: true,
  securityGroup: albSecurityGroup,
  vpcSubnets: { subnetType: SubnetType.PUBLIC }
});
```

## Listeners
- **HTTP (80)**: Redirects to HTTPS
- **HTTPS (443)**: SSL termination via ACM certificate

## Target Groups
1. **Application**: Port 4000, Phoenix app
2. **Grafana**: Port 3000, monitoring dashboards

## Health Check Configuration
```javascript
healthCheck: {
  path: '/health',
  interval: Duration.seconds(30),
  timeout: Duration.seconds(5),
  healthyThresholdCount: 2,
  unhealthyThresholdCount: 5
}
```

## Sticky Sessions (LiveView)
```javascript
// Critical for Phoenix LiveView WebSockets
stickinessCookieDuration: Duration.days(1)
```

## Routing Rules
```javascript
// Path-based routing
'/grafana/*' → Grafana target group
'/*' → Application target group
```

## WAF Association
- WAF WebACL attached to ALB
- Protection at edge before reaching application
