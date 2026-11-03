---
description: "[jf] Single-session @architect audit of the OpenCode user-level infrastructure against the session store, scored against a relentless-simplicity lens. On-demand only."
---

Audit the OpenCode user-level infrastructure (permissions, agents, commands, docs) against actual
session-store usage; action approved changes. One `@architect` session, no cross-session hand-off.
Source of truth and live config are the same files: `~/.config/opencode/` is a symlink to
`opencode-config/`, so every edit there takes effect immediately.

## The lens: relentless simplicity

Every finding is scored against one bar:

- **Fewest files.** Does each file earn its keep?
- **Minimal content.** Is every section necessary? Verbose ceremony and re-derivable exposition are
  cut candidates.
- **Coherent disposition.** Right content in the right file; load rules accurate; register clean.

Telemetry is evidence *for* this lens, not an end in itself — usage/config divergence (a command
never run, a permission rule that never fires) is the signal; simplicity is the verdict.

## Data-access crib

Verified against OpenCode 2.2.5 by comparing the read API with direct store queries (identical
agent, parent, model, cost, timestamps and per-status tool counts for 100 recent sessions). The
store layout changed between the V1 and V2 runtimes; re-check after an engine upgrade.

**Prefer the read API.** `opencode api <operationId> --param key=value` talks to the background
service. Redirect stdout to a file: on 2.2.5 a large response piped to another process arrived
truncated, as invalid JSON. Pages are bounded (`limit` ≤ 200); follow `cursor.next` until a page
returns fewer than `limit` items. Location-scoped operations take `location[directory]=<path>` in a
raw `GET` path.
- `session.list` (`limit`, `order`, `parentID`, `directory`, `project`, `search`, `archived`): per
  session `id`, `parentID` (absent for top-level), `agent`, `model.id`, `cost`, `tokens`
  (`input`, `output`, `reasoning`, `cache.read`, `cache.write`), `outcome` (finished sessions only),
  `time` (`created`, `updated`, `busy`, `idle`; integer millisecond-epoch), `title`, `location`.
  `parentID=<id>` lists direct children; omit `archived` for the normal tree (`archived=true`
  returns only archived sessions).
- `session.message.list` (`sessionID`, `type`, `limit`, `cursor`), newest first. Assistant messages
  carry `cost`, `tokens`, `finish`, `time`, and `content[]`. A tool call is a `content[]` item with
  `type: "tool"`, `name`, `state.status` (`streaming`, `running`, `completed`, `error`),
  `state.error` (`type`, `message`) and `time` (`created`, `ran`, `completed`).
- Fork linkage: a completed `subagent` tool call carries the child's id at
  `state.metadata.sessionID`; it equals the child's `parentID`.

**Cost.** `session.cost` is the session's own spend, never rolled up from children. For forked
children it equals the sum of its assistant messages' `cost`. A top-level session's `cost` exceeds
that sum by a small amount ($0.00002–$0.002 in the sample) not attributable to any listed message;
the cause is unverified. These are OpenCode-recorded costs, not invoices.

**Direct store queries (fallback for bulk aggregates).** `~/.local/share/opencode/opencode.db` is a
live WAL database (about 19 GB on this machine). Query it only as `sqlite3 -readonly <db> '<query>'`
with predicates on indexed columns (`session_id`, `parent_id`); never write it, and never copy
`.db`, `-wal` and `-shm` as separate files. For a stable copy use SQLite's `.backup` into a
directory with enough free space (`/tmp` may be too small).
- `session_v2` (current sessions): `id`, `parent_id`, `agent`, `model` (JSON; `json_extract(model,
  '$.id')`), `cost`, `tokens_input/output/reasoning/cache_read/cache_write`, `idle_outcome`,
  `time_created/updated/idle/busy` (millisecond-epoch), `title`, `slug`, `directory`.
- `session_message` (`session_id`, `type`, `seq`, `data` JSON): types `assistant`, `user`, `system`,
  `synthetic`, `idle`, `agent-switched`, `model-switched`, `compaction`, `location-switched`.
  `data` mirrors the API message: `$.cost`, `$.tokens`, `$.text` (user prompts), and for assistant
  rows tool calls inside `$.content` — iterate with `json_each(data, '$.content')` and filter
  `json_extract(value, '$.type') = 'tool'` (`$.name`, `$.state.status`, `$.state.error.type`).
  Compaction events are rows with `type = 'compaction'`.
- `session_part` holds no rows for recent sessions (content is inline in `session_message`).
- Day binning: `date(time_created/1000, 'unixepoch')`; last 14 days:
  `time_created >= (strftime('%s', 'now', '-14 days') * 1000)`.
- Legacy tables `session`, `message`, `part` (V1 layout, `part.data` JSON with `step-finish`
  rows) stop at sessions created 2026-10-17. `session_v2` also holds those older sessions and their
  messages, so the V2 tables are the single surface; use the legacy tables only to inspect V1-era
  fields. Whether V1-era `aborted` tool outcomes map to a V2 status was not checked.

**Permission decisions are not recorded as history.** The `permission` table holds project-scoped
saved approvals (`action`, `resource`), not decisions; the `event` table was empty and
`experimental.session.log` returned only a sync marker; `permission.request.list` and
`session.permission.list` show only currently pending requests. Residue only, in the tool call's
`state.error`: type `permission.rejected` for both a configured deny and a rejected ask; the message
text separates them (`Permission denied: <tool>` for a configured deny; `This non-interactive run
cannot ask the user for permission…` for an ask nobody could answer). The text of a human Reject in
an interactive client was not observed. An approved ask is `completed`, indistinguishable from a
pre-allowed call. Calls that fail otherwise carry type `tool.execution`.

**Session-level overrides.** `session_v2.permission` is NULL in every row and no sampled API session
carried `permissions`, so a fork's session-level override cannot be discovered on V2. Legacy
`session.permission` still holds V1-era overrides for sessions before 2026-10-17.

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
   Read-only: the read API first, else `sqlite3 -readonly`; never write `.db`/`.db-wal`/`.db-shm`.
   Edit through the `opencode-config/` path; the symlinked config directory is the same files.
3. Run Thread 3 yourself. Produce a ranked candidate list (deletes, merges, cuts, permission edits)
   ranked by (simplicity impact) × (ease/safety).
4. Gate via Question tool (accept / defer / reject). Do not action before this step.
5. Dispatch `@build` (mechanical) or `@general` (multi-file) to action accepted changes. Subagents
   leave the tree dirty; do NOT commit.
6. Commit: draft message, gate on user approval, delegate to `@committer`. One commit per coherent
   change. Never push.
7. Append a dated entry to `AGENTS-LOG.md`: what changed, why, alternatives weighed.
