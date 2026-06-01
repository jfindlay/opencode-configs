---
description: "[jf] Autonomously execute a session-sharded plan file as a 1:1 session:commit chain. @plan-deep orchestrates; dispatches @build/@general/@explore per session entry, verifies the session contract (green checks + KAT present + expected files, no scope drift), commits the session then commits the ledger update. Halts only at marked Opus inflection points, contract-violating discoveries, or committer refusal. State lives in the committed plan ledger, not context. Args: [plan-path] [may-reshard|halt-at-boundaries|fully-autonomous]. Plan path defaults to docs/PLAN.md."
agent: plan-deep
subtask: false
---

# /run-plan

Drive a session-sharded plan file to completion as an autonomous chain. The plan must
already be in session-list form (one commit-shaped session per row, each with a title,
category, tier, expected files, and consumed contracts) per `multi-session-planning.md`.
This command does NOT shard a plan — that is a `@plan-deep` interactive task. It EXECUTES
an already-sharded one.

This command runs from `@plan-deep` (T0). The orchestration judgment — is the session
contract fulfilled? does this discovery invalidate a downstream contract? — is exactly
the T0 register. Implementation is dispatched down-tier to `@build`/`@general`; research
to `@explore`. If invoked from a non-`plan-deep` session, stop and tell the user to
switch.

User input: $ARGUMENTS

## Preflight (resolve once at loop start; record bindings in the ledger header)

Resolved ONCE before the loop, then referenced throughout. These turn the project-specific
facts the command used to hardcode (`docs/PLAN.md`, `make`) into discovered values, so the
orchestrator never has to override a false precondition mid-run.

1. **Bind PLAN — the plan file path.** Parse `$ARGUMENTS`: the first path-like token
   (ending `.md`, or any explicit path) is PLAN. Default `PLAN = docs/PLAN.md`. Remaining
   tokens are run-config flags (`may-reshard`, `halt-at-boundaries`, `fully-autonomous`).
   Every "the plan" / "docs/PLAN.md" reference below means PLAN. If several sharded plans
   exist and none was named, ask which.

2. **Bind VERIFY — the project's gate commands.** Discover; do NOT assume `make`. Check in
   order and bind VERIFY_TEST and VERIFY_TYPES (which may be a single combined command):
   - `Makefile` with `test` / `typecheck` targets → `make test` / `make typecheck`.
   - `tox.ini` / `pyproject.toml [tool.tox]` → the project's analyze invocation (e.g.
     `~/.local/bin/tox -m analyze`, which subsumes tests + types + lint + coverage).
   - `package.json` scripts → `npm test` / `npm run typecheck` or equivalents.
   - Else ask the user.
   Record the bound commands in the ledger header for cold-resume reuse. Where the bound
   command is a combined gate (e.g. `tox -m analyze`), one green run satisfies 4a AND 4b
   (and any lint/format/coverage it enforces) — note this in the ledger.

## Invariant: state lives on disk, not in context

Every loop iteration re-derives its state from PLAN (session list + ledger). The
orchestrator must be able to resume cold from the ledger alone. Do NOT rely on in-context
memory of prior iterations for correctness — between any two iterations the context may
have compacted. After each committed session, the ledger is the source of truth for
"what's done and what contracts are now frozen."

This invariant is enforced mechanically: every iteration ends with both a session commit
AND a ledger commit (step 6b), so the tree is clean and the committed ledger exactly
matches the last committed session. A cold resume never has to reconcile uncommitted
ledger state against the code.

## Preconditions (refuse and stop if any fail)

1. Running from `@plan-deep`. Else: stop, tell the user to switch.
2. PLAN (bound in Preflight) exists and contains a `## Session list` table and a
   `## Cross-session contracts` section.
3. PLAN contains a `## Progress ledger` table (see Ledger spec). If absent, stop and tell
   the user to add it (one-time upgrade from the prose Progress section).
4. Working tree is clean at loop start — including PLAN. Because each iteration commits its
   own ledger update (step 6b), a clean tree is the invariant between iterations; ANY dirty
   file at loop start means a prior session or ledger commit didn't land cleanly — refuse
   and surface, do not stomp uncommitted work.
   - **One-time exception:** if PLAN is dirty because it was just sharded or
     ledger-initialized and has never been committed, commit it first via `@committer`
     ("Initialize PLAN ledger") before starting the loop. This establishes the clean
     baseline rather than demanding one that doesn't exist yet.
5. VERIFY commands (bound in Preflight) are resolved. The verify gate depends on them.

## The loop

Repeat until all session-list rows are `done` in the ledger, or a halt condition fires.

### 1. Select the next session

- Read the ledger. Find the lowest-numbered session row whose status is `pending` and
  whose `Consumes` dependencies are all `done`.
- If none is runnable but `pending` rows remain → halt (`BLOCKED: dependency deadlock`),
  surface the offending rows.
- If none remain → the chain is complete; go to Completion.

### 2. Check for a halt-before marker

- If the selected session is marked **Opus inflection point** in the plan: this session's
  *design* is done by the orchestrator itself, not dispatched. Do the interface/substrate
  design in this `@plan-deep` context, write the resolved interface into the relevant
  `## Cross-session contracts` subsection, then **HALT for human sign-off** before
  dispatching the implementation. Resume on approval.
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

a. **Tests green.** Run VERIFY_TEST. Red → go to Fix-loop (step 4f).
b. **Types clean.** Run VERIFY_TYPES. Red → Fix-loop. (When VERIFY is one combined gate —
   e.g. `tox -m analyze` — a single green run satisfies both, plus any lint/format/coverage
   it enforces.)
c. **KAT present.** The session entry names ≥1 KAT. Confirm a new/changed test asserts it
   (search the test file named in the entry using the Grep tool). Absent → the contract is
   undefined; dispatch `@build` once to add the KAT, then re-verify. Still absent after one
   retry → halt (`BLOCKED: KAT contract undefined`).
d. **Expected files match.** `git status` modified/added set vs. the entry's expected
   files. PLAN may be dirty here if an inflection-point design write (step 2) preceded the
   dispatch — it is never part of the session commit (step 5) and is committed separately
   in step 6b. Any other unexpected file → potential scope drift; inspect. If the extra
   file is plainly part of the unit (e.g. an `__init__.py`), allow and note it in the
   ledger; if it touches another session's surface → halt (`BLOCKED: scope drift`).
e. **Discovery check.** Did the subagent report a discovery that contradicts a
   *downstream* contract (a frozen interface, a KAT, a named prose invariant)?
   - Downstream-contract-invalidating → default is **HALT**
     (`HALT: coordinate-transform needed`). This is the one place the manual reserves for
     re-sharding. Surface the discovery, the affected contract, and the affected downstream
     sessions.
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

### 5. Commit the session via @committer

Only when steps 4a–4e pass. Dispatch `@committer` per the autonomous-chain carve-out in
AGENTS.md with:
- `SESSION CONTRACT`: the session entry's commit-title + one-line why.
- `EXPECTED FILES`: the entry's expected-files list (plus any allowed extras from 4d).
  PLAN is never in this list — instruct the committer to stage only the session's expected
  files explicitly (not `git add -A`) and to refuse if PLAN appears staged.
- `COMMIT TITLE HINT`: the entry's commit title.

`@committer` stages exactly those files or refuses. On refusal:
- `empty diff` / `scope drift` / `incomplete` → the verify gate and committer disagree;
  halt (`BLOCKED: committer refusal`), surface the committer output. Do not work around.
- `hook failure` → dispatch one `@build` fix subagent with the hook output, re-verify
  from 4a, re-commit. This is part of the Fix-loop budget (cap 2).
- `secret risk` → HALT immediately, surface, never bypass.

### 6. Update the ledger

On a successful session commit, write to PLAN's `## Progress ledger`:
- Mark the session row `done`, record the commit short-hash.
- Mark any contracts the session FROZE (substrate interfaces, KAT additions) as frozen,
  so later iterations treat them as fixed.
- Note any allowed scope extras and any logged discoveries.

This write goes through the orchestrator's normal rolling-context write permission (PLAN
is a rolling-context file).

### 6b. Commit the ledger update

Immediately after the step-6 write, dispatch `@committer` staging ONLY PLAN, with a title
of the form `Ledger: <session-id> done, freeze <contract>` (or just `Ledger: <session-id>
done` when no new contract is frozen). This is a separate rolling-context commit — never
folded into the session commit (step 5).

On success the tree is clean again and the committed ledger exactly matches the last
committed session. This is what makes the "state lives on disk" invariant literally true:
a cold resume reads only committed state and never has to reconcile an uncommitted ledger
against the code.

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

You are executing ONE session from <PLAN>: session <N> — "<title>".
Read ONLY: the <N> entry in <PLAN>, and the "## Cross-session contracts"
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
- <VERIFY_TEST> and <VERIFY_TYPES> are green (orchestrator substitutes the bound
  commands, e.g. `~/.local/bin/tox -m analyze`).
- Exactly these files are modified: <expected files>.
```

## Constraints

- Runs from `@plan-deep` only. Implementation is always dispatched down-tier.
- One session-list row → one session commit + one ledger commit. No batching.
- The orchestrator verifies; subagents implement and never self-commit; `@committer`
  commits and never verifies. Roles stay separate (per AGENTS.md autonomous-chain
  carve-out).
- The Fix-loop is capped (2 iterations) — non-convergence halts, never grinds.
- The four halt classes (inflection point, contract-violating discovery, committer
  secret/refusal, non-convergence/deadlock) are the ONLY autonomous stops on the happy
  path. Everything else continues.
- PLAN is committed only as its own rolling-context commit (step 6b), never folded into a
  session commit. After each full iteration the tree is clean and the committed ledger
  matches the last committed session — this is the resumability invariant precondition 4
  enforces.
- This command does not push, does not rewrite history, does not edit source itself.

## Exit report

- Sessions completed this run (with commit hashes), sessions remaining.
- Any halt: class, the surfaced detail, and the resume instruction.
- Ledger path and last-updated row.
- Capture candidates surfaced during the run (per AGENTS.md three-axis test).
