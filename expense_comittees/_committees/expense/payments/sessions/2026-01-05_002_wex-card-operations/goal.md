# Session Goal

> **Session ID**: 2026-01-05_002_wex-card-operations  
> **Opened**: 2026-01-05  
> **Requested By**: Human Director

---

## Primary Objective

Validate and verify that all WEX Fleet card operations work correctly for both virtual and physical cards, ensuring our implementation aligns with best practices and that each action functions properly both on our end and on the WEX provider end.

### Card Operations to Verify

1. **Issuing a card** (virtual and physical)
2. **Freeze/unfreeze cards**
3. **Set MCC (Merchant Category Code) restrictions**
4. **Update spending limits**
5. **Close cards**

---

## Success Criteria

- [ ] Complete understanding of WEX virtual vs. physical card APIs
- [ ] Each card operation reviewed for correctness
- [ ] Test strategy defined to verify all operations
- [ ] Tests executed to confirm functionality
- [ ] Any gaps or issues identified and documented
- [ ] Confidence that production cards will work correctly

---

## Scope Boundaries

**IN SCOPE:**
- WEX Fleet virtual card operations (Merchant Log API)
- WEX Fleet physical card operations (Card Management API)
- Card issuance for both card types
- Freeze/unfreeze implementation (virtual vs. physical differences)
- MCC control implementation (SOAP vs REST)
- Spending limit management
- Card cancellation/closing
- Existing test infrastructure and how to use it
- Running tests to verify functionality

**OUT OF SCOPE:**
- Other providers (Marqeta, Checkbook, Dwolla)
- Transaction webhooks (separate topic)
- Driver/vehicle SOAP management
- UI implementation details

---

## Expected Outputs

- [ ] ASCII diagram of WEX card operations architecture
- [ ] Documentation of virtual vs. physical card API differences
- [ ] Confirmation or correction of each operation's implementation
- [ ] Test execution results
- [ ] Recommendations for any improvements needed
- [ ] Confidence report on production readiness

