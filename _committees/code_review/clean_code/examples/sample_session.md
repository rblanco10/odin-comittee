# Sample Session: Human-Controlled Review with New Flow

> This example demonstrates the Clean Code Review Committee with:
> - **Two-step intake** (what to review, what to focus on)
> - **Finding IDs** (CC-001, CC-002, etc.)
> - **Member verdicts** (✅ PASS, ⚠️ CONDITIONAL, etc.)
> - **Structured checkpoints** with options
> - **Wave organization** for large reviews

---

## Session Start

```
Human: /clean-code-review
```

---

## Step 1: What Type of Review?

```
[CLEAN CODE COMMITTEE - NEW SESSION]

[Switching to 🎯 Moderator persona]

**🎯 Leadership: Moderator**:

Good morning. The Clean Code Review Committee is ready to convene.

What would you like to review?

1. **A specific file or function** — Deep dive on one piece of code
2. **A module or directory** — Review a related set of files
3. **A code change (PR/diff)** — Review proposed changes
4. **A specific concern** — Focus on one area (naming, errors, complexity, etc.)
5. **Architecture review** — Module boundaries and structure
6. **Prior finding revisit** — Re-examine a previous committee decision

Please select (1-6) or describe what you'd like reviewed:
___
```

```
Human: 1 - I want to review the api.ts file in my project
```

---

## Step 2: What Aspect to Focus On?

```
**🎯 Leadership: Moderator**:

You've selected: **A specific file** — `api.ts`

What aspect should the committee focus on?

1. **Full implementation audit** — All reviewers examine all aspects
2. **Naming & readability only** — 🏷️ Naming + Critics
3. **Complexity & structure only** — 📐 Complexity + Critics
4. **Error handling & edge cases** — 🚨 Errors + 🧪 Tests + Critics
5. **Language idioms** — 💛 JS/TS specialist focus
6. **Quick sanity check** — 🏷️ Naming + 📐 Complexity only (fast)
7. **Custom focus** — Tell me what concerns you

Please select (1-7):
___
```

```
Human: 4 - I'm worried about error handling
```

---

## Step 3: Prepare Materials

```
[CLEAN CODE COMMITTEE - PREPARING SESSION]

**🎯 Leadership: Moderator**:

Preparing materials for the committee...

**Session ID**: CC-2026-02-04-001
**Target**: src/api.ts
**Language**: TypeScript
**Focus**: Error handling & edge cases
**Scope**: 1 file, ~150 lines

**Recommended Reviewers**:
| Member | Reason |
|--------|--------|
| 🔍 Code Researcher | Initial analysis |
| 🚨 Error Handling | Primary focus area |
| 🧪 Test Quality | Error path coverage |
| 💛 JavaScript Idioms | Async error patterns |
| ⚖️ Pragmatism Critic | Value assessment |
| 🔗 Consistency Critic | Pattern consistency |

**Skipping** (not relevant to focus):
- 🏷️ Naming (not focus area)
- 📐 Complexity (not focus area)
- 🏗️ Architecture (single file)
- 🔄 Duplication (single file)

**Materials Status**: ✅ Ready

---

Shall I convene the committee?

**Options**:
- `continue` — Begin the review
- `add naming` — Add 🏷️ Naming reviewer
- `full audit` — Switch to full audit (all reviewers)
- `change focus` — Select different focus

Your input: ___
```

```
Human: continue
```

---

## Wave 1: Analysis

```
[CLEAN CODE COMMITTEE - SESSION CC-2026-02-04-001]
Status: ACTIVE
Focus: Error Handling & Edge Cases

[Switching to 🔍 Code Researcher persona]

**🔍 Clerical: Code Researcher**:

Thank you, 🎯 Moderator. Let me analyze this file...

*opens api.ts and begins reading*

📄 **File**: src/api.ts
📊 **Statistics**:
- Total lines: 147
- Functions: 6
- Exports: 4 (get, post, ApiError, setAuth)
- Try-catch blocks: 2
- Async functions: 4

📋 **Structure Overview**:
This is an API client module that wraps fetch with:
- Custom error class (ApiError)
- Request abort controller
- Shared authentication state
- JSON response handling

**Key Components**:
| Component | Lines | Purpose |
|-----------|-------|---------|
| `ApiError` class | 8-15 | Custom error with payload |
| `handleApiResponse` | 84-91 | Response processing |
| `get` | 97-112 | GET request wrapper |
| `post` | 114-130 | POST request wrapper |

**Flags for 🚨 Error Handling**:
- Line 84-91: `handleApiResponse` doesn't catch JSON parse errors
- Line 97-112: `get` doesn't wrap fetch in try-catch
- Line 5-6: Global mutable state (abort controller)

**Flags for 🧪 Test Quality**:
- Need to check if error paths are tested

My analysis is complete.

---

[CHECKPOINT — After 🔍 Code Researcher]

**Options**:
1. `continue` — Proceed to 🚨 Error Handling
2. `focus line 84` — Look closer at handleApiResponse
3. `add naming` — Add 🏷️ Naming to reviewers
4. `pause` — Stop for discussion

Your input: ___
```

```
Human: continue
```

---

## Wave 2: Primary Review

```
[Switching to 🚨 Error Handling persona]

**🚨 Universal: Error Handling**:

Thank you, 🔍 Code Researcher. You flagged `handleApiResponse`—that's exactly where I want to look.

*puts on detective hat*

I'm going to trace the failure paths through this code. My questions are:
- What happens when things go wrong?
- Does the caller know what failed?
- Can we debug this at 3am with just the error message?

Let me start with the response handling...

---

**FINDING CC-001** [MUST FIX] — api.ts:84-91

| Field | Value |
|-------|-------|
| **Issue** | `handleApiResponse` doesn't catch JSON parse errors |
| **Impact** | Callers get cryptic `SyntaxError` with no context |
| **Suggestion** | Wrap `response.json()` in try-catch, throw `ApiError` with context |
| **Principle** | Clean Code: Error Handling - Provide Context |

**Current Code**:
```typescript
async function handleApiResponse(response: Response) {
  const payload = await response.json()  // Can throw SyntaxError!
  if (!response.ok) {
    throw new ApiError(payload.error, payload)
  }
  return payload
}
```

**Problem**: If the server returns invalid JSON (like an HTML error page), `response.json()` throws a `SyntaxError` with "Unexpected token < in JSON at position 0". The caller has no idea what URL failed or what the response was.

**Suggested Fix**:
```typescript
async function handleApiResponse(response: Response) {
  let payload
  try {
    payload = await response.json()
  } catch (e) {
    const text = await response.text()
    throw new ApiError(`Failed to parse JSON: ${text.slice(0, 100)}`, { 
      parseError: e, 
      status: response.status 
    })
  }
  if (!response.ok) {
    throw new ApiError(payload.error, payload)
  }
  return payload
}
```

**Why This Matters**: Imagine debugging at 3am: "SyntaxError: Unexpected token" tells you nothing. "ApiError: Failed to parse JSON from /api/stats - received HTML" tells you everything.

---

**FINDING CC-002** [SHOULD FIX] — api.ts:97-112

| Field | Value |
|-------|-------|
| **Issue** | `get` function doesn't wrap fetch in try-catch |
| **Impact** | Network errors propagate as raw `TypeError` |
| **Suggestion** | Wrap fetch, add URL context to errors |
| **Principle** | Clean Code: Error Handling - Don't Return Null |

**Current Code**:
```typescript
export async function get(url: string, query?: DashboardQuery) {
  const response = await fetch(url, { signal: abortController.signal })
  return handleApiResponse(response)
}
```

**Problem**: If fetch throws (network error, CORS, abort), the caller gets a raw `TypeError` with no context about what URL was being fetched.

---

**FINDING CC-003** [NICE TO HAVE] — api.ts:5-6

| Field | Value |
|-------|-------|
| **Issue** | Global mutable state for abort controller |
| **Impact** | Potential race conditions, hard to test |
| **Suggestion** | Consider passing abort signal as parameter |
| **Principle** | Clean Code: Avoid Side Effects |

---

**Error Handling Verdict**: 🛑 FAIL

| Severity | Count |
|----------|-------|
| Must Fix | 1 |
| Should Fix | 1 |
| Nice to Have | 1 |

**Summary**: The JSON parse error (CC-001) is a critical gap—users will get cryptic errors when servers misbehave. The network error handling (CC-002) is also important for debuggability.

**Handoff**: → 🧪 Test Quality (I want to know if these error paths are tested)

---

[CHECKPOINT — After 🚨 Error Handling]

**Findings so far**: 3
| ID | Severity | Location | Issue |
|----|----------|----------|-------|
| CC-001 | MUST FIX | api.ts:84 | JSON parse unhandled |
| CC-002 | SHOULD FIX | api.ts:97 | Network errors no context |
| CC-003 | NICE TO HAVE | api.ts:5 | Global mutable state |

**Verdicts**:
| Member | Verdict |
|--------|---------|
| 🔍 Researcher | — |
| 🚨 Errors | 🛑 FAIL |

**Options**:
1. `continue` — Proceed to 🧪 Test Quality
2. `focus CC-001` — Deep dive on JSON parse issue
3. `skip tests` — Skip to 💛 JavaScript Idioms
4. `summary` — Show all findings
5. `pause` — Stop for discussion

Your input: ___
```

```
Human: continue
```

---

## Test Quality Review

```
[Switching to 🧪 Test Quality persona]

**🧪 Universal: Test Quality**:

Thanks, 🚨 Error Handling. You found that JSON parse issue—let me check if it's tested.

*opens test directory*

I'm looking at test coverage for error paths. My questions:
- Are the error scenarios covered?
- Do tests verify error messages?
- Is the JSON parse failure tested?

*searching for api.test.ts*

---

**FINDING CC-004** [SHOULD FIX] — Missing test

| Field | Value |
|-------|-------|
| **Issue** | No test for JSON parse failure scenario |
| **Impact** | CC-001 bug won't be caught by tests |
| **Suggestion** | Add test: "should throw ApiError when response is not valid JSON" |
| **Principle** | Clean Code: Tests - Test Edge Cases |

**Missing Test Scenario**:
```typescript
test('should throw ApiError when response is not valid JSON', async () => {
  server.get('/api/test', (req, res) => {
    res.status(502).send('<html>Bad Gateway</html>')
  })
  
  await expect(get('/api/test')).rejects.toThrow(ApiError)
  await expect(get('/api/test')).rejects.toMatchObject({
    message: expect.stringContaining('Failed to parse JSON')
  })
})
```

---

**Test Quality Verdict**: ⚠️ CONDITIONAL PASS

| Severity | Count |
|----------|-------|
| Must Fix | 0 |
| Should Fix | 1 |
| Nice to Have | 0 |

**Summary**: Happy path tests exist, but the error paths identified by 🚨 Error Handling are not covered.

**Handoff**: → 💛 JavaScript Idioms (check async error patterns)

---

[CHECKPOINT — After 🧪 Test Quality]

**Findings so far**: 4
| ID | Severity | Location | Issue |
|----|----------|----------|-------|
| CC-001 | MUST FIX | api.ts:84 | JSON parse unhandled |
| CC-002 | SHOULD FIX | api.ts:97 | Network errors no context |
| CC-003 | NICE TO HAVE | api.ts:5 | Global mutable state |
| CC-004 | SHOULD FIX | tests | Missing error path tests |

**Options**:
1. `continue` — Proceed to 💛 JavaScript Idioms
2. `focus CC-004` — Discuss test strategy
3. `skip to critics` — Jump to ⚖️ Pragmatism
4. `summary` — Show all findings

Your input: ___
```

```
Human: skip to critics
```

---

## Wave 3: Refinement (Critics)

```
**🎯 Leadership: Moderator**:

Skipping 💛 JavaScript Idioms. Proceeding to critics.

---

[Switching to ⚖️ Pragmatism Critic persona]

**⚖️ Critic: Pragmatism**:

*leans back*

Alright, I'm the skeptic. Let me review these findings.

For each one, I'm asking: **Is this worth the effort?**

---

**Review of CC-001** (JSON parse unhandled):

*nods*

No challenge. This is a real bug. When a server returns HTML instead of JSON (which happens with 502s, auth redirects, etc.), users get a cryptic error. This affects real debugging.

**No challenge to CC-001**. Keep as MUST FIX.

---

**Review of CC-002** (Network errors no context):

*tilts head*

This one I want to push back on slightly. 

The current code works—fetch errors do propagate. The suggestion is to wrap them with more context. But:
- How often do network errors actually happen?
- The browser console already shows the URL
- Adding try-catch adds code complexity

**CHALLENGE to CC-002**:

| Field | Value |
|-------|-------|
| **Finding** | CC-002: Add context to network errors |
| **My Question** | Is the extra context worth the code complexity? |
| **Recommendation** | Downgrade to NICE TO HAVE |

---

**Review of CC-003** (Global mutable state):

This is theoretical. The abort controller pattern is common in JavaScript. Unless there's evidence of actual race conditions, I'd remove this.

**CHALLENGE to CC-003**:

| Field | Value |
|-------|-------|
| **Finding** | CC-003: Global mutable state |
| **My Question** | Has this caused actual problems? |
| **Recommendation** | REMOVE (nitpick) |

---

**Review of CC-004** (Missing tests):

If we're fixing CC-001, we should test it. No challenge.

**No challenge to CC-004**.

---

**Pragmatism Verdict**: Reviewed 4 findings

| Finding | Decision |
|---------|----------|
| CC-001 | ✅ Keep as MUST FIX |
| CC-002 | ⚠️ Downgrade to NICE TO HAVE |
| CC-003 | ❌ Remove (nitpick) |
| CC-004 | ✅ Keep as SHOULD FIX |

**Handoff**: → 🔗 Consistency Critic

---

[CHECKPOINT — After ⚖️ Pragmatism]

**Findings (after challenges)**:
| ID | Severity | Status |
|----|----------|--------|
| CC-001 | MUST FIX | ✅ Kept |
| CC-002 | NICE TO HAVE | ⚠️ Downgraded |
| CC-003 | — | ❌ Removed |
| CC-004 | SHOULD FIX | ✅ Kept |

**Options**:
1. `continue` — Proceed to 🔗 Consistency
2. `restore CC-002` — Keep as SHOULD FIX
3. `restore CC-003` — Keep finding
4. `approve` — Accept current findings

Your input: ___
```

```
Human: continue
```

---

## Consistency Critic

```
[Switching to 🔗 Consistency Critic persona]

**🔗 Critic: Consistency**:

Thanks, ⚖️ Pragmatism. Let me check for pattern consistency.

*opens codebase search*

How is error handling done elsewhere in this codebase?

*searching*

---

**Research Results**:

| Pattern | Occurrences | Files |
|---------|-------------|-------|
| Try-catch around JSON | 0 | — |
| Raw fetch without try-catch | 4 | api.ts, utils.ts |
| Custom error classes | 1 | api.ts (ApiError) |

**Observation**: The codebase consistently does NOT wrap JSON parsing. If we add it to `handleApiResponse`, we'd be introducing a new pattern.

**However**: This is a case where the new pattern is objectively better. Silent JSON parse failures are a real problem.

**No challenge to CC-001**. The improvement is worth the inconsistency.

---

**Consistency Verdict**: No challenges

**Handoff**: → 📝 Review Recorder

---

[CHECKPOINT — Wave 3 Complete]

**Final Findings**:
| ID | Severity | Member | Issue | Status |
|----|----------|--------|-------|--------|
| CC-001 | MUST FIX | 🚨 | JSON parse unhandled | ✅ Open |
| CC-002 | NICE TO HAVE | 🚨 | Network errors | ⚠️ Downgraded |
| CC-004 | SHOULD FIX | 🧪 | Missing error tests | ✅ Open |

**Removed**: CC-003 (nitpick per ⚖️ Pragmatism)

**Options**:
1. `continue` — Proceed to final report
2. `restore CC-003` — Add back the finding
3. `approve` — Accept and close

Your input: ___
```

```
Human: continue
```

---

## Wave 4: Finalization

```
[Switching to 📝 Review Recorder persona]

**📝 Clerical: Review Recorder**:

*opens notebook*

Let me compile the final report...

---

# Clean Code Review Report

**Session ID**: CC-2026-02-04-001
**Target**: src/api.ts
**Focus**: Error Handling & Edge Cases
**Date**: 2026-02-04

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Verdict** | ❌ CONCERNS |
| **Must Fix** | 1 |
| **Should Fix** | 1 |
| **Nice to Have** | 1 |
| **Removed** | 1 |

## All Findings

| ID | Severity | Member | Location | Issue | Status |
|----|----------|--------|----------|-------|--------|
| CC-001 | MUST FIX | 🚨 | api.ts:84 | JSON parse unhandled | Open |
| CC-002 | NICE TO HAVE | 🚨 | api.ts:97 | Network errors no context | Downgraded |
| CC-003 | — | 🚨 | api.ts:5 | Global mutable state | Removed |
| CC-004 | SHOULD FIX | 🧪 | tests | Missing error path tests | Open |

## Member Verdicts

| Member | Verdict |
|--------|---------|
| 🚨 Error Handling | 🛑 FAIL |
| 🧪 Test Quality | ⚠️ CONDITIONAL |
| ⚖️ Pragmatism | 2 challenged |
| 🔗 Consistency | 0 challenged |

## Recommendations

**Priority 1 (MUST FIX)**:
- **CC-001**: Add try-catch around `response.json()` in `handleApiResponse`

**Priority 2 (SHOULD FIX)**:
- **CC-004**: Add test for JSON parse failure scenario

**Priority 3 (NICE TO HAVE)**:
- **CC-002**: Consider adding URL context to network errors

---

The report is ready.

---

[Switching to 📏 Standards Keeper persona]

**📏 Leadership: Standards Keeper**:

*adjusts glasses*

Let me validate this report against our standards...

| Criterion | Status |
|-----------|--------|
| All findings have IDs | ✅ |
| All findings have severity | ✅ |
| All findings explain impact | ✅ |
| All findings have suggestions | ✅ |
| No nitpicks remain | ✅ |
| Challenges documented | ✅ |

✅ **Report meets all quality standards.**

---

[FINAL CHECKPOINT]

**Session**: CC-2026-02-04-001
**Verdict**: ❌ CONCERNS (1 Must Fix)

**Options**:
1. `approve` — Accept report and close session
2. `focus CC-001` — Review the must-fix in detail
3. `export` — Generate markdown file
4. `end` — Close without approval

Your input: ___
```

```
Human: approve
```

---

## Session Closing

```
[Switching to 🎯 Moderator persona]

**🎯 Leadership: Moderator**:

*stands*

The Human Director has approved the report.

---

**Session CC-2026-02-04-001 — CLOSED**

**Summary**:
- 1 Must Fix issue identified (JSON parse error handling)
- 1 Should Fix issue identified (missing tests)
- 1 Nice to Have suggestion
- 1 finding removed as nitpick

**Key Action Item**:
Add try-catch around `response.json()` in `handleApiResponse` to provide meaningful error messages when servers return non-JSON responses.

**Report saved to**: `sessions/CC-2026-02-04-001/report.md`

---

Thank you to all committee members who participated:
- 🔍 Code Researcher — Clear initial analysis
- 🚨 Error Handling — Found the critical JSON parse gap
- 🧪 Test Quality — Identified missing test coverage
- ⚖️ Pragmatism — Good challenges, kept us focused
- 🔗 Consistency — Confirmed the fix is worth the pattern change

*gavels*

Session adjourned.
```

---

## Session Metadata

| Field | Value |
|-------|-------|
| **Session ID** | CC-2026-02-04-001 |
| **Duration** | ~15 minutes |
| **Focus** | Error Handling & Edge Cases |
| **Members Active** | 6 (focused review) |
| **Findings** | 3 final (1 removed) |
| **Challenges** | 2 (1 downgrade, 1 removal) |
| **Verdict** | ❌ CONCERNS |
| **Approved** | Yes |
