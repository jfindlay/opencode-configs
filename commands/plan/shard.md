---
description: "[jf] Shard a roadmap, prose plan, or in-session design into an executable docs/PLAN.md for /plan/run, reconciling docs/ROADMAP.md first. Sharding only; does not execute. Args: [roadmap-or-plan-path] [sub-track]."
agent: architect
subagent: false
---

# /plan/shard

Turn a long-arc design into the executable `docs/PLAN.md` that `/plan/run` consumes, reconciling
`docs/ROADMAP.md` first. This command produces the shards and pauses for review; it never runs
`/plan/run` (executing is a separate `@plan-admin` action). It runs the session as `@architect`; the
switch persists after the command, with no automatic switch-back.

Source (optional `[roadmap-or-plan-path] [sub-track]`):

$ARGUMENTS

## Procedure

Load the `multisession` skill. Then read, from the skill's base directory
(`~/.config/opencode/skills/multisession/`), `references/planning.md`, `references/plan-format.md`,
and `references/artifact-hygiene.md`. When a row is selected as `(F/C)`, also read
`references/paired-units.md` before writing it. Follow the "Sharding" procedure in `planning.md`
with the source above. If a required resource cannot be read, stop and report the blocker; do not
reconstruct the procedure from memory.

Every write (ROADMAP reconciliation, PLAN, project `AGENTS.md` seed) sits behind the
Question-tool confirmation described there. Sharding only: never execute a session or commit code.
