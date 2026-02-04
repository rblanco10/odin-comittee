# Identity Verification Capability

**Behavior Module**: `FlameTeampayPayables.EmberPayments.Capabilities.IdentityVerification.Behavior`  
**Types Module**: `FlameTeampayPayables.EmberPayments.Capabilities.IdentityVerification.Types`

## Purpose

The Identity Verification capability handles Know Your Business (KYB) and Know Your Customer (KYC) compliance requirements. This is the foundation for onboarding businesses and individuals onto payment platforms, ensuring regulatory compliance before money can move.

## Verification Levels

| Level | Description | Requirements | Use Case |
|-------|-------------|--------------|----------|
| **Basic** | Basic business info | Name, EIN, Address | Low-risk, low-volume |
| **Enhanced** | With documents | Basic + Gov ID, Proof of Address | Standard onboarding |
| **Full** | Complete KYB | Enhanced + Beneficial Owners | High-value, regulated |

## Callback Functions

### Verification Operations

```elixir
@callback verify_identity(config, entity_data, opts) ::
            {:ok, verification_result()} | {:error, term()}

@callback get_verification_status(config, verification_id) ::
            {:ok, verification_status()} | {:error, term()}

@callback upload_document(config, verification_id, document) ::
            {:ok, document_upload_result()} | {:error, term()}

@callback submit_verification(config, verification_id) ::
            {:ok, verification_result()} | {:error, term()}
```

### Beneficial Ownership

```elixir
@callback add_beneficial_owner(config, verification_id, owner_data) ::
            {:ok, beneficial_owner_result()} | {:error, term()}

@callback update_beneficial_owner(config, verification_id, owner_id, owner_data) ::
            {:ok, beneficial_owner_result()} | {:error, term()}

@callback remove_beneficial_owner(config, verification_id, owner_id) ::
            {:ok, :removed} | {:error, term()}
```

### Business Management (Platform Model)

```elixir
@callback create_business(config, business_data, opts) ::
            {:ok, business_result()} | {:error, term()}

@callback get_business(config, business_token) ::
            {:ok, business_details()} | {:error, term()}

@callback update_business(config, business_token, business_data) ::
            {:ok, business_details()} | {:error, term()}

@callback list_businesses(config, opts) ::
            {:ok, [business_summary()]} | {:error, term()}

@callback activate_business(config, business_token, opts) ::
            {:ok, business_transition_result()} | {:error, term()}

@callback get_business_transitions(config, business_token) ::
            {:ok, [business_transition()]} | {:error, term()}
```

### Form Schema

```elixir
@callback business_form_schema(country, entity_type) :: map()
```

## Document Types

```elixir
:articles_of_incorporation   # Business formation docs
:tax_id_document             # EIN letter, W-9
:proof_of_address            # Utility bill, bank statement
:beneficial_owner_id         # Government-issued ID
:bank_statement              # Account verification
:voided_check                # Bank account proof
```

## Verification Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     1. CREATE VERIFICATION                       │
│  verify_identity(entity_data) → verification_id                  │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                     2. UPLOAD DOCUMENTS                          │
│  upload_document(verification_id, document) × N                  │
│  Documents: articles_of_incorporation, tax_id, proof_of_address  │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                  3. ADD BENEFICIAL OWNERS                        │
│  add_beneficial_owner(verification_id, owner_data) × N           │
│  Required for >25% ownership stake                               │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                    4. SUBMIT FOR REVIEW                          │
│  submit_verification(verification_id)                            │
│  Status changes to :pending_review                               │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      ASYNC PROCESSING      │
                    │   (Provider-side review)   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
           ┌──────────────┐            ┌──────────────┐
           │   APPROVED   │            │   REJECTED   │
           │ (via webhook)│            │ (via webhook)│
           └──────────────┘            └──────────────┘
```

## Verification Status Lifecycle

```elixir
:not_started      # Verification created, no data submitted
:incomplete       # Partial data, missing required items
:documents_needed # Awaiting document uploads
:pending_review   # Submitted, under review
:approved         # Verification passed
:rejected         # Verification failed
:needs_retry      # Correctable issues found
:expired          # Verification window closed
```

## Entity Data Structure

```elixir
@type entity_data :: %{
  # Business Information
  legal_name: String.t(),
  doing_business_as: String.t() | nil,
  entity_type: entity_type(),
  tax_id: String.t(),
  incorporation_date: Date.t() | nil,
  incorporation_state: String.t(),
  
  # Address
  address: %{
    street1: String.t(),
    street2: String.t() | nil,
    city: String.t(),
    state: String.t(),
    postal_code: String.t(),
    country: String.t()
  },
  
  # Contact
  phone: String.t(),
  email: String.t(),
  website: String.t() | nil,
  
  # Classification
  industry: String.t(),
  naics_code: String.t() | nil,
  annual_revenue: Money.t() | nil,
  employee_count: non_neg_integer() | nil
}
```

## Beneficial Owner Data

```elixir
@type beneficial_owner_data :: %{
  first_name: String.t(),
  last_name: String.t(),
  date_of_birth: Date.t(),
  ssn: String.t(),                  # Last 4 or full
  ownership_percentage: Decimal.t(),
  title: String.t() | nil,
  is_control_person: boolean(),
  
  address: %{
    street1: String.t(),
    street2: String.t() | nil,
    city: String.t(),
    state: String.t(),
    postal_code: String.t(),
    country: String.t()
  }
}
```

## Provider Implementation Details

### Dwolla

- **Model**: Platform model with sub-accounts
- **KYB Flow**: Create Customer → Upload docs → Certify ownership
- **Certification**: Controller certification required
- **Retry**: Re-upload documents for failed verifications

### Marqeta

- **Model**: Card program-based KYC
- **Business Creation**: Via `/businesses` endpoint
- **KYC Flow**: Create business (inactive) → Add KYC → Activate
- **Transitions**: State machine for business lifecycle

## Related Resources

### KYB Application (`kyb_application.ex`)

Central resource for managing verification applications:

```elixir
# Tracks overall application state
attributes do
  attribute :status, :atom
  attribute :submitted_at, :utc_datetime
  attribute :completed_at, :utc_datetime
  attribute :provider_application_id, :string
end

relationships do
  has_many :revisions, KybApplicationRevision
  has_many :beneficial_owners, BeneficialOwner
  has_many :documents, KybDocument
  belongs_to :verification, KybVerification
end
```

### KYB Verification (`kyb_verification.ex`)

Tracks provider-specific verification state:

```elixir
# Manual actions for verification workflow
manual_actions :sync_status, SyncStatus
manual_actions :verify_identity, VerifyIdentity
manual_actions :upload_document, UploadDocument
manual_actions :update_business_info, UpdateBusinessInfo
manual_actions :submit_verification, SubmitVerification
manual_actions :add_beneficial_owner, AddBeneficialOwner
manual_actions :remove_beneficial_owner, RemoveBeneficialOwner
manual_actions :delete_document, DeleteDocument
manual_actions :cancel_verification, CancelVerification
```

## Form Schema System

The `business_form_schema/2` callback enables dynamic form generation:

```elixir
# Returns form definition for LiveView rendering
%{
  fields: [
    %{
      name: :business_name,
      type: :text,
      label: "Business Name",
      required: true,
      placeholder: "Enter legal business name",
      validation: %{min_length: 2, max_length: 255},
      country_specific: %{
        "US" => %{label: "Legal Business Name"},
        "CA" => %{label: "Business Name"}
      }
    },
    # ... more fields
  ],
  field_groups: [
    %{
      name: :business_info,
      label: "Business Information",
      fields: [:business_name, :entity_type, :tax_id]
    }
  ]
}
```

Supporting modules:
- `IdentityFormSchema` - Base schema definitions
- `IdentityFormSchemaHelpers` - Field helper functions
- `KybFormValidator` - Validation logic
- `KybFormFieldMerger` - Country-specific field merging
- `KybGeneralFormSchema` - General form fields

## Related Reactors

| Reactor | Purpose |
|---------|---------|
| `VerifyIdentityReactor` | Initiate verification |
| `SubmitVerificationReactor` | Submit for review |
| `UploadDocumentReactor` | Document upload flow |
| `UploadDocumentToApplicationReactor` | App-level doc upload |
| `AddBeneficialOwnerReactor` | Owner addition |
| `UpdateBusinessInfoReactor` | Update business data |
| `SubmitApplicationReactor` | Full application submit |

## Security Considerations

1. **PII Protection**: SSNs, tax IDs encrypted at rest
2. **Document Storage**: Secure, encrypted file storage
3. **Access Control**: Limit who can view verification details
4. **Audit Trail**: Log all verification state changes
5. **Data Minimization**: Only collect required data
6. **Retention**: Follow data retention regulations

## Code References

- Behavior: `lib/ember_payments/capabilities/identity_verification/behavior.ex`
- Types: `lib/ember_payments/capabilities/identity_verification/types.ex`
- Application: `lib/ember_payments/resources/identity/kyb_application.ex`
- Verification: `lib/ember_payments/resources/identity/kyb_verification.ex`
- Beneficial Owner: `lib/ember_payments/resources/identity/beneficial_owner.ex`
- Documents: `lib/ember_payments/resources/identity/kyb_document.ex`
- Form Schema: `lib/ember_payments/resources/identity/identity_form_schema.ex`
- Reactors: `lib/ember_payments/reactors/identity/*.ex`
