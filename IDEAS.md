# Ideas — opencode-config

The single collection for this repository's future work, ideas, unfinished items and undecided
decisions. Completed work, decisions taken and investigation records do not live here: they live in
the git history (`git log`, `git show <commit>:<path>`). When an entry is finished or decided,
delete it in the same commit that lands the result.

Promotion path: when an entry has 3+ concrete sub-tasks and starts feeling like a real arc,
split it into its own `ROADMAP.md`-style document (mirroring the rGNFS pattern of
`docs/ROADMAP.md` for the project-lifetime view and `docs/PLAN.md` for the current sub-track).

Demotion path: when an entry has been quiet for 6+ months and the framing no longer matches
reality, delete it.

---

## Open follow-ups and decisions

Open items; an owner or gate is named where one exists. Version labels (2.0.32, 2.2.5) name the
runtime the observation was made on. The measurement harness is `~/Source/opencode-permtest`
(frozen, kept for this purpose; its history exists only there); its `docs/FINDINGS.md` records what
is already measured.

- **`build` edit policy for the config directory (owner: user).** `opencode.json` (`agents.build`)
  has `edit ask` on `~/.config/opencode/**` and `~/Source/opencode-config/**` after `edit * allow`;
  a path rule matches only the spelling it names (no symlink resolution), so both are listed.
  Limits still open:
  - Editing this repository while it is the project is not covered: in-project files are matched
    as project-relative paths, and project-layer rules did not reach `build`.
  - `ask` is undone by a saved `edit *` allow in a project; a config `deny` is not. Switching to
    `deny` makes the restriction durable but blocks `build` there outright.
- **Shell policy follow-ups (none measured on the current rules).** The shell policy is
  default-allow with a few consent gates; shell is not a containment boundary.
  - Check per-agent rule evaluation (`permission.create`, no model call) for `explore`,
    `committer`, `git-editor`: expected `git push` deny everywhere, `git commit` allowed only in
    `committer` and `git-editor`, ask elsewhere.
  - Scanner behavior for `$(...)`, backticks, subshells and heredocs is unmeasured; scanner errors
    are not fixable by rules.
  - `external_directory * ask` still applies to shell paths outside the project (e.g. `/tmp`).
  - If prompt-layer drift (`cat`/`grep` for file reads) returns, measure it before restoring any
    deny.
- **Env-file rule for `grep`/`glob` (owner: user).** `read` has the env-file rules; the `grep` and
  `glob` tools were never given one.
- **Plugin delivery residual risks (owner: `@build`; gate: fresh user authorization and spend
  bound for any further paid run).** Observed on 2.2.5 with managed `@opencode/plugin` 2.0.32:
  - The task-boundary report omits the child's final step (its `step.ended` arrives milliseconds
    after the hook), so a consumer comparing it to a finalized total sees a deficit of about the
    last step.
  - After a config-only reload the plugins logged `loading plugin` but no new `initialized` line;
    whether the economics hooks were re-registered is unestablished (a file reload did
    re-initialize).
  - Whether edits made through the symlinked config directory reload plugins was never exercised
    (the live probe edited a real directory); after a plugin edit, `plugin.list` showing `active`
    proves only that the module loaded, so confirm the new behavior as well (reload procedure:
    `AGENTS.md`, "OpenCode config files").
  - Notices print sub-cent costs as `$0.00`.
  - Not exercised: foreground-moved-to-background, production-threshold crossings, other-location
    isolation, worker roles other than `general`, long or nested workloads, savings. A private V2
    server needs a credential connected through its API (an `auth.json` copy gave
    `provider.no-route`).
- **Unmeasured permission questions (harness above).** Measured on 2.2.5 and not open: a config
  `deny` held against a saved `edit *` allow (evaluation API, `build` and `committer`; no live
  tool call), and an `edit` deny does not cover shell writes (live probes of the resource string).
  Still open:
  - Whether the V1-only agent keys `tools`, `permission` and `name` disable an agent's
    `permissions` the way `temperature` did on 2.0.32 (`top_p` and `temperature` load with an
    ignored-field warning on 2.2.5; `top_p`'s effect on permissions is untested).
  - Whether `request.body` reaches the provider (a `request.body.top_p` is accepted into the
    agent's request).
  - A live-tool confirmation that a config `deny` beats a saved allow.
- **Optional upstream reports (owner: user; file through the `report` skill only if wanted).**
  - 2.0.32: `temperature` beside `permissions:` disabled the agent's rules (4 of 4); not
    reproduced on 2.2.5, so worth filing only if that version is pinned again.
  - The edit tool's validation error does not name an unrecognized argument key (a misspelled
    `newString` looked like a missing argument).
- **Projects seeded with the old `## Notes for executors` pointer.** Older `/plan/shard` runs put
  a pointer to PLAN into the project's `AGENTS.md`; it dangles after the arc. The current seed is a
  self-contained `## Register in durable files` block. Replace the old pointer by hand when a
  seeded project is next touched (decide whether this is worth tracking).

## Theme: Agent hierarchy (TBN — needs a name)

The umbrella for thinking about how primary agents, subagents, orchestrators, and autonomous
chains compose. Currently a loose collection of patterns spread across `AGENTS.md`,
the `multisession` skill, and the individual agent definitions. Worth eventually consolidating
into something with more shape — possibly a `HIERARCHY.md` or a dedicated roadmap doc — once a
critical mass of concrete patterns has accumulated.

Open shape questions (do not need to be answered now):

- Does "hierarchy" stay the right framing, or is "ecology" / "topology" / "composition" closer
  to what's emerging?
- What's the relationship between this theme and the `multisession` skill? The latter is
  about how sessions compose; this is about how agents compose within and across sessions.
  Probably orthogonal axes, but the overlap deserves articulation.
- When does a pattern in this theme get promoted into `AGENTS.md` (operational rule) vs.
  the `multisession` skill (durable reference) vs. stay here (exploration)?

### Idea: formalize the handoff contract between orchestrators and subagents

**Status**: noted; no concrete work scheduled.

**Lineage**. The `multisession` skill (`references/planning.md`) names three flavours of
cross-session design contract: compiler-enforced (traits, type signatures), test-enforced (KATs),
and prose-enforced (invariants stated in docs). Invocation-time handoffs between agents are a
different axis: the orchestrator passes a structured prompt and the receiving agent checks it. The
`@committer` subagent is the most developed case: the orchestrator passes `Working directory`,
`SESSION CONTRACT`, `EXPECTED FILES` and `CO_AUTHOR` (`agents/committer.md`, "Expected input from
the caller"), and the committer refuses on a missing field, scope drift, an empty diff and similar,
with a greppable refusal taxonomy.

The enforcement is **agent-checked, not runtime-enforced**: a model follows a prompt procedure.
Only the `permissions:` frontmatter is enforced by the runtime, and that is a command tripwire, not
an input-shape check. So this is prose-enforced in the sense of the three flavours, with a
mechanical-looking refusal vocabulary on top. Whether the pattern earns a flavour of its own
depends on whether a validator ever makes the check non-model.

**Where handoff contracts already exist**:

- `@committer`: the input block above plus refusal taxonomy. The multisession skill's
  `references/execution.md` restates the orchestrator side and defines the
  `BLOCKED: committer refusal` state, so the contract already lives in two prose places.
- `@plan-juncture`: explicit return vocabularies (`agents/plan-juncture.md`).
- `@explore`: a template per `commands/explore.md` (`Goal`, investigation tasks, output format,
  `Thoroughness:` and `Read-only:` header lines) parsed as natural-language prose. Its only
  refusal clause is for write requests (`agents/explore.md`).
- `@verify`: input is finding text plus an optional `file:line`; no input validation or refusal
  path (`agents/verify.md`, `commands/address-review.md`). The output format is fixed, the input
  shape is not.
- `/plan/rebase` produces a plan that `@git-editor` consumes in a fresh session. The playbook has
  prose preflight checks and stop conditions (clean tree, backup ref, base shape, `edit`-only
  directives; `commands/plan/rebase.md`), but nothing validates the plan's structure.

In every case the receiving agent breaks or improvises if the input is malformed, and enforcement
lives in natural-language prompt instructions, the weakest mechanism available.

**Sketch of repo-level work** (proposals, not descriptions of existing behaviour; not committing
to any of this):

1. **A `schema/` directory** holding YAML or JSON-Schema definitions for each handoff contract.
   Initial entries:
   - `schema/committer-handoff.yaml` — `Working directory`, `SESSION CONTRACT`, `EXPECTED FILES`,
     `CO_AUTHOR`, optional `STAGING MODE`, `COMMIT MESSAGE`, `TICKET ID`, `COMMIT TITLE HINT`.
   - `schema/verify-handoff.yaml` — a claim list; per-claim fields (description, optional
     location) would be new, as the current input is free text.
   - `schema/explore-handoff.yaml` — `GOAL`, `INVESTIGATION TASKS`, `OUTPUT FORMAT`, and the
     existing thoroughness and read-only lines.
2. **Agent prompts reference their schema.** Each subagent's prompt would start with a
   "Expected input shape: see `schema/<name>.yaml`" line, and the prompt body would teach the
   subagent to refuse cleanly on schema violations rather than improvising.
3. **A validator** (maybe a small bash or python script) that orchestrators can run before
   dispatching a subagent. Catches malformed handoffs before they cost a subagent's context.
4. **Code-structure consolidation**. The subagent prompt templates currently scattered across
   `commands/explore.md`, individual agent files, and other command files could be
   reorganized so the schema is the single source of truth and the prompt templates are
   generated from it. This is the "code structure changes if possible" piece — feasible at the
   repo level via a small template/generation step.

**Open questions** (not blocking; just naming them so they're visible):

- Does formalizing this hurt more than it helps? Natural-language handoffs are flexible; a
  schema is rigid. The committer case argues for rigidity because mis-parsed input there means
  a bad commit lands in history; its prompt-level refusals (missing field, verbatim-message and
  staged-set checks) have already narrowed that failure surface. The same calculus may not apply
  to `@explore` or `@verify`, where mis-parsed input means a wasted subagent fork — costly but not
  corrupting.
- What's the right grain? Per-subagent schemas (current sketch) vs. one general "handoff"
  schema with optional fields. The former is more honest; the latter is easier to maintain.
- How do schema changes propagate? If `schema/committer-handoff.yaml` changes, do existing
  orchestrators break? Versioning the schemas vs. growing them monotonically is a real choice.
- Does this want to be a schema in this repository (`schema/`), or an upstream opencode feature
  (a built-in `Handoff` primitive in the runtime)? **Decision for now**:
  repo-level only. Upstream-feature speculation is out of scope for this entry. If a clean
  abstraction emerges from repo-level work it can be proposed upstream later as a separate
  conversation.

**Possible next steps** (none scheduled — listed so the path is visible):

1. Collect the mis-parses, drift refusals and ambiguities that real `@committer` chains produce.
   No collection log exists yet, so without that data formalization is speculative.
2. If problems accumulate, draft `schema/committer-handoff.yaml` as a first artifact.
3. If that lands cleanly, expand to `@verify` and `@explore`.
4. Re-evaluate whether the pattern wants its own document or can stay in this entry.

---

## Idea: context-fill plugin hook for @plan-admin

**Status**: deferred — gate not yet fired. **Separate from the implemented session-economics
monitor**: this entry is about exposing per-subagent context-fill to `@plan-admin` so it can decide
warm-resumption-vs-commit-and-close mid-session. The monitor (`plugins/session-economics.js`) is
ungated and already implemented; it records primary-step cost and completed-step counts, reports
capacity as unavailable, and advises without driving a resumption decision. Context integrity is
qualitative guidance, not a measured score. Do not conflate the two: a monitor notice firing is not
evidence this gate has fired. (The monitor's metadata-only report, below, is a further separate
idea.)

**Gate**: do NOT start until small-commit discipline (`skills/multisession/references/
rationale.md`, "Warm resumption is deferred") has been tried on real chains and shown insufficient —
i.e., a conceptual unit genuinely overflowed a healthy window despite small-commit tuning. For
well-kept codebases this may never fire. Warm resumption is the machinery; the context-fill signal
only earns its keep if warm resumption is needed.

**Value (hypothesis)**: a model cannot reliably measure its own context fill. OpenCode computes
token usage to decide auto-compaction, so a plugin-exposed fill figure could convert a judgment
`@plan-admin` makes badly into a measurement — the same push-mechanical-measurement-to-the-cheapest-
layer principle as the rest of the system. Whether such a figure would be trustworthy is open:
cumulative tokens are not context occupancy, and usage from the last completed request is an
estimate of the next request's size, not a measurement of it.

**Unverified assumption**: that the V2 server plugin API (`@opencode/plugin`; guide
<https://opencode.ai/v2/docs/build/plugins>) exposes, or can derive, a readable per-session fill
figure mid-run. The economics monitor already receives `session.step.ended` events carrying
`tokens`, but converting them into a usable-context percentage needs the V2 usable-context formula,
which is the same unverified item that keeps the monitor's capacity reading unavailable.

**Safe-to-do-early step (when the gate fires)**: fork `@explore` read-only against the OpenCode
source / `@opencode/plugin` SDK and the V2 plugin docs to answer: *can a plugin read or derive the
current context token count for a given (sub)session mid-run, and surface it to the orchestrating
agent?*
- If YES → spec the hook.
- If NO → `@plan-admin` must estimate fill from turn count / cumulative tool-output volume
  (coarser); note this fallback in the warm-resumption spec when writing it.

---

## Idea: metadata-only session economics report

**Status**: scope approved 2026-09-28; no implementation. **Gate**: an explicit user go-ahead and an
agreed fileset. Full original text: `git show 2f95079:PLAN.md` (item 2 of the active handoff).

**Purpose.** Replace repeated cohort selection and arithmetic with one on-demand, deterministic
operation, conceptually `session_economics_report(roots, view="summary" | "sessions")`. The caller
supplies exact session IDs; never infer a cohort from titles, dates, directories or recency.

**Data boundary.** Supported session-metadata and direct-children APIs, recursively. On 2.2.5
`session.list` (with `parentID` for direct children) returns `cost`, `tokens`, `parentID`, `agent`
and `model.id` without message bodies, pages at `limit` ≤ 200 with opaque cursors, and matched the
store for 100 sampled sessions. No message endpoints, database reads, arbitrary SQL, shell, model
calls or arbitrary server/path parameters. Archived-session inclusion is unmeasured on 2.2.5.
Reconcile on session `cost`, not message sums: top-level sessions can exceed their message sum by a
small unattributed amount; forked children match exactly.

**Contract essentials.**
- Deduplicate by session ID; normalize overlapping roots to effective ancestors and report the
  overlap; effective-root contributions reconcile with the unique-session total.
- Missing or inaccessible roots are errors, not $0 trees. Child-fetch failures or traversal limits
  yield an explicitly partial result. Bound traversal; detect malformed or cyclic lineage.
- Report collection start/end, requested/effective roots, coverage, session count, recorded cost,
  largest contributors and token categories; the sessions view adds bounded rows, with omissions
  stated.
- Collection is non-atomic; "complete" means retained accessible lineage, not billing. Costs are
  recorded, not invoices. Agent/model fields are labels, not per-request attribution. Cumulative
  tokens are not context occupancy. No inference of savings, waste or remaining budget.

**Implementation shape.** Separate collector, pure calculation and thin authorization/presentation
adapter; a runtime-compatible plugin export shape. Permission preflight is an implementation gate:
prove how the adapter requests scoped metadata access (custom tools do not inherit native-tool
checks), and that a denial prevents collection.

**Acceptance baseline (recorded costs, V1-era data).** Roots `ses_f4f895b73ffeexSjqcL5VRIIyw`,
`ses_f4f022c67ffeKtBCwQOgeL8NYx` and `ses_f498698cbffetzkunguCwIr3jG` with their descendants give 45
execution sessions and $43.99; adding the status-check root `ses_f49e95f5cffey4oqjTEoDqSyN3` gives
46 and $44.67. Report any discrepancy rather than forcing it. Also needed: synthetic forests (overlap,
missing fields/roots, partial reads, archived nodes, malformed lineage, mid-collection change), the
real loaded tool and its denial path, and no prohibited endpoint. A later benefit comparison holds
task, evidence requirements and approval policy constant.

Excluded from v1: per-step reconciliation, cache/wait diagnostics, enrollment, forecasts, live
notices, budget enforcement.

### Deferred research (report before implementing; user asks first)

- **Cache TTL.** Establish installed runtime/provider support and actual TTL semantics; estimate net
  effect with the premium on all affected writes, not the flagged requests' whole costs. No cache
  setting change or savings claim is authorized.
- **Leading-`cd` guard.** Research a narrow pre-execution rejection of the raw leading-`cd` pattern
  with actionable `workdir` guidance, not silent rewriting. The proposed `cd *` permission deny is
  withdrawn: at the V1 source tag (1.18.31; not rechecked on V2) CWD commands are excluded before
  permission matching. Verify hook failure behavior and false positives; preserve approval gates.
  This would enforce a convention, not a shell security boundary.
- **Large-write requests and long tool spans.** In the combined ALIGN cohort above, 71 of 902
  completed requests had cache writes ≥30,000 tokens with cache reads <5,000; they accounted for
  $19.72 of $44.67 recorded cost, and 66 followed an assistant turn containing a tool span of at
  least five minutes (grouping method: `git show 2f95079:PLAN.md` → "Pilot results"). Cache expiry
  plausibly makes large-context sessions sensitive to waits, but neither historical TTL settings nor
  provider eviction were verified; tool spans mix approval latency, execution and other blocking;
  whole-request cost is not cache-write cost, avoidable waste or a savings estimate. Before
  prescribing shorter driver sessions or a longer TTL, compare equivalent workloads, measure context
  size and cache behavior alongside request count, and keep required checks and human approval.
