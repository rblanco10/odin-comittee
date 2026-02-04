# Payment Collection Capability

**Behavior Module**: `FlameTeampayPayables.EmberPayments.Capabilities.PaymentCollection.Behavior`  
**Types Module**: `FlameTeampayPayables.EmberPayments.Capabilities.PaymentCollection.Types`

## Purpose

The Payment Collection capability handles **pull payments** - receiving money from payers. This includes collecting invoice payments, processing recurring subscriptions, and initiating debits from authorized bank accounts.

## Key Differences from Payment Initiation

| Aspect | Payment Initiation | Payment Collection |
|--------|-------------------|-------------------|
| Direction | Push (send money) | Pull (receive money) |
| Authorization | Implicit (sender controls) | Required (NACHA rules) |
| Risk | Sender bears | Receiver bears |
| Returns | Sender-initiated | Payer-initiated |
| Use Case | Vendor payments | Invoice collection |

## Callback Functions

### Collection Operations

```elixir
@callback create_collection(config, collection_params, opts) ::
            {:ok, collection_result()} | {:error, term()}

@callback get_collection_status(config, collection_id) ::
            {:ok, collection_status()} | {:error, term()}

@callback cancel_collection(config, collection_id) ::
            {:ok, collection_result()} | {:error, term()}
```

### Payer (Funding Source) Management

```elixir
@callback create_payer(config, payer_data) ::
            {:ok, payer_result()} | {:error, term()}

@callback verify_payer(config, payer_id, verification_method) ::
            {:ok, verification_result()} | {:error, term()}

@callback confirm_micro_deposits(config, payer_id, amounts) ::
            {:ok, payer_result()} | {:error, term()}
```

### Authorization Management

```elixir
@callback create_authorization(config, payer_id, auth_params) ::
            {:ok, authorization_result()} | {:error, term()}

@callback revoke_authorization(config, authorization_id) ::
            {:ok, :revoked} | {:error, term()}
```

### Webhooks

```elixir
@callback validate_webhook(config, body, signature) ::
            {:ok, :valid} | {:error, :invalid_signature | term()}

@callback parse_webhook_event(config, payload) ::
            {:ok, webhook_event()} | {:error, term()}

@callback supported_webhook_events(config) :: [String.t()]
```

## Authorization Requirements

ACH debit transactions require explicit authorization per NACHA rules:

### WEB (Internet-Initiated)

```elixir
%{
  authorization_type: :web,
  ip_address: "192.168.1.1",
  consent_timestamp: DateTime.utc_now(),
  consent_text: "I authorize...",
  recurring: false
}
```

### PPD (Prearranged Payment & Deposit)

```elixir
%{
  authorization_type: :ppd,
  signed_authorization_date: ~D[2024-01-15],
  authorization_on_file: true
}
```

### CCD (Corporate Credit or Debit)

```elixir
%{
  authorization_type: :ccd,
  agreement_date: ~D[2024-01-15],
  agreement_reference: "MSA-2024-001"
}
```

## Collection Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   1. CREATE/VERIFY PAYER                         │
│  create_payer(payer_data)                                        │
│  verify_payer(payer_id, :micro_deposits)                         │
│  confirm_micro_deposits(payer_id, [0.05, 0.12])                  │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                   2. CREATE AUTHORIZATION                        │
│  create_authorization(payer_id, auth_params)                     │
│  - Stores consent/agreement details                              │
│  - Required for ACH debits                                       │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                   3. INITIATE COLLECTION                         │
│  create_collection(collection_params)                            │
│  - References authorization                                      │
│  - Initiates ACH debit                                           │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │     ASYNC PROCESSING      │
                    │   (ACH network, 2-4 days) │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│  COMPLETED   │          │   RETURNED   │          │   FAILED     │
│ (funds recv) │          │  (NSF, etc.) │          │ (auth issue) │
└──────────────┘          └──────────────┘          └──────────────┘
```

## Collection Status Lifecycle

```elixir
:pending        # Collection initiated
:processing     # In ACH network
:completed      # Funds received
:returned       # Payment returned by payer's bank
:failed         # Collection failed
:cancelled      # Cancelled before processing
:disputed       # Payer disputed the charge
```

## Return Codes (ACH)

| Code | Name | Description | Action |
|------|------|-------------|--------|
| R01 | Insufficient Funds | NSF | Retry or contact payer |
| R02 | Account Closed | Bank account closed | Get new account info |
| R03 | No Account/Unable to Locate | Invalid account | Verify account details |
| R04 | Invalid Account Number | Wrong format | Correct account number |
| R07 | Authorization Revoked | Payer cancelled | Get new authorization |
| R08 | Payment Stopped | Stop payment order | Contact payer |
| R09 | Uncollected Funds | Funds not available | Wait and retry |
| R10 | Customer Advises Not Authorized | Disputed | Review authorization |
| R29 | Corporate Entry Not Authorized | Corp refusal | Verify corporate auth |

## Type Definitions

### Collection Parameters

```elixir
@type collection_params :: %{
  amount: Money.t(),
  payer_id: String.t(),
  authorization_id: String.t(),
  description: String.t() | nil,
  reference: String.t() | nil,
  scheduled_date: Date.t() | nil,
  metadata: map()
}
```

### Collection Result

```elixir
@type collection_result :: %{
  collection_id: String.t(),
  status: collection_status(),
  amount: Money.t(),
  estimated_arrival: Date.t() | nil,
  fee: Money.t() | nil,
  return_code: String.t() | nil,
  return_reason: String.t() | nil,
  metadata: map()
}
```

## Verification Methods

### Micro-Deposits (Standard)

```elixir
# 1. Initiate verification (sends 2 small deposits)
verify_payer(payer_id, :micro_deposits)

# 2. Payer confirms amounts (2-3 days later)
confirm_micro_deposits(payer_id, [0.05, 0.12])
```

### Instant Account Verification

```elixir
# Uses Plaid, Finicity, or similar
verify_payer(payer_id, :instant, %{
  plaid_access_token: "access-sandbox-...",
  plaid_account_id: "..."
})
```

### Manual Verification

```elixir
# Document-based verification
verify_payer(payer_id, :manual, %{
  document_type: :bank_statement,
  document_url: "https://..."
})
```

## Provider Implementation Details

### Checkbook

- **Collection Types**: Check deposits, ACH debits
- **Verification**: Micro-deposits
- **Authorization**: WEB, PPD
- **Processing Time**: Standard ACH (2-3 days)

### Dwolla

- **Collection Types**: ACH debits only
- **Verification**: Micro-deposits, instant (Plaid)
- **Authorization**: Stores with Customer
- **Processing Time**: Standard and same-day ACH

## Risk Considerations

1. **Return Risk**: Payer can return ACH debits (up to 60 days for unauthorized)
2. **Fraud Prevention**: Verify payer identity before collecting
3. **Authorization Records**: Maintain proof of authorization
4. **Amount Limits**: Consider velocity and amount limits
5. **Monitoring**: Watch for return patterns

## Usage Patterns

### One-Time Collection

```elixir
# Collect payment for invoice
{:ok, collection} = PaymentCollection.create_collection(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  amount: Money.new(1500_00, :USD),
  payer_id: verified_payer.id,
  authorization_id: web_auth.id,
  description: "Invoice #INV-2024-001",
  reference: "INV-2024-001"
})
```

### Recurring Collection Setup

```elixir
# Create recurring authorization
{:ok, auth} = PaymentCollection.create_authorization(
  payer_id,
  %{
    authorization_type: :web,
    recurring: true,
    frequency: :monthly,
    amount_limit: Money.new(500_00, :USD),
    consent_text: "I authorize recurring monthly charges up to $500",
    consent_timestamp: DateTime.utc_now()
  }
)

# Scheduled collections can reference this auth
```

## Related Resources

- `FundingSource` - Payer bank accounts
- `PaymentAuthorization` - Stored authorizations
- `PaymentCollection` - Collection transactions
- `CollectionReturn` - Return handling

## Code References

- Behavior: `lib/ember_payments/capabilities/payment_collection/behavior.ex`
- Types: `lib/ember_payments/capabilities/payment_collection/types.ex`
- Funding Source: `lib/ember_payments/capabilities/funding_source_management/`
