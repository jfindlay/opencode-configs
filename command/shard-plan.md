---
description: "[jf] Shard a roadmap, a prose plan, or an in-session design statement into a /run-plan-executable docs/PLAN.md: session list (one commit-shaped session per row), cross-session contracts, progress ledger, and action-frame digest. Applies the five-input commit-size tuning law and sets juncture-tier. This is the SHARDING step /run-plan refuses to do; it does NOT execute the plan. Args: [roadmap-or-plan-path] [sub-track]."
agent: plan
subtask: false
---

# /shard-plan

Turn a long-arc design into the executable form `/run-plan` consumes. The output is a
`docs/PLAN.md` in session-list form per `~/.config/opencode/multisession/multi-session-planning.md`.
This command produces the shards and pauses for review; it never runs `/run-plan` itself (executing
is a separate, `@plan-admin` action).

Runs from `@plan` (Opus 4.8): sharding is the same high-judgment interface-and-contract design the
inflection juncture does — session boundaries, contract freezes, tier and juncture-tier selection.
If invoked from a different agent, note that the judgment register expects Opus and proceed only if
the user confirms.

Source (optional): $ARGUMENTS

## Three entry modes

Resolve which one applies before doing anything else.

1. **From a roadmap/prose file.** `$ARGUMENTS` names a path (`docs/ROADMAP.md`, an old prose
   `docs/PLAN.md`, a design doc). Read it. A second token, if present, names the sub-track to shard
   (e.g. `G.A`); default to the next un-started sub-track.
2. **From an existing structured PLAN.md (re-shard/edit).** `docs/PLAN.md` already has some of the
   `/run-plan` sections but is stale, mis-sized, or pre-dates the current tuning law. Read it and
   the roadmap; revise in place rather than regenerate.
3. **Greenfield, no artifact.** `$ARGUMENTS` is empty and no roadmap/plan file exists (or the user
   says so). Elicit the design statement interactively: ask for the design intent, the sub-track to
   shard first, the substrate it sits on, and the rough scope. Build the plan from the conversation.
   Surface a `CAPTURE-CANDIDATE` if the design statement is itself worth preserving to a roadmap.

State which mode you are in before proceeding.

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
5. Inner-loop bandwidth / test-suite quality (↑ → smaller, AND the one lever that licenses opting
   the juncture tier DOWN to Sonnet).

Then apply the **one-line-commit-title corollary**: if a planned session can't be described in one
commit-title-shaped sentence, it is more than one session — split it until each row has a clean
title. Splitting is only legitimate at a contract-sharp boundary (one half freezes an interface the
other consumes); never fracture an irreducible unit (input 2) just to hit a LOC number. When you
split or merge a session, state the lever or corollary that drove it.

**Set `juncture-tier`** in the PLAN header comment: `opus` (default — levers 1–4 hold it up) or
`sonnet` (opt down only when strong test-suite quality, lever 5, coincides with lower
correctness-criticality). State the reasoning in one sentence near the header.

## The target structure (what /run-plan reads)

Produce `docs/PLAN.md` with exactly these sections. `/run-plan` preconditions on the starred ones.

- **Header comment** with `juncture-tier:` (`<!-- juncture-tier: opus -->`).
- `## Purpose (design intent)` — the prose intent, re-read at every ◆ boundary (anti-defocus anchor).
- `## Verify gate` — the bound VERIFY_TEST / VERIFY_TYPES commands (discover them; do not assume
  `make`). `/run-plan` re-discovers these but stating them here documents the gate.
- **`## Session list`** ★ — one commit-shaped session per row. Columns: `#` | `Session` (commit-title
  shaped) | `Cat` (A substrate / B algorithm / C optimization / I integrative) | `Tier` (Opus only
  where cost-of-wrong demands) | `Consumes` (contract names) | `Expected files`. Mark sub-track-final
  rows `◆` and inflection points `@plan`.
- `## Session detail` — per-row deliverable, ≥1 KAT (a row whose deliverable can't be a KAT has an
  undefined contract — flag it), subtleties, deferrals. Lower-fidelity sketches for rows after the
  substrate session are correct, not lazy: sessions inside a sub-track are crisply specified only
  after the substrate freezes.
- **`## Cross-session contracts`** ★ — one subsection per contract, each tagged compiler- / test- /
  prose-enforced, with Defined-in and Consumed-by. The inflection juncture fork writes the resolved
  substrate interface into the relevant subsection at execution time; mark not-yet-frozen ones
  *"to be frozen at <session>"*.
- **`## Progress ledger`** ★ — table: `#` | `Session` | `Status` (pending/done) | `Commit` | `Froze`.
  All rows `pending` at shard time. `/run-plan` maintains this.
- **`## Action-frame digest`** ★ — empty at shard time (`*(none yet)*`). The externalized action
  frame `/run-plan` appends to and the juncture forks consume.
- `## Discoveries & risks` — carried from the roadmap Discoveries log and any risk register, phrased
  as `/run-plan` reads for discovery adjudication (internal-continue / additive-reshard /
  destructive-HALT).
- `## Notes for executors` — tier routing, register (PEDAGOGY), invariants to preserve, the
  suggested first `/run-plan` invocation (`halt-at-boundaries` for an unproven shard pattern).

Apply the three contract flavours deliberately: compiler contracts (traits/signatures) catch
interface drift, KATs catch behavioural drift, prose invariants catch invariant drift. Each session
row should freeze at least one, and substrate rows should *over-specify* the interface (carry a
method "we might need later" if confidence is reasonable — adding it later is costlier).

## Interactivity

Steering is high throughout — surface each load-bearing choice rather than deciding silently:

- Session boundaries and any split/merge (with the driving lever named) — Question tool.
- Tier assignments and the `juncture-tier` setting (with lever-5 reasoning) — Question tool.
- Contract freezes and which sessions consume them — confirm before writing.
- The VERIFY gate, if discovery is ambiguous — confirm.

In greenfield mode, the whole session is a dialogue: elicit intent → propose sub-track decomposition
→ confirm → shard → review.

## Output and handoff

1. Show the proposed `docs/PLAN.md` (or the diff, in re-shard mode) as a fenced block.
2. Confirm via the Question tool before writing (the `@plan` handoff-checkpoint rule: the write
   is a checkpoint, not a unilateral act).
3. Write `docs/PLAN.md`. Pause for review. Do NOT run `/run-plan`.
4. If the design statement (greenfield) or a discovery during sharding is itself a durable
   roadmap-level fact, surface it as a `CAPTURE-CANDIDATE` for `docs/ROADMAP.md` or NOTES.

## Constraints

- Sharding only. Never execute a session, never run the VERIFY gate as more than discovery, never
  commit code. `/run-plan` (from `@plan-admin`) executes.
- Writes are limited to `docs/PLAN.md` (and, on approval, a roadmap/NOTES capture). All other writes
  are disabled per `@plan` permissions.
- Every session row must reduce to a one-line commit title. If it can't, it isn't one session.
- Do not assume project tooling (`make`, `origin`, file layout) — discover it (survey + VERIFY
  binding), exactly as `/run-plan`'s preflight does.

## Exit report

- Entry mode used (file / re-shard / greenfield).
- Session count, sub-track(s) sharded, `◆` and `@plan` markers placed.
- `juncture-tier` set and the lever that decided it.
- Any split/merge and the lever that drove it.
- Capture candidates surfaced.
- The suggested `/run-plan` invocation to execute the result.
