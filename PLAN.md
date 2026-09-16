# PLAN — session economics safeguards, without context garbage collection

Status: proposed handoff for user review. Owner: `@build` after review. No implementation started.
This is an interactive build handoff, not a `/plan-run` ledger or authorization to commit.

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
- `command/plan-shard.md`: add a short outlier check for broad source/test coupling, repeated moves,
  and catch-all closers. Split independently green outcomes; justify genuinely atomic broad work.
  A one-line title is a useful test, not proof a shard is economical. No new mandatory table columns.
- `agent/build.md`: refine the existing batching rule rather than duplicate it. Identify the initial
  evidence needed; batch independent inspections; prefer supported bulk transformations for mechanical
  work; retain sequential feedback and post-edit verification. Do not prohibit necessary rereads or
  widen existing tool permissions. Respond briefly to a measured warning with remaining uncertainty,
  acceptance work, and the next bounded action; continue when that action is justified.
- `command/plan-run.md`: deliver scoped contract excerpts and evidence pointers; consume telemetry
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
approval. Touch `agent/plan-admin.md` only if necessary to align the affected guidance; unrelated
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

Run deterministic tests first. Then perform a user-approved, bounded smoke/pilot using disposable
work outside user worktrees; do not replay the $110 refactor. Restart OpenCode after config/plugin
changes for them to take effect. Observe-only startup comes before advisory startup. Obtain an
explicit model-spend cap before live calls; test modes must not silently enroll existing sessions.

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
  `command/plan-shard.md` (outlier check, no new columns), `agent/build.md` (batching refinement +
  notice-response section), `command/plan-run.md` (task-return telemetry consumption, no new
  juncture type), `AGENTS-SESSION.md` (message count reframed as coarse fallback), `IDEAS.md`
  (separated from the deferred context-fill idea). `agent/plan-admin.md` and `AGENTS-HINTS.md` were
  not touched — not needed to align the affected guidance.
- [x] Monitor implemented; accounting/delivery tests green. `plugins/session-economics.js` +
  `tests/session-economics.test.mjs`, 42/42 passing.
- [ ] Live smoke/pilot authorized and completed, or explicitly pending. **Pending** — offline
  checks only; no live model-spend-capped pilot has been run. Requires separate authorization per
  the pilot contract below.
- [ ] Results reviewed; implementation log updated; PLAN ready to retire. Log entry not yet written
  (deferred until the pilot line above closes, per "append after verification, not before").

### Version-skew and source-anchor findings (step 2 preflight)

Installed runtime: 1.18.31. Local `package.json`/`node_modules` pin `@opencode-ai/plugin` and
`@opencode-ai/sdk` at 1.15.3. Compared the `Hooks` interface and `Model`/`Session`/`AssistantMessage`/
`StepFinishPart` SDK types between the two by fetching `packages/plugin/src/index.ts` and
`packages/sdk/js/src/gen/types.gen.ts` at GitHub tag `v1.18.31` (the PLAN-provided commit hash
resolved to a bare repo listing, not a usable diff target — the tag is the correct match for the
installed runtime and was used instead). **No blocking incompatibility**: 1.18.31 adds `dispose` and
`experimental.provider.small_model` to `Hooks`, both irrelevant here; every hook and type this
plugin uses (`event`, `chat.message`, `tool.execute.after`, `Model`, `Session`, `AssistantMessage`,
`StepFinishPart`) is unchanged between the two versions.

Fetched `packages/opencode/src/session/overflow.ts` and `packages/opencode/src/provider/transform.ts`
at the same tag to source the capacity formula precisely (`usable()`/`isOverflow()`/
`maxOutputTokens()`). The public SDK's `Model.limit` never exposes the internal `.input` field
upstream's `usable()` branches on, so `usableContext()` always takes the `context -
maxOutputTokens(model)` branch — documented in the module header as a deliberate, verified
simplification, not a guess.

One narrow, honestly-unresolved gap: the completed "task" tool's `output.metadata` shape for the
spawned child session id is typed `unknown` in the public SDK and was not independently confirmed
against a live run. `extractChildSessionID()` tries several plausible keys and falls back to an
unambiguous-parent-scan; when neither resolves, the task-boundary report is skipped rather than
guessed. This should be checked against real task-tool metadata during the live pilot below.

### Test command (step 3 preflight)

`node --test tests/session-economics.test.mjs` fails on the installed Node (v18.19.1): plugin `.js`
files here have no `"type": "module"` in any governing `package.json` (the root one is
OpenCode-managed and was not edited), so bare `node --test` loads them as CommonJS and rejects the
`export` syntax. The PLAN's candidate gate resolves this without adding a dependency or touching the
manifest:

```
node --experimental-default-type=module --test tests/session-economics.test.mjs
```

42/42 tests pass under this invocation. This is a local-test-runner artifact only — the production
runtime already loads ESM-syntax `.js` plugins successfully (`plugins/no-interactive-editor.js` is
the existing proof), so no production behavior is affected.

### Pilot authorization needed before live checks

Before running the observe-only-then-advisory smoke test called for in step 3: confirm (a) a
disposable workspace outside user worktrees, (b) an explicit model-spend cap for the live calls, and
(c) that no existing session is silently enrolled by restarting OpenCode with this plugin present.
None of this has been requested or approved yet — restart and pilot are on hold pending that
authorization.
