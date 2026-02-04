# SC02: Card Operations Subcommittee

> **Code**: SC02  
> **Focus**: Card issuance, lifecycle, and transaction handling

---

## Charter

### Purpose
Oversee all card-related operations in ember_payments including issuance, lifecycle management, and transaction processing.

### Scope
- Card issuance (virtual and physical)
- Card lifecycle (activate, freeze, cancel)
- Card transactions and authorizations
- Card controls and limits

### Key Questions
1. Is card issuance reliable across providers?
2. Are lifecycle transitions handled correctly?
3. Is transaction processing accurate?
4. Are controls enforced properly?

---

## Members

**Lead**: Marcus Chen (Card Issuance Expert)

**Core Members**:
- Samantha Price (Authorization Expert)
- Kevin O'Brien (Transaction Expert)
- Robert Huang (Fleet Card Specialist)
- Angela Martinez (Controls Expert)
- David Kim (Marqeta Expert)
- Michelle Park (WEX Expert)

**Critics**:
- Yuki Tanaka (Edge Case Hunter)

---

## Code Focus Areas

```
resources/card/
├── card_issuance.ex
├── card_transaction.ex
├── card_authorization.ex

reactors/card/
├── issue_card_reactor.ex
├── activate_card_reactor.ex
├── freeze_card_reactor.ex
├── cancel_card_reactor.ex
```

---

*"Cards are trust tokens; every operation must be reliable."*
