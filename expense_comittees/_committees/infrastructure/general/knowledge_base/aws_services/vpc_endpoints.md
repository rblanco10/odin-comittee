# VPC Endpoints

## Source
`infrastructure/lib/stacks/network-stack.js`

## Configured Endpoints

### Gateway Endpoints (Free)
```javascript
// S3 Gateway Endpoint
vpc.addGatewayEndpoint('S3Endpoint', {
  service: GatewayVpcEndpointAwsService.S3
});
```

### Interface Endpoints (Hourly + Data)
```javascript
// ECR API and Docker
vpc.addInterfaceEndpoint('EcrApiEndpoint', {
  service: InterfaceVpcEndpointAwsService.ECR
});
vpc.addInterfaceEndpoint('EcrDkrEndpoint', {
  service: InterfaceVpcEndpointAwsService.ECR_DOCKER
});

// CloudWatch Logs
vpc.addInterfaceEndpoint('LogsEndpoint', {
  service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS
});

// Secrets Manager
vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
  service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER
});
```

## Cost Benefit
Without VPC Endpoints:
- ECR pulls → NAT Gateway → $0.045/GB
- CloudWatch Logs → NAT Gateway → $0.045/GB
- Secrets retrieval → NAT Gateway → $0.045/GB

With VPC Endpoints:
- Traffic stays in VPC (no NAT)
- ~$7.20/month per endpoint
- Significant savings at scale

## Missing Endpoints (Consider Adding)
- KMS (for encryption operations)
- STS (for IAM role assumption)
- CloudWatch Metrics (if heavy metrics)

## Security Benefit
- Traffic never traverses public internet
- Reduced attack surface
- Simpler network ACL management
