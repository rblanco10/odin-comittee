# Session Decisions

**Session**: 2026-01-22_002_wex-dashboard-visibility-fix

---

## DEC-052: Fix Provider Variable Value

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Derek Patterson (Variable Template Expert)

**Description**: Change the WEX provider template variable value from `"wex"` to `"wex_fleet"` in `tier2-card-operations.json` to match the actual Loki log values.

**Rationale**:
- The Elixir codebase uses `:wex_fleet` as the provider atom
- Logs serialize this as `"wex_fleet"`
- Dashboard filter `provider=~"wex"` does not match `"wex_fleet"`
- All 15+ panels are affected

**Challenges Addressed**:
- Elena Vasquez (Complexity Auditor): Confirmed exact match is better than regex workaround
- Elena Vasquez: Verified no other template variables have similar issues
- Elena Vasquez: Confirmed dashboard should match code, not vice versa

**Vote**: Unanimous approval

**Result**: ✅ APPROVED

---

## DEC-053: Dashboard Should Match Code

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Elena Vasquez (Complexity Auditor)

**Description**: When dashboard configurations and code disagree, the dashboard should be updated to match the code, not the other way around. The Elixir codebase is the source of truth for provider naming.

**Rationale**:
- Changing Elixir code would require touching dozens of files
- Risk of production issues
- Dashboard changes are zero-risk and instant

**Result**: ✅ APPROVED
