---
description: "[jf] Autonomously execute a session-sharded plan file as a 1:1 session:commit chain through @plan-admin. Args: [plan-path] [may-reshard|halt-at-boundaries]; plan path defaults to docs/PLAN.md."
agent: plan-admin
subagent: false
---

# /plan/run

Drive an already-sharded PLAN to completion as an autonomous chain. This command executes; it does
not shard (that is an interactive `@architect` task via `/plan/shard`). It runs the session as
`@plan-admin`; the switch persists after the run, with no automatic switch-back.

Arguments (`[plan-path] [may-reshard|halt-at-boundaries]`; plan path defaults to `docs/PLAN.md`):

$ARGUMENTS

- `may-reshard`: an `additive-reshard` verdict may be honoured; a destructive one never is.
- `halt-at-boundaries`: halt for human sign-off at every ◆ boundary and after every inflection
  design, regardless of the fork's verdict. Use for the first run of an unproven shard pattern.

Only the default `docs/PLAN.md` carries the driver's standing edit permission. A non-default plan
path needs edit authorization from the user before autonomous work begins; ask for it first.

## Procedure

Before any dispatch, load the `multisession` skill and read, from its base directory
(`~/.config/opencode/skills/multisession/`), `references/execution.md`, `references/plan-format.md`,
and `references/artifact-hygiene.md`. Follow `execution.md` with the arguments above. It names the
triggers for `references/paired-units.md` (an `(F/C)` row or a recorded checkpoint) and
`references/verification.md` (an explicit cadence declaration); read each only then. If a required
resource cannot be read, stop and report the blocker; do not run the loop from memory. A dispatched
worker never inherits these resources: every prompt carries what that worker needs.
