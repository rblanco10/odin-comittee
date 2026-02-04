# Operational Runbooks Index

## Critical Runbooks (To Be Created)

### Incident Response
1. `incident_response.md` - General incident handling
2. `database_outage.md` - Aurora failure procedures
3. `redis_outage.md` - ElastiCache failure procedures
4. `ecs_task_failure.md` - Container crash handling
5. `high_error_rate.md` - Application error spike

### Routine Operations
1. `deployment_procedure.md` - Standard deployment steps
2. `rollback_procedure.md` - Emergency rollback
3. `scaling_manual.md` - Manual scaling procedures
4. `log_analysis.md` - Troubleshooting via logs
5. `database_maintenance.md` - Backup verification, vacuuming

### Emergency Procedures
1. `disaster_recovery.md` - Full DR activation
2. `security_incident.md` - Security breach response
3. `data_restoration.md` - Point-in-time recovery

## Runbook Template
```markdown
# [Runbook Name]

## Overview
Brief description of when to use this runbook.

## Prerequisites
- Access requirements
- Tools needed

## Steps
1. Step 1
2. Step 2
...

## Verification
How to confirm the issue is resolved.

## Escalation
Who to contact if steps fail.
```
