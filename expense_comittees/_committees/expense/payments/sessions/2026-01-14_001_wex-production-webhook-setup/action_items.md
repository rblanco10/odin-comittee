# Action Items

**Session**: 2026-01-14_001_wex-production-webhook-setup

---

## Completed Actions

| ID | Action | Owner | Status |
|----|--------|-------|--------|
| A-001 | Delete `00b_wex_dev_setup.exs` | Agent | ✅ Done |
| A-002 | Delete `00_wex_provider_setup.exs` | Agent | ✅ Done |
| A-003 | Rewrite `01_wex_payment_connection.exs` to be production-only | Agent | ✅ Done |
| A-004 | Verify seed runs successfully | Agent | ✅ Done |

---

## Pending Actions (External)

| ID | Action | Owner | Status |
|----|--------|-------|--------|
| A-005 | Run seed in deployed dev environment | Deployment Manager | 🔴 Pending |
| A-006 | Set WEX_WEBHOOK_USERNAME and WEX_WEBHOOK_PASSWORD env vars | Deployment Manager | 🔴 Pending |
| A-007 | Provide webhook URLs to WEX | Human Director | 🔴 Pending |
| A-008 | Configure WEX to send webhooks to new URLs | WEX Account Manager | 🔴 Pending |

---

## Deployment Instructions

For the deployment manager:

```bash
# 1. Ensure all required env vars are set
# 2. Run the seed
cd campsite/flames/flame_teampay_payables
mix run priv/repo/seeds/dev/wex/01_wex_payment_connection.exs
```

The seed will:
- Fail fast if required credentials are missing
- Create WorkspaceProviderConfig (enables WEX)
- Create EntityProviderAccount (links entity to WEX org)
- Create PaymentConnection with static ID
- Output the webhook URLs to give to WEX
