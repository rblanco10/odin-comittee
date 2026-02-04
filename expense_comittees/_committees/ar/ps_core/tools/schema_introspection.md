# Schema Introspection Tool

> **Purpose**: Discover database schema for committee knowledge bases  
> **Used By**: Khaos (Genesis), Hephaestus (Knowledge Seeding)

---

## Overview

When creating a new committee or seeding its knowledge base, Khaos and Hephaestus need to understand the relevant database schema. This tool provides methods for schema discovery.

---

## Method 1: Metabase MCP (Preferred)

Use the Metabase MCP server to query schema information.

### Get Database Schema

```
MCP Server: user-metabase-server
Tool: get_database_schema

Parameters:
- database_id: (usually 2 for production)
- table_name: (optional, for specific table)
```

### Example: Get All Tables

```
get_database_schema(database_id=2)
```

### Example: Get Specific Table

```
get_database_schema(database_id=2, table_name="LedgerTransaction")
```

---

## Method 2: LoopBack Model Files

Read the model definition files directly from the codebase.

### Model JSON Location

```
src/modules/paystand/rest/[domain]/models/[model].json
```

### Key Directories

| Domain | Path |
|--------|------|
| **Public** | `src/modules/paystand/rest/public/models/` |
| **Ledger** | `src/modules/paystand/rest/ledger/models/` |
| **Common** | `src/modules/paystand/rest/common/models/` |
| **Admin** | `src/modules/paystand/rest/admin/models/` |

### Example: Read Payment Model

```
Read: src/modules/paystand/rest/public/models/payment.json
```

### Model JSON Structure

```json
{
  "name": "ModelName",
  "base": "BaseModel",
  "properties": {
    "columnName": {
      "type": "string|number|date|boolean",
      "required": true|false,
      "default": "value"
    }
  },
  "relations": {
    "relationName": {
      "type": "belongsTo|hasMany|hasOne",
      "model": "RelatedModel",
      "foreignKey": "keyName"
    }
  }
}
```

---

## Method 3: Direct Database Query

For tables not well-documented in models, query MySQL directly via Metabase.

### Get Table Columns

```sql
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'paystand' 
AND TABLE_NAME = :tableName
ORDER BY ORDINAL_POSITION;
```

### Get Table Indexes

```sql
SHOW INDEX FROM :tableName;
```

### Get Foreign Keys

```sql
SELECT 
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'paystand'
AND TABLE_NAME = :tableName
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## Schema Documentation Output

When documenting schema for a knowledge base, use this format:

```markdown
## Table: TableName

### Description
[What this table stores]

### Columns

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | VARCHAR(36) | NO | PRI | Primary key (UUID) |
| created | DATETIME | NO | | Creation timestamp |
| ...

### Relations

| Relation | Type | Related Table | Foreign Key |
|----------|------|---------------|-------------|
| payment | belongsTo | Payment | paymentId |
| ...

### Indexes

| Name | Columns | Unique |
|------|---------|--------|
| idx_status_created | status, created | NO |
| ...
```

---

## Common Tables by Domain

### Ledger Domain

| Table | Purpose |
|-------|---------|
| LedgerTransaction | Individual ledger entries |
| LedgerInstruction | Rules for creating entries |
| LedgerTransactionSource | Links entries to sources |
| BalanceEntry | Account balance tracking |
| BalanceAccount | Account definitions |

### Payment Domain

| Table | Purpose |
|-------|---------|
| Payment | Payment records |
| PaymentSource | Payment funding sources |
| Fund | Merchant fund accounts |
| Withdrawal | Fund withdrawals |
| Transfer | Money movement records |

### Customer Domain

| Table | Purpose |
|-------|---------|
| Organization | Top-level customer entity |
| Contact | Payer/payee records |
| BankAccount | Bank account information |
| Card | Card information (tokenized) |

---

## Validation Checklist

Before including schema in knowledge base:

- [ ] Table exists in production
- [ ] Column names match actual database
- [ ] Data types are accurate
- [ ] Relations are verified
- [ ] Sensitive columns identified (PII, financial)
