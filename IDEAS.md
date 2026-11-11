# Ideas — opencode-config

Append-mostly catch-all for opencode-config-relevant exploration items not yet promoted to
active work. Entries here are deliberately fuzzy; the bar for adding is low, the bar for
removing is "this is now real work tracked elsewhere."

Promotion path: when an entry has 3+ concrete sub-tasks and starts feeling like a real arc,
split it into its own `ROADMAP.md`-style document (mirroring the rGNFS pattern of
`docs/ROADMAP.md` for the project-lifetime view and `docs/PLAN.md` for the current sub-track).

Demotion path: when an entry has been quiet for 6+ months and the framing no longer matches
reality, delete it.

---

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

### Idea: the multiplan lifecycle has unowned phases — and the deeper ceiling is OpenCode itself

*Migrated to the agent-graph / harness repo on 2026-06-17.* The substrate/ceiling analysis
(LangGraph/Temporal/CementOS scouting, namespace-allocated permissions, durable-graph-with-admin-judgment
design) is the seed material for that repo's ROADMAP. The theme header above (opencode's own agent
roster composition) stays here; only this sub-entry has left.

### Idea: formalize the runtime-enforced contract between orchestrators and subagents

**Status**: noted; no concrete work scheduled.

**Lineage**. The `multisession` skill names three flavours of cross-session contract:
compiler-enforced (traits, type signatures), test-enforced (KATs), and prose-enforced
(invariants stated in docs). Each catches a different class of cross-session drift. The
`@committer` subagent introduced a new pattern that doesn't fit any of the three cleanly: the
orchestrator passes a `SESSION CONTRACT` blob and an `EXPECTED FILES` list to the committer,
and the committer enforces them at commit time (refusing on scope drift, empty diff, etc.).

This is a **fourth flavour**: *runtime-enforced contracts between agent invocations*. The
contract isn't checked by a compiler, isn't checked by a test suite, isn't a prose invariant —
it's enforced by the receiving agent reading the input and refusing if it doesn't meet shape
expectations. The committer is the first concrete instance, but the pattern generalizes.

**Where the pattern already shows up implicitly**:

- `@verify` takes a list of review-finding claims; refuses or stalls if the list isn't parseable.
- `@explore` takes a `GOAL` + `INVESTIGATION TASKS` + `OUTPUT FORMAT` template per the subagent
  prompt template in `AGENTS.md`. The receiving agent currently parses these as natural-language
  prose; nothing structural enforces the shape.
- `@session-scan` takes session-history inputs and emits classified items; the input/output
  shapes are defined by command-side prose conventions, not by a schema.
- `/rebase-plan` produces a plan that `@git-editor` later consumes in a fresh session; the
  plan's shape is documented in prose but not validated at handoff.

In every case, the contract is real — the receiving agent breaks or improvises if the input is
malformed — but its enforcement lives in natural-language prompt instructions, which is the
weakest possible enforcement mechanism.

**Sketch of repo-level work** (not committing to any of this; just naming the space):

1. **A `schema/` directory** holding YAML or JSON-Schema definitions for each runtime-enforced
   contract. Initial entries:
   - `schema/committer-handoff.yaml` — `SESSION CONTRACT`, `EXPECTED FILES`, optional `TICKET ID`,
     optional `COMMIT TITLE HINT`.
   - `schema/verify-handoff.yaml` — claim list with per-claim `description`, `evidence-hint`,
     `priority`.
   - `schema/explore-handoff.yaml` — `GOAL`, `INVESTIGATION TASKS`, `OUTPUT FORMAT`,
     `THOROUGHNESS`, `READ_ONLY` flag.
2. **Agent prompts reference their schema.** Each subagent's prompt would start with a
   "Expected input shape: see `schema/<name>.yaml`" line, and the prompt body would teach the
   subagent to refuse cleanly on schema violations rather than improvising.
3. **A validator** (maybe a small bash or python script) that orchestrators can run before
   dispatching a subagent. Catches malformed handoffs before they cost a subagent's context.
4. **Code-structure consolidation**. The subagent prompt templates currently scattered across
   `AGENTS.md` (subagent prompt template), individual agent files, and command files could be
   reorganized so the schema is the single source of truth and the prompt templates are
   generated from it. This is the "code structure changes if possible" piece — feasible at the
   repo level via a small template/generation step.

**Open questions** (not blocking; just naming them so they're visible):

- Does formalizing this hurt more than it helps? Natural-language handoffs are flexible; a
  schema is rigid. The committer case argued for rigidity because mis-parsed input there means
  a bad commit lands in history. The same calculus may not apply to `@explore` or `@verify`,
  where mis-parsed input means a wasted subagent fork — costly but not corrupting.
- What's the right grain? Per-subagent schemas (current sketch) vs. one general "handoff"
  schema with optional fields. The former is more honest; the latter is easier to maintain.
- How do schema changes propagate? If `schema/committer-handoff.yaml` changes, do existing
  orchestrators break? Versioning the schemas vs. growing them monotonically is a real choice.
- Does this want to be a salt-managed schema in `opencode-config/schema/`, or an upstream
  opencode feature (a built-in `Handoff` primitive in the runtime)? **Decision for now**:
  repo-level only. Upstream-feature speculation is out of scope for this entry. If a clean
  abstraction emerges from repo-level work it can be proposed upstream later as a separate
  conversation.

**Concrete next steps** (none scheduled — listed so the path is visible):

1. Run `@committer` in a real autonomous chain a few times. Collect the mis-parses, drift
   refusals, ambiguities that show up in practice. Without that data, formalization is
   speculative.
2. If problems accumulate, draft `schema/committer-handoff.yaml` as a first artifact.
3. If that lands cleanly, expand to `@verify` and `@explore`.
4. Re-evaluate whether the pattern wants its own document or can stay in this entry.

---

## Idea: context-fill plugin hook for @plan-admin

**Status**: deferred — gate not yet fired. **Separated from session economics** (see below): this
entry is specifically about exposing per-subagent context-fill to `@plan-admin` so it can decide
warm-resumption-vs-commit-and-close mid-session. The lightweight cost/capacity/integrity monitor
(`plugins/session-economics.js`) is a different, ungated piece of work — it observes and advises,
it does not drive a resumption decision — and has been promoted out of this idea list; see
`AGENTS-LOG.md` / `NOTES.md` for its implementation record. Do not conflate the two: a session
economics warning firing is not evidence this gate has fired.

**Gate**: do NOT start until small-commit discipline (see
the `multisession` skill) has been tried on real chains and shown insufficient —
i.e., a conceptual unit genuinely overflowed a healthy window despite small-commit tuning. For
garden codebases this may never fire. (This is the same gate as the Thread 3 warm-resumption work;
Thread 4 only earns its keep if Thread 3 is needed.)

**Value**: a model cannot reliably measure its own context fill; it confabulates. OpenCode *does*
know the exact token count (it computes it to decide auto-compaction). A plugin hook exposing
per-subagent context-fill ("at 47% / 81% / 94% of window") converts a judgment `@plan-admin` does
badly into a measurement code does perfectly — the same push-mechanical-measurement-to-the-cheapest-layer
principle as the rest of the system.

**Unverified assumption**: that OpenCode's plugin hook surface exposes a readable per-session /
per-subagent context token count mid-session. The `customize-opencode` skill lists hooks
(`tool.execute.before/after`, session events, `experimental.session.compacting`,
`experimental.compaction.autocontinue`) but does not confirm a readable live token-fill figure.

**Safe-to-do-early step (when the gate fires)**: fork `@explore` read-only against the OpenCode
source / plugin SDK (`@opencode-ai/plugin`) and the published config schema to answer: *can a
plugin read the current context token count for a given (sub)session mid-run, and surface it to
the orchestrating agent?*
- If YES → spec the hook.
- If NO → `@plan-admin` must estimate fill from turn count / cumulative tool-output volume
  (coarser); note this fallback in the Thread 3 spec when writing it.

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
