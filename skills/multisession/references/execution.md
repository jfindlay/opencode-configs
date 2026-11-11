# Execution: running a sharded PLAN

Procedure for `@plan-admin`. Input is the caller-supplied command arguments:
`[plan-path] [may-reshard|halt-at-boundaries]`. Read `plan-format.md` (shapes, statuses, verdicts)
and `artifact-hygiene.md` (REGISTER block, anneal and boundary procedures) before the first
dispatch. Load `paired-units.md` and `verification.md` only on the triggers named below. Plans with
no `(F/C)` row and no declared cadence never need either.

## Roles and invariants

- **Driver (`@plan-admin`, T1):** selects, dispatches, gates mechanically, commits via `@committer`,
  keeps ledger and digest. Never implements, never adjudicates, never edits source.
- **`@build` / `@explore`:** `@build` implements (setup and multi-file work included); `@explore`
  does research. Workers never commit.
- **`@committer`:** stages exactly the authorized files and commits.
- **`@plan-juncture` (T0):** forked one-shot at the three junctures only; never resident.
- `Tier` in the session list is required design judgment, not a worker-model selector. Dispatch and
  model pins are unchanged.
- **State lives on disk.** Every iteration re-derives state from PLAN (session list, ledger,
  digest) and may resume cold from the ledger alone; never rely on in-context memory across
  iterations. Each iteration ends with a session commit and a ledger commit (6b), so the tree is
  clean and the committed ledger exactly matches the last committed session. The one exception is
  the F/C in-flight checkpoint (`paired-units.md`).
- **Fiduciary latitude.** Invoking `/plan-run` accepts the implementation path-space the agents
  judge best, not a literal line-item contract. Medium deviation that a fork reconciles against the
  PLAN rides through, reported in the digest; halts are reserved for the irreconcilable (see Stops).

## Preflight (once, before the loop)

1. **Bind PLAN.** The first path-like token (ending `.md` or any explicit path) of the arguments is
   PLAN; default `docs/PLAN.md`. Remaining tokens are run flags. Ask which if several sharded plans
   exist and none was named.
2. **Bind VERIFY.** Discover; do not assume `make`. Check in order: `Makefile` `test`/`typecheck`
   targets; `tox.ini` / `pyproject.toml [tool.tox]` (the project's analyze invocation, e.g.
   `~/.local/bin/tox -m analyze`, which subsumes tests, types, lint, coverage); `package.json`
   scripts; else ask. Record the commands in the ledger header. A combined command satisfies 4a and
   4b in one green run and stays indivisible unless the project explicitly declares it split.
3. **Bind CADENCE.** Read PLAN's `## Verify gate` (and the project documents it points to) for an
   explicit cadence declaration. Bind only what is declared; never infer one. If found, load
   `verification.md` now, before using it, and record the cadence in the ledger header. No
   declaration means `none declared`: no evidence-reuse or cadence exception exists and every gate
   requirement below applies as written.
4. **Structural preconditions** (refuse and stop on failure):
   1. Running from `@plan-admin`; else tell the user to switch.
   2. PLAN exists with `## Session list` and `## Cross-session contracts`. If any row is `(F/C)`,
      PLAN also needs `## Completion handoffs` (add it empty and commit via `@committer` as
      "Initialize PLAN completion handoffs" if absent).
   3. PLAN has a `## Progress ledger` table; if absent, stop and tell the user to add it (one-time
      upgrade from a prose Progress section).
   4. PLAN has `## Action-frame digest` (may be empty); if absent, add it empty and commit via
      `@committer` as "Initialize PLAN digest".
   5. **Tier markers.** Every row whose `Tier` is T0 carries the `@architect` inflection marker. A
      T0 row without it is surfaced for reconciliation (re-shard or user decision) before the loop
      starts; never ignore the tier and never change the worker model.
   6. VERIFY commands are resolved.
5. **Tree state.** Before refusing a dirty tree: if PLAN has a `## Completion handoffs` entry whose
   Status is not `consumed`, load `paired-units.md` and apply its checkpoint validation first. If
   the tree matches a recorded checkpoint, resume as it directs. Otherwise the tree must be clean,
   including PLAN: any dirty file means a prior session or ledger commit did not land, so refuse and
   surface; never stomp uncommitted work, and never `git reset`, `git stash`, or commit drift to
   manufacture a baseline. One exception: if PLAN is dirty only because it was just sharded or
   ledger-initialized and never committed, commit it first via `@committer` ("Initialize PLAN
   ledger") to establish the baseline.

## The loop

Repeat until every row is `done` or authorized `skipped`, or a stop fires (Stops).

### 1. Select

- Take the lowest-numbered `pending` row whose `Consumes` dependencies are all `done` (a `skipped`
  row counts as satisfied).
- **Skippable row.** Only a row tagged `(skippable)` may be skipped. Decide before dispatch whether
  the sweep is worth a session. Skip when evidence says it would be a near no-op: each sub-track's
  anneal gate ran clean, the ledger records no (or only trivial) deferred line-length overruns, a
  seed-pattern grep and a `.{101,}` grep over the arc's durable files find nothing material, and
  each boundary note records a completed planning-reference review (a clean grep alone is thin
  evidence). Run it when any of those fail. To skip, mark the row `skipped` with a one-line reason
  and commit as `Ledger: <session-id> skipped` (6b). If it runs, dispatch `@build` to carry out
  `/plan-anneal` over the project with the line-length pass in scope, under the usual REGISTER and
  WORKER HYGIENE blocks and Fix-loop rules.
- **Freshness (cadence only).** Before dispatching, apply the freshness rule in `verification.md`.
- None runnable but `pending` rows remain → stop (`BLOCKED: dependency deadlock`), surface the rows.
  None remain → Completion.
- **Paired row.** If the selected row is `(F/C)`, load `paired-units.md`; its phase selection
  decides between the F-stage and C-stage and whether step 2 applies.

### 2. Inflection

If the row is marked `@architect` inflection point, fork `@plan-juncture` (type `inflection-design`)
with the Juncture template, the entry, the contracts it consumes/produces, and the full digest. The
fork writes the resolved interface into PLAN's contracts subsection and returns:

- `design-confident <summary>`: self-continue to step 3 and append a digest entry noting the
  inflection was designed and self-cleared.
- `design-uncertain-HALT <what cannot be reconciled>`: halt for human sign-off, surfacing it.

With `halt-at-boundaries`, every inflection halts for sign-off after the design regardless of
verdict.

### 3. Classify and dispatch

- **Context-substance** (research, schema discovery, design artifact; no code): fork `@explore`;
  its output is a written artifact appended to PLAN or a NOTES file.
- **Code-change** (any category, including Cat A not flagged for inflection, and setup work such as
  a skeleton row; task size does not select another agent): dispatch `@build` with the Dispatch
  template. The worker leaves the tree dirty with green tests and does not commit.

One row is one dispatch is one commit. The only exception is an `(F/C)` row (two dispatches, one
commit; `paired-units.md`). Never batch rows; never split an unmarked row. Dispatch prompts carry
the row entry and the contract subsections it consumes as excerpts, not the whole PLAN; a pointer to
fuller evidence is enough. A worker receives everything it needs in its prompt and does not reload
this skill.

**Telemetry.** A session-economics report on a returned task informs the sizing of later dispatches
only. Do not poll for it, and do not reshard or page `@plan-juncture` because a warning fired. Steps
4–7 remain the only authorities on whether a session passed.

### 3a. Worker hygiene (after every return)

`git status` does not show stashes. Before the iteration's first dispatch, record stash identities
in order with `git stash list --format=%H` (hashes are stable; `stash@{n}` shifts) in working notes;
if lost (compaction, cold resume), re-take and note in the ledger that earlier drift is unchecked.
After **every** worker return (F, C, fix, KAT-add, anneal, correction, partial F-stage included),
before gating or capsuling it, compare the stash list and read the return's owned-jobs statement:

- Missing statement: send one clarification to the same worker; it changes no code and does not
  count against the Fix-loop budget.
- Outstanding or unstoppable worker job, a stash difference in identity or order (not just count),
  or a worker that changed pre-existing processes or stashes: stop (`BLOCKED: worker hygiene`) and
  surface it; do not accept the return as a pass. Never delete, pop, or drop a stash, or kill by
  process name; leave reconciliation to a human.
- A worker-reported incomplete check is a missing check, never a pass.

Accepted returns with valid evidence records proceed to step 4; the driver does not rerun a
completed check whose evidence is valid.

### 4. Gate (mechanical; driver only)

Runs once per row after its dispatch and 3a: for an `(F/C)` row, once after C, against the combined
diff.

- **a. Run VERIFY_TEST** (tests green) and **b. run VERIFY_TYPES** (types clean); a combined gate
  satisfies both, plus any lint/format/coverage it enforces. Red → Fix-loop. With a bound cadence,
  validate the returned evidence records instead (`verification.md`): valid → `reused`, missing or
  invalidated → run it, `passed`. A diff proven non-executable owes only the project's declared
  documentation or contract checks, noted `non-executable diff`.
- **c. KAT present.** The entry names at least one KAT; confirm a new or changed test asserts it
  (Grep the named test file). Absent → dispatch `@build` once to add it, then re-verify; still
  absent → stop (`BLOCKED: KAT contract undefined`).
- **d. Expected files match** `git status` versus the entry. PLAN may be dirty from an inflection
  write or an uncommitted intent capsule; it is never part of the session commit. A plainly in-unit
  extra file (e.g. `__init__.py`) is allowed and noted; one touching another session's surface →
  stop (`BLOCKED: scope drift`).
- *Paired row:* the defect check (`paired-units.md`) runs here, before 4e.
- **e. Discovery check.** Did the worker report a discovery contradicting a downstream contract (a
  frozen interface, a KAT, a named prose invariant)? None → step 5. Flagged → fork `@plan-juncture`
  (`discovery-adjudication`) with the discovery, affected contracts, affected downstream sessions,
  and the full digest. A contract-changing discovery is never resolved unilaterally by a worker or
  the driver. Verdicts:
  - `internal-continue`: append to `## Discoveries & risks`; continue to step 5.
  - `additive-reshard <spec>`: honoured only with `may-reshard` **and** an additive change (insert a
    session; widen a not-yet-frozen contract). Re-shard the downstream list per the spec and record
    it. Otherwise it is not honoured: stop and surface the spec.
  - `destructive-HALT`: always stops, regardless of `may-reshard`. It means the discovery is both
    badly wrong and irreconcilable against the PLAN's provisions, anticipations, or quantifications,
    not merely a deviation. Surface the discovery, contract, and downstream sessions. Autonomous
    destructive reshard is never permitted. Append a digest entry for the iteration.
- **f. Fix-loop.** On red tests/types: dispatch one `@build` fix with the failure output, re-verify.
  Cap 2 fix iterations; the third failure stops (`BLOCKED: session does not converge`). The budget
  is one pool of corrective dispatches for the row (gate fixes, the hook-failure fix, and for a
  paired row its F-fix); a planned F→C handoff neither consumes nor resets it. Boundary corrections
  draw on the Fix-loop budget as step 7 states. Line-length overruns are never a fix trigger (see
  below). Fix workers return fresh evidence under a cadence; any later edit invalidates it.
- **g. Cadence checks on the unit** (cadence only): `verification.md` "Unit-level checks".

**Line length.** A session whose only blemish is over-width lines is green. Note file and rough
count in the ledger for the `/plan-anneal` line-length pass; never open a Fix-loop iteration over
them. Exception: a project gate that hard-fails on line length is a green-gate requirement, fixed
in-session with the project formatter.

### 5. Commit the session

Only when 4a–4e (and 4g under a cadence) pass. Under a cadence, evidence must still match the tree
about to be committed; revalidate after any worker or hook edit, never commit under stale green.
Dispatch `@committer` per the AGENTS.md autonomous-chain carve-out with:

- `SESSION CONTRACT`: the entry's commit title and one-line why.
- `EXPECTED FILES`: the entry's list plus allowed extras from 4d. PLAN is never included; instruct
  the committer to stage only these files explicitly (not `git add -A`) and refuse if PLAN is
  staged.
- `COMMIT TITLE HINT`: the entry's title.
- `CO_AUTHOR`: the content agent(s) that produced the diff, per `AGENTS-ROSTER.md` attribution
  (same-model stages dedupe to one trailer; do not invent a stage-specific identity).

On refusal: `empty diff` / `scope drift` / `incomplete` → stop (`BLOCKED: committer refusal`),
surface the output, do not work around it. `hook failure` → one `@build` fix with the hook output,
re-verify from 4a, re-commit; this consumes the Fix-loop budget, and a hook that rewrote files is a
post-validation edit (invalidate affected evidence, re-verify). `secret risk` → HALT immediately;
never bypass.

### 6. Ledger and digest

On a successful session commit, write to PLAN: mark the row `done` with the commit short-hash
(`done` is reached only here); mark contracts the row froze (substrate interfaces, KAT additions);
note allowed extras and logged discoveries; under a cadence write the gate-evidence lines
(`verification.md`; a row with a deferred check is never a full-gate pass; earlier entries are never
edited to look fresh). Append one digest block if the iteration was non-trivial. A paired row's
bookkeeping is in `paired-units.md`. PLAN is a rolling-context file: both writes use the driver's
rolling-context write permission.

### 6b. Commit the ledger

Immediately dispatch `@committer` staging ONLY PLAN, titled `Ledger: <session-id> done, freeze
<contract>` (or `Ledger: <session-id> done`). It is a separate commit, never folded into the session
commit. Afterward the tree is clean and the committed ledger and digest match the last committed
session.

### 7. Sub-track boundary (◆)

After the last row of a sub-track, in this order (procedures: `artifact-hygiene.md`):

1. **Anneal gate.** Grep the sub-track's durable files against PLAN's denylist (or the canonical
   seed); triage each hit. Genuine leaks → one `@build` anneal-fix dispatch (counts against the
   Fix-loop budget); re-grep and re-read the named prose. Still leaking → stop (`BLOCKED: anneal
   failed to converge`). An uncertain referent is neither fixed nor dismissed: it goes to the fork.
2. **Boundary checks (cadence only)**, after a clean anneal gate: `verification.md` "Boundary
   checks".
3. **Stale-claim candidates** and 4. **planning-reference review inputs**, gathered per
   `artifact-hygiene.md`.
5. **Fork `@plan-juncture`** (`boundary-transform`) with the Juncture template: `## Purpose`, frozen
   contracts, the full digest, the superseded claims and candidates, and the review inputs. This is
   the one boundary fork; the review is part of it.
6. **Handle the return** (`still-on-intent <notes>` / `drift-HALT <what changed and why>`).
   Contradictions or leaked planning references it names → one `@build` correction (REGISTER rule
   applies; counts against the Fix-loop budget); re-check the named candidates and re-read the named
   prose. Anything still standing is not a clean review: record it in the boundary note and summary
   and stop as non-convergence naming it. A contradiction that would invalidate a frozen contract or
   the design intent is `drift-HALT`, not a correction. An uncertain referent is reported, not
   invented or deleted. A reported scope limit is recorded and the review counts as incomplete,
   never clean. Corrections follow the evidence-invalidation rules: an executable edit invalidates
   affected evidence; a proven prose-only edit does not.
7. `still-on-intent`: reconcile the ledger's frozen contracts against PLAN's stated contracts, note
   drift, and continue. `drift-HALT`: halt for human sign-off with the fork's output.

Self-continue at ◆ unless the fork returns `drift-HALT` or the run has `halt-at-boundaries`. Then
return to step 1.

## Completion (final delivery)

Reached when every row is `done` or authorized `skipped`. Without a cadence there is no further
gate: report per Exit report. With a cadence, apply `verification.md` "Final delivery". Corrections
needed here are committed per step 5; the outcome update is committed per 6b.

## Stops (single authoritative list)

Everything not listed continues. Halts are for the irreconcilable; mere deviation never halts.

| Stop | Trigger | Step |
|---|---|---|
| refusal at preflight | not `@plan-admin`; PLAN or required section missing; T0 row lacks marker; unexplained dirty tree; checkpoint mismatch | preflight |
| `design-uncertain-HALT` | inflection fork cannot reconcile | 2 |
| inflection sign-off | every inflection under `halt-at-boundaries` | 2 |
| `BLOCKED: dependency deadlock` | pending rows, none runnable | 1 |
| `BLOCKED: freshness finding` | cadence only: freshness failure on inputs the chain did not change | 1 |
| `BLOCKED: worker hygiene` | outstanding job or stash/process drift | 3a |
| `BLOCKED: KAT contract undefined` | KAT absent after one add retry | 4c |
| `BLOCKED: scope drift` | file on another session's surface | 4d |
| `destructive-HALT` | discovery fork | 4e |
| reshard not honoured | `additive-reshard` without `may-reshard`, or not additive | 4e |
| `BLOCKED: session does not converge` | third failed fix; boundary or final-delivery non-convergence | 4f, 7, Completion |
| `BLOCKED: committer refusal` | empty diff / scope drift / incomplete | 5 |
| secret risk | committer reports it | 5 |
| `BLOCKED: anneal failed to converge` | leak persists after anneal-fix | 7 |
| `drift-HALT` | boundary fork | 7 |
| boundary sign-off | every ◆ under `halt-at-boundaries` | 7 |

Also forbidden: pushing, rewriting history, editing source yourself. If the plan needs resharding
beyond what `may-reshard` permits, stop and surface it.

## Common dispatch templates

The driver fills every placeholder; workers cannot read this file. Every `@build` dispatch (Dispatch
template, F/C templates, KAT-add, fix, F-fix, hook-fix, anneal-fix, boundary correction, the
skippable anneal row) includes the REGISTER block (`artifact-hygiene.md`) and the WORKER HYGIENE
block below verbatim; the Fix-loop prompts add the failure, hook, or finding that triggered them.
Under a cadence, add the cadence variant from `verification.md`.

### WORKER HYGIENE block

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

### Dispatch template (code-change session)

```
Working directory: <project root>
Thoroughness: medium
Read-only: NO (this is an implementation session).

You are executing ONE session from <PLAN>: session <N> — "<title>". Read ONLY: the <N> entry in
<PLAN>, and the "## Cross-session contracts" subsections it Consumes. Do NOT read the rest of the
plan or the roadmap. Do NOT start any other session. Do NOT commit — leave the tree dirty with
green tests.

DELIVERABLE
<the entry's bullet list, verbatim>

CONTRACTS YOU CONSUME (do not break these)
<the relevant frozen contracts, verbatim, including any prose invariant the entry names>

CONTRACTS YOU PRODUCE
<what later sessions will consume from you; if substrate, over-specify per the plan>

<REGISTER block, verbatim>

<WORKER HYGIENE block, verbatim>

DONE WHEN
- <the entry's KAT(s)> pass.
- <VERIFY_TEST> and <VERIFY_TYPES> are green (the driver substitutes the bound commands).
- Exactly these files are modified: <expected files>.

RETURN
The exact check results. A discovery that would contradict a contract you consume or a KAT is not
yours to resolve: name the contract plainly. Report any over-width lines you left.
```

### Fix, KAT-add, correction, and anneal-row dispatches

Scoped to the named failure, hook output, missing KAT, finding, or anneal scope:

```
Working directory: <project root>
Thoroughness: medium
Read-only: NO. Do NOT commit — leave the tree dirty with green tests.

TASK
<the failure output, hook output, missing KAT, or named finding to fix; for the anneal row: carry
out the standalone annealing procedure in <skill base>/references/artifact-hygiene.md over
<scope>, with the line-length pass in scope, denylist from <PLAN> "## Notes for executors" if
present else the canonical seed in that file>

CONTRACTS YOU MUST NOT BREAK
<the relevant frozen contracts, verbatim, or "none">

<REGISTER block, verbatim>

<WORKER HYGIENE block, verbatim>

DONE WHEN
- The named failure is fixed (or the KAT exists and passes) without weakening any assertion.
- <VERIFY_TEST> and <VERIFY_TYPES> are green (the driver substitutes the bound commands).
- Only these files are modified: <expected files, or the anneal scope>.

RETURN
What you changed and why, the exact check results, any discovery contradicting a contract you must
not break (named plainly, not resolved by you), and any over-width lines you left.
```

Over-width lines are not a fix trigger. A paired-unit F-fix additionally carries the unit's intent
capsule and the named defect (`paired-units.md`).

### Juncture fork template (`@plan-juncture`)

The fork loads no skill resources: the prompt carries the full scoped question, return contract,
digest, and review inputs.

```
Working directory: <project root>
Thoroughness: very thorough
Read-only: YES (except inflection-design forks, which write to PLAN's contracts section only).

JUNCTURE TYPE: <inflection-design | discovery-adjudication | boundary-transform>

PLAN FILE: <PLAN path>
SESSION ENTRY: <entry N verbatim>
FROZEN CONTRACTS (do not break these): <relevant frozen-contracts list from the ledger>
DESIGN INTENT (boundary only): <## Purpose (design intent) verbatim>
AFFECTED CONTRACTS / DOWNSTREAM SESSIONS (discovery only): <the contracts and downstream sessions
  the discovery touches, verbatim from PLAN>

ACTION-FRAME DIGEST:
<full ## Action-frame digest section verbatim>

JUNCTURE QUESTION:
<one of:>
  Inflection: Design the substrate interface for session <N>. Write the resolved interface into
  PLAN's ## Cross-session contracts subsection <X>. Return `design-confident <summary>` if the
  design is PLAN-consistent and high-confidence, or `design-uncertain-HALT <what cannot be
  reconciled against the PLAN's provisions/anticipations/quantifications>` if not. Default strongly
  to `design-confident`; halt only when genuinely irreconcilable.

  Discovery: The worker reported: "<discovery>". Does this invalidate a frozen downstream contract?
  Return one of: internal-continue / additive-reshard <spec> / destructive-HALT, with one paragraph
  of reasoning and the affected contract(s) named. Reconcile against the PLAN first; issue
  destructive-HALT only when the discovery is both badly wrong and irreconcilable.

  Boundary: Re-read ## Purpose (design intent) and the frozen-contract list. Are we still tracking
  the design intent? Return: still-on-intent <notes> OR drift-HALT <what changed and why it needs
  sign-off>.
  SUPERSEDED CLAIMS: <claims this sub-track corrected/invalidated, from the digest and ledger, or
  "none">.
  SEARCH CANDIDATES: <file:line hits for those claims in durable docs, comments, tests, or "none
  found">. For each, say whether it is a contradiction of the corrected contract and its evidence, a
  harmless historical quotation, or a keyword match; name every contradiction. A clean search is not
  proof the claims are gone: check the surviving prose you can see, not only the hits.
  PLANNING-REFERENCE REVIEW (distinct from the claim check; independent of grep hits):
    CHANGED DURABLE FILES: <the sub-track's changed durable-file list>
    DIFF RANGE: <recoverable range, e.g. <base>..<tip>>
    ANNEAL GREP: <patterns used; hits with the driver's triage and any uncertain hits, or "zero
    hits">. A clean grep proves only that its patterns found nothing.
    Read the changed durable prose in those files, with enough surrounding surviving context, for
    leaked planning references (session, contract or category labels, numbered principles, phase
    names, "the plan's ...", paraphrases of plan structure), whether or not grep matched them.
    Include source and test comments and docstrings, not only Markdown. Retain legitimate domain
    uses (mathematical symbols, algorithmic phases, literal identifiers, historical quotations).
    Report each genuine leak as file:line and each uncertain referent separately; do not invent a
    referent. If you cannot complete the review, return the scope limit explicitly; never imply the
    files are clean.

CONSTRAINTS:
- Return one-shot. Do not ask the user anything; anything needing human sign-off comes back as a
  flagged recommendation.
- Do NOT implement. Do NOT dispatch subagents.
- Write to PLAN's ## Cross-session contracts ONLY if this is an inflection-design juncture.
```

## Exit report

- Sessions completed this run (with commit hashes), sessions remaining, any `(skippable)` row
  skipped with its reason.
- Juncture forks paged (inflection / discovery / boundary) and each verdict.
- Paired `(F/C)` units run: unit id, whether both stages completed or one is in flight, and the
  checkpoint location for cold resume.
- Cadence projects: per-check `passed` / `reused` / `deferred`, any still-deferred check with its
  next checkpoint, and the freshness evidence's database identity and refresh time. A run with a
  deferred check is never summarized as a full-gate pass.
- Any stop: class, surfaced detail, resume instruction.
- Ledger path and last-updated row.
- Capture candidates surfaced (AGENTS.md three-axis test).
