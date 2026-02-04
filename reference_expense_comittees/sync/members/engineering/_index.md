# ERP Engineering Team

> **The implementation arm of the Sync Committee. These engineers execute approved proposals and maintain the ERP integration codebase.**

---

## Team Overview

The Engineering Team transforms committee-approved proposals into working code. Each engineer specializes in a specific aspect of the architecture while understanding the whole system.

---

## Team Roster (8 Engineers)

| Member | File | Specialization | Primary Responsibilities |
|--------|------|----------------|--------------------------|
| **Engineering Lead** | [engineering_lead.md](./engineering_lead.md) | Coordination | Task breakdown, PR review, quality gates |
| **Ash Resources Engineer** | [ash_resources_engineer.md](./ash_resources_engineer.md) | Ash Framework | Resources, actions, changesets, policies |
| **Sync Pipeline Engineer** | [sync_pipeline_engineer.md](./sync_pipeline_engineer.md) | Data Flow | EntitySyncService, bulk upserts, cursors |
| **ERP Adapter Engineer** | [erp_adapter_engineer.md](./erp_adapter_engineer.md) | Provider APIs | Mappers, capabilities, API quirks |
| **Database Engineer** | [database_engineer.md](./database_engineer.md) | PostgreSQL | Migrations, indexes, query optimization |
| **Reactor Engineer** | [reactor_engineer.md](./reactor_engineer.md) | Workflows | SyncReactor, step orchestration, error handling |
| **Testing Engineer** | [testing_engineer.md](./testing_engineer.md) | Quality | Unit tests, integration tests, fixtures |
| **Observability Engineer** | [observability_engineer.md](./observability_engineer.md) | Monitoring | OpenTelemetry, Prometheus, Loki |

---

## Architecture Coverage

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ERP INTEGRATION ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────────┘

     ┌──────────────────────────────────────────────────────────────────────────┐
     │  ERP APIs (NetSuite, Sage Intacct, QuickBooks)                           │
     │                                                          ERP Adapter Eng │
     └───────────────────────────────────┬──────────────────────────────────────┘
                                         │
     ┌───────────────────────────────────▼──────────────────────────────────────┐
     │  Capabilities Layer (fetch, fetch_page, push)                            │
     │  Mappers (transform ERP → internal format)               ERP Adapter Eng │
     └───────────────────────────────────┬──────────────────────────────────────┘
                                         │
     ┌───────────────────────────────────▼──────────────────────────────────────┐
     │  EntitySyncService / Bulk Upsert Services                                │
     │  EntityResolutionService                              Sync Pipeline Eng  │
     └───────────────────────────────────┬──────────────────────────────────────┘
                                         │
     ┌───────────────────────────────────▼──────────────────────────────────────┐
     │  Ash Resources (Employee, Vendor, Bill, etc.)                            │
     │  Actions, Changesets, Policies                        Ash Resources Eng  │
     └───────────────────────────────────┬──────────────────────────────────────┘
                                         │
     ┌───────────────────────────────────▼──────────────────────────────────────┐
     │  PostgreSQL / AshPostgres                                                │
     │  Migrations, Indexes, Queries                            Database Eng    │
     └──────────────────────────────────────────────────────────────────────────┘

     ┌──────────────────────────────────────────────────────────────────────────┐
     │  SyncReactor / WorkspaceSyncReactor                                      │
     │  Step Orchestration, Error Recovery                       Reactor Eng    │
     └──────────────────────────────────────────────────────────────────────────┘

     ┌──────────────────────────────────────────────────────────────────────────┐
     │  OpenTelemetry Traces, Prometheus Metrics, Loki Logs                     │
     │  Tempo Integration                                   Observability Eng   │
     └──────────────────────────────────────────────────────────────────────────┘

     ┌──────────────────────────────────────────────────────────────────────────┐
     │  ExUnit Tests, Integration Tests, Fixtures                               │
     │  Test Data Builders                                       Testing Eng    │
     └──────────────────────────────────────────────────────────────────────────┘
```

---

## Workflow: Proposal → Implementation

```
┌─────────────────┐
│ Committee       │
│ Approves        │
│ Proposal        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Engineering     │────►│ Task Breakdown  │
│ Lead Reviews    │     │ & Assignment    │
└────────┬────────┘     └─────────────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         ▼                  ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐
│ Ash Resources   │ │ Sync Pipeline   │ │ ERP Adapter     │ │ Database     │
│ Engineer        │ │ Engineer        │ │ Engineer        │ │ Engineer     │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └──────┬───────┘
         │                   │                   │                 │
         ├───────────────────┴───────────────────┴─────────────────┤
         │                                                         │
         ▼                                                         ▼
┌─────────────────┐                                       ┌─────────────────┐
│ Testing         │◄──────────────────────────────────────│ Observability   │
│ Engineer        │                                       │ Engineer        │
└────────┬────────┘                                       └────────┬────────┘
         │                                                         │
         └───────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Engineering     │
                        │ Lead Review     │
                        │ & Merge         │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Committee       │
                        │ Verification    │
                        └─────────────────┘
```

---

## Routing: When to Engage Engineering

| Situation | Route To |
|-----------|----------|
| Implementation task approved | Engineering Lead → Team |
| Ash resource schema question | Ash Resources Engineer |
| Sync flow or pagination issue | Sync Pipeline Engineer |
| ERP API or mapper issue | ERP Adapter Engineer |
| Migration or query optimization | Database Engineer |
| Reactor step or error handling | Reactor Engineer |
| Test coverage or fixtures | Testing Engineer |
| Tracing or metrics | Observability Engineer |

---

## Quality Gates

Before merging any implementation:

- [ ] Engineering Lead code review
- [ ] All tests passing
- [ ] Observability instrumented
- [ ] Documentation updated
- [ ] No linting errors
- [ ] Committee verification (if significant)

---

## Total: 8 Engineers

Covering all aspects of the ERP integration architecture.

