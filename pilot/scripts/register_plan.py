"""Register plan association with Console API.

Usage: python register_plan.py <plan_path> <status>
Non-blocking: exits 0 on success, 1 on failure.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

CONSOLE_URL = "http://localhost:41777"


def _get_content_session_id() -> str:
    """Read current content session ID from Claude history."""
    history = Path.home() / ".claude" / "history.jsonl"
    if not history.exists():
        return ""
    try:
        with history.open() as f:
            lines = f.readlines()
            if lines:
                return json.loads(lines[-1]).get("sessionId", "")
    except (json.JSONDecodeError, OSError):
        pass
    return ""


def register_plan(plan_path: str, status: str) -> bool:
    """Register a plan association via Console API."""
    session_id = _get_content_session_id()
    if not session_id:
        return False

    url = f"{CONSOLE_URL}/api/sessions/by-content-id/{session_id}/plan"
    data = json.dumps({"planPath": plan_path, "status": status}).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=5)
        return resp.status == 200
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"Plan registration failed: {e}", file=sys.stderr)
        return False


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(1)
    success = register_plan(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
