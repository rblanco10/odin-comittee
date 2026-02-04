# SC05 Focus Areas

## Current Security State

### Good Practices
- KMS encryption with rotation ✓
- Secrets Manager for credentials ✓
- WAF with OWASP rules ✓
- TLS for Redis ✓
- VPC Flow Logs ✓

### Concerns
- Grafana admin password may be hardcoded
- ECS Exec enabled (debug access)
- S3 uses SSE-S3 not SSE-KMS
- Two different WAF configurations exist

### Compliance Status
| Control | Status |
|---------|--------|
| Encryption at rest | ✓ |
| Encryption in transit | ✓ |
| Access logging | Partial |
| Secrets management | ✓ |
| Network segmentation | ✓ |

## Priority Items
1. Move Grafana credentials to Secrets Manager
2. Review ECS Exec for production
3. Consolidate WAF configurations
4. Complete access logging
