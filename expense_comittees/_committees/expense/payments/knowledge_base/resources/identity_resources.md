# Identity Verification Resources

Documentation for the KYB/KYC identity verification resources in EmberPayments.

## Resource Hierarchy

```
KybApplication (root)
├── KybApplicationRevision (version history)
├── KybDocument (uploaded docs)
├── BeneficialOwner (owners)
├── KybApplicationProvider (provider mappings)
└── KybVerification (per-provider verification)
    └── KybDocumentVerification (doc verification status)
```

---

## KybApplication

**Location**: `lib/ember_payments/resources/identity/kyb_application.ex`

The root resource for a business identity verification application. Tracks overall onboarding state across providers.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Multi-tenancy key |
| `entity_id` | UUID | Business entity being verified |
| `country` | string | ISO country code |
| `entity_type` | atom | :llc, :corporation, :sole_prop, etc. |
| `status` | atom | Application status |
| `submitted_at` | datetime | First submission time |
| `completed_at` | datetime | Verification completion |
| `rejected_at` | datetime | If rejected |
| `rejection_reasons` | [string] | Rejection details |

### Status Values

```elixir
:not_started      # Created, no data entered
:incomplete       # Partial data
:documents_needed # Missing required docs
:owners_needed    # Missing beneficial owners
:ready_to_submit  # All required data present
:pending_review   # Submitted to provider(s)
:approved         # All verifications passed
:rejected         # Verification failed
:needs_retry      # Correctable issues
:expired          # Timed out
```

### Relationships

```elixir
relationships do
  belongs_to :workspace, Workspace
  belongs_to :entity, Entity
  
  has_many :revisions, KybApplicationRevision do
    sort inserted_at: :desc
  end
  has_many :documents, KybDocument
  has_many :beneficial_owners, BeneficialOwner
  has_many :verifications, KybVerification
  has_many :provider_mappings, KybApplicationProvider
end
```

### Actions

```elixir
# Create new application
action :create, :create do
  accept [:workspace_id, :entity_id, :country, :entity_type]
  change set_attribute(:status, :not_started)
end

# Update status
action :update_status, :update do
  accept [:status, :submitted_at, :completed_at, :rejected_at, :rejection_reasons]
end

# Submit for review
action :submit, :update do
  change CreateApprovalRequest  # If internal approval needed
  change set_attribute(:status, :pending_review)
  change set_attribute(:submitted_at, &DateTime.utc_now/0)
end
```

---

## KybApplicationRevision

**Location**: `lib/ember_payments/resources/identity/kyb_application_revision.ex`

Stores versions of business data as the user edits their application.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Primary key |
| `kyb_application_id` | UUID | Parent application |
| `version` | integer | Revision number |
| `business_data` | map | All business fields |
| `changed_fields` | [string] | Fields changed in this revision |
| `changed_by_id` | UUID | User who made changes |

### Business Data Structure

```elixir
%{
  # Business Information
  legal_name: "Acme Corporation",
  doing_business_as: "Acme",
  ein: "12-3456789",
  incorporation_state: "DE",
  incorporation_date: ~D[2020-01-15],
  
  # Address
  address: %{
    street1: "123 Main Street",
    street2: "Suite 100",
    city: "San Francisco",
    state: "CA",
    postal_code: "94102",
    country: "US"
  },
  
  # Contact
  phone: "+14155551234",
  email: "compliance@acme.com",
  website: "https://acme.com",
  
  # Classification
  industry: "Technology",
  naics_code: "541511",
  annual_revenue: 5_000_000,
  employee_count: 25,
  
  # Controller (signing officer)
  controller: %{
    first_name: "Jane",
    last_name: "Smith",
    title: "CEO",
    email: "jane@acme.com"
  }
}
```

---

## KybDocument

**Location**: `lib/ember_payments/resources/identity/kyb_document.ex`

Manages document uploads for identity verification.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Primary key |
| `kyb_application_id` | UUID | Parent application |
| `kyb_verification_id` | UUID | Optional: specific verification |
| `document_type` | atom | Type of document |
| `file_url` | string | Storage URL |
| `file_name` | string | Original filename |
| `file_size` | integer | Size in bytes |
| `mime_type` | string | Content type |
| `status` | atom | Upload/verification status |
| `provider_document_id` | string | Provider's doc ID |
| `rejection_reason` | string | If rejected |

### Document Types

```elixir
:articles_of_incorporation   # Formation document
:tax_id_document             # IRS EIN confirmation letter
:proof_of_address            # Utility bill, bank statement
:operating_agreement         # LLC operating agreement
:bylaws                      # Corporation bylaws
:voided_check                # Bank account proof
:bank_statement              # Account statement
:certificate_of_good_standing
:business_license
:beneficial_owner_id         # Owner's government ID
:passport
:drivers_license
:other
```

### Status Values

```elixir
:pending          # Awaiting upload
:uploaded         # File uploaded
:submitted        # Sent to provider
:verified         # Provider accepted
:rejected         # Provider rejected
:expired          # Document expired
```

### Calculations

```elixir
calculate :view_url, :string do
  calculation ViewUrl
  # Generates signed URL for document viewing
end
```

---

## BeneficialOwner

**Location**: `lib/ember_payments/resources/identity/beneficial_owner.ex`

Stores information about individuals who own or control the business.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Primary key |
| `kyb_application_id` | UUID | Parent application |
| `first_name` | string | Owner's first name |
| `last_name` | string | Owner's last name |
| `date_of_birth` | date | DOB |
| `ssn_last_four` | string | Last 4 of SSN (displayed) |
| `ssn_encrypted` | binary | Full SSN (encrypted) |
| `ownership_percentage` | decimal | % ownership |
| `title` | string | Job title |
| `is_control_person` | boolean | Has significant control |
| `verification_status` | atom | KYC status |
| `provider_owner_id` | string | Provider's owner ID |
| `address` | map | Owner's address |

### Address Structure

```elixir
%{
  street1: "456 Oak Avenue",
  street2: nil,
  city: "New York",
  state: "NY",
  postal_code: "10001",
  country: "US"
}
```

### Verification Status

```elixir
:pending          # Not yet verified
:submitted        # Submitted to provider
:verified         # Identity confirmed
:failed           # Verification failed
:needs_document   # Additional doc needed
```

---

## KybVerification

**Location**: `lib/ember_payments/resources/identity/kyb_verification.ex`

Tracks the verification state with a specific provider.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Primary key |
| `kyb_application_id` | UUID | Parent application |
| `provider` | atom | Provider (:dwolla, :marqeta) |
| `status` | atom | Verification status |
| `provider_verification_id` | string | Provider's verification ID |
| `provider_business_token` | string | Platform model business ID |
| `submitted_at` | datetime | When submitted |
| `completed_at` | datetime | When completed |
| `failure_reasons` | [string] | If failed |
| `retry_count` | integer | Number of retries |

### Manual Actions

| Action | Module | Description |
|--------|--------|-------------|
| `verify_identity` | VerifyIdentity | Start verification |
| `upload_document` | UploadDocument | Upload doc to provider |
| `update_business_info` | UpdateBusinessInfo | Update business data |
| `submit_verification` | SubmitVerification | Submit for review |
| `add_beneficial_owner` | AddBeneficialOwner | Add owner |
| `remove_beneficial_owner` | RemoveBeneficialOwner | Remove owner |
| `delete_document` | DeleteDocument | Remove document |
| `cancel_verification` | CancelVerification | Cancel process |
| `sync_status` | SyncStatus | Sync with provider |

---

## Form Schema Resources

### IdentityFormSchema

**Location**: `lib/ember_payments/resources/identity/identity_form_schema.ex`

Defines the dynamic form structure for business onboarding.

```elixir
# Returns form definition for rendering
def get_schema(country, entity_type) do
  %{
    fields: [
      %{
        name: :legal_name,
        type: :text,
        label: "Legal Business Name",
        required: true,
        validation: %{min_length: 2, max_length: 255}
      },
      %{
        name: :ein,
        type: :text,
        label: "EIN",
        required: true,
        format: :tax_id,
        placeholder: "XX-XXXXXXX"
      },
      # ... more fields
    ],
    field_groups: [
      %{name: :business_info, label: "Business Information", fields: [:legal_name, :ein, ...]},
      %{name: :address, label: "Business Address", fields: [:street1, :city, ...]},
      %{name: :contact, label: "Contact Information", fields: [:phone, :email, ...]}
    ],
    required_documents: [
      :articles_of_incorporation,
      :tax_id_document,
      :proof_of_address
    ]
  }
end
```

### Supporting Modules

| Module | Purpose |
|--------|---------|
| `IdentityFormSchemaHelpers` | Field generation helpers |
| `KybFormValidator` | Form validation logic |
| `KybFormFieldMerger` | Country-specific field merging |
| `KybGeneralFormSchema` | Base field definitions |

---

## Usage Patterns

### Starting Verification

```elixir
# Create application
{:ok, app} = KybApplication.create(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  country: "US",
  entity_type: :llc
})

# Save business data
{:ok, revision} = KybApplicationRevision.create(%{
  kyb_application_id: app.id,
  business_data: %{
    legal_name: "Acme Corp",
    ein: "12-3456789",
    # ... more data
  }
})
```

### Uploading Documents

```elixir
# Upload document
{:ok, doc} = KybDocument.create(%{
  kyb_application_id: app.id,
  document_type: :articles_of_incorporation,
  file_url: uploaded_file_url,
  file_name: "articles.pdf",
  file_size: 245_000,
  mime_type: "application/pdf"
})

# Send to provider (via reactor)
{:ok, _} = KybVerification.upload_document(%{
  verification_id: verification.id,
  document_id: doc.id
})
```

### Adding Beneficial Owners

```elixir
{:ok, owner} = BeneficialOwner.create(%{
  kyb_application_id: app.id,
  first_name: "Jane",
  last_name: "Smith",
  date_of_birth: ~D[1980-05-15],
  ssn_last_four: "1234",
  ownership_percentage: Decimal.new("35.5"),
  title: "CEO",
  is_control_person: true,
  address: %{
    street1: "456 Oak Ave",
    city: "New York",
    state: "NY",
    postal_code: "10001",
    country: "US"
  }
})
```

### Submitting for Review

```elixir
# Submit application (triggers provider submissions)
{:ok, submitted} = KybApplication.submit(app.id)

# Check status later
{:ok, app} = KybApplication
|> Ash.Query.filter(id == ^app_id)
|> Ash.Query.load([:verifications, :documents, :beneficial_owners])
|> Ash.read_one()
```

## Code References

- **KybApplication**: `lib/ember_payments/resources/identity/kyb_application.ex`
- **KybVerification**: `lib/ember_payments/resources/identity/kyb_verification.ex`
- **BeneficialOwner**: `lib/ember_payments/resources/identity/beneficial_owner.ex`
- **KybDocument**: `lib/ember_payments/resources/identity/kyb_document.ex`
- **Manual Actions**: `lib/ember_payments/resources/identity/kyb_verification/manual_actions/`
- **Reactors**: `lib/ember_payments/reactors/identity/`
