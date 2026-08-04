---
description: "[jf] Single-session @architect audit of the OpenCode user-level infrastructure against the session store, scored against a relentless-simplicity lens. On-demand only."
---

Audit the OpenCode user-level infrastructure (permissions, agents, commands, docs) against actual
session-store usage; action approved changes. One `@architect` session, no cross-session hand-off.
Source of truth: `opencode-config/`; runtime mirror: `~/.config/opencode/`.

## The lens: relentless simplicity

Every finding is scored against one bar:

- **Fewest files.** Does each file earn its keep?
- **Minimal content.** Is every section necessary? Verbose ceremony and re-derivable exposition are
  cut candidates.
- **Coherent disposition.** Right content in the right file; load rules accurate; register clean.

Telemetry is evidence *for* this lens, not an end in itself — usage/config divergence (a command
never run, a permission rule that never fires) is the signal; simplicity is the verdict.

## Schema crib

**Store location.** `~/.local/share/opencode/opencode.db`. Read-only: `sqlite3 -readonly
~/.local/share/opencode/opencode.db '<query>'`. WAL files live alongside; never copy or modify them.

**Tables.** Analytic chain: `session` → `message` → `part` (FK-linked). Other tables (`permission`,
`todo`, `event`, `event_sequence`, `session_message`, `workspace`, `project`, `account*`) are mostly
empty or irrelevant.

**`session` analytic columns.**
- `session.agent` (text) — owning agent: `build`, `explore`, `general`, `committer`, etc.
- `session.model` (text) — JSON, e.g. `{"id":"claude-sonnet-4-6","providerID":"anthropic"}`.
  Tier-check with `json_extract(model, '$.id')`.
- `session.parent_id` (text) — parent session for a forked subagent; NULL for top-level. Fork
  trees / `/plan-run` chains reconstructed by joining parent_id ordered by `time_created`.
- `session.cost` (real) and `session.tokens_*` (integer) — per-session economics.
- `session.title`, `session.slug`, `session.directory` — human-readable identity.

**`part.data` is JSON.** `json_extract(data, '$.type')` is one of: `tool`, `step-start`,
`step-finish`, `text`, `reasoning`, `patch`, `compaction`, `agent`. Tool-call rows: `'$.type' =
'tool'`; name at `'$.tool'`; outcome at `'$.state.status'` (`completed`/`error`/`aborted`).

**Time encoding.** `time_created` / `time_updated` are integer **millisecond-epoch**. Bin by day:
`date(time_created/1000, 'unixepoch')`. Last 14 days: `time_created >= (strftime('%s', 'now', '-14
days') * 1000)`.

**Permission decisions are NOT logged.** The standalone `permission` table is empty; no
permission-typed `part` rows exist. Residue only: rule-denied calls (`'$.state.status' = 'error'`,
error LIKE `%user has specified a rule%`) and user-rejected calls (error LIKE `%user rejected
permission%`). Approved asks are `completed`, indistinguishable from pre-allowed calls.

**Session-level overrides.** `session.permission` holds session-level permission JSON when a fork
prompt overrides global rules (e.g. `edit: * -> deny` on read-only forks). Configured behaviour,
not anomalies.

**Compaction events.** Live as `part` rows: `json_extract(data, '$.type') = 'compaction'`.

## Threads
1. **Permission-flow.** Which tool invocations triggered prompts most often, which fire despite a
   rule that should cover them, and what novel patterns appeared?
2. **Usage-pattern.** Which agents/commands are used, which are unused, and where does actual use
   diverge from intended use (wrong tier, wrong axis)?
3. **Cohesion (orchestrator's own).** Does the file family hang together against the
   relentless-simplicity lens?

## Steps

1. Confirm T0/`@architect`. If not, tell the user and stop.
2. Fork `@explore` for Threads 1+2 with the schema crib + thread questions (template per
   `AGENTS-SUBAGENT-STRATEGY.md`). Validate crib first; surface any drift immediately.
   Read-only: `sqlite3 -readonly`; never write `.db`/`.db-wal`/`.db-shm`. All edits target
   `opencode-config/`, never `~/.config/opencode/`.
3. Run Thread 3 yourself. Produce a ranked candidate list (deletes, merges, cuts, permission edits)
   ranked by (simplicity impact) × (ease/safety).
4. Gate via Question tool (accept / defer / reject). Do not action before this step.
5. Dispatch `@build` (mechanical) or `@general` (multi-file) to action accepted changes. Subagents
   leave the tree dirty; do NOT commit.
6. Commit: draft message, gate on user approval, delegate to `@committer`. One commit per coherent
   change. Never push.
7. Append a dated entry to `AGENTS-LOG.md`: what changed, why, alternatives weighed.
