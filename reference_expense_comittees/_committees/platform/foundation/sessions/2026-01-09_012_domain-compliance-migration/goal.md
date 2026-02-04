# Session Goal

> **Session ID**: 2026-01-09_012_domain-compliance-migration  
> **Date**: 2026-01-09  
> **Type**: Migration

---

## Objective

Migrate `ember_compliance` and `ember_compliance_review` from `flame_teampay_payables` to a new `domain_compliance` app in the Ember Platform umbrella.

## Scope

### Source Modules
1. `FlameTeampayPayables.EmberCompliance` (34 files)
   - AI-powered KYB data extraction from ERP/HRIS
   - Confidence scoring for transparency
   - Resources: ComplianceInferenceJob, ExtractedDataPoint, DataConfidenceScore

2. `FlameTeampayPayables.EmberComplianceReview` (34 files)
   - Operations review queue with ML risk scoring
   - Session tracking and analytics
   - Resources: ReviewQueueItem, ReviewDecision, ReviewSession, ReviewInsight, ReviewAnalytics

### Target Structure
```
apps/domain_compliance/
├── lib/domain_compliance/
│   ├── inference/              # From ember_compliance
│   │   ├── resources/
│   │   ├── services/
│   │   ├── changes/
│   │   └── workers/
│   ├── review/                 # From ember_compliance_review
│   │   ├── resources/
│   │   ├── services/
│   │   ├── ml/
│   │   ├── reactors/
│   │   └── workers/
│   ├── adapters/               # External dependency adapters
│   └── observability/
├── mix.exs
└── test/
```

## Success Criteria

1. All 68 files migrated with correct module namespacing
2. `mix compile` succeeds with no errors
3. Adapter pattern used for external dependencies
4. Dependencies follow tier rules (only downward to Tier 1-2)
5. Session decisions documented

## Dependencies

- `core_data` (Tier 1) — Shared Repo
- `infra_identity` (Tier 2) — Workspace/Entity context
