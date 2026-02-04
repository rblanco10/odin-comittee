# Domain Boundaries

> **Last Verified**: 2026-01-14

---

## Overview

The `flame_ps_ar` application contains **seven domains** with distinct boundaries and responsibilities.

---

## Domain Catalog

### 1. Classic Domain (`FlamePsAr.Classic.Domain`)

**Location**: `lib/flame_ps_ar/classic/`  
**Domain File**: `lib/flame_ps_ar/classic/domain.ex`  
**Database**: MySQL  
**Tenant**: `owner_id` (KSUID)

**Purpose**: Core Accounts Receivable functionality (excluding payments)

**Key Resource Groups**:
- **Receivables**: `classic/receivables/` - Receivable, ReceivableAttachment, ReceivableFund, etc.
- **Customers**: `classic/customers/` - Payer, PayerCustomer, PayerProfile, etc.
- **Collections**: `classic/collections/` - Collection, CollectionPlan, CollectionAction
- **Fees**: `classic/fees/` - Fee, FeeSetting, FeeSettingPlan, CollectedFee
- **Accounting**: `classic/accounting/` - AccountingEntry, AccountingAccount, etc.
- **Integrations**: `classic/integrations/` - ERP and payment processor integrations
- **Transfers**: `classic/transfers/` - Transfer, Withdrawal, Deposit, Wire
- **System**: `classic/system/` - Action, Event, Resource, Trigger, etc.

**Subcommittee Ownership**: SC01-SC04, SC06, SC11

---

### 2. Payments Domain (`FlamePsAr.Classic.Payments`)

**Location**: `lib/flame_ps_ar/classic/payments/`  
**Domain File**: `lib/flame_ps_ar/classic/payments/payments.ex`  
**Database**: MySQL  
**Tenant**: `owner_id` (KSUID)

**Purpose**: Payment processing and management

**Key Resource Groups**:
- **Core Payments**: Payment, PaymentRequest, PaymentErp, Payout
- **Autopay**: Autopay, AutopayEvent, Schedule
- **Banking**: `payments/banking/` - Bank, ACH, Sessions (23 resources)
- **Cards**: `payments/cards/` - Card, WEX fleet cards, Amex (15 resources)
- **Mandates**: Mandate, MandateRequest, MandateStripe

**Subcommittee Ownership**: SC05

---

### 3. Events Domain (`FlamePsAr.Events`)

**Location**: `lib/flame_ps_ar/events/`  
**Domain File**: `lib/flame_ps_ar/events/domain.ex`  
**Database**: PostgreSQL  
**Tenant**: `workspace_id` (UUID)

**Purpose**: Change event capture and dispatch infrastructure

**Resources**:
- `ChangeEvent` - Captured changes from MySQL sources
- `EventCursor` - Tracks sync progress (capture and dispatch)
- `HandlerExecution` - Tracks handler execution per event

**Supporting Components**:
- `ChangeEventRegistry` - GenServer for source/handler configuration
- `CaptureChanges` Reactor - Polls MySQL for changes
- `DispatchEvents` Reactor - Dispatches events to handlers

**Subcommittee Ownership**: SC09

---

### 4. Ember ERP Domain (`FlamePsAr.EmberErp`)

**Location**: `lib/flame_ps_ar/ember_erp/`  
**Domain File**: `lib/flame_ps_ar/ember_erp/domain.ex`  
**Database**: PostgreSQL  
**Tenant**: `workspace_id` (UUID)

**Purpose**: ERP integration, synchronization, and accounting

**Key Resource Groups**:
- **Adapters**: `adapters/providers/` - NetSuite, QuickBooks, Sage Intacct, Xero
- **Capabilities**: Pull, Push operations
- **Resources**: ErpSync, ErpInvoice, AccountingEntry, GlTransaction (63 resources)
- **Reactors**: Pull, Push workflows

**Subcommittee Ownership**: SC07-SC08, SC10

---

### 5. Ember Workspaces Domain (`FlamePsAr.EmberWorkspaces`)

**Location**: `lib/flame_ps_ar/ember_workspaces/`  
**Domain File**: `lib/flame_ps_ar/ember_workspaces/domain.ex`  
**Database**: PostgreSQL  
**Tenant**: `workspace_id` (UUID)

**Purpose**: Workspace and entity management

**Key Resources**:
- `Entity` - Links workspace to classic_owner_id
- `EntityMapping` - Maps PostgreSQL UUIDs to MySQL KSUIDs
- `Workspace` - Workspace configuration
- `WorkspaceSsoConnection` - SSO connections
- `UserMembership` - User access to workspaces
- `UserInvitation` - Workspace invitations
- `ApiKey` - API key management
- `CustomDomain` - Custom domain configuration

**Subcommittee Ownership**: Cross-cutting (SC11, SC15)

---

### 6. Ember Identity Domain (`FlamePsAr.EmberIdentity`)

**Location**: `lib/flame_ps_ar/ember_identity/`  
**Domain File**: `lib/flame_ps_ar/ember_identity/domain.ex`  
**Database**: PostgreSQL  
**Tenant**: Not multi-tenant (global user identities)

**Purpose**: Authentication and user identity management

**Key Resources**:
- `User` - Core user identity
- `Session` - JWT session management
- `MagicLinkToken` - Passwordless email authentication
- `OAuthIdentity` - Social login provider linking
- `MfaConfig` - Multi-factor authentication
- `DeviceRegistration` - WebAuthn/FIDO2 keys
- `AuthEvent` - Security event logging
- `AccountLockout` - Brute-force protection

**Subcommittee Ownership**: Cross-cutting (SC11)

**Details**: See `knowledge_base/architecture/ember_identity_domain.md`

---

### 7. Payments Domain - PostgreSQL (`FlamePsAr.Payments`)

**Location**: `lib/flame_ps_ar/payments/`  
**Domain File**: `lib/flame_ps_ar/payments/payments.ex`  
**Database**: PostgreSQL  
**Tenant**: `workspace_id` (UUID)

**Purpose**: Global autopay configuration and Oban workers

**⚠️ DISTINCT FROM**: `FlamePsAr.Classic.Payments` (MySQL)

**Resources**:
- `AutopayConfiguration` - Global autopay settings per workspace

**Subcommittee Ownership**: SC05

**Details**: See `knowledge_base/architecture/payments_postgres_domain.md`

---

## Cross-Domain Interactions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DOMAIN INTERACTIONS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐          ┌─────────────────────┐                   │
│  │   Classic Domain    │◄────────►│   Payments Domain   │                   │
│  │   (MySQL)           │          │   (MySQL)           │                   │
│  │                     │          │                     │                   │
│  │  Receivables        │ apply    │  Payment            │                   │
│  │  Customers          │ payment  │  Autopay            │                   │
│  │  Collections        │◄─────────│  Banking            │                   │
│  │  Fees               │          │  Cards              │                   │
│  └──────────┬──────────┘          └──────────┬──────────┘                   │
│             │                                │                               │
│             │ poll for changes               │ poll for changes              │
│             ▼                                ▼                               │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                     Events Domain (PostgreSQL)                   │        │
│  │                                                                  │        │
│  │  ChangeEvent ◄─── CaptureChanges ◄─── MySQL sources             │        │
│  │       │                                                          │        │
│  │       │ dispatch                                                 │        │
│  │       ▼                                                          │        │
│  │  DispatchEvents ───► Handlers (ERP Push, Webhooks)              │        │
│  └──────────────────────────────────────────────────────────────────┘        │
│                                     │                                        │
│                                     │ invoke                                 │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                   Ember ERP Domain (PostgreSQL)                  │        │
│  │                                                                  │        │
│  │  Push Reactor ───► ERP Adapters ───► External ERPs              │        │
│  │  Pull Reactor ◄─── ERP Adapters ◄─── External ERPs              │        │
│  └──────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │              Ember Workspaces Domain (PostgreSQL)                │        │
│  │                                                                  │        │
│  │  Entity (provides classic_owner_id for MySQL tenant context)    │        │
│  │  EntityMapping (links PostgreSQL UUIDs to MySQL KSUIDs)         │        │
│  └──────────────────────────────────────────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Boundary Rules

### Rule 1: No Direct Cross-Domain Resource Access

Resources in one domain should NOT directly reference resources in another domain. Use IDs and services for cross-domain operations.

### Rule 2: Tenant Context Passes Through

When crossing domain boundaries, tenant context MUST be maintained:
- MySQL domains: `owner_id` (KSUID)
- PostgreSQL domains: `workspace_id` (UUID)
- Use `Entity` and `EntityMapping` to bridge contexts

### Rule 3: Database Boundaries Are Hard

MySQL and PostgreSQL domains use different databases. Transactions cannot span both. Use eventual consistency via Events domain.

### Rule 4: Events Bridge Databases

The Events domain captures changes from MySQL and dispatches to PostgreSQL-based handlers, providing eventual consistency across database boundaries.

---

## Domain Summary Table

| # | Domain | Location | Database | Tenant | Resources | Subcommittees |
|---|--------|----------|----------|--------|-----------|---------------|
| 1 | Classic | `classic/` | MySQL | `owner_id` | ~310 | SC01-04, SC06, SC10-11 |
| 2 | Classic.Payments | `classic/payments/` | MySQL | `owner_id` | ~61 | SC05 |
| 3 | Events | `events/` | PostgreSQL | `workspace_id` | 3 | SC09 |
| 4 | Ember ERP | `ember_erp/` | PostgreSQL | `workspace_id` | ~63 | SC07-08, SC10 |
| 5 | Ember Workspaces | `ember_workspaces/` | PostgreSQL | `workspace_id` | ~39 | SC11, SC15 |
| 6 | Ember Identity | `ember_identity/` | PostgreSQL | (global) | ~10 | SC11 |
| 7 | Payments (PG) | `payments/` | PostgreSQL | `workspace_id` | 1 | SC05 |

---

## Related Documentation

- Events domain: `knowledge_base/architecture/events_domain.md`
- Ember Identity domain: `knowledge_base/architecture/ember_identity_domain.md`
- Payments (PostgreSQL) domain: `knowledge_base/architecture/payments_postgres_domain.md`
- Classic domain breakdown: `knowledge_base/architecture/classic_domain_breakdown.md`
- Three-layer model: `knowledge_base/architecture/three_layer_model.md`
- Multi-tenancy: `knowledge_base/architecture/multitenancy.md`

---

*"Clear boundaries prevent chaos."*

