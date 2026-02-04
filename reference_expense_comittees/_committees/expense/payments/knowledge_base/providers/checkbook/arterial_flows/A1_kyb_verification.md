# A1: KYB Verification Flow

> **Flow Type**: Arterial (Setup)  
> **Provider**: Checkbook.io  
> **Status**: Production  
> **Last Updated**: 2026-01-08

---

## Plain English Summary

Before a company can send checks through Checkbook, they need to prove they're a real, legitimate business. This is like opening a bank account — the bank needs to know who you are.

**Analogy**: Think of it like applying for a business credit card. You fill out one form with your company info, your personal info as the business owner, and the info of anyone who owns 25%+ of the company.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  A1: KYB VERIFICATION — "Who Is This Business?"                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STEP 1: Collect Information                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Business Info:                                                  │   │
│  │  • Business name ("Acme Corp")                                   │   │
│  │  • Tax ID / EIN (12-3456789)                                     │   │
│  │  • Business address                                              │   │
│  │  • Website (optional)                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Controller Info (the person in charge):                         │   │
│  │  • Full name, Date of birth                                      │   │
│  │  • SSN (or passport for non-US)                                  │   │
│  │  • Home address                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Beneficial Owners (anyone owning 25%+):                         │   │
│  │  • Up to 4 owners                                                │   │
│  │  • Same info: name, DOB, SSN, address                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  STEP 2: Submit to Checkbook (ONE API CALL)                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │    PUT /v3/user                                                  │   │
│  │    {                                                             │   │
│  │      user: { controller info },                                  │   │
│  │      merchant: { business info },                                │   │
│  │      owners: [ { owner1 }, { owner2 } ... ]                      │   │
│  │    }                                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          ▼                                              │
│  STEP 3: Receive Response                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Checkbook returns:                                              │   │
│  │  • User ID (your account in Checkbook)                           │   │
│  │  • API Key + Secret (for making payments)                        │   │
│  │  • Status: verified (usually instant!)                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Details

### Endpoint

```
PUT /v3/user
```

### Request Structure

```json
{
  "user": {
    "business_name": "Acme Corp",
    "first_name": "John",
    "last_name": "Smith",
    "dob": "1985-03-15",
    "ssn": "123456789",
    "phone": "5551234567"
  },
  "merchant": {
    "tax_id": "123456789",
    "website": "https://acme.com",
    "legal_firstname": "John",
    "legal_lastname": "Smith",
    "address": {
      "line_1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "principal_address": {
      "line_1": "456 Home Ave",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94110",
      "country": "US"
    }
  },
  "owners": [
    {
      "first_name": "Jane",
      "last_name": "Doe",
      "dob": "1980-07-20",
      "ssn": "987654321",
      "address": {
        "line_1": "789 Owner St",
        "city": "Oakland",
        "state": "CA",
        "zip": "94612",
        "country": "US"
      }
    }
  ]
}
```

### Response Structure

```json
{
  "id": "chk_user_abc123",
  "user_id": "usr_xyz789",
  "key": "ak_live_xxxxxxxxxxxx",
  "secret": "sk_live_xxxxxxxxxxxx",
  "status": "verified"
}
```

---

## Outcomes

| Outcome | Status | What Happens Next |
|---------|--------|-------------------|
| ✅ **Verified** | `verified` | Business approved, can proceed to A2 (funding source) |
| ⏳ **Pending** | `pending` | Review in progress, poll for updates |
| ❌ **Rejected** | `rejected` | Verification failed, check rejection details |
| 📝 **Requires Input** | `requires_input` | Missing info, update and resubmit |

---

## Code Implementation

### Orchestrator

```elixir
# lib/.../ember_payments/services/checkbook_kyb_orchestrator.ex

def start_verification(application, opts \\ []) do
  workspace_id = opts[:workspace_id] || application.workspace_id

  with {:ok, owner_connection} <- get_checkbook_owner_connection(entity_id, workspace_id),
       {:ok, form_data} <- transform_form_data(application),
       {:ok, user_response} <- create_checkbook_user(owner_connection, form_data),
       {:ok, user_connection} <- create_user_connection(application, user_response, workspace_id),
       {:ok, verification} <- create_verification_record(application, form_data, workspace_id, user_response),
       {:ok, verified_verification} <- mark_verification_as_verified(verification),
       {:ok, submitted_verification} <- submit_to_checkbook(verified_verification, user_connection, form_data) do
    {:ok, submitted_verification}
  end
end
```

### Identity Verification Capability

```elixir
# lib/.../adapters/providers/checkbook/capabilities/identity_verification.ex

def verify_identity(credentials_or_connection, entity_data, opts \\ []) do
  config = extract_config(credentials_or_connection)
  payload = build_checkbook_payload(entity_data)
  
  case Client.put(config, "/user", payload) do
    {:ok, response} -> {:ok, parse_verification_response(response)}
    {:error, error} -> {:error, error}
  end
end
```

---

## Key Differences from Dwolla

| Aspect | Checkbook | Dwolla |
|--------|-----------|--------|
| **API Calls** | 1 call (PUT /user) | 5+ calls |
| **Webhooks** | ❌ None — uses polling | ✅ Real-time webhooks |
| **Approval Time** | Usually instant | Hours to days |
| **Document Upload** | Via dashboard only | Via API |
| **Beneficial Owners** | In same call (0-4) | Separate API calls |

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `missing_business_name` | No business name in form data | Ensure `business_name` field is populated |
| `invalid_tax_id` | Tax ID format incorrect | Use 9 digits, no dashes |
| `invalid_ssn` | SSN format incorrect | Use 9 digits, no dashes |
| `no_checkbook_owner_connection` | No owner connection found | Create owner connection first |

### Error Response Example

```json
{
  "error": "Invalid request",
  "errors": [
    { "field": "merchant.tax_id", "message": "Invalid EIN format" }
  ]
}
```

---

## Testing Checklist

- [ ] Successful verification with all fields
- [ ] Verification with 0 beneficial owners
- [ ] Verification with 4 beneficial owners (max)
- [ ] Handle missing required fields
- [ ] Handle invalid SSN/EIN format
- [ ] Passport instead of SSN (non-US controller)
- [ ] Polling for pending status
- [ ] Rejection handling

---

## Related Flows

- **Next**: [A2: Funding Source Setup](./A2_funding_source_setup.md) — Connect bank account after KYB
- **Alternative**: Manual verification via Checkbook dashboard

---

*"One form, one call, verified."*

