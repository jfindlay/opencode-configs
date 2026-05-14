---
description: "[jf] Three-thread audit of OpenCode user-level infrastructure (~/.config/opencode/) against session-store data. Threads 1+2 (permission flow + usage patterns) run from this Sonnet primary session via an @explore fork; Thread 3 (configuration cohesion) is a manual hand-off to a fresh @plan-deep session. On-demand only — no cadence imposed."
---

# /config-retrospective

Audit pass over the OpenCode user-level infrastructure: permission rules, agent files, command
files, and the user's own usage patterns. Source of truth at `opencode-config/`; runtime mirror at
`~/.config/opencode/`.

The audit is structured in three threads. Threads 1+2 share schema-discovery work and run together
in this session via an `@explore` fork. Thread 3 is judgment-heavy architectural synthesis that must
run in a fresh `@plan-deep` session — primary-session transitions cannot be forked, so the hand-off
is manual.

## Schema crib (re-derivation tax)

Every audit re-discovers the same store layout from scratch. Pin the durable facts here.

**Store location.** `~/.local/share/opencode/opencode.db`. Read-only access: `sqlite3 -readonly
~/.local/share/opencode/opencode.db '<query>'`. WAL files (`opencode.db-wal`, `opencode.db-shm`)
live alongside; do not copy or modify them.

**Tables.** `session`, `message`, `part`. Foreign-key chain: `session` → `message` → `part`.

**`part.data` is JSON.** Use `json_extract(data, '$.<key>')` to read fields. Common shapes:
- `json_extract(data, '$.type')` — `text`, `tool`, `compaction`, others. Tool-call rows are
  `'$.type' = 'tool'`.
- The body of a user message is a `text` part where `data` contains the prompt verbatim. Slash
  commands (`/q`, `/note`, etc.) are expanded *client-side* before storage — the store sees the
  expanded prompt body, not the slash-command name. Discriminate by full-text match against the
  command's signature opening line.

**Time encoding.** `time_created` and `time_updated` are integer **millisecond-epoch**, not seconds.
To bin by day: `date(time_created/1000, 'unixepoch')`. To filter the last 14 days: `time_created >=
(strftime('%s', 'now', '-14 days') * 1000)`.

**Session-level overrides.** `session.permission` column holds session-level permission JSON when
agent prompts override the global rules. Examples seen historically:
- `todowrite/todoread/task` deny: forks where the agent prompt suppresses these tools.
- `plan_enter/plan_exit/question` deny: `@rebase` configuration.  These are configured behaviour,
  not anomalies.

**Compaction events.** The `time_compacting` column on `session` is unused by current OpenCode
builds. Compaction events live as `part` rows where `json_extract(data, '$.type') = 'compaction'`.
Count compactions per session by joining and grouping.

## Thread 1 — permission-flow audit

**Audit questions.**
1. Which tool invocations triggered permission prompts most often, grouped by pattern?
2. Which prompts fired even though a permission rule should cover them? (Reconstruct by replaying
   current `opencode.json` against historical args; rule-side data isn't in the store.)
3. New tool-invocation patterns this week / month?
4. For each pattern: allow vs. deny ratio.
5. Per-agent breakdown — does `@plan-deep` trigger different prompts than `@build`?

**Output.** Proposed `opencode.json` permission-rule additions or changes, ordered by frequency ×
ease-of-decision. Pre-approve high-frequency safe patterns; tighten or relax borderline ones; add
coverage for novel patterns.

## Thread 2 — usage-pattern audit

**Audit questions.**
1. Agent distribution: which agents invoked, how often, for what kinds of work?
2. Command distribution: any commands defined under `command/` but never invoked, or invoked only
   once?
3. Session-shape stats: median length in messages, compaction count distribution, agent-switch
   frequency within a session.
4. Drift between intended and actual usage — examples:
   - Is `@plan-deep` (Opus) doing work that `@build` (Sonnet) should be doing?
   - Are subagent forks happening on the right axis (the three-axis test in AGENTS.md `## Subagent
     strategy`)?
   - Is `/q` ever used? Is it used when it shouldn't be?
5. User-side patterns. Example: starting fresh sessions when a previous one was still coherent;
compacting too many times instead of splitting.

**Output.** A usage-pattern report with concrete observations — bulleted findings, each backed by a
specific query result. Distinguish "agent is configured wrong" findings from "user should change
behaviour" findings.

## Thread 3 — configuration cohesion audit (deferred to a separate session)

**Audit questions.**
1. Does the file family hang together coherently? Is the load-rules dispatch table in `AGENTS.md`
   correct against actual usage (cross-check via Read tool-call rows in the store, e.g.
   `json_extract(data, '$.type') = 'tool' AND data LIKE '%STYLE-CODE.md%'` for STYLE-CODE.md
   firings)?
2. Does each agent file earn its keep? Cross-check against Thread 2's invocation distribution.
3. Does each command file earn its keep? Cross-check against Thread 2 again.
4. What's missing? Gaps in agent/command coverage that Threads 1+2 reveal.
5. Architectural questions deferred from prior sessions (e.g., "should AGENTS-LENSES.md become a
   skill?").

**Output.** Architectural assessment with proposed file-family changes — adds, removes, splits,
merges, scope adjustments. Flag any candidates for the AGENTS-HINTS three-axis capture test.

## Steps

1. **Confirm session tier.** This command must run from a T1/Sonnet primary (`@build` or
   `@plan-deep` running cheap work). If you are not on Sonnet, tell the user and stop — Threads 1+2
   don't need T0 reasoning, and the `@explore` fork inherits the wrong cost class if the caller is
   misallocated.

2. **Open the workspace-transient plan file.** Create or open `~/PLAN-opencode-audit.md` Write the
   three-thread charter to it (this command's body is the canonical text; copy the audit-question
   sections verbatim). The file is transient and deleted at audit completion.

3. **Fork `@explore` for Threads 1+2.** Pass the schema crib above plus the audit-question lists for
   Threads 1 and 2 verbatim. The fork is appropriate: high context-pollution (many SQL queries,
   large result sets), high parallelizability (queries independent), no steering mid-task.

   Fork-prompt template:

   ```
   Working directory: <opencode-config-repo-root>
   Thoroughness: very thorough
   Read-only: YES. DO NOT EDIT ANY FILES. Do not run state-changing commands.

   GOAL
   Audit the OpenCode user-level infrastructure against the session store at
   ~/.local/share/opencode/opencode.db. Two threads: Thread 1 (permission-flow) and Thread 2
   (usage-pattern). Do NOT attempt Thread 3 — that runs in a separate session.

   SCHEMA CRIB
   <paste the schema crib section verbatim>

   THREAD 1 QUESTIONS
   <paste Thread 1 audit questions verbatim>

   THREAD 2 QUESTIONS
   <paste Thread 2 audit questions verbatim>

   INVESTIGATION TASKS
   1. Validate the schema crib by sampling rows from each table. Note any drift from the crib (new
      columns, encoding changes, table renames). Drift is the most important finding; surface it
      before continuing.
   2. Run Thread 1 queries. Group rejected tool calls by category. Cross-reference current
      opencode.json (read it from <opencode-config-repo-root>/opencode.json) to identify rules that
      should cover historical rejections.
   3. Run Thread 2 queries. Compute distributions; flag drift between intended and actual usage.

   OUTPUT FORMAT
   Two sections, one per thread, with findings as bulleted observations each backed by a specific
   query and result. Distinguish factual observations (counts, distributions) from interpretive
   findings (drift, recommendations). Cap reported queries at the most informative ~10 per thread;
   you can still rely on others to derive the findings.
   ```

4. **Capture the subagent's report into PLAN-opencode-audit.md.** Append the report under a `##
   Threads 1 + 2 results (Sonnet session, <date>)` heading. Include the SQL queries verbatim so the
   next audit doesn't re-derive them.

5. **Surface decisions to the user.** For each finding the report flags as actionable, ask via the
   Question tool: accept (record decision and pass to Thread 3), defer (note it but don't act),
   reject (drop). Record decisions in PLAN-opencode-audit.md under a `## User decisions` table.
   This is the only steerable phase — the subagent fork was non-steerable.

6. **Hand off to Thread 3.** End this session with a one-line instruction:

   > Switch to a fresh `@plan-deep` session and run Thread 3 against
   > `~/PLAN-opencode-audit.md`.

   Thread 3 is judgment-heavy architectural synthesis: it consumes Threads 1+2 outputs plus user
   decisions, executes mechanical actions (renames, permission edits, agent instantiations), and
   surfaces remaining architectural questions for user judgment. It must run on Opus because the
   cohesion review (does the file family still hang together post-changes?) is exactly the
   tradeoff-analysis register that justifies T0 cost.

7. **At completion (Thread 3 finished, all proposals actioned).** Delete `PLAN-opencode-audit.md`.
   The file is workspace-transient by design: its job is to carry findings between Threads 1+2 and
   Thread 3 across the session boundary. Add a dated entry to `~/.config/opencode/AGENTS-LOG.md`
   summarising what changed and why.

## Constraints

- The `PLAN-opencode-audit.md` file lives at the **user home dir**, NOT under `opencode-config/`.
  The latter repo is propagated to `~/.config/opencode/` runtime by salt-call.  Workspace-transient
  means transient to the workspace, not to the runtime config.
- Read-only against the SQLite store. Use `sqlite3 -readonly`. Never write to `.db` /`.db-wal` /
  `.db-shm` files; never run `VACUUM` or schema migrations.
- The schema crib is the canonical text. If a future audit discovers schema drift, update the crib
  in this command file (via `/update-config`) before completing the audit, so the next run starts
  from accurate facts.
- Thread 3 runs in a separate session with a different model. Do NOT attempt to do Thread 3 from
  this Sonnet session — the cohesion review's value depends on T0 reasoning depth.
- The audit produces capture candidates (durable framings worth promoting to AGENTS-HINTS.md or
  AGENTS-LOG.md). Surface them per the AGENTS.md three-axis test; do not auto-write.

## Exit report

- PLAN-opencode-audit.md path and last-touched section.
- Threads 1+2 finding count, decisions logged.
- Hand-off instruction for Thread 3 (verbatim, copy-pasteable).
