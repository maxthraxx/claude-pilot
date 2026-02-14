#!/usr/bin/env python3
"""SessionEnd hook - stops worker only when no other sessions are active.

Skips worker stop during endless mode handoffs (continuation file present)
or when an active spec plan is in progress (PENDING/COMPLETE status).
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _util import _sessions_base
from notify import send_notification

PILOT_BIN = Path.home() / ".pilot" / "bin" / "pilot"


def _get_active_session_count() -> int:
    """Get active session count from the pilot binary."""
    try:
        result = subprocess.run(
            [str(PILOT_BIN), "sessions", "--json"],
            capture_output=True,
            text=True,
            check=False,
            timeout=10,
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            return data.get("count", 0)
    except (json.JSONDecodeError, OSError, subprocess.TimeoutExpired):
        pass
    return 0


def _is_session_handing_off() -> bool:
    """Check if this session is doing an endless mode handoff.

    Returns True if a continuation file exists or an active spec plan
    has PENDING/COMPLETE status (meaning the workflow will resume).
    """
    session_id = os.environ.get("PILOT_SESSION_ID", "").strip() or "default"
    session_dir = _sessions_base() / session_id

    if (session_dir / "continuation.md").exists():
        return True

    plan_file = session_dir / "active_plan.json"
    if plan_file.exists():
        try:
            data = json.loads(plan_file.read_text())
            status = data.get("status", "").upper()
            if status in ("PENDING", "COMPLETE"):
                return True
        except (json.JSONDecodeError, OSError):
            pass

    return False


def _is_plan_verified() -> bool:
    """Check if active plan has VERIFIED status."""
    session_id = os.environ.get("PILOT_SESSION_ID", "").strip() or "default"
    session_dir = _sessions_base() / session_id
    plan_file = session_dir / "active_plan.json"

    if not plan_file.exists():
        return False

    try:
        data = json.loads(plan_file.read_text())
        status = data.get("status", "").upper()
        return status == "VERIFIED"
    except (json.JSONDecodeError, OSError):
        return False


def main() -> int:
    plugin_root = os.environ.get("CLAUDE_PLUGIN_ROOT", "")
    if not plugin_root:
        return 1

    count = _get_active_session_count()
    if count > 1:
        return 0

    if _is_session_handing_off():
        return 0

    stop_script = Path(plugin_root) / "scripts" / "worker-service.cjs"
    result = subprocess.run(
        ["bun", str(stop_script), "stop"],
        capture_output=True,
        text=True,
        check=False,
    )

    if _is_plan_verified():
        send_notification("Pilot", "Spec complete — all checks passed")
    else:
        send_notification("Pilot", "Claude session ended")

    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
