#!/usr/bin/env python3
"""Stop hook that reminds Claude to evaluate for online learning.

First stop: blocks with reminder (exit 2)
Subsequent stops within 120s: passes through (exit 0)

Claude should evaluate and either:
- Invoke /learn if there's something extractable
- Output NOTHING and let the stop proceed if trivial task
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

STATE_FILE = Path("/tmp/claude-online-learning-reminder")
COOLDOWN_SECONDS = 120


def main() -> int:
    """Output online learning reminder with cooldown."""
    now = time.time()

    if STATE_FILE.exists():
        try:
            last_reminder = float(STATE_FILE.read_text().strip())
            if now - last_reminder < COOLDOWN_SECONDS:
                return 0
        except (ValueError, OSError):
            pass

    STATE_FILE.write_text(str(now))
    print(
        "🧠 /learn check: Non-obvious solution or repeatable workflow? "
        "If YES → invoke Skill(learn). If NO → output nothing.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
