# Verification: declared gate cadence and evidence

Loaded only when a project explicitly declares a cadence (found at preflight, or supplied by an
enclosing dispatch). The goal is to stop re-running a check solely because work passed between
agents, without weakening what is verified. Projects own the declaration: which commands, which
triggers, what counts as executable input. The driver owns acceptance and is not obliged to rerun a
command already run on the same relevant inputs. **Without a declaration none of this applies, every
gate requirement in `execution.md` holds as written, and a worker's own run never substitutes for
the driver's.**

## Check classes

| Class | Required cadence |
|---|---|
| Targeted checks and named KATs | worker edit/fix loop; every unit-specific obligation before acceptance |
| Per-unit gate (the project's test and type commands) | once on final inputs per completed code-change unit |
| Boundary checks (e.g. a coverage floor) | each ◆ sub-track completion and final delivery; earlier only on a named project trigger |
| Freshness checks (e.g. dependency policy, advisory audit) | when declared inputs change; first active run of each calendar day; before release |
| Non-executable prose and ledger | the project's documentation/contract checks only; no automatic code suite |

A boundary check at its checkpoint does not replace the per-unit gate. A combined command declared
as one check stays one check; it cannot be half-run to satisfy two classes.

## Evidence record

Produced by the worker (or the driver, for its own runs) for each completed check: exact command and
working directory; exit status; completion time; output/log reference; tested-input identity;
relevant environment (toolchain, flags, features, target, config). No credentials. A record exists
only for a command that ran to completion; a started, interrupted, or running check has none and
counts as missing. Records live in the ledger's gate-evidence block (`plan-format.md`); there is no
general caching framework.

**Input identity** is a content identity covering the base revision plus staged and unstaged
changes, deletions, and the contents of relevant untracked additions, so an unchanged
executable-input set has the same identity across commits. HEAD alone or `git status` filenames
alone never establish it.

**Classifying inputs.** Source (including doc comments the toolchain compiles or runs), included or
executed documentation, fixtures, generators, build inputs, and configuration are potentially
executable, not automatically prose. Classify by the actual diff and actual usage; an uncertain
classification takes the code-change path. Only proven non-executable edits (prose, ledger) leave
code evidence valid (for Rust, a rustdoc or comment edit in a `.rs` file is not proven
non-executable; see the `style` skill's `code-rust.md`). Dependency evidence is keyed to dependency inputs
(manifests, lockfile, resolution/feature settings, dependency policy, checking-tool versions). An
edit to the verify gate, the declared cadence, or a named contract changes the *obligations*:
re-evaluate them even when no executable input changed.

## Validity and reuse

Evidence is reused only when all hold: it is backed by actual command output (a readable log; an
unsupported statement that tests passed is not evidence); its input identity and environment match
the inputs *as recomputed now*; and no obligation changed since. Otherwise the check is missing or
invalidated and the driver runs it. Any later edit invalidates the affected evidence:
post-validation fixes, hook-modified trees, boundary corrections, and completion-stage edits. If a
log or identity cannot be verified (cold resume, lost temporary files), rerun; never infer a pass.

**Freshness checks** are reusable only with successful evidence for the *current* dependency inputs
and policy, refreshed on the *current* day. The record names the advisory database identity and its
refresh time; a new revision invalidates the advisory result. An offline or failed refresh is not a
fresh pass. Audit and dependency policy are separate checks. No scheduler exists: the loop enforces
freshness, and a release requires the checks.

## Outcomes

Record each check as `passed` (the driver ran it), `reused` (valid evidence from a worker or earlier
run), or `deferred` (cadence puts it later; name the next mandatory checkpoint). A unit may complete
under its per-unit gate while a boundary check is deferred, but the ledger never calls that a
full-gate pass. A known failure is never `deferred`. A boundary is incomplete until every check
required there is `passed` or validly `reused`. Historical evidence is never rewritten as fresh; a
historical row with no record is `unrecorded`, not `passed`.

**Stage rules.** An F-stage's checks are partial and never final acceptance; an F-stage checkpoint
is not a completed unit. The C-stage, or the single stage of an ordinary row, runs the per-unit gate
once on its final inputs and returns the records. Fix workers return fresh records for their final
inputs. Retry limits and F-stage handoff rules are unchanged. Make no unrelated edits to the tree
while a gate runs.

## Where the loop applies this

- **Before dispatch (step 1), freshness.** Confirm each declared freshness check has valid evidence
  for the current dependency inputs, policy, and calendar day. Missing, stale, from an earlier day,
  or unverifiable after a cold resume → run it now (the first active iteration of a day does this).
  Success is recorded. A failure against inputs the chain has not changed (e.g. a newly published
  advisory) is a dependency-graph finding, not a unit regression: stop
  (`BLOCKED: freshness finding`), surface it, and leave triage to the project's stated procedure.
- **Step 4a–4b, evidence validation** in place of rerunning: valid → `reused`; missing or
  invalidated → run, `passed`.
- **Unit-level checks (4g), after 4a–4b.** If the unit's diff touches a declared freshness-check
  input (manifests, lockfile, dependency policy, checking-tool configuration), run or validate those
  checks on the final dependency inputs; failure is the unit's own → Fix-loop. If it touches a
  declared boundary-check trigger (e.g. substantial test removal, a coverage-related change), run
  that check now. Otherwise record each boundary check `deferred` with its next mandatory checkpoint
  (the next ◆ boundary or final delivery). Classify the diff before relying on any of this.
- **Step 5.** Evidence must still match the tree about to be committed; revalidate after any later
  edit, including a worker's or a hook's.
- **Boundary checks (step 7, after a clean anneal gate and before forking).** Run or validate every
  declared boundary check on the boundary's final inputs, plus any freshness check not valid for
  today. Valid existing evidence for the same executable inputs is `reused`: a prose-only last row
  neither exempts the boundary nor invalidates a valid result; missing evidence is run, never
  assumed. `deferred` is not allowed at a boundary. Red → Fix-loop (counts against the cap); the
  chain does not proceed past an incomplete boundary. Record outcomes in the boundary note. A later
  correction that touches executable inputs invalidates the affected result: rerun it.
- **Final delivery.** Run or validate every declared boundary check and every freshness check on the
  final inputs. Valid evidence from the last ◆ boundary (or later) is `reused` when no executable or
  dependency input has changed since; a final prose-only row does not force a rerun and does not
  waive the requirement. Red → Fix-loop (cap 2, one dispatch at a time, each followed by
  revalidation); non-convergence stops. Record outcomes in the gate-evidence block and commit per
  6b. The chain is not complete until all required checks are `passed` or validly `reused`; no
  `deferred` check may remain.
- **Standalone annealing under a supplied cadence.** Run the per-unit gate once on the final inputs
  after the last edit (after the line-length pass) and return records as the dispatch specifies.
  Comment and doc-comment edits are classified by the rules above; an uncertain edit takes the code
  path.

## Cadence variant for worker dispatches

Include this in a dispatch only when a cadence is bound; it replaces the dispatch's plain VERIFY
line (the driver substitutes the bound commands):

```
CADENCE VARIANT
- The KAT(s) and any targeted checks pass during your edit/fix loop.
- Run <VERIFY_TEST> and <VERIFY_TYPES> once, on your FINAL inputs, after your last edit. Do not run
  boundary or freshness checks unless this prompt names them. If you edit anything after a recorded
  run, rerun the affected check.
- Return one compact EVIDENCE RECORD per completed check: exact command and working directory, exit
  status, completion time, log/output reference (keep the log readable), tested-input identity
  (base revision plus staged and unstaged changes, deletions, and untracked additions — HEAD or
  filenames alone are not identity), relevant toolchain/flags/features/target/config. No
  credentials.
```

An F-stage never receives the "run once on your FINAL inputs" bullet: it runs the narrowest checks
its prompt names, returns only the record fields, and labels every record partial. A fix worker
receives the full variant and returns fresh records for its final inputs.
