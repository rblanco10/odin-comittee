# Session Goal

**Session**: 2026-01-30_003_anthropic-integration-testing  
**Opened**: 2026-01-30  
**Human Director**: Present

## Primary Objective

Complete the Anthropic Claude integration in the Ashwood receipt extraction endpoint and conduct comprehensive testing of the Teampay-Ashwood stateless bridge. Ensure production readiness through integration testing, error scenario validation, and complete API documentation.

## Success Criteria

- [ ] Anthropic Claude integration complete (replace mock data)
- [ ] Extract endpoint tested with real receipt images
- [ ] Score endpoint tested with real transaction data
- [ ] Integration tests pass (Teampay → Ashwood → Teampay)
- [ ] Error scenarios tested (timeouts, failures, invalid data)
- [ ] API contracts documented (OpenAPI/Swagger)
- [ ] Deployment guide created
- [ ] Performance benchmarks recorded

## Scope Boundaries

**IN SCOPE:**
- Complete Anthropic Vision API integration
- Integration testing (end-to-end flows)
- Error scenario testing
- API documentation (OpenAPI spec)
- Deployment guide with configuration
- Performance testing (basic benchmarks)

**OUT OF SCOPE:**
- Rate limiting implementation (future enhancement)
- Prometheus metrics (future enhancement)
- Load testing (future phase)
- UI changes in Teampay

## Expected Outputs

- [ ] Anthropic integration code (replace mock in controller)
- [ ] Integration test suite
- [ ] Error scenario test results
- [ ] OpenAPI specification document
- [ ] Deployment guide with environment setup
- [ ] Performance benchmark report
- [ ] Test coverage report

## Dependencies

**Requires from Agent 1**:
- ✅ ReceiptMatchingController with extract/score endpoints
- ✅ ApiKeyAuth plug
- ✅ AshwoodClient in Teampay
- ✅ Modified matching.py and tasks.py

**External Dependencies**:
- Anthropic API key (for testing)
- Test receipt images
- Test transaction data
- Both Ashwood and Teampay running locally
