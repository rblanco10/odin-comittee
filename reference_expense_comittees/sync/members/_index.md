# Sync Committee Members Index

> **Quick reference for all 37 committee members.**

---

## Member Roster

### Engineering Team (8) — NEW

> **The implementation arm of the committee. These engineers execute approved proposals.**

| Member | File | Specialization | Primary Responsibilities |
|--------|------|----------------|--------------------------|
| **Engineering Lead** | [engineering_lead.md](./engineering/engineering_lead.md) | Coordination | Task breakdown, code review, quality gates |
| **Ash Resources Engineer** | [ash_resources_engineer.md](./engineering/ash_resources_engineer.md) | Ash Framework | Resources, actions, changesets, policies |
| **Sync Pipeline Engineer** | [sync_pipeline_engineer.md](./engineering/sync_pipeline_engineer.md) | Data Flow | EntitySyncService, bulk upserts, cursors |
| **ERP Adapter Engineer** | [erp_adapter_engineer.md](./engineering/erp_adapter_engineer.md) | Provider APIs | Mappers, capabilities, API quirks |
| **Database Engineer** | [database_engineer.md](./engineering/database_engineer.md) | PostgreSQL | Migrations, indexes, query optimization |
| **Reactor Engineer** | [reactor_engineer.md](./engineering/reactor_engineer.md) | Workflows | SyncReactor, step orchestration |
| **Testing Engineer** | [testing_engineer.md](./engineering/testing_engineer.md) | Quality | Unit tests, integration tests, fixtures |
| **Observability Engineer** | [observability_engineer.md](./engineering/observability_engineer.md) | Monitoring | OpenTelemetry, Prometheus, Loki |

### Evaluation Subcommittee (4)

> **A specialized group that evaluates session progress from multiple angles. Work together to ensure the committee is achieving its goals effectively.**

| Member | File | Primary Function | Routing Tags |
|--------|------|------------------|--------------|
| **Progress Evaluator** | [progress_evaluator.md](./evaluation/progress_evaluator.md) | Measures progress toward goals quantitatively | `progress`, `how far`, `percent complete`, `goal status` |
| **Skeptic** | [skeptic.md](./evaluation/skeptic.md) | Questions assumptions, challenges conclusions | `are we sure`, `assumption`, `but what if`, `challenge` |
| **Completeness Auditor** | [completeness_auditor.md](./evaluation/completeness_auditor.md) | Ensures all angles covered, nothing overlooked | `did we cover`, `missing`, `incomplete`, `gaps` |
| **Goal Alignment Checker** | [goal_alignment_checker.md](./evaluation/goal_alignment_checker.md) | Ensures work advances session goals | `align`, `goal`, `on track`, `relevant` |

### Process & Coordination (3)

| Member | File | Primary Function | Routing Tags |
|--------|------|------------------|--------------|
| **Committee Chair** | [chair.md](./process/chair.md) | Convenes meetings, drives process, manages flow | `convene`, `refocus`, `scope`, `checkpoint` |
| **Scribe** | [scribe.md](./process/scribe.md) | Documents all findings, maintains artifacts | `document`, `capture`, `record` |
| **Intake Coordinator** | [intake_coordinator.md](./process/intake_coordinator.md) | Prepares materials, gathers context for reviews | `intake`, `prepare`, `context` |

### Context & Defense (3)

| Member | File | Primary Function | Routing Tags |
|--------|------|------------------|--------------|
| **Architecture Presenter** | [architecture_presenter.md](./context/architecture_presenter.md) | Explains current state, provides historical context | `why`, `history`, `current state`, `explain` |
| **Path Defender** | [path_defender.md](./context/path_defender.md) | Advocates for proposals, mediates conflicts | `defend`, `advocate`, `mediate`, `conflict` |
| **Precedent Keeper** | [precedent_keeper.md](./context/precedent_keeper.md) | Recalls past decisions, flags precedent conflicts | `precedent`, `decided before`, `past decision` |

### Technical Evaluation (5)

| Member | File | Primary Function | Routing Tags |
|--------|------|------------------|--------------|
| **Sync Architect** | [sync_architect.md](./technical/sync_architect.md) | Evaluates structural soundness | `architecture`, `structure`, `design`, `pattern` |
| **Data Mapping Specialist** | [data_mapping_specialist.md](./technical/data_mapping_specialist.md) | Reviews transformation logic | `mapping`, `transform`, `field`, `schema` |
| **Edge Case Hunter** | [edge_case_hunter.md](./technical/edge_case_hunter.md) | Probes failure modes | `edge case`, `what if`, `failure`, `null` |
| **Dependency Guardian** | [dependency_guardian.md](./technical/dependency_guardian.md) | Verifies entity ordering | `dependency`, `order`, `sequence`, `reference` |
| **Observability Auditor** | [observability_auditor.md](./technical/observability_auditor.md) | Ensures traceability | `observable`, `trace`, `log`, `metric`, `telemetry` |

### Implementation Verification (3)

| Member | File | Primary Function | Routing Tags |
|--------|------|------------------|--------------|
| **Code Fidelity Auditor** | [code_fidelity_auditor.md](./verification/code_fidelity_auditor.md) | Verifies code matches plan | `code`, `implementation`, `matches`, `verify` |
| **Test Coverage Analyst** | [test_coverage_analyst.md](./verification/test_coverage_analyst.md) | Reviews test completeness | `test`, `coverage`, `unit test`, `integration` |
| **Standards Enforcer** | [standards_enforcer.md](./verification/standards_enforcer.md) | Ensures pattern compliance | `standard`, `pattern`, `convention`, `compliance` |

### ERP Domain Expertise (4)

| Member | File | Primary Function | Routing Tags |
|--------|------|------------------|--------------|
| **NetSuite Domain Expert** | [netsuite_expert.md](./erp_domain/netsuite_expert.md) | NetSuite-specific knowledge | `netsuite`, `ns`, `suitescript`, `netsuite api` |
| **Sage Intacct Domain Expert** | [sage_intacct_expert.md](./erp_domain/sage_intacct_expert.md) | Intacct-specific knowledge | `intacct`, `sage`, `sage intacct` |
| **QuickBooks Domain Expert** | [quickbooks_expert.md](./erp_domain/quickbooks_expert.md) | QBO-specific knowledge | `quickbooks`, `qbo`, `quickbooks online` |
| **Multi-ERP Generalist** | [multi_erp_generalist.md](./erp_domain/multi_erp_generalist.md) | Cross-provider patterns | `all erps`, `provider-agnostic`, `cross-provider` |

### Business Domain Expertise (4)

| Member | File | Primary Function | Routing Tags |
|--------|------|------------------|--------------|
| **Accounts Payable Expert** | [accounts_payable_expert.md](./business_domain/accounts_payable_expert.md) | AP workflow knowledge | `ap`, `accounts payable`, `vendor`, `invoice`, `bill` |
| **Expense Management Expert** | [expense_management_expert.md](./business_domain/expense_management_expert.md) | Expense workflow knowledge | `expense`, `reimbursement`, `receipt` |
| **GL & Chart of Accounts Expert** | [gl_chart_of_accounts_expert.md](./business_domain/gl_chart_of_accounts_expert.md) | General ledger knowledge | `gl`, `general ledger`, `chart of accounts`, `coa` |
| **Finance Operations Generalist** | [finance_operations_generalist.md](./business_domain/finance_operations_generalist.md) | Finance team operations | `finance team`, `month-end`, `close`, `period` |

### User & Integration (3)

| Member | File | Primary Function | Routing Tags |
|--------|------|------------------|--------------|
| **End User Advocate** | [end_user_advocate.md](./user_integration/end_user_advocate.md) | User experience perspective | `user`, `ux`, `experience`, `makes sense` |
| **Implementation Consultant** | [implementation_consultant.md](./user_integration/implementation_consultant.md) | Onboarding perspective | `implementation`, `onboarding`, `customer setup` |
| **Data Quality Specialist** | [data_quality_specialist.md](./user_integration/data_quality_specialist.md) | Real-world data issues | `data quality`, `malformed`, `invalid`, `dirty data` |

---

## Routing Quick Reference

### By Topic

| Topic | Route To |
|-------|----------|
| Architecture/Design | Sync Architect, Standards Enforcer |
| NetSuite specifics | NetSuite Domain Expert |
| Sage Intacct specifics | Sage Intacct Domain Expert |
| QuickBooks specifics | QuickBooks Domain Expert |
| Cross-ERP patterns | Multi-ERP Generalist |
| AP/Vendors/Bills | Accounts Payable Expert |
| Expenses/Reimbursements | Expense Management Expert |
| GL/Chart of Accounts | GL & Chart of Accounts Expert |
| Month-end/Finance ops | Finance Operations Generalist |
| Data transformations | Data Mapping Specialist |
| Failure modes | Edge Case Hunter |
| Entity dependencies | Dependency Guardian |
| Tracing/Logging | Observability Auditor |
| Code verification | Code Fidelity Auditor |
| Test coverage | Test Coverage Analyst |
| Pattern compliance | Standards Enforcer |
| User experience | End User Advocate |
| Customer onboarding | Implementation Consultant |
| Data quality issues | Data Quality Specialist |
| Historical context | Architecture Presenter |
| Past decisions | Precedent Keeper |
| Conflict mediation | Path Defender |
| Process/Flow | Chair |
| Documentation | Scribe |

### By Situation

| Situation | Route To |
|-----------|----------|
| New item to review | Intake Coordinator → Chair |
| Need historical context | Architecture Presenter |
| Disagreement between members | Path Defender |
| Was this decided before? | Precedent Keeper |
| Is the design sound? | Sync Architect |
| Does the code match the plan? | Code Fidelity Auditor |
| Are tests adequate? | Test Coverage Analyst |
| What could go wrong? | Edge Case Hunter |
| Will this trace properly? | Observability Auditor |
| How does [ERP] actually work? | [ERP] Domain Expert |
| Is this how AP really works? | Accounts Payable Expert |
| Will customers understand this? | End User Advocate |
| Will this work during onboarding? | Implementation Consultant |
| What about bad data? | Data Quality Specialist |
| Need to capture this | Scribe |
| Off track/scope creep | Chair |
| **How close are we to done?** | **Progress Evaluator** |
| **Are we on the right track?** | **Goal Alignment Checker** |
| **Have we covered everything?** | **Completeness Auditor** |
| **Are we sure about this?** | **Skeptic** |
| **Mid-session evaluation** | **Evaluation Subcommittee** |
| **Implement approved proposal** | **Engineering Lead** |
| **Ash resource changes** | **Ash Resources Engineer** |
| **Sync flow changes** | **Sync Pipeline Engineer** |
| **Mapper/adapter changes** | **ERP Adapter Engineer** |
| **Database/migration work** | **Database Engineer** |
| **Reactor workflow changes** | **Reactor Engineer** |
| **Test implementation** | **Testing Engineer** |
| **Telemetry/logging work** | **Observability Engineer** |

---

## Member Activation by Session State

| Session State | Typically Active |
|---------------|------------------|
| `AWAITING_INTAKE` | Intake Coordinator |
| `INTAKE_PREPARED` | Chair |
| `MEETING_ACTIVE` | Per routing rules |
| `AWAITING_HUMAN` | None (waiting) |
| `CONVERGING` | Chair, dissenters, Scribe |
| `DECISION_PENDING` | None (waiting for human) |

---

## Total: 37 Members

- **Engineering:** 8 ← NEW (implementation team)
- **Evaluation:** 4 (progress & quality assessment)
- **Process:** 3
- **Context:** 3  
- **Technical:** 5
- **Verification:** 3
- **ERP Domain:** 4
- **Business Domain:** 4
- **User & Integration:** 3

---

## Evaluation Subcommittee Usage

The Evaluation Subcommittee works together as a group. Typically activated:

| Situation | Evaluation Members to Activate |
|-----------|--------------------------------|
| Mid-session check-in | Progress Evaluator |
| Major decision point | All 4 (full evaluation) |
| Suspected drift | Goal Alignment Checker |
| Quick consensus | Skeptic |
| Before concluding | Completeness Auditor + Progress Evaluator |
| Something feels off | Skeptic + Completeness Auditor |

### Evaluation Workflow

```
1. Progress Evaluator: "We're at X% overall"
         │
         ▼
2. Goal Alignment Checker: "Current work maps to G1, G3"
         │
         ▼
3. Completeness Auditor: "We've covered A, B, but missing C"
         │
         ▼
4. Skeptic: "Before we proceed, have we verified assumption X?"
         │
         ▼
   Chair incorporates evaluation into session flow
```

