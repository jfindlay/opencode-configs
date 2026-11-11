# Ideas — opencode-config

Future work, ideas, and undecided decisions for this repository. Finished or decided entries are
deleted in the commit that lands the result; their record lives in the git log.

- **Promote** an entry with three or more concrete subtasks when it becomes an arc: split it into
  its own `ROADMAP.md`-style document.
- **Remove** an entry quiet for six months or more only if its framing no longer fits reality.

## Open follow-ups

The permission measurement harness is `~/Source/opencode-permtest` (frozen; its `docs/FINDINGS.md`
records what is measured). Version labels name the runtime of the observation.

- **`build` edit policy for the config directory (owner: user).** `opencode.json` (`agents.build`)
  sets `edit ask` on `~/.config/opencode/**` and `~/Source/opencode-config/**` (a path rule matches
  only the spelling it names). Open:
  - Editing this repository while it is the project is not covered: in-project files match as
    project-relative paths, and project-layer rules did not reach `build`.
  - A saved `edit *` allow in a project undoes `ask`; a config `deny` is durable but blocks `build`
    there outright.
- **Shell policy (unmeasured on current rules).** Open checks:
  - Per-agent rule evaluation (`permission.create`, no model call) for `explore`, `committer`,
    `git-editor`: expect `git push` denied everywhere, `git commit` allowed only in `committer` and
    `git-editor`, ask elsewhere.
  - Scanner behavior for `$(...)`, backticks, subshells, and heredocs.
  - If prompt-layer drift (`cat`/`grep` for file reads) returns, measure it before restoring a deny.
- **Env-file rule for `grep`/`glob` (owner: user).** `read` has the env-file rules; `grep` and
  `glob` have none.
- **Plugin delivery residual risks (owner: `@build`; gate: fresh user authorization and spend bound
  for any further paid run).** On 2.2.5 with `@opencode/plugin` 2.0.32:
  - The task-boundary report omits the child's final step (`step.ended` arrives after the hook).
  - After a config-only reload the plugins logged `loading plugin` but no new `initialized` line;
    whether the economics hooks re-registered is unestablished.
  - Whether edits through the symlinked config directory reload plugins is unexercised; `plugin.list`
    `active` proves only that the module loaded, so confirm the new behavior too.
  - Notices print sub-cent costs as `$0.00`.
  - Unexercised: foreground-moved-to-background, production-threshold crossings, other-location
    isolation, worker roles other than `general`, long or nested workloads. A private V2 server needs
    a credential connected through its API (an `auth.json` copy gave `provider.no-route`).
- **Unmeasured permission questions (harness above).**
  - Whether the V1-only agent keys `tools`, `permission`, and `name` disable an agent's
    `permissions` as `temperature` did on 2.0.32 (`top_p` effect also untested).
  - Whether `request.body` reaches the provider.
  - A live-tool confirmation that a config `deny` beats a saved allow.
- **Projects seeded with the old `## Notes for executors` pointer.** Older `/plan/shard` runs put a
  pointer to PLAN into the project's `AGENTS.md`; it dangles after the arc. Replace it with the
  current self-contained `## Register in durable files` block when a seeded project is next touched.
  Open: whether this migration is worth tracking. No project has been repaired.
- **Optional upstream reports (owner: user; file through the `report` skill only if wanted).**
  - 2.0.32: `temperature` beside `permissions:` disabled the agent's rules; not reproduced on 2.2.5.
  - The edit tool's validation error does not name an unrecognized argument key.
- **`skills/style/references/doc.md` additions:** rST conformance details (field-list ordering,
  pitfalls, Sphinx divergences); English conventions (en-UK spelling unless a project pins en-US,
  punctuation, em-dash usage, sentence-case headings); register by doc type (narrative prose for
  design docs, bullet density for reference docs).

## Theme: agent hierarchy (needs a name)

How primary agents, subagents, orchestrators, and autonomous chains compose; currently spread across
`AGENTS.md`, the `multisession` skill, and the agent definitions. Open questions:

- Is "hierarchy" the right framing, or "ecology", "topology", "composition"?
- How does it relate to the `multisession` skill (how sessions compose; probably an orthogonal axis)?
- What promotes into `AGENTS.md` (operational rule) vs. the skill (durable reference) vs. stays here?

### Idea: formalize orchestrator–subagent handoff contracts

Invocation-time handoffs are agent-checked prose, not runtime-enforced: `@committer` has the most
developed contract (input block and refusal taxonomy, `agents/committer.md`); `@plan-juncture` has
return vocabularies; `@explore`, `@verify`, and `/plan/rebase` → `@git-editor` have unvalidated
input shapes. Sketch (proposals only):

1. A `schema/` directory of YAML or JSON-Schema handoff definitions (`committer-handoff`,
   `verify-handoff` with per-claim fields, `explore-handoff`).
2. Agent prompts reference their schema and refuse cleanly on violations.
3. A validator script orchestrators run before dispatch.
4. Prompt templates generated from the schemas (single source of truth).

Open: rigidity vs. flexibility (the committer case argues for rigidity, since a mis-parse lands a bad
commit; for `@explore`/`@verify` a mis-parse only wastes a fork); per-subagent schemas vs. one
general schema; schema versioning vs. monotonic growth. Scope is repo-level only, not an upstream
feature. Gate: collect real `@committer` mis-parses, drift refusals, and ambiguities first; without
that data formalization is speculative.

## Idea: context-fill plugin hook for @plan-admin

Gate: small-commit discipline (`skills/multisession/references/rationale.md`, "Warm resumption is
deferred") tried on real chains and shown insufficient, i.e. a conceptual unit genuinely overflowed a
healthy window. Distinct from `plugins/session-economics.js`, whose notices are not evidence this
gate fired.

A model cannot reliably measure its own context fill; a plugin-exposed figure could turn
`@plan-admin`'s warm-resumption-vs-commit-and-close judgment into a measurement. Unverified: that
the V2 plugin API (<https://opencode.ai/v2/docs/build/plugins>) exposes or can derive a per-session
fill figure mid-run, and that such a figure would be trustworthy. `session.step.ended` carries
`tokens`, but cumulative tokens are not context occupancy, and converting them needs the V2
usable-context formula (the same item that keeps the monitor's capacity reading unavailable). Usage
from the last completed request estimates the next request's size; it does not measure that request.

When the gate fires, fork `@explore` read-only against the `@opencode/plugin` SDK and V2 docs: can a
plugin read or derive a (sub)session's context token count mid-run and surface it to the
orchestrator? Yes → spec the hook. No → `@plan-admin` estimates from turn count and cumulative
tool-output volume (coarser); record that fallback in the warm-resumption spec.

## Idea: metadata-only session economics report

Gate: explicit user go-ahead and an agreed fileset. Original scope text: `git show 2f95079:PLAN.md`
(item 2 of the active handoff).

**Purpose.** One on-demand, deterministic operation replacing repeated cohort selection and
arithmetic, conceptually `session_economics_report(roots, view="summary" | "sessions")`. The caller
supplies exact session IDs; never infer a cohort from titles, dates, directories, or recency.

**Data boundary.** Supported session-metadata and direct-children APIs, recursively. On 2.2.5
`session.list` (with `parentID` for direct children) returns `cost`, `tokens`, `parentID`, `agent`,
and `model.id` without message bodies, pages at `limit` ≤ 200 with opaque cursors, and matched the
store for 100 sampled sessions. No message endpoints, database reads, arbitrary SQL, shell, model
calls, or arbitrary server/path parameters. Archived-session inclusion is unmeasured. Reconcile on
session `cost`, not message sums (top-level sessions can exceed their message sum by a small
unattributed amount; forked children match exactly).

**Contract.**
- Deduplicate by session ID; normalize overlapping roots to effective ancestors and report the
  overlap; effective-root contributions reconcile with the unique-session total.
- Missing or inaccessible roots are errors, not $0 trees. Child-fetch failures or traversal limits
  yield an explicitly partial result. Bound traversal; detect malformed or cyclic lineage.
- Report collection start/end, requested/effective roots, coverage, session count, recorded cost,
  largest contributors, and token categories; the sessions view adds bounded rows with omissions
  stated.
- Collection is non-atomic; "complete" means retained accessible lineage, not billing. Costs are
  recorded, not invoices. Agent/model fields are labels, not per-request attribution. No inference of
  savings, waste, or remaining budget.
- Out of v1: per-step reconciliation, cache/wait diagnostics, enrollment, forecasts, live notices,
  budget enforcement.

**Implementation shape.** Separate collector, pure calculation, and thin authorization/presentation
adapter, in a runtime-compatible plugin export shape. Permission preflight is a gate: prove how the
adapter requests scoped metadata access (custom tools do not inherit native-tool checks) and that a
denial prevents collection.

**Acceptance.** Roots `ses_f4f895b73ffeexSjqcL5VRIIyw`, `ses_f4f022c67ffeKtBCwQOgeL8NYx`, and
`ses_f498698cbffetzkunguCwIr3jG` with descendants give 45 execution sessions and $43.99 (recorded,
V1-era data); adding `ses_f49e95f5cffey4oqjTEoDqSyN3` gives 46 and $44.67. Report any discrepancy
rather than forcing it. Also: synthetic forests (overlap, missing fields/roots, partial reads,
archived nodes, malformed lineage, mid-collection change), the real loaded tool and its denial path,
and no prohibited endpoint. A later benefit comparison holds task, evidence requirements, and
approval policy constant.

### Deferred research (report before implementing; user asks first)

- **Cache TTL.** Establish installed runtime/provider support and actual TTL semantics; estimate the
  net effect with the premium on all affected writes. No cache setting change or savings claim is
  authorized.
- **Leading-`cd` guard.** A narrow pre-execution rejection of the raw leading-`cd` pattern with
  actionable `workdir` guidance, not silent rewriting. At V1 tag 1.18.31 a `cd *` permission deny
  did not work: CWD commands are excluded before permission matching (V2 untested). Verify hook
  failure behavior and false positives; preserve approval gates. It enforces a convention, not a
  shell boundary.
- **Large-write requests and long tool spans.** In the combined acceptance cohort, 71 of 902
  requests had cache writes ≥30,000 tokens with reads <5,000 and accounted for $19.72 of $44.67; 66
  followed a tool span of at least five minutes (grouping: `git show 2f95079:PLAN.md`, "Pilot
  results"). Tool spans mix execution, approval latency, and other blocking; historical cache TTL
  settings and provider eviction were not verified. The correlation does not prove cache expiry,
  avoidable waste, or savings, and whole-request cost is not cache-write cost. Before prescribing
  shorter driver sessions or a longer TTL, compare equivalent workloads, measure context size and
  cache behavior alongside request count, and keep required checks and human approval.
