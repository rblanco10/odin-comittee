# IEx Commands for Running Checkbook Flow Tests

## Starting IEx

```bash
cd /Users/proyer/ashwood/campsite/flames/flame_teampay_payables
iex -S mix
```

## Running All Checkbook Flow Tests

```elixir
# Run all Checkbook flow tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/"])

# Or with tags
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/", "--tag", "checkbook"])
```

## Running Specific Test Files

```elixir
# Setup - KYB Tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/setup/s1_kyb_instant_approval_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/setup/s2_kyb_document_approved_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/setup/s3_kyb_document_rejected_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/setup/s4_kyb_document_timeout_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/setup/s5_kyb_rejected_test.exs"])

# Setup - Bank Tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/setup/s6_bank_plaid_iav_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/setup/s7_bank_manual_entry_test.exs"])

# Payout Tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/payout/p1_digital_success_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/payout/p2_physical_success_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/payout/p3_digital_bounce_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/payout/p4_physical_return_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/payout/p5_cancelled_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/payout/p6_error_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/payout/p7_stuck_no_webhook_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/payout/p9_void_check_stop_payment_test.exs"])
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/payout/p10_void_check_too_late_test.exs"])

# Operations Tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/operations/o1_reconciliation_test.exs"])
```

## Running by Category

```elixir
# All setup tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/setup/"])

# All payout tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/payout/"])

# All operations tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/operations/"])
```

## Running by Tag

```elixir
# Run only setup tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/", "--only", "setup"])

# Run only payout tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/", "--only", "payout"])

# Run only integration tests
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/", "--only", "integration"])
```

## Running Specific Describe Blocks

```elixir
# Run specific describe block (example)
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/setup/s1_kyb_instant_approval_test.exs", "--only", "describe:CHK-S1: Instant approval API call"])
```

## Running with Verbose Output

```elixir
# Show detailed test output
Mix.Task.run("test", ["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/", "--trace"])
```

## Using the Manual Test Script

```elixir
# Load the manual test script
Code.eval_file("scripts/manual_test_all_checkbook_flows.exs")

# Then use the CheckbookFlowTester module
CheckbookFlowTester.list_flows()
CheckbookFlowTester.run_flow("s1")
CheckbookFlowTester.run_flow("p1")
CheckbookFlowTester.run_all()
CheckbookFlowTester.run_by_category("Setup - KYB")
```

## Alternative: Using ExUnit Directly

```elixir
# Load ExUnit
ExUnit.start()

# Compile and load test files
Code.compile_file("test/flame_teampay_payables/ember_payments/integration/flows/checkbook/setup/s1_kyb_instant_approval_test.exs")

# Run ExUnit
ExUnit.run()
```

## Quick Test Commands

```elixir
# Quick test - run all Checkbook tests
alias Mix.Tasks.Test
Test.run(["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/"])

# With max failures
Test.run(["test/flame_teampay_payables/ember_payments/integration/flows/checkbook/", "--max-failures", "5"])
```
