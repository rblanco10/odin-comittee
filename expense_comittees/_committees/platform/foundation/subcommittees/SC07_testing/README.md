# SC07: Testing Subcommittee

> **Code**: SC07  
> **Lead**: Dr. Michael Torres  
> **Co-Lead**: Dr. Priya Sharma  
> **Focus**: Test strategy, quality assurance, CI/CD

---

## Mission

The Testing Subcommittee is responsible for the test strategy across the entire Ember Platform. We ensure that every app is thoroughly tested, tests are maintainable, and the CI/CD pipeline is reliable.

We ensure that:
1. Every app has appropriate test coverage
2. Tests are fast, reliable, and maintainable
3. CI/CD catches issues before production
4. Test patterns are consistent across the platform

---

## Jurisdiction

### Primary Responsibilities

- Define test standards and patterns
- Review test coverage requirements
- Maintain CI/CD pipeline
- Guide test strategy for new apps
- Review testing-related architectural decisions

### Decision Authority

| Decision Type | Authority Level |
|---------------|-----------------|
| Test pattern standards | Subcommittee approval |
| Coverage requirements | Subcommittee approval |
| CI/CD changes | Subcommittee approval |
| Test infrastructure changes | Subcommittee + relevant specialists |

---

## Members

| Name | Role | Expertise |
|------|------|-----------|
| Dr. Michael Torres | Lead | Test architecture |
| Dr. Priya Sharma | Co-Lead | Integration testing |
| Dr. Elena Popov | Member | Database testing |
| Antonio Ferreira | Member | Observability testing |
| Rachel Kim | Member | CI/CD pipelines |
| Sebastian Volkov | Critic | Performance testing |
| Dr. Lisa Chen | Quality | QA standards |

---

## Test Pyramid

### Unit Tests (70%)
- Test individual functions and modules
- Mock external dependencies
- Fast, isolated, deterministic

### Integration Tests (20%)
- Test component interactions
- Use real database (sandboxed)
- Test Ash resource actions

### End-to-End Tests (10%)
- Test complete user workflows
- Test via LiveView/API
- Fewer, focused on critical paths

---

## Test Patterns by Tier

### Core Tier (`core_*`)
- Pure unit tests only
- No database, no external deps
- Property-based testing recommended

```elixir
# core_types tests
describe "Money.add/2" do
  property "adding two moneys in same currency" do
    check all(
      a <- money_generator(:USD),
      b <- money_generator(:USD)
    ) do
      result = Money.add(a, b)
      assert result.currency == :USD
    end
  end
end
```

### Infrastructure Tier (`infra_*`)
- Unit tests for internal logic
- Integration tests with sandbox
- Mock external providers in most tests
- Dedicated adapter tests with VCR/bypass

```elixir
# infra_payments adapter tests
describe "Marqeta.CardIssuance" do
  test "issues card with valid params", %{bypass: bypass} do
    Bypass.expect(bypass, "POST", "/cards", fn conn ->
      Plug.Conn.resp(conn, 201, @success_response)
    end)
    
    assert {:ok, card} = Marqeta.CardIssuance.issue_card(@valid_params)
  end
end
```

### Domain Tier (`domain_*`)
- Test Ash resources with real database
- Test business rules thoroughly
- Test state machine transitions

```elixir
# domain_approvals tests
describe "ApprovalWorkflow" do
  test "routes to correct approver based on amount" do
    workflow = create_workflow(threshold: 1000)
    
    {:ok, request} = create_approval_request(amount: 500)
    assert request.assigned_to == workflow.under_threshold_approver
    
    {:ok, request} = create_approval_request(amount: 1500)
    assert request.assigned_to == workflow.over_threshold_approver
  end
end
```

### Product Tier (`product_*`)
- Full integration tests
- Test complete features
- Test cross-domain interactions

### Web Tier (`web_*`)
- LiveView tests
- Browser tests for critical paths
- API endpoint tests

---

## CI/CD Pipeline

### On Every PR
1. Compile (no warnings)
2. Format check
3. Credo (static analysis)
4. Dialyzer (type checking)
5. Unit tests (all apps)
6. Integration tests (affected apps)

### On Merge to Main
1. All PR checks
2. Full integration suite
3. End-to-end tests
4. Build release

### On Release
1. All main checks
2. Smoke tests in staging
3. Canary deployment
4. Full production rollout

---

## Coverage Requirements

| Tier | Minimum Coverage | Target Coverage |
|------|------------------|-----------------|
| Core | 95% | 100% |
| Infrastructure | 85% | 90% |
| Domain | 90% | 95% |
| Product | 80% | 90% |
| Web | 70% | 80% |

---

## Test Data Management

### Factories
Use ExMachina for test data factories.

### Fixtures
Shared fixtures for common scenarios.

### Database Sandboxing
Each test runs in its own transaction.

---

## Meeting Cadence

- **Regular**: Weekly
- **CI/CD Review**: Monthly
- **Coverage Review**: Quarterly

---

## Related Documentation

- [Umbrella Structure](../../knowledge_base/architecture/umbrella_structure.md)
- [Test Patterns](../../knowledge_base/testing/) (TBD)

---

*"Tests are executable documentation. If it's not tested, it's broken."*
