# Action Items

> **Session ID**: 2026-01-15_002_wex-soap-credential-fix  
> **Date**: 2026-01-15

---

## Completed This Session

| ID | Item | Status |
|----|------|--------|
| T-001 | Fix code to read `WEX_FLEET_SOAP_ORG_GROUP_LOGIN_ID` | ✅ Completed |
| T-002 | Fix `.env` spacing issues | ✅ Completed |
| T-003 | Add missing SOAP env vars to `.env` | ✅ Completed |
| T-004 | Verify credentials load correctly in IEx | ✅ Completed |

---

## Pending

| ID | Item | Status |
|----|------|--------|
| T-005 | Execute API test with new credentials | ⏳ Awaiting Human Director |
| T-006 | Document API response | ⏳ Pending |

---

## Code Changes Made

### `wex_funding_service.ex` (line 34)

**Before:**
```elixir
org_id = System.get_env("WEX_FLEET_ORG_ID")
```

**After:**
```elixir
org_id = System.get_env("WEX_FLEET_SOAP_ORG_GROUP_LOGIN_ID") || System.get_env("WEX_FLEET_ORG_ID")
```

### `.env` File Updates

**Fixed spacing:**
```
WEX_FLEET_SOAP_USERNAME=Webservices       # removed spaces
WEX_FLEET_SOAP_PASSWORD=31T#%v=X3x33      # removed spaces, updated value
```

**Added new variables:**
```
WEX_FLEET_SOAP_ORG_GROUP_LOGIN_ID=PaystandGroup
WEX_FLEET_SOAP_BANK_NUMBER=0010
WEX_FLEET_SOAP_COMPANY_NUMBER=0011267
```

---

## Carried Forward from Previous Session

| ID | Item | Original ID | Status |
|----|------|-------------|--------|
| CF-001 | Verify correct SOAP credentials with WEX | AI-007 | 🔄 Testing in progress |
| CF-002 | Verify ORG_ID value | AI-008 | ✅ Using `PaystandGroup` per Human Director |
| CF-003 | Get correct BankNumber/CompanyNumber | AI-009 | ✅ Using `0010`/`0011267` per Human Director |
