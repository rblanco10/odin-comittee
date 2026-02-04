# Session Decisions

**Session**: 2026-01-14_001_wex-production-webhook-setup

---

## Decisions Made

### D-001: Delete Placeholder/Mock Seed File

**Decision**: Delete `00b_wex_dev_setup.exs`

**Rationale**: This file created WEX configurations with fake placeholder values (`DEV_ORG_001`, `DEV_BANK`, etc.) and defaulted to sandbox environment. It provided no value for production and only created confusion.

**Status**: ✅ Implemented

---

### D-002: Delete Redundant Provider Setup Seed

**Decision**: Delete `00_wex_provider_setup.exs`

**Rationale**: This file contained UAT/sandbox fallback logic and was redundant with the new `01_wex_payment_connection.exs` which handles all three resources (WorkspaceProviderConfig, EntityProviderAccount, PaymentConnection) in one file.

**Status**: ✅ Implemented

---

### D-003: Use Static Connection ID for WEX

**Decision**: Hard-code WEX PaymentConnection ID as `65fad209-1118-46fa-8376-38d6e9b8ac0b`

**Rationale**: Webhook URLs include the connection ID in the path. Using a static ID ensures webhook URLs remain stable across database resets, matching the pattern used by Checkbook and Dwolla.

**Status**: ✅ Implemented

---

### D-004: Production-Only Environment

**Decision**: Remove all UAT/sandbox environment mapping logic; hard-code `:production` environment

**Rationale**: Per Human Director directive, the deployed dev environment is production-like and should not support UAT/sandbox configurations. This simplifies the seed and prevents accidental sandbox deployments.

**Status**: ✅ Implemented

---

### D-005: Fail-Fast on Missing Credentials

**Decision**: Seed file should fail immediately if required WEX credentials are not set

**Rationale**: Silent fallbacks to placeholder values could result in broken production deployments. Failing fast with clear error messages ensures proper configuration before deployment.

**Status**: ✅ Implemented

---

## Webhook URLs (For WEX)

**Transactions** (settled purchases, refunds, chargebacks):
```
https://dev.teampay.io/webhooks/wex_fleet/65fad209-1118-46fa-8376-38d6e9b8ac0b/transactions
```

**Authorizations** (real-time card swipes):
```
https://dev.teampay.io/webhooks/wex_fleet/65fad209-1118-46fa-8376-38d6e9b8ac0b/authorizations
```

---

## Required Environment Variables

```bash
# WEX API (REQUIRED - seed fails without these)
WEX_FLEET_CLIENT_ID
WEX_FLEET_CLIENT_SECRET
WEX_FLEET_ORG_ID
WEX_FLEET_USERNAME
WEX_FLEET_PASSWORD

# Webhook Auth (REQUIRED for receiving webhooks)
WEX_WEBHOOK_USERNAME
WEX_WEBHOOK_PASSWORD

# Optional
WEX_FLEET_ORG_BANK_ID      # default: 0010
WEX_FLEET_ORG_COMPANY_ID   # default: 0011304
WEX_FLEET_POOL_NAME
```
