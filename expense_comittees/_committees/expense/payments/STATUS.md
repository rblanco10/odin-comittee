# Committee Status

> **Last Updated**: 2026-01-26  
> **Updated By**: Victoria Sterling (Chair)  
> **Status**: `ACTIVE`

---

## Current State

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMITTEE STATUS                              │
├─────────────────────────────────────────────────────────────────┤
│  State:           ACTIVE                                         │
│  Active Session:  None                                           │
│  Last Completed:  2026-01-26_001_receipt-matching-card-transactions│
│  Members Active:  4                                              │
│  Pending Items:   Teampay implementation planning                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Last Completed Session

**Session**: 2026-01-26_001_receipt-matching-card-transactions  
**Goal**: Document and understand receipt matching for card transactions  
**Opened**: 2026-01-26  
**Closed**: 2026-01-26  
**Status**: ✅ COMPLETED

**Activated Members**:
- Victoria Sterling (Chair)
- Dr. Henry Blackwood (Pattern Historian)
- Emily Watson (Recording Clerk)
- Carlos Mendez (Research Clerk)

**Key Outputs**:
- ✅ Documented complete receipt matching architecture
- ✅ Created knowledge base entry: `knowledge_base/flows/receipt_matching_card_transactions.md`
- ✅ Identified 6 gaps for teampay implementation
- ✅ Documented two matching algorithms (batch + direct)

---

## Prior Completed Session

**Session**: 2026-01-15_003_wex-multi-entity-credit-limit  
**Goal**: Design solution for displaying correct WEX credit limit per workspace/entity  
**Opened**: 2026-01-15  
**Status**: PAUSED (awaiting implementation)

**Activated Members**:
- Victoria Sterling (Chair)
- Michelle Park (WEX Fleet Specialist)
- Derek Patterson (Multi-Tenancy Expert)
- Ryan Mitchell (API Integration Expert)
- Dr. William Chang (Capability Patterns Expert)
- Priya Sharma (Integration Pessimist)
- Yuki Tanaka (Edge Case Hunter)
- Samuel Reed (Debt Archaeologist)
- Emily Watson (Recording Clerk)
- Carlos Mendez (Research Clerk)

**Current Focus**: Design complete, awaiting implementation

**Progress**:
- ✅ Human Director closed session 002 (credential fix - pending external verification)
- ✅ Analyzed GET_CORPORATE_AVAILABLE_ANALYSIS.md
- ✅ Researched current implementation
- ✅ Designed solution for entity-aware credit limits
- ✅ Documented code changes, mapping strategy, sync strategy
- ✅ Created engineering handoff document
- ⏳ Awaiting implementation PR

---

## Prior Completed Sessions

**Session**: 2026-01-15_004_transaction-card-not-found-retry  
**Goal**: Test and verify the "Transaction Card Not Found (Retry)" flow in Marqeta webhook processing  
**Opened**: 2026-01-15  
**Closed**: 2026-01-15  
**Status**: ✅ COMPLETED - Retry flow verified working

**Active Members**:
- Victoria Sterling (L001) - Chair
- David Kim (PS003) - Marqeta Expert
- Dr. Henry Blackwood (H001) - Session Historian
- Elena Rodriguez (C003) - Failure Advocate (Critic)
- Emily Watson (CL001) - Recording Clerk

**Test Method**: Option A - "Orphan the Card" (delete card, trigger webhook, observe retry)

**Key Findings**:
1. ✅ When card not found, system returns `:retry_later`
2. ✅ Oban reschedules webhook for later processing
3. ✅ Log message: "Card not found for authorization webhook - will retry"

**Cleanup Note**: ExpenseCard record needs restoration (CardIssuance restored).

---

**Session**: 2026-01-15_002_wex-soap-credential-fix  
**Goal**: Fix WEX SOAP API `InvalidLogonCredentials` error to display correct credit limits  
**Opened**: 2026-01-15  
**Closed**: 2026-01-15  
**Status**: ✅ CLOSED (Pending External Verification)

**Summary**:
- Fixed code to read `WEX_FLEET_SOAP_ORG_GROUP_LOGIN_ID` with fallback
- Fixed `.env` file spacing issues and missing variables
- Verified credentials load correctly in IEx
- API test pending external verification with WEX account manager

**Key Finding**: Environment configuration issues resolved. Credential validity pending WEX confirmation.

---

**Session**: 2026-01-15_002_3ds-otp-user-not-found-testing  
**Goal**: Test and verify the "User Not Found" error scenarios in 3DS OTP Notification flow  
**Opened**: 2026-01-15  
**Closed**: 2026-01-15  
**Status**: ✅ COMPLETED - All testable error paths verified

**Tests Executed**:
1. ✅ `:card_not_found` - Fake card_token correctly returns error
2. ✅ `:user_not_found` - Fake user_token correctly returns error
3. ✅ `:no_identifier` - Missing identifiers correctly returns error

---

**Session**: 2026-01-15_001_marqeta-3ds-webhook-fix  
**Goal**: Fix Marqeta 3DS OTP webhook flow for cardholder notifications  
**Opened**: 2026-01-15  
**Closed**: 2026-01-15  
**Status**: ✅ COMPLETED - 3DS OTP emails now sending

**Fixes Applied**:
1. ✅ Fixed `normalize_webhook_payload` to handle `"threeds"` array (Marqeta adapter)
2. ✅ Fixed `lookup_user` schema mismatch (ThreeDsOtpNotificationService)

---

**Session**: 2026-01-14_004_wex-seed-api-fix  
**Goal**: Test WEX seed locally and fix any issues  
**Closed**: 2026-01-14  
**Status**: ✅ COMPLETED

---

**Session**: 2026-01-14_003_wex-seed-reorganization  
**Goal**: Reorganize WEX seed directory to match Dwolla/Checkbook/Marqeta conventions  
**Closed**: 2026-01-14  
**Status**: ✅ COMPLETED

**Session**: 2026-01-14_002_wex-seed-cleanup  
**Goal**: Analyze and clean up non-production WEX seed files  
**Closed**: 2026-01-14  
**Status**: ✅ COMPLETED

**Session**: 2026-01-14_001_wex-production-webhook-setup  
**Goal**: Configure WEX webhooks for deployed dev environment and create production-only seed suite  
**Closed**: 2026-01-14  
**Status**: ✅ COMPLETED

**Session**: 2026-01-13_001_checkbook-flow-tests  
**Goal**: Run and verify Checkbook flow test suite (18 flows, 542 tests)  
**Opened**: 2026-01-13  
**Closed**: 2026-01-13  
**Status**: ✅ COMPLETED - All 542 tests passing

**Session**: 2026-01-05_002_wex-card-operations  
**Goal**: Verify WEX Fleet card operations work correctly (issue, freeze, MCC, limits, close)  
**Closed**: 2026-01-14  
**Status**: ✅ CLOSED (Partial Success - 6/7 ops verified, MCC blocked)

**Session**: 2026-01-06_001_webhook-production-readiness  
**Goal**: Conduct a comprehensive production readiness review of the webhook infrastructure  
**Closed**: 2026-01-06  
**Status**: ✅ COMPLETED

**Session**: 2026-01-05_001_card-transaction-model  
**Goal**: Understand and explain card transaction model architecture  
**Closed**: 2026-01-06  
**Status**: ✅ COMPLETED

---

## Recent Decisions

| Date | Session | Decision | Status |
|------|---------|----------|--------|
| 2026-01-15 | transaction-card-not-found-retry | Card Not Found Retry flow verified working | ✅ Accepted |
| 2026-01-15 | marqeta-transaction-updated-flow | Transaction Updated flow verified working | ✅ Accepted |
| 2026-01-15 | marqeta-transaction-updated-flow | Document that `authorization.clearing` is the event for settlements | ✅ Accepted |
| 2026-01-15 | 3ds-otp-user-not-found-testing | Three error scenarios sufficient for verification | ✅ Accepted |
| 2026-01-15 | 3ds-otp-user-not-found-testing | Remaining scenarios documented for automated tests | ✅ Accepted |
| 2026-01-15 | marqeta-3ds-webhook-fix | Add `threeds` array normalization to Marqeta adapter | ✅ Applied |
| 2026-01-15 | marqeta-3ds-webhook-fix | Fix `lookup_user` to use correct schema paths | ✅ Applied |
| 2026-01-15 | wex-corporate-credit-limit-investigation | Credential issue identified, need WEX verification | 📋 Action Items |
| 2026-01-14 | wex-seed-api-fix | Fix seed to use Ash changeset pattern | ✅ Implemented |
| 2026-01-14 | wex-seed-api-fix | Use separate `:activate` action after create | ✅ Implemented |
| 2026-01-14 | wex-seed-reorganization | Move test seeds to `wex/tests/` subfolder | ✅ Implemented |
| 2026-01-14 | wex-seed-reorganization | Update `seeds.exs` with new paths | ✅ Implemented |
| 2026-01-14 | wex-seed-reorganization | Keep production seed at root (not in seeds.exs) | ✅ Accepted |
| 2026-01-14 | wex-seed-cleanup | Delete dev-only seed files (04, 05, update) | ✅ Implemented |
| 2026-01-14 | wex-production-webhook-setup | Use static connection ID for WEX | ✅ Implemented |

---

## Open Action Items

### HIGH PRIORITY: WEX SOAP Credential Issue

| ID | Item | Assigned To | Due | Status |
|----|------|-------------|-----|--------|
| AI-007 | Contact WEX to verify correct SOAP API credentials for GetCorporateAvailable | Human Director | ASAP | 🔴 Pending |
| AI-008 | Verify if ORG_ID should be `WEXWB55911841915` instead of `Paystand DEV ACCT` | Human Director | ASAP | 🔴 Pending |
| AI-009 | Get correct values for BANK_NUMBER and COMPANY_NUMBER from WEX | Human Director | ASAP | 🔴 Pending |

### WEX Webhook Setup (External Dependencies)

| ID | Item | Assigned To | Due | Status |
|----|------|-------------|-----|--------|
| AI-001 | Verify SOAP credentials with WEX account manager | Human Director | TBD | 🔴 Pending |
| AI-002 | Re-test MCC functionality after credentials fixed | Committee | After AI-001 | ⏸️ Blocked |
| AI-003 | Run WEX seed in deployed dev environment | Deployment Manager | ASAP | 🔴 Pending |
| AI-004 | Set WEX_WEBHOOK_USERNAME/PASSWORD env vars | Deployment Manager | ASAP | 🔴 Pending |
| AI-005 | Provide webhook URLs to WEX | Human Director | After AI-003/004 | 🔴 Pending |
| AI-006 | Configure WEX to send webhooks to new URLs | WEX Account Manager | After AI-005 | 🔴 Pending |

### Marqeta/3DS Improvements

| ID | Item | Assigned To | Priority | Status |
|----|------|-------------|----------|--------|
| AI-010 | Add unit tests for 3DS lookup_user edge cases | Engineering | Future | Pending |
| AI-011 | Update T2 flow docs to clarify `authorization.clearing` is the primary event | Documentation | Future | Pending |
| AI-012 | Investigate CardTransaction lookup issue (record_id mismatch) | Engineering | Low | Pending |
| AI-013 | Restore ExpenseCard record for Adele Vance (0364) | Human Director | Now | Pending |

### Future Improvements (Lower Priority)

| ID | Item | Assigned To | Priority | Status |
|----|------|-------------|----------|--------|
| AI-014 | Improve fallback behavior to not show misleading "Credit Limit" when API fails | Engineering | LOW | 📋 Backlog |
| AI-015 | Make primary account name configurable instead of hardcoded | Engineering | LOW | 📋 Backlog |
| AI-016 | Add Bypass/Mox for Checkbook API mocking | Engineering | Future | Pending |
| AI-017 | Create test fixtures for PaymentConnection, PayoutBatch | Engineering | Future | Pending |
| AI-018 | Implement webhook simulation utilities | Engineering | Future | Pending |
| AI-019 | Enhance security tests with actual control verification | Engineering | Future | Pending |
| AI-020 | Add integration test helpers for state verification | Engineering | Future | Pending |

---

## WEX SOAP Credential Investigation Results

**Current Credentials (Invalid)**:
| Variable | Value | Status |
|----------|-------|--------|
| `WEX_FLEET_ORG_ID` | `Paystand DEV ACCT` | ❓ May be wrong |
| `WEX_FLEET_SOAP_USERNAME` | `Webservices` | ❓ Unverified |
| `WEX_FLEET_SOAP_PASSWORD` | `W31T#%v=X3x33` | ❓ Unverified |
| `WEX_FLEET_SOAP_BANK_NUMBER` | Not set (default: `0010`) | ❓ Need value |
| `WEX_FLEET_SOAP_COMPANY_NUMBER` | Not set (default: `0011267`) | ❓ Need value |

**WEX Portal Reference**:
- Account: `WB Paystand 81134671`
- Group code: `WEXWB55911841915`
- Total credit limit: `$200.00 USD`

**Questions for WEX**:
1. What OrgGroupLoginId should be used? (`Paystand DEV ACCT` or `WEXWB55911841915`?)
2. Are Username/Password correct for SOAP API (not just portal)?
3. What BankNumber and CompanyNumber should be used?

---

## WEX Webhook Configuration (Ready for Deployment)

**Static Connection ID**: `65fad209-1118-46fa-8376-38d6e9b8ac0b`

**Webhook URLs**:
```
Transactions:    https://dev.teampay.io/webhooks/wex_fleet/65fad209-1118-46fa-8376-38d6e9b8ac0b/transactions
Authorizations:  https://dev.teampay.io/webhooks/wex_fleet/65fad209-1118-46fa-8376-38d6e9b8ac0b/authorizations
```

**Deployment Command**:
```bash
mix run priv/repo/seeds/dev/wex/01_wex_payment_connection.exs
```

---

## Knowledge Base Health

| Area | Status | Last Review |
|------|--------|-------------|
| Architecture | 🟢 Current | 2026-01-06 |
| Providers | 🟢 Current | 2026-01-15 |
| Capabilities | 🟢 Current | 2026-01-05 |
| Flows | 🟢 Current | 2026-01-15 |
| Resources | 🟢 Current | 2026-01-05 |
| Testing | 🟢 Current | 2026-01-05 |
| Glossary | 🟢 Current | 2026-01-06 |

---

## Provider Health Summary

*Based on codebase analysis as of committee initialization.*

| Provider | Status | Capabilities | Notes |
|----------|--------|--------------|-------|
| **Checkbook** | `production` | Payout, Account, Funding, Identity | Digital checks, polling |
| **Dwolla** | `available` | Recipient, Funding, Payout, Webhook, Identity | ACH transfers |
| **Marqeta** | `development` | Identity, User, Business, Card, Funding | Card platform, webhooks verified |
| **WEX Fleet** | `development` | Card Issuance, Webhooks | **SOAP credentials invalid for GetCorporateAvailable** |

---

## Technical Debt Tracker

| ID | Description | Severity | Subcommittee | Status |
|----|-------------|----------|--------------|--------|
| TD-001 | Misleading fallback shows card limit sum as "Credit Limit" when API fails | Medium | SC02 | 📋 Identified |
| TD-002 | Primary account name hardcoded in wex_funding_service.ex:127 | Low | SC17 | 📋 Identified |

---

## Subcommittee Activity

| Subcommittee | Last Active | Current Focus |
|--------------|-------------|---------------|
| SC01 Provider Integration | — | Awaiting first session |
| SC02 Card Operations | 2026-01-14 | ✅ WEX session closed — Layer 1 complete |
| SC03 Payment Operations | — | Awaiting first session |
| SC04 Identity Verification | — | Awaiting first session |
| SC05 Webhook Processing | 2026-01-14 | ✅ WEX production webhook setup complete |
| SC06 Reconciliation & Audit | — | Awaiting first session |
| SC07 Resilience & Observability | 2026-01-06 | ✅ Webhook resilience analysis completed |
| SC08 Testing & Quality | 2026-01-06 | ✅ Webhook test coverage completed |
| SC09 Security & Compliance | 2026-01-06 | ✅ Webhook security review completed |
| SC10 Business Integration | — | Awaiting first session |
| SC11 Capability Architecture | — | Awaiting first session |
| SC12 Reactor Workflows | 2026-01-06 | ✅ Webhook reactor patterns completed |
| SC13 Credential Management | 2026-01-15 | ⚠️ WEX SOAP credentials invalid |
| SC14 Checkbook Deep Dive | 2026-01-06 | ✅ Checkbook webhooks reviewed |
| SC15 Dwolla Deep Dive | 2026-01-06 | ✅ Dwolla webhooks reviewed |
| SC16 Marqeta Deep Dive | 2026-01-15 | ✅ Transaction Updated flow verified |
| SC17 WEX Fleet Deep Dive | 2026-01-15 | ⚠️ GetCorporateAvailable failing |
| SC18 Ash Resources | — | Awaiting first session |

---

## Session History

| Date | Code | Session | Outcome |
|------|------|---------|---------|
| 2026-01-15 | 003 | wex-multi-entity-credit-limit | ⏸️ Paused - Design complete, awaiting implementation |
| 2026-01-15 | 004 | transaction-card-not-found-retry | ✅ Completed - Retry flow verified working |
| 2026-01-15 | 003 | marqeta-transaction-updated-flow | ✅ Completed - Flow verified working |
| 2026-01-15 | 002 | wex-soap-credential-fix | ✅ Closed - Pending external verification |
| 2026-01-15 | 002 | 3ds-otp-user-not-found-testing | ✅ Completed - 3 error paths verified |
| 2026-01-15 | 001 | wex-corporate-credit-limit-investigation | ✅ Completed - Root cause: invalid SOAP credentials |
| 2026-01-15 | 001 | marqeta-3ds-webhook-fix | ✅ Completed - 3DS OTP flow fixed, emails sending |
| 2026-01-14 | 004 | wex-seed-api-fix | ✅ Completed - Fixed Ash API, seed verified working |
| 2026-01-14 | 003 | wex-seed-reorganization | ✅ Completed - Aligned with provider conventions |
| 2026-01-14 | 002 | wex-seed-cleanup | ✅ Completed - Deleted 3 dev-only seed files |
| 2026-01-14 | 001 | wex-production-webhook-setup | ✅ Completed - Production seed ready |
| 2026-01-13 | 001 | checkbook-flow-tests | ✅ Completed - 542 tests passing |
| 2026-01-05 | 002 | wex-card-operations | ✅ Closed - Partial success, 6/7 ops verified |
| 2026-01-06 | 001 | webhook-production-readiness | ✅ Completed - Production ready |
| 2026-01-05 | 001 | card-transaction-model | ✅ Completed - Educational, 3 decisions ratified |

---

## Update Protocol

This file is updated:
- When a session opens (Active Session section)
- When a session closes (Recent Decisions, Session History)
- When action items change status
- When knowledge base is updated
- When technical debt is discovered/resolved

**This is NOT a log.** It reflects current state only. Historical data lives in session folders.

---

*Status reflects reality; reality does not bend to status.*
