---
description: Active verification and fix command - runs all tests, immediately fixes any issues found, ensures everything works end-to-end
model: sonnet
---

# Active Verification & Fix

**Purpose:** Hands-on verification that immediately fixes issues as they're discovered, ensuring all tests pass and the system works end-to-end.

**Workflow Position:** Step 3 of 3 in spec-driven development
- **Previous command (/plan):** Idea → Design → Implementation Plan
- **Previous command (/implement):** Implementation Plan → Working Code
- **This command (/verify):** Working Code → Fixed & Verified Implementation

**Process:** Run CodeRabbit analysis → Run tests → Fix failures immediately → Re-test → Run program → Fix CodeRabbit findings → Repeat until all green

## Tools for Verification

**Primary tools for verification and fixing:**
- **CodeRabbit CLI**: `coderabbit --prompt-only` - AI-powered code review (CENTRAL TOOL)
  - Identifies race conditions, memory leaks, security issues, best practice violations
  - Use `--type uncommitted` for uncommitted changes only
  - Use `--type committed` for committed changes only
  - Use `--base <branch>` to specify base branch (e.g., `--base develop`)
  - Run in background to keep workflow responsive
  - **Rate Limits (Free Tier)**: 3 back-to-back reviews, then 2/hour (summary only), 200 files/hour, 100 files/PR
  - **If rate limited**: Wait ~8 minutes or proceed with other verification steps (tests, build, diagnostics)
- **IDE Diagnostics**: `mcp__ide__getDiagnostics()` - Check errors/warnings
- **Cipher**: `mcp__cipher__ask_cipher(...)` - Query issues, store fixes
- **Claude Context**: `mcp__claude-context__search_code(...)` - Find similar code
- **Database**: `mcp__dbhub-postgres__execute_sql(...)` - Verify data
- **Firecrawl**: `mcp__firecrawl-mcp__firecrawl_search(...)` - Research solutions
- **Ref/Context7**: `mcp__Ref__ref_search_documentation(...)` - Check docs

## Process

### Step 1: Start CodeRabbit Analysis & Gather Context

**Launch automated code review while gathering context:**

```bash
# Start CodeRabbit analysis in background (critical first step)
coderabbit --prompt-only --type uncommitted &
CR_PID=$!
```

**While CodeRabbit runs, gather context and fix obvious problems:**
1. Check diagnostics: `mcp__ide__getDiagnostics()`
   - **If errors/warnings found:** Fix them immediately before proceeding
2. Read plan (if exists): `Glob("docs/plans/*.md")` then `Read(latest_plan)`
   - Extract requirements, success criteria, architecture decisions
   - If no plan found, continue without (standalone verification)
3. Check changes: `git status --short` and `git diff --stat` - Understand scope
4. Query Cipher: `mcp__cipher__ask_cipher("What was implemented? Any known issues?")`

**Check if CodeRabbit is complete:**
```bash
# Check if background job finished
jobs -l | grep $CR_PID
# If still running, continue with tests; check back after Step 2-3
```

### Step 2: Run & Fix Unit Tests

**Start with the fastest tests and fix failures immediately:**

```bash
# Run unit tests first
uv run pytest -m unit -v --tb=short
```

**If failures occur:**
1. Identify the failing test and error message
2. Read the test file to understand expected behavior
3. Fix the implementation code (not the test unless it's wrong)
4. Re-run the specific failing test: `uv run pytest path/to/test.py::test_function -v`
5. Once fixed, re-run all unit tests to ensure no regression
6. Continue until all unit tests pass

### Step 3: Run & Fix Integration Tests

**Test component interactions and fix issues:**

```bash
# Run integration tests
uv run pytest -m integration -v --tb=short
```

**If failures occur:**
1. Analyze the failure - often related to:
   - Database connection issues
   - External service mocks not properly configured
   - Missing test data setup
2. Fix the issue in the code or test setup
3. Re-run the failing test specifically
4. Continue until all integration tests pass

### Step 4: Execute & Fix the Actual Program

**Run the real application and fix any runtime issues:**

```bash
# Identify the main entry point from the plan or codebase
# Examples based on common patterns:

# ETL Pipeline
uv run python src/main.py
# If fails: Check logs, fix configuration, retry

# API Server
uv run python src/app.py &  # Start server
sleep 2  # Wait for startup
curl -X GET localhost:8000/health  # Health check
# If fails: Fix startup issues, port conflicts, missing env vars

# CLI Tool
uv run python src/cli.py --help
# Then run actual commands based on implementation
# If fails: Fix argument parsing, missing dependencies

# Background Job/Worker
uv run python src/worker.py
# If fails: Fix queue connections, task definitions
```

**Common runtime fixes:**
- Missing environment variables → Add to .env file
- Database connection errors → Check credentials, network
- Import errors → Install missing packages with `uv add`
- Configuration issues → Update config files
- Permission errors → Fix file/directory permissions

### Step 5: Run & Fix Coverage Issues

**Check test coverage and add missing tests:**

```bash
# Run with coverage report
uv run pytest --cov=. --cov-report=term-missing --cov-fail-under=80
```

**If coverage < 80% or critical code uncovered:**
1. Identify uncovered lines from the report
2. Write tests for uncovered critical paths:
   - Create test file if it doesn't exist
   - Write test FIRST (TDD approach)
   - Verify test fails appropriately
   - Run again to confirm coverage improvement
3. Skip coverage for truly untestable code (e.g., if __name__ == "__main__")

### Step 6: Review & Fix CodeRabbit Findings

**Process CodeRabbit analysis results (CRITICAL QUALITY GATE):**

```bash
# Check if CodeRabbit analysis is complete
wait $CR_PID || coderabbit --prompt-only --type uncommitted
```

**CodeRabbit output provides AI-optimized findings with:**
- File locations and line numbers
- Issue severity (critical/high/medium/low)
- Suggested approaches for fixes
- Best practice violations

**Create systematic fix plan:**
1. Review all findings and create TodoWrite list for each issue
2. Prioritize: Critical → High → Medium → Low
3. For each finding:
   - Read the affected file(s)
   - Understand the issue context
   - Apply the fix (use `mcp__claude-context__search_code` to find similar patterns)
   - Verify fix doesn't break tests: `uv run pytest path/to/affected_test.py`
4. Store fixes in Cipher: `mcp__cipher__ask_cipher("Fixed CodeRabbit finding: [issue] in [file]. Solution: [description]")`

**Common CodeRabbit findings:**
- Race conditions → Add proper locking/synchronization
- Memory leaks → Fix resource cleanup, close connections
- Security vulnerabilities → Sanitize inputs, use secure functions
- Error handling gaps → Add try-catch, validate inputs
- Performance issues → Optimize algorithms, add caching
- Best practice violations → Follow framework conventions

**Re-run CodeRabbit after fixes to verify:**
```bash
coderabbit --prompt-only --type uncommitted
# Continue fixing until no critical/high issues remain
```

**If rate limit is hit:**
- Message: "Rate limit exceeded, please try after X minutes"
- **Option 1**: Wait the specified time (usually 8 minutes) then re-run
- **Option 2**: Proceed to Step 7-9 (code quality, tests, build) and verify those pass
- **Option 3**: If all other checks pass and you fixed all reported issues, consider verification complete
- **Note**: Free tier allows 3 back-to-back reviews, then 2/hour. Plan accordingly for large codebases.

### Step 7: Fix Code Quality Issues

**Run additional quality checks and fix all issues:**

```bash
# Linting - auto-fix what's possible
uv run ruff check . --fix
# If issues remain, manually fix them

# Format all files
uv run ruff format .
# No manual action needed - it auto-formats

# Type checking
uv run mypy src --strict
# If errors: Add type hints, fix type mismatches

# Security scan (if available)
uv run bandit -r src 2>/dev/null || echo "Bandit not installed"
# If issues: Fix security vulnerabilities immediately
```

**Common fixes:**
- Import errors → Reorder/remove unused imports
- Type errors → Add type hints or fix incorrect types
- Line too long → Break into multiple lines
- Undefined names → Import missing modules
- Security issues → Use secure functions/patterns

### Step 8: E2E Verification (if applicable)

**For API projects - test with real requests:**
```bash
# If Postman collection exists
if [ -d "postman/collections" ]; then
  newman run postman/collections/*.json -e postman/environments/dev.json
  # Fix any failing requests
fi

# Or test key endpoints manually
curl -X GET localhost:8000/api/health
curl -X POST localhost:8000/api/[endpoint] -H "Content-Type: application/json" -d '{}'
```

**For data pipelines - verify data flow:**
```sql
-- Check if data was loaded correctly
SELECT COUNT(*) FROM target_table WHERE created_at > NOW() - INTERVAL '1 hour';
-- If no data, debug the pipeline
```

### Step 9: Final Verification Loop

**Run everything one more time to ensure all fixes work together:**

```bash
# Quick final check
uv run pytest -q  # Quiet mode for quick pass/fail
uv run python src/main.py  # Or whatever the main entry point is
mcp__ide__getDiagnostics()  # Must return zero issues
coderabbit --prompt-only --type uncommitted  # Final CodeRabbit check
```

**If anything fails:** Go back to the specific step and fix it

**Success criteria:**
- All tests passing
- No IDE diagnostics errors
- No critical/high CodeRabbit findings
- Program executes successfully
- Coverage meets threshold (80%+)

## Store Progress in Cipher

**After fixing each CodeRabbit finding:**
```
mcp__cipher__ask_cipher("Fixed CodeRabbit finding: [severity] - [issue description] in [file]:line.
Solution: [what was done]
Impact: [what improved]")
```

**After fixing each test failure:**
```
mcp__cipher__ask_cipher("Fixed: [issue description] in [file].
Solution: [what was done]
Tests now passing: [test names]")
```

**After successful completion:**
```
mcp__cipher__ask_cipher("Verification complete for [feature/plan].
All tests passing, coverage at X%, program runs successfully.
CodeRabbit findings: X critical, Y high (all resolved).
Key fixes applied: [list of major fixes]")
```

## Key Principles

**Fix immediately** | **Test after each fix** | **No "should work" - verify it works** | **Keep fixing until green**

**Success = Everything works. No exceptions.**

## CodeRabbit Integration Workflow

**Recommended iterative cycle for feature implementation:**

1. Implement feature as requested
2. Run `coderabbit --prompt-only` in background
3. Continue with tests while CodeRabbit analyzes
4. Check CodeRabbit completion: "Is CodeRabbit finished running?"
5. Create TodoWrite list for each finding systematically
6. Fix issues iteratively until critical/high issues resolve
7. Re-run CodeRabbit to verify fixes
8. Repeat until quality gate passes

**Optimization tips:**
- Work on smaller feature branches to reduce analysis time
- Use `--type uncommitted` for work-in-progress changes
- Use `--type committed` for pre-merge final review
- Specify `--base <branch>` when working on feature branches
- Run in background to keep Claude responsive during analysis
- CodeRabbit catches complex issues (race conditions, memory leaks) that standard linters miss
