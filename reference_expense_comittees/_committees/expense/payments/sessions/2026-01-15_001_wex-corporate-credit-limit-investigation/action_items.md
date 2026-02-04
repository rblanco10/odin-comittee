# Action Items

> **Session ID**: 2026-01-15_001_wex-corporate-credit-limit-investigation  
> **Date**: 2026-01-15

---

## Critical: Credential Resolution

| ID | Item | Assigned To | Priority | Status |
|----|------|-------------|----------|--------|
| AI-007 | Contact WEX to verify correct SOAP API credentials for GetCorporateAvailable | Human Director | HIGH | 🔴 Pending |
| AI-008 | Verify if ORG_ID should be `WEXWB55911841915` instead of `Paystand DEV ACCT` | Human Director | HIGH | 🔴 Pending |
| AI-009 | Get correct values for BANK_NUMBER and COMPANY_NUMBER from WEX | Human Director | MEDIUM | 🔴 Pending |

---

## Questions for WEX Account Manager

1. What are the correct SOAP API credentials for the EnCompass AccountService?
   - OrgGroupLoginId: Should this be `Paystand DEV ACCT` or `WEXWB55911841915`?
   - Username: Is `Webservices` correct?
   - Password: Is `W31T#%v=X3x33` correct?

2. What BankNumber and CompanyNumber should be used for our organization?

3. Is the `GetCorporateAvailable` operation enabled for our account?

4. Are these production or sandbox credentials?

---

## Environment Variables to Configure

Once credentials are verified, set these in `.env`:

```bash
WEX_FLEET_ORG_ID=<verified_org_id>
WEX_FLEET_SOAP_USERNAME=<verified_username>
WEX_FLEET_SOAP_PASSWORD=<verified_password>
WEX_FLEET_SOAP_BANK_NUMBER=<verified_bank_number>
WEX_FLEET_SOAP_COMPANY_NUMBER=<verified_company_number>
```

---

## Verification Steps After Credential Fix

1. Restart the Phoenix server to load new env vars
2. Run in IEx to test:
   ```elixir
   FlameTeampayPayables.EmberPayments.Services.WexFundingService.get_corporate_credit_limits()
   ```
3. Expected success response:
   ```elixir
   {:ok, %{credit_limit: 200.0, available_balance: 136.09, ...}}
   ```
4. Verify UI shows $200 instead of $220,003+

---

## Future Improvements (Lower Priority)

| ID | Item | Assigned To | Priority | Status |
|----|------|-------------|----------|--------|
| AI-010 | Consider improving fallback behavior to not show misleading "Credit Limit" | Engineering | LOW | 📋 Backlog |
| AI-011 | Make primary account name configurable instead of hardcoded | Engineering | LOW | 📋 Backlog |
