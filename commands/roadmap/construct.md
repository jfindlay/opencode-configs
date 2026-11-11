---
description: "[jf] Co-construct a long-arc docs/ROADMAP.md with @architect from free-form intent: the project-lifetime view that /plan/shard later slices into per-sub-track PLANs. A design dialogue, not a procedure. Args: optional intent seed or source path."
agent: architect
subagent: false
---

# /roadmap/construct

Co-construct `docs/ROADMAP.md`, the project-lifetime static-frame view of a multisession project,
out of free-form intent. It is a design dialogue, not a fill-in-the-blanks procedure: hold the
conversation well, then write the artifact. This command owns the ROADMAP's initial creation;
`/plan/shard` owns its later reconciliation. It runs the session as `@architect`; the switch
persists after the command, with no automatic switch-back.

Intent seed (may be empty, a one-line intent, or a path to a design doc, an `IDEAS.md` entry, or an
exploration note):

$ARGUMENTS

## Procedure

Load the `multisession` skill. Then read `references/planning.md` and `references/plan-format.md`
from the skill's base directory (`~/.config/opencode/skills/multisession/`). Follow the "ROADMAP
construction" procedure in `planning.md` with the intent seed above, writing to the shape in
`plan-format.md`. If a required resource cannot be read, stop and report the blocker; do not
reconstruct the procedure from memory.

Construction only: never shard, execute, or commit code. Writes are limited to `docs/ROADMAP.md`
(and, on approval, an `IDEAS.md`/NOTES capture), behind the Question-tool confirmation. Do not
enumerate sessions inside sub-tracks, and do not mechanize the iterate loop or juncture transform;
hold those as open questions for the `IDEAS.md` "Agent hierarchy" theme.
