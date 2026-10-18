# PLAN — session economics safeguards, without context garbage collection

Status: guidance implemented; both plugins ported to V2 with fresh-server loading verified.
Paid accounting/delivery verification remains pending. ALIGN execution did not establish plugin
compatibility or savings; its corrected retrospective remains below. Owner: `@build` for reporting.
This file is an interactive build handoff, not a `/plan-run` ledger or authorization to commit.

## V2 migration verification (2026-10-17)

Installed runtime and managed plugin package are both 2.0.32. Both plugins default-export
`Plugin.define` definitions. The editor uses `shell.create.before`; economics uses the public
`session.step.ended` stream and `tool.execute.after`. Helpers remain outside plugin discovery.

Verification: `node --experimental-default-type=module --test tests/*.test.mjs` passes. Tests cover
the installed completed-step schema, duplicate/stale events, modes, role/parent/location checks,
output preservation, failure isolation and subscription cleanup. A fresh private server reports both
local plugin IDs active through `plugin.list`, and emits the economics `initialized` diagnostic with
`mode=observe`. Private-server reload alone retained an old module error; a fresh process resolved it.
The shared service was not restarted. Restart it after this session to load the migrated modules.

User-approved limitation: capacity is explicitly unavailable until the V2 usable-context formula is
verified. The old 32,000-token reserve and model lookup are removed, not carried forward as facts.
Cost and step thresholds remain unchanged; observed totals cover primary completed steps only,
excluding title/compaction requests. Missing costs remain unavailable rather than becoming zero.

Child reports require an explicit result ID and verified direct-parent/worker metadata. Missing IDs
are no longer inferred from a sole-child scan, and background dispatch is not called completion.
Reports disclose potentially in-flight final events. The exact built-in result-ID field and real
event/tool ordering still require live verification; synthetic tests are not proof of delivery.
Cross-location events are ignored, and subscription cleanup aborts on unload. Diagnostics are JSON on
server stderr (confirmed in the private-server output); look for `plugin="session-economics"`.

Managed packages and service configuration are untouched. No paid pilot was run or authorised by
this migration; persisted advisory delivery, final accounting reconciliation and savings remain
unverified. The historical V1 implementation/source notes below are not V2 API guidance.

## Purpose and scope

Keep small, focused, independently verifiable sessions as the default. For inseparable or poorly
understood work, expose expenditure and capacity pressure so agents can reconsider their execution
method without weakening correctness. Measure mechanically; leave cost/value judgments with agents.

Deliver planning/execution guidance, a lightweight runtime monitor, tests, and a bounded pilot.
Separate three dimensions: cost (measurable), capacity (estimated from reported usage), and context
integrity (qualitative evidence, not a numerical score). A warning requests reassessment, not a stop.

Excluded: context GC, pruning, new summarization behavior, transcript deletion, history-retrieval
tools, automatic abort/pause/restart, warm-resumption machinery, new supervisory agents, changing
model tiers, weakened gates. Leave current compaction settings alone.

## Evidence and tradeoffs

Confirmed from the session store: music-annotator's September 14–15 F1–F12 execution cost about
$110.41; its complete planning/execution lifecycle cost about $135.08. Build workers cost $96.20;
F2/F4/F8/F12 accounted for $68.41. About 90% of build cost was cached-context reads/writes. F8 had
208 assistant messages/209 tool calls; F12 had 308/307. No compaction events occurred. These are
OpenCode cost calculations, not provider invoices. No quality degradation or savings was measured.

Small sessions bound context but add startup/gate costs. Broad atomic moves can be justified; broad
closing bundles need not be. Batching independent operations saves round trips but batching dependent
edits/checks loses feedback. Telemetry adds maintenance cost but avoids unreliable self-measurement.
Do not infer wasted work from spend, repeated reads, or a long context alone.

## Implementation sequence

### 1. Consolidate guidance in existing homes

Expected files:
- `multisession/multi-session-planning.md`: explain commit coherence versus execution footprint;
  distinguish cost, capacity, and integrity; instrumentation need not wait for overflow. Keep
  warm-resumption/context-management machinery deferred. Do not prescribe a universal optimum.
- `commands/plan-shard.md`: add a short outlier check for broad source/test coupling, repeated moves,
  and catch-all closers. Split independently green outcomes; justify genuinely atomic broad work.
  A one-line title is a useful test, not proof a shard is economical. No new mandatory table columns.
- `agents/build.md`: refine the existing batching rule rather than duplicate it. Identify the initial
  evidence needed; batch independent inspections; prefer supported bulk transformations for mechanical
  work; retain sequential feedback and post-edit verification. Do not prohibit necessary rereads or
  widen existing tool permissions. Respond briefly to a measured warning with remaining uncertainty,
  acceptance work, and the next bounded action; continue when that action is justified.
- `commands/plan-run.md`: deliver scoped contract excerpts and evidence pointers; consume telemetry
  at task-return boundaries to inform later dispatches. No executive polling loop, automatic
  resharding, or additional juncture forks merely because a cost warning fired. All current halt,
  commit, scope, and correctness gates remain authoritative.
- `AGENTS-SESSION.md`: treat message count as a coarse fallback warning, not a universal optimal
  horizon. Do not abandon uncommitted work, force compaction, or equate no compaction with integrity.
- `IDEAS.md`: separate lightweight economic monitoring from the deferred context-fill/resumption
  project; update only the relevant idea and gate, retaining deferred non-goals.

Context-integrity guidance: when current facts conflict with earlier conclusions, revalidate against
the current artifact and distinguish evidence from interpretation. No automatic detector, score, or
routine extra review agent. These checks preserve reasoning fidelity; they do not curate context.

Keep each addition short and non-duplicative. Do not edit `AGENTS-HINTS.md` without separate per-item
approval. Touch `agents/plan-admin.md` only if necessary to align the affected guidance; unrelated
roster/halt-policy inconsistencies are out of scope. Append implemented changes and their rationale
to `AGENTS-LOG.md` after verification, not before.

### 2. Implement a minimal monitor and deterministic tests

Expected new files: `plugins/session-economics.js`, `tests/session-economics.test.mjs`.
Keep tests outside the auto-discovered plugin directory. Prefer one dependency-free implementation
module, matching the existing JavaScript plugin. Do not introduce a framework or configuration file.

Before coding, verify installed runtime/SDK versions and hook contracts. Investigation found runtime
1.18.31 but local plugin/SDK 1.15.3. Use supported SDK/events, not production reads of `opencode.db`.
Do not update or commit OpenCode-managed `package.json`, lockfiles, or `node_modules` to fix skew.
If a required contract differs, report the narrow incompatibility before expanding this design.

Accounting contract:
- Track cost, API-step count, and latest completed usage separately for each session. Choose one
  canonical completed-message/step stream; never add message costs and step-finish costs together.
- Updates may repeat or arrive out of order. Deduplicate by stable identity and update contributions
  rather than blindly incrementing. Count model API steps, not user messages or tool calls.
- Parent/child linkage must come from verified session metadata/API, not titles or prompt matching.
  Worker cost is its own usage; do not silently include descendants or double-count nested tasks.
- Do not sum lifetime token usage to estimate capacity. Match the installed runtime's latest-message
  overflow calculation and usable-input/output reserve semantics, including cache writes. Label it
  a last-completed-request estimate, not exact next-request occupancy or a quality measure.
- Missing cost/usage/model limits are unavailable, not zero. Distinguish recorded cost from invoices.
  Model changes and compaction must not reset spend; capacity follows the latest applicable usage.
- Keep only bounded numeric/identity metadata, not tool bodies, source, secrets, or transcripts.
  Scope maps to the active instance and clean up completed-session state at a defined boundary.
- No persistence subsystem. On plugin restart or incomplete event history, label figures as observed
  since attachment; do not claim lifetime completeness. Unknown child totals may be omitted explicitly.

Delivery contract:
- Use `tool.execute.after` on a worker's own completed tool result for an occasional advisory notice.
  Preserve original output, metadata, attachments, and tool-call/result pairing. Do not alter arguments,
  tool success/failure, session state, or trigger a new prompt. Failed hook accounting must not fail work.
- At the parent's completed `task` result, append a compact child report when attribution is known.
  This is retrospective. A parent blocked in Task cannot continuously reason about child telemetry.
- Scope notices to implementation/research workers with verified parent linkage, not committers,
  summarizers, titles, or arbitrary interactive sessions. If role cannot be resolved, observe only.
- Group simultaneously due warnings into one notice; each trigger fires at most once per observed
  worker session. At most three notices, each at most 500 characters; one task-boundary report at most
  500 characters. Do not replay notices on duplicate events or every subsequent tool call.
- Notices name measurements and request a bounded reassessment, never assert inefficiency or degraded
  integrity. They are runtime advisories clearly separated from the underlying tool's evidence.

Modes: a documented `OPENCODE_SESSION_ECONOMICS` environment setting with `off`, `observe`, and
`advisory`; default `observe`. Observe changes no model-facing output; use existing structured logging
for bounded metadata summaries only. Off registers no monitoring behavior. Invalid mode falls back
safely with a single diagnostic. Document usage briefly beside the implementation; no new manual.

Provisional advisory thresholds for the pilot: observed spend $5, 100 completed API steps, or 70% of
the runtime's usable capacity estimate. These are warning starting points, not established optima or
budgets. Keep them in one clearly named implementation settings block; no configuration framework.
Threshold tuning requires pilot evidence. A low cost/turn count does not certify context integrity.

Tests must cover normal accumulation; duplicate/partial/out-of-order updates; distinct workers and
nested tasks; model changes; missing data; compaction; partial observation/restart; role/parent lookup
failure; simultaneous thresholds and notice caps; output/attachment preservation; observer failures;
off/observe/advisory modes; and metadata cleanup. Use synthetic SDK events and a mocked client, not
live database fixtures or model calls. Assert no abort, prompt injection API, context rewrite, or
filesystem mutation is used. Check that reports never claim unavailable lifetime totals.

### 3. Verify, pilot, and report

No tracked test harness exists; the local package manifest is OpenCode-managed. Bind the installed
native JavaScript runner before adding dependencies. Candidate gate, subject to installed Node support:
`node --experimental-default-type=module --test tests/session-economics.test.mjs`.
If unsupported, use the available native runner and record the exact command here; do not silently
add a package manager/build system. Validate plugin loading against the installed runtime separately.

Run deterministic tests first. The user-approved exception below uses real rDLP ALIGN execution
instead of disposable work outside user worktrees; do not replay the $110 refactor. Restart OpenCode
after config/plugin changes for them to take effect. Observe-only startup comes before advisory
startup. Respect the approved total model-spend cap; do not silently enroll existing sessions.

Verify real event timing, child-role attribution, notices visible on the child's next model step,
task-boundary reports, no interrupted tools, and no duplicate notices. Compare finalized accounting
against the session store/API without double counting; telemetry must label partial coverage. Verify
post-tool output preservation/persistence rather than assuming it from SDK types.

Report accounting accuracy, warnings delivered, notice overhead, failures, and any observed strategy
changes. A smoke test establishes compatibility, not economic savings. Estimate savings only from
comparable workloads with unchanged acceptance gates; do not infer them from fewer calls alone.
If live approval is unavailable, finish offline checks and mark live verification pending honestly.

## Source anchors and completion criteria

Version-matched source: `https://github.com/anomalyco/opencode/tree/014614d35b397775e5d397a490fc72368c894ec2`.
Relevant paths: `packages/opencode/src/session/{overflow,prompt,tools,compaction}.ts` and
`packages/plugin/src/index.ts`. Public hook documentation: `https://opencode.ai/docs/plugins/`.
Recheck these against the installed version; source inspection is not a passed integration test.

Implementation is ready for review when guidance is coherent and brief, accounting/delivery tests
pass, default behavior remains observe-only, and all exclusions hold. The pilot is complete only
after bounded live checks pass; pending checks remain unchecked in Progress. Inspect the intended
diff, record commands/results and residual risks, and request review. Do not commit or push without
separate authorization. Retire this PLAN after accepted completion, not while live checks are pending.

## Progress

- [x] Guidance consolidated and reviewed for scope/conflicts. Touched:
  `multisession/multi-session-planning.md` (commit-coherence-vs-execution-footprint subsection),
  `commands/plan-shard.md` (outlier check, no new columns), `agents/build.md` (batching refinement +
  notice-response section), `commands/plan-run.md` (task-return telemetry consumption, no new
  juncture type), `AGENTS-SESSION.md` (message count reframed as coarse fallback), `IDEAS.md`
  (separated from the deferred context-fill idea). `agents/plan-admin.md` and `AGENTS-HINTS.md` were
  not touched — not needed to align the affected guidance.
- [x] Monitor implemented; deterministic tests reported passing at preflight. This did not test
  actual plugin loading and is not evidence that the runtime registered its hooks.
- [x] Port both plugins to V2 and verify fresh-server loading; add conservative child-ID handling.
- [ ] Verify real child attribution, event timing and persisted advisory delivery on V2.
- [ ] Live verification complete. ALIGN execution trees cost $43.99 ($44.67 including a separate
  status check), exceeding the recorded $10 authorization. Plugin loading and delivery remain
  unverified; fresh authorization is required before any further paid live checks.
- [x] Retrospective evidence reviewed and corrected; see Pilot results below.
- [ ] Implementation log updated after verification; PLAN ready to retire. Neither is complete.

### Version-skew and source-anchor findings (step 2 preflight)

Installed runtime: 1.18.31. Local `package.json`/`node_modules` pin `@opencode-ai/plugin` and
`@opencode-ai/sdk` at 1.15.3. Compared the `Hooks` interface and `Model`/`Session`/`AssistantMessage`/
`StepFinishPart` SDK types between the two by fetching `packages/plugin/src/index.ts` and
`packages/sdk/js/src/gen/types.gen.ts` at GitHub tag `v1.18.31` (the PLAN-provided commit hash
resolved to a bare repo listing, not a usable diff target — the tag is the correct match for the
installed runtime and was used instead). **No blocking hook/type mismatch was reported**. The new
`dispose` and `experimental.provider.small_model` hooks were considered irrelevant; the used event,
chat, tool-after, model, session, assistant-message, and step-finish interfaces were reported unchanged.
This historical check did not establish loader compatibility; the review below found a separate
module-export incompatibility.

Fetched `packages/opencode/src/session/overflow.ts` and `packages/opencode/src/provider/transform.ts`
at the same tag to source the capacity formula precisely (`usable()`/`isOverflow()`/
`maxOutputTokens()`). The public SDK's `Model.limit` never exposes the internal `.input` field
upstream's `usable()` branches on, so `usableContext()` always takes the `context -
maxOutputTokens(model)` branch — documented in the module header as a deliberate, verified
simplification, not a guess.

The completed "task" tool's child-ID metadata was unresolved at preflight. Retrospective inspection
now confirms the key `sessionId`, which `extractChildSessionID()` does not accept. Its unambiguous
parent-scan fallback may still attribute a child; the direct extraction defect does not establish
that every report failed. Repair and live verification remain pending.

### Test command (step 3 preflight)

`node --test tests/session-economics.test.mjs` fails on the installed Node (v18.19.1): plugin `.js`
files here have no `"type": "module"` in any governing `package.json` (the root one is
OpenCode-managed and was not edited), so bare `node --test` loads them as CommonJS and rejects the
`export` syntax. The PLAN's candidate gate resolves this without adding a dependency or touching the
manifest:

```
node --experimental-default-type=module --test tests/session-economics.test.mjs
```

Preflight reported 42/42 tests passing under this invocation; the 2026-09-28 review did not rerun
them. Successful loading of the separate `no-interactive-editor.js` plugin demonstrates ESM support,
not compatibility of this plugin's export shape. Actual loader verification is still required.

### Pilot authorization and handoff (2026-09-17)

Historical authorization, not permission to spend again. The execution has finished; the corrected
retrospective and current handoff below supersede this section's original pending status.

User approved using the real rDLP ALIGN session graph as the step-3 pilot, overriding the
disposable-workspace requirement for that workload. The repository's committed history supplies
rollback for repository changes; runtime state and model spend are not covered by Git rollback.

Budget: $10 total across enrolled pilot parents and descendants, including preflight, fixes,
committers, reviews, and restarts. Accounting begins at the fresh pilot-preflight session, not the
preceding /plan-shard design session. This is not a per-worker threshold or a guarantee that ALIGN
will complete within the budget. No additional spending is authorized.

Execution source: /home/justin/Source/rDLP/docs/PLAN.md. The initial observe-only run is limited to
B.1, followed by a clean-ledger stop and evidence review. Use a fresh advisory startup for subsequent
authorized rows. Do not silently enroll existing sessions.

Before live calls, establish external cap control. The plugin is advisory and cannot enforce a
budget. If only best-effort monitoring is available, obtain explicit approval of that limitation.
Unavailable or zero-priced model usage cannot establish that the cap is being respected.

Run the deterministic gate first:
`node --experimental-default-type=module --test tests/session-economics.test.mjs`.
Check actual runtime/plugin loading separately. Configuration/source changes, tool installations,
and pushes are not authorized by pilot enrollment.

All original accounting/delivery acceptance checks remain. Reports can be tested below warning
thresholds; worker notice delivery remains pending unless exercised. Do not pad workload or covertly
lower thresholds to manufacture a warning. Compatibility evidence is not evidence of savings.

At B.1 preflight, the user accepted best-effort cap monitoring; at the next driver startup, the user
confirmed monitoring and budget headroom. Those exchanges do not establish subsequent cumulative
visibility or an increased cap. The retrospective cannot determine what external monitoring showed.

### Pilot results — rDLP ALIGN (corrected 2026-09-28)

Source: read-only queries of `~/.local/share/opencode/opencode.db`. Execution cohort: these roots
and their recursive `parent_id` descendants, not an open-ended directory/date filter:

- `ses_f4f895b73ffeexSjqcL5VRIIyw` — B.1 driver.
- `ses_f4f022c67ffeKtBCwQOgeL8NYx` — B.2/B.3 attempt driver.
- `ses_f498698cbffetzkunguCwIr3jG` — B.3a–B.7 driver.

Keep architect status check `ses_f49e95f5cffey4oqjTEoDqSyN3` separate: it is related work, not a
descendant of those roots. Exclude preceding `/plan-shard` work. All examined sessions report runtime
version 1.18.31. Amounts below are OpenCode-recorded costs, not independently verified invoices.

| Role | Sessions | Recorded cost |
|---|---:|---:|
| Drivers | 3 | $23.11 |
| Workers (`build`/`general`) | 14 | $15.33 |
| Junctures | 4 | $4.94 |
| Committers | 24 | $0.61 |
| Execution trees | 45 | $43.99 |
| Separate status check | 1 | $0.68 |
| Combined investigation cohort | 46 | $44.67 |

**Confirmed accounting:** each session's summed `step-finish` costs exactly reconcile with its
`session.cost`. This validates internal consistency, not plugin operation or provider billing.
There are 42 descendants, not the previously reported 44. The worker total previously recorded as
$13.33 was wrong. Execution alone exceeds the recorded $10 authorization; including the status
check does not affect that conclusion. The third driver alone cost $18.66 over 192 steps, with
peak reported input plus cache tokens near 310k and no recorded compaction.

**Confirmed cache/wait association:** for the combined 46-session cohort, 71 of 902 `step-finish`
records meet `tokens.cache.write >= 30000 AND tokens.cache.read < 5000`. Their total request cost
is $19.72 (44% of cohort spend). For timing, group parts by assistant `message_id`, order messages
within each session by minimum `part.time_created`, and take the prior message's maximum tool span
(`state.time.end - state.time.start`). That span is at least five minutes for 66 of the 71 records.
This method does not equate part creation gaps with time between model requests.

**Inferred, not established:** the association is consistent with cache expiry making large contexts
sensitive to waits. Tool spans do not separate approval latency from command execution or other
blocking; historical TTL settings and provider cache decisions were not verified. The $19.72 is
whole-request cost, including output, not cache-write cost alone or recoverable savings. Do not infer
that every five-minute wait expires the whole prefix, that step count is irrelevant to cost, or that
shorter driver sessions would save a measured amount. Preserve human approval participation.

**Confirmed plugin defects and evidence limits:**
- Task metadata uses `sessionId`; the extractor omits it. The sole-worker fallback may still work.
- The module exports `SETTINGS` and helpers alongside `SessionEconomics`. Version 1.18.31's legacy
  loader treats module exports as plugin entries and rejects `SETTINGS` before registering hooks.
  Source: `https://github.com/anomalyco/opencode/tree/v1.18.31`,
  `packages/opencode/src/plugin/index.ts` (`getLegacyPlugins`, `applyPlugin`) and
  `packages/opencode/src/plugin/shared.ts` (`readV1Plugin`). This is a source-level incompatibility;
  no historical runtime log was recovered to prove that error occurred in the pilot.
- No delivered advisory/task report was found; marker matches were source reads or discussion.
  Silence is also compatible with default observe mode, so it does not prove absent accounting.
  The attempted environment check was denied; loading and mode were not established.
- Workers stayed below the cost and step triggers (maxima $2.77 and 62 steps). Capacity-threshold
  crossings were not established. Drivers are outside the current worker-notice scope.

Verdict: useful retrospective accounting and a strong cache/wait association, not demonstrated live
compatibility, causal attribution of avoidable spend, or economic savings.

### Next handoff — operability first (reviewed 2026-09-28)

**1. Repair and verify the existing monitor (`@build`).** Expected implementation files remain
`plugins/session-economics.js` and `tests/session-economics.test.mjs`; report any necessary layout
change before expanding the fileset. Do not change tiers, permissions, compaction, or managed packages.
- Recheck the installed runtime and make the exported module compatible with its actual loader.
  A direct helper import is not a loader test; ensure helpers are not initialized as plugins.
- Support verified `sessionId` metadata; retain verified parent/role checks and ambiguity handling.
- Expose one bounded initialization diagnostic with resolved mode for active monitoring. Keep off
  mode's no-monitoring contract. Identify where the operator can retrieve diagnostics.
- Extend deterministic tests for export/loading compatibility and actual metadata shape; retain
  accounting, duplicate-event, cleanup, role, mode, and output-preservation gates. Run the documented
  test command above, then verify startup through the installed runtime without a model request.
- Request fresh approval and a bounded spend arrangement before any paid observe/advisory check.
  Demonstrate real event accounting, child attribution, persisted task-report output, and agreement
  with finalized usage. Keep worker notice delivery pending unless naturally exercised; do not pad
  work or silently lower thresholds. Report modes, session IDs, coverage gaps, and failures.

**2. Separate follow-up: metadata-only economics report (design scope approved 2026-09-28).**
This is not part of the monitor repair. The user selected the scope and approved recording it, not
implementation, broader data access, or paid live calls. Request a separate implementation go-ahead
and agree the fileset before adding this tool.

Purpose: replace repeated cohort selection and arithmetic with one on-demand, deterministic operation,
conceptually `session_economics_report(roots, view="summary" | "sessions")`. The caller supplies exact
session IDs. Do not infer a PLAN cohort from titles, dates, project directories, or the latest session.

Data boundary: use the supported session-metadata and direct-children APIs, recursively, against the
configured OpenCode instance. Version 1.18.31 exposes per-session recorded cost, cumulative token
counters, lineage, and agent/model labels without requesting message bodies. Recheck these fields and
SDK compatibility before implementation. No message endpoints, database reads, arbitrary SQL, shell
execution, model calls, or arbitrary server/path parameters. Retain and return only needed fields.

The report is stateless: reconstruct the cohort from persisted metadata on each invocation. This
avoids adding a new enrollment/persistence subsystem or depending on the live monitor's discarded
child counters. It does not recover deleted history. Archived children are included by the inspected
children endpoint; verify that behavior against the target runtime.

Contract:
- Preserve requested roots; deduplicate by stable session ID. Normalize redundant descendant roots
  to effective ancestor roots and report the overlap explicitly. Effective-root contributions must
  reconcile with the unique-session total; no double counting or silent cohort expansion.
- Missing/inaccessible roots are errors, not empty $0 trees. Child-fetch failures or traversal limits
  produce an explicitly partial result. Detect malformed/cyclic lineage and bound traversal.
- Report collection start/end, requested/effective roots, coverage, session count, recorded cost,
  effective-root contributions, largest contributors, and cumulative token categories. The sessions
  view adds bounded per-session rows; omitted rows must not masquerade as an exhausted listing.
- State that API collection is non-atomic. "Complete traversal" means retained accessible lineage,
  not complete historical billing. Missing fields remain unavailable; flag zero recorded cost with
  nonzero usage without asserting that the work was free. Costs are not verified provider invoices.
- Agent/model fields are session labels, not proof of per-request attribution. Cumulative tokens are
  not context occupancy. Do not infer savings, waste, remaining safe budget, or pricing completeness.
- Expose measurement definitions/version and coverage warnings alongside totals, not only in logs.

Permission preflight is an implementation gate: prove how the adapter requests scoped metadata access
for the specified roots and descendants before collecting it. Custom tools do not automatically
inherit native-tool permission checks. Do not silently cross project boundaries or grant universal
session access. A denial must prevent the corresponding collection; preserve user participation.

Implementation shape: separate the API collector, pure report calculation, and thin authorization/
presentation adapter. Use a runtime-compatible plugin export shape; do not initialize helper exports
as plugins. Keep the calculation testable without OpenCode, a live database, or a model. This is a
small operation, not authorization to build a general reporting framework.

Acceptance criteria for the later implementation:
- Synthetic forests cover descendants, overlapping roots, missing fields/roots, partial reads,
  archived nodes, malformed lineage, label caveats, and changes during non-atomic collection.
- Unique-session and effective-root totals reconcile. Traversal and output limits are explicit.
- The documented ALIGN baseline reproduces 45 execution sessions and $43.99 recorded cost; adding
  the separately named status root produces 46 and $44.67. If persisted data changed, report the
  discrepancy rather than force the baseline. No message-body access is needed for this check.
- Exercise the real loaded tool and permission-denial path, not just imported helper functions.
  Verify no prohibited endpoint, shell, database, mutation, or model-call path is used.
- Any later benefit comparison holds task, evidence requirements, and approval policy constant;
  measure correction loops, model-visible volume, cost, and factual errors. Fewer calls alone do not
  establish better reasoning or economic savings.

Excluded from v1: per-step reconciliation, cache/wait diagnostics, automatic enrollment, forecasts,
live notices, and budget enforcement. Detailed historical diagnostics need their own data-access
decision. This narrower API boundary wins on limited authority and portability but loses diagnostic
depth compared with a usage-level historical report.

**3. Separate research items; report before implementation.**
- Cache TTL: establish installed runtime/provider support and actual TTL semantics; estimate net
  effect with the premium on all affected writes, not the flagged requests' whole costs. No cache
  setting change or savings claim is authorized by this research item.
- Command convention guard: withdraw the proposed `cd *` permission deny. At the same source tag,
  `packages/opencode/src/tool/shell.ts` excludes CWD commands before bash permission matching.
  Research a narrow pre-execution rejection of the raw leading-`cd` pattern with actionable
  `workdir` guidance, not silent rewriting. Verify hook failure behavior and false-positive cases.
  Preserve existing approval gates; do not allow general scripts or widen scratch permissions.
  This guard would enforce a convention, not provide a comprehensive shell security boundary.

Tradeoff: restoring the monitor yields observable behavior with limited scope; the separately gated
report adds explicit-cohort recorded totals, not budget control. Larger tool/harness abstractions
still require their own reviewed scope.
