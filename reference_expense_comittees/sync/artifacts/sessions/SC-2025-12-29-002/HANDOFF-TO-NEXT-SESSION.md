# Handoff Document: SC-2025-12-29-002 → Next Session

## Session Summary

**Session ID**: SC-2025-12-29-002
**Topic**: PushEntityRecord Architecture + Flow-02 Preparation
**Status**: CLOSED - Major architectural work completed

---

## What Was Done

### 1. PushEntityRecord Architecture (COMPLETE)

We implemented a new architecture to solve a critical problem: **a single card spend push needs to track multiple ERP entities** (vendor, bill, payment), but `PushRequest.external_id` could only hold one.

**Solution**: One-to-many relationship from `PushRequest` to `PushEntityRecord`

```
PushRequest (entity_type: :card_spend)
    │
    ├── PushEntityRecord (entity_type: :vendor, external_id: "VEND-123")
    ├── PushEntityRecord (entity_type: :bill, external_id: "BILL-456")
    └── PushEntityRecord (entity_type: :bill_payment, external_id: "PAY-789")
```

**Files Created**:
- `lib/flame_teampay_payables/ember_erp/resources/push_entity_record.ex`
- Migration: `priv/repo/migrations/20251229000001_create_push_entity_records.exs`

### 2. Push Reactor Refactoring (COMPLETE)

All 12 push reactors now create `PushEntityRecord` entries:
- `PushCardSpendReactor` creates records for `:bill` and `:bill_payment`
- `PushVendorReactor` creates record for `:vendor`
- Other reactors create records for their respective entity types

### 3. Reconciliation Service Refactoring (COMPLETE)

All 10 reconciliation services now:
- Query `PushEntityRecord` instead of `PushRequest`
- Link `PushEntityRecord.accounting_resource_id` to mirror.id
- Link mirror.`origin_push_entity_record_id` back to the record
- Call `PushEntityRecord.mark_sync_verified` action

### 4. Mirror Table Updates (COMPLETE)

Added `origin_push_entity_record_id` to all relevant mirror tables:
- Bill, Vendor, ExpenseReport, VendorCredit, ExpenseReportPayment, APPayment, JournalEntry

### 5. Test Updates (COMPLETE)

All 303 ERP tests pass (excluding 1 SageIntacct capability test):
- Updated all push reactor tests to use `assert_push_entity_record_created`
- Updated all reconciliation service tests for `PushEntityRecord`
- Fixed lifecycle tests for new architecture
- Fixed DimensionBridgeService tests (cross-workspace count assertions)
- Fixed WorkspaceSyncReactorTiering tests (entity count updated to 23)

### 6. Flow-02 Test File (CREATED but tests failing)

Created `test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_02_lifecycle_test.exs`

Tests fail because the auto-create vendor logic is not yet implemented.

---

## What Remains

### Priority 1: Implement Auto-Create Vendor Logic

**Location**: `lib/flame_teampay_payables/ember_erp/resources/reactors/ap/push_card_spend_reactor.ex`

**Current Code (lines 435-443)**:
```elixir
if VendorPolicy.should_auto_create?(policy, amount) do
  # Flow 2, 5: Auto-create vendor (will be implemented in future flows)
  Logger.info("PushCardSpendReactor: Vendor policy allows auto-create for amount #{amount}")
  TempoTracingService.set_span_attributes([
    {"vendor.policy", "auto_create_allowed"},
    {"vendor.amount", Decimal.to_string(amount)}
  ])
  # For Flow 01, we still error - auto-create will be implemented in Flow 02
  {:error, "Vendor does not exist. Auto-create is enabled but not yet implemented for Flow 01."}
```

**What Needs to Be Implemented**:

```elixir
if VendorPolicy.should_auto_create?(policy, amount) do
  # Flow-02: Auto-create vendor
  case auto_create_vendor(transaction, push_request, actor) do
    {:ok, vendor_info} ->
      {:ok, vendor_info}  # Contains vendor_id, vendor_external_id, vendor_name
    {:error, reason} ->
      {:error, "Failed to auto-create vendor: #{inspect(reason)}"}
  end
```

**Implementation Steps**:

1. **Extract merchant info from transaction**
   ```elixir
   merchant_name = transaction.merchant_name
   merchant_id = transaction.merchant_id  # MCC
   ```

2. **Create VendorDetail** (or find existing mapped one)
   - This may require creating a new VendorDetail from merchant info
   - Or using an existing MerchantVendorMapping

3. **Create PushRequest for vendor**
   ```elixir
   {:ok, vendor_push_request} = PushRequest
     |> Ash.Changeset.for_create(:create, %{
       workspace_id: push_request.workspace_id,
       erp_connection_id: push_request.erp_connection_id,
       source_domain: "vendor",
       source_resource_type: "VendorDetail",
       source_resource_id: vendor_detail.id,
       entity_type: :vendor,
       status: :pending,
       trigger_type: :auto
     })
     |> Ash.create(tenant: push_request.workspace_id, authorize?: false)
   ```

4. **Create PushEntityRecord for vendor**
   ```elixir
   {:ok, vendor_entity_record} = PushEntityRecord
     |> Ash.Changeset.for_create(:create, %{
       workspace_id: push_request.workspace_id,
       push_request_id: parent_push_request.id,  # Link to PARENT card spend request
       entity_type: :vendor,
       status: :pending
     })
     |> Ash.create(tenant: push_request.workspace_id, authorize?: false)
   ```

5. **Run PushVendorReactor synchronously**
   ```elixir
   case Reactor.run(PushVendorReactor, %{
     push_request_id: vendor_push_request.id,
     workspace_id: push_request.workspace_id
   }) do
     {:ok, _result} ->
       # Get the external_id from the vendor push
       {:ok, updated_record} = Ash.get(PushEntityRecord, vendor_entity_record.id, ...)
       {:ok, %{
         vendor_id: vendor_detail.id,
         vendor_external_id: updated_record.external_id,
         vendor_name: merchant_name
       }}
     {:error, error} ->
       {:error, error}
   end
   ```

### Priority 2: Fix Flow-02 Test Helpers

The test helpers use `Repo.insert!` which may cause tenant/sandbox issues:
- Consider using Ash actions instead
- Or ensure proper sandbox mode configuration

### Priority 3: Verify Full Lifecycle

Run the Flow-02 lifecycle tests:
```bash
mix test test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_02_lifecycle_test.exs
```

All 3 tests should pass:
1. `PHASE 1: Push creates vendor first, then bill and payment`
2. `FULL LIFECYCLE: Push → Sync → Bridge with auto-created vendor`
3. `THRESHOLD: Transaction above threshold blocks vendor auto-creation`

---

## Key Design Decisions

### Why PushEntityRecord Belongs to Parent PushRequest

For card spend, the parent `PushRequest` (entity_type: :card_spend) owns ALL `PushEntityRecord`s:
- The vendor record (created during auto-create)
- The bill record
- The bill_payment record

This allows:
- `is_fully_reconciled` calculation on PushRequest to check ALL children
- Single source of truth for the business transaction
- Clear lineage from card transaction → all pushed entities

### Why Not Create Separate PushRequest for Vendor?

We considered creating a separate `PushRequest` for the vendor, but decided:
- It adds complexity
- The vendor push is an implementation detail of the card spend push
- For reconciliation, we want to track "did the card spend fully sync" not "did each piece sync"

The `PushEntityRecord` for vendor still tracks the vendor external_id separately for reconciliation.

---

## Test Commands

```bash
# Run all ERP tests
mix test test/flame_teampay_payables/ember_erp/ test/flame_teampay_payables/ember_bridge/

# Run Flow-02 specifically
mix test test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_02_lifecycle_test.exs

# Run all lifecycle tests
mix test --only lifecycle

# Run with verbose output
mix test test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_02_lifecycle_test.exs --trace
```

---

## Critical Rules

- ❌ NO `--force` when compiling
- ❌ NO `head` on output
- ✅ ONLY `tail -150` or more for command output
- ✅ Run `mix dev.reset_db.demo` for migrations
- ✅ Use unique helper names in test files

---

## Files to Focus On

1. **Primary Implementation**:
   - `lib/flame_teampay_payables/ember_erp/resources/reactors/ap/push_card_spend_reactor.ex` (lines 435-443)

2. **Test File**:
   - `test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_02_lifecycle_test.exs`

3. **Reference (how PushVendorReactor works)**:
   - `lib/flame_teampay_payables/ember_erp/resources/reactors/ap/push_vendor_reactor.ex`

4. **VendorPolicy (for understanding thresholds)**:
   - `lib/flame_teampay_payables/ember_erp/resources/configuration/vendor_policy.ex`

---

## Questions for Next Session

1. **VendorDetail Creation**: How should we create a VendorDetail from card transaction merchant info? Is there an existing service for this?

2. **Merchant-to-Vendor Mapping**: Should we check MerchantVendorMapping first before creating a new vendor?

3. **Error Handling**: If vendor push fails, should the entire card spend push fail? Or should we queue it for retry?

---

## Confidence Level

- **Architecture**: HIGH - The PushEntityRecord architecture is solid and tested
- **Implementation Remaining**: MEDIUM - Clear path forward, but VendorDetail creation needs investigation
- **Test Coverage**: HIGH - Comprehensive test file created as specification

