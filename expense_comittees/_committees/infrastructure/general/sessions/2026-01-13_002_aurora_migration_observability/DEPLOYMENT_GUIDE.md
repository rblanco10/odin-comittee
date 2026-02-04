# Aurora Serverless v2 Migration - Deployment Guide

## ✅ Migration Status: READY FOR DEPLOYMENT

The infrastructure code has been successfully updated to deploy Aurora Serverless v2 with autoscaling capabilities.

---

## 📋 What Was Changed

### 1. **Aurora Serverless v2 Stack** ✅
- **File**: `infrastructure/lib/stacks/aurora-stack.js`
- **Changes**:
  - Aurora Serverless v2 PostgreSQL 15.12
  - Autoscaling: 0.5 ACU (min) → 4 ACU (max)
  - Security group allows connections from VPC CIDR (10.0.0.0/16)
  - Automatic secret rotation (30 days)
  - Deletion protection enabled
  - IAM authentication enabled
  - 7-day backup retention

### 2. **Main Application Stack** ✅
- **File**: `infrastructure/bin/app.js`
- **Changes**:
  - Added Aurora stack instantiation
  - Commented out old RDS PostgreSQL stack
  - Updated ECS to connect directly to Aurora
  - Updated Metabase to use Aurora credentials
  - Updated all stack dependencies

### 3. **ECS Stack** ✅
- **Changes**:
  - Database endpoint: Aurora cluster endpoint (direct connection)
  - Secret name: `infrastructure-demo-dev-aurora-credentials`
  - Security group: Aurora security group (allows ECS ingress)

### 4. **RDS Proxy** ⏸️ **PHASE 2**
- **Status**: Temporarily disabled due to circular dependency
- **Reason**: CDK cannot resolve circular dependency between Aurora and RDS Proxy
- **Plan**: Will be added in Phase 2 after Aurora is stable

---

## 🚀 Deployment Steps

### Prerequisites
```bash
# Ensure you have AWS credentials configured
export AWS_PROFILE=375418927329_administrator
# Or use the session token provided by the user

# Navigate to infrastructure directory
cd /Users/rmendez/Documents/Paystand/ashwood/infrastructure
```

### Step 1: Backup Current RDS Database (CRITICAL)
```bash
# Create a final snapshot of the current RDS PostgreSQL database
aws rds create-db-snapshot \
    --db-instance-identifier infrastructure-demo-dev-dbinstance \
    --db-snapshot-identifier infrastructure-demo-dev-final-backup-$(date +%Y%m%d-%H%M%S) \
    --region us-east-1

# Wait for snapshot to complete (5-10 minutes)
aws rds wait db-snapshot-completed \
    --db-snapshot-identifier infrastructure-demo-dev-final-backup-$(date +%Y%m%d-%H%M%S) \
    --region us-east-1
```

### Step 2: Deploy Aurora Serverless v2
```bash
# Synthesize to verify configuration
npx cdk synth infrastructure-demo-dev-aurora --context environment=dev

# Deploy Aurora stack
npx cdk deploy infrastructure-demo-dev-aurora \
    --context environment=dev \
    --require-approval never

# Expected duration: 20-30 minutes
```

### Step 3: Verify Aurora Deployment
```bash
# Check Aurora cluster status
aws rds describe-db-clusters \
    --db-cluster-identifier infrastructure-demo-dev-aurora \
    --region us-east-1 \
    --query 'DBClusters[0].{Status:Status,Endpoint:Endpoint,Engine:Engine,EngineVersion:EngineVersion}'

# Verify secret exists
aws secretsmanager describe-secret \
    --secret-id infrastructure-demo-dev-aurora-credentials \
    --region us-east-1
```

### Step 4: Migrate Data from RDS to Aurora

**Option A: Using pg_dump/pg_restore (Recommended for Dev)**
```bash
# 1. Get RDS credentials
RDS_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id infrastructure-demo-dev-db-credentials \
    --region us-east-1 \
    --query SecretString --output text)

RDS_HOST=$(echo $RDS_SECRET | jq -r '.host')
RDS_USER=$(echo $RDS_SECRET | jq -r '.username')
RDS_PASS=$(echo $RDS_SECRET | jq -r '.password')
RDS_DB=$(echo $RDS_SECRET | jq -r '.dbname')

# 2. Get Aurora credentials
AURORA_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id infrastructure-demo-dev-aurora-credentials \
    --region us-east-1 \
    --query SecretString --output text)

AURORA_HOST=$(echo $AURORA_SECRET | jq -r '.host')
AURORA_USER=$(echo $AURORA_SECRET | jq -r '.username')
AURORA_PASS=$(echo $AURORA_SECRET | jq -r '.password')

# 3. Dump RDS database
PGPASSWORD=$RDS_PASS pg_dump \
    -h $RDS_HOST \
    -U $RDS_USER \
    -d $RDS_DB \
    -F c \
    -f /tmp/rds_backup_$(date +%Y%m%d).dump

# 4. Restore to Aurora
PGPASSWORD=$AURORA_PASS pg_restore \
    -h $AURORA_HOST \
    -U $AURORA_USER \
    -d infrastructure_demo \
    --no-owner \
    --no-acl \
    /tmp/rds_backup_$(date +%Y%m%d).dump
```

**Option B: Using AWS DMS (For Production)**
- Set up AWS Database Migration Service
- Create replication instance
- Configure source (RDS) and target (Aurora) endpoints
- Run full load + CDC migration
- Cutover when lag is minimal

### Step 5: Update ECS Service
```bash
# The ECS stack will automatically use the new Aurora endpoint
# Force new deployment to pick up the new database connection
npx cdk deploy infrastructure-demo-dev-ecs \
    --context environment=dev \
    --require-approval never

# Or force restart via AWS CLI
aws ecs update-service \
    --cluster infrastructure-demo-dev-ecs \
    --service infrastructure-demo-dev-app \
    --force-new-deployment \
    --region us-east-1
```

### Step 6: Verify Application Health
```bash
# Check ECS task status
aws ecs describe-services \
    --cluster infrastructure-demo-dev-ecs \
    --services infrastructure-demo-dev-app \
    --region us-east-1 \
    --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Health:healthCheckGracePeriodSeconds}'

# Check application logs
aws logs tail /ecs/infrastructure-demo-dev/app --follow --region us-east-1

# Test application endpoint
curl -I https://<ALB-DNS>/health
```

### Step 7: Monitor Aurora Performance
```bash
# Check Aurora metrics in CloudWatch
aws cloudwatch get-metric-statistics \
    --namespace AWS/RDS \
    --metric-name DatabaseConnections \
    --dimensions Name=DBClusterIdentifier,Value=infrastructure-demo-dev-aurora \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average \
    --region us-east-1

# Check ACU utilization
aws cloudwatch get-metric-statistics \
    --namespace AWS/RDS \
    --metric-name ServerlessDatabaseCapacity \
    --dimensions Name=DBClusterIdentifier,Value=infrastructure-demo-dev-aurora \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average,Maximum \
    --region us-east-1
```

### Step 8: Decommission Old RDS Instance (After 7 Days)
```bash
# ONLY after confirming Aurora is stable for 7+ days

# 1. Stop RDS instance (reversible)
aws rds stop-db-instance \
    --db-instance-identifier infrastructure-demo-dev-dbinstance \
    --region us-east-1

# 2. After another 7 days, delete RDS instance
aws rds delete-db-instance \
    --db-instance-identifier infrastructure-demo-dev-dbinstance \
    --final-db-snapshot-identifier infrastructure-demo-dev-dbinstance-final-snapshot \
    --region us-east-1

# 3. Remove database stack from CDK (optional)
# Comment out or remove database-stack.js references in app.js
```

---

## 📊 Aurora Serverless v2 Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| **Engine** | Aurora PostgreSQL 15.12 | Matches current RDS version |
| **Min Capacity** | 0.5 ACU | ~1 GB RAM, ~2 vCPUs |
| **Max Capacity** | 4 ACU | ~8 GB RAM, ~16 vCPUs |
| **Scaling** | Automatic | Scales based on CPU/connections |
| **Connections** | ~90 per ACU | Up to ~360 connections at 4 ACU |
| **Storage** | Auto-scaling | Starts at 10 GB, grows as needed |
| **Backup** | 7 days | Automated daily backups |
| **Encryption** | KMS | At rest and in transit |
| **Multi-AZ** | Yes | Automatic failover |
| **Deletion Protection** | Enabled | Prevents accidental deletion |

---

## 🔍 Monitoring & Observability

### Grafana Dashboards
- **Status**: Deployed and ready
- **Access**: `https://<ALB-DNS>/grafana`
- **Credentials**: `admin` / `admin` (change after first login)
- **Datasources**: Prometheus, Loki, Tempo (auto-configured)

### Key Metrics to Monitor
1. **Aurora ACU Utilization**: Should scale between 0.5-4 ACU
2. **Database Connections**: Should stay well below max (360 at 4 ACU)
3. **Query Performance**: P50, P95, P99 latencies
4. **ECS Task Health**: Task restarts, CPU/memory usage
5. **Application Errors**: Error rates in Loki logs

### Loki Log Queries
```logql
# Database connection errors
{service="infrastructure-demo-dev-app"} |= "database" |= "error"

# Aurora-specific logs
{service="infrastructure-demo-dev-app"} |= "aurora" or "postgres"

# Slow queries
{service="infrastructure-demo-dev-app"} |= "slow query"
```

---

## 🚨 Rollback Plan

If issues occur during or after migration:

### Immediate Rollback (Within 1 Hour)
```bash
# 1. Revert ECS to use old RDS endpoint
# Edit app.js to use old RDS endpoint temporarily
# OR update ECS task definition environment variables manually

# 2. Force ECS service update
aws ecs update-service \
    --cluster infrastructure-demo-dev-ecs \
    --service infrastructure-demo-dev-app \
    --force-new-deployment \
    --region us-east-1

# 3. Monitor recovery
aws logs tail /ecs/infrastructure-demo-dev/app --follow --region us-east-1
```

### Full Rollback (After Data Migration)
```bash
# 1. Restore RDS from snapshot
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier infrastructure-demo-dev-dbinstance-restored \
    --db-snapshot-identifier infrastructure-demo-dev-final-backup-YYYYMMDD-HHMMSS \
    --region us-east-1

# 2. Wait for RDS to be available (10-15 minutes)
aws rds wait db-instance-available \
    --db-instance-identifier infrastructure-demo-dev-dbinstance-restored \
    --region us-east-1

# 3. Update ECS to use restored RDS
# Revert app.js changes and redeploy
```

---

## 💰 Cost Comparison

| Component | Old (RDS PostgreSQL) | New (Aurora Serverless v2) |
|-----------|---------------------|----------------------------|
| **Database** | ~$30/month (t3.small) | ~$43/month (0.5-4 ACU) |
| **Storage** | $0.115/GB | $0.10/GB (10% cheaper) |
| **Backup** | Included | Included |
| **I/O** | Included | $0.20/million requests |
| **Total (Est.)** | ~$35/month | ~$50/month |
| **Benefit** | Fixed capacity | **Autoscaling + High Availability** |

**Note**: Aurora costs more but provides:
- ✅ Autoscaling (0.5-4 ACU)
- ✅ Better performance
- ✅ Automatic failover
- ✅ No connection exhaustion
- ✅ Ready for load testing

---

## 📝 Phase 2: RDS Proxy (Future)

### Why RDS Proxy is Disabled
- Circular dependency issue in CDK
- Aurora → RDS Proxy → Aurora creates a cycle
- Will be addressed in Phase 2

### Phase 2 Plan
1. Deploy RDS Proxy in a separate CDK app
2. OR combine Aurora + RDS Proxy into a single stack
3. Update ECS to use RDS Proxy endpoint
4. Benefits: Connection pooling, reduced connection overhead

### Workaround for Now
- Aurora Serverless v2 handles connections well (up to 360)
- ECS tasks (2-4) with 20 connections each = 40-80 connections
- Well within Aurora's capacity
- Connection pooling can be added later if needed

---

## ✅ Success Criteria

- [ ] Aurora cluster status: `available`
- [ ] ECS tasks running: 2/2 healthy
- [ ] Application accessible via ALB
- [ ] Database connections stable (< 100)
- [ ] No errors in application logs
- [ ] Grafana dashboards showing metrics
- [ ] Load testing passes (100+ concurrent users)

---

## 🆘 Support

If you encounter issues:
1. Check CloudWatch logs: `/ecs/infrastructure-demo-dev/app`
2. Check Aurora metrics in CloudWatch
3. Verify security group rules allow ECS → Aurora (port 5432)
4. Check Grafana for real-time metrics
5. Review this guide's Rollback Plan section

---

## 📚 References

- [Aurora Serverless v2 Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [Aurora PostgreSQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
- [CDK RDS Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds-readme.html)

---

**Migration prepared by**: Infrastructure General Committee  
**Date**: 2026-01-13  
**Session**: 002 - Aurora Migration & Observability Enhancement
