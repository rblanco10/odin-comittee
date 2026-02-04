# A2: Funding Source Setup Flow

> **Flow Type**: Arterial (Setup)  
> **Provider**: Checkbook.io  
> **Status**: Production  
> **Last Updated**: 2026-01-08  
> **Prerequisite**: A1 (KYB Verification) Complete

---

## Plain English Summary

Before sending checks, you need to connect a bank account to fund them. This is the "where does the money come from?" step.

**Analogy**: Like adding a payment method to Venmo. You link your bank, verify it's really yours, then you can send money.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  A2: FUNDING SOURCE SETUP — "Where Does The Money Come From?"           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                    OPTION A: PLAID (INSTANT)                   │     │
│  │                                                                │     │
│  │   User          Plaid UI        Plaid API       Checkbook     │     │
│  │    │               │               │               │          │     │
│  │    │── Pick Bank ─►│               │               │          │     │
│  │    │               │── Login ─────►│               │          │     │
│  │    │               │               │── Token ─────►│          │     │
│  │    │               │               │     "Verified instantly!" │     │
│  │    │               │               │               │          │     │
│  │    ◄────────────── Ready to send checks! ─────────►│          │     │
│  │                                                                │     │
│  │   TIME: ~30 seconds                                            │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │               OPTION B: MICRO-DEPOSITS (3-5 DAYS)              │     │
│  │                                                                │     │
│  │   Step 1: Add bank account manually                            │     │
│  │           POST /account/bank                                   │     │
│  │           (routing number + account number)                    │     │
│  │                          │                                     │     │
│  │   Step 2: Release microdeposits                                │     │
│  │           POST /account/bank/release                           │     │
│  │           (Checkbook sends $0.07 and $0.15)                    │     │
│  │                          │                                     │     │
│  │   Step 3: Wait 1-3 business days                               │     │
│  │           (deposits appear in bank statement)                  │     │
│  │                          │                                     │     │
│  │   Step 4: User enters amounts                                  │     │
│  │           POST /account/bank/verify                            │     │
│  │           { amount_1: 0.07, amount_2: 0.15 }                   │     │
│  │                          │                                     │     │
│  │   Step 5: Verified! ✓                                          │     │
│  │                                                                │     │
│  │   TIME: 3-5 business days                                      │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Details

### Option A: Plaid Integration (Instant)

#### Step 1: Get Account Numbers via Plaid IAV

```
POST /v3/account/bank/iav/plaid
```

**Request:**
```json
{
  "processor_token": "processor-sandbox-abc123..."
}
```

**Response:**
```json
{
  "accounts": [
    {
      "account": "1234567890",
      "routing": "021000021",
      "type": "CHECKING"
    }
  ]
}
```

#### Step 2: Create Funding Source (Already Verified)

```
POST /v3/account/bank
```

**Request:**
```json
{
  "account": "1234567890",
  "routing": "021000021",
  "type": "CHECKING",
  "name": "Business Checking",
  "verified": true
}
```

---

### Option B: Micro-Deposits (Manual)

#### Step 1: Add Bank Account

```
POST /v3/account/bank
```

**Request:**
```json
{
  "account": "1234567890",
  "routing": "021000021",
  "type": "CHECKING",
  "name": "Business Checking"
}
```

**Response:**
```json
{
  "id": "bank_abc123",
  "status": "PENDING",
  "name": "Business Checking",
  "last_four": "7890"
}
```

#### Step 2: Release Microdeposits

```
POST /v3/account/bank/release
```

**Request:**
```json
{
  "account": "bank_abc123"
}
```

**Response:**
```json
{
  "status": "released",
  "message": "Microdeposits initiated"
}
```

#### Step 3: Verify Amounts (After User Receives Deposits)

```
POST /v3/account/bank/verify
```

**Request:**
```json
{
  "account": "bank_abc123",
  "amount_1": 0.07,
  "amount_2": 0.15
}
```

**Response:**
```json
{
  "id": "bank_abc123",
  "status": "VERIFIED",
  "name": "Business Checking",
  "last_four": "7890"
}
```

---

## Outcomes

| Outcome | Status | What Happens Next |
|---------|--------|-------------------|
| ✅ **Verified** | `VERIFIED` | Ready to create checks (A3) |
| ⏳ **Pending** | `PENDING` | Awaiting microdeposit verification |
| ❌ **Failed** | `FAILED` | Verification failed, try again |
| 🗑️ **Deleted** | `DELETED` | Funding source removed |

---

## Code Implementation

### Adding via Plaid

```elixir
# lib/.../adapters/providers/checkbook/capabilities/funding_source_management.ex

def get_account_numbers_via_plaid_iav(payment_connection, processor_token) do
  config = Config.build_config(payment_connection.credentials)
  body = %{processor_token: processor_token}

  case Client.post(config, "/account/bank/iav/plaid", body) do
    {:ok, response} ->
      account_data = List.first(response["accounts"] || [])
      {:ok, %{
        account_number: account_data["account"],
        routing_number: account_data["routing"],
        account_type: account_data["type"] || "CHECKING"
      }}
    {:error, error} -> {:error, error}
  end
end
```

### Adding Manually

```elixir
def add_ach_funding_source(payment_connection, ach_data, opts \\ []) do
  config = Config.build_config(payment_connection.credentials)
  body = FundingSourceMapper.map_ach_data_to_checkbook(ach_data)

  case Client.post(config, "/account/bank", body) do
    {:ok, response} ->
      {:ok, FundingSourceMapper.map_checkbook_response_to_funding_source(response)}
    {:error, error} -> {:error, error}
  end
end
```

### Verifying via Microdeposits

```elixir
def verify_ach_funding_source(payment_connection, funding_token, amounts) do
  config = Config.build_config(payment_connection.credentials)
  
  body = %{
    account: funding_token,
    amount_1: amounts[:amount1] || 0.07,
    amount_2: amounts[:amount2] || 0.15
  }

  case Client.post(config, "/account/bank/verify", body) do
    {:ok, response} ->
      {:ok, FundingSourceMapper.map_checkbook_response_to_funding_source_details(response)}
    {:error, error} -> {:error, error}
  end
end
```

---

## Sandbox Testing

In the Checkbook sandbox environment:
- Microdeposit amounts are **always** $0.07 and $0.15
- No actual bank transactions occur
- Verification can be completed immediately

```elixir
# Sandbox always uses these amounts
def get_verification_amounts(payment_connection, funding_token) do
  config = Config.build_config(payment_connection.credentials)

  if config.environment == :sandbox do
    {:ok, %{amount1: 0.07, amount2: 0.15}}
  else
    {:ok, %{amount1: nil, amount2: nil, message: "Check your bank statement"}}
  end
end
```

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `invalid_routing_number` | Bad routing number | Verify 9-digit ABA number |
| `invalid_account_number` | Account not found | Verify account number |
| `verification_failed` | Wrong microdeposit amounts | User entered incorrect amounts |
| `account_already_exists` | Duplicate bank account | Use existing funding source |

---

## Other Operations

### List Funding Sources

```
GET /v3/account/bank
```

### Get Funding Source Details

```
GET /v3/account/bank/{id}
```

### Delete Funding Source

```
DELETE /v3/account/bank/{id}
```

### Get Balance

```
GET /v3/account/bank/{id}/balance
```

---

## Testing Checklist

- [ ] Add funding source via Plaid (instant)
- [ ] Add funding source manually
- [ ] Release microdeposits
- [ ] Verify with correct amounts
- [ ] Verify with wrong amounts (should fail)
- [ ] List all funding sources
- [ ] Delete funding source
- [ ] Check balance

---

## Related Flows

- **Previous**: [A1: KYB Verification](./A1_kyb_verification.md) — Must complete first
- **Next**: [A3: Check Creation](./A3_check_creation.md) — Send checks once bank is verified

---

*"Connect once, fund forever."*

