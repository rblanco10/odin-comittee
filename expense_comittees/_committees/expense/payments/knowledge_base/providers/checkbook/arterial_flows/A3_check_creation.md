# A3: Check Creation Flow

> **Flow Type**: Arterial (Core)  
> **Provider**: Checkbook.io  
> **Status**: Production  
> **Last Updated**: 2026-01-08  
> **Prerequisites**: A1 (KYB) + A2 (Funding Source) Complete

---

## Plain English Summary

This is the main event — actually sending a payment to someone as a digital or physical check.

**Analogies**:
- **Digital check** = Sending someone a Venmo request, but as a check. They get an email, click a link, and choose how to deposit it.
- **Physical check** = Checkbook literally prints a paper check and mails it to someone's address.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  A3: CHECK CREATION — "Send Someone Money"                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      DIGITAL CHECK                               │   │
│  │                                                                  │   │
│  │   Input:                                                         │   │
│  │   • Recipient email: john@example.com                            │   │
│  │   • Recipient name: "John Smith"                                 │   │
│  │   • Amount: $500.00                                              │   │
│  │   • Memo: "Expense reimbursement"                                │   │
│  │                                                                  │   │
│  │   What Happens:                                                  │   │
│  │   1. POST /check/digital → Checkbook creates check               │   │
│  │   2. John gets email: "You received a $500 check!"               │   │
│  │   3. John clicks link, sees check image                          │   │
│  │   4. John picks how to cash:                                     │   │
│  │      • Link bank account (ACH deposit)                           │   │
│  │      • Print & deposit at bank                                   │   │
│  │      • Cash at Walmart/CVS                                       │   │
│  │   5. Money arrives in 1-3 days                                   │   │
│  │                                                                  │   │
│  │   DELIVERY TIME: Instant email, 1-3 days to cash                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      PHYSICAL CHECK                              │   │
│  │                                                                  │   │
│  │   Input:                                                         │   │
│  │   • Recipient name: "John Smith"                                 │   │
│  │   • Mailing address: 123 Main St, City, ST 12345                 │   │
│  │   • Amount: $500.00                                              │   │
│  │   • Memo: "Expense reimbursement"                                │   │
│  │   • Mail type: USPS First Class / Overnight / Certified          │   │
│  │                                                                  │   │
│  │   What Happens:                                                  │   │
│  │   1. POST /check/physical → Checkbook queues print job           │   │
│  │   2. Check printed at Checkbook facility                         │   │
│  │   3. Check mailed via selected method                            │   │
│  │   4. Recipient receives physical check                           │   │
│  │   5. Recipient deposits at their bank                            │   │
│  │                                                                  │   │
│  │   DELIVERY TIME: 3-7 days (USPS) or 1-2 days (overnight)         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Details

### Digital Check

```
POST /v3/check/digital
```

**Request:**
```json
{
  "recipient": "john@example.com",
  "name": "John Smith",
  "amount": 500.00,
  "description": "Expense reimbursement",
  "comment": "Internal reference: REQ-12345"
}
```

**Response:**
```json
{
  "id": "chk_abc123",
  "number": 1001,
  "status": "UNPAID",
  "amount": 500.00,
  "image_uri": "https://checkbook.io/check/chk_abc123/image",
  "recipient": "john@example.com",
  "name": "John Smith",
  "description": "Expense reimbursement"
}
```

### Physical Check

```
POST /v3/check/physical
```

**Request:**
```json
{
  "name": "John Smith",
  "amount": 500.00,
  "description": "Expense reimbursement",
  "recipient": {
    "name": "John Smith",
    "line_1": "123 Main Street",
    "line_2": "Apt 4B",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US"
  },
  "mail_type": "USPS_FIRST_CLASS"
}
```

**Response:**
```json
{
  "id": "chk_xyz789",
  "number": 1002,
  "status": "UNPAID",
  "amount": 500.00,
  "image_uri": "https://checkbook.io/check/chk_xyz789/image",
  "tracking_number": null
}
```

---

## Payment Flows (Funding Methods)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THREE WAYS MONEY CAN FLOW                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STANDARD (Default):                                                    │
│  ├─ Money pulled from your bank WHEN recipient cashes check             │
│  ├─ No immediate bank debit                                             │
│  └─ Risk: If you don't have funds when they cash, check bounces         │
│                                                                         │
│  PRE-DEBIT:                                                             │
│  ├─ Money pulled from your bank immediately when check is created       │
│  ├─ Held in Checkbook wallet until recipient cashes                     │
│  └─ Safer: Ensures funds are available                                  │
│                                                                         │
│  PREFUND:                                                               │
│  ├─ You fund a Checkbook wallet ahead of time                           │
│  ├─ Checks deducted from wallet balance                                 │
│  └─ Fastest: No bank pull delays, instant creation                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Setting Payment Flow:**

```json
{
  "recipient": "john@example.com",
  "amount": 500.00,
  "payment_flow": "pre_debit"
}
```

---

## Mail Types (Physical Checks)

| Mail Type | Delivery Time | Tracking |
|-----------|---------------|----------|
| `USPS_FIRST_CLASS` | 3-7 days | No |
| `TWO_DAY` | 2 days | Yes |
| `OVERNIGHT` | 1 day | Yes |
| `USPS_CERTIFIED` | 3-7 days | Yes + Signature |

---

## Code Implementation

### Payout Disbursement Capability

```elixir
# lib/.../adapters/providers/checkbook/capabilities/payout_disbursement.ex

def create_payout(credentials_or_connection, payout_params, opts \\ []) do
  check_type = Map.get(payout_params, :check_type) || :digital
  config = extract_config(credentials_or_connection)
  body = PayoutMapper.map_payout_params_to_checkbook(payout_params)

  # Different endpoints for digital vs physical
  endpoint = case check_type do
    :digital -> "/check/digital"
    :physical -> "/check/physical"
    _ -> "/check/digital"
  end

  # Validate email is present for digital checks
  if check_type == :digital and is_nil(Map.get(body, :recipient)) do
    {:error, {:validation_error, "Digital check requires recipient email"}}
  else
    case Client.post(config, endpoint, body) do
      {:ok, response} ->
        {:ok, PayoutMapper.map_checkbook_response_to_payout_result(response)}
      {:error, error} -> {:error, error}
    end
  end
end
```

### Payout Mapper

```elixir
# lib/.../adapters/providers/checkbook/mappers/payout_mapper.ex

def map_payout_params_to_checkbook(params) do
  # Checkbook expects amount in DOLLARS (not cents)
  amount_dollars = Money.to_decimal(params.amount) |> Decimal.to_float()

  base = %{
    amount: amount_dollars,
    name: get_recipient_name(params),
    description: params[:memo] || params[:description] || "",
    comment: params[:reference] || ""
  }

  base
  |> add_email_for_digital(params)
  |> add_address_for_physical(params)
  |> add_payment_flow(params)
end
```

---

## Important: No Batch API

**Checkbook does NOT have a batch API.** To send 100 checks, you must make 100 individual API calls:

```elixir
# Our system loops through payments
for payment <- payments do
  PayoutDisbursement.create_payout(connection, payment, [])
end
```

This differs from Dwolla, which has a Mass Payments API for batch operations.

---

## Outcomes

| Outcome | Status | What Happens |
|---------|--------|--------------|
| ✅ **Created** | `UNPAID` | Check created, awaiting recipient action |
| ✅ **Processing** | `IN_PROCESS` | Recipient initiated deposit |
| ✅ **Mailed** | `MAILED` | Physical check in mail (→ A4) |
| ✅ **Paid** | `PAID` | Successfully deposited (→ A4) |
| ❌ **Failed** | `FAILED` | Check creation failed |

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `missing_recipient` | No email for digital check | Add `recipient` email field |
| `missing_address` | No address for physical check | Add `recipient` address object |
| `insufficient_funds` | Pre-debit/prefund insufficient | Fund wallet or use standard flow |
| `invalid_amount` | Amount ≤ $0 or too large | Verify amount is positive |

### Validation Before API Call

```elixir
# Digital checks require email
if check_type == :digital and is_nil(recipient_email) do
  {:error, {:validation_error, "Digital check requires recipient email address"}}
end
```

---

## Field Mapping

### Our System → Checkbook API

| Our Field | Checkbook Field | Notes |
|-----------|-----------------|-------|
| `recipient_data.email` | `recipient` | Required for digital |
| `recipient_data.name` | `name` | Payee name |
| `amount` | `amount` | In dollars (not cents!) |
| `memo` | `description` | Printed on check memo line |
| `reference` | `comment` | Internal notes (not printed) |
| `recipient_data.address` | `recipient` (object) | Required for physical |

---

## Testing Checklist

- [ ] Create digital check with valid email
- [ ] Create digital check without email (should fail)
- [ ] Create physical check with valid address
- [ ] Create physical check without address (should fail)
- [ ] Set different payment flows (standard, pre_debit, prefund)
- [ ] Set different mail types for physical checks
- [ ] Verify check image URL is returned
- [ ] Verify check number is assigned

---

## Related Flows

- **Previous**: [A2: Funding Source Setup](./A2_funding_source_setup.md) — Bank must be connected
- **Next**: [A4: Check Lifecycle](./A4_check_lifecycle.md) — Track check status via webhooks
- **Alternative**: [A5: Check Cancellation](./A5_check_cancellation.md) — Cancel before deposit

---

*"Digital or physical, money on its way."*

