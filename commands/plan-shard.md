---
description: "[jf] Shard a roadmap, a prose plan, or an in-session design statement into a /plan-run-executable docs/PLAN.md: session list (one commit-shaped session per row), cross-session contracts, progress ledger, and action-frame digest. First reconciles docs/ROADMAP.md at the sub-track boundary (mark prior sub-track done, fold its discoveries up, mark the next in-progress). Applies the five-input commit-size tuning law. This is the SHARDING step /plan-run refuses to do; it does NOT execute the plan. Args: [roadmap-or-plan-path] [sub-track]."
agent: architect
subagent: false
---

# /plan-shard

Turn a long-arc design into the executable `docs/PLAN.md` that `/plan-run` consumes, reconciling
`docs/ROADMAP.md` first. This command produces the shards and pauses for review; it never runs
`/plan-run` (executing is a separate `@plan-admin` action).

Runs from `@architect` (T0). If invoked from another agent, note that the judgment register expects
T0 and proceed only if the user confirms.

Source (expanded arguments; optional `[roadmap-or-plan-path] [sub-track]`): $ARGUMENTS

## Procedure

Load the `multisession` skill. Then read, from the skill's base directory
(`~/.config/opencode/skills/multisession/`), `references/planning.md`, `references/plan-format.md`,
and `references/artifact-hygiene.md`. When a row is selected as `(F/C)`, also read
`references/paired-units.md` before writing it. Follow the "Sharding" procedure in `planning.md`
with the source above. If a required resource cannot be read, stop and report the blocker; do not
reconstruct the procedure from memory.

Every write (ROADMAP reconciliation, PLAN, project `AGENTS.md` seed) sits behind the
Question-tool confirmation described there. Sharding only: never execute a session or commit code.
