---
description: "[jf] Autonomously execute a session-sharded plan file as a 1:1 session:commit chain. @plan-admin (T1) orchestrates the mechanical loop; dispatches @build/@general/@explore per session entry, @committer for commits, and pages a forked @plan-juncture (T1) only at inflection points, contract-invalidating discoveries, and sub-track boundaries. State lives in the committed plan ledger. Args: [plan-path] [may-reshard|halt-at-boundaries|fully-autonomous]. Plan path defaults to docs/PLAN.md."
agent: plan-admin
subtask: false
---

# /run-plan

Drive a session-sharded plan file to completion as an autonomous chain. The plan must already be in
session-list form (one commit-shaped session per row, each with a title, category, tier, expected
files, and consumed contracts) per `multi-session-planning.md`.  This command does NOT shard a plan
— that is a `@plan-deep` interactive task. It EXECUTES an already-sharded one.

This command runs from `@plan-admin` (T1). The mechanical loop — select, dispatch, gate, commit,
ledger — is entirely the driver's work. T1 judgment (discovery adjudication, inflection-point
interface design, sub-track boundary coordinate-transform) is paged in by forking `@plan-juncture` at the
three junctures only. Implementation is dispatched down-tier to `@build`/`@general`; research to
`@explore`. If invoked from a non-`plan-admin` session, stop and tell the user to switch.

User input: $ARGUMENTS

## Preflight (resolve once at loop start; record bindings in the ledger header)

Resolved ONCE before the loop, then referenced throughout. These turn the project-specific facts the
command used to hardcode (`docs/PLAN.md`, `make`) into discovered values, so the driver never has to
override a false precondition mid-run.

1. **Bind PLAN — the plan file path.** Parse `$ARGUMENTS`: the first path-like token (ending `.md`,
   or any explicit path) is PLAN. Default `PLAN = docs/PLAN.md`. Remaining tokens are run-config
   flags (`may-reshard`, `halt-at-boundaries`, `fully-autonomous`).  Every "the plan" /
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
     (and any lint/format/coverage it enforces) — note this in the ledger.

## Invariant: state lives on disk, not in context

Every loop iteration re-derives its state from PLAN (session list + ledger + action-frame digest).
The driver must be able to resume cold from the ledger alone. Do NOT rely on in-context memory of
prior iterations for correctness — between any two iterations the context may have compacted. After
each committed session, the ledger is the source of truth for "what's done and what contracts are
now frozen;" the action-frame digest is the source of truth for "what was learned."

This invariant is enforced mechanically: every iteration ends with both a session commit AND a
ledger commit (step 6b), so the tree is clean and the committed ledger+digest exactly matches the
last committed session. A cold resume never has to reconcile uncommitted state against the code.

## Preconditions (refuse and stop if any fail)

1. Running from `@plan-admin`. Else: stop, tell the user to switch.
2. PLAN (bound in Preflight) exists and contains a `## Session list` table and a `## Cross-session
contracts` section.
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
6. VERIFY commands (bound in Preflight) are resolved. The verify gate depends on them.

## The loop

Repeat until all session-list rows are `done` in the ledger, or a halt condition fires.

### 1. Select the next session

- Read the ledger. Find the lowest-numbered session row whose status is `pending` and whose
  `Consumes` dependencies are all `done`.
- If none is runnable but `pending` rows remain → halt (`BLOCKED: dependency deadlock`), surface the
  offending rows.
- If none remain → the chain is complete; go to Completion.

### 2. Check for a halt-before marker (inflection point)

If the selected session is marked **`@plan` inflection point** in the plan:

- Fork `@plan-juncture` (subagent) with the juncture fork template (see below), type `inflection-design`.
  Include the inflection session entry, the contracts it consumes/produces, and the full current `##
  Action-frame digest`.
- The fork designs the substrate interface and writes the resolved design into PLAN's relevant `##
  Cross-session contracts` subsection, then returns a one-paragraph summary.
- **HALT for human sign-off.** Surface the returned design. Do not dispatch implementation until the
  user approves.
- On approval, resume at step 3 for this session (dispatch `@build` to implement the design the fork
  just wrote).

Rationale: substrate interfaces are consumed by many downstream sessions; reworking them later is
the expensive failure mode the inflection point exists to prevent. The fork produces the design
one-shot; the human loop lives here in the driver.

### 3. Classify and dispatch the session

Read the session entry's category:

- **Context-substance** (research, schema discovery, design artifact, no code): fork `@explore`.
  Output is a written artifact appended to the plan or a NOTES file.
- **Code-change, Category B/C** (algorithm/optimization on a frozen substrate): fork `@build`.
  Scoped prompt (see Dispatch template) — names ONLY this session's entry plus the contracts it
  consumes; instructs the subagent NOT to read the Roadmap appendix or any other session. Subagent
  leaves the tree dirty with green tests; does NOT commit.
- **Code-change, Category A (substrate)** not flagged `@plan`: the driver dispatches `@build`
  directly (cheap cases where the interface is already written into contracts), or dispatches
  `@general` for heterogeneous setup work (e.g. S0 skeleton). Use judgment.

One session = one dispatch = one commit. Never batch two session rows into one dispatch.

### 4. Verify the session contract (mechanical gate — driver only, no `@plan-juncture`)

After the implementation subagent returns, the driver — NOT a paged `@plan-juncture` fork — verifies,
mechanically:

a. **Tests green.** Run VERIFY_TEST. Red → go to Fix-loop (step 4f).  b. **Types clean.** Run
VERIFY_TYPES. Red → Fix-loop. (When VERIFY is one combined gate — e.g. `tox -m analyze` — a single
green run satisfies both, plus any lint/format/coverage it enforces.) c. **KAT present.** The
session entry names ≥1 KAT. Confirm a new/changed test asserts it (search the test file named in the
entry using the Grep tool). Absent → the contract is undefined; dispatch `@build` once to add the
KAT, then re-verify. Still absent after one retry → halt (`BLOCKED: KAT contract undefined`).  d.
**Expected files match.** `git status` modified/added set vs. the entry's expected files. PLAN may
be dirty here if an inflection-point design write (step 2) preceded the dispatch — it is never part
of the session commit (step 5) and is committed separately in step 6b. Any other unexpected file →
potential scope drift; inspect. If the extra file is plainly part of the unit (e.g. an
`__init__.py`), allow and note it in the ledger; if it touches another session's surface → halt
(`BLOCKED: scope drift`).  e. **Discovery check — page `@plan-juncture` when flagged.** Did the subagent
report a discovery that contradicts a *downstream* contract (a frozen interface, a KAT, a named
prose invariant)?
   - **No discovery flagged:** continue to step 5.
   - **Discovery flagged:** fork `@plan-juncture` (subagent) with juncture type `discovery-adjudication`.
     Include the discovery, the affected contract(s), the affected downstream sessions, and the full
     current `## Action-frame digest`. Await the fork's one-shot verdict:
     - `internal-continue`: append to `## Discoveries & risks` in PLAN; continue to step 5.
     - `additive-reshard <spec>`: honoured ONLY if run was invoked with `may-reshard` AND the change
       is *additive* (insert a new session; widen a not-yet-frozen contract). Re-shard the
       downstream session list per the spec, record in `## Discoveries`, continue.
     - `destructive-HALT`: ALWAYS HALT regardless of `may-reshard`. Surface the discovery, the
       affected contract, and the affected downstream sessions. Autonomous destructive re-shard is
       never permitted.  Also append a digest entry for this iteration (non-trivial — a discovery
       was flagged).  f. **Fix-loop.** On red tests/types: dispatch one `@build` fix subagent with
       the failure output. Re-verify. Cap at 2 fix iterations; on the 3rd failure → halt (`BLOCKED:
       session does not converge`). Do not let the fix-loop run unbounded.

### 5. Commit the session via @committer

Only when steps 4a–4e pass. Dispatch `@committer` per the autonomous-chain carve-out in AGENTS.md
with:
- `SESSION CONTRACT`: the session entry's commit-title + one-line why.
- `EXPECTED FILES`: the entry's expected-files list (plus any allowed extras from 4d).  PLAN is
  never in this list — instruct the committer to stage only the session's expected files explicitly
  (not `git add -A`) and to refuse if PLAN appears staged.
- `COMMIT TITLE HINT`: the entry's commit title.

`@committer` stages exactly those files or refuses. On refusal:
- `empty diff` / `scope drift` / `incomplete` → the verify gate and committer disagree; halt
  (`BLOCKED: committer refusal`), surface the committer output. Do not work around.
- `hook failure` → dispatch one `@build` fix subagent with the hook output, re-verify from 4a,
  re-commit. This is part of the Fix-loop budget (cap 2).
- `secret risk` → HALT immediately, surface, never bypass.

### 6. Update the ledger and digest

On a successful session commit:

a. **Ledger:** write to PLAN's `## Progress ledger`:
   - Mark the session row `done`, record the commit short-hash.
   - Mark any contracts the session FROZE (substrate interfaces, KAT additions) as frozen, so later
     iterations treat them as fixed.
   - Note any allowed scope extras and any logged discoveries.

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

- Fork `@plan-juncture` (subagent) with juncture type `boundary-transform`. Include the `## Purpose (design
  intent)`, the frozen-contract list, and the full current `## Action-frame digest`.
- The fork returns: `still-on-intent <notes>` or `drift-HALT <what changed and why>`.
- If `still-on-intent`: reconcile the ledger's frozen contracts against the plan's stated contracts,
  note drift in the ledger, and continue per Boundary policy.
- If `drift-HALT`: halt for human sign-off with the fork's output.

Per the Boundary policy below, self-continue by default (the fork is the "self-review") — do NOT
halt for human sign-off at ◆ unless the fork returns `drift-HALT` or the run config says
`halt-at-boundaries`.

Then return to step 1.

## Boundary policy (this is plan-size-dependent)

The review cadence scales with **sub-track count, not session count**. Boundaries are where the
human-relevant coordinate-transform happens; sessions are not. Default policy:

- **Halt-for-human:** `@plan-juncture` inflection points (step 2 — after fork returns design for sign-off),
  `drift-HALT` from a boundary fork (step 7), `destructive-HALT` from a discovery fork (4e),
  committer secret/refusal (step 5), non-convergence (4f), dependency deadlock.
- **Self-review-and-continue:** ◆ sub-track boundaries when fork returns `still-on-intent` (step 7),
  unless overridden by `halt-at-boundaries`.

A run may be invoked with `halt-at-boundaries` to force human sign-off at every ◆ (use for the FIRST
run of a new project, before the shard pattern is proven), or `fully-autonomous` to also
self-continue inflection points (use only once a project's substrate is known-good, and only when
inflection design is expected to be straightforward).

## Dispatch template (code-change session)

```
Working directory: <project root>
Thoroughness: medium
Read-only: NO (this is an implementation session).

You are executing ONE session from <PLAN>: session <N> — "<title>".  Read ONLY: the <N> entry in
<PLAN>, and the "## Cross-session contracts" subsections it Consumes. Do NOT read the Roadmap
appendix. Do NOT start any other session. Do NOT commit — leave the tree dirty with green tests.

DELIVERABLE
<the entry's bullet list, verbatim>

CONTRACTS YOU CONSUME (do not break these)
<the relevant frozen contracts, verbatim, including any prose invariant the entry names>

CONTRACTS YOU PRODUCE
<what later sessions will consume from you; if substrate, over-specify per the plan>

DONE WHEN
- <the entry's KAT(s)> pass.
- <VERIFY_TEST> and <VERIFY_TYPES> are green (orchestrator substitutes the bound commands, e.g.
  `~/.local/bin/tox -m analyze`).
- Exactly these files are modified: <expected files>.
```

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
  PLAN's ## Cross-session contracts subsection <X>. Return a one-paragraph summary of what you wrote
  and any over-specified methods you recommend carrying forward.

  Discovery: The subagent reported: "<discovery>". Does this invalidate a frozen downstream
  contract? Return one of: internal-continue / additive-reshard <spec> / destructive-HALT, with one
  paragraph of reasoning and the affected contract(s) named.

  Boundary: Re-read ## Purpose (design intent) and the frozen-contract list. Are we still tracking
  the design intent? Return: still-on-intent <notes> OR drift-HALT <what changed and why it needs
  sign-off>.

CONSTRAINTS:
- Return one-shot. Do not ask the user anything — anything needing human sign-off comes back as a
  flagged recommendation in your return; the driver surfaces it.
- Do NOT implement. Do NOT dispatch subagents.
- Write to PLAN's ## Cross-session contracts ONLY if this is an inflection-design juncture.
```

## Constraints

- Runs from `@plan-admin` only. Implementation is always dispatched down-tier.
- `@plan-juncture` is paged as a subagent only at the three junctures (inflection design, discovery
  adjudication, sub-track boundary). It is never resident for the loop.
- One session-list row → one session commit + one ledger commit. No batching.
- The driver gates mechanically (4a–4d); `@plan-juncture` adjudicates discoveries (4e fork); subagents
  implement and never self-commit; `@committer` commits and never verifies. Roles stay separate (per
  AGENTS.md autonomous-chain carve-out).
- The Fix-loop is capped (2 iterations) — non-convergence halts, never grinds.
- The four halt classes (inflection sign-off, contract-violating discovery, committer
  secret/refusal, non-convergence/deadlock) are the ONLY autonomous stops on the happy path.
  Everything else continues.
- PLAN is committed only as its own rolling-context commit (step 6b), never folded into a session
  commit. After each full iteration the tree is clean and the committed ledger+digest matches the
  last committed session — this is the resumability invariant precondition 5 enforces.
- This command does not push, does not rewrite history, does not edit source itself.

## Exit report

- Sessions completed this run (with commit hashes), sessions remaining.
- Juncture fork count: how many times `@plan-juncture` was paged (inflection / discovery / boundary), and the
  verdict from each.
- Any halt: class, the surfaced detail, and the resume instruction.
- Ledger path and last-updated row.
- Capture candidates surfaced during the run (per AGENTS.md three-axis test).
