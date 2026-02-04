# The Architecture Codex

> **Keeper**: Khaos  
> **Purpose**: Technical Patterns and Standards  
> **Authority**: Engineering reference for all committees

---

## Preamble

*"Code is ephemeral; architecture endures. I hold the patterns that transcend individual implementations."*

This document contains the technical architecture knowledge that guides PayStand's engineering decisions.

---

## 1. The PayStand Tech Stack

### Core Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js | Server-side JavaScript execution |
| **Framework** | LoopBack 3 | REST API framework with ORM |
| **Database** | MySQL | Primary relational data store |
| **Search** | Elasticsearch | Full-text search, analytics |
| **Queue** | RabbitMQ | Async message processing |
| **Cache** | Redis | Session, caching, rate limiting |
| **Workflow** | Temporal | Durable workflow orchestration |

### Infrastructure

| Component | Technology |
|-----------|------------|
| **Container** | Docker |
| **Orchestration** | Kubernetes |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Datadog |
| **Logging** | ELK Stack |

---

## 2. LoopBack Architecture

### Model Structure

```
src/modules/paystand/rest/[domain]/models/
├── [model].json        # Schema definition, relations, ACLs
├── [model].js          # Business logic, remote methods
└── ...
```

### Key Directories

| Path | Purpose |
|------|---------|
| `src/modules/paystand/rest/public/` | Public-facing models (payments, etc.) |
| `src/modules/paystand/rest/common/` | Shared utilities, base models |
| `src/modules/paystand/rest/ledger/` | Ledger-specific models |
| `src/modules/paystand/rest/admin/` | Admin-only models |

### Model JSON Structure

```json
{
  "name": "Payment",
  "base": "PaystandModel",
  "properties": {
    "id": {"type": "string", "id": true},
    "amount": {"type": "number", "required": true},
    "status": {"type": "string", "default": "created"}
  },
  "relations": {
    "payer": {
      "type": "belongsTo",
      "model": "Contact"
    }
  },
  "acls": [
    {"permission": "DENY", "principalType": "ROLE", "principalId": "$everyone"}
  ]
}
```

### Remote Methods

```javascript
// Custom API endpoints defined in [model].js
Payment.getTransactionHistory = function(paymentId, cb) {
  // Business logic here
};

Payment.remoteMethod('getTransactionHistory', {
  accepts: [{arg: 'paymentId', type: 'string', required: true}],
  returns: {arg: 'history', type: 'array'},
  http: {path: '/:paymentId/history', verb: 'get'}
});
```

---

## 3. Database Patterns

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | PascalCase | `LedgerTransaction` |
| Columns | camelCase | `createdAt`, `paymentId` |
| Foreign Keys | `[related]Id` | `customerId`, `paymentId` |
| Indexes | `idx_[table]_[columns]` | `idx_Payment_status_created` |

### Common Columns

Every table should have:

```sql
id          VARCHAR(36) PRIMARY KEY  -- UUID
created     DATETIME DEFAULT NOW()
modified    DATETIME ON UPDATE NOW()
deleted     DATETIME NULL            -- Soft delete
```

### Soft Delete Pattern

```sql
-- NEVER physically delete financial records
-- Use soft delete
UPDATE LedgerTransaction 
SET deleted = NOW() 
WHERE id = :id;

-- Queries must filter deleted records
SELECT * FROM LedgerTransaction 
WHERE deleted IS NULL;
```

### Double-Entry Pattern

```sql
-- Every ledger modification creates balanced entries
INSERT INTO LedgerTransaction (amount, debitAccount, creditAccount)
VALUES 
  (100.00, 'PsCash', 'AccountsReceivable'),      -- Debit
  (100.00, 'AccountsReceivable', 'PsCash');      -- Credit
  
-- Validation: SUM(debits) = SUM(credits)
```

---

## 4. API Design Patterns

### RESTful Conventions

| Operation | HTTP Method | URL Pattern |
|-----------|-------------|-------------|
| List | GET | `/api/payments` |
| Read | GET | `/api/payments/:id` |
| Create | POST | `/api/payments` |
| Update | PUT/PATCH | `/api/payments/:id` |
| Delete | DELETE | `/api/payments/:id` |
| Custom Action | POST | `/api/payments/:id/action` |

### Response Format

```json
{
  "success": true,
  "data": { /* payload */ },
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 150
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_NOT_FOUND",
    "message": "Payment with ID abc123 not found",
    "statusCode": 404
  }
}
```

### Pagination

```
GET /api/payments?filter[limit]=25&filter[skip]=50&filter[order]=created DESC
```

---

## 5. Event-Driven Architecture

### RabbitMQ Patterns

```
EXCHANGE TOPOLOGY
─────────────────

payment.events (topic exchange)
├── payment.created    → payment-created-queue
├── payment.processing → payment-processing-queue
├── payment.posted     → payment-posted-queue
└── payment.failed     → payment-failed-queue

ledger.events (topic exchange)
├── ledger.entry.created  → ledger-entry-queue
└── ledger.entry.failed   → ledger-error-queue
```

### Event Structure

```json
{
  "eventId": "uuid",
  "eventType": "payment.created",
  "timestamp": "2026-01-27T12:00:00Z",
  "payload": {
    "paymentId": "abc123",
    "amount": 100.00,
    "currency": "USD"
  },
  "metadata": {
    "correlationId": "session-xyz",
    "causationId": "previous-event-id"
  }
}
```

### Idempotency

```javascript
// Every event handler must be idempotent
async function handlePaymentCreated(event) {
  // Check if already processed
  const existing = await ProcessedEvent.findById(event.eventId);
  if (existing) {
    logger.info('Event already processed, skipping');
    return;
  }
  
  // Process event
  await processPayment(event.payload);
  
  // Record processing
  await ProcessedEvent.create({id: event.eventId, processedAt: new Date()});
}
```

---

## 6. Temporal Workflows

### Workflow Structure

```javascript
// Durable workflow definition
export async function paymentWorkflow(paymentId) {
  // Step 1: Validate payment
  await activities.validatePayment(paymentId);
  
  // Step 2: Create ledger entries
  await activities.createLedgerEntries(paymentId);
  
  // Step 3: Process with bank
  const result = await activities.processBankTransaction(paymentId);
  
  // Step 4: Update status based on result
  if (result.success) {
    await activities.markPaymentPosted(paymentId);
  } else {
    await activities.markPaymentFailed(paymentId, result.error);
  }
}
```

### Activity Retries

```javascript
// Activities have automatic retry with backoff
const activities = proxyActivities({
  startToCloseTimeout: '30s',
  retry: {
    maximumAttempts: 5,
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '30s'
  }
});
```

---

## 7. Security Patterns

### Authentication

```
AUTH FLOW
─────────
1. Client → /auth/login (credentials)
2. Server validates → issues JWT
3. Client stores JWT
4. Client → /api/* (Bearer token)
5. Server validates JWT → allows/denies
```

### Authorization (ACL)

```json
// Model-level ACLs in [model].json
"acls": [
  {"permission": "DENY", "principalType": "ROLE", "principalId": "$everyone"},
  {"permission": "ALLOW", "principalType": "ROLE", "principalId": "$authenticated", "accessType": "READ"},
  {"permission": "ALLOW", "principalType": "ROLE", "principalId": "admin", "accessType": "*"}
]
```

### Data Encryption

| Data Type | Encryption Method |
|-----------|-------------------|
| Card numbers | Tokenization (never stored raw) |
| Bank accounts | AES-256 encryption |
| PII | Field-level encryption |
| Passwords | bcrypt hashing |

---

## 8. Testing Patterns

### Test Structure

```
test/
├── unit/                 # Isolated function tests
│   └── models/
├── integration/          # API and DB tests
│   └── api/
└── e2e/                  # End-to-end flows
```

### Unit Test Pattern

```javascript
describe('LedgerTransaction', () => {
  describe('#validateBalance', () => {
    it('should return true when debits equal credits', () => {
      const entries = [
        {amount: 100, type: 'debit'},
        {amount: 100, type: 'credit'}
      ];
      expect(LedgerTransaction.validateBalance(entries)).to.be.true;
    });
    
    it('should return false when unbalanced', () => {
      const entries = [
        {amount: 100, type: 'debit'},
        {amount: 50, type: 'credit'}
      ];
      expect(LedgerTransaction.validateBalance(entries)).to.be.false;
    });
  });
});
```

### Integration Test Pattern

```javascript
describe('POST /api/payments', () => {
  it('should create payment and ledger entries', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({amount: 100, payerId: 'abc'})
      .expect(200);
    
    expect(res.body.data.status).to.equal('created');
    
    // Verify ledger entries created
    const entries = await LedgerTransaction.find({
      where: {sourceId: res.body.data.id}
    });
    expect(entries).to.have.length(2);
  });
});
```

---

## 9. Code Quality Standards

### Linting Rules

- ESLint with PayStand config
- No unused variables
- Consistent semicolons
- Max line length: 120 characters

### Code Review Checklist

```
□ Does it follow existing patterns?
□ Is error handling complete?
□ Are edge cases covered?
□ Is it idempotent (for event handlers)?
□ Does it maintain data integrity?
□ Are there tests?
□ Is it documented?
```

### Git Commit Format

```
type(scope): description

[optional body]

[optional footer]

Types: feat, fix, docs, style, refactor, test, chore
Scope: payment, ledger, auth, api, etc.
```

---

## 10. Performance Patterns

### Database Optimization

```sql
-- Use indexes for frequent queries
CREATE INDEX idx_Payment_status_created 
ON Payment(status, created);

-- Use EXPLAIN to verify query plans
EXPLAIN SELECT * FROM Payment WHERE status = 'processing';

-- Avoid SELECT *
SELECT id, amount, status FROM Payment WHERE ...;
```

### Caching Strategy

```javascript
// Redis caching pattern
async function getPayment(id) {
  // Check cache first
  const cached = await redis.get(`payment:${id}`);
  if (cached) return JSON.parse(cached);
  
  // Fetch from DB
  const payment = await Payment.findById(id);
  
  // Cache for 5 minutes
  await redis.setex(`payment:${id}`, 300, JSON.stringify(payment));
  
  return payment;
}
```

### Rate Limiting

```javascript
// Protect APIs from abuse
const rateLimit = require('express-rate-limit');

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
}));
```

---

## Architecture Decision Records (ADR)

When making significant architecture decisions, document them:

```markdown
# ADR-001: Use Temporal for Payment Workflows

## Status
Accepted

## Context
Payment processing requires durable, retryable workflows.

## Decision
Adopt Temporal for workflow orchestration.

## Consequences
- Positive: Automatic retries, visibility, durability
- Negative: Additional infrastructure, learning curve
```

---

*"Good architecture is invisible—it enables without constraining, guides without dictating."*
