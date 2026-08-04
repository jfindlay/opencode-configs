---
description: "[jf] Prime @architect to co-construct a long-arc docs/ROADMAP.md from free-form intent: the project-lifetime static-frame view that /plan-shard later slices into per-sub-track PLANs and /plan-run executes. Orients on the full multiplan lifecycle (construct → {shard → apply → reconcile}* loop) and the juncture coordinate-transform, but treats roadmap construction as the abductive discovery act it is — not a procedure to mechanize. Args: optional intent seed or source path."
agent: architect
subtask: false
---

# /roadmap-construct

Co-construct a long-arc `docs/ROADMAP.md` — the project-lifetime, static-frame view of a multisession
project — out of free-form intent. This is Phase 0 of the multiplan lifecycle: the act everything
downstream consumes. It is a **dialogue**, not a fill-in-the-blanks procedure. Roadmap construction is
where the project's constraint surface is *discovered and articulated*, not where pre-existing
constraints are applied; it resists templating by nature, and that is correct (see "Why this isn't
mechanized" below). Your job is to hold the design conversation well, then write the artifact.

Runs from `@architect` (Opus 4.8): this is the highest-judgment, most-abductive moment in the whole
arc. If invoked from another agent, note that the judgment register expects Opus and proceed only if
the user confirms.

Intent seed (optional): $ARGUMENTS

`$ARGUMENTS` may be empty (elicit from scratch), a one-line intent, or a path to a prose design doc,
an `IDEAS.md` entry, or a scouting/exploration note to build from. Read any named source first.

## Orient: where this sits in the multiplan lifecycle

Hold the whole loop in view while constructing, because the roadmap's shape is constrained by what
the downstream machinery can consume. Reference: `multisession/multi-session-planning.md` (the
two-frame model; read it if not already in context).

```
   /roadmap-construct        ROADMAP.md          (static frame — project-lifetime DAG of sub-tracks)
        │                       │
        │   ┌───────────────────┴────────────────────────────┐
        │   │  the iterate loop (NOT yet captured as a       │
        │   ▼  single mechanized control structure)          │
   ┌───────────────────────────────────────────────────────┐ │
   │  for each sub-track:                                  │ │
   │    /plan-shard   ROADMAP ─► PLAN.md (session list)    │ │
   │    /plan-run     execute PLAN as 1:1 session:commit   │ │
   │    reconcile     fold PLAN discoveries ─► ROADMAP     │◄┘
   │                  (coordinate transform, admin-judged) │
   └───────────────────────────────────────────────────────┘
```

- **`/plan-shard`** slices one sub-track of the ROADMAP into an executable `PLAN.md`.
- **`/plan-run`** executes that PLAN as an autonomous session:commit chain.
- **Juncture agents** (`@plan-juncture`) perform the **coordinate transform** — the action-frame
  (what was learned executing) updating the static-frame (the roadmap) — at inflection points,
  contract-invalidating discoveries, and sub-track boundaries. This dynamic administrative judgment
  is reserved to admin agents *inside* the loop; the roadmap you construct is their anchor against
  defocus and their licence to adapt against rigidity.

You are constructing the **anchor of that loop**. Construct it so the loop has something durable to
slice, execute against, and reconcile back into.

## The conversation (elicit, don't assume)

Drive a dialogue that surfaces, in roughly this order — but follow the intent where it leads, this is
not a checklist to march through:

1. **Design intent in prose.** The one-paragraph statement of what the project is *for*, written so
   it can be re-read at every sub-track boundary as the anti-defocus anchor. This is the most
   load-bearing artifact in the roadmap — get it sharp.
2. **Sub-track decomposition.** The project as a DAG of sub-tracks (the composition unit above
   sessions: substrate + algorithms + optimizations + integrative writeup, for one conceptually-tight
   area). Name dependencies between sub-tracks (the edges). Do NOT decompose sub-tracks into sessions
   yet — that is `/plan-shard`'s job, and is premature until the substrate of each sub-track is known.
3. **The substrate the project sits on.** What exists; what must be built first; what the irreducible
   foundational sub-track is.
4. **Cross-track contracts (coarse).** Contracts that will span sub-tracks (the coordination cost).
    These are sketched here at roadmap grain and frozen precisely later, per sub-track, by `/plan-shard`
   and the inflection junctures.
5. **Scope, sequencing, and the cost-of-wrong texture.** Which sub-track first; what the
   correctness-criticality and design-error-cost profile is (this later informs commit-size tuning
   at shard time — surface it now so the static frame records it).
6. **Open questions and risks inbox.** The questions that cannot be answered now. These seed the
   roadmap's Discoveries & open-questions log — the channel the reconcile step folds findings back
   into.

Surface load-bearing choices via the Question tool rather than deciding silently — especially
sub-track boundaries, the dependency edges, and which sub-track is the substrate.

## The artifact (what to write)

Produce `docs/ROADMAP.md` as the durable, project-lifetime static-frame document. Suggested shape
(adapt to the project — this is scaffolding, not a rigid schema):

- **`## Design intent`** — the prose anchor from conversation step 1. Re-read at every boundary.
- **`## Sub-track DAG`** — the sub-tracks as nodes, dependencies as edges. Per sub-track: a one-line
  charge, its category mix (substrate/algorithm/optimization/integrative), and its dependencies.
  Mark the substrate sub-track. Do NOT enumerate sessions.
- **`## Cross-track contracts (coarse)`** — contracts spanning sub-tracks, at roadmap grain; tagged
  by flavour (compiler / test / prose) where already evident. Frozen precisely later, not here.
- **`## Sequencing & scope`** — proposed sub-track order and the cost-of-wrong texture.
- **`## Discoveries & open questions`** — the inbox. Seeded from conversation step 6; the reconcile
   step (and `/plan-shard`'s boundary reconciliation) append here as the project runs.
- **`## Status`** — sub-track status ledger (not-started / in-progress / done). All not-started at
  construction. `/plan-shard` marks in-progress; the reconcile step marks done.

## Why this isn't mechanized (and the control flow that is deliberately uncaptured)

The roadmap-construction act is abductive: it is where the problem's actual shape gets articulated,
not where a known shape is applied. A declarative config for "discover what the config should
contain" would be circular. So this command primes a *conversation*, it does not run a procedure.

Three things are deliberately **left uncaptured** here, pending more observed arcs (the constraint
surface is not yet visible enough to crystallize them — see `IDEAS.md`, "Agent hierarchy" theme):

1. Whether the iterate loop (`for each sub-track: shard → apply → reconcile`) should become a single
   mechanized control structure (a declarative config, a graph) at all.
2. Reusable, parameterized sub-track graph patterns (n=1 so far — premature to extract).
3. How dynamic administrative judgment by juncture agents, from inside the loop, should be permitted
   to alter the *future* of the loop (the action→static rewrite as a first-class graph mutation).

Do not resolve these in a roadmap session. If a construction surfaces evidence bearing on them,
surface it as a `CAPTURE-CANDIDATE` for the `IDEAS.md` "Agent hierarchy" theme.

## Output and handoff

1. Show the proposed `docs/ROADMAP.md` as a fenced block.
2. Confirm via the Question tool before writing (the `@architect` handoff-checkpoint rule and the
   "long-arc roadmap" write trigger: the write is a checkpoint, not a unilateral act).
3. Write `docs/ROADMAP.md`. Pause for review. Do NOT shard it — that is the next, separate
   `/plan-shard` step.
4. Suggest the first `/plan-shard` invocation (which sub-track to slice first).

## Constraints

- Construction only. Never shard, never execute, never commit code. `/plan-shard` slices; `/plan-run`
  executes.
- Writes are limited to `docs/ROADMAP.md` (and, on approval, an `IDEAS.md`/NOTES capture). All other
  writes are disabled per `@architect` permissions.
- Do NOT enumerate sessions inside sub-tracks — that is premature here and is `/plan-shard`'s job
  after each substrate is known.
- Do NOT attempt to mechanize the iterate loop or the juncture coordinate-transform into a config or
  graph. Hold those as open questions for `IDEAS.md`.

## Exit report

- Source used (intent seed / path / from-scratch elicitation).
- Sub-track count and the dependency-DAG shape; which sub-track is the substrate.
- Cross-track contracts sketched; open questions seeded into the Discoveries log.
- Capture candidates surfaced for the `IDEAS.md` "Agent hierarchy" theme.
- The suggested first `/plan-shard` invocation.
