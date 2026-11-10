---
description: "[jf] Autonomously execute a session-sharded plan file as a 1:1 session:commit chain. @plan-admin orchestrates the mechanical loop; dispatches @build/@explore per session entry, @committer for commits, and pages a forked @plan-juncture (T0) only at inflection points, contract-invalidating discoveries, and sub-track boundaries. A row marked (F/C) by /plan-shard runs as a feature-stage then completion-stage pair sharing one intent capsule and one commit; ordinary rows are unaffected. State lives in the committed plan ledger. Args: [plan-path] [may-reshard|halt-at-boundaries]. Plan path defaults to docs/PLAN.md."
agent: plan-admin
subagent: false
---

# /plan-run

Drive a session-sharded plan file to completion as an autonomous chain. The plan must already be in
session-list form (one commit-shaped session per row, each with a title, category, tier, expected
files, and consumed contracts) per `multisession/multi-session-planning.md`.  This command does NOT shard a plan
— that is a `@architect` interactive task. It EXECUTES an already-sharded one.

This command runs from `@plan-admin` (T1). The mechanical loop — select, dispatch, gate, commit,
ledger — is entirely the driver's work. T0 judgment (discovery adjudication, inflection-point
interface design, sub-track boundary coordinate-transform) is paged in by forking `@plan-juncture` at the
three junctures only. Implementation is dispatched down-tier to `@build`; research to
`@explore`. If invoked from a non-`plan-admin` session, stop and tell the user to switch.

User input: $ARGUMENTS

## Preflight (resolve once at loop start; record bindings in the ledger header)

Resolved ONCE before the loop, then referenced throughout. These turn the project-specific facts the
command used to hardcode (`docs/PLAN.md`, `make`) into discovered values, so the driver never has to
override a false precondition mid-run.

1. **Bind PLAN — the plan file path.** Parse `$ARGUMENTS`: the first path-like token (ending `.md`,
   or any explicit path) is PLAN. Default `PLAN = docs/PLAN.md`. Remaining tokens are run-config
   flags (`may-reshard`, `halt-at-boundaries`).  Every "the plan" /
   "docs/PLAN.md" reference below means PLAN. If several sharded plans exist and none was named, ask
   which.

2. **Bind VERIFY — the project's gate commands.** Discover; do NOT assume `make`. Check in order and
   bind VERIFY_TEST and VERIFY_TYPES (which may be a single combined command):
   - `Makefile` with `test` / `typecheck` targets → `make test` / `make typecheck`.
   - `tox.ini` / `pyproject.toml [tool.tox]` → the project's analyze invocation (e.g.
     `~/.local/bin/tox -m analyze`, which subsumes tests + types + lint + coverage).
   - `package.json` scripts → `npm test` / `npm run typecheck` or equivalents.
   - Else ask the user.  Record the bound commands in the ledger header for cold-resume reuse. Where
     the bound command is a combined gate (e.g. `tox -m analyze`), one green run satisfies 4a AND 4b
     (and any lint/format/coverage it enforces) — note this in the ledger. A combined command stays
      indivisible unless the project explicitly declares it split.

3. **Bind CADENCE — the project's declared gate cadence, if any.** Read PLAN's `## Verify gate` (and
   the project documents it points to) for an explicit cadence declaration: which checks run per
   completed code-change unit, which at sub-track and final boundaries, which are freshness checks
   (dependency/security) with their triggers, and what the project treats as executable input. Bind
   only what is declared; never infer a cadence, and never bake a project's commands into this
   driver. **No declaration → no cadence:** the whole "Gate cadence and evidence reuse" section below
   is inert and every gate requirement in steps 4–7 applies exactly as written. Record the bound
   cadence (or `none declared`) in the ledger header for cold-resume reuse.

## Terminology: paired units (feature/completion)

`/plan-shard` may mark a session-list row `(F/C)` when it selected the conditional
feature/completion branch (see `/plan-shard`'s Conditional feature/completion branch section). For
such a row:

- **F-stage / C-stage** — two execution contexts dispatched in sequence for the same row, sharing
  one intent and producing one commit. Both are dispatched at T1 to `@build`, as any other code-change
  dispatch in step 3 is — no new agent type, no tier escalation.
- **`handoff-ready`** — F's return state. It means the row is NOT done and NOT green; it is a
  mid-unit checkpoint. A `handoff-ready` return never marks the ledger row `done`.
- **Intent capsule** — the six-field record the driver writes into PLAN's `## Completion handoffs`
  from F's structured return, before dispatching C. See the Intent-capsule template below.
- **Checkpoint** — the capsule plus its base-commit and fingerprint fields, which together let a cold
  resume verify it is looking at the same in-flight unit rather than inferring from filenames alone.

A row with no `(F/C)` marker runs exactly as before — single dispatch, single verify, single commit.
Everything that follows about paired units is inert for such rows; this command does not change
their behavior.

## Invariant: state lives on disk, not in context

Every loop iteration re-derives its state from PLAN (session list + ledger + action-frame digest).
The driver must be able to resume cold from the ledger alone. Do NOT rely on in-context memory of
prior iterations for correctness — between any two iterations the context may have compacted. After
each committed session, the ledger is the source of truth for "what's done and what contracts are
now frozen;" the action-frame digest is the source of truth for "what was learned."

This invariant is enforced mechanically: every iteration ends with both a session commit AND a
ledger commit (step 6b), so the tree is clean and the committed ledger+digest exactly matches the
last committed session. A cold resume never has to reconcile uncommitted state against the code.

**The one documented exception** is the F/C in-flight boundary (see Precondition 5's in-flight
exception and step 3b below): between F's return and C's completion, both the implementation diff
and PLAN's `## Completion handoffs` entry may be dirty and uncommitted by design. This is not a
violation of the invariant — it is a recorded, fingerprinted, resumable state, not an untracked one.
State still lives on disk (the capsule); it is simply not yet committed, and it is committed only
once, in the normal post-green ledger commit that follows C. Resume from it only via the Precondition
5 validation below; never by assumption from chat history.

## Preconditions (refuse and stop if any fail)

1. Running from `@plan-admin`. Else: stop, tell the user to switch.
2. PLAN (bound in Preflight) exists and contains a `## Session list` table and a `## Cross-session
contracts` section. If any row is marked `(F/C)`, PLAN must also contain a `## Completion handoffs`
section (may be empty, `*(none yet)*`); if absent, add it empty and commit via `@committer`
("Initialize PLAN completion handoffs") before starting the loop, exactly as precondition 4 does for
the action-frame digest. Plans with no `(F/C)`-marked row need not have this section at all.
3. PLAN contains a `## Progress ledger` table (see Ledger spec). If absent, stop and tell the user
to add it (one-time upgrade from the prose Progress section).
4. PLAN contains a `## Action-frame digest` section (may be empty at chain start). If absent, add it
as an empty section and commit via `@committer` ("Initialize PLAN digest") before starting the loop.
5. Working tree is clean at loop start — including PLAN. Because each iteration commits its own
ledger update (step 6b), a clean tree is the invariant between iterations; ANY dirty file at loop
start means a prior session or ledger commit didn't land cleanly — refuse and surface, do not stomp
uncommitted work.
   - **One-time exception:** if PLAN is dirty because it was just sharded or ledger-initialized and
     has never been committed, commit it first via `@committer` ("Initialize PLAN ledger") before
     starting the loop. This establishes the clean baseline rather than demanding one that doesn't
     exist yet.
   - **In-flight F/C exception:** a dirty tree is also acceptable, without committing anything
     first, when it exactly matches a recorded entry in PLAN's `## Completion handoffs`: the same
     unit's base commit, the same expected files, and a diff fingerprint — computed over the
     implementation diff only, untracked additions included, PLAN's own checkpoint container
     excluded — that matches the one recorded in the capsule. Identical filenames alone never
     validate this; the fingerprint must match. Validate PLAN's own contract/ledger structure
     separately from the fingerprint check. Any mismatch — an unrelated edit present, the wrong base
     commit, no capsule entry at all, or a stale/absent fingerprint — is NOT this exception: refuse
     and surface for human reconciliation. Never `git reset`, `git stash`, commit, or otherwise
     overwrite the drift automatically; an interruption before a valid checkpoint, or midway through
     unrecorded C edits, does not authorize a blind resume either — reconcile by explicit inspection.
     When the exception validates, resume directly at the C-stage dispatch for that unit (step 3b),
     skipping step 1's normal row selection for this one iteration.
6. VERIFY commands (bound in Preflight) are resolved. The verify gate depends on them.

## Gate cadence and evidence reuse (only when a cadence is bound in Preflight)

Purpose: stop re-running a check solely because work passed between agents, without weakening what
is verified. The driver still owns acceptance; it is not obliged to execute a command already run on
the same relevant inputs. Projects declare the cadence; this section defines how evidence is
recorded, validated, and reused. Without a bound cadence nothing here applies (Preflight 3).

**Check classes** (the project declares which of its commands fall in each and their triggers):

| Class | Required cadence |
|---|---|
| Targeted checks and named KATs | Worker edit/fix loop; every unit-specific obligation before acceptance |
| Per-unit gate (the project's test and type commands) | Once on final inputs per completed code-change unit |
| Boundary checks (e.g. a coverage floor) | Each ◆ sub-track completion and final delivery; earlier only when the project names a trigger |
| Freshness checks (e.g. dependency policy and advisory audit) | When their declared inputs change; first active run of each calendar day; before release |
| Non-executable prose and ledger | The project's documentation/contract checks only; no automatic code suite |

A boundary check run at its checkpoint does not replace the per-unit gate, and a combined command
declared as one check stays one check (it cannot be half-run to satisfy two classes).

**Evidence record.** For each completed check, the worker (or the driver, when it ran the check
itself) produces one compact record: exact command and working directory; exit status; completion
time; output/log reference; tested-input identity; relevant environment (toolchain, flags,
features, target, config). Never include credentials. A record exists only for a command that ran
to completion; a started, interrupted, or still-running check has no record and counts as missing.
**Input identity** covers the base revision
plus staged and unstaged changes, deletions, and the contents of relevant untracked additions, and
is a content identity, so an unchanged executable-input set has the same identity across commits.
HEAD alone, or `git status` filenames alone, never establish identity. Records live in a small
explicit block in the Progress ledger (see step 6a); no general caching framework.

**Classifying inputs.** Source (including doc comments the toolchain compiles or runs), included or
executed documentation, fixtures, generators, build inputs, and configuration are potentially
executable, not automatically prose. Classify by the actual diff and actual usage; an uncertain
classification takes the code-change path. Only proven non-executable edits (prose, ledger) leave
code evidence valid. Dependency evidence is keyed to dependency inputs (manifests, lockfile,
resolution/feature settings, dependency policy, checking-tool versions), not to unrelated source.
An edit to the verify gate, the declared cadence, or a named contract changes the *obligations*:
re-evaluate them, even when no executable input changed.

**Validity — evidence is reused only when all hold:** it is backed by actual command output (a
readable log; an unsupported statement that tests passed is not evidence); its input identity and
environment match the inputs *as recomputed now*; and no obligation changed since. Otherwise the
check is missing or invalidated and the driver runs it. Any edit after a check ran invalidates the
affected evidence — post-validation fixes, hook-modified trees, boundary corrections, and
completion-stage edits included. If a log or identity cannot be verified (cold resume, lost
temporary files), rerun; never infer a pass.

**Freshness checks** are reusable only with successful evidence for the *current* dependency inputs
and policy, refreshed on the *current* day. The record names the advisory database identity and its
refresh time; a new database revision invalidates the corresponding advisory result. An offline or
failed refresh is not a fresh pass. Audit and dependency policy are separate checks, not
interchangeable. No scheduler exists: the loop enforces freshness (step 1 and step 4g), and a
release requires the checks.

**Outcomes.** Record each check as `passed` (the driver ran it), `reused` (valid evidence from a
worker or an earlier run), or `deferred` (cadence puts it later; name the next mandatory checkpoint).
A unit may complete under its per-unit gate while a boundary check is deferred; the ledger must
never call that a full-gate pass. A known failure is never `deferred`. A boundary is incomplete
until every check required there is `passed` or validly `reused`; missing evidence blocks it.
Historical ledger evidence is never rewritten as fresh, and a historical row with no record is
`unrecorded`, not `passed`.

**Stage rules.** An F-stage's checks are partial and never accepted as final acceptance; an F-stage
checkpoint is not a completed unit. The C-stage, or the single stage of an ordinary row, runs the
per-unit gate once on its final inputs and returns the records. Fix workers return fresh records for
their final inputs. Retry limits (Fix-loop cap) and F-stage handoff rules are unchanged. Do not make
unrelated edits to the tree while a gate is running.

## The loop

Repeat until all session-list rows are `done` (or `skipped`, see below) in the ledger, or a halt
condition fires.

### 1. Select the next session

- Read the ledger. Find the lowest-numbered session row whose status is `pending` and whose
  `Consumes` dependencies are all `done` (a `skipped` row counts as satisfied).
- **Skippable row check.** `/plan-shard` ends every plan with an `Anneal cleanup (skippable)` row.
  When the selected row carries `(skippable)`, decide before dispatching whether the sweep is worth
  a session. Skip it when the evidence says it would be a near no-op: the per-sub-track anneal gates
  already ran clean, the ledger records no deferred line-length overruns (or only a trivial few),
  and a quick seed-pattern grep plus a `.{101,}` grep over the arc's durable files finds nothing
  material. A clean grep alone is thin evidence for skipping: the boundary reviews are the
  independent check, so also confirm each boundary note records a completed planning-reference
  review. Run it when any of those fail. To skip: mark the row `skipped` with a one-line reason in
  the ledger and commit it as `Ledger: <session-id> skipped` (step 6b). Never skip a row that is not
  tagged `(skippable)`. If the row runs, dispatch `@build` to carry out `/plan-anneal` over the
  project (REGISTER rule, WORKER HYGIENE block and Fix-loop dispatch rules apply; the line-length
  pass is in scope here).
- **Freshness check (cadence only).** Before dispatching, confirm each declared freshness check has
  valid evidence for the current dependency inputs, policy, and calendar day. Missing, stale, from an
  earlier day, or unverifiable after a cold resume → run it now (the first active iteration of a day
  does this). Success is recorded; a failure against inputs this chain has not changed (e.g. a newly
  published advisory) is a dependency-graph finding, not a regression from any unit: halt
  (`BLOCKED: freshness finding`), surface it, and leave triage to the project's stated procedure.
- If none is runnable but `pending` rows remain → halt (`BLOCKED: dependency deadlock`), surface the
  offending rows.
- If none remain → go to Completion (final delivery) — the chain is complete only after it passes.
- **Paired-unit check.** If the selected row is marked `(F/C)`, check PLAN's `## Completion
  handoffs` for an entry for this row:
  - No entry → this iteration dispatches the **F-stage** (step 3 as normal, F-stage dispatch
    template).
  - A valid entry already present (matches this row's base commit and expected files; this is the
    normal in-loop case, not the cold-resume case Precondition 5 covers) → this iteration dispatches
    the **C-stage** directly (step 3b), skipping the inflection check in step 2 (already resolved, if
    applicable, before F was dispatched).

### 2. Check for a halt-before marker (inflection point)

If the selected session is marked **`@architect` inflection point** in the plan:

- Fork `@plan-juncture` (subagent) with the juncture fork template (see below), type `inflection-design`.
  Include the inflection session entry, the contracts it consumes/produces, and the full current `##
  Action-frame digest`.
- The fork designs the substrate interface and writes the resolved design into PLAN's relevant `##
  Cross-session contracts` subsection, then returns one of two verdicts:
  - **`design-confident <summary>`**: the fork judges the design PLAN-consistent and high-confidence.
    The driver **self-continues** — resume at step 3 and dispatch `@build` to implement, no human
    halt. Append a digest entry noting the inflection was designed and self-cleared.
  - **`design-uncertain-HALT <what cannot be reconciled>`**: the fork hit something it cannot
    reconcile against the PLAN's provisions/anticipations/quantifications (a contradiction with a
    frozen contract, genuinely under-specified intent the PLAN does not anticipate, or low design
    confidence with material downstream cost). The driver **halts for human sign-off**, surfacing the
    fork's named irreconcilability.

Rationale: substrate interfaces are expensive to rework when many downstream sessions consume them —
this is what justifies the fork's high tier and the escape verdict. The inflection fork exists to
*design* the interface and to *detect the rare case it cannot reconcile against the PLAN*, not to
halt unconditionally. When the design is confident and PLAN-consistent, continuous execution is the
right default.

### 3. Classify and dispatch the session

Read the session entry's category:

- **Context-substance** (research, schema discovery, design artifact, no code): fork `@explore`.
  Output is a written artifact appended to the plan or a NOTES file.
- **Code-change, Category B/C** (algorithm/optimization on a frozen substrate): fork `@build`.
  Scoped prompt (see Dispatch template) — names ONLY this session's entry plus the contracts it
  consumes; instructs the subagent NOT to read the rest of the plan, the roadmap, or any other
  session. Subagent leaves the tree dirty with green tests; does NOT commit.
- **Code-change, Category A (substrate)** not flagged `@architect`: the driver dispatches `@build`
  directly, including setup work such as an S0 skeleton; task size does not select another agent.

One session-list row = one dispatch = one commit — except a row marked `(F/C)`, which is two
dispatches (F-stage then C-stage) sharing that row's single eventual commit (see step 3b). Never
batch two different rows into one dispatch, and never split an unmarked row into two dispatches.

For a row marked `(F/C)`, dispatch the F-stage using the **F-stage dispatch template** (see
Feature/completion dispatch templates below) in place of the standard Dispatch template; route to
`@build`. Do not run the step-4 verify gate against
F's return — step 3b governs what happens next.

Dispatch prompts stay scoped: deliver the session entry and the contract subsections it consumes as
excerpts, not the whole PLAN — a pointer to where fuller evidence lives (the roadmap, a prior
session's commit) is enough; the subagent reads only what its own dispatch template already grants.

**Consume telemetry at the task-return boundary.** If the returned Task result carries a
session-economics report (see `session-economics.js`), read it as informing input for *later*
dispatch sizing — e.g. a session that ran hot might get a more scoped prompt next time — never as a
gate on this session. Do not poll for it, do not reshard or page `@plan-juncture` because a cost
warning fired on its own, and do not add a fourth juncture type for it. All halt, commit, scope, and
correctness gates in steps 4–7 remain the only authorities on whether a session passed.

### 3a. Worker hygiene: snapshot before dispatch, assert after every return

`git status` does not show stashes, so the driver checks them itself.

- **Before the iteration's first dispatch**, record the stash identities in order:
  `git stash list --format=%H` (commit hashes are stable; `stash@{n}` names shift). Keep the list in
  working notes — it need not be written to PLAN. If it is lost (compaction, cold resume), re-take
  it and note in the ledger that drift before that point is unchecked.
- **After every worker return** (F, C, fix, KAT-add, anneal and correction dispatches alike — a
  partial F-stage return included), before gating or capsuling it: compare the current list with the
  recorded one, and read the return's owned-jobs statement (WORKER HYGIENE).
  - A missing statement: send one clarification to the same worker; it changes no code and
    does not count against the Fix-loop budget.
  - An outstanding or unstoppable worker job, a stash difference in identity or order (not merely
    count), or a worker that changed pre-existing processes or stashes: halt
    (`BLOCKED: worker hygiene`), surface the job or stash difference, and do not accept the
    return as a pass. Never delete, pop, or drop a stash, and never kill by process name, to
    reconcile; leave that to human reconciliation.
  - A worker-reported incomplete (stopped) check is a missing check, never a pass; the driver runs it
    or reuses valid evidence per step 4 as for any missing check.
- Accepted returns with valid evidence records proceed to step 4 unchanged: the parent does not
  rerun a completed check whose evidence is valid, and later edits invalidate only the evidence
  they affect under the existing policy.

### 3b. Paired units only: capsule the F-stage return, then dispatch C

Runs only when the row just dispatched was an F-stage (step 3's `(F/C)` branch). Unmarked rows and
C-stage dispatches skip straight to step 4.

a. **Read F's structured return** (after the step 3a hygiene assertions). Confirm it actually
   reports `handoff-ready` with the four-point
   report the F-stage template requires (goal/invariants, design and qualifications, KATs and
   results, remaining work). A return that claims `done`/`green`/`verified` without the full gate
   actually having run green, or that reports a known feature-correctness failure, is NOT
   handoff-ready — dispatch one bounded F-fix iteration (shared fix-loop budget, see Fix-loop below)
   and re-check; exhausting the budget here halts (`BLOCKED: session does not converge`) exactly as
   step 4f would.
b. **Do not run the full verify gate yet.** The narrowest-meaningful checks F reports are taken at
   face value; a full gate may have been run by F diagnostically, but the long closure tail is C's
   job, not a reason to gate here. This is a deliberate asymmetry with step 4, not a shortcut.
c. **Write the intent capsule** into PLAN's `## Completion handoffs`, using the Intent-capsule
   template below, transcribing F's structured report into the six fields. The driver organizes; it
   does not invent intent. If F's report is missing a field or reveals a known semantic failure, this
   is not handoff-ready either — treat as in (a).
d. **Do not commit this write.** The implementation diff and this capsule write both stay dirty and
   uncommitted — this is the documented exception to "every iteration ends with a commit" (see
   Precondition 5's in-flight exception and the Invariant section above). There is no step-6b-style
   ledger commit here.
e. **Dispatch the C-stage immediately**, in the same iteration, using the **C-stage dispatch
   template** below, routed to the same tier/agent judgment as the F-stage. The C-stage works
   directly in the dirty tree F left — it does not start from a clean checkout.
f. Proceed to step 4 once C returns, gating the **combined F+C diff** as a single unit.

### 4. Verify the session contract (mechanical gate — driver only, no `@plan-juncture`)

After the implementation subagent returns and passes the step 3a hygiene assertions, the driver —
NOT a paged `@plan-juncture` fork — verifies, mechanically. For an unmarked row this runs once,
after its single dispatch. For a row marked `(F/C)` this runs exactly once as well — after C returns (step 3b.f) — against the **combined F+C
diff**; it never runs against F's return alone, and reaching C is never itself counted as a Fix-loop
iteration or used to widen the Fix-loop budget (planned F→C is not a retry — see Fix-loop below).

a. **Tests green.** Run VERIFY_TEST. Red → go to Fix-loop (step 4f).  b. **Types clean.** Run
VERIFY_TYPES. Red → Fix-loop. (When VERIFY is one combined gate — e.g. `tox -m analyze` — a single
green run satisfies both, plus any lint/format/coverage it enforces.) **With a bound cadence**, 4a
and 4b instead *validate the returned evidence records* against the current inputs (see "Gate
cadence and evidence reuse"): valid → record `reused`, no command executed; missing or invalidated
(source edit, relevant untracked addition, changed environment, unverifiable log) → run the check
yourself, record `passed`. A unit whose whole diff is proven non-executable owes no code gate: only
the project's declared documentation/contract checks, noted in the ledger as `non-executable diff`
(boundary and freshness checks still follow their own cadence). Red → Fix-loop either way. c. **KAT present.** The
session entry names ≥1 KAT. Confirm a new/changed test asserts it (search the test file named in the
entry using the Grep tool). Absent → the contract is undefined; dispatch `@build` once to add the
KAT, then re-verify. Still absent after one retry → halt (`BLOCKED: KAT contract undefined`).  d.
**Expected files match.** `git status` modified/added set vs. the entry's expected files. PLAN may
be dirty here if an inflection-point design write (step 2) preceded the dispatch — it is never part
of the session commit (step 5) and is committed separately in step 6b. Any other unexpected file →
potential scope drift; inspect. If the extra file is plainly part of the unit (e.g. an
`__init__.py`), allow and note it in the ledger; if it touches another session's surface → halt
(`BLOCKED: scope drift`).

**Defect check — paired units only, before the discovery check.** Did the C-stage report a
substantive defect in the feature's own behavior (not a cross-session contract problem — see the
discovery check below for that)? C does not fix this by reinterpreting intent. Dispatch one fresh,
bounded **F-fix** subagent: scoped to the named defect plus the original intent capsule, sharing the
unit's existing Fix-loop budget (cap 2 total across the whole unit, F-stage, C-stage, and any fixes).
Re-dispatch C after the fix (back to step 3b.e.) rather than letting C patch around it; this is a
corrective dispatch, not a second planned F-stage, and it never resets the budget. No defect
reported → continue to the discovery check.

e. **Discovery check — page `@plan-juncture` when flagged.** Did the subagent
report a discovery that contradicts a *downstream* contract (a frozen interface, a KAT, a named
prose invariant)? (A contract-changing discovery made during a C-stage follows this same path —
it is never resolved unilaterally by C.)
   - **No discovery flagged:** continue to step 5.
   - **Discovery flagged:** fork `@plan-juncture` (subagent) with juncture type `discovery-adjudication`.
     Include the discovery, the affected contract(s), the affected downstream sessions, and the full
     current `## Action-frame digest`. Await the fork's one-shot verdict:
     - `internal-continue`: the fork reconciled the discovery against the PLAN's anticipations.
       Append to `## Discoveries & risks` in PLAN; continue to step 5. Medium deviation that the
       fork reconciles against the PLAN rides through here — it is reported, not halted.
     - `additive-reshard <spec>`: honoured ONLY if run was invoked with `may-reshard` AND the change
       is *additive* (insert a new session; widen a not-yet-frozen contract). Re-shard the
       downstream session list per the spec, record in `## Discoveries`, continue.
     - `destructive-HALT`: ALWAYS HALT regardless of `may-reshard`. This verdict means the discovery
       is both incredibly wrong AND the fork cannot reconcile it against the PLAN's provisions,
       anticipations, or quantifications — not merely that it deviates from the PLAN. Surface the
       discovery, the affected contract, and the affected downstream sessions. Autonomous destructive
       re-shard is never permitted. Also append a digest entry for this iteration (non-trivial — a
       discovery was flagged).  f. **Fix-loop.** On red tests/types: dispatch one `@build` fix subagent with
       the failure output. Re-verify. Cap at 2 fix iterations; on the 3rd failure → halt (`BLOCKED:
       session does not converge`). Do not let the fix-loop run unbounded. For a paired unit, this
       budget is one pool shared across the F-stage, the C-stage, and any bounded F-fix dispatches
       from the defect check above — the planned F→C handoff itself never consumes or resets the
       budget; only corrective dispatches do. On non-convergence, preserve the intent capsule and
       checkpoint in PLAN exactly as they stand (do not revert or clear them) and halt — a future
       cold resume reconciles from that state per Precondition 5's in-flight exception. With a bound
cadence, a fix worker's records for its final inputs are reused by the same validity rule; the fix
iteration still counts against the cap, and any edit made after a record was taken invalidates it.

g. **Cadence checks on the unit (cadence only).** After 4a–4b: if the unit's diff touches a declared
freshness-check input (e.g. manifests, lockfile, dependency policy, checking-tool configuration),
run or validate those checks on the unit's final dependency inputs; failure here is the unit's own
failure → Fix-loop. If the diff touches a declared boundary-check trigger (e.g. substantial test
removal, a coverage-related change), run that boundary check now. Otherwise record each boundary
check as `deferred` with its next mandatory checkpoint (the next ◆ boundary or final delivery).
Classify the diff before relying on any of this: a diff that is provably non-executable (prose,
ledger) keeps existing code evidence valid; an uncertain one takes the code path.

### 5. Commit the session via @committer

Only when steps 4a–4e (and 4g, with a cadence) pass. Under a cadence, the evidence must still match
the tree about to be committed: any edit since the last validation — including by a worker after
its records, or by a hook (below) — invalidates it; re-validate before dispatching `@committer`,
never commit under stale green. For a paired unit this is the **feature commit** — one commit for the
combined F+C diff; there is no separate commit for F's partial work, and nothing is committed at the
F→C boundary itself. Dispatch `@committer` per the autonomous-chain carve-out in AGENTS.md with:
- `SESSION CONTRACT`: the session entry's commit-title + one-line why.
- `EXPECTED FILES`: the entry's expected-files list (plus any allowed extras from 4d).  PLAN is
  never in this list — instruct the committer to stage only the session's expected files explicitly
  (not `git add -A`) and to refuse if PLAN appears staged.
- `COMMIT TITLE HINT`: the entry's commit title.
- `CO_AUTHOR`: the content agent(s) that produced the diff, per AGENTS-ROSTER.md's attribution
  convention. For a paired unit where F and C ran on the same model (the normal case — both T1), this
  naturally dedupes to one trailer; do not invent a phase-specific identity string. Record which
  phase contributed what in PLAN's capsule and ledger note, not in a new commit-trailer scheme.

`@committer` stages exactly those files or refuses. On refusal:
- `empty diff` / `scope drift` / `incomplete` → the verify gate and committer disagree; halt
  (`BLOCKED: committer refusal`), surface the committer output. Do not work around.
- `hook failure` → dispatch one `@build` fix subagent with the hook output, re-verify from 4a,
  re-commit. This is part of the Fix-loop budget (cap 2). A hook that rewrote files changed the
  tree: treat it as a post-validation edit (invalidate affected evidence, re-verify) before any
  re-commit.
- `secret risk` → HALT immediately, surface, never bypass.

### 6. Update the ledger and digest

On a successful session commit:

a. **Ledger:** write to PLAN's `## Progress ledger`:
   - Mark the session row `done`, record the commit short-hash. For a paired unit, `done` is reached
     only here — after the combined gate passed and the single feature commit landed — never on an
     F-stage `handoff-ready` return. Note both stage identifiers (e.g. `<N>F`, `<N>C`) and mark the
     unit's `## Completion handoffs` entry `Status: consumed`.
   - Mark any contracts the session FROZE (substrate interfaces, KAT additions) as frozen, so later
     iterations treat them as fixed.
   - Note any allowed scope extras and any logged discoveries.
   - **Gate evidence (cadence only).** In the ledger's gate-evidence block, record one line per check
     for this unit: check, outcome (`passed` / `reused` / `deferred`), command and working
     directory, exit status, completion time, log reference, input identity, environment; for a
     `deferred` check, its next mandatory checkpoint. Keep a one-line "pending checks" summary
     current (what is deferred, due where). Write the row `done` with the per-unit gate recorded;
     never describe a row with a deferred check as a full-gate pass. This write is non-executable
     and does not invalidate code evidence. Never edit earlier entries to look fresh.

b. **Action-frame digest:** if this was a non-trivial iteration (discovery flagged, contract flexed,
or meaningful texture), append one block to `## Action-frame digest`:
   ```
   ### <session-id> — <date>
   Discovery/flex: <one sentence>
   Affected: <contract name or "none">
   Deferred: <yes/no — if yes, what the next juncture adjudicator should re-examine>
   Texture: <one sentence, or omit>
   ```
   Trivial iterations (clean green run, no surprises) produce no digest entry.

Both writes go through the driver's normal rolling-context write permission (PLAN is a
rolling-context file).

### 6b. Commit the ledger update

Immediately after the step-6 write, dispatch `@committer` staging ONLY PLAN, with a title of the
form `Ledger: <session-id> done, freeze <contract>` (or just `Ledger: <session-id> done` when no new
contract is frozen). This is a separate rolling-context commit — never folded into the session
commit (step 5).

On success the tree is clean again and the committed ledger+digest exactly matches the last
committed session. This is what makes the "state lives on disk" invariant literally true: a cold
resume reads only committed state and never has to reconcile an uncommitted ledger against the code.

### 7. Sub-track boundary (◆) — page `@plan-juncture` for the coordinate transform

If the just-completed session is the last in a sub-track (marked ◆ in the plan):

- **Anneal gate (run before forking).** Grep the sub-track's durable files (source, tests, human
  docs — excluding PLAN, ROADMAP, NOTES, the project's `AGENTS.md`, and git metadata) against the
  anneal patterns from PLAN's `## Notes for executors`, or the canonical seed (see Anneal candidate
  seed below) when PLAN carries none. The grep is mechanical; the matches are candidates and need
  contextual triage.
  - **Triage each hit.** A genuine leak is a plan coordinate standing in for a property. A legitimate
    match (mathematical symbol, algorithmic phase, domain principle, literal identifier, historical
    quotation) is retained and noted in the ledger's boundary note as a pattern-tuning hint. A hit
    whose referent is uncertain is neither fixed nor dismissed: pass it to the boundary fork.
  - **Genuine leaks → dispatch one `@build` anneal-fix subagent** to translate plan coordinates into
    standalone statements. Counts against the Fix-loop budget (cap 2). Re-grep and re-read the
    named prose; legitimate matches remaining are not a failure. Still leaking → halt
    (`BLOCKED: anneal failed to converge`).
  - **No genuine leaks, or zero hits → continue.** A clean grep proves only that its patterns found
    nothing; it never stands in for the planning-reference review the boundary fork performs below.

- **Boundary checks (cadence only; run after the anneal gate is clean, before forking).** Run or
  validate every declared boundary check (e.g. the coverage floor) on the boundary's final inputs,
  plus any freshness check not valid for today. Valid existing evidence for the same executable
  inputs is `reused` — a prose-only last row does not exempt the boundary, but it does not invalidate
  a valid result either; missing evidence is run, never assumed. A `deferred` result is not allowed at
  a boundary. Red → Fix-loop (counts against the cap); a boundary is incomplete, and the chain does
  not proceed past it, until each required check is `passed` or validly `reused`. Record outcomes
  in the ledger's boundary note. Any later correction in this step that touches executable inputs
  invalidates the affected result: re-run it after the correction.
- **Stale-claim candidates (gathered before forking; the anneal gate cannot stand in for this).**
  List the claims this sub-track corrected, invalidated, or flexed, from the digest and ledger. For
  each, search the durable surfaces it touches (human docs, comments, tests) for surviving
  formulations, including unchanged sections — the claim's own terms and obvious paraphrases, not a
  whole-repository audit. Record each hit as `file:line` with the claim it may contradict. No
  claims, or no hits, is a stated result in the fork prompt, not an omission. Gathering is
  mechanical; deciding whether a hit contradicts anything is the fork's.
- **Planning-reference review inputs (gathered before forking).** Compute the sub-track's changed
  durable-file list (`git diff --name-only` over the range, minus the anneal exclusions) and a
  recoverable diff range: the commit preceding the sub-track's first session commit (from the
  ledger) through the current tip. Also gather the anneal grep result: patterns used, hits with
  your triage, uncertain hits, or an explicit "zero hits".
- Fork `@plan-juncture` (subagent) with juncture type `boundary-transform`. Include the `## Purpose (design
  intent)`, the frozen-contract list, the full current `## Action-frame digest`, the superseded
  claims with their search candidates, and the planning-reference review inputs (see the Juncture
  fork template). This is the one boundary fork; the review is part of it, not a second fork, and
  not a whole-repository audit.
- The fork returns: `still-on-intent <notes>` or `drift-HALT <what changed and why>`. Its notes
  classify each candidate as a contradiction, a harmless historical quotation, or a keyword match,
  against the corrected contract and its evidence; a clean search is not proof of correctness. Its
  notes also report the planning-reference review: each leaked planning reference found by reading
  (including paraphrases outside the grep patterns), uncertain referents, and any scope limit that
  kept the review incomplete.
- **Contradictions or leaked planning references found.** One `@build` correction dispatch
  (REGISTER rule applies) fixes them in the durable files; it counts against the Fix-loop budget
  (cap 2). Re-check the named candidates and re-read the named prose, not only the patterns.
  A contradiction or leak still standing after that is not a clean review: report it in the ledger's
  boundary note and in your summary, and halt as non-convergence naming it. A contradiction that
  would invalidate a frozen contract or the design intent is `drift-HALT`, not a fix dispatch. An
  uncertain referent is reported in the boundary note, not invented or deleted. If the fork reports
  a scope limit, record it in the boundary note and your summary; the review is then incomplete,
  never certified clean. Corrections follow the existing evidence-invalidation rules: an executable
  edit invalidates the affected evidence, a proven prose-only edit does not.
- If `still-on-intent`: the fork judged work is trending toward design intent, tolerating medium
  deviation that trends toward intent. Reconcile the ledger's frozen contracts against the plan's
  stated contracts, note drift in the ledger, and continue per Boundary policy.
- If `drift-HALT`: the fork found drift it cannot reconcile against the design intent. Halt for
  human sign-off with the fork's output.

Per the Boundary policy below, self-continue by default (the fork is the "self-review") — do NOT
halt for human sign-off at ◆ unless the fork returns `drift-HALT` or the run config says
`halt-at-boundaries`.

Then return to step 1.

## Completion (final delivery)

Reached when every row is `done` or `skipped`. Without a bound cadence there is no further gate:
report per the Exit report. With a cadence: run or validate every declared boundary check and every
freshness check on the final inputs, exactly as in step 7's boundary checks. Valid evidence from the
last ◆ boundary (or any later run) is `reused` when no executable or dependency input has changed
since — a final prose-only row does not force a rerun, and does not waive the requirement. Missing
or invalidated evidence is run. Red → Fix-loop (cap 2, one dispatch at a time, each followed by
re-validation); non-convergence halts. A correction needed here is committed per step 5. Record the
outcomes in the ledger's gate-evidence block and commit that update per 6b. The chain is not
complete until all required checks are `passed` or validly `reused`; no `deferred` check may remain.

## Boundary policy (this is plan-size-dependent)

The review cadence scales with **sub-track count, not session count**. Boundaries are where the
human-relevant coordinate-transform happens; sessions are not. Default policy:

- **Halt-for-human:** `design-uncertain-HALT` from an inflection fork (step 2), `drift-HALT` from a
  boundary fork (step 7), `destructive-HALT` from a discovery fork (4e), committer secret/refusal
  (step 5), non-convergence (4f), dependency deadlock, worker hygiene (3a). These are the
  irreconcilable cases.
- **Self-review-and-continue:** inflection points when the fork returns `design-confident` (step 2),
  ◆ sub-track boundaries when the fork returns `still-on-intent` (step 7), and all medium deviation
  / discovery that the relevant fork reconciles against the PLAN.

The **default** run mode now self-continues at inflection points (via `design-confident`) and at
boundaries (via `still-on-intent`). Continuous execution is the default at all three junctures.

A run may be invoked with `halt-at-boundaries` to force human sign-off at every ◆ boundary AND
treat every inflection as a halt regardless of the fork's verdict. Use for the FIRST run of a new
project, before the shard pattern is proven — this is the "I don't trust the shard pattern yet"
mode.

## Anneal candidate seed (canonical)

The one authoritative seed for the anneal grep. `/plan-anneal` loads this section when PLAN has no
override, and `/plan-shard` seeds PLAN's `## Notes for executors` from it; neither keeps a copy. A
project may tune its PLAN copy (drop patterns that collide with domain vocabulary, add its own).

These are **candidate detectors, not bans**. Each match needs contextual triage. Mathematical
symbols, algorithmic phases, domain principles, literal identifiers and historical quotations are
retained when legitimate; never treat all Greek letters or all uses of "phase" as violations. An
uncertain referent is reported, not invented or deleted. "KAT"/"known-answer test" is domain
vocabulary and is not listed. Patterns use ripgrep syntax (the Grep tool's engine, Unicode-aware):

```
\bS[0-9]+\b                                    plan session ids
sub-track
frozen contract
PLAN\.md
ROADMAP\.md
action-frame
◆
\bCat(egory)?[ -][A-Z]\b                       category labels: Cat B, Cat-C, Cat I
plan-(run|shard|juncture)
\b[A-Z]{1,2}-[A-Z]+[0-9][A-Za-z0-9]*\b         alphanumeric contract labels: C-F2m
(?i)\bprinciples?[ -]?[0-9]+\b                 numbered: principle 4, Principle-4, Principle4
(?i)\bthe plan['’]s\b                          plan possessives (straight and curly apostrophe)
(?i)\b(phase|session|stage)[ -][α-ωΑ-Ω]\b     Greek phase/session labels: Phase β, session γ
(?i)\b[α-ωΑ-Ω][ -](phase|session|stage)\b     the reversed order: α-phase
```

Expected legitimate matches: "phase φ" of a signal, an algorithm's own phase names, a domain
identifier that happens to fit a label shape. (Names such as `SHA-256` and `UTF-8` do not match.) A
planning paraphrase outside these patterns ("the second milestone", "as agreed earlier") is not
detectable by grep; the boundary fork's planning-reference review and `/plan-anneal`'s contextual
read exist to find it.

## Worker hygiene block

Every `@build` dispatch from this command carries the block below, verbatim, as `WORKER HYGIENE` —
the Dispatch template, both feature/completion templates, the KAT-add dispatch (4c), fix and
F-fix dispatches (4f), the hook-failure fix (5), anneal-fix and boundary correction dispatches
(7), and the skippable anneal row (1). It applies to partial F-stage returns as much as final ones.

```
WORKER HYGIENE
- Before returning, await every check or job you started (use completion notifications; do not poll
  background tools), or stop it safely and report it as incomplete, never passed. Do not return with
  a background job of yours still running unless the caller explicitly accepted ownership of that
  named job; routine test execution has no such exception.
- Only a completed, successful command is passing evidence. A started process, partial output, or a
  log path alone is not.
- Track the jobs you own precisely. Never kill by broad process name or touch processes you did
  not start. If safe cleanup cannot be completed, report the blocker and the outstanding job.
- Do not use `git stash` for experiments or handoff. Do not pop, drop, or clear an existing stash.
  Report unexpected stash changes; do not reconcile or delete them.
- Your return states whether every job you started has finished, naming any outstanding job and any
  ownership transfer the caller accepted.
```

## Dispatch template (code-change session)

```
Working directory: <project root>
Thoroughness: medium
Read-only: NO (this is an implementation session).

You are executing ONE session from <PLAN>: session <N> — "<title>".  Read ONLY: the <N> entry in
<PLAN>, and the "## Cross-session contracts" subsections it Consumes. Do NOT read the rest of the
plan or the roadmap. Do NOT start any other session. Do NOT commit — leave the tree dirty with
green tests.

DELIVERABLE
<the entry's bullet list, verbatim>

CONTRACTS YOU CONSUME (do not break these)
<the relevant frozen contracts, verbatim, including any prose invariant the entry names>

CONTRACTS YOU PRODUCE
<what later sessions will consume from you; if substrate, over-specify per the plan>

REGISTER (durable artifacts)
In code, tests, and human docs, state the actual property, reason, or invariant — never the
plan coordinate. Plan vocabulary (session ids, contract and category labels, numbered principles,
phase names, "frozen contract", sub-track names, "the plan's ...", PLAN/ROADMAP references, and
paraphrases of any of these) belongs in PLAN, the ledger, and commit messages only.
E.g. "known-answer test for the walk-state invariant W = a·G + b·Q", not "KAT for S4".

<WORKER HYGIENE block, verbatim>

DONE WHEN
- <the entry's KAT(s)> pass.
- <VERIFY_TEST> and <VERIFY_TYPES> are green (orchestrator substitutes the bound commands, e.g.
  `~/.local/bin/tox -m analyze`).
- Exactly these files are modified: <expected files>.

CADENCE VARIANT (include only when a cadence is bound; replaces the VERIFY line above)
- The KAT(s) and any targeted checks pass during your edit/fix loop.
- Run <VERIFY_TEST> and <VERIFY_TYPES> once, on your FINAL inputs, after your last edit. Do not run
  boundary or freshness checks unless this prompt names them. If you edit anything after a recorded
  run, rerun the affected check.
- Return one compact EVIDENCE RECORD per completed check: exact command and working directory, exit
  status, completion time, log/output reference (keep the log readable), tested-input identity
  (base revision plus staged and unstaged changes, deletions, and untracked additions — HEAD or
  filenames alone are not identity), relevant toolchain/flags/features/target/config. No credentials.
```

## Feature/completion dispatch templates (paired units only)

Used only for a row marked `(F/C)` by `/plan-shard` (see Terminology above). Both stages are
dispatched to `@build` — pinned T1, the same tier as every other implementation dispatch in this loop. No new agent
type and no tier escalation exist for this pattern.

### F-stage (feature) dispatch

```
Working directory: <project root>
Thoroughness: medium
Read-only: NO (this is an implementation session).

You are executing the FEATURE STAGE of a paired feature/completion unit from <PLAN>: session <N> —
"<title>". Read ONLY: the <N> entry in <PLAN>, its Completion appendix, and the "## Cross-session
contracts" subsections it Consumes. Do NOT read the rest of the plan or the roadmap. Do NOT
start any other session. Do NOT commit — leave the tree dirty.

DELIVERABLE
<the entry's bullet list, verbatim>

CONTRACTS YOU CONSUME / PRODUCE
<as in the standard Dispatch template above>

HANDOFF-READY, NOT DONE
Implement behavior, the substantive success/error/integrity tests, and focused docs. Run the
narrowest meaningful project-managed checks and report the exact commands and results; a full
project gate run is optional and diagnostic only — its long closure tail belongs to the completion
stage, not to you. Label every check result you report as partial; with a bound cadence the driver
never accepts F's records as final acceptance. Return `handoff-ready`, never `done`, `green`, or
`verified`, unless the full gate has actually run green. A known feature-correctness failure is not a compliance handoff — report
it plainly; do not paper over it to look handoff-ready, and do not deliberately leave an obvious test
gap for the completion stage to find.

REPORT (the driver turns this into the intent capsule — be complete)
1. One-sentence goal; observable behavior and non-negotiable integrity invariants.
2. The design you implemented and any qualifications learned while coding/testing that aren't
   obvious from the diff.
3. KAT names and exact files, the important cases already tested, the commands you ran and their
   results, and any known failures or gaps.
4. What closure work you believe remains, and anything semantically unresolved.

REGISTER (durable artifacts)
In code, tests, and human docs, state the actual property, reason, or invariant — never the
plan coordinate. Plan vocabulary (session ids, contract and category labels, numbered principles,
phase names, "frozen contract", sub-track names, "the plan's ...", PLAN/ROADMAP references,
"F-stage"/"C-stage", and paraphrases of any of these) belongs in PLAN, the ledger, and commit
messages only.

<WORKER HYGIENE block, verbatim — applies to this partial return as well>

Do not commit, freeze contracts, or start another unit.
```

### C-stage (completion) dispatch

```
Working directory: <project root>
Thoroughness: very thorough
Read-only: NO (this is an implementation session, continuing an already-dirty tree).

You are executing the COMPLETION STAGE of a paired feature/completion unit from <PLAN>: session <N>
— "<title>". The feature stage already implemented behavior and substantive tests, uncommitted, in
the current working tree — do not discard or re-derive it. Read ONLY: the intent capsule for unit
<N> in PLAN's "## Completion handoffs", the <N> entry in <PLAN> and its Completion appendix, and the
"## Cross-session contracts" subsections it Consumes. Do NOT read the roadmap or any other
unit's entry — the capsule is the complete intent; trust it. Do NOT start any other unit. Do NOT
commit — leave the tree dirty with green tests.

INTENT CAPSULE
<the full six-field capsule for unit <N>, verbatim — see Intent-capsule template below>

YOUR SCOPE
Run the unit's full gate (see DONE WHEN). Complete missing branch cases and necessary regression tests, typing,
lint/format, and documentation/shape/layering conformance. Small behavior-preserving corrections are
permitted within the unit's expected files. Do NOT weaken assertions, lower coverage, add
convenience exclusions, change public behavior, or redesign the feature to obtain green. Do not
spend turns rewrapping a few over-width lines the gate does not enforce — report them in
your return; the general anneal sweep takes them.

IF YOU FIND A DEFECT
A substantive defect in the feature's behavior is not yours to fix by reinterpreting intent — name it
plainly in your return; do not patch around it. A discovery that would invalidate a frozen downstream
contract is also not yours to resolve — name the affected contract plainly. The driver routes both: a
bounded feature-fix dispatch for the former, the existing juncture-adjudication path for the latter.

REGISTER (durable artifacts)
In code, tests, and human docs, state the actual property, reason, or invariant — never the
plan coordinate, exactly as the feature stage was instructed.

<WORKER HYGIENE block, verbatim>

DONE WHEN
- All KATs named in the capsule, and any you added, pass.
- <VERIFY_TEST> and <VERIFY_TYPES> are green (the full project gate; orchestrator substitutes the
  bound commands, e.g. `~/.local/bin/tox -m analyze`). With a bound cadence: run them once on your
  final inputs after your last edit, rerun any check you invalidated by editing afterwards, and
  return one EVIDENCE RECORD per check (fields as in the Dispatch template's CADENCE VARIANT).
- Exactly the unit's expected files are modified.

RETURN
Name any corrections you made, why they preserve the feature's intent rather than changing it, any
new qualifications learned, and the exact gate results.
```

### Intent-capsule template (written by the driver, not a subagent)

After an F-stage returns `handoff-ready` (step 3b.c), the driver transcribes its structured REPORT
into one entry in PLAN's `## Completion handoffs`, before dispatching C:

```
### <N> — feature/completion handoff
**Status:** checkpoint-written
**Base commit:** <the commit this unit started from>
**Expected files:** <the row's expected files, verbatim>
**Fingerprint:** <a content fingerprint of the implementation diff as of F's return — untracked
  additions included, PLAN's own checkpoint container excluded; exact enough that an unrelated edit
  or a stale resume is detected, never "same filenames" alone>
**Goal:** <one sentence — the meaningful goal, observable behavior, non-negotiable invariants>
**Design & qualifications:** <what F implemented and learned; reasons not obvious in the diff>
**KATs:** <names, exact files, important cases already tested, commands/results, known failures;
  under a bound cadence, F's partial evidence records by reference — a cold resume treats them as
  unverified history, never as final acceptance>
**Remaining closure work:** <what F believes is left, and the permitted correction envelope for C>
**Acceptance contract:** <unit gate (full gate, or per-unit gate under a cadence), required KATs, expected files, any named deferred non-goals>
```

The driver organizes F's report into these fields; it does not invent intent. Missing intent or a
known semantic failure in F's report is not handoff-ready — send it back to F for one bounded
iteration (shared Fix-loop budget) rather than filling gaps with guesses. Mark `Status: consumed`
once the unit reaches `done` in step 6a. The capsule stays in PLAN as part of its committed history
after that — it is a record, not scratch state, and is never deleted to "clean up."

## Juncture fork template (`@plan-juncture` subagent)

```
Working directory: <project root>
Thoroughness: very thorough
Read-only: YES (except inflection-design forks, which write to PLAN's contracts section only).

JUNCTURE TYPE: <inflection-design | discovery-adjudication | boundary-transform>

PLAN FILE: <PLAN path>
SESSION ENTRY: <entry N verbatim>
FROZEN CONTRACTS (do not break these): <relevant frozen-contracts list from ledger>

ACTION-FRAME DIGEST (feed to juncture adjudicator):
<full ## Action-frame digest section verbatim>

JUNCTURE QUESTION:
<one of:>
  Inflection: Design the substrate interface for session <N>. Write the resolved interface into
  PLAN's ## Cross-session contracts subsection <X>. Return `design-confident <summary>` if the
  design is PLAN-consistent and high-confidence, or `design-uncertain-HALT <what cannot be
  reconciled against the PLAN's provisions/anticipations/quantifications>` if not. Default strongly
  to `design-confident` — halt only when genuinely irreconcilable.

  Discovery: The subagent reported: "<discovery>". Does this invalidate a frozen downstream
  contract? Return one of: internal-continue / additive-reshard <spec> / destructive-HALT, with one
  paragraph of reasoning and the affected contract(s) named.

  Boundary: Re-read ## Purpose (design intent) and the frozen-contract list. Are we still tracking
  the design intent? Return: still-on-intent <notes> OR drift-HALT <what changed and why it needs
  sign-off>.
  SUPERSEDED CLAIMS: <claims this sub-track corrected/invalidated, from the digest and ledger, or
  "none">.
  SEARCH CANDIDATES: <file:line hits for those claims in durable docs, comments, tests, or "none
  found">. For each, say in your notes whether it is a contradiction of the corrected contract and
  its evidence, a harmless historical quotation, or a keyword match; name every contradiction. A
  clean search is not proof the claims are gone — check the surviving prose you can see, not only
  the hits.
  PLANNING-REFERENCE REVIEW (distinct from the claim check above; independent of grep hits):
    CHANGED DURABLE FILES: <the sub-track's changed durable-file list>
    DIFF RANGE: <recoverable range, e.g. <base>..<tip>>
    ANNEAL GREP: <patterns used; hits with the driver's triage and any uncertain hits, or "zero
    hits">. A clean grep proves only that its patterns found nothing.
    Read the changed durable prose in those files, with enough surrounding surviving context, for
    leaked planning references — session, contract or category labels, numbered principles, phase
    names, "the plan's ...", paraphrases of plan structure — whether or not grep matched them.
    Include source and test comments and docstrings, not only Markdown. Triage by context: retain
    legitimate domain uses (mathematical symbols, algorithmic phases, literal identifiers,
    historical quotations). Report each genuine leak as file:line, and each uncertain referent
    separately; do not invent a referent. If you cannot complete the review, return the scope limit
    explicitly — never imply the files are clean.

CONSTRAINTS:
- Return one-shot. Do not ask the user anything — anything needing human sign-off comes back as a
  flagged recommendation in your return; the driver surfaces it.
- Do NOT implement. Do NOT dispatch subagents.
- Write to PLAN's ## Cross-session contracts ONLY if this is an inflection-design juncture.
```

## Fix-loop dispatch

When dispatching a `@build` fix subagent (step 4f, the F-fix defect-check dispatch, or the
anneal-fix and boundary correction in step 7), include one line in the prompt: "REGISTER rule
applies — see dispatch template." Include the WORKER HYGIENE block in these and every other
`@build` dispatch (see Worker hygiene block). Under a bound cadence, also require the fix worker to
return fresh evidence records for its final inputs (CADENCE VARIANT fields). Fix forks edit durable files and the same plan-coordinate
prohibition applies. Line-length overruns are not a fix trigger: a session whose only blemish is
over-width lines is green; note them in the ledger for the general anneal sweep (`/plan-anneal`
line-length pass) and do not open a Fix-loop iteration over them. Exception: a project gate that
hard-fails on line length — fix those with the project formatter. A bounded F-fix dispatch for a
paired unit additionally includes the unit's intent capsule and the named defect — it is scoped to
that defect, not a re-opening of the whole feature stage.

## Constraints

- Runs from `@plan-admin` only. Implementation is always dispatched down-tier.
- `@plan-juncture` (T0) is paged as a subagent only at the three junctures (inflection design,
  discovery adjudication, sub-track boundary). It is never resident for the loop.
- One session-list row → one session commit + one ledger commit. No batching — except a row marked
  `(F/C)`, whose F-stage and C-stage are two dispatches sharing that one session commit (step 3b),
  never two commits. This is the only replacement of the one-dispatch rule, and it applies only to
  rows `/plan-shard` explicitly marked `(F/C)`.
- The driver gates mechanically (4a–4d); `@plan-juncture` adjudicates discoveries (4e fork); subagents
  implement and never self-commit; `@committer` commits and never verifies. Roles stay separate (per
  AGENTS.md autonomous-chain carve-out).
- The Fix-loop is capped (2 iterations) — non-convergence halts, never grinds.
- The halt classes (`design-uncertain-HALT` from an inflection fork, `destructive-HALT` from a
  discovery fork, committer secret/refusal, non-convergence/deadlock, `BLOCKED: worker hygiene`
  (outstanding worker job or stash drift, step 3a), and — cadence projects only —
  `BLOCKED: freshness finding` against inputs the chain did not change) are the ONLY autonomous stops
  on the happy path. Everything else continues. The enrolled agents hold fiduciary latitude under
  fidelity to the PLAN; halts are reserved for the irreconcilable, never for mere deviation.
- PLAN is committed only as its own rolling-context commit (step 6b), never folded into a session
  commit. After each full iteration the tree is clean and the committed ledger+digest matches the
  last committed session — this is the resumability invariant precondition 5 enforces. The one
  documented exception is the F/C in-flight boundary (step 3b.d): the capsule write there is
  deliberately left uncommitted until the unit's single post-gate commit, per Precondition 5's
  in-flight exception.
- This command does not push, does not rewrite history, does not edit source itself.
- Old single-stage plans are unaffected: a plan with no `(F/C)`-marked row behaves exactly as before
  this pattern existed.

## Exit report

- Sessions completed this run (with commit hashes), sessions remaining, and any `(skippable)` row
  skipped with its reason.
- Juncture fork count: how many times `@plan-juncture` was paged (inflection / discovery / boundary), and the
  verdict from each.
- Any paired `(F/C)` units run this pass: unit id, whether both stages completed or one is left
  in-flight, and the checkpoint location in `## Completion handoffs` for a cold resume.
- Gate outcomes (cadence projects): per check `passed` / `reused` / `deferred`, any check still
  deferred with its next checkpoint, and the freshness evidence's database identity and refresh time.
  Never summarize a run with a deferred check as a full-gate pass.
- Any halt: class, the surfaced detail, and the resume instruction.
- Ledger path and last-updated row.
- Capture candidates surfaced during the run (per AGENTS.md three-axis test).
