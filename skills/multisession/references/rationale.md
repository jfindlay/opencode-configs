# Rationale

Optional. Explains why the multisession workflow is shaped as it is. It states no rule: every
operative rule lives in the resource that owns it (`planning.md`, `plan-format.md`, `execution.md`,
`paired-units.md`, `verification.md`, `artifact-hygiene.md`), and nothing here grants execution
authority or overrides a tier. Figures marked *calibration* are observed starting points from past
projects, not requirements. Load this for explanation or planning questions that need the
derivation, not for a run.

## The commit-shaped session

A good commit and a good session share one shape: a single coherent narrative another reader, the
future maintainer or the next session, can pick up cold. A commit message that needs three other
commits to make sense marks a session whose work did not land cleanly, hence the one-line-title
corollary.

The cost of session size is U-shaped. Too small and the fixed warm-up of loading context is not
amortised; too large and the session pays quadratic cache-read accumulation, a compaction event, and
loss of exactly the design context it most needs. Trimming always-injected base context lowers the
warm-up term and moves the optimum toward smaller sessions, so context-trimming and commit-shrinking
compound. *Calibration:* an earlier rho-crate arc ran about 400–1000 LOC over 4–7 files per session,
near the top of what a coherent context holds without compaction; the 150–400 LOC default is
deliberately smaller.

**The five inputs.** Four push smaller and one pushes larger, so tuning is a tension between the
irreducible floor and four downward pressures. Inputs 3 and 4 (cost of being wrong) are the same
lens that routes tier, so commit-size tuning and tier routing are one decision at two levels: high
cost-of-wrong pulls toward smaller commits and higher-tier review for the same reason. Input 5 (test
quality) was missing from the first calibration and is load-bearing: tests are the inner control
loop, so a weak suite cannot safely carry dense small commits however much the other inputs want
them.

**Comparability.** Measurement-shaped work has a second floor: the measured environment can drift
between sessions in ways the plan cannot detect and the inner loop cannot catch. The drift is
usually already a risk-register halt condition, so that entry doubles as a floor-raising input.
Harness code has a fast deterministic inner loop and may be split finely; measurement output has
none, and its only integrity guarantee is single-environment observation.

**Coherence versus footprint.** Footprint is dollars, API steps, and messages; capacity is an
*estimate* of how much of the usable window the latest completed request occupied (not lifetime
token sum); integrity is the qualitative question of whether reasoning still tracks verified current
facts, which no number replaces. Each stays distinct. There is no universal threshold: a warning
prompts reassessment, not a verdict that the session was run wrong, and measuring is cheap and
orthogonal to any response mechanism.

## Two frames

The **static frame** (ROADMAP view) sees a DAG: sub-tracks as nodes, dependencies as edges. Its
metrics (session count, critical path, cross-track contracts) serve scope, sequencing, pacing, and
resource decisions, and are useless for "what should this session do". The **action frame** sees a
state machine: contracts the session consumes, contracts it will produce, and local knowledge that
may invalidate the roadmap. It serves implementation and local design, and is useless for scope.
The metrics are partially incompatible, so the transform between them is non-trivial:

1. The static frame is updated by the action frame, not the reverse. The roadmap is a prediction;
   sessions are the reality.
2. The action frame is constrained by the static frame only at sub-track boundaries, or when a
   discovery forces re-evaluation.
3. An inflection or boundary review is not a status report; it is where the transform is performed,
   consuming action-frame state and producing static-frame updates.

A juncture can be *paged* (a fork at the moment) rather than *resident* (a continuously running
`@architect`) only if the action frame is externalized as a written digest, since a fork sees only
what is written down. A paged return is one-shot; anything needing human sign-off is a
recommendation for the pager to surface. Resident context is higher fidelity but keeps the expensive
tier present for every mechanical iteration; for long chains the digest-and-fork route is the
practical one, with a lossier action frame as its cost. Mechanical steps (running tests, grepping,
diffing, writing ledger rows) are frame-free and belong at the cheapest competent tier; fusing them
with transform judgment makes the expensive tier run every iteration to access judgment needed only
at junctures.

**Adjudicator tier.** The juncture adjudicator is fixed at T0. Its work (interface design,
contract-invalidation adjudication, frame transforms) is the highest-judgment in the chain and is
done cold from a written digest, where a stronger model extracts the most from lossy context.
Junctures are rare (*calibration:* 5–10 per ~70-session project) and short, so the cost is small
against an uncaught contract drift: tier the rare high-stakes fork up, never the frequent mechanical
worker. The interactive deriver of a plan may sit at a different tier; this grants no override.

**Practical consequences.** Keep ROADMAP and PLAN separate (otherwise the roadmap goes stale within
weeks or the PLAN loses long-term scope). Review the ROADMAP at sub-track boundaries and the PLAN at
session boundaries; the cadences do not mix. When a question feels stuck, name the frame: "what
should this session do?" is action-frame, "should we still be on this track?" is static-frame.

## Control loops

A multisession is a cascade, not one slow human-gated loop. The **inner loop** is the test suite
plus the green-commit boundary firing every session: fast, high-bandwidth, stabilising, and what
makes small dense commits safe. The **outer loop** is the juncture forks, every 5–15 sessions: low
bandwidth, but its job is to re-tune the plan when code-reality diverges from the roadmap. This is
the fast-rate-damping-inside-slower-guidance shape of fighter avionics. Commit-size aggressiveness
is bounded by inner-loop bandwidth (input 5 in control terms). The warning that survives: a system
tuned near the edge of stability is safe only when the controller outpaces the divergence. The inner
loop is fast enough to earn aggressive tuning; the outer loop is not. So adaptation the inner loop
cannot catch, anything that invalidates a frozen cross-session contract, is never ridden through
unadjudicated: it goes to a juncture fork, and an irreconcilable one halts for a human.

## Fiduciary latitude

Accepting a sharded PLAN, mechanically by invoking `/plan-run`, accepts the whole implementation
path-space the enrolled agents judge best, not a line-item contract. Engineering is the work of
wresting legibility, durability, and stability out of natural resources: a Chesterton fence here, a
gauge on noise there, a map of the approximately linear region within a contradictory reality;
epistemologically, the quantification of error. The agents hold latitude and the predicated trust to
fiduciary fidelity to the PLAN so they can do that work. This is why discovery adjudication exists:
the PLAN is a prediction. Hence halts are reserved for the irreconcilable, and a juncture's first
job at any potential halt is to reconcile the situation against the PLAN's provisions,
anticipations, and quantifications. Happy-path touchpoints (derivation, initialization, review)
already carry enough structure to report deviation without a mid-chain halt.

**Defocus versus rigidity.** Defocus is the project losing cohesion as ideas accumulate without
integration; rigidity is ignoring useful discoveries because "it wasn't in the plan". The ROADMAP's
design intent anchors against the first, re-read at every boundary; new mid-session ideas go to the
discoveries log and are evaluated at the next boundary, not absorbed. The discovery channel corrects
the second: a substrate found wrong is surfaced, not ground through; "the plan was wrong about X" is
a successful outcome. The narrative document (PEDAGOGY.md or equivalent) is where the two frames
meet: written from the action frame, shaped by the static frame's intent, and the re-reading that
catches both failures.

## Cross-session contracts

Compiler contracts are rigid (adding to a trait invalidates downstream sessions), so substrate rows
over-specify. Test contracts grow monotonically, so a session that breaks an earlier KAT has broken
the contract, and a deliverable that cannot be a KAT has an undefined contract. Prose contracts are
weakest because nothing enforces them. Example: the rho walk-state invariant `W = a·G + b·Q` was a
prose contract held across five sessions, including a cross-cutting refactor that kept it across a
batched group of walks. Using only compiler contracts over-engineers abstractions; only tests makes
brittle tests; only prose makes unenforced wishes.

## Delivery unit versus execution context

Delivery unit (one concept, green, one commit and ledger row) and execution context (one forked
session with one continuous working memory) ordinarily coincide. Some units carry a long compliance
tail (coverage, typing, lint, conformance) that is separable, mostly mechanical grind once the
intent is written down; requiring the unit and context to stay one-to-one then produces a long tail
session with escalating, even divergent, token cost as the agent chases every affected code path at
the end of an exhausted context. F/C splits the contexts, not the unit.

**Cold handoff versus warm resumption.** An *uncontrolled* cold handoff (a session ends mid-thought,
in flight, and a fresh fork reconstructs intent from the working tree alone) loses precisely the
design context the handoff most needs. The escape for non-separable work is warm resumption: the
same subagent continued with its context intact, so no boundary is smeared and the commit boundary
stays sharp. A *planned* F/C handoff is the narrow controlled exception: F reaches a designed
stopping point and writes a complete intent capsule first, so C is cold with respect to F's
conversation but warm with respect to its intent. The distinguishing question: is the reasoning
separable with written intent, or non-separable feature reasoning still in flux? Unfinished,
intricately coupled design stays with the feature agent; F/C must not become a cost-driven excuse to
cold-transfer an unresolved design, and warm resumption must not be used to avoid writing the
capsule when the tail really is separable. The operative boundary is also summarized in
`AGENTS-SUBAGENT-STRATEGY.md`.

**Warm resumption is deferred** machinery (a measured context-fill signal driving a commit-or-resume
decision). Small-commit discipline is the primary windowing mechanism and, for a well-kept codebase
(coherent structure, trustworthy tests), usually sufficient. It strains only where the irreducible
change is large and cannot be reduced: intricate refactors, legitimately intricate algorithms,
spaghetti codebases. Building the machinery before small-commit discipline is shown insufficient is
instrumenting a cliff already engineered around.

## Gate cadence

A green boundary does not require every expensive check to run at every boundary, or twice because
two agents touched the unit. Where a project declares a cadence, the chain separates the per-unit
gate, boundary checks, and freshness checks, and accepts evidence only when the record's identity,
environment, and log still match the tree recomputed now. The tradeoff is deliberate: per-unit
behavioural checking is preserved, regressions a boundary check would catch surface at the next
boundary, and security freshness is bounded by a stated interval rather than re-proved every unit.
It is opt-in, so an undeclared project keeps every-unit gating.

## Register discipline

Plan coordinates are printer's registration and cut marks: load-bearing while the defining document
is present, noise once the arc ends and the PLAN is archived. A post-arc maintenance agent is served
by the annealed code, tests, and docs just as a human is; a mid-arc agent whose dispatch names the
invariant directly loses nothing by not seeing the session id. The mechanism is hybrid so the anneal
stays a near-no-op verification rather than a large end-of-arc strip diff: in-process prevention
(the REGISTER block), a per-sub-track gate (grep plus triage before the boundary fork), and the
fork's independent reading for planning references, because a clean grep proves only that its
patterns found nothing. The project `AGENTS.md` seed carries no PLAN/ROADMAP pointer (neither
outlives the arc) and no denylist (the gates read PLAN's), and is excluded from sweeps because it
names the vocabulary it prohibits. The denylist aims at coordinates, not domain terms: "KAT" is
legitimate in a crypto library, `\bS4\b` as a session id is not.

**Claim verification is not annealing.** A coordinate denylist catches leaked planning vocabulary,
not obsolete assertions in ordinary domain language. Motivating case: a claim about a norm map
survived in unchanged prose after a claims-correction sub-track although the new tests refuted it;
nothing the grep looks for would have caught it, and no changed line contained it. The cost is
semantic review, so it is limited to claims the sub-track affected and adds no verdict, phase, or
loop.

**Line length** is deferred because re-engaging a spent session to rewrap a few lines re-reads and
re-bills its whole history for a cosmetic change. A plan that stayed clean pays nothing for the
safety net, since the cleanup row is skippable.

## Why ROADMAP construction is not mechanized

It is abductive: it articulates the problem's actual shape rather than applying a known one, and a
declarative config for "discover what the config should contain" would be circular. Whether the
iterate loop should become one control structure, whether sub-track graph patterns are reusable
(n=1 so far), and how juncture judgment may alter the loop's future are left uncaptured pending more
observed arcs.

## Pacing and project shape (*calibration*)

Substrate sessions often take 1.5–2× a typical one because the design surface is wide. Algorithm
sessions settle into a rhythm; resist combining them. Integrative sessions are consistently
under-scheduled because they give contracts their public form and name invariants in prose for the
first time. Inflection reviews are rare (5–10 per ~70-session project) but expensive in real time;
do not slot them into a free evening. A ~70–90 session project is often a 3–5 session foundation,
4–6 sub-tracks of 10–15 sessions, and 2–4 cross-track integration sessions, constrained more by the
user's focus time than by throughput: session count is the scope metric, sessions per week the
schedule metric, and their product the schedule estimate.

## Open design

Not designed here, and reported rather than patched when found: a guaranteed owner for the final
ROADMAP reconciliation after the last sub-track; an exhaustive statement of every frozen-contract
flex a fork may authorize; scheduler-level resumption machinery.
