---
description: "[jf] Shard a roadmap, a prose plan, or an in-session design statement into a /plan-run-executable docs/PLAN.md: session list (one commit-shaped session per row), cross-session contracts, progress ledger, and action-frame digest. First reconciles docs/ROADMAP.md at the sub-track boundary (mark prior sub-track done, fold its discoveries up, mark the next in-progress). Applies the five-input commit-size tuning law. This is the SHARDING step /plan-run refuses to do; it does NOT execute the plan. Args: [roadmap-or-plan-path] [sub-track]."
agent: architect
subtask: false
---

# /plan-shard

Turn a long-arc design into the executable form `/plan-run` consumes. The output is a
`docs/PLAN.md` in session-list form per `~/.config/opencode/multisession/multi-session-planning.md`.
This command produces the shards and pauses for review; it never runs `/plan-run` itself (executing
is a separate, `@plan-admin` action).

Runs from `@architect` (Opus 4.8): sharding is the same high-judgment interface-and-contract design the
inflection juncture does — session boundaries, contract freezes, and tier selection.
If invoked from a different agent, note that the judgment register expects Opus and proceed only if
the user confirms.

Source (optional): $ARGUMENTS

## Three entry modes

Resolve which one applies before doing anything else.

1. **From a roadmap/prose file.** `$ARGUMENTS` names a path (`docs/ROADMAP.md`, an old prose
   `docs/PLAN.md`, a design doc). Read it. A second token, if present, names the sub-track to shard
   (e.g. `G.A`); default to the next un-started sub-track.
2. **From an existing structured PLAN.md (re-shard/edit).** `docs/PLAN.md` already has some of the
   `/plan-run` sections but is stale, mis-sized, or pre-dates the current tuning law. Read it and
   the roadmap; revise in place rather than regenerate.
3. **Greenfield, no artifact.** `$ARGUMENTS` is empty and no roadmap/plan file exists (or the user
   says so). Elicit the design statement interactively: ask for the design intent, the sub-track to
   shard first, the substrate it sits on, and the rough scope. Build the plan from the conversation.
   Surface a `CAPTURE-CANDIDATE` if the design statement is itself worth preserving to a roadmap.

State which mode you are in before proceeding.

## Reconcile the roadmap first (sub-track-boundary update)

Sharding a sub-track *is* a sub-track boundary, and the boundary is the roadmap's prescribed review
cadence (`multi-session-planning.md`: the static frame is updated *by* the action frame, reviewed
every 5–15 sessions at sub-track boundaries — never co-maintained with the rolling PLAN, whose
cadence is per-session). Nothing downstream keeps `docs/ROADMAP.md` current: `/plan-run` and
`@plan-juncture` write only to `PLAN.md`. So `/plan-shard`, running at the boundary, is the chain's
one point that folds the action frame back into the static frame. Do this *before* sharding the next
slice, so the next shard derives from a current roadmap.

Skip in greenfield mode (no roadmap to reconcile yet) and skip if no roadmap file exists. Otherwise,
when a prior sub-track's `PLAN.md` is present (it just completed, or you are re-sharding):

1. **Mark the just-completed sub-track `done`** in the roadmap's sub-track list/status, using the
   prior `PLAN.md` progress ledger as the source of truth (all rows `done` → sub-track done; partial
   → mark partial and name the stopping row).
2. **Fold discoveries back.** Copy the prior `PLAN.md` `## Discoveries & risks` entries that are
   roadmap-durable (cross-track contract changes, scope shifts, substrate facts) into the roadmap's
   Discoveries log. Leave sub-track-internal, already-resolved discoveries behind — only static-frame
   facts propagate. Re-read the roadmap design intent and note any drift the discoveries imply (this
   is the defocus check the manual prescribes at every boundary).
3. **Mark the sub-track being sharded `in progress`** so the static frame reflects the live work.

This is a discrete boundary step, not continuous roadmap co-maintenance — keep it bounded to the
status/discovery delta. It is gated by the same confirm-before-write checkpoint as the `PLAN.md`
write (see Output and handoff): show the proposed ROADMAP diff and confirm before writing.

## Survey the codebase first (fork when it pays)

The session list's **expected-files** column must name real paths, and contract freezes depend on
the actual substrate. Survey the layout before sharding:

- **Fork `@explore`** when the tree is large or unfamiliar and the survey would pollute the planning
  context (pollution=YES, steering=NO) — e.g. a multi-crate workspace where you need the module map
  and existing trait/interface surfaces. Pass the working directory and ask for: the crate/package
  layout, the files each planned session would touch, and the existing interfaces the new contracts
  consume. Return a compact map to the primary.
- **Inline** when the tree is small or you already hold it in context.

Skip entirely in greenfield mode if no code exists yet (expected-files name files-to-be-created).

## Apply the commit-size tuning law

Per `multi-session-planning.md`, size each session at the smallest unit that keeps one conceptual
unit whole. Default band: **~150–400 LOC, 2–4 files**. Tune with the five inputs, naming each:

1. Ambient codebase complexity (↑ → smaller).
2. Irreducible complexity of the change (the FLOOR — ↑ → larger; never fracture below it).
3. Cost of a design error (↑ → smaller).
4. Correctness-criticality (↑ → smaller).
5. Inner-loop bandwidth / test-suite quality (↑ → smaller).

Then apply the **one-line-commit-title corollary**: if a planned session can't be described in one
commit-title-shaped sentence, it is more than one session — split it until each row has a clean
title. Splitting is only legitimate at a contract-sharp boundary (one half freezes an interface the
other consumes); never fracture an irreducible unit (input 2) just to hit a LOC number. When you
split or merge a session, state the lever or corollary that drove it.

## The target structure (what /plan-run reads)

Produce `docs/PLAN.md` with exactly these sections. `/plan-run` preconditions on the starred ones.

- `## Purpose (design intent)` — the prose intent, re-read at every ◆ boundary (anti-defocus anchor).
- `## Verify gate` — the bound VERIFY_TEST / VERIFY_TYPES commands (discover them; do not assume
  `make`). `/plan-run` re-discovers these but stating them here documents the gate.
- **`## Session list`** ★ — one commit-shaped session per row. Columns: `#` | `Session` (commit-title
  shaped) | `Cat` (A substrate / B algorithm / C optimization / I integrative) | `Tier` (Opus only
  where cost-of-wrong demands) | `Consumes` (contract names) | `Expected files`. Mark sub-track-final
   rows `◆` and inflection points `@architect`.
- `## Session detail` — per-row deliverable, ≥1 KAT (a row whose deliverable can't be a KAT has an
  undefined contract — flag it), subtleties, deferrals. Lower-fidelity sketches for rows after the
  substrate session are correct, not lazy: sessions inside a sub-track are crisply specified only
  after the substrate freezes. The integrative (Cat I) session's deliverable includes the
  planning-register anneal: durable files free of plan coordinates, denylist grep clean, any leaked
  coordinates translated into standalone prose (the integrative session is already "where contracts
  get their public form" — the anneal is the same act).
- **`## Cross-session contracts`** ★ — one subsection per contract, each tagged compiler- / test- /
  prose-enforced, with Defined-in and Consumed-by. The inflection juncture fork writes the resolved
  substrate interface into the relevant subsection at execution time; mark not-yet-frozen ones
  *"to be frozen at <session>"*.
- **`## Progress ledger`** ★ — table: `#` | `Session` | `Status` (pending/done) | `Commit` | `Froze`.
  All rows `pending` at shard time. `/plan-run` maintains this.
- **`## Action-frame digest`** ★ — empty at shard time (`*(none yet)*`). The externalized action
  frame `/plan-run` appends to and the juncture forks consume.
- `## Discoveries & risks` — carried *down* from the roadmap Discoveries log and any risk register,
  phrased as `/plan-run` reads for discovery adjudication (internal-continue / additive-reshard /
  destructive-HALT). The reverse flow — discoveries accrued in a completed `PLAN.md` folded back *up*
  into the roadmap — happens in the reconciliation step above, not here.
- `## Notes for executors` — tier routing, register (PEDAGOGY), invariants to preserve, the
  suggested first `/plan-run` invocation (`halt-at-boundaries` for an unproven shard pattern), and
  the **anneal denylist**: the per-project denylist the ◆ boundary gate greps, seeded from the
  default in `/plan-run` and tuned here (drop/add patterns that collide with domain vocabulary).

Apply the three contract flavours deliberately: compiler contracts (traits/signatures) catch
interface drift, KATs catch behavioural drift, prose invariants catch invariant drift. Each session
row should freeze at least one, and substrate rows should *over-specify* the interface (carry a
method "we might need later" if confidence is reasonable — adding it later is costlier).

## Interactivity

Steering is high throughout — surface each load-bearing choice rather than deciding silently:

- Session boundaries and any split/merge (with the driving lever named) — Question tool.
- Tier assignments (with lever reasoning) — Question tool.
- Contract freezes and which sessions consume them — confirm before writing.
- The VERIFY gate, if discovery is ambiguous — confirm.

In greenfield mode, the whole session is a dialogue: elicit intent → propose sub-track decomposition
→ confirm → shard → review.

## Output and handoff

1. Show the proposed `docs/ROADMAP.md` reconciliation diff (sub-track status + folded discoveries),
   if any, and the proposed `docs/PLAN.md` (or the PLAN diff, in re-shard mode) as fenced blocks.
2. Confirm via the Question tool before writing either file (the `@architect` handoff-checkpoint
   rule: the write is a checkpoint, not a unilateral act). The ROADMAP reconciliation keeps the same
   confirm-before-write gate as the PLAN write.
3. Write `docs/ROADMAP.md` (if reconciled) then `docs/PLAN.md`. Pause for review. Do NOT run
   `/plan-run`.
4. **Seed the project's `AGENTS.md`** (same confirm-before-write gate): append the register rule to
   the target project's `AGENTS.md`, creating the file with just this block if none exists. The
   block: the REGISTER rule (state the property/reason/invariant; never the plan coordinate; plan
   vocabulary lives in PLAN/ROADMAP/ledger/commit messages only) plus a pointer to the anneal
   denylist in PLAN's `## Notes for executors`. Idempotent: skip if the block is already present.
   This covers agents outside `/plan-run` chains — ad-hoc sessions auto-load the repo's `AGENTS.md`
   and never see the dispatch template.
5. If the design statement (greenfield) or a discovery during sharding is a durable roadmap-level
   fact *not already folded in by the reconciliation step*, surface it as a `CAPTURE-CANDIDATE` for
   `docs/ROADMAP.md` or NOTES.

## Constraints

- Sharding only. Never execute a session, never run the VERIFY gate as more than discovery, never
  commit code. `/plan-run` (from `@plan-admin`) executes.
- Writes are limited to `docs/PLAN.md`, the sub-track-boundary reconciliation of `docs/ROADMAP.md`
  (status + folded discoveries; on approval, plus any roadmap/NOTES capture), and the project's
  `AGENTS.md` register-rule seed (on approval, same gate). All other writes are disabled per
  `@architect` permissions. Roadmap writes stay bounded to the boundary delta — do not rewrite
  roadmap structure or co-maintain it per-session.
- Every session row must reduce to a one-line commit title. If it can't, it isn't one session.
- Do not assume project tooling (`make`, `origin`, file layout) — discover it (survey + VERIFY
  binding), exactly as `/plan-run`'s preflight does.

## Exit report

- Entry mode used (file / re-shard / greenfield).
- Roadmap reconciliation: sub-track marked done (+ any discoveries folded up), sub-track marked
  in-progress — or "none (greenfield / no roadmap / no prior PLAN)".
- Session count, sub-track(s) sharded, `◆` and `@architect` markers placed.
- Any split/merge and the lever that drove it.
- Capture candidates surfaced.
- The suggested `/plan-run` invocation to execute the result.
