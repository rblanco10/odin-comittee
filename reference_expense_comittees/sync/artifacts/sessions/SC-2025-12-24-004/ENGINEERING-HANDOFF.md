# Engineering Handoff: ERP Integration Test Architecture

> **Session:** SC-2025-12-24-004  
> **Date:** 2025-12-24  
> **Status:** APPROVED FOR IMPLEMENTATION  
> **Priority:** Critical — Production release blocker

---

## Executive Summary

This document specifies the complete test architecture for ERP integration testing,
covering sync, bridge, and push flows across all 4 ERP providers (NetSuite, Sage Intacct,
Acumatica, QuickBooks).

### Key Principles

1. **Dual-Mode Testing**: All tests run in Mock mode (fast, CI) and Live mode (real ERP)
2. **Provider-Agnostic Patterns**: Same test code covers all 4 ERPs
3. **Comprehensive Documentation**: Every test documents its purpose and expectations
4. **Repeatable Live Tests**: Database cleanup ensures tests can be re-run
5. **Production Grade**: No shortcuts — full professional implementation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEST ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ErpIntegrationCase                              │   │
│  │  Base test case that provides:                                       │   │
│  │  - Mode detection (mock vs live)                                     │   │
│  │  - Workspace/entity/connection setup                                 │   │
│  │  - Adapter registry swapping (mock mode)                             │   │
│  │  - Cleanup callbacks (live mode)                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                    ┌───────────────┴───────────────┐                        │
│                    ▼                               ▼                        │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────┐     │
│  │       MOCK MODE             │   │        LIVE MODE                 │     │
│  │                             │   │                                  │     │
│  │  MockAdapter                │   │  Real Adapters                   │     │
│  │  ├── fetch_page/3           │   │  ├── NetSuiteAdapter             │     │
│  │  ├── push/4                 │   │  ├── SageIntacctAdapter          │     │
│  │  └── configure_*/2          │   │  ├── AcumaticaAdapter            │     │
│  │                             │   │  └── QuickBooksAdapter           │     │
│  │  FixtureLoader              │   │                                  │     │
│  │  └── JSON fixtures          │   │  LiveCredentials                 │     │
│  │                             │   │  └── Environment variables       │     │
│  │  Ecto Sandbox               │   │                                  │     │
│  │  └── Auto-rollback          │   │  CleanupHelpers                  │     │
│  │                             │   │  └── Explicit cleanup            │     │
│  └─────────────────────────────┘   └─────────────────────────────────────┘  │
│                                                                              │
│                    ┌───────────────┴───────────────┐                        │
│                    ▼                               ▼                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SAME TEST CODE                                │   │
│  │                                                                       │   │
│  │  describe "vendor sync" do                                           │   │
│  │    test "syncs vendors successfully" do                              │   │
│  │      configure_sync_response(ctx, :vendors, fixture(:vendors))       │   │
│  │      #  ↑ In mock mode: sets up mock response                        │   │
│  │      #  ↑ In live mode: no-op, real API called                       │   │
│  │                                                                       │   │
│  │      {:ok, result} = run_sync_reactor(ctx, entities: [:vendors])     │   │
│  │      #  ↑ Same in both modes — runs real reactor                     │   │
│  │                                                                       │   │
│  │      assert_mirror_populated(:vendors)                               │   │
│  │      #  ↑ Same assertion works in both modes                         │   │
│  │    end                                                                │   │
│  │  end                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. ErpIntegrationCase (`test/support/erp_integration/erp_integration_case.ex`)

```elixir
defmodule FlameTeampayPayables.ErpIntegrationCase do
  @moduledoc """
  Base test case for ERP integration tests.
  
  Provides dual-mode testing (mock and live) with automatic setup and cleanup.
  """
  
  use ExUnit.CaseTemplate
  
  @live_mode? System.get_env("ERP_LIVE_TEST") == "true"
  
  using do
    quote do
      import FlameTeampayPayables.ErpIntegrationCase
      import FlameTeampayPayables.ErpIntegration.Assertions
      import FlameTeampayPayables.ErpIntegration.SyncHelpers
      import FlameTeampayPayables.ErpIntegration.BridgeHelpers
      import FlameTeampayPayables.ErpIntegration.PushHelpers
      
      alias FlameTeampayPayables.ErpIntegration.TestContext
      alias FlameTeampayPayables.ErpIntegration.MockAdapter
      alias FlameTeampayPayables.ErpIntegration.FixtureLoader
    end
  end
  
  setup tags do
    # Implementation per specification below
  end
end
```

**Responsibilities:**
- Detect mock vs live mode via `ERP_LIVE_TEST` environment variable
- Create isolated test workspace and entity
- Create ERP connection with appropriate credentials
- Swap adapter registry in mock mode
- Register cleanup callbacks in live mode
- Provide helper function imports

---

### 2. TestContext (`test/support/erp_integration/test_context.ex`)

```elixir
defmodule FlameTeampayPayables.ErpIntegration.TestContext do
  @moduledoc """
  Struct containing all context needed for ERP integration tests.
  """
  
  defstruct [
    :mode,           # :mock or :live
    :workspace,      # Workspace struct
    :entity,         # Entity struct
    :connection,     # ErpConnection struct
    :provider,       # :netsuite, :sage_intacct, :acumatica, :quickbooks
    :mock_adapter,   # MockAdapter module (mock mode only)
    :credentials     # Credential map (live mode only)
  ]
end
```

---

### 3. MockAdapter (`test/support/erp_integration/mock_adapter.ex`)

```elixir
defmodule FlameTeampayPayables.ErpIntegration.MockAdapter do
  @moduledoc """
  Mock ERP adapter for integration testing.
  
  Supports all 4 ERP providers with configurable responses.
  Uses process dictionary for test isolation.
  """
  
  @behaviour FlameTeampayPayables.EmberErp.Adapters.Behaviour
  
  # Configuration API
  def configure_sync_response(entity_type, response)
  def configure_push_response(entity_type, response)
  def configure_error(entity_type, error)
  
  # Capability implementation
  def fetch_page(config, cursor, opts)
  def push(config, entity_type, data, opts)
  
  # Supports capabilities
  def supports_capability?(:sync, _entity_type), do: true
  def supports_capability?(:push, _entity_type), do: true
end
```

**Response Configuration Options:**
- List of records → Automatically paginated
- `{:pages, [page1, page2, ...]}` → Explicit pagination
- `{:error, reason}` → Return error
- Map → Return as-is

---

### 4. CleanupHelpers (`test/support/erp_integration/helpers/cleanup_helpers.ex`)

```elixir
defmodule FlameTeampayPayables.ErpIntegration.CleanupHelpers do
  @moduledoc """
  Database cleanup utilities for live mode testing.
  
  Ensures tests are repeatable by cleaning up all test data.
  """
  
  # Full workspace cleanup (cascades to all related data)
  def cleanup_workspace(workspace_id)
  
  # Selective cleanup
  def cleanup_mirrors(workspace_id, entity_types \\ :all)
  def cleanup_coding_values(workspace_id)
  def cleanup_push_requests(workspace_id)
  def cleanup_sync_executions(workspace_id)
end
```

---

### 5. Assertions (`test/support/erp_integration/assertions.ex`)

```elixir
defmodule FlameTeampayPayables.ErpIntegration.Assertions do
  @moduledoc """
  ERP-specific test assertions.
  
  Provides semantic assertions that work in both mock and live modes.
  """
  
  # Mirror assertions
  def assert_mirror_populated(entity_type, workspace \\ nil)
  def assert_mirror_count(entity_type, expected_count, workspace \\ nil)
  def assert_mirror_has_record(entity_type, external_id, workspace \\ nil)
  
  # Coding assertions
  def assert_coding_category_exists(dimension_type, workspace \\ nil)
  def assert_coding_values_created(dimension_type, workspace \\ nil)
  def assert_mirrors_linked_to_coding_values(entity_type, workspace \\ nil)
  
  # Push assertions
  def assert_push_request_status(push_request, expected_status)
  def assert_push_reconciled(push_request)
  
  # Sync assertions
  def assert_sync_completed(result, entity_types)
  def assert_sync_failed(result, entity_types)
end
```

---

### 6. FixtureLoader (`test/support/erp_integration/fixture_loader.ex`)

```elixir
defmodule FlameTeampayPayables.ErpIntegration.FixtureLoader do
  @moduledoc """
  Loads JSON fixtures for mock adapter responses.
  """
  
  @fixture_path "test/fixtures/erp"
  
  # Load a fixture
  def fixture(provider, entity_type, variant \\ :standard)
  
  # Load and transform (for pagination simulation)
  def fixture_pages(provider, entity_type, page_size \\ 500)
  
  # Get fixture path
  def fixture_path(provider, category, entity_type, variant)
end
```

---

## Database Cleanup Strategy

### Mock Mode

- Uses Ecto SQL Sandbox
- Each test runs in a transaction
- Transaction is rolled back after test
- **No manual cleanup needed**

### Live Mode

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      LIVE MODE CLEANUP FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TEST START                                                              │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Create isolated workspace                                       │   │
│  │  Name: LIVE-TEST-{timestamp}-{random}                           │   │
│  │                                                                   │   │
│  │  Register on_exit callback:                                       │   │
│  │    fn -> CleanupHelpers.cleanup_workspace(workspace.id) end      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  TEST EXECUTION                                                   │   │
│  │  - All data scoped to test workspace                             │   │
│  │  - Mirrors, CodingValues, PushRequests created                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│      │                                                                   │
│      ▼ (success or failure)                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  on_exit CALLBACK RUNS                                            │   │
│  │                                                                   │   │
│  │  CleanupHelpers.cleanup_workspace/1:                             │   │
│  │    1. Delete PushRequests                                         │   │
│  │    2. Delete SyncExecutions                                       │   │
│  │    3. Delete all Mirror table records                            │   │
│  │    4. Delete CodingValues                                         │   │
│  │    5. Delete CodingCategories                                     │   │
│  │    6. Delete ErpConnections                                       │   │
│  │    7. Delete Entities                                             │   │
│  │    8. Delete Workspace                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  DATABASE CLEAN                                                   │   │
│  │  Ready for next test run                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Orphan Cleanup

For test failures that prevent cleanup callbacks:

```bash
# Clean up orphaned test data older than 24 hours
mix erp.cleanup_test_data --older-than 24h
```

---

## Test File Structure

```
test/
├── support/
│   └── erp_integration/
│       ├── README.md
│       ├── erp_integration_case.ex
│       ├── test_context.ex
│       ├── mock_adapter.ex
│       ├── mock_adapter_registry.ex
│       ├── live_credentials.ex
│       ├── fixture_loader.ex
│       ├── assertions.ex
│       ├── factories/
│       │   ├── erp_connection_factory.ex
│       │   ├── mirror_factory.ex
│       │   └── coding_factory.ex
│       └── helpers/
│           ├── sync_helpers.ex
│           ├── bridge_helpers.ex
│           ├── push_helpers.ex
│           └── cleanup_helpers.ex
│
├── fixtures/
│   └── erp/
│       ├── README.md
│       ├── netsuite/
│       │   ├── sync/
│       │   │   ├── departments.json
│       │   │   ├── vendors.json
│       │   │   ├── gl_accounts.json
│       │   │   └── ... (all entities)
│       │   ├── push/
│       │   │   ├── bill_success.json
│       │   │   └── ... (all push responses)
│       │   └── errors/
│       │       ├── rate_limited.json
│       │       └── ... (all error types)
│       ├── sage_intacct/
│       ├── acumatica/
│       └── quickbooks/
│
└── flame_teampay_payables/
    └── ember_erp/
        └── integration/
            ├── README.md
            ├── sync/
            │   ├── workspace_sync_reactor_test.exs
            │   └── ...
            ├── bridge/
            │   ├── bridge_reactor_test.exs
            │   └── ...
            ├── push/
            │   ├── push_orchestrator_test.exs
            │   └── ...
            └── full_lifecycle/
                ├── knockout_test.exs
                └── ...
```

---

## Documentation Standards

### Test File Header

Every test file MUST include:

```elixir
@moduledoc """
# [Test Name]

## Purpose
[What this test file covers]

## Architecture Under Test
[ASCII diagram of components being tested]

## Test Modes
| Mode | Adapter | Speed | When to Use |
|------|---------|-------|-------------|
| Mock | MockAdapter | ~1s | Default, CI |
| Live | Real adapters | ~30s | Release verification |

## Prerequisites
### Mock Mode
- None

### Live Mode
- ERP_LIVE_TEST=true
- Provider credentials

## Related Tests
- [Links to related test files]

## Session Reference
- [Links to committee sessions]
"""
```

### Individual Test Documentation

Every test MUST include:

```elixir
@doc """
## Test: [Test Name]

### What This Tests
[Specific behavior being verified]

### Why This Matters
[Business/technical importance]

### Expected Outcome
[What should happen when test passes]

### Mode Behavior
| Mode | Behavior |
|------|----------|
| Mock | [Mock-specific behavior] |
| Live | [Live-specific behavior] |
"""
test "..." do
  # ...
end
```

---

## Running Tests

### Mock Mode (Default)

```bash
# All integration tests
mix test test/flame_teampay_payables/ember_erp/integration/

# Specific category
mix test test/flame_teampay_payables/ember_erp/integration/sync/

# Knockout test only
mix test test/flame_teampay_payables/ember_erp/integration/full_lifecycle/knockout_test.exs
```

### Live Mode

```bash
# NetSuite
export NETSUITE_ACCOUNT_ID=TSTDRV1234
export NETSUITE_CONSUMER_KEY=xxx
export NETSUITE_CONSUMER_SECRET=xxx
export NETSUITE_TOKEN_ID=xxx
export NETSUITE_TOKEN_SECRET=xxx

ERP_LIVE_TEST=true mix test test/.../integration/ --include live

# All providers
ERP_LIVE_TEST=true \
ERP_TEST_PROVIDERS=netsuite,sage_intacct,acumatica,quickbooks \
mix test test/.../integration/ --include live
```

### CI Configuration

```yaml
# Mock tests on every PR
test:
  runs-on: ubuntu-latest
  steps:
    - run: mix test test/flame_teampay_payables/ember_erp/integration/

# Live tests nightly
live-erp-tests:
  runs-on: ubuntu-latest
  schedule:
    - cron: '0 2 * * *'
  steps:
    - run: |
        ERP_LIVE_TEST=true \
        NETSUITE_ACCOUNT_ID=${{ secrets.NETSUITE_ACCOUNT_ID }} \
        mix test test/.../integration/ --include live
```

---

## Implementation Checklist

### Phase 1: Test Infrastructure

- [ ] `erp_integration_case.ex` — Base test case
- [ ] `test_context.ex` — Context struct
- [ ] `mock_adapter.ex` — Mock adapter
- [ ] `mock_adapter_registry.ex` — Registry swap
- [ ] `live_credentials.ex` — Credential loading
- [ ] `fixture_loader.ex` — Fixture loading
- [ ] `assertions.ex` — Assertions module

### Phase 2: Helpers & Factories

- [ ] `cleanup_helpers.ex` — Cleanup utilities
- [ ] `sync_helpers.ex` — Sync utilities
- [ ] `bridge_helpers.ex` — Bridge utilities
- [ ] `push_helpers.ex` — Push utilities
- [ ] `erp_connection_factory.ex` — Connection factory
- [ ] `mirror_factory.ex` — Mirror factory

### Phase 3: Fixtures

- [ ] NetSuite sync fixtures (departments, vendors, gl_accounts, etc.)
- [ ] NetSuite push fixtures (bill_success, etc.)
- [ ] NetSuite error fixtures (rate_limited, unauthorized, etc.)
- [ ] Sage Intacct fixtures (same categories)
- [ ] Acumatica fixtures (same categories)
- [ ] QuickBooks fixtures (same categories)

### Phase 4: Tests

- [ ] `knockout_test.exs` — Full lifecycle knockout
- [ ] `workspace_sync_reactor_test.exs` — Sync reactor tests
- [ ] `bridge_reactor_test.exs` — Bridge reactor tests
- [ ] `push_orchestrator_test.exs` — Push tests

### Phase 5: Documentation

- [ ] `test/support/erp_integration/README.md`
- [ ] `test/fixtures/erp/README.md`
- [ ] `test/flame_teampay_payables/ember_erp/integration/README.md`

---

## Approval

| Role | Name | Approval |
|------|------|----------|
| Chair | Sync Committee Chair | ✅ Approved |
| Sync Architect | — | ✅ Approved |
| Test Coverage Analyst | — | ✅ Approved |
| Multi-ERP Generalist | — | ✅ Approved |
| Human | Elliot Weaver | ✅ Approved |

---

*Document created: 2025-12-24*  
*Session: SC-2025-12-24-004*  
*Status: READY FOR IMPLEMENTATION*

