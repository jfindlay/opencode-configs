---
description: "[jf] Sweep a project's durable files (source, tests, human docs) for leaked plan coordinates — session ids, category letters, ◆, 'frozen contract', sub-track names, PLAN/ROADMAP references — and translate each into a standalone statement of the actual property, reason, or invariant. The manually-invokable whole-project form of the per-sub-track anneal gate /plan-run runs at each ◆ boundary. Mechanical grep-against-denylist + Edit-fix loop; verifies green; never edits rolling docs. Also the home for line-length overruns deferred by multi-session chains. Args: [scope-path-or-glob]."
agent: build
---

# /plan-anneal

Remove leaked plan coordinates from a project's durable artifacts and resolve each into a standalone
statement of the property it stands for, then absorb deferred line-length overruns. This is the
whole-project, on-demand form of the anneal gate `/plan-run` runs at each ◆ boundary.

Runs from `@build` (T1). If invoked from another agent, proceed; nothing here needs a higher tier.
No fork: the translate-verify cycle needs turn-by-turn steering.

Scope (expanded arguments; optional path or glob): $ARGUMENTS

## Procedure

Load the `multisession` skill and read `references/artifact-hygiene.md` from its base directory
(`~/.config/opencode/skills/multisession/`). Follow its "Standalone annealing" procedure with the
scope above. Read `references/verification.md` only if the enclosing dispatch supplies a declared
gate cadence; do not load the execution procedure. If a required resource cannot be read, stop and
report the blocker; do not work from memory.

Does not commit, push, or rewrite history; never edits PLAN, ROADMAP, NOTES, or `AGENTS.md`.
