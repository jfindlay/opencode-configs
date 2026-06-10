---
description: "[jf] Single-session @plan audit of the OpenCode user-level infrastructure against the session store. Forks @explore for permission-flow + usage-pattern data; the cohesion review (does the file family stay relentlessly simple?) is the spine. Approved changes are actioned by forked @build/@general subagents and committed via the /update-config convention. On-demand only."
---

# /config-retrospective

Audit the OpenCode user-level infrastructure — permission rules, agent files, command files, doc
files — against the user's actual session-store usage, then action the changes worth making. Source
of truth at `opencode-config/`; runtime mirror at `~/.config/opencode/`.

This command runs end-to-end in **one `@plan` session**. There is no cross-session hand-off and
no workspace-transient carrier file: the orchestrator forks read-only `@explore` subagents to mine
the session store (high context-pollution, parallelizable, non-steerable — a textbook fork), holds
the findings in its own context, surfaces decisions to the user, and dispatches `@build`/`@general`
subagents to action approved changes. The judgment work — the cohesion review — stays in the Opus
primary, which is why the command is T0.

## The lens: relentless simplicity

Every finding is scored against one bar, not against telemetry for its own sake:

- **Fewest files.** Does each file earn its keep? A file that is rarely loaded, never invoked, or
  duplicates another's content is a deletion or merge candidate.
- **Minimal content.** Within each file, is every section necessary? Verbose ceremony, duplicated
  constraints, and re-derivable exposition are cut candidates.
- **Coherent disposition.** Is the file family intuitive — right content in the right file, load
  rules accurate, register clean (transactional / activational / referential not bleeding)?

Telemetry (Threads 1+2) is evidence *for* this lens, not an end in itself. "Data-driven" can
mislead, but the data reveals where usage and config **diverge** — a command defined but never run,
a permission rule that never fires, an agent doing work its tier shouldn't. Divergence is the
signal; simplicity is the verdict.

## Schema crib (re-derivation tax)

Every audit re-discovers the same store layout. Pin the durable facts here so the `@explore` fork
starts from accurate ground. If a fork reports drift from this crib, update the crib (via
`/update-config`) before completing the audit.

**Store location.** `~/.local/share/opencode/opencode.db`. Read-only: `sqlite3 -readonly
~/.local/share/opencode/opencode.db '<query>'`. WAL files (`opencode.db-wal`, `opencode.db-shm`)
live alongside; never copy or modify them.

**Tables.** The analytic chain is `session` → `message` → `part` (FK-linked, cascade delete). The
store also carries `permission`, `todo`, `event`, `event_sequence`, `session_message`, `workspace`,
`project`, `account*`, `data_migration`, `session_share`, `__drizzle_migrations` — most are empty or
irrelevant to this audit. Notably the standalone `permission` table (keyed by `project_id`, JSON
`data`) is **empty in current builds** and the `event` / `session_message` tables are empty too.

**`session` analytic columns (the high-value ones — exploit directly, do not infer from bodies).**
The crib historically listed only the FK chain; these columns make agent/model/chain attribution a
direct query:
- `session.agent` (text) — owning agent: `build`, `explore`, `plan-deep`, `general`, `committer`,
  `session-scan`, or NULL for pre-agent-column sessions (before ~2026-04-12).
- `session.model` (text) — JSON, e.g. `{"id":"claude-sonnet-4-6","providerID":"anthropic",...}`.
  Tier-check with `json_extract(model, '$.id')`.
- `session.parent_id` (text) — parent session for a forked subagent; NULL for top-level. **This is
  how fork trees / `/run-plan` chains are reconstructed** (a plan-deep parent with build/general/
  explore/committer children ordered by `time_created`).
- `session.cost` (real) and `session.tokens_input/output/reasoning/cache_read/cache_write` (integer)
  — per-session economics, for chain-vs-standalone cost and Opus-overhead analysis.
- `session.title`, `session.slug`, `session.directory` — human-readable session identity.

**`part.data` is JSON.** Use `json_extract(data, '$.<key>')`:
- `json_extract(data, '$.type')` is one of: `tool`, `step-start`, `step-finish`, `text`,
  `reasoning`, `patch`, `compaction`, `agent`. Tool-call rows are `'$.type' = 'tool'`; the tool name
  is `'$.tool'` and its outcome is `'$.state.status'` (`completed` / `error` / `aborted` /
  `pending` / `running`) with `'$.state.input.<arg>'` and `'$.state.error'` beneath.
- A user message body is a `text` part whose `data` holds the prompt verbatim. Slash commands are
  expanded *client-side* before storage — the store sees the expanded body, not the slash name.
  Discriminate by full-text match against the command's signature opening line.

**Time encoding.** `time_created` / `time_updated` are integer **millisecond-epoch**. Bin by day:
`date(time_created/1000, 'unixepoch')`. Last 14 days: `time_created >= (strftime('%s', 'now', '-14
days') * 1000)`.

**Permission decisions are NOT logged.** This is the crib's most dangerous historical error.
Permission allow/deny/ask *outcomes* are not recorded anywhere — the standalone `permission` table
is empty and there are no permission-typed `part` rows. Thread 1 can only observe the residue in
tool-part status: (a) rule-denied calls (`'$.state.status' = 'error'` with `'$.state.error'` LIKE
`%user has specified a rule%`), and (b) user-rejected calls (error LIKE `%user rejected
permission%`). An *approved* ask is stored as `completed`, indistinguishable from a pre-allowed
call — so allow/ask ratios are unrecoverable.

**Session-level overrides.** `session.permission` (distinct from the empty `permission` table) holds
session-level permission JSON when a fork prompt overrides the global rules (e.g. `edit: * -> deny`
on read-only explore forks, `todowrite`/`task` deny on subagent forks). These are configured
behaviour, not anomalies.

**Compaction events.** The `time_compacting` column is unused by current builds. Compactions live as
`part` rows where `json_extract(data, '$.type') = 'compaction'`. Count per session by join + group.

## Threads

The three threads run in one session. Threads 1+2 are forked to `@explore` together (shared
schema-discovery work, independent queries). Thread 3 is the orchestrator's own judgment work and
consumes the fork's output.

**Thread 1 — permission-flow.** Which tool invocations triggered prompts most often, by pattern?
Which fired despite a rule that should cover them (replay current `opencode.json` against historical
args)? Novel patterns this period? Allow/deny ratio per pattern. Per-agent breakdown — does
`@plan` trigger different prompts than `@build`?

**Thread 2 — usage-pattern.** Agent distribution: which invoked, how often, for what work? Commands
defined under `command/` but never invoked, or invoked once? Session-shape: median length,
compaction distribution, agent-switch frequency. Divergence between intended and actual use — is
`@plan` (Opus) doing `@build` (Sonnet) work? Are forks on the right axis (the three-axis test
in AGENTS.md `## Subagent strategy`)? Is `/q` used, and when it shouldn't be?

**Thread 3 — cohesion (the spine, orchestrator's own).** Does the file family hang together? Is the
load-rules dispatch table in `AGENTS.md` accurate against actual Read firings (`json_extract(data,
'$.type') = 'tool' AND data LIKE '%STYLE-CODE.md%'`, etc.)? Does each agent file earn its keep
(cross-check Thread 2's distribution)? Each command file? Each doc file — is any content
re-derivable, duplicated, or verbose ceremony? What's missing that Threads 1+2 reveal? Carry-over
architectural questions (e.g. "should AGENTS-LENSES.md become a skill?"). Score every candidate
against the relentless-simplicity lens above.

## Steps

1. **Confirm tier.** This command runs on T0/Opus (`@plan`). The cohesion review is
   tradeoff-analysis register; the data-mining is delegated to a Sonnet fork. If you are not on
   Opus, tell the user and stop.

2. **Fork `@explore` for Threads 1+2.** Pass the schema crib and the Thread 1+2 descriptions
   verbatim. Fork prompt:

   ```
   Working directory: <opencode-config-repo-root>
   Thoroughness: very thorough
   Read-only: YES. DO NOT EDIT ANY FILES. Do not run state-changing commands.

   GOAL
   Mine the OpenCode session store at ~/.local/share/opencode/opencode.db for permission-flow
   (Thread 1) and usage-pattern (Thread 2) evidence. Do NOT attempt the cohesion review — that
   stays in the calling session.

   SCHEMA CRIB
   <paste the schema crib verbatim>

   THREAD 1 + THREAD 2
   <paste the Thread 1 and Thread 2 descriptions verbatim>

   INVESTIGATION TASKS
   1. Validate the schema crib by sampling each table. Surface any drift FIRST — it is the most
      important finding.
   2. Run Thread 1 queries. Group rejected calls by category. Cross-reference current opencode.json
      (read it from <repo-root>/opencode.json) to find rules that should cover historical rejections.
   3. Run Thread 2 queries. Compute distributions; flag every usage/config divergence.

   OUTPUT FORMAT
   Two sections, one per thread. Findings as bulleted observations, each backed by a specific query
   + result. Separate factual observations (counts) from interpretive findings (divergence).
   Include the SQL verbatim for the ~10 most informative queries per thread so the next audit does
   not re-derive them. Flag drift from the schema crib explicitly.
   ```

   This is the only non-steerable phase. If you need to mine very different question sets that are
   themselves parallelizable, fork more than one `@explore`.

3. **Run Thread 3 yourself.** With the fork's output in context, read the config files that Threads
   1+2 implicate and judge the whole family against the relentless-simplicity lens. Produce a ranked
   list of candidate changes: deletes, merges, splits, scope adjustments, content cuts, permission
   edits, missing coverage. Rank by (impact on simplicity) × (ease/safety of the change).

4. **Surface decisions to the user.** For each candidate, use the Question tool: **accept** (queue
   for action), **defer** (note it, don't act), **reject** (drop). This is the steerable gate — do
   not action anything before it. Flag any durable framing against the AGENTS.md three-axis capture
   test.

5. **Action accepted changes via subagents.** For each accepted change, dispatch a subagent against
   the **opencode-config repo** (never the runtime mirror):
   - Mechanical, well-scoped edits (file delete, content cut, section move, permission-rule edit) →
     `@build`.
   - Heterogeneous multi-file changes (a merge that touches several files plus the AGENTS.md roster)
     → `@general`.
   Subagents apply edits and leave the tree dirty with the change complete. They do NOT commit —
   commit discipline stays with the orchestrator.

6. **Commit via the `/update-config` convention.** Once accepted changes are applied, commit through
   the blessed config path: stage exactly the changed files, draft a conventional message, and gate
   the commit on user approval (the human gate `/update-config` deliberately keeps). One commit per
   coherent change, or one squashed commit for the audit if the user prefers. Never push.

7. **Log the audit.** Append a dated entry to `AGENTS-LOG.md` (in the repo): what changed, why, what
   the alternative was. This is the institutional memory that keeps the next audit from re-deriving
   the rationale — a legitimate durable changelog write, not a transient scratch file.

## Constraints

- All edits target the **opencode-config repo**, never `~/.config/opencode/` (the salt/symlink
  mirror). Subagents must be told this explicitly in their fork prompt.
- Read-only against the SQLite store: `sqlite3 -readonly`. Never write `.db` / `.db-wal` / `.db-shm`;
  never `VACUUM` or migrate.
- The schema crib is canonical. On discovered drift, update it via `/update-config` before
  completing the audit.
- The command must model what it audits: keep it relentlessly simple. Resist re-growing the
  cross-session ceremony this rework removed.

## Exit report

- Threads 1+2 finding count; schema drift (if any).
- Accepted / deferred / rejected counts; files changed and the commit hash (or "uncommitted —
  pending user approval").
- AGENTS-LOG.md entry written (yes/no).
- Any CAPTURE-CANDIDATE framings surfaced.
