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
deliverable**. The defining property is *not* a LOC count — it is **one conceptual unit, ending
green**:

- Completing exactly one conceptual unit — one algorithm, one optimization layer, one mathematical
  object, or one substrate trait
- Plus tests (KATs at minimum; property tests where natural)
- Plus benchmarks where the work has a quantitative claim
- Plus one chapter or section of narrative prose (PEDAGOGY.md or equivalent)
- Ending with green tests

**Default size: ~150-400 LOC, touching 2-4 files** — smaller than the original rho-crate
calibration (~400-1000 LOC, 4-7 files), and deliberately so. The original range sat near the top of
what Sonnet's coherent-context window can hold without compaction; the smaller default keeps each
session well inside the window, makes the green-commit checkpoint denser, and makes reverts finer
grained. **This is a default, not a fixed range** — the commit-size tuning law below adjusts it up
or down per project. The LOC figure is a consequence of "one conceptual unit at the smallest size
that keeps the unit whole and the triple-contract sharp," never a target in its own right.

Smaller is wasted session overhead (the warm-up cost of context-loading isn't amortised). Larger
overflows Sonnet's coherent-context window and forces compaction, which loses precisely the design
context the session most needs to preserve. The cost curve in session size is therefore **U-shaped**
— too small fails to amortise fixed warm-up, too large pays quadratic cache-read accumulation plus a
compaction event plus lost design context. Trimming the always-injected base context (the system
prompt, the auto-loaded conventions file) lowers the warm-up term and **shifts the U's optimum
toward smaller sessions** — context-trim and commit-shrink compound rather than trade off.

**This is the planning currency.** Not LOC alone, not "tasks" alone, not hours. The commit-shaped
session is the unit at which work composes, fails, and resumes.

### Tuning the commit size: the five inputs

The default (~150-400 LOC) is a starting point. When `@architect` designs a specific multisession,
it tunes the commit window to the project using five inputs. Four of them push *smaller*; one — the
irreducible complexity of the change — pushes *larger* and acts as the floor. The tuning is the
tension between that floor and the four downward pressures: **make each commit as small as the four
pressures want, but never smaller than the irreducible conceptual unit.**

| Input                                          | Direction          | Why                                                                                                   |
|------------------------------------------------|--------------------|-------------------------------------------------------------------------------------------------------|
| 1. Ambient codebase complexity                 | smaller as it rises| spaghetti/intricate surroundings raise the cost of a large diff being wrong; small diffs localise blast radius |
| 2. Irreducible complexity of the change (FLOOR)| larger as it rises | the conceptual unit is genuinely big; forcing it smaller fractures it and re-introduces cross-session coupling |
| 3. Cost of a design error (change + chain)     | smaller as it rises| denser green checkpoints mean cheaper, finer-grained reverts when the plan was wrong                   |
| 4. Correctness-criticality of the application  | smaller as it rises| more frequent green gates and more review surface per unit of change                                  |
| 5. Inner-loop bandwidth (test-suite quality)   | smaller as it rises| trustworthy fast tests make small commits *safe*; weak tests force larger, conservative units          |

Two structural notes. **Inputs 3 and 4 are the cost-of-being-wrong axis** — the same lens that routes
agent tier (Opus when the cost of being wrong is high). Commit-size tuning is therefore the *same
decision* as tier-routing, one level down: high cost-of-wrong pulls toward both smaller commits and
higher-tier review, for the same reason. **Input 5 is the one the original calibration omitted** and
it is load-bearing: how aggressively you can shrink commits is gated by how fast and trustworthy the
test suite is, because the tests are the inner control loop (see below). A codebase with weak tests
cannot safely carry small dense commits, however much inputs 1/3/4 want them.

### The two-rate cascade: why small commits are safe

A multisession is a **cascaded control system**, not a single slow loop. Reading it as one slow,
human-gated loop leads to the wrong conclusion — that the system must be tuned conservatively because
the controller (the human at review) reacts only every several sessions. That misses the inner loop.

- **Inner loop — fast, stabilising.** The test suite plus the green-commit boundary, firing *every
  session*. High bandwidth: it catches behavioural divergence the moment a commit goes red. This is
  the loop that makes small, dense commits safe.
- **Outer loop — slow, adaptive.** The adjudicator forks (`@plan-juncture`) at inflection and
  sub-track boundaries, firing every 5-15 sessions. Low bandwidth, but its job is precisely to
  *re-tune the plan* when emergent code-reality diverges from the roadmap — the action→static frame
  update. This is genuine adaptive control, not a status report.

The cascade is the standard fast-inner-stabiliser / slow-outer-adapter architecture (the same shape
as fighter avionics: a fast rate-damping loop inside a slower guidance loop). The consequence for
tuning: **commit-size aggressiveness is bounded by inner-loop bandwidth.** A fast, trustworthy test
suite lets the inner loop catch drift before the outer loop has to, which licenses both smaller
commits and more aggressive adjudicator-driven adaptation. A weak test suite means the inner loop
cannot be trusted to stabilise, so commits must be larger and more conservative and the outer loop
carries more of the correction burden. This is input 5 of the tuning law, stated as control theory.

The warning that *does* survive: a system tuned to the edge of stability is safe only when the
controller outpaces the divergence. The inner test-loop is fast enough to earn aggressive tuning; the
*outer* loop is not. So adaptation that the inner loop cannot catch — anything that invalidates a
frozen cross-session contract — must still halt and surface to the human, never be ridden through.

### The sixth lever: adjudicator tier (Opus vs Sonnet at junctures)

The juncture adjudicator (`@plan-juncture`) defaults to Opus, because juncture work is the
*highest-judgment* work in the chain (substrate interface design, contract-invalidation
adjudication, static↔action frame transforms) and the conditions that make it risky are exactly the
ones where the stronger model earns its differential. The differential is also cheap: junctures are
rare and short (see below), so the default pays for the strongest adjudicator where a wrong call is
least recoverable. Opting *down* to Sonnet is the cost-mitigated compromise — safe because the
`destructive-HALT` invariant bounds a weaker adjudicator's downside to *over-halting*, which the
human catches and qualifies; waving a destructive change through is the only unrecoverable error,
and conservatism guards against it. Sonnet-at-junctures is a judgment-economised assignment, not the
judgment-matched default.

But the tier should be **tunable per chain**, governed by the *same five levers* as commit size,
because juncture tier is the same cost-of-wrong decision one level up:

- **Levers 1-4 hold the adjudicator at the Opus default exactly as they push commit size DOWN** —
  both are the cost-of-wrong response. High criticality (4), high design-error cost (3), intricate
  substrate (2), or spaghetti ambient code (1) are the cases where a wrong adjudication is least
  recoverable and the cold-fork reasoning is hardest, so the strongest adjudicator earns its
  differential there and the default stands.
- **Lever 5 (test-suite quality) is the asymmetry: it is the one lever that justifies opting DOWN to
  Sonnet** while it also pushes commit size down. A strong inner loop catches contract drift
  behaviourally, so a cheaper outer-loop adjudicator's misses are caught downstream — strong tests
  let you economise on *both* commit size and adjudicator tier. Test quality is the one lever that
  buys you a cheaper adjudicator; the other four only buy you smaller commits.

Two facts make the differential cheap to pay when the levers call for it. Junctures are **rare**
(5-10 per ~70-session project) and **short** (one-shot returns, ~8-13K output), so the Opus-vs-Sonnet
delta is single-digit dollars across an entire project — negligible against the cost of one
un-caught contract drift. And a juncture works from a **written digest, not lived context**: a
stronger model extracts more signal from a lossy externalised action frame, so the exact condition
that makes junctures risky (cold fork, thin context) is where Opus's marginal advantage is *largest*.
Tier the rare high-stakes fork up; never tier the frequent mechanical worker up — that is where Opus
is genuinely wasted.

Default: Opus. Opt down to Sonnet (`@plan-juncture-sonnet`) when the levers permit — most clearly
when strong test-suite quality (trustworthy inner loop) coincides with lower correctness-criticality.
The tier is selected per chain via the `juncture-tier:` field in the PLAN header (absent or `opus`
keeps the default; `sonnet` opts down), not hardcoded in the agent's frontmatter.

### The deferred fallback: warm resumption for non-garden codebases

Small-commit discipline is the *primary* windowing mechanism, and for well-maintained codebases (a
"garden" — coherent structure, trustworthy tests) it is usually sufficient on its own: the conceptual
unit fits comfortably inside a small commit and a healthy context window, and no further machinery is
needed.

It breaks down where input 2 (irreducible change complexity) is large *and* cannot be reduced:
intricate refactors, legitimately-intricate algorithms, buggy or spaghetti codebases. There the
conceptual unit genuinely exceeds a healthy single-session window, and shrinking the commit would
fracture the unit — Cartesian-producting complexity across artificially-split sessions whose
boundaries are not contract-sharp.

The escape for those cases is **warm resumption**, not sub-commit cold handoff. The distinction is
load-bearing. A session that ends with *uncommitted, in-flight* changes handed to a *fresh* (cold)
fork has no enforced boundary — the next session must reconstruct intent from the working tree alone,
which is exactly the design context a cold handoff loses. But a subagent can be *resumed* (continued
with its prior context intact, via its task id) rather than cold-forked. Warm resumption removes the
boundary instead of smearing it: there is no cold handoff because it is one session that has not
committed yet. The commit boundary stays sharp (still only commit green, conceptual-unit-complete
states); what flexes is how many resumption turns the worker takes to reach it, with `@plan-admin`
deciding at each pause — on a measured context-fill signal, not a guess — whether to commit-and-close
or resume-with-more.

This fallback (and the context-fill instrument it depends on) is **deliberately deferred** until
small-commit discipline is shown to be insufficient for the codebases actually in scope. Building it
before then is instrumenting a cliff the small-commit discipline has already engineered around.

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
- Worth `@architect` judgment if substrate shape is non-obvious.

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
- `@architect` sessions (predicts cost)

This is the view from outside time. It is correct at any moment — the graph doesn't change much
between days. Useful for:

- Scoping decisions ("can we afford the full scope?")
- Sequencing decisions ("which track first?")
- Pacing decisions ("are we on schedule?")
- Resource allocation ("which sessions need `@architect`?")

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

3. **Mid-project `@architect` reviews are inflection points, not snapshots.** They live in both frames
simultaneously: they consume the action-frame state (what was just learned) and produce static-frame
updates (revised roadmap, revised contracts, revised sub-track ordering). Treating a `@architect` review
as a status report misses its actual function. It is the moment where the coordinate transform is
performed.

   An inflection review can be *paged* (a forked subagent invoked at the juncture) rather than
   *resident* (a continuously-running `@architect` context), provided the action-frame texture is fed in
   as a written digest — because a forked subagent sees only what is written down, not what was
   experienced. The digest is the externalized action frame: not a transcript, but the minimum
   texture the juncture adjudicator needs that the static ledger rows don't capture. A paged
   inflection review returns one-shot (forks cannot hold an interactive loop); anything needing
   human sign-off is returned as a recommendation and surfaced by whoever paged the fork.

### Who holds the frame

The coordinate-transform judgment requires someone holding the action frame — what was learned, what
flexed, what the next few sessions need to know that isn't written in the plan. There are two ways
to provide this:

- **Resident context:** a continuously-running `@architect` session accumulates the action frame
  organically as the chain runs. The transform is high quality because nothing is lost. Cost: the
  expensive tier is present for every mechanical iteration, not just junctures.
- **Externalized digest + paged fork:** a cheap driver runs the mechanical loop and maintains a
  durable "action-frame digest" in the plan file — appended on non-trivial iterations (discoveries,
  contract flexes, notable texture). At each juncture, the digest is fed into a cold-forked `@architect`
  invocation. Cost: the digest is lossier than a live context; the fork's adjudication is only as
  good as what was written down.

The choice is a cost/quality tradeoff. For long chains (>20 sessions), the token cost of a resident
`@architect` context is substantial; the externalized digest is the practical option. For short or
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

## The fiduciary-latitude contract

User acceptance of a sharded PLAN — expressed mechanically by invoking `/run-plan` — is acceptance
of the *entire implementation path-space* the enrolled agents judge best, not a line-item contract
to be executed literally. Each agent is empowered to make the best possible choice among a
heterogeneous set of constraints (business demands, technical constraints, resource budget).

This is why the discovery-and-adjustment machinery and the juncture adjudication exist at all: the
PLAN is a prediction; the sessions are the reality that updates it. (This is the same point the
static-frame / action-frame transform makes — the static frame is updated by the action frame, not
the other way around. See [The coordinate transform](#the-coordinate-transform) above.)

The engineering framing worth stating close to verbatim, because it is the *why* behind the
latitude: engineering is the work of wrighting legibility, durability, and stability out of natural
resources — a Chesterton fence here, a gauge on noise there, a map of the approximately-linear
region within a fantastically contradictory reality. Engineering is epistemologically the
quantification of error. The agents hold latitude *and* the predicated trust to fiduciary fidelity
to the PLAN precisely so they can do this work.

The operational consequence: halts are reserved for the irreconcilable. Even medium deviation rides
through with commensurate evidence and justification, surfaced at the step-3 review — because the
happy-path touchpoints (PLAN derivation, initialization, review) already carry enough structure for
review agents to report deviation without a mid-chain halt. The juncture adjudicator's first job at
any potential halt is to reconcile the situation against the PLAN's provisions, anticipations, and
quantifications; it halts only when reconciliation fails.

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
- Discoveries that affect cross-track contracts deserve immediate static-frame review (a `@architect`
  session is appropriate here). Discoveries internal to a sub-track can wait until the boundary.
- "The plan was wrong about X" is a successful outcome of a session, not a failure. The plan was
  always a prediction; sessions are the data that updates it.

The fiduciary-latitude contract (see [The fiduciary-latitude contract](#the-fiduciary-latitude-contract)
above) is the foundational premise behind this correction: agents are empowered — indeed expected —
to act on what they learn, not to halt every time reality diverges from the roadmap. The
irreconcilable-only halt rule is what keeps that latitude from becoming defocus: deviation is
authorized, but only halts surface the cases that cannot be reconciled.

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

### `@architect` inflection points

Inflection-point `@architect` sessions are rare (5-10 across a 70-session project) but each is expensive
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
