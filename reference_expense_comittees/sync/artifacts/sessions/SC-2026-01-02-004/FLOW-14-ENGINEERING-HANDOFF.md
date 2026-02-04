# Flow-14 Engineering Handoff

> **Session:** SC-2026-01-02-004  
> **Date:** 2026-01-02  
> **Status:** Ready for Implementation

---

## Executive Summary

Flow-14 implements the **resolution path** for blocked card transactions. When a transaction is blocked due to vendor policy (Flow-03 threshold exceeded or Flow-06 manual mode), finance can:

1. Create the vendor manually in the ERP
2. Wait for next sync to pull the vendor
3. Retry the push → SUCCESS

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLOW 14: RESOLUTION - VENDOR CREATED → RETRY                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   PHASE 1: BLOCKED STATE (From Flow-03 or Flow-06)                              │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ PushRequest                                                            │    │
│   │ - status: :blocked                                                     │    │
│   │ - error_message: "Vendor auto-creation is restricted..."               │    │
│   │ - vendor_id in metadata: nil                                           │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│   PHASE 2: FINANCE CREATES VENDOR IN ERP (Out-of-band)                          │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ NetSuite/Intacct/QBO UI                                                │    │
│   │ - Finance navigates to Vendor creation                                 │    │
│   │ - Creates "Quantum Systems" with VEND-999                              │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│   PHASE 3: NEXT SYNC PULLS VENDOR                                               │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ WorkspaceSyncReactor → EntitySyncService → BulkUpsertService           │    │
│   │                                                                        │    │
│   │ Result: ERP Vendor mirror created                                      │    │
│   │ - external_id: VEND-999                                                │    │
│   │ - name: Quantum Systems                                                │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                          │                                                      │
│                          ▼                                                      │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ BridgeReactor Step 19: VendorWrapperService.wrap_all_unbridged         │    │
│   │                                                                        │    │
│   │ 1. Find unlinked VendorDetails (erp_vendor_id IS NULL)                 │    │
│   │ 2. Match by name to ERP Vendor mirrors                                 │    │
│   │ 3. Link: VendorDetail.erp_vendor_id = ERP Vendor mirror ID             │    │
│   │                                                                        │    │
│   │ OR: Create Vendor wrapper linked to ERP Vendor                         │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│   PHASE 4: FINANCE RETRIES SYNC                                                 │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ InterventionService.retry_push(push_request_id, opts)                  │    │
│   │   OR                                                                   │    │
│   │ PushRequest.execute_push (direct action)                               │    │
│   │                                                                        │    │
│   │ 1. Reset status: :blocked → :pending                                   │    │
│   │ 2. Clear error_message                                                 │    │
│   │ 3. Update push_metadata with vendor info                               │    │
│   │ 4. Execute push                                                        │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                          │                                                      │
│                          ▼                                                      │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ PushCardSpendReactor                                                   │    │
│   │                                                                        │    │
│   │ Step 4: resolve_vendor                                                 │    │
│   │ → Vendor NOW EXISTS! (via push_metadata or actual lookup)              │    │
│   │ → Proceed with Bill + Bill Payment                                     │    │
│   │                                                                        │    │
│   │ Step 7-8: push_bill_to_erp, push_bill_payment_to_erp                   │    │
│   │ → SUCCESS                                                              │    │
│   │                                                                        │    │
│   │ Step 9: complete_push_request                                          │    │
│   │ → status: :pushed                                                      │    │
│   │ → 2 PushEntityRecords (bill, bill_payment)                             │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│   RESULT: Transaction synced to ERP                                             │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ PushRequest                                                            │    │
│   │ - status: :pushed ✅                                                   │    │
│   │ - error_message: nil                                                   │    │
│   │ - PushEntityRecords: [bill, bill_payment]                              │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Test Implementation Specification

### File Location

```
test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_14_lifecycle_test.exs
```

### Test Cases Required

| Test ID | Description | Priority |
|---------|-------------|----------|
| F14-T01 | Full lifecycle: block → vendor created → retry → success | 🔴 Critical |
| F14-T02 | Retry before vendor exists → still blocked | 🔴 Critical |
| F14-T03 | Verify 2 PushEntityRecords created on success | 🔴 Critical |
| F14-T04 | Error message cleared on successful retry | 🟡 Medium |
| F14-T05 | Status transitions correctly (blocked → pending → pushed) | 🟡 Medium |

### Test Setup Pattern

The test should follow the established pattern from Flow-03/Flow-06:

1. **Setup**: Create workspace, entity, connection, accounting period, VendorPolicy (threshold mode)
2. **Block Phase**: Create and execute push request with no vendor → status = :blocked
3. **Resolution Phase**: Simulate vendor creation by updating push_metadata with vendor info
4. **Retry Phase**: Reset status to :pending, re-execute push
5. **Verification Phase**: Assert status = :pushed, PushEntityRecords exist

### Key Implementation Details

#### Simulating Vendor Creation (Test Mode)

In test mode, the reactor uses `push_metadata` for vendor info. To simulate vendor creation:

```elixir
# Update push_metadata with vendor info
updated_metadata = Map.merge(push_request.push_metadata, %{
  "vendor_id" => vendor_id,
  "vendor_external_id" => "VEND-999"
})

# Reset status and update metadata
push_request
|> Ash.Changeset.for_update(:create, %{
  status: :pending,
  error_message: nil,
  push_metadata: updated_metadata
})
|> Ash.update(tenant: workspace_id, authorize?: false)
```

#### Retry Execution

Use the same `execute_push` action pattern from other tests:

```elixir
push_request
|> Ash.Changeset.for_update(:execute_push, %{})
|> Ash.update(tenant: workspace_id, actor: system_actor)
```

---

## Verification Requirements

Per human directive, **3 verification subcommittees** must review the implementation:

### Subcommittee 1: Code Fidelity Auditor

- [ ] Verify test file exists at correct location
- [ ] Verify test follows established patterns from Flow-03/Flow-06
- [ ] Verify no modifications to `push_card_spend_reactor.ex` (should work as-is)

### Subcommittee 2: Test Coverage Analyst

- [ ] Verify minimum 5 test cases implemented
- [ ] Verify critical paths tested (block → retry → success)
- [ ] Verify edge cases covered (retry before vendor exists)
- [ ] Verify assertions are meaningful (not just "it runs")

### Subcommittee 3: Standards Enforcer

- [ ] Verify test naming follows convention (F14-T01, F14-T02, etc.)
- [ ] Verify helper functions follow `create_flow14_*`, `execute_flow14_*` pattern
- [ ] Verify module tags match other flow tests (@moduletag :flow, flow: :flow_14)
- [ ] Verify no shortcuts in test assertions

---

## Success Criteria

1. **All 5+ tests pass**
2. **All 125 existing tests continue to pass**
3. **No modifications to reactor code** (if modifications needed, document and justify)
4. **All 3 verification subcommittees approve**

---

## References

- Product Specification: `FLOW-14-RESOLUTION-VENDOR-RETRY.md`
- Related Flows: Flow-03, Flow-06 (blocking flows)
- Reactor: `push_card_spend_reactor.ex`
- Prior Session: SC-2026-01-02-003 (Flow-10/11 complete)

---

*Prepared by Sync Committee — Session SC-2026-01-02-004*

