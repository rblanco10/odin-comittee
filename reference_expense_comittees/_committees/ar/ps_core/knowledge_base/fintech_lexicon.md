# The Fintech Lexicon

> **Keeper**: Khaos  
> **Purpose**: Domain Terminology and Concepts  
> **Authority**: Language reference for all committees

---

## Preamble

*"To architect a domain, one must first speak its language. These are the words of finance and technology, woven together."*

This document defines the terminology used across PayStand and the fintech industry.

---

## 1. Payment Terminology

### Transaction States

| Term | Definition | PayStand State |
|------|------------|----------------|
| **Created** | Transaction initiated, not yet processing | `created` |
| **Processing** | In transit, awaiting bank confirmation | `processing` |
| **Posted** | Confirmed by bank, funds reserved | `posted` |
| **Paid** | Funds fully settled | `paid` |
| **Failed** | Transaction rejected | `failed` |
| **Voided** | Cancelled before settlement | `voided` |
| **Refunded** | Funds returned to payer | `refunded` |

### Payment Methods

| Term | Definition | Fee Model |
|------|------------|-----------|
| **ACH** | Automated Clearing House - electronic bank transfer | Low/Zero fee |
| **eCheck** | Electronic check, processed via ACH | Low/Zero fee |
| **Wire** | Direct bank-to-bank transfer | Higher fee, instant |
| **RTP** | Real-Time Payments - instant bank transfer | Moderate fee |
| **Credit Card** | Visa, Mastercard, Amex network | Highest fee (2-3%) |
| **Debit Card** | Card linked directly to bank account | Moderate fee |

### Payment Actors

| Term | Definition |
|------|------------|
| **Payer** | The party sending money |
| **Payee** | The party receiving money |
| **Merchant** | Business accepting payments |
| **Acquirer** | Bank processing for merchant |
| **Issuer** | Bank that issued payer's card/account |
| **Processor** | Entity handling transaction routing |

---

## 2. Ledger Terminology

### Accounting Fundamentals

| Term | Definition |
|------|------------|
| **Debit** | Left side of T-account; increases assets, decreases liabilities |
| **Credit** | Right side of T-account; decreases assets, increases liabilities |
| **Double-Entry** | Every transaction affects at least two accounts equally |
| **Journal Entry** | Record of a single accounting transaction |
| **General Ledger** | Master record of all financial transactions |
| **Trial Balance** | Sum of all debits must equal sum of all credits |

### PayStand Ledger Accounts

| Account | Type | Purpose |
|---------|------|---------|
| **PsCash** | Asset | Funds held by PayStand |
| **PsCashHold** | Asset (Reserved) | Funds on hold (disputes, processing) |
| **PsCashCPI** | Asset | Card Processing Interface funds |
| **AccountsReceivable** | Asset | Money owed to merchant |
| **AccountsPayable** | Liability | Money owed by merchant |
| **Revenue** | Income | Fees earned by PayStand |
| **Escrow** | Liability | Funds held for third parties |

### Ledger Flows

| Flow | Description |
|------|-------------|
| **CreatedToProcessing** | Payment initiated → sent to bank |
| **ProcessingToPosted** | Bank confirms → funds reserved |
| **PostedToPaid** | Settlement complete → funds released |
| **RefundFlow** | Funds returned to payer |
| **ChargebackFlow** | Disputed transaction reversed |

---

## 3. Banking Terminology

### Account Types

| Term | Definition |
|------|------------|
| **DDA** | Demand Deposit Account (checking) |
| **Savings** | Interest-bearing deposit account |
| **FBO** | For Benefit Of - custodial account |
| **Omnibus** | Single account holding funds for multiple parties |
| **Trust Account** | Fiduciary account with legal obligations |

### Transfer Types

| Term | Definition | Speed |
|------|------------|-------|
| **ACH Credit** | Push funds to recipient | 1-3 days |
| **ACH Debit** | Pull funds from account | 1-3 days |
| **Same-Day ACH** | Expedited ACH processing | Same day |
| **Wire Transfer** | Immediate bank-to-bank | Minutes |
| **FedWire** | Federal Reserve wire system | Minutes |

### Banking Codes

| Code Type | Example | Meaning |
|-----------|---------|---------|
| **Routing Number** | 121000358 | Bank identifier (ABA) |
| **Account Number** | 123456789 | Individual account |
| **SWIFT/BIC** | CHASUS33 | International bank code |
| **IBAN** | DE89370400440532013000 | International account number |

---

## 4. Compliance Terminology

### Identity Verification

| Term | Definition |
|------|------------|
| **KYC** | Know Your Customer - individual verification |
| **KYB** | Know Your Business - company verification |
| **CIP** | Customer Identification Program |
| **EDD** | Enhanced Due Diligence - high-risk customers |
| **PEP** | Politically Exposed Person |
| **Beneficial Owner** | Person with 25%+ ownership |

### Anti-Money Laundering

| Term | Definition |
|------|------------|
| **AML** | Anti-Money Laundering program |
| **SAR** | Suspicious Activity Report |
| **CTR** | Currency Transaction Report (>$10K cash) |
| **Structuring** | Breaking transactions to avoid reporting |
| **Layering** | Moving money to obscure origin |
| **Integration** | Introducing laundered funds into economy |

### Sanctions

| Term | Definition |
|------|------------|
| **OFAC** | Office of Foreign Assets Control |
| **SDN** | Specially Designated Nationals list |
| **Sanctions Screening** | Checking parties against banned lists |
| **CAPTA** | Combating American Trafficking in Persons Act |

---

## 5. B2B Finance Terminology

### Accounts Receivable (AR)

| Term | Definition |
|------|------------|
| **Invoice** | Bill requesting payment |
| **Net Terms** | Payment due X days after invoice (Net 30, Net 60) |
| **DSO** | Days Sales Outstanding - avg collection time |
| **Aging Report** | Invoice breakdown by days overdue |
| **Dunning** | Process of pursuing payment |
| **Write-off** | Declaring debt uncollectible |

### Accounts Payable (AP)

| Term | Definition |
|------|------------|
| **PO** | Purchase Order - formal buying request |
| **3-Way Match** | PO + Receipt + Invoice must match |
| **Early Payment Discount** | e.g., "2/10 Net 30" = 2% off if paid in 10 days |
| **DPO** | Days Payable Outstanding - avg payment time |

### ERP Integration

| Term | Definition |
|------|------------|
| **ERP** | Enterprise Resource Planning system |
| **GL Sync** | General Ledger synchronization |
| **Reconciliation** | Matching records between systems |
| **Auto-Apply** | Automatic payment-to-invoice matching |
| **Bank Feed** | Automated bank transaction import |

---

## 6. Blockchain Terminology

### Core Concepts

| Term | Definition |
|------|------------|
| **Blockchain** | Distributed, immutable ledger |
| **Hash** | Cryptographic fingerprint of data |
| **Immutability** | Cannot be altered after recording |
| **Consensus** | Agreement mechanism for distributed systems |
| **Smart Contract** | Self-executing code on blockchain |

### PayStand Blockchain Use

| Application | Purpose |
|-------------|---------|
| **Transaction Hashing** | Every payment gets blockchain receipt |
| **Audit Trail** | Immutable proof of transaction |
| **Verification** | Third-party can verify without PayStand |
| **Timestamp Proof** | Cryptographic proof of when event occurred |

---

## 7. Risk & Fraud Terminology

### Fraud Types

| Term | Definition |
|------|------------|
| **CNP Fraud** | Card Not Present - online fraud |
| **ATO** | Account Takeover |
| **BEC** | Business Email Compromise |
| **ACH Fraud** | Unauthorized bank transfers |
| **Check Fraud** | Forged or altered checks |
| **Friendly Fraud** | Legitimate customer disputes valid charge |

### Dispute Types

| Term | Definition |
|------|------------|
| **Chargeback** | Card network reversal |
| **ACH Return** | Bank rejects/reverses ACH |
| **Void** | Cancel before settlement |
| **Refund** | Merchant-initiated return |
| **Representment** | Fighting a chargeback |

### Risk Signals

| Term | Definition |
|------|------------|
| **Velocity** | Transaction frequency patterns |
| **AVS** | Address Verification Service |
| **CVV** | Card Verification Value |
| **3DS** | 3D Secure - cardholder authentication |
| **Device Fingerprint** | Unique device identifier |

---

## 8. SaaS & Platform Terminology

### Subscription Concepts

| Term | Definition |
|------|------------|
| **MRR** | Monthly Recurring Revenue |
| **ARR** | Annual Recurring Revenue |
| **Churn** | Customer/revenue loss rate |
| **NRR** | Net Revenue Retention |
| **CAC** | Customer Acquisition Cost |
| **LTV** | Lifetime Value |

### Platform Terminology

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface |
| **Webhook** | Event notification callback |
| **OAuth** | Authorization protocol |
| **SDK** | Software Development Kit |
| **Sandbox** | Test environment |

---

## 9. PayStand-Specific Terms

### Products

| Term | Definition |
|------|------------|
| **Bank Network** | PayStand's zero-fee bank transfer network |
| **Smart Lockbox** | Digital check processing |
| **Payment Portal** | Customer-facing payment page |
| **DeFi Cards** | Corporate cards with yield |

### Internal Concepts

| Term | Definition |
|------|------------|
| **Organization** | Top-level PayStand customer entity |
| **Merchant** | Business accepting payments |
| **Contact** | Payer or payee record |
| **Fund** | Merchant's fund account |
| **Balance Account** | Internal ledger account |

---

## 10. Acronym Quick Reference

| Acronym | Full Form |
|---------|-----------|
| ACH | Automated Clearing House |
| AML | Anti-Money Laundering |
| AP | Accounts Payable |
| AR | Accounts Receivable |
| BSA | Bank Secrecy Act |
| CIP | Customer Identification Program |
| CTR | Currency Transaction Report |
| DDA | Demand Deposit Account |
| DSO | Days Sales Outstanding |
| EDD | Enhanced Due Diligence |
| ERP | Enterprise Resource Planning |
| GAAP | Generally Accepted Accounting Principles |
| GL | General Ledger |
| IFRS | International Financial Reporting Standards |
| KYB | Know Your Business |
| KYC | Know Your Customer |
| MTL | Money Transmitter License |
| NACHA | National Automated Clearing House Association |
| OFAC | Office of Foreign Assets Control |
| PCI-DSS | Payment Card Industry Data Security Standard |
| PO | Purchase Order |
| RTP | Real-Time Payments |
| SAR | Suspicious Activity Report |
| SDN | Specially Designated Nationals |
| SOX | Sarbanes-Oxley Act |
| SWIFT | Society for Worldwide Interbank Financial Telecommunication |

---

*"Master the language, and you master the domain."*
