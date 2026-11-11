---
name: multisession
description: Procedures for long-arc multi-session projects. Planning (ROADMAP construction, sharding a sub-track into a PLAN), autonomous execution of a sharded PLAN as a 1:1 session:commit chain, paired feature/completion units, declared gate cadence, and plan-register annealing. Load before /roadmap-construct, /plan-shard, /plan-run, /plan-anneal, or when @plan-admin is invoked directly.
---

# Multisession

Index for the long-arc workflow. Loading this skill does not switch agents or grant permissions;
command routing, direct-agent prerequisites, and approval gates still apply. A missing or denied
required resource is a blocker: report it, do not improvise its procedure.

Resource paths below resolve from this skill's base directory (the directory holding this file;
`~/.config/opencode/skills/multisession/`), never from the target project's working directory. Read
them with the Read tool. `$ARGUMENTS` is expanded only in the command body, so a command passes its
expanded input explicitly; resources consume that input and do not expect interpolation. Dispatch
templates are filled in by the driver, not by the skill loader.

## Lifecycle and roles

```
/roadmap-construct → ROADMAP ─► /plan-shard → PLAN ─► /plan-run → … ─► /plan-shard (next)
   @architect                     @architect           @plan-admin     (reconciles the ROADMAP)
```

- `@architect` constructs the ROADMAP and shards one sub-track at a time into a PLAN.
- `@plan-admin` (T1) runs the PLAN as a mechanical loop: `@build`/`@explore` implement, `@committer`
  commits, and `@plan-juncture` (T0) is forked only at inflection, discovery, and sub-track
  boundary junctures.
- `/plan-anneal` (`@build`) removes leaked plan coordinates from durable files on demand.

## Resources

| Resource (`references/`) | Owns | Load when |
|---|---|---|
| `planning.md` | planning model, ROADMAP construction, sharding and reconciliation, sizing, F/C selection | constructing a ROADMAP; sharding |
| `plan-format.md` | ROADMAP/PLAN shapes, statuses, markers, ledger schema, juncture vocabulary | constructing, sharding, executing |
| `execution.md` | preflight, loop, stops, retry budget, common dispatch and juncture templates, exit report | executing (including direct `@plan-admin`) |
| `paired-units.md` | F/C stages, capsule, checkpoint validation and recovery, stage prompts, defect routing | a row marked `(F/C)` is selected for inclusion or execution; before refusing a dirty tree that may hold a recorded checkpoint |
| `verification.md` | declared gate cadence, evidence records, identity, reuse, freshness, outcomes | preflight finds an explicit cadence declaration; an enclosing dispatch supplies one |
| `artifact-hygiene.md` | REGISTER block, project seed, anneal patterns and exclusions, annealing, boundary review obligations, line length | sharding; executing; `/plan-anneal` |
| `rationale.md` | derivation of the two-frame model, sizing economics, control-loop analogy, tradeoffs | explanation or planning questions that need the why; never required for a run |

`rationale.md` is optional and grants no execution authority; every rule it explains is stated in
the resource that owns it.

## Required loading by path

- **Roadmap construction:** `planning.md`, `plan-format.md`.
- **Sharding:** `planning.md`, `plan-format.md`, `artifact-hygiene.md`; add `paired-units.md` when
  an F/C row is selected.
- **Execution:** this skill, `execution.md`, `plan-format.md`, `artifact-hygiene.md` before the
  first dispatch. No declared cadence means `verification.md` is not loaded and no evidence-reuse
  exception exists.
- **Standalone annealing:** `artifact-hygiene.md`; add `verification.md` only when the enclosing
  dispatch supplies a declared cadence.
- **Juncture workers** load nothing: the dispatch carries the complete scoped question, return
  contract, digest, and review inputs.
