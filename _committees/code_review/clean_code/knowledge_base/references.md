# Authoritative References

> **Purpose**: External sources that inform committee decisions  
> **Last Updated**: 2026-02-04

---

## Primary Sources

### Clean Code (Book)

| | |
|-|-|
| **Title** | Clean Code: A Handbook of Agile Software Craftsmanship |
| **Author** | Robert C. Martin |
| **Year** | 2008 |
| **ISBN** | 978-0132350884 |

The foundational text for this committee. Key chapters:
- Chapter 2: Meaningful Names
- Chapter 3: Functions
- Chapter 7: Error Handling
- Chapter 9: Unit Tests
- Chapter 10: Classes
- Chapter 17: Smells and Heuristics

---

## Elixir Style Guides

### Community Elixir Style Guide (Primary)

| | |
|-|-|
| **URL** | https://github.com/christopheradams/elixir_style_guide |
| **Stars** | 4.4k+ |
| **Status** | Actively maintained |

The most widely adopted community-driven Elixir style guide. Covers:
- Source code layout
- Syntax conventions
- Naming conventions
- Comments and documentation
- Modules and typespecs
- Structs and exceptions
- Collections and strings
- Metaprogramming and testing

### Lexmag Elixir Style Guide (Alternative)

| | |
|-|-|
| **URL** | https://github.com/lexmag/elixir-style-guide |
| **Stars** | 500+ |
| **Status** | Actively maintained |

An opinionated alternative covering:
- Linting
- Naming
- Modules
- ExUnit testing
- Formatting

### Elixir Official Anti-Patterns

| | |
|-|-|
| **URL** | https://hexdocs.pm/elixir/code-anti-patterns.html |
| **Source** | Official Elixir documentation |

Official guidance on code-related anti-patterns including:
- Over-commenting
- Complex error handling in `with` expressions
- Code organization issues

---

## JavaScript/TypeScript Style Guides

### Airbnb JavaScript Style Guide (Primary)

| | |
|-|-|
| **URL** | https://github.com/airbnb/javascript |
| **Website** | https://airbnb.io/javascript/ |
| **Stars** | 140k+ |
| **Status** | Industry standard |

The most widely adopted JavaScript style guide. Covers 39 topics:
- Types and references
- Objects and arrays
- Destructuring
- Functions and arrow functions
- Classes and modules
- Iterators and generators
- Properties and variables
- Comparison and blocks
- Comments and whitespace
- Naming conventions
- Testing

**Tooling**: `eslint-config-airbnb`, `eslint-config-airbnb-base`

### Google TypeScript Style Guide

| | |
|-|-|
| **URL** | https://google.github.io/styleguide/tsguide.html |
| **Tool** | https://github.com/google/gts |
| **Source** | Google |

Google's internal TypeScript standards covering:
- File structure
- Imports organization
- TypeScript-specific practices
- Naming conventions

### TypeScript Community Style Guide

| | |
|-|-|
| **URL** | https://ts.dev/style/ |
| **Status** | Community-maintained |

Builds on Google's guide with community-focused rules:
- Naming conventions (UpperCamelCase, lowerCamelCase, CONSTANT_CASE)
- File organization
- Type usage best practices

---

## Clean Code Checklists

### Clean Code Developer Checklist

| | |
|-|-|
| **URL** | https://github.com/dev-aritra/clean-code-developer-checklist |
| **Stars** | 100+ |

Practical checklist derived from Clean Code book:
- Naming things
- Functions
- Formatting
- Error handling

### Clean Code Heuristics

| | |
|-|-|
| **URL** | https://github.com/DanWareing/clean_code_heuristics |
| **Source** | Chapter 17 of Clean Code |

Code smells and heuristics including:
- Comments smells
- Environment smells
- Function smells
- General smells
- Name smells
- Test smells

### Clean Code Summary (Gist)

| | |
|-|-|
| **URL** | https://gist.github.com/evaera/fee751d4e228dd262fe1174ba142a719 |
| **Format** | Markdown summary |

Concise summary of Clean Code principles for quick reference.

---

## How Members Use These References

### 💜 Specialist: Elixir Idioms
- Primary: christopheradams/elixir_style_guide
- Secondary: Elixir official anti-patterns
- For Phoenix: Phoenix guides and conventions

### 💛 Specialist: JavaScript Idioms
- Primary: Airbnb JavaScript Style Guide
- TypeScript: Google TypeScript Style Guide
- React: React documentation best practices

### Universal Reviewers
- Primary: Clean Code book principles
- Checklists: Clean Code Developer Checklist
- Smells: Clean Code Heuristics

### ⚖️ Critic: Pragmatism
- Uses all references to judge if suggestions are backed by authority
- Challenges suggestions not grounded in these sources

### 🔗 Critic: Consistency
- Uses references to distinguish "team convention" from "industry standard"
- Helps decide when to adopt new patterns

---

## Updating References

When adding new references:
1. Verify the source is authoritative (stars, adoption, maintenance)
2. Add to appropriate section
3. Note which members should use it
4. Update member files if needed

---

## Quick Links

### Elixir
- Style Guide: https://github.com/christopheradams/elixir_style_guide
- Anti-patterns: https://hexdocs.pm/elixir/code-anti-patterns.html
- Formatter: Built into Elixir 1.6+

### JavaScript/TypeScript
- Airbnb: https://airbnb.io/javascript/
- Google TS: https://google.github.io/styleguide/tsguide.html
- ESLint: https://eslint.org/
- Prettier: https://prettier.io/

### Clean Code
- Book: ISBN 978-0132350884
- Checklist: https://github.com/dev-aritra/clean-code-developer-checklist
- Heuristics: https://github.com/DanWareing/clean_code_heuristics

---

*"Standing on the shoulders of giants."*
