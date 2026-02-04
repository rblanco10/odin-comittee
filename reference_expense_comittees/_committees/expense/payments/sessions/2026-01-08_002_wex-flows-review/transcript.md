# Session Transcript

> **Session**: 2026-01-08_002_wex-flows-review  
> **Recording Clerk**: Emily Watson

---

## Session Opening

**Time**: 2026-01-08

---

### Victoria Sterling, Chair

This is Victoria Sterling, Chair of the Ember Payments Committee. I call this session to order.

**PRIOR SESSION PAUSED**: Session 2026-01-08_001_marqeta-flows-review is now PAUSED per Human Director request. We will resume that session at a later time.

**NEW SESSION GOAL**: Comprehensive review of ALL WEX Fleet flows within ember_payments — including every reactor, service, capability, and webhook that touches WEX even once.

**ACTIVATED MEMBERS**:
- Michelle Park (PS004) - WEX Expert (Primary)
- Robert Huang (DC004) - Fleet Card Specialist
- Marcus Chen (DC001) - Card Issuance Expert
- Ryan Mitchell (TS004) - API Integration Expert (SOAP/REST expertise)
- Dr. Amanda Foster (TS001) - Elixir Expert
- James Wright (TS002) - Ash Framework Expert
- Alex Rivera (AS003) - Reactor Patterns Expert
- Christina Nguyen (AS004) - Resilience Expert
- Heather Wong (TS007) - Observability Expert
- Margaret O'Neill (AS002) - Adapter Patterns Expert
- Dr. William Chang (AS001) - Capability Patterns Expert

**ASSIGNED CRITICS**:
- Primary: Dr. Eleanor Vance (Security Adversary) - Security of dual-auth systems
- Secondary: Elena Rodriguez (Failure Advocate) - SOAP failure modes
- Tertiary: Yuki Tanaka (Edge Case Hunter) - Protocol edge cases
- Quaternary: Gregory Stein (Consistency Challenger) - REST/SOAP consistency

**HISTORIANS**:
- Dr. Henry Blackwood (Session Historian) - Historical context from 2026-01-05_002
- Catherine Wells (Pattern Historian) - Cross-provider patterns

**CLERICAL ASSIGNMENTS**:
- Recording Clerk (Emily Watson): Begin transcript ✓
- Research Clerk (Carlos Mendez): On standby for investigations
- Artifacts Clerk (Sophie Laurent): Prepare for outputs

**SUBCOMMITTEES ACTIVATED**:
- SC17: WEX Fleet Deep Dive
- SC02: Card Operations
- SC05: Webhook Processing
- SC11: Capability Architecture
- SC12: Reactor Workflows
- SC13: Credential Management

The floor is now open. I call upon **Dr. Henry Blackwood** to provide historical context from our prior WEX session.

---

*[Transcript continues below]*

---

### Victoria Sterling, Chair

I've received feedback from the Human Director regarding our flow organization. The key corrections needed:

1. **C1 paths for virtual cards should each be their own flow** (not nested branches)
2. **C2 paths for virtual cards should each be their own flow** (not nested branches)
3. **Physical card ordering paths should be their own flows**
4. **Transaction webhooks and authorization webhooks are different flows**

The Director has correctly identified that **WEX Virtual and WEX Physical should be treated as almost two separate providers** given they use:
- Different APIs (Merchant Log vs Card Management)
- Different authentication (Basic Auth vs OAuth)
- Different connection endpoints

I'm now presenting the **CORRECTED WEX Product Flows** with this dual-provider architecture:

---

## WEX PRODUCT FLOWS — Corrected Structure

### Provider Summary

| Section | Provider | API | Auth | Card Types |
|---------|----------|-----|------|------------|
| **WEX-V** | WEX Virtual | Merchant Log API | Basic Auth | Virtual (single-use, multi-use) |
| **WEX-P** | WEX Physical | Card Management API | OAuth 2.0 | Physical (PLASTIC), Static (STATIC) |

### Flow Summary

| Section | Category | Flows | Total Testable Paths |
|---------|----------|-------|---------------------|
| **WEX-V** | Card Issuance | 4 | 4 |
| **WEX-V** | Card State Management | 6 | 6 |
| **WEX-V** | Card Limits & Controls | 4 | 4 |
| **WEX-V** | Authorization Webhooks | 4 | 4 |
| **WEX-V** | Transaction Webhooks | 3 | 3 |
| **WEX-P** | Card Ordering | 4 | 4 |
| **WEX-P** | Card Fulfillment | 3 | 3 |
| **WEX-P** | Card State Management | 6 | 6 |
| **WEX-P** | Card Updates | 4 | 4 |
| **WEX-P** | Physical Card Webhooks | 4 | 4 |
| **TOTAL** | | **42** | **42** |

---

## All Flows at a Glance

### WEX VIRTUAL (Merchant Log API)

| # | Flow ID | Flow Name | Category |
|---|---------|-----------|----------|
| 1 | V-C1 | Issue Single-Use Virtual Card - Success | Card Issuance |
| 2 | V-C2 | Issue Multi-Use Virtual Card - Success | Card Issuance |
| 3 | V-C3 | Issue Virtual Card - API Error (401/403) | Card Issuance |
| 4 | V-C4 | Issue Virtual Card - Validation Error | Card Issuance |
| 5 | V-S1 | Get Virtual Card Details - Success | Card State |
| 6 | V-S2 | Get Virtual Card Details - Not Found | Card State |
| 7 | V-S3 | Freeze Virtual Card (Close with Limits Stored) | Card State |
| 8 | V-S4 | Unfreeze Virtual Card (Reopen) | Card State |
| 9 | V-S5 | Cancel Virtual Card (Permanent Close) | Card State |
| 10 | V-S6 | Virtual Card Activation (NO-OP) | Card State |
| 11 | V-L1 | Update Virtual Card Monthly Limit | Limits & Controls |
| 12 | V-L2 | Update Virtual Card Total Amount | Limits & Controls |
| 13 | V-L3 | Set Virtual Card Autoclose Date | Limits & Controls |
| 14 | V-L4 | Update Virtual Card MCC Profile (via SOAP) | Limits & Controls |
| 15 | V-AW1 | Authorization Webhook - Created (0100) | Auth Webhooks |
| 16 | V-AW2 | Authorization Webhook - Declined | Auth Webhooks |
| 17 | V-AW3 | Authorization Webhook - Reversed (0420) | Auth Webhooks |
| 18 | V-AW4 | Authorization Webhook - Updated (0220) | Auth Webhooks |
| 19 | V-TW1 | Transaction Webhook - Purchase | Transaction Webhooks |
| 20 | V-TW2 | Transaction Webhook - Refund | Transaction Webhooks |
| 21 | V-TW3 | Transaction Webhook - Card Not Found (Retry) | Transaction Webhooks |

### WEX PHYSICAL (Card Management API)

| # | Flow ID | Flow Name | Category |
|---|---------|-----------|----------|
| 22 | P-O1 | Order PLASTIC Card - Success | Card Ordering |
| 23 | P-O2 | Order STATIC Card - Success | Card Ordering |
| 24 | P-O3 | Order Card - OAuth Token Error | Card Ordering |
| 25 | P-O4 | Order Card - Validation Error | Card Ordering |
| 26 | P-F1 | Get Card Details - Card Ready (Success) | Card Fulfillment |
| 27 | P-F2 | Get Card Details - Still Processing (425) | Card Fulfillment |
| 28 | P-F3 | Get Card Details - Not Found (404) | Card Fulfillment |
| 29 | P-S1 | Activate Physical Card | Card State |
| 30 | P-S2 | Suspend Physical Card (Freeze) | Card State |
| 31 | P-S3 | Unsuspend Physical Card (Unfreeze) | Card State |
| 32 | P-S4 | Close Physical Card (Reactivatable) | Card State |
| 33 | P-S5 | Close Physical Card Permanently | Card State |
| 34 | P-S6 | Report Physical Card Lost/Stolen | Card State |
| 35 | P-U1 | Update Physical Card Credit Limit | Card Updates |
| 36 | P-U2 | Update Physical Card MCC Restrictions | Card Updates |
| 37 | P-U3 | Set Physical Card Autoclose Date | Card Updates |
| 38 | P-U4 | Change Physical Card PIN | Card Updates |
| 39 | P-W1 | Physical Card Webhook - Authorization Created | Physical Webhooks |
| 40 | P-W2 | Physical Card Webhook - Status Changed | Physical Webhooks |
| 41 | P-W3 | Physical Card Webhook - Shipped | Physical Webhooks |
| 42 | P-W4 | Physical Card Webhook - Transaction Posted | Physical Webhooks |

---

## Visual Structure

```
WEX PRODUCT FLOWS (Dual-Provider Architecture)
│
├── WEX VIRTUAL PROVIDER (Merchant Log API + SOAP)
│   │
│   ├── CARD ISSUANCE (4 flows)
│   │   ├── V-C1: Issue Single-Use Virtual Card - Success
│   │   ├── V-C2: Issue Multi-Use Virtual Card - Success
│   │   ├── V-C3: Issue Virtual Card - API Error (401/403)
│   │   └── V-C4: Issue Virtual Card - Validation Error
│   │
│   ├── CARD STATE MANAGEMENT (6 flows)
│   │   ├── V-S1: Get Virtual Card Details - Success
│   │   ├── V-S2: Get Virtual Card Details - Not Found
│   │   ├── V-S3: Freeze Virtual Card (Close with Limits Stored)
│   │   ├── V-S4: Unfreeze Virtual Card (Reopen)
│   │   ├── V-S5: Cancel Virtual Card (Permanent Close)
│   │   └── V-S6: Virtual Card Activation (NO-OP - cards active on creation)
│   │
│   ├── LIMITS & CONTROLS (4 flows)
│   │   ├── V-L1: Update Virtual Card Monthly Limit (credit_limit)
│   │   ├── V-L2: Update Virtual Card Total Amount (total_amount)
│   │   ├── V-L3: Set Virtual Card Autoclose Date (max_auth_date)
│   │   └── V-L4: Update Virtual Card MCC Profile (via SOAP AccountService)
│   │
│   ├── AUTHORIZATION WEBHOOKS (4 flows) ← MessageType format
│   │   ├── V-AW1: Authorization Created (MessageType=0100)
│   │   ├── V-AW2: Authorization Declined (ResponseCode≠00)
│   │   ├── V-AW3: Authorization Reversed (MessageType=0420)
│   │   └── V-AW4: Authorization Updated (MessageType=0220)
│   │
│   └── TRANSACTION WEBHOOKS (3 flows) ← event.type format
│       ├── V-TW1: Transaction Purchase (transactions.card.purchase)
│       ├── V-TW2: Transaction Refund (transactions.card.refund)
│       └── V-TW3: Transaction Card Not Found → Retry Later
│
└── WEX PHYSICAL PROVIDER (Card Management API)
    │
    ├── CARD ORDERING (4 flows)
    │   ├── P-O1: Order PLASTIC Card - Success (returns card_record_id)
    │   ├── P-O2: Order STATIC Card - Success (ghost card)
    │   ├── P-O3: Order Card - OAuth Token Error (401)
    │   └── P-O4: Order Card - Validation Error (400)
    │
    ├── CARD FULFILLMENT (3 flows)
    │   ├── P-F1: Get Card Details - Card Ready (full details returned)
    │   ├── P-F2: Get Card Details - Still Processing (425 Too Early)
    │   └── P-F3: Get Card Details - Not Found (404)
    │
    ├── CARD STATE MANAGEMENT (6 flows)
    │   ├── P-S1: Activate Physical Card (INACTIVE → ACTIVE)
    │   ├── P-S2: Suspend Physical Card (ACTIVE → SUSPENDED)
    │   ├── P-S3: Unsuspend Physical Card (SUSPENDED → ACTIVE)
    │   ├── P-S4: Close Physical Card (→ CLOSED, reactivatable)
    │   ├── P-S5: Close Physical Card Permanently (→ CLOSED_NO_REACTIVATION)
    │   └── P-S6: Report Lost/Stolen (→ LOST_OR_STOLEN)
    │
    ├── CARD UPDATES (4 flows)
    │   ├── P-U1: Update Physical Card Credit Limit
    │   ├── P-U2: Update Physical Card MCC Restrictions
    │   ├── P-U3: Set Physical Card Autoclose Date (effective_dates.end_date)
    │   └── P-U4: Change Physical Card PIN
    │
    └── PHYSICAL CARD WEBHOOKS (4 flows) ← physical_card.* prefix
        ├── P-W1: Physical Card Authorization Created
        ├── P-W2: Physical Card Status Changed
        ├── P-W3: Physical Card Shipped (tracking info available)
        └── P-W4: Physical Card Transaction Posted
```

---

## Key Architectural Differences

### WEX Virtual vs WEX Physical

| Aspect | WEX Virtual | WEX Physical |
|--------|-------------|--------------|
| **API** | Merchant Log API | Card Management API |
| **Base URL** | services.encompass-suite.com | payments.wexapi.com |
| **Auth** | Basic Auth | OAuth 2.0 (Okta) |
| **Card Creation** | Synchronous (instant) | Asynchronous (card_record_id returned) |
| **Activation** | NO-OP (active on creation) | Required (INACTIVE → ACTIVE) |
| **Freeze Method** | payment_status="closed" | status="SUSPENDED" |
| **Unfreeze** | payment_status="open" | status="ACTIVE" |
| **Limit Updates** | REST (credit_limit, total_amount) | REST (credit_limit_cents) |
| **MCC Updates** | SOAP (UpdateAccountData) | REST (mcc_groups) |
| **Webhooks** | Two formats (auth + transaction) | One format (physical_card.*) |

---

## Detailed Flow Specifications

### WEX VIRTUAL FLOWS

---

#### V-C1: Issue Single-Use Virtual Card - Success

| Attribute | Value |
|-----------|-------|
| **Flow ID** | `WEX-V-C1` |
| **API** | Merchant Log API |
| **Endpoint** | `POST /merchant-logs/v1` |
| **Auth** | Basic Auth |
| **Idempotency** | Yes (idempotency_key in body) |

**Steps:**
1. Build Merchant Log request with `max_auth_count=1` (single-use)
2. Generate idempotency_key
3. Call `POST /merchant-logs/v1` with Basic Auth
4. Parse response via PurchaseLogMapper
5. Return card details (card_id, last_four, expiration, status=active)

**Success Response:**
- Card created with immediate `active` status
- Full card number available via `get_sensitive_details`

---

#### V-C2: Issue Multi-Use Virtual Card - Success

| Attribute | Value |
|-----------|-------|
| **Flow ID** | `WEX-V-C2` |
| **API** | Merchant Log API |
| **Endpoint** | `POST /merchant-logs/v1` |
| **Auth** | Basic Auth |

**Steps:**
1. Build Merchant Log request with `max_auth_count=nil` (unlimited)
2. Generate idempotency_key
3. Call `POST /merchant-logs/v1` with Basic Auth
4. Parse response via PurchaseLogMapper
5. Return card details (card_id, last_four, expiration, status=active)

**Difference from V-C1:** `max_auth_count` is nil (unlimited transactions)

---

#### V-C3: Issue Virtual Card - API Error (401/403)

| Attribute | Value |
|-----------|-------|
| **Flow ID** | `WEX-V-C3` |
| **Trigger** | Invalid credentials or expired Basic Auth |
| **Error Code** | 401 Unauthorized or 403 Forbidden |

**Steps:**
1. Attempt card issuance
2. Receive 401/403 from WEX
3. Log error with context (auth_type, environment, pool_name)
4. Return `{:error, %{error: :api_error, status: 401/403}}`

**Recovery:** Verify Basic Auth credentials in platform configuration

---

#### V-C4: Issue Virtual Card - Validation Error

| Attribute | Value |
|-----------|-------|
| **Flow ID** | `WEX-V-C4` |
| **Trigger** | Invalid card parameters |
| **Error Code** | 400 Bad Request |

**Common Causes:**
- Missing required fields (pool_name, amount)
- Invalid currency (non-USD)
- Invalid date formats (min_auth_date, max_auth_date)

---

### AUTHORIZATION WEBHOOKS vs TRANSACTION WEBHOOKS

**CRITICAL DISTINCTION:**

| Aspect | Authorization Webhooks | Transaction Webhooks |
|--------|----------------------|---------------------|
| **Format** | MessageType field (0100, 0420, 0220) | event.type field (transactions.*) |
| **Timing** | Real-time (at authorization) | Post-settlement |
| **ID Field** | MerchantLogUniqueId | event.id |
| **Card ID Field** | UniqueId or AccountToken | card_reference_unique_id |
| **Events** | auth.created, auth.declined, auth.reversed | transactions.card.purchase, .refund |

---

#### V-AW1: Authorization Webhook - Created (0100)

| Attribute | Value |
|-----------|-------|
| **Flow ID** | `WEX-V-AW1` |
| **Message Type** | 0100 |
| **Internal Event** | authorization.created |

**Trust Nothing Pattern:**
1. Receive webhook (ping only)
2. Extract Purchase Log ID from payload
3. Call REST API to fetch ALL authorizations for this card
4. Compare API response with database
5. Create MISSING authorizations from API data (NOT webhook data)

---

#### V-TW1: Transaction Webhook - Purchase

| Attribute | Value |
|-----------|-------|
| **Flow ID** | `WEX-V-TW1` |
| **Event Type** | transactions.card.purchase |
| **Timing** | Post-settlement |

**Steps:**
1. Parse event.type = "transactions.card.purchase"
2. Extract card_reference_unique_id
3. Apply Trust Nothing pattern (fetch from API)
4. Create/update CardTransaction record

---

### WEX PHYSICAL FLOWS

---

#### P-O1: Order PLASTIC Card - Success

| Attribute | Value |
|-----------|-------|
| **Flow ID** | `WEX-P-O1` |
| **API** | Card Management API |
| **Endpoint** | `POST /card-management/v1/cards` |
| **Auth** | OAuth 2.0 |
| **Card Type** | PLASTIC |

**Steps:**
1. Authenticate via OAuth (Okta token endpoint)
2. Build card order request with type="PLASTIC"
3. Call `POST /card-management/v1/cards`
4. Receive `card_record_id` (async - card not immediately available)
5. Attempt immediate `GET /cards/{id}` (Marqeta pattern)
6. If 425 → Store with status=pending_fulfillment, last_four="PEND"
7. If success → Store full card details

**Key Difference from Virtual:** Physical cards are **asynchronous** - only `card_record_id` returned initially

---

#### P-F2: Get Card Details - Still Processing (425)

| Attribute | Value |
|-----------|-------|
| **Flow ID** | `WEX-P-F2` |
| **HTTP Status** | 425 Too Early |
| **Meaning** | Card order received but not yet fulfilled |

**Steps:**
1. Call `GET /card-management/v1/cards/{card_record_id}`
2. Receive 425 status
3. Return `{:error, :card_still_processing}`
4. Retry later (via sync job or webhook trigger)

---

#### P-S1: Activate Physical Card

| Attribute | Value |
|-----------|-------|
| **Flow ID** | `WEX-P-S1` |
| **Endpoint** | `PATCH /card-management/v1/cards/{id}` |
| **Status Change** | INACTIVE → ACTIVE |
| **Required** | last_four for verification |

**Key Difference from Virtual:** Physical cards START as INACTIVE and MUST be activated. Virtual cards are active on creation.

---

*[Additional flow details continue...]*

---

### Michelle Park, WEX Expert

Victoria, this restructured flow diagram accurately reflects the dual-provider nature of WEX. I want to emphasize a few critical points:

1. **Authorization webhooks (V-AW*) and Transaction webhooks (V-TW*)** are fundamentally different:
   - Authorization webhooks arrive in real-time at the point of authorization
   - Transaction webhooks arrive post-settlement and use a completely different payload format

2. **Physical card ordering (P-O1, P-O2)** creates an async workflow:
   - The order returns only `card_record_id`
   - You MUST call `GET /cards/{id}` to get actual card details
   - The 425 response is expected and normal

3. **Virtual card "activation" (V-S6) is a NO-OP** - this exists only for API consistency. Virtual cards are active upon creation.

---

### Dr. Eleanor Vance, Security Adversary

I note the dual-authentication architecture creates complexity:

- **Basic Auth** for Merchant Log API (virtual cards)
- **OAuth 2.0** for Card Management API (physical cards)
- **WS-Security** for SOAP operations (MCC updates)

This is three different credential sets. Each flow path that crosses these boundaries needs careful credential handling.

---

*[Session continues...]*

