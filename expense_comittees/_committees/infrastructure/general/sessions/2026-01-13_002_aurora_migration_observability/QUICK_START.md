# Aurora Serverless v2 Migration - Quick Start

## 🚀 TL;DR - Deploy in 5 Steps

```bash
# 1. Backup current database (10 min)
aws rds create-db-snapshot \
    --db-instance-identifier infrastructure-demo-dev-dbinstance \
    --db-snapshot-identifier infrastructure-demo-dev-backup-$(date +%Y%m%d) \
    --region us-east-1

# 2. Deploy Aurora (25 min)
cd /Users/rmendez/Documents/Paystand/ashwood/infrastructure
npx cdk deploy infrastructure-demo-dev-aurora --context environment=dev

# 3. Migrate data (30-60 min)
# See DEPLOYMENT_GUIDE.md Step 4 for detailed instructions

# 4. Update ECS (10 min)
npx cdk deploy infrastructure-demo-dev-ecs --context environment=dev

# 5. Verify (15 min)
aws ecs describe-services \
    --cluster infrastructure-demo-dev-ecs \
    --services infrastructure-demo-dev-app \
    --region us-east-1
```

## ✅ What You Get

- **Autoscaling**: 0.5 → 4 ACU (automatic)
- **Connections**: Up to 360 (no more exhaustion!)
- **High Availability**: Multi-AZ with automatic failover
- **Monitoring**: Grafana + Loki ready
- **Cost**: +$13/month (~$48 total)

## 📚 Full Documentation

- **Complete Guide**: `DEPLOYMENT_GUIDE.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Technical Notes**: `notes.md`

## 🆘 Emergency Rollback

```bash
# Revert ECS to old RDS (if needed)
aws ecs update-service \
    --cluster infrastructure-demo-dev-ecs \
    --service infrastructure-demo-dev-app \
    --force-new-deployment \
    --region us-east-1
```

## 📊 Monitor After Deployment

- **Grafana**: `https://<ALB-DNS>/grafana` (admin/admin)
- **CloudWatch**: Check Aurora metrics
- **Logs**: `/ecs/infrastructure-demo-dev/app`

---

**Ready?** → See `DEPLOYMENT_GUIDE.md` for detailed steps
