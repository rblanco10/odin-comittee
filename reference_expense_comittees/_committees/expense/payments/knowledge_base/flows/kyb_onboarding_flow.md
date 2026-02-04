# KYB Onboarding Flow

## Purpose

Guides a business through Know Your Business (KYB) identity verification, including business information collection, document uploads, beneficial owner certification, and provider verification - the prerequisite for money movement capabilities.

## Actors

| Actor | Role |
|-------|------|
| **Business Admin** | Initiates onboarding, provides data |
| **KybApplication Resource** | Tracks application state |
| **KybVerification Resource** | Provider-specific verification |
| **KybDocument Resource** | Document management |
| **BeneficialOwner Resource** | Owner data collection |
| **Identity Verification Adapter** | Provider API calls |
| **Approval System** | Manual review if needed |

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KYB ONBOARDING FLOW                               │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │   CREATE    │  │   UPLOAD    │  │     ADD     │  │       SUBMIT        ││
│  │ APPLICATION │─▶│  DOCUMENTS  │─▶│   OWNERS    │─▶│   FOR REVIEW        ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┬──────────┘│
│                                                                 │           │
└─────────────────────────────────────────────────────────────────┼───────────┘
                                                                  │
                                                                  ▼
                                                    ┌─────────────────────────┐
                                                    │   PROVIDER REVIEW       │
                                                    │   (async, webhook)      │
                                                    └────────────┬────────────┘
                                                                 │
                              ┌───────────────────────────┬──────┴──────┐
                              ▼                           ▼             ▼
                       ┌──────────────┐          ┌──────────────┐ ┌──────────────┐
                       │   APPROVED   │          │   REJECTED   │ │ NEEDS RETRY  │
                       │ (activated)  │          │  (terminal)  │ │ (correctable)│
                       └──────────────┘          └──────────────┘ └──────────────┘
```

## Phase 1: Create Application

### User Actions
1. User navigates to onboarding
2. Selects country and entity type
3. System generates dynamic form

### System Operations

**Form Schema Generation**:
```elixir
# Get country-specific form schema
schema = IdentityVerificationAdapter.business_form_schema("US", :llc)

# Returns dynamic field definitions
%{
  fields: [
    %{name: :legal_name, type: :text, required: true},
    %{name: :ein, type: :text, required: true, format: :tax_id},
    %{name: :incorporation_state, type: :select, options: states},
    # ... more fields
  ],
  field_groups: [...]
}
```

**Create KYB Application**:
```elixir
{:ok, application} = KybApplication.create(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  country: "US",
  entity_type: :llc,
  status: :not_started
})
```

### Data Model

```elixir
# KybApplication tracks overall state
%KybApplication{
  id: "app_uuid",
  workspace_id: "ws_uuid",
  entity_id: "ent_uuid",
  country: "US",
  entity_type: :llc,
  status: :not_started,
  submitted_at: nil,
  completed_at: nil,
  provider_application_id: nil
}
```

## Phase 2: Collect Business Information

### User Actions
1. Fills in business details form
2. Saves progress (creates revision)
3. Can return and edit before submission

### System Operations

**Create Application Revision**:
```elixir
{:ok, revision} = KybApplicationRevision.create(%{
  kyb_application_id: application.id,
  business_data: %{
    legal_name: "Acme Corporation",
    doing_business_as: "Acme",
    ein: "12-3456789",
    incorporation_state: "DE",
    incorporation_date: ~D[2020-01-15],
    address: %{
      street1: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      postal_code: "94102",
      country: "US"
    },
    phone: "+14155551234",
    email: "compliance@acme.com",
    website: "https://acme.com",
    industry: "Technology",
    naics_code: "541511"
  }
})

# Update application status
KybApplication.update(application.id, %{status: :incomplete})
```

**Form Validation**:
```elixir
# Validate against schema
KybFormValidator.validate(business_data, schema, country)
# Returns {:ok, validated_data} or {:error, errors}
```

## Phase 3: Upload Documents

### Required Documents (US)

| Document Type | Description | Required For |
|---------------|-------------|--------------|
| Articles of Incorporation | Formation document | All entities |
| Tax ID Document | IRS EIN confirmation | All entities |
| Proof of Address | Recent utility/bank statement | All entities |
| Operating Agreement | LLC governance | LLCs only |

### User Actions
1. Uploads required documents
2. Can upload supporting documents
3. Documents validated for format/quality

### System Operations

**Upload Document Reactor**:
```elixir
# UploadDocumentReactor handles multi-step upload
{:ok, document} = KybVerification.upload_document(%{
  verification_id: verification.id,
  document_type: :articles_of_incorporation,
  file: %Plug.Upload{...},
  metadata: %{
    original_filename: "articles.pdf"
  }
})
```

**Document Processing**:
1. Validate file format (PDF, PNG, JPG)
2. Check file size limits
3. Upload to secure storage
4. Create KybDocument record
5. Optionally send to provider

**KybDocument Record**:
```elixir
%KybDocument{
  id: "doc_uuid",
  kyb_verification_id: "ver_uuid",
  document_type: :articles_of_incorporation,
  file_url: "s3://bucket/path/doc.pdf",
  file_name: "articles.pdf",
  file_size: 245_000,
  mime_type: "application/pdf",
  status: :uploaded,
  provider_document_id: nil
}
```

## Phase 4: Add Beneficial Owners

### Requirements

Per FinCEN regulations, must identify any individual who:
- Owns 25% or more of the business
- Has significant control (e.g., CEO, CFO, COO)

### User Actions
1. Adds each beneficial owner
2. Provides personal info (name, DOB, SSN, address)
3. Indicates ownership percentage and titles

### System Operations

**Add Beneficial Owner Reactor**:
```elixir
{:ok, owner} = KybVerification.add_beneficial_owner(%{
  verification_id: verification.id,
  owner_data: %{
    first_name: "Jane",
    last_name: "Smith",
    date_of_birth: ~D[1980-05-15],
    ssn: "XXX-XX-1234",  # Last 4 for some providers
    ownership_percentage: Decimal.new("35.5"),
    title: "CEO",
    is_control_person: true,
    address: %{
      street1: "456 Oak Avenue",
      city: "New York",
      state: "NY",
      postal_code: "10001",
      country: "US"
    }
  }
})
```

**BeneficialOwner Record**:
```elixir
%BeneficialOwner{
  id: "owner_uuid",
  kyb_application_id: "app_uuid",
  first_name: "Jane",
  last_name: "Smith",
  date_of_birth: ~D[1980-05-15],
  ssn_last_four: "1234",
  ssn_encrypted: "encrypted_blob",
  ownership_percentage: #Decimal<35.5>,
  title: "CEO",
  is_control_person: true,
  verification_status: :pending,
  provider_owner_id: nil
}
```

## Phase 5: Submit for Review

### Validation Before Submit

```elixir
# Validate documents exist and are complete
defp validate_documents_before_submit(application) do
  required_docs = get_required_documents(application.country, application.entity_type)
  uploaded_docs = application.documents |> Enum.map(& &1.document_type)
  
  missing = required_docs -- uploaded_docs
  if Enum.empty?(missing) do
    {:ok, :complete}
  else
    {:error, {:missing_documents, missing}}
  end
end
```

### Submit Application Reactor

```elixir
# SubmitApplicationReactor orchestrates submission
{:ok, result} = KybVerification.submit_verification(%{
  verification_id: verification.id
})

# Steps:
# 1. Validate all required data present
# 2. Create provider verification (if not exists)
# 3. Upload all documents to provider
# 4. Upload beneficial owner data to provider
# 5. Submit verification request
# 6. Create approval request (if manual review needed)
# 7. Update application status to :pending_review
```

### Internal Approval Flow (Optional)

```elixir
# Create approval request for internal review
ApprovalRequest.create(%{
  approvable_type: "KybApplication",
  approvable_id: application.id,
  approval_flow_id: workspace.kyb_approval_flow_id,
  requested_by_id: user.id,
  status: :pending
})
```

## Phase 6: Provider Review

### Async Processing

Provider reviews application asynchronously. Updates arrive via webhooks.

### Webhook Events

```elixir
# Webhook handler for verification status updates
def handle_webhook(%{type: "verification.status_changed"} = event) do
  verification = get_verification_by_provider_id(event.verification_id)
  
  case event.status do
    "approved" ->
      complete_verification(verification, :approved)
    
    "rejected" ->
      reject_verification(verification, event.reasons)
    
    "document_required" ->
      request_additional_documents(verification, event.required_docs)
    
    "information_required" ->
      request_additional_info(verification, event.required_fields)
  end
end
```

### Status Updates

```elixir
defp complete_verification(verification, :approved) do
  Ash.Changeset.for_update(verification, :complete, %{
    status: :approved,
    completed_at: DateTime.utc_now()
  })
  |> Ash.update()
  
  # Update related application
  KybApplication.update(verification.kyb_application_id, %{
    status: :approved,
    completed_at: DateTime.utc_now()
  })
  
  # Activate business at provider (Platform Model)
  if verification.use_platform_model do
    IdentityVerificationAdapter.activate_business(
      config,
      verification.provider_business_token
    )
  end
end
```

## Provider-Specific Flows

### Dwolla

```
1. Create unverified Customer
2. Upload documents via /documents
3. Add beneficial owners via /beneficial-owners
4. Certify beneficial ownership
5. Wait for automatic verification
6. Manual review if flagged
```

### Marqeta (Platform Model)

```
1. Create Business (inactive)
2. Update Business with KYC data
3. Add authorized users
4. Request KYC verification
5. Wait for status change
6. Activate Business on approval
```

## Error Handling

| Error | Phase | Resolution |
|-------|-------|------------|
| Invalid form data | 2 | Show validation errors |
| Document upload failed | 3 | Retry upload |
| Owner SSN invalid | 4 | Re-enter owner data |
| Missing documents | 5 | Block submit, show missing |
| Provider rejected | 6 | Show reasons, allow retry |
| Timeout | Any | Allow resume from last state |

## Application State Machine

```
:not_started      # Application created, no data
:incomplete       # Partial data entered
:documents_needed # Missing required documents
:owners_needed    # Missing beneficial owners
:ready_to_submit  # All data complete
:pending_review   # Submitted, awaiting provider
:approved         # Verification passed
:rejected         # Verification failed
:needs_retry      # Correctable issues
:expired          # Verification window closed
```

## Code References

- **KybApplication**: `lib/ember_payments/resources/identity/kyb_application.ex`
- **KybVerification**: `lib/ember_payments/resources/identity/kyb_verification.ex`
- **BeneficialOwner**: `lib/ember_payments/resources/identity/beneficial_owner.ex`
- **KybDocument**: `lib/ember_payments/resources/identity/kyb_document.ex`
- **Form Schema**: `lib/ember_payments/resources/identity/identity_form_schema.ex`
- **Form Validator**: `lib/ember_payments/resources/identity/kyb_form_validator.ex`
- **Reactors**: `lib/ember_payments/reactors/identity/*.ex`
