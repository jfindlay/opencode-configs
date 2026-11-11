# Paired units (feature/completion)

A row marked `(F/C)` runs as two execution contexts, a feature stage (F) then a completion stage
(C), sharing one intent and producing one delivery unit: one feature commit and one ledger row.
Selection criteria are in `planning.md`. An unmarked row runs single-stage and ignores this file.

## Terms

- **F-stage / C-stage:** two `@build` dispatches in sequence for the same row; same agent, same
  tier, no new agent type.
- **`handoff-ready`:** F's return state. The row is not done and not green; a `handoff-ready` return
  never marks the ledger row `done`.
- **Intent capsule:** the record the driver writes into PLAN's `## Completion handoffs` from F's
  structured return before dispatching C.
- **Checkpoint:** the capsule plus its base-commit and fingerprint fields, which let a cold resume
  verify it is looking at the same in-flight unit.

## Shard-time shape

The row's Session title ends with `(F/C)`. Its Session detail gives the reason for the branch and a
**Completion appendix**: the shared one-sentence goal; two stage-specific done conditions (F:
`handoff-ready` — behavior, substantive success/error/integrity tests, and focused docs implemented,
narrowest meaningful project-managed checks run and reported; C: the unit's gate, the full project
gate or the per-unit gate under a declared cadence, with branch coverage, typing, lint/format, and
documentation/shape/layering conformance as that gate requires and named KATs passing); and the
handoff requirements (base commit, the row's own expected files, a pointer to the capsule fields
below). It is a closure and acceptance contract, never a second deliverable list. PLAN carries a
`## Completion handoffs` section, empty (`*(none yet)*`) at shard time.

## Phase selection (loop step 1)

Check `## Completion handoffs` for an entry for the selected row. No entry → dispatch the F-stage.
An entry whose Status is not `consumed` and that matches the row's base commit and expected files →
dispatch the C-stage directly, skipping step 2 (an inflection was resolved before F). This is a
lookup, not a judgment.

## F-stage return and capsule (step 3b)

After F returns and step 3a passes:

1. **Validate the return.** It must report `handoff-ready` with the four-point report (goal and
   invariants; design and qualifications; KATs, results, known gaps; remaining work). A return that
   labels the unit `done`/`green`/`verified`, omits a field, or reports a known
   feature-correctness failure or semantic failure is not `handoff-ready`: dispatch one bounded
   F-fix iteration (shared Fix-loop budget) and re-check. Exhausting the budget stops
   (`BLOCKED: session does not converge`).
2. **Do not run the full gate yet.** The narrowest-meaningful checks F reports are taken at face
   value as partial; a diagnostic full-gate run by F is also partial evidence, never final
   acceptance. This asymmetry with step 4 is deliberate.
3. **Write the capsule** (template below), transcribing F's report. The driver organizes; it does
   not invent intent.
4. **Do not commit** the capsule or the implementation diff. This is the one documented exception to
   "every iteration ends with a commit": the tree and the capsule stay dirty by design, as a
   recorded, fingerprinted, resumable state, until the single post-gate commit.
5. **Dispatch C immediately** in the same iteration with the C-stage template. C works in the dirty
   tree F left.
6. After C returns (and 3a passes), run step 4 once on the **combined F+C diff**. Reaching C is
   never a Fix-loop iteration and never widens the budget.

### Capsule template (written by the driver)

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
**Acceptance contract:** <unit gate (full gate, or per-unit gate under a cadence), required KATs,
  expected files, any named deferred non-goals>
```

Set `Status: consumed` when the unit reaches `done`. The capsule stays in PLAN as record and is
never deleted to clean up.

## Defect routing (step 4, after 4d and before 4e)

- **Defect in the feature's own behavior** reported by C: C does not fix it by reinterpreting
  intent. Dispatch one fresh bounded F-fix scoped to the named defect plus the intent capsule, then
  re-dispatch C. It is corrective, not a second planned F-stage, and draws on the row's Fix-loop
  budget (cap 2 across F, C, and fixes; the planned F→C handoff never consumes or resets it).
- **Contract-changing discovery** (a frozen interface, KAT, or prose invariant): follows 4e's
  discovery adjudication; C never resolves it unilaterally.
- Which of the two applies is read from the worker's own report; the driver does not reinterpret a
  defect as a discovery or the reverse.
- On non-convergence, preserve the capsule and checkpoint in PLAN exactly as they stand and stop;
  a later cold resume reconciles from that state.

## Commit and ledger

One feature commit for the combined diff; nothing is committed at the F→C boundary. `CO_AUTHOR`
follows the normal rule (same-model stages dedupe). At step 6, mark the row `done` only after the
combined gate passed and the commit landed; note both stage identifiers (`<N>F`, `<N>C`) and which
stage contributed what in the capsule and ledger note (no new trailer scheme); set the capsule
`Status: consumed`.

## Checkpoint validation and cold resume (before the generic clean-tree refusal)

A dirty tree is acceptable, with nothing committed first, only when it exactly matches a recorded
`## Completion handoffs` entry: the same unit's base commit, the same expected files, and a diff
fingerprint (implementation diff only, untracked additions included, PLAN's own checkpoint container
excluded) matching the capsule's. Identical filenames alone never validate. Validate PLAN's own
contract and ledger structure separately from the fingerprint.

- **Match:** resume directly at the C-stage dispatch for that unit, skipping normal row selection
  for this one iteration. Retake the stash snapshot (step 3a). Under a cadence, F's records are
  unverified history; C reruns what it must.
- **Any mismatch** (unrelated edit present, wrong base commit, no capsule entry, stale or absent
  fingerprint): not this exception. Refuse and surface for human reconciliation. Never `git reset`,
  `git stash`, commit, or otherwise overwrite the drift. An interruption before a valid checkpoint,
  or midway through unrecorded C edits, does not authorize a blind resume either: reconcile by
  explicit inspection.
- Resume only through this validation, never from chat history.

## Stage dispatch templates

Both are filled in by the driver and include the REGISTER block (`artifact-hygiene.md`) and the
WORKER HYGIENE block (`execution.md`) verbatim. Under a cadence the C-stage adds the cadence variant
(`verification.md`); the F-stage adds only its record requirement, labelled partial. The worker
cannot read this file or the full PLAN.

### F-stage

```
Working directory: <project root>
Thoroughness: medium
Read-only: NO (this is an implementation session).

You are executing the FEATURE STAGE of a paired feature/completion unit from <PLAN>: session <N> —
"<title>". Read ONLY: the <N> entry in <PLAN>, its Completion appendix, and the "## Cross-session
contracts" subsections it Consumes. Do NOT read the rest of the plan or the roadmap. Do NOT start
any other session. Do NOT commit — leave the tree dirty.

DELIVERABLE
<the entry's bullet list, verbatim>

CONTRACTS YOU CONSUME (do not break these)
<the relevant frozen contracts, verbatim, including any prose invariant the entry names>

CONTRACTS YOU PRODUCE
<what later sessions will consume from you; if substrate, over-specify per the plan>

HANDOFF-READY, NOT DONE
Implement behavior, the substantive success/error/integrity tests, and focused docs. Run the
narrowest meaningful project-managed checks and report the exact commands and results. A full
project gate run is optional and diagnostic; its long closure tail belongs to the completion stage.
Label every check result you report as partial. Return `handoff-ready`; never `done`, `green`, or
`verified`. A known feature-correctness failure is not a compliance handoff: report it plainly, do
not paper over it, and do not deliberately leave an obvious test gap for the completion stage to
find.

REPORT (the driver turns this into the intent capsule — be complete)
1. One-sentence goal; observable behavior and non-negotiable integrity invariants.
2. The design you implemented and any qualifications learned while coding/testing that are not
   obvious from the diff.
3. KAT names and exact files, the important cases already tested, the commands you ran and their
   results, and any known failures or gaps.
4. What closure work you believe remains, and anything semantically unresolved, including any
   discovery that would contradict a contract you consume or a KAT (name it plainly; do not
   resolve it yourself).

<REGISTER block, verbatim>

<WORKER HYGIENE block, verbatim — applies to this partial return as well>

Do not commit, freeze contracts, or start another unit.
```

### C-stage

```
Working directory: <project root>
Thoroughness: very thorough
Read-only: NO (this is an implementation session, continuing an already-dirty tree).

You are executing the COMPLETION STAGE of a paired feature/completion unit from <PLAN>: session
<N> — "<title>". The feature stage already implemented behavior and substantive tests,
uncommitted, in the current working tree; do not discard or re-derive it. Read ONLY: the intent
capsule for unit <N> in PLAN's "## Completion handoffs", the <N> entry in <PLAN> and its Completion
appendix, and the "## Cross-session contracts" subsections it Consumes. Do NOT read the roadmap or
any other unit's entry; the capsule is the complete intent, so trust it. Do NOT start any other
unit. Do NOT commit — leave the tree dirty with green tests.

INTENT CAPSULE
<the full capsule for unit <N>, verbatim>

CONTRACTS YOU CONSUME (do not break these)
<the relevant frozen contracts, verbatim>

YOUR SCOPE
Run the unit's full gate (see DONE WHEN). Complete missing branch cases and necessary regression
tests, typing, lint/format, and documentation/shape/layering conformance. Small behavior-preserving
corrections are permitted within the unit's expected files. Do NOT weaken assertions, lower
coverage, add convenience exclusions, change public behavior, or redesign the feature to obtain
green. Do not spend turns rewrapping a few over-width lines the gate does not enforce; report them
in your return.

IF YOU FIND A DEFECT
A substantive defect in the feature's behavior is not yours to fix by reinterpreting intent: name
it plainly and do not patch around it. A discovery that would invalidate a frozen downstream
contract is also not yours to resolve: name the affected contract plainly. The driver routes both.

<REGISTER block, verbatim>

<WORKER HYGIENE block, verbatim>

DONE WHEN
- All KATs named in the capsule, and any you added, pass.
- <VERIFY_TEST> and <VERIFY_TYPES> are green (the full project gate; the driver substitutes the
  bound commands). [Cadence variant replaces this line when one is bound.]
- Exactly the unit's expected files are modified.

RETURN
Name any corrections you made and why they preserve the feature's intent rather than changing it,
any new qualifications learned, and the exact gate results.
```
