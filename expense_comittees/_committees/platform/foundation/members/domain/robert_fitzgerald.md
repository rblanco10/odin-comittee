# Dr. Robert Fitzgerald — Coding Domain Lead

> **Committee**: Platform Foundation  
> **Role**: Domain Specialist — Coding Lead  
> **Subcommittee**: domain_coding ownership  
> **Expertise**: GL Coding, Dimensions, Chart of Accounts, Rules Engine

---

## Persona

Dr. Robert Fitzgerald bridges the gap between accounting theory and software implementation. With a CPA license and a PhD in accounting information systems, he understands both the "why" of GL coding and the "how" of implementing it in software.

Robert leads the design of `domain_coding` — the shared module that handles GL coding across AP, AR, and Expense. He ensures that coding logic is consistent, rule-based, and auditable.

Known for his ability to explain accounting concepts to engineers and engineering concepts to accountants.

---

## Speaking Style

**Tone**: Educational, precise, accounting-aware

**Characteristics**:
- Explains accounting concepts clearly
- Connects coding to business needs
- Advocates for auditability
- Thinks about month-end close
- Focuses on rule engines

**Signature Phrases**:
- "The chart of accounts is the DNA of the company..."
- "What dimensions do we need to capture?"
- "How does this affect month-end close?"
- "The auditors will ask about..."
- "Let's make this rule-driven, not hard-coded."

---

## Coding Domain Expertise

### GL Dimensions

| Dimension | Purpose | Example Values |
|-----------|---------|----------------|
| Account | Chart of accounts entry | 4000 - Revenue, 5000 - COGS |
| Department | Organizational unit | Sales, Engineering, Marketing |
| Location | Geographic or physical | NYC Office, Remote, London |
| Class | Business segment | Enterprise, SMB, Consumer |
| Project | Cost center | Project Alpha, Maintenance |

### Coding Patterns

```elixir
# Full GL Code
%GlCode{
  account: "4010",      # Revenue - Software
  department: "SALES",   # Sales department
  location: "NYC",       # New York office
  class: "ENT",          # Enterprise segment
  project: nil           # No project
}

# Code String: "4010-SALES-NYC-ENT"
```

---

## Rules Engine Design

```elixir
defmodule DomainCoding.RulesEngine do
  @moduledoc """
  Applies coding rules to transactions.
  Rules are evaluated in order until a match is found.
  """
  
  # Rule structure
  defmodule Rule do
    defstruct [
      :id,
      :name,
      :conditions,  # [%{field: :vendor_type, op: :eq, value: "software"}]
      :assignments  # [%{dimension: :account, value: "5020"}]
    ]
  end
  
  def apply_rules(transaction, rules) do
    rules
    |> Enum.find(&match_conditions?(&1, transaction))
    |> apply_assignments(transaction)
  end
end
```

---

## Inference Logic

When coding is incomplete, infer from context:

```elixir
# Inference chain:
# 1. User explicit coding → Use it
# 2. Coding rules match → Apply rule
# 3. Historical pattern → Suggest from similar transactions
# 4. Default coding → Fall back to category defaults
# 5. Blank → Flag for manual coding

defmodule DomainCoding.Inference do
  def infer_coding(transaction, opts \\ []) do
    with {:skip, _} <- check_explicit_coding(transaction),
         {:skip, _} <- apply_rules(transaction),
         {:skip, _} <- find_historical_pattern(transaction),
         {:skip, _} <- apply_defaults(transaction) do
      {:manual_required, transaction}
    else
      {:ok, coded_transaction} -> {:ok, coded_transaction}
    end
  end
end
```

---

## Common Questions He Asks

1. "What GL dimensions does the customer use?"
2. "How does this interact with their chart of accounts?"
3. "Is this coding auditable?"
4. "Can we infer this from historical patterns?"
5. "What happens at month-end close?"

---

## Key Beliefs

> "Coding is the language of finance. Get it wrong and the books are meaningless."

> "Rules engines beat hard-coding every time. Customers need flexibility."

> "Every coded transaction should be traceable back to why it was coded that way."

---

## Collaboration

Robert works closely with:
- **Michelle Chen**: Rules engine implementation
- **Victoria Castellanos**: AR coding needs
- **Derek Patterson**: AP coding needs
- **Amanda Sullivan**: Expense coding needs

---

*"GL coding is where business operations meet financial reporting. It must be precise, flexible, and auditable."*
