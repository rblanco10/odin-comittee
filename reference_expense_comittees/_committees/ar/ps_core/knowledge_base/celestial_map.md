# The Celestial Map

> **Keeper**: Khaos  
> **Purpose**: Technical Topology of the PayStand Universe  
> **Version**: 1.0

---

## Preamble

*"The Universe describes what we are. The Celestial Map describes how we are built. Every star has its place, every force its purpose. Know this map, and you navigate the cosmos."*

This document maps the technical infrastructure of PayStand—the repositories, services, dependencies, and data flows that constitute the living system.

---

## 1. The Primordial Core: Roadrunner

> *"From the core, all else derives its gravity."*

| Attribute | Value |
|-----------|-------|
| **Repository** | `git@gitlab.com:paystand/roadrunner.git` |
| **Type** | Monolithic API Server |
| **Framework** | LoopBack 3 (Node.js) |
| **Language** | JavaScript (Node 12.16.1) |
| **Primary Port** | 3000 (HTTP), 3001 (HTTPS) |
| **API Root** | `/api/v3` |

### What Roadrunner Contains

```
roadrunner/
├── src/
│   ├── modules/paystand/rest/     # All API models and business logic
│   │   ├── public/models/         # Public-facing models (Payment, etc.)
│   │   ├── ledger/models/         # Ledger transaction models
│   │   ├── common/models/         # Shared utilities
│   │   └── admin/models/          # Admin models
│   ├── config.json                # Default configuration
│   ├── config.development.json    # Local development overrides
│   └── datasources.json           # Database connections
├── worker/                        # Background workers (Graphile, etc.)
├── bin/                           # CLI tools and scripts
├── database/                      # SQL migrations and schemas
└── test/                          # Test suites
```

### Roadrunner's Responsibilities

- Payment processing orchestration
- Ledger transaction management
- Customer/Organization management
- ERP integrations (NetSuite, Sage, Dynamics)
- Bank session handling
- Checkout orchestration
- Background job processing (Graphile workers)

---

## 2. The Luminaries: Major Applications

These are the primary celestial bodies—the major applications that users interact with.

### Fifilafume (PayStand Dashboard)

> *"The face mortals see when they gaze upon PayStand."*

| Attribute | Value |
|-----------|-------|
| **Repository** | `git@gitlab.com:paystand/fifilafume.git` |
| **Type** | Frontend Application |
| **Framework** | Angular |
| **Local Port** | 8080 |
| **Also Contains** | Checkout v4 |
| **Common Name** | "PayStand Dashboard" |

**Purpose**: The primary merchant-facing application. AR management, AP management, settings, integrations, and reporting all live here.

### Checkout v5

| Attribute | Value |
|-----------|-------|
| **Repository** | `git@gitlab.com:paystand/checkout-v5.git` |
| **Type** | Frontend Application |
| **Framework** | Modern JavaScript (likely React/Vue) |
| **Local Port** | 4040 |

**Purpose**: The next-generation payment checkout experience for payers.

### Payer Portal API

| Attribute | Value |
|-----------|-------|
| **Repository** | `git@gitlab.com:paystand/payer-portal-api.git` |
| **Type** | Backend API |
| **Local Port** | 3006 |
| **API Root** | `/api/v1/` |

**Purpose**: API serving the payer-facing portal where payers manage their payment methods and history.

---

## 3. The Wandering Stars: Microservices

These services orbit Roadrunner, handling specialized domains.

### Banking & Financial Services

| Service | Repository | Purpose | Local Port |
|---------|------------|---------|------------|
| **Synapsefi** | `git@gitlab.com:paystand/synapsefi.git` | Banking-as-a-Service integration | 4000 |
| **Sophtron API** | `git@gitlab.com:paystand/sophtron-api.git` | Bank account verification | 4004 |
| **Currency Cloud** | `git@gitlab.com:paystand/ms-currencycloud.git` | International payments | 4001 |
| **Stripe Service** | `git@gitlab.com:paystand/ms-stripe.git` | Stripe payment processing | 4000 |

### ERP Integrations

| Service | Repository | Purpose | Local Port |
|---------|------------|---------|------------|
| **MS Dynamics 365** | `git@gitlab.com:paystand/ms-dynamics365.git` | Dynamics 365 integration | 4000 |
| **MS LiteSync** | `git@gitlab.com:paystand/ms-litesync.git` | Lightweight ERP sync | 4009 |
| **MS ERP Import PDF** | `git@gitlab.com:paystand/ms-erp-import-pdf.git` | PDF invoice import | 4005 |
| **Elmerfudd** | `git@gitlab.com:paystand/elmerfudd.git` | NetSuite SuiteScript/Bundle | N/A (NetSuite) |

### Operational Services

| Service | Repository | Purpose | Local Port |
|---------|------------|---------|------------|
| **Transfer Reports** | `git@gitlab.com:paystand/transfer-reports.git` | Transfer report generation | N/A (Temporal) |
| **Message Hub** | `git@gitlab.com:paystand/message-hub.git` | Email service orchestration | N/A (RabbitMQ) |
| **Email Templates** | `git@gitlab.com:paystand/email-templates.git` | Email template repository | N/A (S3) |
| **CSV Report Generator** | `git@gitlab.com:paystand/csv-report-generator.git` | CSV export generation | N/A |

### Bank Connection Services

| Service | Repository | Purpose | Local Port |
|---------|------------|---------|------------|
| **Universal Connect** | `git@gitlab.com:paystand/universal-connect.git` | Bank aggregator abstraction | N/A |
| **UCW App** | `git@gitlab.com:paystand/ucw-app.git` | Universal Connect Widget | 8082 |

### Customer Management

| Service | Repository | Purpose | Local Port |
|---------|------------|---------|------------|
| **MS XCustomer** | `git@gitlab.com:paystand/ms_xcustomer.git` | Cross-customer operations | N/A |

### E-Commerce Integrations

| Service | Repository | Purpose | Local Port |
|---------|------------|---------|------------|
| **WooCommerce Compose** | `git@gitlab.com:paystand/woocomerce-compose.git` | WooCommerce integration | N/A |

---

## 4. The Binding Forces: Infrastructure Dependencies

These are the gravitational forces that hold the universe together.

### Required for Roadrunner

| Dependency | Version | Purpose | Default Port |
|------------|---------|---------|--------------|
| **Node.js** | 12.16.1 | Runtime | N/A |
| **MySQL** | 5.7 | Primary database | 3306 (Docker: 8889) |
| **PostgreSQL** | Latest | Graphile worker queue | 5432 |
| **Redis** | Latest | Cache, sessions, locks | 6379 |
| **Elasticsearch** | 6.x | Search, analytics | 9200 |
| **RabbitMQ** | Latest | Message queue (AMQP) | 5672 |
| **Kafka** | Latest | Event streaming | 29092 |
| **Beanstalkd** | Latest | Job queue | 11300 |
| **Localstack** | Latest | AWS S3 mock | 4572 |

### Optional (Feature-Specific)

| Dependency | Purpose | Required For |
|------------|---------|--------------|
| **Temporal Server** | Workflow orchestration | Transfer Reports |

---

## 5. Database Architecture

### Primary Databases

| Database | Connection | Purpose |
|----------|------------|---------|
| `paystandv3` | MySQL (roadrunner_core) | Core application data |
| `paystandv3_media` | MySQL (roadrunner_media) | Media/attachments |
| `graphile` | PostgreSQL | Background job queue |

### Datasource Configuration

```json
// src/datasources.json structure (secrets redacted)
{
  "mysql": {
    "connector": "mysql",
    "database": "paystandv3",
    "port": 8889  // Docker-mapped port
  },
  "roadrunner_core": {
    "connector": "mysql",
    "database": "paystandv3"
  },
  "roadrunner_media": {
    "connector": "mysql", 
    "database": "paystandv3_media"
  },
  "roadrunner_core_postgresql": {
    "connector": "postgresql",
    "database": "roadrunner_core",
    "port": 5432
  }
}
```

### Database Mapping (Read Replicas)

Roadrunner intelligently routes queries between core and replica databases:

| Query Type | Database | Purpose |
|------------|----------|---------|
| `getAvailableBalance` | roadrunner_core | Real-time balance (write DB) |
| `getTransactionHistory` | roadrunner_replica | Historical queries |
| `getTransferReport` | roadrunner_replica | Heavy reporting queries |
| Default | roadrunner_replica | Read-heavy operations |

---

## 6. The Cosmic Currents: Data Flows

### Payment Flow

```
Checkout → Roadrunner API → Payment Created
                ↓
         Kafka (payment.created)
                ↓
         Ledger Transaction Created
                ↓
         Bank/Card Processor (Stripe/Vantiv)
                ↓
         Webhook → Status Update
                ↓
         Kafka (payment.posted)
                ↓
         ERP Sync (if integrated)
```

### Email Flow

```
Roadrunner → RabbitMQ (MessageHub-Send-Email)
                ↓
         Message Hub Service
                ↓
         Email Templates (S3)
                ↓
         Mandrill/SendGrid
```

### Bank Session Flow

```
Checkout v5 → Roadrunner API
                ↓
         Universal Connect Widget
                ↓
         Sophtron/MX/Plaid
                ↓
         Bank Verified
                ↓
         Webhook → Roadrunner
```

### Transfer Report Flow (Temporal)

```
Transfer Report Request
        ↓
  Temporal Workflow Started
        ↓
  transfer-reports service
        ↓
  Query roadrunner_replica
        ↓
  Generate Report
        ↓
  Store in S3
        ↓
  Notify via webhook
```

---

## 7. Message Queue Topology

### RabbitMQ Queues

| Queue | Purpose | Consumer |
|-------|---------|----------|
| `MessageHub-Send-Email` | Email delivery | Message Hub |
| `MessageHub-Send-Text` | SMS delivery | Message Hub |

### Kafka Topics

| Topic Pattern | Purpose |
|---------------|---------|
| `payment.*` | Payment lifecycle events |
| `ledger.*` | Ledger entry events |
| `customer.*` | Customer/org events |

### Graphile Worker Tasks

| Task | Purpose | Cluster |
|------|---------|---------|
| `send-email` | Email dispatch | fast |
| `process-payment-fees` | Fee calculation | pay |
| `process-autopay` | Autopay processing | fast |
| `process-hold` | Hold processing | pay |
| `manage-collections` | Collection reminders | fast |

---

## 8. External Integrations

### Payment Processors

| Processor | Purpose | Config Key |
|-----------|---------|------------|
| **Stripe** | Card processing (primary) | `stripe` |
| **Vantiv/Worldpay** | Card processing (alternate) | `vantiv` |
| **Synapsefi** | ACH processing | `synapsefi` |

### ERP Systems

| ERP | Integration Type | Config Key |
|-----|------------------|------------|
| **NetSuite** | SuiteScript + REST | `netsuite`, `netsuite2` |
| **Sage Intacct** | XML API | `sage.intacct` |
| **MS Dynamics 365** | Microservice | `msdynamics` |
| **Acumatica** | Microservice | `acumatica` |
| **QuickBooks** | OAuth | TBD |
| **Xero** | OAuth | `xero` |

### Bank Verification

| Provider | Purpose | Config Key |
|----------|---------|------------|
| **Sophtron** | Bank verification | `sophtron`, `psSophtron` |
| **Plaid** | Bank verification | Via Universal Connect |
| **MX** | Bank verification | Via Universal Connect |

---

## 9. Port Reference Guide

### Core Services

| Service | HTTP Port | HTTPS Port |
|---------|-----------|------------|
| Roadrunner API | 3000 | 3001 |
| Fifilafume (Dashboard) | 8080 | - |
| Checkout v5 | 4040 | - |
| Payer Portal API | 3006 | - |

### Microservices

| Service | Port |
|---------|------|
| Synapsefi | 4000/4003 |
| Sophtron API | 4004 |
| Currency Cloud | 4001 |
| Stripe Service | 4000 |
| MS Dynamics | 4000 |
| MS LiteSync | 4009 |
| ERP Import PDF | 4005 |
| UCW App | 8082 |

### Infrastructure

| Service | Port |
|---------|------|
| MySQL | 3306 (8889 Docker) |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Elasticsearch | 9200 |
| RabbitMQ | 5672 |
| Kafka | 29092 |
| Beanstalkd | 11300 |
| Localstack (S3) | 4572 |
| Temporal | 7233 |

---

## 10. Repository-to-Lineage Mapping

When creating committees, use this guide to determine which repositories fall under which Protogenos:

| Lineage | Repositories |
|---------|--------------|
| **Gaia** (Infrastructure) | roadrunner (core), database schemas, paystand-compose |
| **Tartarus** (Security) | Authentication modules, encryption, access control |
| **Eros** (Product/UX) | fifilafume, checkout-v5, payer-portal-api |
| **Nyx** (Operations) | message-hub, transfer-reports, csv-report-generator |
| **Erebus** (Finance/Ledger) | roadrunner/ledger, transfer-reports, reconciliation |

---

## Quick Reference: "Where Does X Live?"

| Domain | Repository | Key Files |
|--------|------------|-----------|
| Payment processing | roadrunner | `src/modules/paystand/rest/public/models/payment.js` |
| Ledger entries | roadrunner | `src/modules/paystand/rest/ledger/models/` |
| Dashboard UI | fifilafume | - |
| Checkout experience | fifilafume (v4), checkout-v5 (v5) | - |
| Email sending | message-hub | - |
| NetSuite integration | roadrunner + elmerfudd | - |
| Sage integration | roadrunner | `src/modules/paystand/rest/*/models/*sage*` |
| Bank verification | sophtron-api, universal-connect | - |
| Transfer reports | transfer-reports | Temporal workflows |

---

*"Know the map, and you can navigate anywhere in the cosmos. Lose the map, and you drift in the void."*
