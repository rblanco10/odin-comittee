# Handoff Notes: Flow-01 → Flow-02

> **From Session:** SC-2025-12-29-001  
> **To Session:** Next (Flow-02: Card → New Vendor, Auto-Create)  
> **Date:** 2025-12-29  
> **Status:** Flow-01 COMPLETE ✅

---

## Executive Summary

Flow-01 (Card Transaction → Existing Vendor, Open Period) is **complete and tested**. This document provides critical context, patterns, pitfalls, and recommendations for the next committee working on Flow-02 and beyond.

---

## What Was Delivered in Flow-01

### Code Changes
| File | Change |
|------|--------|
| `push_card_spend_reactor.ex` | **RENAMED** from `push_bill_with_payment_reactor.ex`, added period validation, vendor resolution framework |
| `reactor_registry.ex` | Updated reactor mapping |
| `execute_push.ex` | Enhanced for lifecycle testing support |
| 12 push reactor test files | Resolved `create_push_request` helper naming conflicts |

### Test Files
| File | Count | Purpose |
|------|-------|---------|
| `push_card_spend_reactor_test.exs` | 12 | Unit tests per provider |
| `card_spend_flow_01_lifecycle_test.exs` | 5 | Full Push → Sync → Bridge flow |

### Documentation
- Decision Record: `DECISION-RECORD-FLOW-01.md`
- Committee Review: `COMMITTEE-REVIEW.md`
- 14 Flow documents updated with reactor rename

---

## 🔴 CRITICAL: Patterns You MUST Follow

### 1. Test Helper Naming Convention

**Problem we hit:** `create_push_request` helper in test files conflicted with the one imported from `ErpIntegrationCase`.

**Solution established:** Each test file now has a uniquely-named helper:

```elixir
# ✅ CORRECT - Use entity-specific name
defp create_card_spend_request(ctx, provider) do
  # ...
end

# ❌ WRONG - Conflicts with ErpIntegrationCase.create_push_request
defp create_push_request(ctx, provider) do
  # ...
end
```

**For Flow-02:** Name your helper `create_flow02_push_request` or `create_auto_vendor_push_request`.

---

### 2. Test Data via `push_metadata` (Unit Tests)

For unit tests, we pass test data through `push_metadata` instead of creating real transactions:

```elixir
push_metadata = %{
  "test_push" => true,
  "transaction_date" => Date.to_string(transaction_date),
  "transaction_amount" => "120.00",
  "vendor_id" => vendor_id,                    # UUID of accounting vendor
  "vendor_external_id" => "VEND-001",          # ERP external ID
  "skip_period_validation" => false            # Set true to bypass for vendor tests
}
```

**Key fields for Flow-02:**
- `vendor_id` → Set to `nil` or `:explicit_nil` to test "no vendor" scenario
- You may need new fields for vendor auto-creation (merchant name, amount for threshold)

---

### 3. Lifecycle Test Structure

Flow-01 established this pattern for lifecycle tests:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LIFECYCLE TEST PATTERN                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   PHASE 1: PUSH                                                         │
│   └── execute_push(ctx, push_request)  ← Uses Ash.update(:execute_push) │
│                                                                         │
│   PHASE 2: SYNC                                                         │
│   └── run_sync_reactor(ctx, entities: [:bills])                         │
│                                                                         │
│   PHASE 3: BRIDGE                                                       │
│   └── BillReconciliationService.reconcile_workspace(workspace_id)       │
│                                                                         │
│   ASSERTIONS:                                                           │
│   └── PushRequest.status == :sync_verified                              │
│   └── PushRequest.accounting_resource_id == Bill.id                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**For Flow-02:** You'll need to add vendor sync BEFORE bill sync if auto-creating vendors:
```elixir
run_sync_reactor(ctx, entities: [:vendors])  # Sync new vendor first
run_sync_reactor(ctx, entities: [:bills])    # Then sync bill
```

---

### 4. MockAdapter Configuration Order

**Pitfall we hit:** MockAdapter responses need to be configured BEFORE calling the reactor.

```elixir
# ✅ CORRECT ORDER
MockAdapter.configure_push_response(:vendor, %{external_id: "NEW-VENDOR-001"})
MockAdapter.configure_push_response(:bill, %{external_id: bill_external_id})
MockAdapter.configure_push_response(:bill_payment, %{external_id: payment_external_id})
{:ok, result} = execute_push(ctx, push_request)

# ❌ WRONG - Responses not configured when reactor runs
{:ok, result} = execute_push(ctx, push_request)
MockAdapter.configure_push_response(:bill, %{...})  # Too late!
```

---

### 5. Period Validation in Tests

The reactor validates accounting periods. For vendor-focused tests, you may want to skip this:

```elixir
# For vendor resolution tests, skip period validation to isolate the test
push_metadata = %{
  "test_push" => true,
  "skip_period_validation" => true,  # ← Skip period check
  "vendor_id" => nil                  # ← Test no-vendor scenario
}
```

---

## 🟡 What Flow-02 Needs to Implement

### 1. Vendor Auto-Creation Logic

The `resolve_vendor` step in `PushCardSpendReactor` already has the framework:

```elixir
defp handle_missing_vendor(transaction, push_request, actor) do
  case load_vendor_policy(push_request) do
    {:ok, policy} ->
      amount = extract_amount(transaction)
      
      case VendorPolicy.should_auto_create?(policy, amount) do
        true ->
          # Flow 2, 5: Auto-create vendor ← IMPLEMENT THIS
          create_vendor_in_erp(transaction, push_request, actor)
          
        false ->
          # Flow 3, 6: Block with message ← IMPLEMENT THIS
          {:error, :blocked, build_blocking_message(policy, amount)}
      end
  end
end
```

**What needs to be built:**
1. `create_vendor_in_erp/3` - Push new vendor to ERP
2. Update `push_metadata` with new vendor's `external_id`
3. Store vendor creation in reconciliation flow

### 2. VendorPolicy Resource

Check if `VendorPolicy` exists and has:
- `creation_mode` (`:auto_create`, `:threshold`, `:manual`)
- `threshold` (integer amount)
- `should_auto_create?/2` function

### 3. Test Cases for Flow-02

| ID | Test Case | Priority |
|----|-----------|----------|
| F02-T01 | Vendor doesn't exist + policy=auto_create → vendor created + push succeeds | P0 |
| F02-T02 | Vendor creation fails in ERP → push fails with clear message | P0 |
| F02-T03 | Created vendor syncs back correctly | P0 |
| F02-T04 | PushRequest stores vendor_external_id in metadata | P1 |
| F02-T05 | Full lifecycle: push vendor + bill + sync + reconcile | P0 |

---

## 🟢 What Will Be Easy for Flow-02

### 1. Test Infrastructure Is Ready
- `ErpIntegrationCase` provides all setup
- `MockAdapter` supports vendor push responses
- Lifecycle test pattern is established

### 2. Reactor Framework Is Extensible
- `resolve_vendor` step already has the conditional structure
- Just implement the `create_vendor_in_erp` branch

### 3. Documentation Pattern Is Established
- Copy `FLOW-01-CARD-EXISTING-VENDOR-OPEN.md` as template
- Update diagram and test cases

---

## 🔴 Known Issues / Technical Debt

### 1. `test_push` Flag Bypasses Transaction Loading

In unit tests, we use `test_push: true` which bypasses `Ash.get(ExpenseCardTransaction, ...)`. This is intentional for unit tests but means:
- Unit tests don't verify actual transaction loading
- Lifecycle tests MUST NOT use `test_push: true` to ensure production path is tested

### 2. Warnings About Custom Field Mappings

You'll see these warnings in test output:
```
Failed to get custom field mappings: %Ash.Error.Invalid{TenantRequired...}
```
These are benign - the custom field service tries to load mappings but tenant context isn't fully set in tests.

### 3. Bill `transaction_number` vs `bill_number`

The `Bill` resource uses `transaction_number`, not `bill_number`. If you're creating Bill fixtures:
```elixir
# ✅ CORRECT
%Bill{transaction_number: "BILL-001", ...}

# ❌ WRONG - Field doesn't exist
%Bill{bill_number: "BILL-001", ...}
```

---

## Recommended Approach for Flow-02

### Step 1: Create Flow-02 Test File First
```
test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_02_test.exs
```

### Step 2: Write Failing Tests
- F02-T01: Vendor auto-create succeeds
- F02-T02: Full lifecycle with new vendor

### Step 3: Implement `create_vendor_in_erp`
In `push_card_spend_reactor.ex`, implement the TODO branch.

### Step 4: Update Lifecycle Test
Add vendor sync phase before bill sync.

### Step 5: Run Full Test Suite
```bash
mix test test/flame_teampay_payables/ember_erp/integration/
```

---

## Commands Reference

```bash
# Run Flow-01 tests (verify nothing broke)
mix test test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_01_lifecycle_test.exs

# Run push reactor unit tests
mix test test/flame_teampay_payables/ember_erp/integration/push/push_card_spend_reactor_test.exs

# Run all push tests
mix test test/flame_teampay_payables/ember_erp/integration/push/

# Compile without force
mix compile 2>&1 | tail -150
```

---

## Session Artifacts Location

```
docs/agents/architecture/integrations/erps/committees/sync/artifacts/sessions/SC-2025-12-29-001/
├── REQUIREMENTS-PART-1-AUTO-SYNC.md
├── REQUIREMENTS-PART-2-MANUAL-SYNC.md
├── REQUIREMENTS-PART-3-VENDOR-POLICY.md
├── REQUIREMENTS-CONSOLIDATED.md
├── DECISION-RECORD-FLOW-01.md
├── COMMITTEE-REVIEW.md
├── ENGINEERING-REVIEW.md
├── HANDOFF-TO-FLOW-02.md          ← THIS FILE
└── flows/
    ├── INDEX.md
    ├── FLOW-01-CARD-EXISTING-VENDOR-OPEN.md
    ├── FLOW-02-CARD-NEW-VENDOR-AUTO.md    ← Reference for Flow-02
    └── ... (14 total)
```

---

## Final Checklist for Next Committee

- [ ] Read `FLOW-02-CARD-NEW-VENDOR-AUTO.md` for requirements
- [ ] Verify `VendorPolicy` resource exists with `should_auto_create?/2`
- [ ] Create `card_spend_flow_02_test.exs` with unique helper names
- [ ] Implement `create_vendor_in_erp/3` in reactor
- [ ] Add vendor sync to lifecycle test
- [ ] Update session state for new session ID
- [ ] Run full test suite before marking complete

---

*Handoff Complete: 2025-12-29*  
*Session SC-2025-12-29-001 → CLOSED*

