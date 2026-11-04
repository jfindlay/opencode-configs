# PLAN — finish the OpenCode V2 configuration upgrade

Status: proposed graph, written with user approval; not executed. Approval to write this file does
not authorize the permission change, paid validation, or commits. Review before execution.

Working repository: `~/Source/opencode-config` (singular). This file owns the closeout execution
graph. `PLAN.md` retains the economics design, historical evidence, and authorization record;
it is not replaced. No ROADMAP is needed for this bounded closeout.

## Purpose (design intent)

Finish the V2 migration without redoing completed conversion or expanding it into a security
redesign. Land the permission-study patch, reconcile integration guidance with verified V2 behavior,
and establish that the already-ported plugins work on the chosen runtime.

Confirmed starting facts:

- Native permission arrays, agent/command directory conversion, and both plugin ports are present.
- The completed permission graph measures 2.2.5. The installed CLI also reported 2.2.5 during this
  investigation; the shared service version was not independently checked.
- `../opencode-permtest/patches/opencode-config.diff` passes `git apply --check` at config HEAD
  `f51798e`. It removes nine agent temperatures and three live-config edit denies, nothing else.
- On 2.2.5, obsolete temperature fields are ignored and the tested agent permissions are enforced.
  The permissions-disabling behavior was measured on 2.0.32, not reproduced on 2.2.5.
- Both plugins loaded on a fresh 2.0.32 private server. Real child attribution, event timing, and
  persisted advisory delivery remain unverified. No current plugin defect is yet established.

Authoritative evidence: `../opencode-permtest/docs/FINDINGS.md`, especially its evidence classes and
patch description; the closing ledger in `../opencode-permtest/docs/PLAN.md`; and `PLAN.md`'s V2
verification section. Historical incident explanations remain inferred, not proven.

Done means: the approved patch is integrated; current integration instructions are checked and
corrected where needed; deterministic gates pass; bounded live plugin acceptance is recorded with
version and evidence. Without live authorization, stop at offline-complete, not migration-verified.

Excluded: new permission probes, broad hardening, model-tier changes, sampling restoration, capacity
estimation, cache-TTL research, an economics-report tool, a new shell guard, context management, and
claims of economic savings. Preserve the existing economics exclusions and observe-only default.

## Verify gate

Proposed bindings, approved for inclusion in this plan; the executor must verify availability and
record the actual bindings before its first row. No gate was run while writing this plan.

```sh
# VERIFY_TEST — existing native Node runner, no package-manager scripts required.
node --experimental-default-type=module --test tests/*.test.mjs

# VERIFY_TYPES — syntax-only companion; this repository has no configured static typecheck gate.
for file in plugins/*.js lib/*.js tests/*.mjs; do
  node --experimental-default-type=module --check "$file" || exit
done
```

Run from the config repository with the shell tool's workdir parameter. Also require
`git diff --check` and the row-specific checks below. Calling the second binding VERIFY_TYPES does
not establish type safety. If installed Node cannot run these commands, stop to agree a replacement;
do not add dependencies or modify the runtime-managed manifest to make a gate exist.

Config checks additionally parse JSONC and agent YAML with available, verified parsers and compare
the exact intended rule/frontmatter delta. Do not parse JSONC by naively stripping comment text.
Record the exact parser invocation in the ledger; absence of a parser is not a passed check.

Live validation is outside these deterministic gates. No row before S4 authorizes paid test calls.
Ordinary implementation-agent usage is distinct from the separately budgeted validation workload.

## Session list

| # | Session | Cat | Tier | Consumes | Expected files |
|---|---|---|---|---|---|
| S1 | Land the reviewed permission-config patch | B | T1 | Evidence baseline; approved edit policy | `opencode.json`; `agents/{architect,dialectic,explore,general,git-editor,plan-admin,plan-juncture,session-scan,verify}.md` |
| S2 | Reconcile V2 migration and integration guidance ◆ | I | T1 | Integrated config | `PLAN-V2-MIGRATION.md`; `PLAN-V2-PERMISSIONS.md` if still tracked; `PLAN.md`; `commands/config-retrospective.md`; `NOTES.md`; `AGENTS-LOG.md` |
| S3 | Verify plugin adapters and fix demonstrated compatibility defects | B | T1 | Integrated config; checked integration guidance | `plugins/no-interactive-editor.js`; `plugins/session-economics.js`; `lib/plugin-result.js`; `lib/session-economics-core.js`; `tests/no-interactive-editor.test.mjs`; `tests/plugin-result.test.mjs`; `tests/session-economics.test.mjs`; `tests/plugin-context.mjs`; `PLAN.md` |
| S4 | Record bounded live plugin acceptance ◆ | I | T1 | Verified plugin adapters; live authorization | `PLAN.md`; `NOTES.md`; `AGENTS-LOG.md` |

Execution order: `S1 -> S2 ◆ -> S3 -> S4 ◆`. Expected files bound scope; not every path needs changes.
This graph's ledger/digest updates are separate driver-owned bookkeeping.

Sizing: ambient complexity is modest, but runtime adapters and live global settings have high
cost-of-error. The ten-file patch is one irreducible, already-reviewed change. Its breadth does not
justify splitting identical temperature deletions. Strong deterministic tests favor a separate
offline plugin session; weak live-test determinism requires keeping all comparable observations in
one bounded validation session. Documentation reconciliation has its own independently green result.
The split costs startup overhead but keeps uncertainty and paid validation out of the patch session.
All rows are single-stage; there is no material, separable compliance tail warranting F/C. No new
substrate needs an @architect inflection. Contract-changing discoveries still require review.

## Session detail

### S1 — Land the reviewed permission-config patch

Before applying, obtain explicit confirmation of this consequence: removing the edit denies allows
`build` to edit the live `~/.config/opencode` directory without an approval prompt. The removal was
previously chosen by the owner, but the final study explicitly left this consequence to reconfirm.
If declined, revise the patch scope with the owner; do not silently substitute another policy.

Recheck the patch against the actual clean tree. Apply only its ten-file delta. Keep all unaffected
rules in order and preserve model pins, prompts, external-directory rules, and other settings.
Do not add a blanket deny workaround or claim temperature removal fixes security on 2.2.5.

Known-answer checks:

- No active agent frontmatter retains `temperature`; the committer was already clean.
- Exactly the three specified config-path edit denies and associated obsolete comments disappear.
- Parsed permissions, agent settings, and frontmatter differ only by the approved patch delta.
- Existing tests and syntax checks pass. No live permission probe runs against the real config.

Freeze **Integrated config**. Commit the patch separately from documentation and unrelated work.

### S2 — Reconcile V2 migration and integration guidance

Replace current warnings that assert broken subagent denies with the version-scoped findings.
Distinguish loaded-config verification from attempted-call measurements. Preserve the historical
incident as history; do not retrofit certainty into its explanation. Record completion of the
permission investigation and integrated patch before retiring `PLAN-V2-MIGRATION.md`. Confirm the
superseded staging plan is removed; see the clean-tree bootstrap below.

Validate `commands/config-retrospective.md`'s database/API assumptions, not just its terminology.
Prefer supported V2 read APIs for discovery. If database inspection is needed, make a consistent
backup with an appropriate SQLite backup mechanism, then inspect read-only; do not copy a live WAL
database piecemeal. Do not write, delete, or repair the live store. Keep private transcript data out
of committed evidence. Verify session linkage, message/tool outcome representation, timestamps,
cost fields, and the claim about permission-event visibility against the actual source used.

If the crib remains valid, record that bounded verification without cosmetic rewrites. If not,
correct the command to a demonstrated V2 query/API recipe. Do not build a generic telemetry system.
`AGENTS-HINTS.md` has related historical schema guidance: propose any necessary correction in
`NOTES.md`, but do not edit that file without separate per-item /note or /session-end approval.
An unresolved conflicting active instruction must remain visible as a closeout exception.

Reconcile the active handoff in `PLAN.md`: plugin ports and initial loading are done; real V2
delivery remains pending. Label V1 SDK references as historical, remove already-fixed items from
the active next-work list, and correct unconditional restart advice to current reload guidance.
Retain the economics design, corrected pilot history, authorization record, and unrelated deferrals.
Append a concise V2 migration entry to `AGENTS-LOG.md`; do not rewrite its historical entries.

Known-answer checks: a current V2 sample can be inspected with the documented recipe; linkage and
outcome interpretation agree with the API/evidence. Every remaining open migration item has a named
owner/gate. No active summary presents 2.0.32-only findings as 2.2.5 facts. Changed durable prose
passes the register check. Freeze **Checked integration guidance**.

### S3 — Verify plugin adapters and fix demonstrated compatibility defects

Use the runtime's public V2 contracts and installed package types. Record CLI, private-server,
and managed plugin-package versions; version skew alone is not proof of a defect. Do not upgrade or
commit runtime-managed packages, lockfiles, or service configuration.

Inspect the two existing plugins rather than porting them again. Verify event envelopes, location
filtering, step identities/costs, child-result identifiers, session metadata, hook result structure,
registration, and cleanup. Specifically resolve `event.result.output` versus `result.content` and
the metadata fallback in child-ID extraction using version-matched evidence. Do not change it from
an inference alone. Extend regression tests for demonstrated gaps; keep pure helpers outside plugin
discovery. Record a no-change result if the adapters are already correct.

Known-answer checks cover explicit child attribution; no sole-child guessing; background dispatch
not counting as completion; duplicate/out-of-order accounting; missing data staying unavailable;
location exclusion; bounded notices; failure isolation; output/metadata/attachment preservation;
off/observe/advisory behavior; and subscription cleanup. Observe must not alter model-visible
results. Capacity remains unavailable. Do not equate synthetic tests with persisted delivery proof.

Freeze **Verified plugin adapters**, including the live acceptance checklist and version tuple.
If no source change is necessary, commit the verified contract/evidence update to `PLAN.md`; do not
manufacture code changes to produce a commit. Changes to core economics semantics require review.

### S4 — Record bounded live plugin acceptance

**Blocked until Live authorization is explicit.** No previous pilot budget or approval carries over.
Record the approved dollar ceiling, model/provider, maximum dispatches/retries/steps, token limits,
timeout, test modes, and exact disposable scenarios before any paid validation request. Budget must
include parent, child, auxiliary, retry, and status-check model usage. Use an independent accounting
source, not the monitor under test, and disclose any unobservable usage. If a credible bounded-spend
protocol cannot be established, do not launch. A local timeout alone is not a cost guarantee.

Workspace side effects must stay in a disposable sandbox, such as
`../opencode-permtest/scenarios/v2-closeout/sandbox/`, never real user worktrees or live config.
Use an isolated config copy and private server, reusing the study's verified isolation approach.
Do not copy credentials or `service.json` into committed artifacts, clear shared saved approvals,
restart the shared service, enroll existing sessions, or run real project workloads. No network
mutation, push, or permission-bypass probe belongs in this session. Temporary artifacts stay outside
the config commit's expected files; persist only sanitized evidence and necessary regression cases.

Within one unchanged version tuple:

1. Confirm both plugin IDs are active and observe-mode initialization succeeds. Verify the editor
   environment hook and unload/reload cleanup without model calls where the API permits it.
2. Exercise a bounded foreground worker with known direct-parent/role metadata and a background
   control. Establish actual event/tool-return ordering; background dispatch must not emit a false
   completed-child report.
3. Compare observed step IDs/cost contributions against finalized API records for the same interval.
   Labels must disclose attachment-time coverage and any final events still in flight; do not demand
   lifetime totals or count descendants/auxiliary requests as worker primary steps.
4. Exercise advisory mode using disposable test configuration. A temporary low threshold may live
   only in the disposable copy; record that delta and do not change production thresholds. Verify
   persisted content, preserved results/attachments, no duplicates, and next-step visibility.
5. Record failures, exclusions, spend, version tuple, and accepted limitations. A smoke test proves
   compatibility only, not savings or comprehensive permission enforcement.

Do not expand a failed check into an unbounded repair loop. A demonstrated adapter defect adds a
bounded fix-and-retest row through discovery handling; stop paid work until the revised protocol and
remaining budget are approved. Freeze **Live acceptance** only after the actual checks pass.

Update V2 acceptance in `PLAN.md` and append the implementation outcome to `AGENTS-LOG.md`.
Preserve unrelated economics follow-ups; retire that plan only after its own remaining obligations
are accepted or explicitly deferred. Keep this graph through the final ledger/review checkpoint.
Run the register check over changed durable files before the final boundary review.

## Cross-session contracts

### Evidence baseline — prose-enforced

Defined before execution by the completed permission study; consumed by S1 and all later rows.
Evidence is version-scoped and retains confirmed/inferred/unmeasured labels. Parent agent permission
rules are not child agent rules. This statement does not generalize to every session-scoped API
override. No new claim that a saved allow cannot defeat a deny is empirically established here.

### Approved edit policy — prose-enforced, not yet authorized

Defined by explicit owner confirmation before S1; consumed by S1. Covers unprompted live-config
editing by build after removing the three denies. Writing or approving this graph is not that
confirmation. Record the owner's decision in the ledger header.

### Integrated config — test/prose-enforced; to be frozen at S1

Defined in S1; consumed by S2, S3, and S4. The approved patch is parsed and reviewed, unrelated
rule ordering/settings are preserved, and source changes are committed independently of docs.

### Checked integration guidance — test/prose-enforced; to be frozen at S2

Defined in S2; consumed by S3 and S4. Current migration status and the retrospective's demonstrated
data-access recipe are accurate. Historical evidence remains labeled and pending permissions or
captures remain explicit. The economics design and authorization history survive reconciliation.

### Verified plugin adapters — test/prose-enforced; to be frozen at S3

Defined in S3; consumed by S4. Existing JS interfaces and deterministic tests establish conservative
accounting/delivery behavior for the recorded runtime contract. No compiler-enforced contract is
claimed: the repository's JavaScript gate is not a static typecheck. Synthetic evidence is not live
delivery evidence. Observe-only mode, unavailable capacity, and bounded metadata remain invariant.

### Live authorization — prose-enforced, not yet authorized

Defined by the owner before S4; consumed only by S4. Approval must name scope and bounded spend;
no inferred authorization from a plan resume. An unresolved gate leaves S4 pending and the final
outcome offline-complete, not fully verified.

**Recorded 2026-11-04 by the owner (generic parameters, deliberately minimal):**
- Budget: **$2.00 total** across parent, child, auxiliary, retry and status-check usage. Total only;
  no per-tier sub-ceilings.
- Model/provider: `anthropic/claude-haiku-5-5` for every model call (parent and child).
- Scope: the five checks in S4 against a private server with an isolated copy of the config in a
  disposable HOME/XDG tree and sandbox directory; no real project work; nothing shared is touched.
- Dispatch, step, token and timeout limits: not separately numbered by the owner. They are bounded
  by the scenarios (tiny fixed prompts; one foreground worker, one background control) and by the
  stop rule below; the executor must keep each prompt minimal and set a short per-call timeout.
- Stop rule: stop all paid work as soon as independently measured spend (finalized API session
  costs, not the monitor under test) reaches **$1.50** (reserve for unobserved in-flight usage), and
  never exceed $2.00. No automatic retries: a failed check stops paid work and routes through
  discovery handling. Disclose any unobservable usage.
- Credentials: copied into the disposable HOME only, never committed or printed; the disposable
  tree is deleted afterwards. The advisory check may use a lowered threshold in the disposable
  copy only (record the delta); production thresholds ($5 / 100 steps) stay unchanged.
- Production thresholds: owner asked for a recommendation; driver recommends keeping $5 / 100 steps
  until S4 and some real worker runs supply evidence. Not a change authorized by this graph.

### Live acceptance — evidence/prose-enforced; to be frozen at S4

Defined in S4; consumed by final review. Sanitized recorded observations demonstrate plugin loading,
attribution/accounting and persisted advisory delivery on the stated version tuple. Partial totals
are labeled, untested properties remain untested, and no savings or stronger sandbox claim is made.

## Progress ledger

Bindings and approvals recorded at chain start (2026-11-03), run config: default self-continue at ◆
(no `halt-at-boundaries`; owner chose this explicitly):

- Workdir: `/home/justin/Source/opencode-config`. Base commit: `ad1604f`. Tree clean at start.
- VERIFY_TEST: `node --experimental-default-type=module --test tests/*.test.mjs` (Node v22.22.1;
  baseline 36 pass / 0 fail). Separate from VERIFY_TYPES — not a combined gate; 4a and 4b run
  independently.
- VERIFY_TYPES (syntax-only, not a static typecheck): the `node --check` loop over
  `plugins/*.js lib/*.js tests/*.mjs` from the Verify gate section (baseline green). Also
  `git diff --check` (baseline green).
- Parser command (amended after S1): add `--standalone` — plain `opencode debug config|agents`
  reads the background service's cached config and returned pre-patch rules after the patch was
  live on disk. S1's before-snapshots were taken without `--standalone`, after-snapshots with it
  (different server instances); the delta was clean regardless, and the committed opencode.json
  diff was read directly and equals the patch.
- Parser command: JSONC via the runtime's own loader, `opencode debug config` (JSONC is not strict
  JSON; no standalone JSONC parser is installed, and comment-stripping is forbidden). Agent
  frontmatter via `opencode debug agents` plus PyYAML 6.0.3 `yaml.safe_load` on the frontmatter
  block. Pre-patch snapshots at `/tmp/opencode/s1/{config,agents}.before.json` (outside repo).
- CLI version: `opencode v2.2.5`. Private-server and managed plugin-package versions: not yet
  recorded (S3 task).
- Edit-policy confirmation (Approved edit policy): **owner confirmed the full ten-file patch** on
  2026-11-03 ("1 is fine"), after being told the consequence (build may edit via the live
  `~/.config/opencode/` path without prompting). Owner added a follow-on intent: after this work,
  general `@build` agents should not have uncontrolled write access to `~/.config/opencode` or
  `~/Source/opencode-config/`; they attribute the earlier deny to remnants of a salt-based
  two-step change procedure. That follow-on is NOT part of this graph and was not authorized as a
  patch-scope change; it is recorded under Discoveries & risks as an owner-owned open item.
- Live budget and protocol: **approved 2026-11-04** — $2.00 total, Haiku for all calls, generic
  parameters; full text in the Live authorization contract. (At chain start this was UNSET.)

| # | Session | Status | Commit | Froze |
|---|---|---|---|---|
| S1 | Land the reviewed permission-config patch | done | a2f02d3 | Integrated config |
| S2 | Reconcile V2 migration and integration guidance | done | 36c9864 | Checked integration guidance |
| S3 | Verify plugin adapters and fix demonstrated compatibility defects | done | e750415 | Verified plugin adapters |
| S4 | Record bounded live plugin acceptance | pending | — | — |

## Action-frame digest

### S1 — 2026-11-03
Discovery/flex: Plain `opencode debug config|agents` returns the running service's cached config;
fresh parses after an edit need `--standalone`. Parsed agents showed `temperature` for only 5 of
the 9 patched files before the patch (loader quirk, uninvestigated). `commands/config-retrospective.md`
line 7 and other docs still call `~/.config/opencode/` a salt "runtime mirror"; it is a symlink to
this repo.
Affected: none (Integrated config frozen as designed; stale prose is already in S2's file scope).
Deferred: yes — S2 should correct the "runtime mirror" framing and any 'denies are in force'
statements; S2/S3/S4 live-state checks must use `--standalone` or a private server.
Texture: S1's KATs are config-delta checks, not test files; the driver verified them from
`git diff`, a `temperature` grep, and the subagent's parsed-delta report. Owner's post-closeout
edit-policy intent is logged under Discoveries & risks.

### S2 — 2026-11-03
Discovery/flex: The retrospective's V1 store crib failed validation (V1 tables stop 2026-10-16/17;
V2 uses `session_v2`/`session_message`) and was rewritten as a read-API-first 2.2.5 recipe,
agreement-checked on the 100 newest sessions (zero API/store mismatches). On 2.2.5 the delegation
tool is named `subagent` and the child id sits at `state.metadata.sessionID` in the persisted
message record (all 54 resolvable links had `parentID` equal to the caller). No permission-decision
history exists to inspect (`permission` table = saved approvals; `event` table empty).
Affected: none (Checked integration guidance frozen). Plugin code already matches `subagent` and
`sessionID`, but only against the persisted API view, not the plugin's own event view.
Deferred: yes — S3 must still resolve `event.result.output` vs `result.content` and the metadata
fallback with version-matched evidence from the plugin's event/hook view, not infer from the
persisted view. Unmeasured and owner-owned: whether an `edit ~/.config/opencode/**` deny matches the
repo path through the symlink; saved-allow vs deny; cause of the small top-level cost gap vs the
message sum ($0.00002–$0.00192).
Texture: Protocol deviation accepted for adjudication at the boundary: the plan asked for a
consistent SQLite `.backup` before inspection; the store is ~19 GB with a 7.7 GB /tmp tmpfs and a
92%-full root disk, so the worker ran only bounded `sqlite3 -readonly` queries on the live store and
copied/wrote nothing. A tool-output block of another session's content appeared once in the
worker's transcript, not in any file. A proposed `AGENTS-HINTS.md` correction (V1-layout join; stale
`/run-plan` references) sits in NOTES.md awaiting per-item human approval — it is the standing
closeout exception.
Boundary verdict (S2 ◆, juncture fork): `still-on-intent`. Backup deviation accepted as a reported
medium deviation (a 19 GB `.backup` would not fit; bounded read-only queries copied/wrote nothing).
Owner's post-closeout edit-policy intent does not block S3 (S3 workers must edit this repo; policy
change is separate and owner-owned; measure symlink matching first). Instructions for S3: (1) decide
`event.result.output` vs `result.content` and the metadata fallback from the plugin's own event/hook
view with version-matched evidence (installed package types and/or a private server), not the
persisted API view; lib/plugin-result.js currently reads/writes only `result.content` and
session-economics-core.js:79 accepts several child-id key spellings; (2) edits to plugins/*.js go
live through the symlink into the shared service — keep edits small, run gates after each, confirm
both plugins active via `plugin.list`, never restart the shared service; (3) record the full version
tuple including the shared service version, which is still unconfirmed; (4) use `--standalone` or a
private server for parsed-config checks; (5) stay off the session store, or disclose bounded
read-only use. At exit surface: AGENTS-HINTS.md proposals awaiting approval; narrower `build`
edit policy; S4 live authorization still UNSET.

### S3 — 2026-11-03
Discovery/flex: Four demonstrated adapter defects on 2.2.5, each fixed with regression tests (36→47
tests): (1) `session.step.ended` carries no envelope location, so location-gated accounting was
inert; (2) `session.deleted` carries none, so per-session state leaked; (3) a foreground `subagent`
call moved to the background returns `status: "running"` and was reported as a completion; (4)
`appendNotice` on a result with no `content` hid the `output` text the host would have shown. Fixes
verify location once at enrolment (`session.created` or `session.get`) and accept later unlocated
events only for enrolled sessions; core accounting rules, thresholds, observe-only default,
unavailable capacity and bounded notices unchanged. `event.result.output` vs `result.content`
resolved from the 2.2.5 binary's embedded source plus a private 2.2.5 server: `output` is the
structured result (IDs read from it), `content` the model-visible text (notices written there);
child ID is `output.sessionID`, fallback `metadata.sessionID` valid; other key spellings unevidenced
but kept (every candidate is verified against caller-as-parent and worker role).
Affected: none (Verified plugin adapters frozen; the location-gating change preserves the
location-exclusion contract, tested). Juncture fork not paged: worker named no contract-changing
discovery and the plan classes a defect fix preserving existing contracts as internal-continue.
Deferred: yes — S4 must treat the real `session.step.ended` envelope (no location) as UNOBSERVED
(inferred from host source; a model call is needed to emit step events) and must show a
`task-boundary` log line with non-null cost/steps as the first live proof. Real event/tool ordering
and persisted notice visibility remain unmeasured. Live checklist is in PLAN.md "Verified plugin
adapter contract".
Texture: Version tuple: CLI 2.2.5; shared service `/api/info` 2.2.5 (read-only); private server
2.2.5 (isolated HOME/XDG, no credentials, shut down); managed `@opencode/{plugin,schema,client}`
2.0.32 + effect 4.0.1 — types one generation behind the host, so host behavior was taken from the
binary's source and the private server, not the package types. Plugin edits went live through the
symlink; `plugin.list` shows both plugins active afterwards; shared service never restarted.

## Discoveries & risks

- **Dirty starting tree — execution HALT.** At planning time `PLAN-V2-MIGRATION.md` and
  `multisession/multi-session-planning.md` were dirty; `PLAN-V2-PERMISSIONS.md` and `service.json`
  were untracked. Preserve all content until explicitly dispositioned. This new plan adds another
  untracked file. The /plan-run fresh-plan exception does not cover the other dirty files.
- **Version drift — destructive-HALT for evidence reuse.** Freeze and record the validation tuple.
  A different runtime does not invalidate source automatically, but requires explicit re-baselining
  before applying old behavioral claims or comparing live observations. Do not silently disable
  updates or retain an old release indefinitely; controlled upgrades trade speed for reproducibility.
- **Permission intent declined — destructive-HALT.** Reconcile with the owner before policy changes.
- **Runtime-managed incompatibility — additive-reshard or HALT.** Surface the actual incompatible
  API/package; no package-manager churn or service edits under this graph's source-file scope.
- **Plugin defect preserves existing contracts — internal-continue in S3.** Fix with a regression
  test. Changed accounting semantics or a larger lifecycle design requires juncture review.
- **Live defect or uncertain spend — stop paid work; additive-reshard.** No automatic retry budget,
  no real workload substitute, and no paid check when the gate is unresolved.
- **Retrospective schema differs — internal-continue if a bounded supported recipe suffices.** A new
  storage adapter or telemetry subsystem is additive-reshard, not an incidental docs edit.
- **Global-hint correction needed — human approval gate.** Record a precise proposed correction;
  use /note or /session-end with per-item approval. Do not silently include AGENTS-HINTS.md.
- **Post-closeout edit-policy intent — open, owner-owned (recorded 2026-11-03).** Owner stated that
  after this work general `@build` agents should not have uncontrolled write access to
  `~/.config/opencode` or `~/Source/opencode-config/`. The reviewed patch (S1) does the opposite
  for the live-path deny and leaves `build`'s `edit * allow`; the owner confirmed the patch
  anyway. A narrower policy needs a separate owner-approved change; surface at exit as a closeout
  exception, do not implement under this graph.
- **Optional hardening — deferred.** Saved-allow versus deny measurement; shell restrictions for
  read-only agents; general's edit policy; environment-file read policy; obsolete no-op rules and
  sampling variants. Preserve findings, but do not turn these into migration prerequisites.

## Notes for executors

### Clean-tree bootstrap and permissions

Use an interactive @build session to inspect and explicitly disposition the pre-existing dirty work
before invoking /plan-run. Do not stash, reset, discard, or fold it into the patch automatically.
The owner can authorize separate commits for existing tracked edits. Review and remove the
superseded untracked staging plan before chain startup; if it has become tracked, S2 may delete it.
Retain `service.json` as runtime state, never commit it; agree an appropriate local exclusion with
the owner if it blocks clean-tree preflight. Do not print its potentially sensitive values.
Commit this plan separately with approval, or use the driver's documented fresh-plan initialization
only after other preflight dirt is resolved. This write authorized no commits or cleanup.

Edits in this repository are live through `~/.config/opencode`. Use the repository path, preserve
unrelated settings, and review each diff. Load the OpenCode skill and relevant V2 documentation
before implementation; the current docs may differ from the measured version. Never use the combined
legacy/native schema alone to decide V2 behavior. Do not run /plan-run from the permtest repository.

The @plan-admin driver owns sequencing, gates, and ledger commits. Use T1 implementation workers
(@build or @general); investigation may fork @explore read-only. T0 @plan-juncture handles the
boundary/discovery workflow. Use @committer for approved autonomous-chain commits; never push.

The driver must pass the pending human authorization gates explicitly. Its discretion to continue
after a technical boundary review cannot supply a budget, approve a policy change, or waive a gate.
General does not inherit build's edit allow; do not bypass prompts with broad saved approvals.

### Register and evidence

State properties, reasons, or invariants directly in source, tests, and durable docs. Plan coordinates
belong only in rolling docs, ledger/digest, and commit messages. Apply this in every dispatch; no change
to the universal AGENTS.md is authorized just to seed the rule.

Anneal denylist for changed durable text: session-coordinate references matching `\bS[1-4]\b`,
`◆`, `frozen contract`, `sub-track`, and references to this closeout plan. Classify hits rather than
blindly deleting legitimate domain literals or historical changelog entries. Exclude rolling plans
and NOTES from the scan. Document generation commands legitimately describing the planning subsystem
are not leaks; new implementation explanations must nevertheless stand on their own.

Keep evidence compact: exact commands and versions, outcomes, sanitized identifiers when needed,
coverage boundaries, and residual risks. No secrets, raw user transcripts, fabricated test counts,
or model self-report substituted for observed behavior. Capture new costly-to-lose findings in
NOTES rather than enlarging the universal guidance without approval.

### Handoff

After review, clean-tree preparation, and explicit permission-policy confirmation, execute from
@plan-admin in `~/Source/opencode-config`:

```text
/plan-run PLAN-V2-CLOSEOUT.md halt-at-boundaries
```

Do not launch S4 until its independent authorization is recorded. Pause for human review after the
final boundary; retain the ledger until its evidence and residual obligations have accepted homes.
