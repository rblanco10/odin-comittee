# Decisions

> **Session ID**: 2026-01-15_002_wex-soap-credential-fix  
> **Date**: 2026-01-15

---

## Decisions Made

### Decision 1: Update Code to Support New Env Var Name

**Proposed by**: Ryan Mitchell (API Integration Expert)  
**Seconded by**: Victoria Sterling (Chair)

**Description**: Update `wex_funding_service.ex` to read from `WEX_FLEET_SOAP_ORG_GROUP_LOGIN_ID` with fallback to `WEX_FLEET_ORG_ID`.

**Rationale**: The new variable name better matches the WEX documentation field name (`OrgGroupLoginId`), making it clearer what the value represents.

**Vote**: Unanimous (no objections)

**Result**: ✅ APPROVED AND IMPLEMENTED

---

### Decision 2: Use Human Director's Credentials

**Proposed by**: Victoria Sterling (Chair)

**Description**: Use the credentials provided by Human Director:
- `OrgGroupLoginId`: `PaystandGroup`
- `Username`: `Webservices`
- `Password`: `31T#%v=X3x33`
- `BankNumber`: `0010`
- `CompanyNumber`: `0011267`

**Rationale**: Human Director received these from WEX directly.

**Vote**: N/A (Human Director directive)

**Result**: ✅ APPLIED

---

## Pending Validation

### Proposal: Accept Credentials as Valid

**Status**: CLOSED (Pending External Verification)

Session closed by Human Director request. API test with new credentials pending external verification with WEX account manager.

**Carryover Items**:
- Verify correct `OrgGroupLoginId` with WEX
- Re-test API after verification
- See ACTION ITEMS AI-001 through AI-009 in STATUS.md
