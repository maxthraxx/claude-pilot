---
description: "Spec implementation phase - TDD loop for each task in the plan"
argument-hint: "<path/to/plan.md>"
user-invocable: false
model: opus
---
# /spec-implement - Implementation Phase

**Phase 2 of the /spec workflow.** Reads the approved plan and implements each task using TDD (Red → Green → Refactor).

**Input:** Path to an approved plan file (`Approved: Yes`)
**Output:** All plan tasks completed, status set to COMPLETE
**Next phase:** On completion → `Skill(skill='spec-verify', args='<plan-path>')`

---

## ⛔ KEY CONSTRAINTS (Rules Summary)

| # | Rule |
|---|------|
| 1 | **NO sub-agents during implementation** - Use direct tools only. |
| 2 | **TDD is MANDATORY** - No production code without failing test first |
| 3 | **Update plan checkboxes after EACH task** - Not at the end |
| 4 | **NEVER SKIP TASKS** - Every task MUST be fully implemented |
| 5 | **Quality over speed** - Never rush due to context pressure |
| 6 | **Plan file is source of truth** - Survives session clears |
| 7 | **NEVER assume - verify by reading files** |

---

## Quality Over Speed - CRITICAL

**NEVER rush or compromise quality due to context pressure.**

- Context warnings are informational, not emergencies
- Work spans sessions seamlessly via plan file and continuation mechanisms
- Finish the CURRENT task with full quality, then hand off cleanly
- Do NOT skip tests, compress code, or cut corners to "beat" context limits
- **Quality is the #1 metric** - a well-done task split across sessions beats rushed work

## Feedback Loop Awareness

**This phase may be called multiple times in a feedback loop:**

```
spec-implement → spec-verify → issues found → spec-implement → spec-verify → ... → VERIFIED
```

**When called after verification found issues:**
1. Read the plan - verification will have added fix tasks (marked with `[MISSING]` or similar)
2. Check the `Iterations` field in the plan header
3. **Report iteration start:** "🔄 Starting Iteration N implementation..."
4. Focus on uncompleted tasks `[ ]` - these are the fixes needed
5. Complete all fix tasks, then set status to COMPLETE as normal

---

### Step 2.1: Read Plan & Gather Context

**Before ANY implementation, you MUST:**

1. **Read the COMPLETE plan** - Understanding overall architecture and design
2. **Verify comprehension** - Summarize what you learned to demonstrate understanding
3. **Identify dependencies** - List files, functions, classes that need modification
4. **Check current state:**
   - Git status: `git status --short` and `git diff --name-only`
   - Plan progress: Check for `[x]` completed tasks

#### 🔧 Tools for Implementation

| Tool | When to Use | Example |
|------|-------------|---------|
| **Context7** | Library API lookup | `resolve-library-id(query="how to use fixtures", libraryName="pytest")` then `query-docs(libraryId, query)` |
| **Vexor** | Find similar patterns | `vexor search "query" --mode code` |
| **grep-mcp** | Production code examples | `searchGitHub(query="useEffect cleanup", language=["TypeScript"])` |

---

### Step 2.2: Per-Task TDD Loop

**TDD is MANDATORY. No production code without a failing test first.**

| Requires TDD | Skip TDD |
|--------------|----------|
| New functions/methods | Documentation changes |
| API endpoints | Config file updates |
| Business logic | IaC code (CDK, Terraform, Pulumi) |
| Bug fixes | Formatting/style changes |

**For EVERY task, follow this exact sequence:**

1. **READ PLAN'S IMPLEMENTATION STEPS** - List all files to create/modify/delete
2. **Perform Call Chain Analysis:**
   - **Trace Upwards (Callers):** Identify what calls the code you're modifying
   - **Trace Downwards (Callees):** Identify what the modified code calls
   - **Side Effects:** Check for database, cache, external system impacts
3. **Mark task as in_progress** in TodoWrite
4. **Execute TDD Flow (RED → GREEN → REFACTOR):**
   - Write failing test first, **verify it fails**
   - Implement minimal code to pass
   - Refactor if needed (keep tests green)
5. **Verify tests pass** - `uv run pytest tests/path/to/test.py -q`
6. **Run actual program** - Show real output with sample data
7. **Check diagnostics** - Must be zero errors
8. **Validate Definition of Done** - Check all criteria from plan
9. **Mark task completed** in TodoWrite
10. **UPDATE PLAN FILE IMMEDIATELY** (see Step 2.3)
11. **Check context usage** - Run `~/.pilot/bin/pilot check-context --json`

**⚠️ NEVER SKIP TASKS:**
- EVERY task MUST be fully implemented
- NO exceptions for "MVP scope" or complexity
- If blocked: STOP and report specific blockers
- NEVER mark complete without doing the work

---

### Step 2.3: Update Plan After EACH Task

**⛔ CRITICAL: Task Completion Tracking is MANDATORY**

**After completing EACH task, you MUST:**

1. **IMMEDIATELY edit the plan file** to change `[ ]` to `[x]` for that task
2. **Update the Progress Tracking counts** (Completed/Remaining)
3. **DO NOT proceed to next task** until the checkbox is updated

**This is NON-NEGOTIABLE.**

**Example - After completing Task 5:**
```
Edit the plan file:
- [ ] Task 5: Implement X  →  - [x] Task 5: Implement X
Update counts:
**Completed:** 4 | **Remaining:** 8  →  **Completed:** 5 | **Remaining:** 7
```

---

### Step 2.4: All Tasks Complete → Verification

**⚠️ CRITICAL: Follow these steps exactly:**

1. Quick verification: Check diagnostics and run `uv run pytest -q`
2. **FOR MIGRATIONS ONLY - Feature Parity Check:**
   - Run the NEW code and verify it produces expected output
   - Compare behavior with OLD code (if still available)
   - Check Feature Inventory - every feature should now be implemented
   - If ANY feature is missing: **DO NOT mark complete** - add tasks for missing features
3. **MANDATORY: Update plan status to COMPLETE**
   ```
   Edit the plan file and change the Status line:
   Status: PENDING  →  Status: COMPLETE
   ```
4. **Invoke verification phase:** `Skill(skill='spec-verify', args='<plan-path>')`

---

## ⚠️ Migration/Refactoring Tasks (Phase 2 Additions)

**When the plan involves replacing existing code, perform these ADDITIONAL checks:**

### Before Starting Implementation

1. **Locate the Feature Inventory section** in the plan
2. **If Feature Inventory is MISSING** - STOP and inform user
3. **Verify ALL features are mapped** - Every row must have a Task #
4. **Read the OLD code completely** - Don't rely on the plan alone

### During Implementation

For EACH task that migrates old functionality:

1. **Read the corresponding old file(s)** listed in Feature Inventory
2. **Create a checklist** of functions/behaviors from old code
3. **Verify each function/behavior exists** in new code after implementation
4. **Test with same inputs** - Old and new code should produce same outputs

### Before Marking Task Complete

**For migration tasks, add this to Definition of Done:**

- [ ] All functions from old code have equivalents in new code
- [ ] Behavior matches old code (same inputs → same outputs)
- [ ] No features accidentally omitted

### Red Flags - STOP Implementation

If you notice ANY of these, STOP and report to user:

- Feature Inventory section missing from plan
- Old file has functions not mentioned in any task
- "Out of Scope" items that should actually be migrated
- Tests pass but functionality is missing compared to old code

---

## Context Management (90% Handoff)

After each major operation, check context:

```bash
~/.pilot/bin/pilot check-context --json
```

**Between iterations:**
1. If context >= 90%: hand off cleanly (don't rush!)
2. If context 80-89%: continue but wrap up current task with quality
3. If context < 80%: continue the loop freely

If response shows `"status": "CLEAR_NEEDED"` (context >= 90%):

**⚠️ CRITICAL: Execute ALL steps below in a SINGLE turn. DO NOT stop or wait for user response between steps.**

**Step 1: Write continuation file (GUARANTEED BACKUP)**

Write to `~/.pilot/sessions/$PILOT_SESSION_ID/continuation.md`:

```markdown
# Session Continuation (/spec)

**Plan:** <plan-path>
**Phase:** implementation
**Current Task:** Task N - [description]

**Completed This Session:**
- [x] [What was finished]

**Next Steps:**
1. [What to do immediately when resuming]

**Context:**
- [Key decisions or blockers]
```

**Step 2: Trigger session clear**

```bash
~/.pilot/bin/pilot send-clear <plan-path>
```

Pilot will restart with `/spec --continue <plan-path>`

ARGUMENTS: $ARGUMENTS
