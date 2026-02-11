## Pilot CLI Reference

The `pilot` binary is at `~/.pilot/bin/pilot`. These are **all** available commands — do NOT call commands that aren't listed here.

### Session & Context

| Command | Purpose | Example |
|---------|---------|---------|
| `pilot` | Start Claude with Endless Mode (primary entry point) | Just type `pilot` or `ccp` |
| `pilot run [args...]` | Start with optional flags | `pilot run --skip-update-check` |
| `pilot check-context --json` | Get context usage percentage | Returns `{"status": "OK", "percentage": 47.0}` or `{"status": "CLEAR_NEEDED", ...}` |
| `pilot send-clear <plan.md>` | Trigger Endless Mode continuation with plan | `pilot send-clear docs/plans/2026-02-11-foo.md` |
| `pilot send-clear --general` | Trigger continuation without plan | Only when no active plan exists |
| `pilot register-plan <path> <status>` | Associate plan with current session | `pilot register-plan docs/plans/foo.md PENDING` |

### Worktree Management

| Command | Purpose | JSON Output |
|---------|---------|-------------|
| `pilot worktree detect --json <slug>` | Check if worktree exists | `{"found": true, "path": "...", "branch": "...", "base_branch": "..."}` |
| `pilot worktree create --json <slug>` | Create worktree AND register with session | `{"path": "...", "branch": "spec/<slug>", "base_branch": "main"}` |
| `pilot worktree diff --json <slug>` | List changed files in worktree | JSON with file changes |
| `pilot worktree sync --json <slug>` | Squash merge worktree to base branch | `{"success": true, "files_changed": N, "commit_hash": "..."}` |
| `pilot worktree cleanup --json <slug>` | Remove worktree and branch | Deletes worktree directory and git branch |
| `pilot worktree status --json` | Show active worktree info | `{"active": false}` or `{"active": true, ...}` |

**Slug** = plan filename without date prefix and `.md` (e.g., `2026-02-11-add-auth.md` → `add-auth`).

**Error handling:** `create` returns `{"success": false, "error": "dirty", "detail": "..."}` when the working tree has uncommitted changes. Use `AskUserQuestion` to let the user choose: commit, stash, or skip worktree (see spec-implement Step 2.1b).

### License & Auth

| Command | Purpose |
|---------|---------|
| `pilot activate <key> [--json]` | Activate license key |
| `pilot deactivate` | Deactivate license on this machine |
| `pilot status [--json]` | Show license status |
| `pilot verify [--json]` | Verify license (used by hooks) |
| `pilot trial --check [--json]` | Check trial status |
| `pilot trial --start [--json]` | Start a trial |

### Other

| Command | Purpose |
|---------|---------|
| `pilot greet [--name NAME] [--json]` | Print welcome banner |
| `pilot statusline` | Format status bar (reads JSON from stdin, used by Claude Code settings) |

### Commands That Do NOT Exist

Do NOT attempt these — they will fail:
- ~~`pilot pipe`~~ — Never implemented
- ~~`pilot init`~~ — Use installer instead
- ~~`pilot update`~~ — Auto-update is built into `pilot run`
