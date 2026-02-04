# Compliance Checker Tool

> **Purpose**: Verify regulatory compliance coverage in committees  
> **Used By**: Khaos (Audit), Tartarus-lineage committees

---

## Overview

This tool helps verify that committees handling regulated domains have appropriate compliance coverage.

---

## Domain-to-Regulation Mapping

### Payment Processing

| Domain | Applicable Regulations |
|--------|----------------------|
| Card payments | PCI-DSS |
| ACH/Bank transfers | NACHA, Reg E |
| Wire transfers | Reg J, BSA |
| Money movement | State MTLs, FinCEN |

### Financial Records

| Domain | Applicable Regulations |
|--------|----------------------|
| Ledger operations | GAAP, SOX (controls) |
| Audit trails | SOX Section 404 |
| Transaction records | BSA (5-year retention) |
| Reconciliation | GAAP |

### Customer Data

| Domain | Applicable Regulations |
|--------|----------------------|
| Identity verification | KYC/KYB, CIP |
| Personal information | GDPR, CCPA |
| Financial data | GLBA |
| Card data | PCI-DSS |

### Fraud & Risk

| Domain | Applicable Regulations |
|--------|----------------------|
| Fraud detection | BSA/AML |
| Suspicious activity | SAR requirements |
| Sanctions screening | OFAC |
| Transaction monitoring | BSA |

---

## Compliance Coverage Checklist

### For Payment-Related Committees

```
PCI-DSS COVERAGE
────────────────
□ Tokenization requirements documented
□ No card data stored in committee knowledge base
□ Security controls referenced
□ Data handling procedures documented

NACHA COVERAGE
──────────────
□ Authorization requirements understood
□ Return code handling documented
□ Timing/settlement rules documented
□ Reversal procedures documented
```

### For Ledger-Related Committees

```
GAAP COVERAGE
─────────────
□ Double-entry principle enforced (constitutional rule)
□ Revenue recognition rules documented
□ No deletion policy enforced
□ Audit trail requirements met

SOX COVERAGE
────────────
□ Internal controls documented
□ Change management procedures
□ Access controls defined
□ Evidence preservation rules
```

### For Customer-Facing Committees

```
KYC/KYB COVERAGE
────────────────
□ Verification requirements documented
□ EDD triggers identified
□ PEP screening addressed
□ Beneficial ownership rules

PRIVACY COVERAGE
────────────────
□ Data minimization principles
□ Retention policies
□ Subject rights (access, deletion)
□ Cross-border transfer rules
```

### For Risk-Related Committees

```
BSA/AML COVERAGE
────────────────
□ Suspicious activity indicators documented
□ SAR filing triggers identified
□ Transaction monitoring rules
□ Record retention (5 years)

OFAC COVERAGE
─────────────
□ SDN screening requirements
□ Sanctions list update procedures
□ Blocked transaction handling
□ Escalation procedures
```

---

## Committee Compliance Matrix

Use this matrix to verify a committee has appropriate compliance coverage:

| Committee Domain | PCI | NACHA | BSA | SOX | GAAP | KYC | OFAC | MTL |
|------------------|:---:|:-----:|:---:|:---:|:----:|:---:|:----:|:---:|
| Ledger | ○ | ○ | ● | ● | ● | ○ | ○ | ○ |
| Payments | ● | ● | ● | ○ | ○ | ● | ● | ● |
| Security | ● | ○ | ○ | ● | ○ | ○ | ○ | ○ |
| Customer | ● | ○ | ● | ○ | ○ | ● | ● | ○ |
| Risk/Fraud | ○ | ○ | ● | ○ | ○ | ● | ● | ○ |
| Infrastructure | ● | ○ | ○ | ● | ○ | ○ | ○ | ○ |

Legend: ● Required | ○ Awareness needed | (blank) Not applicable

---

## Legal Critic Requirements

For committees with significant regulatory exposure, verify:

```
LEGAL CRITIC VALIDATION
───────────────────────

□ Legal Critic role exists (C004 or equivalent)
□ Legal Critic has BLOCK authority for compliance issues
□ Governance includes "Regulatory Compliance First" rule
□ Knowledge base references regulatory_framework.md
□ Escalation path to actual legal counsel defined
```

---

## Compliance Documentation Requirements

### In GOVERNANCE.md

```
Required Section:
"No fix/action shall be applied that violates financial regulations.
All modifications must maintain audit trail integrity.
Applicable regulations: [LIST SPECIFIC REGULATIONS]"
```

### In Knowledge Base

```
Required File: regulations/README.md

Contents should include:
- List of applicable regulations
- Key requirements summary
- Escalation contacts
- Reference to Khaos regulatory_framework.md
```

---

## Compliance Audit Questions

During committee audit, ask:

### General

1. What regulations apply to this committee's domain?
2. Are those regulations documented in knowledge base?
3. Does the Legal Critic have appropriate authority?
4. Is there an escalation path for compliance concerns?

### Specific (if applicable)

5. How does this committee handle card data? (PCI)
6. How does this committee handle ACH returns? (NACHA)
7. How does this committee detect suspicious activity? (BSA)
8. How does this committee handle data subject requests? (Privacy)

---

## Red Flags

These findings indicate compliance gaps:

| Finding | Severity | Action |
|---------|----------|--------|
| No Legal Critic | 🚫 BLOCK | Add Legal Critic immediately |
| No regulatory documentation | ❌ FAIL | Document applicable regulations |
| Card data in knowledge base | 🚫 BLOCK | Remove immediately, audit |
| No audit trail provisions | ❌ FAIL | Add to constitutional rules |
| No escalation path | ⚠️ WARNING | Define escalation contacts |

---

## Compliance Report Format

```markdown
# Compliance Check Report

**Committee**: [Name]
**Check Date**: [Date]
**Checker**: Khaos

## Applicable Regulations

| Regulation | Applicability | Coverage Status |
|------------|---------------|-----------------|
| [Reg] | [Why applicable] | ✅/⚠️/❌ |

## Coverage Assessment

### [Regulation Name]
**Status**: [COVERED/PARTIAL/MISSING]
**Evidence**: [Where coverage is documented]
**Gaps**: [What's missing]

## Legal Critic Status

- Present: ✅/❌
- Block Authority: ✅/❌
- Escalation Path: ✅/❌

## Recommendations

[List of improvements needed]

## Verdict

**Compliance Status**: COMPLIANT / NEEDS ATTENTION / NON-COMPLIANT
```
