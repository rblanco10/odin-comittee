# SC-2026-01-05-005: Database Evidence Report

**Generated:** 2026-01-05 23:45 UTC  
**Purpose:** Document direct database query results to support session findings

---

## 1. Reimbursement Request Under Investigation

**Query:**
```sql
SELECT rr.id, rr.description, rr.status, rr.employee_id,
       we.first_name, we.last_name, we.email, we.employee_number, we.erp_employee_id
FROM reimbursement_requests rr
LEFT JOIN workforce_employees we ON rr.employee_id = we.id
WHERE rr.id = 'eff64f82-1d4f-4050-99cc-5c196b8691d0'
```

**Result:**
| Field | Value |
|-------|-------|
| ID | `eff64f82-1d4f-4050-99cc-5c196b8691d0` |
| Description | Test R: 3 receipts |
| Status | `paid` |
| Employee ID (Workforce) | `d23e2d38-9748-4372-aec3-e38182cff9c9` |
| Employee Name | **Demo Admin** |
| Employee Email | **admin@demo.local** |
| Employee Number | *(empty)* |
| ERP Employee Link | **nil** ← No link to Accounting Employee |

---

## 2. Workforce Employees with @netsuite.com Email

**Query:**
```sql
SELECT first_name, last_name, email
FROM workforce_employees
WHERE email ILIKE '%netsuite%'
```

**Result:** ❌ **0 records found**

**Conclusion:** There are NO workforce employees with `@netsuite.com` email addresses in our system. The `jbucoy@netsuite.com` email comes ONLY from the synced Accounting Employee record.

---

## 3. Accounting Employees (Synced from NetSuite)

**Query:**
```sql
SELECT external_id, employee_number, email, status
FROM ember_erp_accounting_employees
ORDER BY inserted_at ASC
LIMIT 15
```

**Result:**
| External ID | Employee Number | Email | Status |
|-------------|-----------------|-------|--------|
| **1640** | **Jan Bucoy** | **jbucoy@netsuite.com** | active |
| 1425 | Scott Winborne | swinborne@netsuite.com | active |
| 1511 | Sarah Jenson | sj@test.com | active |
| 28 | Tom A Taylor | ttaylor@ramsey.com | active |
| 24 | Carmen Matthews | cmatthews@ramsey.com | active |
| 215 | Julie Winters | jwinters@ramsey.com | active |
| 21 | Andy Andrews | asnow@ramsey.com | active |
| 1314 | Eric Givens | egivens@ramsey.com | active |
| 30 | Inger H Wyman | iwyman@ramsey.com | active |
| 1469 | Ivan Smith | ismith@gagarin.com | active |
| 26 | Jessica L Sikes | jsikes@ramsey.com | active |
| 1032 | Jill Muscat | jmuscat@ramsey.com | active |
| 20 | Joanna L Hammack | jhammack@ramsey.com | active |
| 1521 | John Mayo | *(empty)* | active |
| 1326 | Kate Ferris | kferris@ramsey.com | active |

**Key Finding:** Jan Bucoy (external_id: 1640) was the **FIRST** accounting employee synced from NetSuite. The fallback logic selected this employee because it queries `ORDER BY inserted_at ASC LIMIT 1`.

---

## 4. Jan Bucoy Sync Details

**Query:**
```sql
SELECT * FROM ember_erp_accounting_employees WHERE external_id = '1640'
```

**Result:**
| Field | Value |
|-------|-------|
| ID | `03c74d35-fa0b-4080-892a-b55ad40dee47` |
| External ID | 1640 |
| Employee Number | Jan Bucoy |
| Email | jbucoy@netsuite.com |
| Status | active |
| ERP Connection ID | `73b4668b-68fc-4b74-a981-d1ffe35e4265` |
| Inserted At | **2026-01-05 19:37:51.291236** |

**Conclusion:** This record was **synced from NetSuite**, not created in our system. The `@netsuite.com` email is the employee's email address in NetSuite.

---

## 5. Workforce Employees with ERP Links

**Query:**
```sql
SELECT we.first_name, we.last_name, we.email, we.erp_employee_id
FROM workforce_employees we
WHERE we.erp_employee_id IS NOT NULL
LIMIT 10
```

**Result:** ❌ **0 records found**

**Conclusion:** No workforce employees are currently linked to accounting employees. This explains why ALL pushes would fall back to the first NetSuite employee.

---

## 6. Expense Categories (Synced from NetSuite)

**Query:**
```sql
SELECT external_id, category_code, category_name, active
FROM ember_erp_accounting_expense_categories
ORDER BY inserted_at ASC
LIMIT 15
```

**Result:**
| External ID | Code | Name | Active |
|-------------|------|------|--------|
| 4 | Telephone Expense | Telephone Expense | true |
| 5 | Office Related Expenses | Office Related Expenses | true |
| 6 | Conference Fees | Conference Fees | true |
| 1 | Cellular Phone | Cellular Phone | true |
| 8 | Insurance | Insurance | true |
| 9 | Insurance-disability | Insurance-disability | true |
| 11 | Suspense Account | Suspense Account | true |
| 12 | Manufactoring | Manufactoring | true |
| 13 | Machine | Machine | true |
| 14 | Utilities R | Utilities R | true |
| 16 | Office Expense | Office Expense | true |
| 17 | Miscellaneous Expense | Miscellaneous Expense | true |
| **18** | **Accounting** | **Accounting** | true |
| 2 | Meals & Entertainment | Meals & Entertainment | true |
| 7 | Advertising | Advertising | true |

**Key Finding:** Expense category **ID 18 (Accounting)** was used as a fallback. The log shows "Using expense category: 18" — this was a NetSuite lookup fallback, not a mapping from our data.

---

## 7. Push Request for the Reimbursement

**Query:**
```sql
SELECT id, entity_type, status, push_metadata
FROM ember_erp_push_requests
WHERE source_resource_id = 'eff64f82-1d4f-4050-99cc-5c196b8691d0'
```

**Result:**
| Field | Value |
|-------|-------|
| ID | `60f8d493-d0c2-43d9-8f8a-75db6e428ef1` |
| Entity Type | expense_report |
| Status | **pushed** |
| Metadata (excerpt) | `{"entity_record_id": "ce1eae80-b84e-42ae-8b55-0dc4e2bceeda", "expense_date": "2026-01-05", "line_items": [3 items]}` |

---

## Summary of Database Findings

| Concern | Database Evidence | Status |
|---------|-------------------|--------|
| Jan Bucoy email source | From `ember_erp_accounting_employees`, synced from NetSuite | ✅ CONFIRMED |
| Exists in our users? | ❌ No users or workforce employees with @netsuite.com | ✅ CONFIRMED |
| Actual reimbursement employee | Demo Admin (admin@demo.local) | ✅ CONFIRMED |
| ERP employee link exists? | ❌ `erp_employee_id: nil` | ✅ CONFIRMED |
| Why Jan Bucoy was used | First active accounting employee (ORDER BY inserted_at ASC LIMIT 1) | ✅ CONFIRMED |
| Expense categories synced? | ✅ 15+ categories synced from NetSuite | ✅ CONFIRMED |
| Category 18 (Accounting) | Used as fallback, not from our data | ✅ CONFIRMED |

---

*Evidence collected via direct PostgreSQL queries — SC-2026-01-05-005*

