# Action Items

> **Session**: 2026-01-08_003_infra-identity-migration  
> **Status**: ✅ SESSION COMPLETED

---

## Completed

| # | Action | Completed By |
|---|--------|--------------|
| 1 | Delete premature core_* apps | David Okonkwo (Research Clerk) |
| 2 | Create `core_data` app with shared Repo | Helena Andersen (Vice Chair) |
| 3 | Create `infra_identity` app scaffold | Helena Andersen (Vice Chair) |
| 4 | Migrate ember_identity code (137+ files) | David Okonkwo (Research Clerk) |
| 5 | Migrate ember_workspaces code (158+ files) | David Okonkwo (Research Clerk) |
| 6 | Migrate ember_authorization code (48+ files) | David Okonkwo (Research Clerk) |
| 7 | Update module namespaces to InfraIdentity.* | Felix Martinez (Dependencies Expert) |
| 8 | Create adapter stubs for external dependencies | Felix Martinez (Dependencies Expert) |
| 9 | Fix AshAudit extension issues | Dr. Marcus Blackwell (Chair) |
| 10 | Verify successful compilation | Committee |

---

## Follow-Up Items (Post-Session)

These items are for future sessions or ongoing work:

### High Priority
| # | Item | Owner | Notes |
|---|------|-------|-------|
| 1 | Add WebAuthn support (`wax` dependency) | TBD | Required for FIDO2 authentication |
| 2 | Add OAuth support (`assent` dependency) | TBD | Required for social login |
| 3 | Re-enable AshAudit when infra_audit migrated | TBD | Currently commented out |

### Medium Priority
| # | Item | Owner | Notes |
|---|------|-------|-------|
| 4 | Create database migrations | TBD | Run `mix ash_postgres.generate_migrations` |
| 5 | Migrate tests from flame_teampay_payables | TBD | Tests not yet migrated |
| 6 | Replace adapter stubs with real implementations | TBD | As other infra apps are migrated |

### Low Priority
| # | Item | Owner | Notes |
|---|------|-------|-------|
| 7 | Fix compiler warnings | TBD | Unused variables, deprecated syntax |
| 8 | Update documentation | TBD | Module docs still reference old structure |

---

## Statistics

| Metric | Value |
|--------|-------|
| Files Migrated | ~343 |
| Lines of Code | ~15,000+ |
| External Dependencies Stubbed | 16 |
| Compilation Status | ✅ SUCCESS |
| Time to Complete | ~1 session |

---

## Next Recommended Session

**Session 004: infra_payments Migration**

Following the same pattern established here:
1. Create the app scaffold
2. Copy files from ember_payments
3. Update namespaces
4. Create adapter stubs
5. Verify compilation
