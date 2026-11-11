---
description: "[jf] Sweep a project's durable files (source, tests, human docs) for leaked plan coordinates and rewrite each as a standalone statement; also absorbs deferred line-length overruns. Never edits rolling docs. Args: [scope-path-or-glob]."
agent: build
---

# /plan/anneal

Remove leaked plan coordinates (session ids, category letters, ◆, "frozen contract", sub-track
names, PLAN/ROADMAP references) from a project's durable artifacts and resolve each into a
standalone statement of the property it stands for, then absorb deferred line-length overruns. This
is the whole-project, on-demand form of the anneal gate `/plan/run` runs at each ◆ boundary.

This command runs the session as `@build` (T1); the switch persists after the command. No fork: the
translate-verify cycle needs turn-by-turn steering.

Scope (optional path or glob):

$ARGUMENTS

## Procedure

Load the `multisession` skill and read `references/artifact-hygiene.md` from its base directory
(`~/.config/opencode/skills/multisession/`). Follow its "Standalone annealing" procedure with the
scope above. Read `references/verification.md` only if the enclosing dispatch supplies a declared
gate cadence; do not load the execution procedure. If a required resource cannot be read, stop and
report the blocker; do not work from memory.

Does not commit, push, or rewrite history; never edits PLAN, ROADMAP, NOTES, or `AGENTS.md`.
