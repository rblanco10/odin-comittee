# Session SC-2026-01-01-003 Context

> **Date:** 2026-01-01  
> **Session:** Third session of January 1, 2026  
> **Topic:** Flow-05 Implementation: Card → New Vendor + Closed Period  
> **Status:** MEETING_ACTIVE

---

## Agenda

1. ⏳ Research and understand Flow-05 relationship to Flows 1-4, 6
2. ⏳ Identify implementation gaps
3. ⏳ Document engineering plan + tests
4. ⏳ Engineering implements Flow-05
5. ⏳ Run all tests
6. ⏳ Subcommittee 1 verifies: Code Fidelity
7. ⏳ Subcommittee 2 verifies: Test Coverage
8. ⏳ Subcommittee 3 verifies: Standards Compliance

---

## Flow-05 Analysis

### What Is Flow-05?

**Flow-05: Card Transaction → New Vendor + Closed Period**

This is a COMBINATION scenario that requires BOTH:
- **Flow-02 behavior**: New vendor below threshold → auto-create vendor
- **Flow-04 behavior**: Transaction date in closed period → fallback to next open

### Flow Relationship Matrix

| Flow | Vendor | Period | Behavior |
|------|--------|--------|----------|
| 1 | EXISTS | OPEN | Happy path (baseline) |
| 2 | NEW (below threshold) | OPEN | Auto-create vendor, then push |
| 3 | NEW (above threshold) | OPEN | BLOCKED by policy |
| 4 | EXISTS | CLOSED | Post to next open period |
| **5** | **NEW (below threshold)** | **CLOSED** | **Auto-create + period fallback** |
| 6 | NEW (disabled) | OPEN | BLOCKED by policy |

### Key Question: Does Current Implementation Handle This?

The PushCardSpendReactor has both pieces:
1. **Step 4**: `ensure_vendor_exists` → calls `handle_missing_vendor` → calls `auto_create_vendor`
2. **Step 5**: `validate_accounting_period` → calls `find_open_period_for_date` → returns `:adjusted`

**BUT**: These steps run sequentially. We need to verify:
1. Vendor is auto-created FIRST
2. Period validation runs AFTER
3. Bill uses the auto-created vendor's external_id AND the adjusted posting period

---

## Materials Gathered

### From Flow Specifications (SC-2025-12-29-001)

```
Flow-05 Scenario:
- Transaction date falls in a CLOSED period
- Vendor does NOT exist in ERP
- Amount is BELOW threshold (auto-create allowed)
- COMBINED behavior: Vendor auto-creation + Period fallback
```

### From Index (Gap Summary)

| Gap ID | Issue | Flows Affected |
|--------|-------|----------------|
| GAP-VENDOR-001 | Vendor policy check | 2, 3, 5, 6 |
| GAP-PERIOD-001 | Period validation | 1, 4, 5, 9 |
| GAP-PERIOD-003 | trandate vs postingperiod | 4, 5, 9 |

**Note:** Flow-05 shares gaps with BOTH Flow-02 (GAP-VENDOR-001) AND Flow-04 (GAP-PERIOD-001, GAP-PERIOD-003).

### Existing Implementation Status

| Component | Flow-02 | Flow-04 | Flow-05 |
|-----------|---------|---------|---------|
| `handle_missing_vendor/3` | ✅ | N/A | ✅ (shared) |
| `auto_create_vendor/3` | ✅ | N/A | ✅ (shared) |
| `find_open_period_for_date/3` | N/A | ✅ | ✅ (shared) |
| `find_next_open_period/4` | N/A | ✅ | ✅ (shared) |
| Lifecycle test | ✅ | ✅ | ❌ MISSING |

### Test Files Analysis

| Test File | Exists | Tests |
|-----------|--------|-------|
| `card_spend_flow_01_lifecycle_test.exs` | ✅ | Flow-01 |
| `card_spend_flow_02_lifecycle_test.exs` | ✅ | Flow-02 |
| `card_spend_flow_03_lifecycle_test.exs` | ✅ | Flow-03 |
| `card_spend_flow_04_lifecycle_test.exs` | ✅ | Flow-04 |
| `card_spend_flow_05_lifecycle_test.exs` | ❌ | **MISSING** |
| `card_spend_flow_06_lifecycle_test.exs` | ✅ | Flow-06 |

---

## Implementation Plan

### Phase 1: Gap Verification

1. Verify that `PushCardSpendReactor` correctly handles the combined scenario
2. Trace the code path when BOTH conditions are true

### Phase 2: Test Creation

Create `card_spend_flow_05_lifecycle_test.exs` with test cases:

| Test ID | Description |
|---------|-------------|
| F05-T01 | New vendor auto-created + closed period → uses next open |
| F05-T02 | Verify PushEntityRecords: vendor, bill, bill_payment |
| F05-T03 | Bill has correct trandate (original) AND postingperiod (adjusted) |
| F05-T04 | Full lifecycle: Push → Sync → Bridge |
| F05-T05 | Vendor syncs with correct external_id |
| F05-T06 | Bill syncs with correct external_id AND period |

### Phase 3: Verification

Three subcommittees will verify:

1. **Code Fidelity Subcommittee**
   - Verify code handles combined scenario correctly
   - No regressions to Flows 1-4, 6

2. **Test Coverage Subcommittee**
   - All 6 tests pass with 0 failures
   - No skipped tests
   - No flaky tests

3. **Standards Enforcer Subcommittee**
   - Session ID conventions followed
   - Comments reference correct session
   - Documentation updated

---

## Critical Rules (From Previous Sessions)

- ❌ NO `--force` when compiling
- ❌ NO `head` on output
- ✅ ONLY `tail -150` or more for command output
- ✅ ALL tests must pass before marking complete (0 failures)
- ✅ Use unique helper names in test files (e.g., `create_flow05_push_request`)
- ✅ Run `mix dev.reset_db.demo` for migrations if needed
- ✅ Verify each claim individually before closing session
- ✅ Do not take shortcuts on tests — fix underlying issues
- ✅ Have 3+ subcommittees verify work before claiming completion
- ✅ Use `Code.ensure_loaded!/1` before `function_exported?/3` in tests

---

*Session: SC-2026-01-01-003*
*Opened: 2026-01-01*

