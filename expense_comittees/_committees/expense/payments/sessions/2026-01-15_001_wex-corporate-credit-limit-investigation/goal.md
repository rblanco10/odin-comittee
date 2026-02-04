# Session Goal

> **Session ID**: 2026-01-15_001_wex-corporate-credit-limit-investigation  
> **Opened**: 2026-01-15T19:20:00Z  
> **Status**: COMPLETED (findings documented, action items pending)

---

## Primary Objective

Understand how the WEX `GetCorporateAvailable` SOAP API call works and investigate why the Credit Limit displayed in the UI ($220,003) does not match the WEX portal value ($200).

---

## Success Criteria

- [x] Trace the complete data flow from WEX API to UI display
- [x] Identify why the displayed value differs from WEX portal
- [x] Determine root cause of the discrepancy
- [x] Document findings and action items

---

## Scope Boundaries

**IN SCOPE:**
- WEX `GetCorporateAvailable` SOAP API
- `WexFundingService.get_corporate_credit_limits/0`
- `CardFundingLive` UI display
- Credential configuration

**OUT OF SCOPE:**
- Other WEX API operations
- Fixing the credential issue (requires WEX account manager)

---

## Expected Outputs

- [x] Documentation of how the API works
- [x] Root cause analysis of the display discrepancy
- [x] Action items for resolution
