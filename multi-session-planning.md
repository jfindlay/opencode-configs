# Multi-session planning for long-arc AI-assisted projects

A field manual for projects that run across many `@build` sessions over months. Written out of the
planning conversation for `rGNFS` (the DLP/ECDLP/GNFS reference-library project) and intended as a
durable reference for similar long-arc work.

This file is descriptive, not normative — it captures intuitions that worked, framings that
clarified hard decisions, and the two-frame relativity that is the most important thing to
internalise.

---

## The atom: the commit-shaped session

The atomic execution unit is **one `@build` or `@general` session producing one commit-shaped
deliverable**. Calibrated against the rho crate's git history, this is:

- ~400-1000 LOC of new code (Rust, in the calibration case)
- Plus tests (KATs at minimum; property tests where natural)
- Plus benchmarks where the work has a quantitative claim
- Plus one chapter or section of narrative prose (PEDAGOGY.md or equivalent)
- Touching 4-7 files
- Completing exactly one conceptual unit — one algorithm, one optimization layer, one mathematical
  object, or one substrate trait
- Ending with green tests

Smaller is wasted session overhead (the warm-up cost of context-loading isn't amortised). Larger
overflows Sonnet's coherent-context window and forces compaction, which loses precisely the design
context the session most needs to preserve.

**This is the planning currency.** Not LOC alone, not "tasks" alone, not hours. The commit-shaped
session is the unit at which work composes, fails, and resumes.

### Why commits and sessions align

This isn't an accident. A good commit and a good session share the same shape because both are
optimised for the same constraint: a single coherent narrative that another reader (the future
maintainer, the next session) can pick up cold. A commit message that requires reading three other
commits to understand is a bad commit; a session that requires reading three other sessions to
understand is a session whose work didn't land cleanly.

The corollary: **if a planned session can't be described in a one-line commit-title-shaped sentence,
it's not yet one session.** Split it until each unit has a clean title.

---

## Three categories of session, by orthogonality

Sessions sort into three categories with different composition properties. Treating all three the
same is the most common planning failure.

### Category A — substrate

Defines a new mathematical object, trait, or interface that subsequent sessions sit on. Examples:
the `Fp` trait; the curve group law; a number-field arithmetic library.

**Properties:**
- Strongly serial — nothing above can start until the substrate is solid.
- High cost to get wrong because rework propagates through every downstream session.
- Worth over-specifying up front. The first session should add interface methods it doesn't strictly
  need yet, if there's reasonable confidence downstream sessions will need them.
- Worth `@plan` judgment if substrate shape is non-obvious.

### Category B — algorithm

Implements one self-contained algorithm against existing substrate. Examples: Pollard rho for
factoring; the ECDLP baseline solver; a polynomial-selection algorithm.

**Properties:**
- Mutually orthogonal once substrate exists. Two algorithms over the same substrate can be
  implemented in either order or genuinely in parallel.
- Internally self-contained — tests pass or they don't; no cross-session contracts beyond the
  substrate interface.
- Sonnet-tier almost always. The judgment surface is constrained by the substrate.

### Category C — optimization layer

Adds one layer of optimization to an existing algorithm. Examples: distinguished-point parallelism
over an ECDLP solver; batched inversion; the GLV endomorphism.

**Properties:**
- Serial within an algorithm — Phase N optimization must follow Phase N−1.
- Orthogonal across algorithms — a Phase 7 optimization on ECDLP is independent of a Phase 2
  optimization on factoring.
- Reads the previous session's output; produces a new variant; **never alters the baseline**. The
  baseline must remain available for benchmarking the optimization.

### Implication for planning

A track in a multi-track project usually decomposes into: 1 substrate session, several algorithm
sessions, several optimization-layer sessions per algorithm, and one integrative-writeup session.
The orthogonality matrix between these is what determines real parallelism, not the apparent
parallelism of the topic.

---

## Sub-tracks: the composition unit above sessions

Sessions compose into sub-tracks. A sub-track is the smallest unit that can ship as a coherent piece
of work: substrate + algorithms + optimizations + integrative writeup, for one conceptually-tight
area.

In the rGNFS case, Pollard rho for ECDLP is one sub-track — Phase 0 (skeleton) + Phase 3 (curve
substrate) + Phase 4 (baseline) + Phases 5-8 (optimization layers) + Phase 9 (writeup), about ten
sessions total, shipping as a coherent artifact with its own benchmark suite and pedagogy chapter.

**Sub-track boundaries are the natural stopping points.** Mid-sub-track is a worse place to pause
because contracts are still in flux. Sub-track end is where you write PLAN.md handoffs, mark
progress, and decide whether to continue or pivot.

A project's macro-shape is best described as a list of sub-tracks, not a list of sessions. The
sessions inside a sub-track are usually only crisply known after the substrate session lands —
trying to specify all of them up front is premature.

---

## Cross-session contracts: the actual scaffolding

Sessions don't compose by sharing code; they compose by sharing **contracts**. Three flavours:

### Compiler-enforced contracts

Traits, interfaces, type signatures. The strongest kind — the compiler enforces that downstream
sessions consume the substrate correctly. Cost: rigid. Adding to the trait invalidates all
downstream sessions; the trait must be designed for stability.

Practical implication: substrate sessions should over-specify the trait surface. A method "we might
need later" should go in now if there's reasonable confidence; the cost of adding it later is higher
than the cost of carrying an unused method.

### Test-enforced contracts (KATs)

Known-answer tests that must continue to pass at every subsequent session. The KAT corpus grows
monotonically — a session that breaks a previous KAT has broken the contract. This is enforced by
`cargo test` at every session boundary.

Practical implication: each session must add at least one KAT for its new content. Sessions whose
deliverable can't be expressed as a KAT are sessions whose contract is undefined and whose
composition with subsequent work is at risk.

### Prose-enforced contracts (invariants)

Properties stated in comments and documentation that must be preserved across sessions. The weakest
kind because nothing automatic enforces them. Example from rho: the walk-state invariant `W = a·G +
b·Q` is a prose contract preserved across five sessions (Phase 4 through Phase 8), including a
cross-cutting refactor (Phase 7) that had to maintain it across a batched group of walks
simultaneously.

Practical implication: prose contracts must be named explicitly in the project's narrative document
(PEDAGOGY.md or equivalent), with a list of which sessions depend on them. A prose contract that is
never named is a contract that *will* be violated.

### The three flavours are not interchangeable

A successful multi-session project requires all three because each catches a different class of
cross-session drift. Compiler contracts catch interface drift; test contracts catch behavioural
drift; prose contracts catch invariant drift. Trying to do everything with compiler contracts
produces over-engineered abstractions; trying to do everything with tests produces brittle tests;
trying to do everything with prose produces unenforced wishes.

---

## The two reference frames

This is the most important section. Multi-session projects exist in two reference frames
simultaneously, and the metrics, perspectives, and review cadences in each are different.

### The static frame (roadmap-view)

Sees the project as a directed acyclic graph: sub-tracks are nodes, dependencies are edges, sessions
inside each sub-track are sub-nodes. Has well-defined metrics:

- Total session count (predicts schedule)
- Critical-path length (predicts minimum schedule)
- Cross-track contracts (predicts coordination cost)
- `@plan` sessions (predicts cost)

This is the view from outside time. It is correct at any moment — the graph doesn't change much
between days. Useful for:

- Scoping decisions ("can we afford the full scope?")
- Sequencing decisions ("which track first?")
- Pacing decisions ("are we on schedule?")
- Resource allocation ("which sessions need `@plan`?")

Useless for the question the current session is actually trying to answer.

### The action frame (riding-the-wave)

Sees the project as a multistate state machine. The current session has:

- Direct awareness of contracts it consumes (the immediate predecessors)
- Liminal anticipation of contracts it produces (what the next sessions will need)
- Local knowledge that may invalidate the static-frame roadmap

This is the view from inside time. The session in progress is not at a point on the Gantt chart; it
is *making the next state*. Useful for:

- Implementation decisions
- Local design tradeoffs
- Discovering information that should propagate back to the static frame
- Recognising when the work has diverged from the roadmap

Useless for scope and schedule decisions.

### The coordinate transform

The two frames have **different and partially incompatible metrics**, and the transform between them
is non-trivial. The static-frame metric "73 sessions to completion" is meaningful for scope
decisions and useless for "what should the current session do." The action-frame metric "what
contract am I currently establishing or consuming" is meaningful for the current session and useless
for end-date estimation.

The transform is non-trivial because:

1. **The static frame is updated by the action frame, not the other way around.** Discoveries made
during a session can change the substrate, change the contracts, change which downstream sessions
are needed. The roadmap is a prediction; the sessions are the reality.

2. **The action frame is constrained by the static frame, but only at sub-track boundaries.** Inside
a sub-track, the session does what the session needs to do; the static frame is consulted only when
crossing into a new sub-track or when a discovery forces a re-evaluation.

3. **Mid-project `@plan` reviews are inflection points, not snapshots.** They live in both frames
simultaneously: they consume the action-frame state (what was just learned) and produce static-frame
updates (revised roadmap, revised contracts, revised sub-track ordering). Treating a `@plan` review
as a status report misses its actual function. It is the moment where the coordinate transform is
performed.

   An inflection review can be *paged* (a forked subagent invoked at the juncture) rather than
   *resident* (a continuously-running `@plan` context), provided the action-frame texture is fed in
   as a written digest — because a forked subagent sees only what is written down, not what was
   experienced. The digest is the externalized action frame: not a transcript, but the minimum
   texture the juncture adjudicator needs that the static ledger rows don't capture. A paged
   inflection review returns one-shot (forks cannot hold an interactive loop); anything needing
   human sign-off is returned as a recommendation and surfaced by whoever paged the fork.

### Who holds the frame

The coordinate-transform judgment requires someone holding the action frame — what was learned, what
flexed, what the next few sessions need to know that isn't written in the plan. There are two ways
to provide this:

- **Resident context:** a continuously-running `@plan` session accumulates the action frame
  organically as the chain runs. The transform is high quality because nothing is lost. Cost: the
  expensive tier is present for every mechanical iteration, not just junctures.
- **Externalized digest + paged fork:** a cheap driver runs the mechanical loop and maintains a
  durable "action-frame digest" in the plan file — appended on non-trivial iterations (discoveries,
  contract flexes, notable texture). At each juncture, the digest is fed into a cold-forked `@plan`
  invocation. Cost: the digest is lossier than a live context; the fork's adjudication is only as
  good as what was written down.

The choice is a cost/quality tradeoff. For long chains (>20 sessions), the token cost of a resident
`@plan` context is substantial; the externalized digest is the practical option. For short or
high-stakes chains, resident context is worth the cost. When using the externalized-digest path, the
paged adjudicator need not be the same tier as the interactive plan-deriver — the digest and the
`destructive-HALT` invariant (always halts regardless of the fork's opinion) bound the downside of a
cheaper adjudicator to over-halting, which the user can qualify for a higher-tier dialogue, not to
silently waving through destructive changes.

In either case, the mechanical steps — running tests, grepping for KATs, diffing files, writing
ledger rows — are frame-free and belong at the cheapest competent tier, not with the adjudicator.
Fusing mechanical gating with coordinate-transform judgment is the failure mode that makes the
expensive tier run every iteration to access judgment needed only at junctures.

### Practical implications

- **Maintain both documents.** A long-arc roadmap (durable; lives for the project's life) and a
  rolling plan (current sub-track; rewritten at sub-track boundaries). Conflating them produces
  either a roadmap that becomes stale within weeks or a rolling plan that loses long-term scope.
- **Different review cadences.** The roadmap is reviewed at sub-track boundaries (every 5-15
  sessions). The rolling plan is reviewed at session boundaries (every 1-3 days of work). The two
  cadences don't mix.
- **Name the frame you're in.** When a question feels stuck, often the frame is wrong. "What should
  this session do?" is an action-frame question; "should we still be doing this track?" is a
  static-frame question. Mixing them produces paralysis or scope drift.

---

## Preventing defocus and scope wandering

The two threats to a long-arc project are equal-and-opposite:

- **Defocus**: the project loses cohesion as new ideas are added without the discipline to integrate
  them.
- **Rigidity**: the project ignores genuinely useful information discovered during execution because
  "it wasn't in the plan."

The static-frame roadmap is the anchor against defocus. The action-frame discoveries are the
correction against rigidity. Neither is sufficient alone.

### Anchoring against defocus

- The roadmap document names the original design intent in prose at the top. Every sub-track
  boundary, re-read the design intent and verify the work is still tracking it.
- New ideas discovered mid-session go into a "discoveries" appendix of the roadmap, not into the
  active sub-track list. They are evaluated at the next sub-track boundary, not absorbed
  immediately.
- Sessions that don't directly serve the design intent — "while I'm here" detours, gold-plating —
  are explicit risks. Name them and decide.

### Correcting against rigidity

- The action-frame discovery channel is real and must be respected. If session N discovers that the
  substrate session got something wrong, the right move is to surface it at the sub-track boundary,
  not to grind through with the wrong substrate.
- Discoveries that affect cross-track contracts deserve immediate static-frame review (a `@plan`
  session is appropriate here). Discoveries internal to a sub-track can wait until the boundary.
- "The plan was wrong about X" is a successful outcome of a session, not a failure. The plan was
  always a prediction; sessions are the data that updates it.

### The discipline

The project's narrative document (PEDAGOGY.md, or its equivalent for non-pedagogical projects) is
where the two frames meet. It is written from the action frame — what was actually done — but shaped
by the static frame's design intent. Re-reading it at sub-track boundaries is the operational
practice that catches both defocus and rigidity.

---

## Pacing

Sessions are not uniform in cost. Three pacing rhythms cover most variance:

### Substrate sessions: front-loaded

The first session in a sub-track (the substrate one) often takes 1.5-2× the time of a typical
session because the design surface is wide. Plan for this; don't compress.

### Algorithm sessions: rhythm

Algorithm sessions within a sub-track usually settle into a rhythm — each one takes about the same
time. This is the productive middle of a sub-track. Resist the temptation to combine them.

### Integrative sessions: under-scheduled

The integrative writeup at the end of a sub-track (the PEDAGOGY chapter) is consistently
under-scheduled. It is not just summarising; it is the moment where the sub-track's contracts get
their public form, where invariants get named in prose for the first time, where the cross-track
implications are surfaced. Allocate at least a full session, sometimes more.

### `@plan` inflection points

Inflection-point `@plan` sessions are rare (5-10 across a 70-session project) but each is expensive
in real time even though their session count is small. They consume the previous N sessions' output,
produce updates to multiple documents, and shape the next M sessions. Don't try to slot them into "a
free evening."

---

## Cumulative project shape

For a project with ~70-90 sessions:

- Foundation (3-5 sessions): substrate setup, shared crates.
- 4-6 sub-tracks of 10-15 sessions each: the bulk of implementation.
- Cross-track integration (2-4 sessions): contracts that span tracks, umbrella narrative.

This is 9-13 months at one session every 3-5 days, or 18-26 months at one session per week. The rate
is constrained more by the user's available focus time than by AI throughput. The static frame's
session count is the right scope metric; the user's session-per-week rate is the right schedule
metric; their product is the right schedule estimate.

---

## What this file is and isn't

It is descriptive: it names patterns that worked in actually-running long-arc projects, and offers
vocabulary for talking about the choices a planner faces.

It is not prescriptive: every project has its own substrate, its own contracts, its own discoveries.
The categories and frames here are scaffolding for thinking, not a methodology to follow.

It will be updated. As more long-arc projects run, the patterns above will sharpen or be replaced.
The two-frame relativity is the part I expect to survive longest because it is structural, not
contingent on the current tooling.
