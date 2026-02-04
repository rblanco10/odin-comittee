# Multi-Entity Data Scoping: Wiring Diagram

> **Visual representation of the complete data flow for entity resolution.**

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ERP SYNC FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
     │   NetSuite   │     │ Sage Intacct │     │  QuickBooks  │
     │   OneWorld   │     │              │     │    Online    │
     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
            │                    │                    │
            │ subsidiary         │ LOCATIONID         │ (none)
            │                    │                    │
            ▼                    ▼                    ▼
     ┌─────────────────────────────────────────────────────────┐
     │                   CAPABILITY ROUTER                      │
     │              (fetch_page for each entity type)           │
     └─────────────────────────────┬───────────────────────────┘
                                   │
                                   ▼
     ┌─────────────────────────────────────────────────────────┐
     │                       MAPPERS                            │
     │   ┌─────────────────────────────────────────────────┐   │
     │   │ extract_subsidiary_id() / extract_location_id() │   │
     │   │         ↓                                        │   │
     │   │ erp_metadata: %{subsidiary_id: "4", ...}        │   │
     │   └─────────────────────────────────────────────────┘   │
     └─────────────────────────────┬───────────────────────────┘
                                   │
                                   ▼
     ┌─────────────────────────────────────────────────────────┐
     │                  BULK UPSERT SERVICES                    │
     │                                                          │
     │   ┌───────────────────┐    ┌──────────────────────────┐ │
     │   │get_scoping_strategy│──►│  :entity_scoped          │ │
     │   │  (:employees, :ns)│    │  :connection_scoped      │ │
     │   └───────────────────┘    └──────────┬───────────────┘ │
     │                                       │                  │
     │   ┌───────────────────────────────────┼────────────────┐│
     │   │         resolve_entity_id()       ▼                ││
     │   │                                                    ││
     │   │  IF :entity_scoped:                                ││
     │   │    └─► EntityResolutionService.resolve_entity()    ││
     │   │         └─► EntityMapping lookup                   ││
     │   │              └─► entity_id or nil                  ││
     │   │                                                    ││
     │   │  IF :connection_scoped:                            ││
     │   │    └─► nil (shared across entities)                ││
     │   └────────────────────────────────────────────────────┘│
     └─────────────────────────────┬───────────────────────────┘
                                   │
                                   ▼
     ┌─────────────────────────────────────────────────────────┐
     │                      DATABASE                            │
     │                                                          │
     │   employees table:                                       │
     │   ┌────────────────────────────────────────────────────┐│
     │   │ id | workspace_id | entity_id | erp_connection_id  ││
     │   │────┼──────────────┼───────────┼────────────────────││
     │   │ 1  │ ws_abc       │ ent_123   │ conn_xyz           ││  ← Entity-scoped
     │   │ 2  │ ws_abc       │ ent_456   │ conn_xyz           ││  ← Different entity
     │   └────────────────────────────────────────────────────┘│
     │                                                          │
     │   vendors table:                                         │
     │   ┌────────────────────────────────────────────────────┐│
     │   │ id | workspace_id | entity_id | erp_connection_id  ││
     │   │────┼──────────────┼───────────┼────────────────────││
     │   │ 1  │ ws_abc       │ NULL      │ conn_xyz           ││  ← Connection-scoped
     │   │ 2  │ ws_abc       │ NULL      │ conn_xyz           ││  ← Shared
     │   └────────────────────────────────────────────────────┘│
     └─────────────────────────────────────────────────────────┘
```

---

## EntityMapping Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SUBSIDIARY SYNC FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

     ┌──────────────────────┐
     │  NetSuite: SELECT *  │
     │  FROM subsidiary     │
     └──────────┬───────────┘
                │
                │ Returns: [{id: "4", name: "Acme East"}, ...]
                │
                ▼
     ┌─────────────────────────────────────────────────────────┐
     │              EntitySyncHandler.sync()                    │
     │                                                          │
     │   1. Map subsidiary → Entity attributes                  │
     │   2. Upsert Entity record                                │
     │   3. ensure_entity_mapping()  ◄── NEW STEP               │
     │      │                                                   │
     │      ▼                                                   │
     │   ┌───────────────────────────────────────────────────┐ │
     │   │  EntityMapping.create()                           │ │
     │   │                                                   │ │
     │   │  %{                                               │ │
     │   │    erp_connection_id: "conn_xyz",                 │ │
     │   │    erp_location_id: "4",        ◄── Subsidiary ID │ │
     │   │    erp_location_name: "Acme East",                │ │
     │   │    entity_id: "ent_123",        ◄── Our Entity    │ │
     │   │    workspace_id: "ws_abc"                         │ │
     │   │  }                                                │ │
     │   └───────────────────────────────────────────────────┘ │
     └─────────────────────────────────────────────────────────┘
                │
                ▼
     ┌─────────────────────────────────────────────────────────┐
     │              erp_entity_mappings table                   │
     │  ┌─────────────────────────────────────────────────────┐│
     │  │ erp_connection_id | erp_location_id | entity_id     ││
     │  │───────────────────┼─────────────────┼───────────────││
     │  │ conn_xyz          │ "4"             │ ent_123       ││
     │  │ conn_xyz          │ "5"             │ ent_456       ││
     │  └─────────────────────────────────────────────────────┘│
     └─────────────────────────────────────────────────────────┘
```

---

## Entity Resolution Flow (During Employee Sync)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         EMPLOYEE SYNC FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

     ┌────────────────────────────────────┐
     │  NetSuite: SELECT * FROM employee  │
     │                                    │
     │  Returns:                          │
     │  {                                 │
     │    "id": "EMP001",                 │
     │    "entityid": "John Doe",         │
     │    "subsidiary": {"id": "4"}  ◄────┼── Key field!
     │  }                                 │
     └──────────────┬─────────────────────┘
                    │
                    ▼
     ┌─────────────────────────────────────────────────────────┐
     │               EmployeeMapper                             │
     │                                                          │
     │   build_erp_metadata() extracts:                         │
     │   %{                                                     │
     │     subsidiary_id: "4",  ◄── Extracted from "subsidiary" │
     │     subsidiary_name: nil,                                │
     │     ...                                                  │
     │   }                                                      │
     └──────────────┬───────────────────────────────────────────┘
                    │
                    ▼
     ┌─────────────────────────────────────────────────────────┐
     │           EmployeeBulkUpsertService                      │
     │                                                          │
     │   scoping = get_scoping_strategy(:employees, :netsuite)  │
     │          = :entity_scoped                                │
     │                                                          │
     │   resolve_entity_id(mapped, :entity_scoped, ...)         │
     │   │                                                      │
     │   ├─► erp_location_id = mapped.erp_metadata.subsidiary_id│
     │   │                   = "4"                              │
     │   │                                                      │
     │   └─► EntityResolutionService.resolve_entity(            │
     │         conn_id, ws_id, "4"                              │
     │       )                                                  │
     └──────────────┬───────────────────────────────────────────┘
                    │
                    ▼
     ┌─────────────────────────────────────────────────────────┐
     │           EntityResolutionService                        │
     │                                                          │
     │   Query: EntityMapping                                   │
     │     WHERE erp_connection_id = conn_id                    │
     │       AND erp_location_id = "4"                          │
     │       AND active = true                                  │
     │                                                          │
     │   Result: {:ok, entity_id: "ent_123"}                    │
     └──────────────┬───────────────────────────────────────────┘
                    │
                    ▼
     ┌─────────────────────────────────────────────────────────┐
     │              Employee Record Created                     │
     │                                                          │
     │   %Employee{                                             │
     │     id: "emp_uuid",                                      │
     │     workspace_id: "ws_abc",                              │
     │     entity_id: "ent_123",  ◄── Resolved!                 │
     │     erp_connection_id: "conn_xyz",                       │
     │     external_id: "EMP001",                               │
     │     erp_metadata: %{subsidiary_id: "4", ...}             │
     │   }                                                      │
     └─────────────────────────────────────────────────────────┘
```

---

## Scoping Decision Tree

```
                        ┌─────────────────────┐
                        │ get_scoping_strategy│
                        │ (entity_type, prov) │
                        └──────────┬──────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
     │ QuickBooks  │      │ NetSuite    │      │ Sage Intacct│
     │  provider   │      │  provider   │      │   provider  │
     └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
            │                    │                    │
            ▼                    │                    │
     :connection_scoped          │                    │
     (no multi-entity)           │                    │
                                 ▼                    ▼
                    ┌────────────────────────────────────────┐
                    │            Entity Type Check           │
                    └────────────────────┬───────────────────┘
                                         │
          ┌──────────────────────────────┼──────────────────────────────┐
          │                              │                              │
          ▼                              ▼                              ▼
   ┌──────────────┐            ┌──────────────────┐           ┌──────────────┐
   │  :employees  │            │    :vendors      │           │  :gl_accounts│
   │  :exp_reports│            │   :customers     │           │  :departments│
   │  :bills      │            │   (hybrid check) │           │  :locations  │
   │  :ap_payments│            └────────┬─────────┘           │  :classes    │
   └──────┬───────┘                     │                     └──────┬───────┘
          │                             │                            │
          ▼                             ▼                            ▼
   :entity_scoped             Check ERP config:             :connection_scoped
                              vendor_subsidiary_
                              restricted?(conn)
                                   │
                         ┌─────────┴─────────┐
                         │                   │
                         ▼                   ▼
                      true               false
                         │                   │
                         ▼                   ▼
                  :entity_scoped     :connection_scoped
```

---

## File Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FILE DEPENDENCIES                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

                            ┌───────────────────────┐
                            │ EntityResolutionService│
                            │   (already exists)     │
                            └───────────┬───────────┘
                                        │
                                        │ uses
                                        ▼
                            ┌───────────────────────┐
                            │    EntityMapping      │
                            │   (already exists)    │
                            └───────────┬───────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    │ created by                    looked up by
                    ▼                                       │
     ┌───────────────────────────┐                         │
     │   EntitySyncHandler       │                         │
     │   (GAP-005: add mapping   │                         │
     │    creation after sync)   │                         │
     └───────────────────────────┘                         │
                                                           │
     ┌───────────────────────────┐                         │
     │   EntitySyncService       │◄────────────────────────┘
     │   (GAP-006: add           │
     │    get_scoping_strategy)  │
     └─────────────┬─────────────┘
                   │
                   │ used by
                   ▼
     ┌───────────────────────────────────────────────────────────────────┐
     │                    Bulk Upsert Services                            │
     │   (GAP-004: add entity resolution)                                 │
     │                                                                    │
     │   EmployeeBulkUpsertService ──┐                                    │
     │   VendorBulkUpsertService ────┼── All use resolve_entity_id()      │
     │   ExpenseReportBulkUpsertService                                   │
     │   BillBulkUpsertService ──────┘                                    │
     └─────────────────────────────────┬─────────────────────────────────┘
                                       │
                                       │ receive mapped data from
                                       ▼
     ┌───────────────────────────────────────────────────────────────────┐
     │                         Mappers                                    │
     │   (GAP-001, GAP-002, GAP-003: add subsidiary/location extraction)  │
     │                                                                    │
     │   NetSuite:                    │   Sage Intacct:                   │
     │   ├── EmployeeMapper           │   ├── EmployeeMapper              │
     │   ├── VendorMapper             │   ├── VendorMapper                │
     │   └── ExpenseReportMapper      │   └── BillMapper                  │
     └───────────────────────────────────────────────────────────────────┘
```

---

## Summary: What Changes Where

| Component | File | Change |
|-----------|------|--------|
| **Mappers** | `netsuite/mappers/*.ex` | Add `subsidiary_id` extraction to `erp_metadata` |
| **Mappers** | `sage_intacct/mappers/*.ex` | Add `location_id` extraction to `erp_metadata` |
| **Services** | `entity_sync_service.ex` | Add `get_scoping_strategy/2` function |
| **Services** | `entity_sync_handler.ex` | Add `ensure_entity_mapping/3` after entity upsert |
| **Bulk Services** | `bulk/*_bulk_upsert_service.ex` | Add `resolve_entity_id/6` with EntityResolutionService call |

---

*Wiring Diagram prepared by Sync Committee | Session SC-2025-12-21-002*

