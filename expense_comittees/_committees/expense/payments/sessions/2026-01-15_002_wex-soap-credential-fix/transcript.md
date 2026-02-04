# Session Transcript

> **Session ID**: 2026-01-15_002_wex-soap-credential-fix  
> **Date**: 2026-01-15

---

## Session Opening

**CHAIR OPENING STATEMENT**

This is Victoria Sterling, Chair, calling to order session 2026-01-15_002_wex-soap-credential-fix.

**SESSION GOAL**: Fix the WEX SOAP API `InvalidLogonCredentials` error to display correct credit limits.

**ACTIVATED MEMBERS**:
- Michelle Park (PS004), WEX Fleet Specialist - Deep WEX API knowledge
- Ryan Mitchell (TS004), API Integration Expert - SOAP troubleshooting
- Dr. Eleanor Vance (C001), Security Adversary - Credential security review
- Elena Rodriguez (C003), Failure Advocate - Failure mode analysis
- Samuel Reed (H003), Debt Archaeologist - Technical debt context
- Emily Watson (CL001), Recording Clerk - Transcript
- Carlos Mendez (CL002), Research Clerk - Code investigation

**SESSION STATUS**: IN PROGRESS

---

## Turn 1: Session Historian Context

### Dr. Henry Blackwood — Turn 1

*Session Historian, Historians*

**I am Dr. Henry Blackwood**, and I am providing context from our previous session.

**Relevant History**:

From session `2026-01-15_001_wex-corporate-credit-limit-investigation`:

1. We traced the data flow from UI to SOAP API
2. Discovered `InvalidLogonCredentials` error
3. Verified credentials ARE loading (no escaping issues)
4. WEX portal shows Group code `WEXWB55911841915` but we use `Paystand DEV ACCT`

**Key Observation**: The WEX portal "Group code" (`WEXWB55911841915`) may need to be used as the `OrgGroupLoginId` instead of `Paystand DEV ACCT`.

**Handoff:**
→ Michelle Park (WEX Fleet Specialist) for WEX-specific API guidance

---

## Turn 2: WEX Fleet Specialist Analysis

### Michelle Park — Turn 2

*WEX Fleet Specialist, Provider Specialists*

**I am Michelle Park**, WEX Fleet Specialist, and I'm examining the credential structure.

**WEX EnCompass API Credential Model**:

The WEX EnCompass SOAP API uses a specific credential structure:

1. **OrgGroupLoginId** - This is the organization identifier in WEX's system
   - This should match what WEX assigned to your account
   - Often looks like `WEXWB########` or a descriptive name WEX provided

2. **Username** - The API user account
   - Usually `Webservices` or a specific API user name
   - Not the portal login username

3. **Password** - The API password
   - Specific to API access, not portal password

4. **BankNumber / CompanyNumber** - Hierarchical organization within WEX
   - These identify which sub-entity you're querying
   - Default values often don't work if your org structure differs

**Handoff:**
→ Ryan Mitchell (API Integration Expert) to help test the credential change

---

## Turn 3: Documentation Review

### Carlos Mendez — Turn 3

*Research Clerk, Clerical*

**I am Carlos Mendez**, Research Clerk. I reviewed the official WEX SOAP documentation at `campsite/.temp/WEX_SOAP.MD`.

**Key Findings from GetCorporateAvailable Documentation (Pages 27-28)**:

The API requires:

1. **User Credentials** (provided by EnCompass Team):
   - `OrgGroupLoginId` - Organization identifier
   - `Username` - API username
   - `Password` - API password

2. **Request Parameters**:
   - `BankNumber` - Identifies your organization
   - `CompanyNumber` - Identifies your organization
   - `AccountNumber` (optional) - Specific account to query

**Sample Code Reference (Pages 29-30)**:

```csharp
var user = new User {
    OrgGroupLoginId = "ENCOMPASSTEST",  // Simple string, not a UUID
    Username = "TestUser",
    Password = "password",
};

req.BankNumber = "2272";       // 4-digit organization identifier
req.CompanyNumber = "0099996"; // Organization identifier
```

**Critical Insight**: Per the documentation, "BankNumber and CompanyNumber **must match an organization associated with the Organization Group** identified in user.OrgGroupLoginID."

**Handoff:**
→ Ryan Mitchell (API Integration Expert) for environment configuration

---

## Turn 4: Environment Configuration Issues Discovered

### Ryan Mitchell — Turn 4

*API Integration Expert, Technical Specialists*

**I am Ryan Mitchell**, API Integration Expert. I investigated why the credentials weren't working.

**ISSUES DISCOVERED**:

1. **Variable Name Mismatch**: The code read from `WEX_FLEET_ORG_ID`, but Human Director set `WEX_FLEET_SOAP_ORG_GROUP_LOGIN_ID`.

2. **Env Vars Not in .env File**: The new credentials weren't in the `.env` file at all.

3. **Spaces Around `=` Signs**: Existing SOAP vars had invalid format:
   ```
   WEX_FLEET_SOAP_USERNAME = Webservices   # WRONG (spaces)
   WEX_FLEET_SOAP_USERNAME=Webservices     # CORRECT (no spaces)
   ```

4. **Missing Variables**: `WEX_FLEET_SOAP_BANK_NUMBER` and `WEX_FLEET_SOAP_COMPANY_NUMBER` were not defined.

**FIXES APPLIED**:

1. Updated `wex_funding_service.ex` to read from `WEX_FLEET_SOAP_ORG_GROUP_LOGIN_ID` with fallback to `WEX_FLEET_ORG_ID`.

2. Fixed `.env` file:
   - Removed spaces around `=` signs
   - Updated password from `W31T#%v=X3x33` to `31T#%v=X3x33`
   - Added new variables:
     ```
     WEX_FLEET_SOAP_ORG_GROUP_LOGIN_ID=PaystandGroup
     WEX_FLEET_SOAP_BANK_NUMBER=0010
     WEX_FLEET_SOAP_COMPANY_NUMBER=0011267
     ```

**VERIFICATION**: After restarting IEx with `source .env && iex -S mix phx.server`:

```elixir
New credentials: %{
  username: "Webservices",
  password: "31T#%v=X3x33",
  org_id: "PaystandGroup",
  bank_number: "0010",
  company_number: "0011267"
}
```

All credentials now loading correctly.

**Status**: Ready for API test.

---

## Turn 5: Awaiting API Test Result

### Victoria Sterling — Turn 5

*Chair, Leadership*

**CHAIR**: The credentials are now properly configured. We are awaiting the Human Director to execute the test:

```elixir
FlameTeampayPayables.EmberPayments.Services.WexFundingService.get_corporate_credit_limits()
```

**Expected Outcomes**:
- `{:ok, %{credit_limit: 200.0, ...}}` — Success, credentials valid
- `{:error, {:wex_error, "InvalidLogonCredentials"}}` — Credentials still invalid, need WEX verification
- Other error — Different issue to investigate

**Session paused pending test result.**

---

## Session Closing

### Victoria Sterling — Closing

*Chair, Leadership*

**CHAIR**: This session is being closed at the Human Director's request.

**REASON**: Human Director wishes to proceed with session 003 (multi-entity credit limit gap) while credential verification is pending with WEX.

**STATUS**: CLOSED (Pending External Verification)

**Summary**:
- Fixed code to read `WEX_FLEET_SOAP_ORG_GROUP_LOGIN_ID`
- Fixed `.env` file spacing issues
- Added missing environment variables
- Verified credentials load correctly
- API test with new credentials pending external verification with WEX

**Carryover to Action Items**:
- Verify credentials with WEX account manager
- Re-test API after verification

---

*End of Transcript*
