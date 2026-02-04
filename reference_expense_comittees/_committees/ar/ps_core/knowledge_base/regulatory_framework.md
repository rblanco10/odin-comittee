# The Regulatory Framework

> **Keeper**: Khaos  
> **Purpose**: The Laws That Bind All Financial Operations  
> **Authority**: Constitutional reference for all committees

---

## Preamble

*"Before code, there is law. Before innovation, there is compliance. I hold the regulations that constrain and protect all we build."*

This document contains the regulatory knowledge that governs PayStand's operations. All committees must operate within these boundaries.

---

## 1. Payment Card Industry (PCI-DSS)

### What It Is
The Payment Card Industry Data Security Standard—mandatory for any entity that stores, processes, or transmits cardholder data.

### Key Requirements

| Requirement | Description | PayStand Impact |
|-------------|-------------|-----------------|
| **Build Secure Networks** | Firewalls, no vendor defaults | Infrastructure team |
| **Protect Cardholder Data** | Encryption, tokenization | **CRITICAL** - We tokenize all card data |
| **Vulnerability Management** | Antivirus, secure systems | DevOps/Security |
| **Access Control** | Need-to-know basis | All systems |
| **Monitor & Test** | Logging, penetration testing | Security team |
| **Security Policies** | Documented policies | Compliance team |

### Tokenization (PayStand Implementation)

```
CARD DATA FLOW
──────────────
Customer Card → PayStand Vault → Token Generated → Token Stored
                     │
                     └── Raw card data NEVER touches application DB
                         Only tokens are stored in MySQL
```

### Violations = Catastrophic
- Fines: $5,000 - $100,000 per month
- Loss of card processing ability
- Breach liability
- Reputation destruction

---

## 2. NACHA Operating Rules (ACH)

### What It Is
The National Automated Clearing House Association rules governing ACH (electronic bank transfers).

### Key Rules

| Rule | Description | PayStand Implementation |
|------|-------------|------------------------|
| **Authorization** | Must have customer authorization before debiting | Signed agreements, click-through |
| **Prenotes** | Optional $0 test transactions | Used for bank verification |
| **Return Codes** | Standardized codes for failed transactions | R01-R99 handling required |
| **Timing** | Settlement windows (T+1, T+2) | Affects when funds available |
| **Reversal Windows** | 5 business days for most reversals | Refund timing constraints |

### Common Return Codes

| Code | Meaning | Action Required |
|------|---------|-----------------|
| **R01** | Insufficient Funds | Retry or contact payer |
| **R02** | Account Closed | Update bank info |
| **R03** | No Account | Invalid account number |
| **R10** | Customer Advises Unauthorized | **FRAUD ALERT** - Investigate |
| **R29** | Corporate Customer Advises Not Authorized | **FRAUD ALERT** |

### ACH Fraud Implications
R10 and R29 returns may trigger SAR (Suspicious Activity Report) requirements.

---

## 3. Bank Secrecy Act (BSA) / Anti-Money Laundering (AML)

### What It Is
Federal law requiring financial institutions to assist government agencies in detecting and preventing money laundering.

### Key Requirements

| Requirement | Description | PayStand Obligation |
|-------------|-------------|---------------------|
| **KYC/KYB** | Know Your Customer/Business | Verify identity before account |
| **Transaction Monitoring** | Detect suspicious patterns | Automated monitoring systems |
| **SAR Filing** | Suspicious Activity Reports | File within 30 days of detection |
| **CTR Filing** | Currency Transaction Reports | Cash transactions >$10,000 |
| **Record Keeping** | 5-year retention | All transaction records |

### SAR Triggers

A SAR must be filed when:
1. Transaction involves $5,000+ AND
2. Institution knows/suspects/has reason to suspect:
   - Funds from illegal activity
   - Transaction designed to evade reporting
   - No lawful purpose detected
   - Facilitating criminal activity

### Red Flags for Money Laundering

```
WATCH FOR:
├── Unusual transaction patterns (structuring)
├── Rapid movement of funds (in/out same day)
├── Transactions inconsistent with business type
├── Multiple accounts with same beneficial owner
├── Reluctance to provide business information
└── Transactions with high-risk jurisdictions
```

---

## 4. OFAC (Office of Foreign Assets Control)

### What It Is
Treasury Department office that administers economic sanctions programs.

### Key Requirements

| Requirement | Description | PayStand Action |
|-------------|-------------|-----------------|
| **SDN Screening** | Screen against Specially Designated Nationals list | All parties screened |
| **Country Sanctions** | Block transactions to/from sanctioned countries | Geolocation checks |
| **Sectoral Sanctions** | Restrictions on specific industries | Industry verification |

### Sanctioned Jurisdictions (Examples)
- Cuba
- Iran
- North Korea
- Syria
- Crimea region
- *List changes frequently - must be current*

### Violation Penalties
- Civil: Up to $311,562 per violation
- Criminal: Up to $1,000,000 and 20 years imprisonment

---

## 5. Money Transmission Laws (State MTLs)

### What It Is
State-level licensing requirements for entities that transmit money.

### PayStand Status
PayStand holds money transmission licenses in required states and partners with licensed entities where necessary.

### Key Considerations

| Consideration | Description |
|---------------|-------------|
| **License Required** | Most states require MTL for money movement |
| **Exemptions** | Some activities exempt (agent of payee, bank partnership) |
| **Bonding** | Surety bonds required ($25K - $500K+) |
| **Net Worth** | Minimum net worth requirements |
| **Examination** | Subject to state examination |

### State Variations
Each state has unique requirements. California (DFPI), New York (DFS), and Texas (TDSML) are particularly stringent.

---

## 6. SOX (Sarbanes-Oxley)

### What It Is
Federal law establishing audit and financial regulations for public companies and their service providers.

### Relevance to PayStand
As a B2B platform serving public companies, PayStand must support customers' SOX compliance.

### Key Requirements

| Requirement | Description | PayStand Support |
|-------------|-------------|------------------|
| **Internal Controls** | Document and test controls | Audit trail for all transactions |
| **Data Integrity** | Accurate financial records | Immutable ledger entries |
| **Access Controls** | Appropriate authorization | Role-based access |
| **Change Management** | Documented changes | Version control, approvals |

---

## 7. Accounting Standards (GAAP/IFRS)

### What It Is
Generally Accepted Accounting Principles (US) and International Financial Reporting Standards.

### Double-Entry Bookkeeping (Sacred Principle)

```
THE ACCOUNTING EQUATION
───────────────────────
Assets = Liabilities + Equity

For every transaction:
Total Debits MUST EQUAL Total Credits

VIOLATION = LEDGER CORRUPTION
```

### Revenue Recognition (ASC 606)
- Revenue recognized when performance obligation satisfied
- Critical for SaaS subscription timing
- Affects when fees can be recorded

### PayStand Ledger Implications
1. Every ledger entry must have offsetting entry
2. Corrections create new entries (never delete)
3. Timestamps are immutable
4. Audit trail must be complete

---

## 8. Wire Transfer Regulations

### Regulation J (Federal Reserve)
Governs Fedwire transfers.

### Key Requirements

| Requirement | Description |
|-------------|-------------|
| **Finality** | Wire transfers are final (no chargebacks) |
| **Speed** | Same-day settlement |
| **Authentication** | Strong authentication required |
| **Record Keeping** | 5-year retention |

### SWIFT (International)
- Used for international wire transfers
- Subject to OFAC screening
- Additional documentation requirements

---

## 9. Check 21 (Check Clearing for the 21st Century Act)

### What It Is
Allows electronic processing of checks via substitute checks (images).

### Key Provisions

| Provision | Description | PayStand (Smart Lockbox) |
|-----------|-------------|-------------------------|
| **Substitute Checks** | Digital images legally equivalent to paper | Core of Smart Lockbox |
| **Expedited Recredit** | Consumer dispute rights | Must support dispute process |
| **Indemnity** | Liability for improper images | Quality control required |

---

## 10. RTP (Real-Time Payments) Rules

### What It Is
The Clearing House's real-time payment network rules.

### Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Finality** | Payments are final and irrevocable |
| **Speed** | Seconds, not days |
| **Availability** | 24/7/365 |
| **Amount Limits** | Currently $1M per transaction |

---

## Compliance Hierarchy

When regulations conflict, apply this hierarchy:

```
COMPLIANCE PRIORITY
───────────────────
1. Criminal Law (BSA/AML, OFAC)     ← Imprisonment risk
2. PCI-DSS                          ← Business survival risk
3. State MTL Requirements           ← Operating license risk
4. NACHA Rules                      ← Network access risk
5. SOX/Accounting Standards         ← Customer trust risk
6. Internal Policies                ← Operational consistency
```

---

## Committee Obligations by Lineage

| Lineage | Primary Regulatory Focus |
|---------|-------------------------|
| **Gaia** | Data integrity, system controls |
| **Tartarus** | ALL regulations (security focus) |
| **Eros** | PCI-DSS (user-facing), accessibility |
| **Nyx** | Monitoring, incident response, audit trails |
| **Erebus** | BSA/AML, GAAP, SOX, double-entry |

---

## Quick Reference: When to Escalate

| Situation | Escalate To | Urgency |
|-----------|-------------|---------|
| Suspected fraud | Legal Critic + Fraud Specialist | IMMEDIATE |
| SAR trigger detected | Compliance + Legal | Within 24 hours |
| PCI data exposure | Security + Legal + Executive | IMMEDIATE |
| OFAC match | Compliance + Legal | IMMEDIATE (freeze funds) |
| R10/R29 ACH return | Fraud Specialist + Legal | Within 24 hours |

---

*"The law is not the enemy of innovation—it is the foundation upon which trust is built."*
