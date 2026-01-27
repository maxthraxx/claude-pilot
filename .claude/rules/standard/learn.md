## Online Learning System

**Rule:** Evaluate sessions for extractable knowledge. Only act when there's something valuable.

### Stop Hook Response (CRITICAL)

When the `/learn check` hook fires at session end:

1. **Quickly evaluate:** Does this session have a non-obvious solution OR repeatable workflow?
2. **If YES** → Invoke `Skill(learn)` to extract the knowledge
3. **If NO** → **Output NOTHING.** Do not respond. Do not say "nothing to learn". Just let the stop proceed silently.

**The user should see NO response from you if there's nothing to extract.** Any response like "No learning needed" or "Nothing to extract" is noise that frustrates users.

### Triggers for /learn

| Trigger | Example |
|---------|---------|
| **Non-obvious debugging** | Spent 10+ minutes investigating; solution wasn't in docs |
| **Misleading errors** | Error message pointed wrong direction; found real cause |
| **Workarounds** | Discovered limitation and found creative solution |
| **Tool integration** | Figured out how to use tool/API in undocumented way |
| **Trial-and-error** | Tried multiple approaches before finding what worked |
| **Repeatable workflow** | Multi-step task that will recur; worth standardizing |

### What NOT to Extract (Stay Silent)

- Simple tasks (reading files, running commands, answering questions)
- Single-step fixes with no workflow value
- One-off fixes unlikely to recur
- Knowledge easily found in official docs
- Unverified or theoretical solutions

### Quick Decision Tree

```
Hook fires → Was there non-obvious discovery OR multi-step reusable workflow?
├─ YES → Invoke Skill(learn)
└─ NO  → Output nothing, let stop proceed
```
