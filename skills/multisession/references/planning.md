# Planning: model, ROADMAP construction, sharding

Procedures for `/roadmap/construct` and `/plan/shard`, both run from `@architect` (T0). Shapes and
markers: `plan-format.md`. Derivations: `rationale.md` (optional).

## Planning model

- **Delivery unit (code delivery, which is what execution currently implements).** One
  commit-shaped session: one conceptual unit, ending green, landing as one feature commit plus one
  separate PLAN ledger commit. It carries at least one KAT, benchmarks where the work makes a
  quantitative claim, and a narrative section where the project keeps one. One row is one unit; an
  `(F/C)` row is still one unit with two execution contexts (`paired-units.md`).
- **Two frames, two documents.** ROADMAP is the static frame (project-lifetime DAG of sub-tracks);
  PLAN is the rolling frame for the current sub-track. Execution learns in the action frame and
  carries it in PLAN's digest; junctures adjudicate and the driver records findings in PLAN.
  Learning reaches the ROADMAP only when `/plan/shard` reconciles at the next boundary. ROADMAP is
  reviewed at sub-track boundaries, PLAN at session boundaries; do not co-maintain them.
- **Sub-tracks** are the composition unit above sessions: substrate + algorithms + optimizations +
  integrative writeup for one conceptually tight area, and the smallest unit that ships coherently.
  Boundaries are the natural stopping points. A project's macro-shape is a list of sub-tracks;
  sessions inside one are crisply known only after its substrate lands.
- **Session categories** differ in composition, so plan them differently:

  | Cat | Role | Composition |
  |---|---|---|
  | A substrate | defines the object, trait, or interface others sit on | strongly serial; costly to get wrong; over-specify up front; consider T0 design if its shape is non-obvious |
  | B algorithm | one self-contained algorithm on existing substrate | orthogonal to other algorithms; contract is the substrate interface |
  | C optimization | one layer on an existing algorithm | serial within an algorithm, orthogonal across them; never alters the baseline, which stays available for benchmarking |
  | I integrative | the sub-track's writeup and public form of its contracts | consistently under-scheduled; allocate at least a full session |

  Real parallelism comes from the orthogonality between categories, not from topical appearance.
- **Cross-session contracts** are how sessions compose. Compiler-enforced (types, traits) catch
  interface drift; test-enforced (KATs, monotonically growing, checked at every boundary) catch
  behavioural drift; prose-enforced (invariants in docs) catch invariant drift. They are not
  interchangeable. Each row freezes at least one. Substrate rows over-specify the interface: a
  method likely to be needed later goes in now. A prose contract must be named in the project's
  narrative document with its dependent sessions, or it will be violated.

## Horizons, participation, and delegation

- **Two horizons, one framework.** A PLAN is a bounded delivery commitment; a ROADMAP is an adaptive
  account of how such commitments serve a larger intent. Discoveries may add, remove, split, or
  reorder proposed future PLANs, so neither horizon is fixed. A standalone PLAN needs no one-node
  ROADMAP file.
- **Participation is a policy.** The default is that the user reviews and approves each new PLAN
  (the `/plan/shard` confirm-and-pause). The user may instead intend to delegate a wider bounded
  scope, up to a whole ROADMAP, when the result matters more than participation at every boundary.
- **Delegation envelope.** Authority and planning depth are independent. Describe a delegation by
  its intent and non-goals; deliverables and acceptance evidence; revision authority; resource and
  workspace limits; and return conditions. Approval belongs at the boundary of the delegated
  authority, not inherently at every session or document boundary. Record the intent and any
  proposed envelope in the PLAN's purpose, session detail, or `## Notes for executors`; no field is
  machine-interpreted, so a declaration expresses intent and binds no execution mode.
- **Evidence follows the deliverable.** Production code, a PoC, research, and diagnostic work carry
  different acceptance contracts. State each row's contract in its Session detail. A properly
  evidenced negative result can fulfil an experiment; unverified work is never a successful
  demonstration. A PoC may omit production requirements if it says so explicitly. No autonomy grants
  permission to misstate results or skip owed validation: report demonstrated results, residual
  uncertainty, and deferred production work separately.
- **Current limits.** The delegation model above is guidance, not runtime support.
  - `/plan/run` executes an already-sharded PLAN; it does not construct successive PLANs.
  - `/plan/shard` confirms its PLAN and ROADMAP writes and pauses for review; the final ROADMAP
    reconciliation has no automatic owner (see Sharding).
  - The execution driver gets no ROADMAP-write or sharding authority from this skill; agent roles,
    approval gates, tool permissions, and stop conditions apply unchanged.
  - `may-reshard` authorizes only its additive path (`execution.md`), not whole-ROADMAP delegation.
  - Execution's KAT, test, type, and commit requirements are code-oriented; a non-code row is not
    executable until those obligations are addressed for it.
  - If an intended envelope needs unsupported orchestration or an incompatible acceptance path,
    surface the mismatch. Do not skip a check, infer a permission, or claim the mode works.

## Sizing

Working context is sized against the scope of the work, the capacity of the context that will hold
it, the constraints of the model pipeline, and the size and complexity of the workspace. This holds
for a ROADMAP, an ordinary PLAN, and a sharded PLAN alike; there is no page or line target. Keep
summaries concise and scope bounded, but never drop a required contract or recovery record to meet a
length figure.

**Session size.** The default heuristic band is about 150–400 LOC across 2–4 files: a starting
point, never a target; the LOC figure follows from "one conceptual unit at the smallest size that
keeps it whole and its contracts sharp". Tune with five inputs and name each that drives a decision:

| # | Input | Direction |
|---|---|---|
| 1 | Ambient codebase complexity | higher → smaller |
| 2 | Irreducible complexity of the change (the FLOOR) | higher → larger; never fracture below it |
| 3 | Cost of a design error (change + chain) | higher → smaller |
| 4 | Correctness-criticality | higher → smaller |
| 5 | Inner-loop bandwidth (test-suite quality) | higher → smaller |

Make each commit as small as inputs 1, 3, 4, 5 want, never smaller than input 2.

- **One-line corollary.** If a row cannot be described in one commit-title-shaped sentence, it is
  more than one session. Split only at a contract-sharp boundary (one half freezes an interface the
  other consumes). When splitting or merging, state the lever that drove it.
- **Comparability floor.** Observations that must be compared with one another are produced in one
  session, because the measured environment can drift between sessions undetected. A measurement row
  may exceed the LOC band: the unit is the experiment, not the code that runs it. Split the harness
  as inputs 1/3/4/5 want; never split the measurement.
- **Footprint is not a tuning input.** Coherence (one unit, green) decides the boundary. Footprint
  (cost, step count, context use) is measured afterward and informs cost/value judgment only; never
  resize a correctly scoped commit because it ran expensive, and never excuse an oversized one
  because it passed.
- **Outlier check** before finalizing the list. Scan for: broad source/test coupling across
  unrelated modules in one row; a repeated mechanical move applied file by file that could be one
  bulk transform plus one verification row; a catch-all closing row bundling loose ends from earlier
  rows. Split the independently green parts out. Where a broad row is genuinely atomic (input 2
  dominates, e.g. a substrate rename), say so in its Session detail. This adds no table column.

## F/C selection (paired units)

After sizing a row, ask once more whether the project's coverage, typing, formatting, and
conformance rules are likely to produce a long compliance tail after the feature behavior is done.
This is qualitative; it is not a size threshold, a two-session tax, or a response to a cost warning.
Select feature/completion for a row only when both hold:

1. The compliance tail is material: closing branch cases, coverage, type strictness, and conformance
   is a substantially separate effort from implementing the behavior.
2. The intent is cleanly separable: design, observable behavior, and non-negotiable invariants can
   be written completely enough for a fresh context to close the tail without reinterpreting the
   feature.

State the reason in the row's Session detail. Do not select it for small or tightly steered rows,
for a merely expensive row, or for an unfinished, intricately coupled design that cannot be
faithfully written down: that stays single-stage. Marking, appendix, and `## Completion handoffs`
requirements are in `paired-units.md`; load it when a row is selected.

## ROADMAP construction (`/roadmap/construct`)

Construction is a dialogue, not a procedure: the project's constraint surface is discovered and
articulated here, not applied, so it resists templating. Read any named source first (the supplied
input may be empty, a one-line intent, or a path to a design doc, an `IDEAS.md` entry, or an
exploration note). Hold the downstream loop in view, since the ROADMAP must give it
something to slice, execute against, and reconcile back into: `/plan/shard` slices a sub-track;
`/plan/run` executes it; junctures adjudicate what execution learns; `/plan/shard` folds it back.

Surface, roughly in this order and following the intent where it leads:

1. **Design intent** in one prose paragraph, written to be re-read at every boundary as the
   anti-defocus anchor. The most load-bearing artifact: make it sharp.
2. **Sub-track decomposition** as a DAG with named dependency edges. Do not decompose into sessions;
   that is premature until each substrate is known and is `/plan/shard`'s job.
3. **Substrate**: what exists, what must be built first, which sub-track is the irreducible
   foundation.
4. **Coarse cross-track contracts**, frozen precisely later per sub-track.
5. **Scope, sequencing, cost-of-wrong texture** (correctness-criticality, design-error cost), which
   informs commit-size tuning at shard time.
6. **Open questions and risks** seeding the Discoveries log.

Use the Question tool for load-bearing choices (sub-track boundaries, dependency edges, the
substrate), not silent decisions.

Output: show the proposed `docs/ROADMAP.md` (shape in `plan-format.md`) as a fenced block; confirm
via the Question tool before writing; write it and pause for review; suggest the first `/plan/shard`
invocation. Writes are limited to `docs/ROADMAP.md` (and, on approval, an `IDEAS.md`/NOTES capture).
Never shard, execute, or commit code.

Three questions stay open; do not resolve them here. Surface evidence bearing on them as a
`CAPTURE-CANDIDATE` for the `IDEAS.md` "Agent hierarchy" theme: whether the iterate loop should
become one mechanized control structure; reusable parameterized sub-track graph patterns; how
juncture judgment inside the loop may alter the loop's future.

Exit report: source used; sub-track count, DAG shape, substrate sub-track; contracts sketched and
open questions seeded; capture candidates; the suggested first `/plan/shard` invocation.

## Sharding (`/plan/shard`)

Turns a ROADMAP, prose plan, or design statement into the executable `docs/PLAN.md`, then pauses for
review; it never runs `/plan/run`. The command selects `@architect`; the judgment register expects
T0. Never executes a session, never runs the VERIFY gate beyond discovery, never commits code.

**Entry mode.** State which applies before proceeding:

1. *From a roadmap/prose file*: the supplied input names a path; a second token names the
   sub-track to shard, defaulting to the next un-started one.
2. *Re-shard/edit an existing structured PLAN* that is stale, mis-sized, or pre-dates the current
   sizing: read it and the ROADMAP; revise in place.
3. *Greenfield*: no argument and no artifact. Elicit design intent, first sub-track, the substrate
   it sits on, and rough scope interactively, as a dialogue; build the PLAN from the conversation.
   Surface a `CAPTURE-CANDIDATE` if the design statement itself belongs in a ROADMAP.

**Reconcile the ROADMAP first.** Sharding a sub-track is a sub-track boundary, and `/plan/shard` is
the one point that folds the action frame into the ROADMAP (execution and junctures write only to
PLAN). Skip in greenfield mode or when no ROADMAP exists. Otherwise, when a prior sub-track's PLAN
is present:

1. Mark the just-completed sub-track `done` using the prior ledger as the source of truth. Every row
   must be `done` or an authorized `skipped` (only a `(skippable)` row), and the applicable boundary
   and final checks must be complete (per the ledger's boundary notes, gate-evidence block, and
   pending-checks summary in `plan-format.md`);
   otherwise mark it partial and name the stopping row.
2. Fold roadmap-durable discoveries (cross-track contract changes, scope shifts, substrate facts)
   into the ROADMAP's Discoveries log; leave sub-track-internal resolved ones behind. Re-read the
   design intent and note any drift the discoveries imply.
3. Mark the sub-track being sharded `in progress`.

Bound this to the status/discovery delta; it is not continuous co-maintenance. It sits behind the
same confirm-before-write gate as the PLAN write: show the proposed ROADMAP diff first.

**Retain before replacing.** The prior PLAN is replaced at a boundary. Before that, every item that
is not yet reconciled must be resolved or carried into the new PLAN: pending ledger rows, handoff
entries not `consumed`, deferred checks and their next checkpoints, discoveries not yet folded into
the ROADMAP, and unresolved boundary-note items. A PLAN or ROADMAP is retired only once it is
executed and reconciled and no such item remains; a replacement never silently drops one.

**Limit.** Nothing guarantees a later `/plan/shard` after the final sub-track, so the final ROADMAP
reconciliation has no dedicated automatic owner, and the execution driver may not write the ROADMAP.
Say so when a PLAN is the last; never claim the reconciliation happened by itself.

**Survey** the codebase before sharding: expected-files must name real paths and contract freezes
depend on the actual substrate. Fork `@explore` when the tree is large or unfamiliar and the survey
would pollute planning context (ask for layout, files each planned session touches, and existing
interfaces the new contracts consume; compact map back); go inline when small or already held. Skip
in greenfield when no code exists.

**Size and select** per Sizing and F/C selection above. Apply the three contract flavours
deliberately.

**Produce** `docs/PLAN.md` in the shape in `plan-format.md`, including: tier marking (a T0 row gets
the `@architect` inflection marker); the default `Anneal cleanup (skippable)` row; a `## Completion
handoffs` section only when some row is `(F/C)`; `## Verify gate` discovered, with a project's
declared cadence copied by reference to the project's authority document (never invented or tuned
here; a combined command stays one gate unless the project splits it); and `## Notes for executors`
with the anneal denylist copied from `artifact-hygiene.md` and tuned.

**Interactivity.** Steering is high. Use the Question tool or confirm before writing for: session
boundaries and any split/merge with its driving lever; tier assignments with lever reasoning;
contract freezes and who consumes them; the VERIFY gate when discovery is ambiguous. Greenfield is
one dialogue: elicit intent → propose sub-track decomposition → confirm → shard → review.

**Output and handoff.**

1. Show the proposed ROADMAP reconciliation diff (if any) and the proposed PLAN (or PLAN diff in
   re-shard mode) as fenced blocks.
2. Confirm via the Question tool before writing either; the write is a checkpoint, not a unilateral
   act.
3. Write the ROADMAP (if reconciled), then the PLAN. Pause for review. Do not run `/plan/run`.
4. Seed the project's `AGENTS.md` with the register rule per `artifact-hygiene.md`, behind the same
   confirm gate (a prompted write outside `@architect`'s auto-allowed docs).
5. Surface any durable roadmap-level fact not already folded in as a `CAPTURE-CANDIDATE` for the
   ROADMAP or NOTES.

Writes are limited to `docs/PLAN.md`, the boundary reconciliation of `docs/ROADMAP.md` (on approval,
plus any roadmap/NOTES capture), and the `AGENTS.md` seed. All other writes are disabled per
`@architect` permissions. Do not assume project tooling (`make`, `origin`, layout); discover it.

**Exit report:** entry mode; ROADMAP reconciliation (sub-track marked done plus discoveries folded,
sub-track marked in progress, or "none (greenfield / no roadmap / no prior PLAN)"); session count,
sub-track(s) sharded, `◆` and inflection markers placed; each `(F/C)` row with its reason; each
split/merge with its lever; any retained prior-PLAN items; capture candidates; the suggested
`/plan/run` invocation (`halt-at-boundaries` for an unproven shard pattern).
