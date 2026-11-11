---
description: "[jf] Audit a target for code, doc, and test style violations. Args: [target]."
---

# /style/audit

Audit a target (file, directory, or package) for code, doc, and test style violations. Forks one
read-only `@explore` per applicable surface; merges findings by file; emits proposals only.

Target (file, directory, or package; may be empty):

$ARGUMENTS

## Procedure

Load the `style` skill and read `references/audit.md` from its base directory
(`~/.config/opencode/skills/style/`). Follow it with the target above.

Review-only: never applies fixes, commits, pushes, or rewrites history.
