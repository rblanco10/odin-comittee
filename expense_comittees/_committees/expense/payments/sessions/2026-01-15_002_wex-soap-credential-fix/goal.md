# Session Goal

> **Session ID**: 2026-01-15_002_wex-soap-credential-fix  
> **Date**: 2026-01-15  
> **Type**: Bug Investigation / Credential Resolution

---

## Primary Objective

**Fix the WEX SOAP API `InvalidLogonCredentials` error** that is preventing the GetCorporateAvailable API from returning the correct credit limit, causing the Card Funding page to show misleading fallback values ($220,003 instead of $200).

---

## Success Criteria

- [x] Identify the correct WEX SOAP credentials
- [ ] Successfully call `WexFundingService.get_corporate_credit_limits()` without credential errors *(pending external verification)*
- [ ] Verify the returned credit limit matches WEX portal ($200) *(pending)*
- [x] Document the correct credential configuration

**SESSION STATUS**: CLOSED (Pending External Verification with WEX)

---

## Scope Boundaries

**IN SCOPE**:
- WEX SOAP API credentials investigation
- Testing GetCorporateAvailable endpoint
- Environment variable configuration
- Credential validation approaches

**OUT OF SCOPE**:
- Fallback behavior improvements (separate session)
- Other WEX API operations
- Production deployment

---

## Context from Previous Session

From `2026-01-15_001_wex-corporate-credit-limit-investigation`:

1. **Root Cause**: SOAP API returns `InvalidLogonCredentials`
2. **Current Credentials**:
   - `WEX_FLEET_ORG_ID`: `Paystand DEV ACCT`
   - `WEX_FLEET_SOAP_USERNAME`: `Webservices`
   - `WEX_FLEET_SOAP_PASSWORD`: `W31T#%v=X3x33`
   - `WEX_FLEET_SOAP_BANK_NUMBER`: Not set (defaults to `0010`)
   - `WEX_FLEET_SOAP_COMPANY_NUMBER`: Not set (defaults to `0011267`)
3. **WEX Portal Reference**:
   - Account: `WB Paystand 81134671`
   - Group code: `WEXWB55911841915`
   - Total credit limit: `$200.00 USD`
4. **Key Question**: Should ORG_ID be `WEXWB55911841915` instead of `Paystand DEV ACCT`?

---

## Expected Outputs

- [ ] Working credential configuration
- [ ] Successful API response with credit limit
- [ ] Updated action items with resolution status
