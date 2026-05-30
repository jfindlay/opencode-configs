---
description: "[jf] Autonomously execute a session-sharded docs/PLAN.md as a 1:1 session:commit chain. @plan-deep orchestrates; dispatches @build/@general/@explore per session entry, verifies the session contract (green tests + KAT present + expected files, no scope drift), commits via @committer. Halts only at marked Opus inflection points, contract-violating discoveries, or committer refusal. State lives in the PLAN.md ledger, not context."
---

# /run-plan

Drive a session-sharded `docs/PLAN.md` to completion as an autonomous chain. The plan
must already be in session-list form (one commit-shaped session per row, each with a
title, category, tier, expected files, and consumed contracts) per
`multi-session-planning.md`. This command does NOT shard a plan — that is a `@plan-deep`
interactive task. It EXECUTES an already-sharded one.

This command runs from `@plan-deep` (T0). The orchestration judgment — is the session
contract fulfilled? does this discovery invalidate a downstream contract? — is exactly
the T0 register. Implementation is dispatched down-tier to `@build`/`@general`; research
to `@explore`. If invoked from a non-`plan-deep` session, stop and tell the user to
switch.

## Invariant: state lives on disk, not in context

Every loop iteration re-derives its state from `docs/PLAN.md` (session list + ledger).
The orchestrator must be able to resume cold from the ledger alone. Do NOT rely on
in-context memory of prior iterations for correctness — between any two iterations the
context may have compacted. After each committed session, the ledger is the source of
truth for "what's done and what contracts are now frozen."

## Preconditions (refuse and stop if any fail)

1. Running from `@plan-deep`. Else: stop, tell the user to switch.
2. `docs/PLAN.md` exists and contains a `## Session list` table and a
   `## Cross-session contracts` section.
3. `docs/PLAN.md` contains a `## Progress ledger` table (see Ledger spec). If absent,
   stop and tell the user to add it (one-time upgrade from the prose Progress section).
4. Working tree is clean at loop start. A dirty tree means a prior session didn't land
   cleanly — refuse and surface, do not stomp uncommitted work.
5. `make test` and `make typecheck` targets exist (Makefile present). The verify gate
   depends on them.

## The loop

Repeat until all session-list rows are `done` in the ledger, or a halt condition fires.

### 1. Select the next session

- Read the ledger. Find the lowest-numbered session row whose status is `pending` and
  whose `Consumes` dependencies are all `done`.
- If none is runnable but `pending` rows remain → halt (`BLOCKED: dependency deadlock`),
  surface the offending rows.
- If none remain → the chain is complete; go to Completion.

### 2. Check for a halt-before marker

- If the selected session is marked **Opus inflection point** in the plan (e.g. S1 in
  the image-annotator plan): this session's *design* is done by the orchestrator itself,
  not dispatched. Do the interface/substrate design in this `@plan-deep` context, write
  the resolved interface into the relevant `## Cross-session contracts` subsection, then
  **HALT for human sign-off** before dispatching the implementation. Resume on approval.
  - Rationale: substrate interfaces are consumed by many downstream sessions; reworking
    them later is the expensive failure mode the inflection point exists to prevent.

### 3. Classify and dispatch the session

Read the session entry's category:

- **Context-substance** (research, schema discovery, design artifact, no code): fork
  `@explore`. Output is a written artifact appended to the plan or a NOTES file.
- **Code-change, Category B/C** (algorithm/optimization on a frozen substrate): fork
  `@build`. Scoped prompt (see Dispatch template) — names ONLY this session's entry plus
  the contracts it consumes; instructs the subagent NOT to read the Roadmap appendix or
  any other session. Subagent leaves the tree dirty with green tests; does NOT commit.
- **Code-change, Category A (substrate)** not flagged Opus: the orchestrator may design
  the interface inline (cheap cases) then dispatch `@build` to implement, or dispatch
  `@general` for heterogeneous setup work (e.g. S0 skeleton). Use judgment.

One session = one dispatch = one commit. Never batch two session rows into one dispatch.

### 4. Verify the session contract (the core gate)

After the implementation subagent returns, the orchestrator — NOT the subagent —
verifies, mechanically:

a. **Tests green.** Run `make test`. Red → go to Fix-loop (step 4f).
b. **Types clean.** Run `make typecheck`. Red → Fix-loop.
c. **KAT present.** The session entry names ≥1 KAT. Confirm a new/changed test asserts
   it (grep the test file named in the entry for the asserted behaviour). Absent → the
   contract is undefined; dispatch `@build` once to add the KAT, then re-verify. Still
   absent after one retry → halt (`BLOCKED: KAT contract undefined`).
d. **Expected files match.** `git status` modified/added set vs. the entry's expected
   files. Unexpected files → potential scope drift; inspect. If the extra file is
   plainly part of the unit (e.g. an `__init__.py`), allow and note it in the ledger;
   if it touches another session's surface → halt (`BLOCKED: scope drift`).
e. **Discovery check.** Did the subagent report a discovery that contradicts a
   *downstream* contract (a frozen interface, a KAT, a named prose invariant)?
   - Downstream-contract-invalidating → default is **HALT**
     (`HALT: coordinate-transform needed`). This is the one place the manual reserves for
     re-sharding. Surface the discovery, the affected contract, and the affected
     downstream sessions.
     - If the run was invoked with `may-reshard` AND the needed change is *additive*
       (insert a new session; widen a not-yet-frozen contract), the orchestrator may
       re-shard the downstream session list, record the re-shard in `## Discoveries`, and
       continue.
     - *Destructive* changes — altering a FROZEN contract (see the ledger's Frozen
       contracts list), or deleting/reordering already-committed sessions — ALWAYS HALT,
       regardless of `may-reshard`. Autonomous destructive re-shard is never permitted.
   - Internal to the current sub-track → append to `## Discoveries & risks`, continue.
f. **Fix-loop.** On red tests/types: dispatch one `@build` fix subagent with the failure
   output. Re-verify. Cap at 2 fix iterations; on the 3rd failure → halt
   (`BLOCKED: session does not converge`). Do not let the fix-loop run unbounded — that
   is the classic autonomous-chain runaway.

### 5. Commit via @committer

Only when steps 4a–4e pass. Dispatch `@committer` per the autonomous-chain carve-out in
AGENTS.md with:
- `SESSION CONTRACT`: the session entry's commit-title + one-line why.
- `EXPECTED FILES`: the entry's expected-files list (plus any allowed extras from 4d).
- `COMMIT TITLE HINT`: the entry's commit title.

`@committer` stages exactly those files or refuses. On refusal:
- `empty diff` / `scope drift` / `incomplete` → the verify gate and committer disagree;
  halt (`BLOCKED: committer refusal`), surface the committer output. Do not work around.
- `hook failure` → dispatch one `@build` fix subagent with the hook output, re-verify
  from 4a, re-commit. This is part of the Fix-loop budget (cap 2).
- `secret risk` → HALT immediately, surface, never bypass.

### 6. Update the ledger

On a successful commit, append to `## Progress ledger`:
- Mark the session row `done`, record the commit short-hash.
- Mark any contracts the session FROZE (substrate interfaces, KAT additions) as frozen,
  so later iterations treat them as fixed.
- Note any allowed scope extras and any logged discoveries.

This write goes through the orchestrator's normal rolling-context write permission
(PLAN.md is a rolling-context file). It is the durable state for resuming the loop.

### 7. Sub-track boundary (◆)

If the just-completed session is the last in a sub-track (marked ◆ in the plan):
- Re-read the `## Purpose (design intent)` and verify the work still tracks it
  (anti-defocus check).
- Reconcile the ledger's frozen contracts against the plan's stated contracts; note
  drift in the ledger.
- Per this plan's size (see Boundary policy), self-review and continue by default —
  do NOT halt for human sign-off at ◆ unless the run config says otherwise or a
  downstream contract was invalidated.

Then return to step 1.

## Boundary policy (this is plan-size-dependent)

The review cadence scales with **sub-track count, not session count**. Boundaries are
where the human-relevant coordinate-transform happens; sessions are not. Default policy:

- **Halt-for-human:** Opus inflection points (step 2), contract-violating discoveries
  (4e), committer secret/refusal (step 5), non-convergence (4f), dependency deadlock.
- **Self-review-and-continue:** ◆ sub-track boundaries (step 7), unless overridden.

For the image-annotator plan specifically: 2 sub-tracks, so ~1 human touch (S1 inflection
point) on the happy path; S8's ◆ boundary self-reviews. A larger many-sub-track plan
would surface more boundaries and so more touches, without any change to this command.

A run may be invoked with `halt-at-boundaries` to force human sign-off at every ◆ (use
for the FIRST run of a new project, before the shard pattern is proven), or
`fully-autonomous` to also self-review inflection points (use only once a project's
substrate is known-good).

## Dispatch template (code-change session)

```
Working directory: <project root>
Thoroughness: medium
Read-only: NO (this is an implementation session).

You are executing ONE session from docs/PLAN.md: session <N> — "<title>".
Read ONLY: the <N> entry in docs/PLAN.md, and the "## Cross-session contracts"
subsections it Consumes. Do NOT read the Roadmap appendix. Do NOT start any other
session. Do NOT commit — leave the tree dirty with green tests.

DELIVERABLE
<the entry's bullet list, verbatim>

CONTRACTS YOU CONSUME (do not break these)
<the relevant frozen contracts, verbatim, including any prose invariant the entry names>

CONTRACTS YOU PRODUCE
<what later sessions will consume from you; if substrate, over-specify per the plan>

DONE WHEN
- <the entry's KAT(s)> pass.
- `make test` and `make typecheck` are green.
- Exactly these files are modified: <expected files>.
```

## Constraints

- Runs from `@plan-deep` only. Implementation is always dispatched down-tier.
- One session-list row → one dispatch → one commit. No batching.
- The orchestrator verifies; subagents implement and never self-commit; `@committer`
  commits and never verifies. Roles stay separate (per AGENTS.md autonomous-chain
  carve-out).
- The Fix-loop is capped (2 iterations) — non-convergence halts, never grinds.
- The four halt classes (inflection point, contract-violating discovery, committer
  secret/refusal, non-convergence/deadlock) are the ONLY autonomous stops on the happy
  path. Everything else continues.
- State is on disk. The orchestrator must be resumable cold from the ledger.
- This command does not push, does not rewrite history, does not edit source itself.

## Exit report

- Sessions completed this run (with commit hashes), sessions remaining.
- Any halt: class, the surfaced detail, and the resume instruction.
- Ledger path and last-updated row.
- Capture candidates surfaced during the run (per AGENTS.md three-axis test).
