# Session Goal

**Session**: 2026-01-30_002_teampay-stateless-bridge  
**Opened**: 2026-01-30  
**Human Director**: Present

## Primary Objective

Build stateless API endpoints in Ashwood to provide receipt extraction and transaction scoring services for Teampay's receipt matching feature. This enables Teampay to leverage Ashwood's Anthropic Claude integration and proven scoring algorithm without storing data in Ashwood.

## Success Criteria

- [x] POST /api/receipt-matching/extract endpoint implemented
- [x] POST /api/receipt-matching/score endpoint implemented  
- [x] API key authentication plug created
- [x] Router configured with authentication pipeline
- [x] Error handling and logging implemented
- [x] API contracts documented

## Scope Boundaries

**IN SCOPE:**
- Stateless extraction endpoint (calls Anthropic Claude)
- Stateless scoring endpoint (uses MatchComputationService algorithm)
- API key authentication
- Error handling and logging
- JSON API contracts

**OUT OF SCOPE:**
- Storing receipts in DocumentInbox (stateless approach)
- Org/workspace mapping (not needed for stateless)
- Webhook callbacks
- Full Anthropic integration (TODO: replace mock)

## Expected Outputs

- [x] ReceiptMatchingController with extract/score actions
- [x] ApiKeyAuth plug for authentication
- [x] Router configuration
- [ ] Anthropic integration (pending - currently mock)
