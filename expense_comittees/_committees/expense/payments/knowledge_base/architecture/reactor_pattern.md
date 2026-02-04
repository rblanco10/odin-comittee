# Reactor Pattern Guide

> **Location**: `ember_payments/reactors/`

---

## Overview

Reactors implement multi-step workflows using Ash Reactor, providing atomic operations with compensation.

---

## Reactor Structure

```elixir
defmodule IssueCardReactor do
  use Ash.Reactor
  
  input :card_params
  input :actor
  
  step :validate_params, ValidateStep
  
  step :get_credentials, GetCredentialsStep do
    wait_for [:validate_params]
  end
  
  step :call_provider, CallProviderStep do
    wait_for [:get_credentials]
  end
  
  step :create_record, CreateRecordStep do
    wait_for [:call_provider]
  end
end
```

---

## Reactor Categories

### Card Reactors
```
reactors/card/
├── issue_card_reactor.ex
├── activate_card_reactor.ex
├── freeze_card_reactor.ex
├── unfreeze_card_reactor.ex
├── cancel_card_reactor.ex
└── update_card_controls_reactor.ex
```

### Identity Reactors
```
reactors/identity/
├── submit_kyb_application_reactor.ex
├── add_beneficial_owner_reactor.ex
├── upload_document_reactor.ex
└── verify_identity_reactor.ex
```

### Payout Reactors
```
reactors/payout/
├── submit_payout_batch_reactor.ex
```

### Transaction Reactors
```
reactors/transaction/
├── initiate_payment_reactor.ex
├── cancel_payment_reactor.ex
```

---

## Compensation Pattern

When steps fail, compensation reverses completed steps:

```elixir
step :create_card_at_provider do
  run fn args, _ ->
    Provider.create_card(args)
  end
  
  compensate fn args, _ ->
    # Undo: cancel the card we created
    Provider.cancel_card(args.card_id)
  end
end
```

---

## Two-Layer Pattern

Business reactors call payment reactors:

```
ReimbursementPaymentReactor (business layer)
    → validates business rules
    → SubmitPayoutBatchReactor (payment layer)
        → calls provider
        → creates payment records
```

---

*"Reactors are transactions; all steps succeed or all are rolled back."*
