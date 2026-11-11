---
description: "[jf] Single-session @architect audit of the OpenCode user-level infrastructure against the session store, scored against a relentless-simplicity lens. On-demand only."
agent: architect
---

Audit the OpenCode user-level infrastructure (permissions, agents, commands, docs) against actual
session-store usage; action approved changes. This command runs the session as `@architect`; the
switch persists after it finishes. One session, no cross-session hand-off. Source of truth and live
config are the same files: `~/.config/opencode/` is a symlink to `opencode-config/`, so edits there
take effect on reload (the symlinked directory is not watched; see the reload note in `IDEAS.md`).
The architect never edits source or config itself: approved changes go to a forked `@build`
(step 4).

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
service. Keep pages small and do not pipe a large response into another process: on 2.2.5 such a
response (piped into `jq`) arrived truncated, as invalid JSON, while small pages parsed and a full
response the shell tool retained itself (it saves large output to a file) was also parseable. A
message `limit` bounds the item count, not the response bytes: tool output sits inline in the
messages. Read retained output with `Read` (`offset`/`limit`); no export file or redirect is needed.
Pagination: `cursor.next` is an opaque value; pass it back as `--param cursor=<value>` (not with
`order`; repeat the `type` filter for messages). Stop on an empty page: a page shorter than `limit`
can still carry a non-null `cursor.next` (a 14-item result at `limit=200` did). Location-scoped
operations take `location[directory]=<path>` in a raw `GET` path.
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
  `state.metadata.sessionID`. The child's `parentID` is the calling session's id, not its own.

**Cost.** `session.cost` is the session's own spend, never rolled up from children. For forked
children it equals the sum of its assistant messages' `cost`. A top-level session's `cost` exceeds
that sum by a small amount ($0.00002–$0.002 in the sample) not attributable to any listed message;
the cause is unverified. These are OpenCode-recorded costs, not invoices.

**Direct store queries (explicit bulk-aggregate fallback; the orchestrator's, not `@explore`'s).**
`~/.local/share/opencode/opencode.db` is a live WAL database (about 19 GB on this machine). The
OpenCode skill requires a backup before inspecting persistent data with external tools: take one
with SQLite's `.backup` into a directory with enough free space (`/tmp` may be too small; never copy
`.db`, `-wal` and `-shm` as separate files). If no space exists, say so and get the user's decision
before querying the live file. Query only as `sqlite3 -readonly <db> '<query>'` with predicates on
indexed columns (`session_id`, `parent_id`); never write it.
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

1. Fork `@explore` for Threads 1+2 with a self-contained prompt: working directory, the schema crib,
   the thread questions, and the output format. Validate crib first; surface any drift immediately.
   `@explore` is read-only by contract (its prompt, not its shell rules) and reads history through
   `opencode api session.list` and `opencode api session.message.list`: small pages, no mutating
   API operation. Have it report any access gap (the response too large to read, a denied command)
   rather than work around it; bulk SQLite queries are yours, under the store rules above. This
   grants reads of sensitive session history, not API mutations. Never write
   `.db`/`.db-wal`/`.db-shm`. Edit through the `opencode-config/` path; the symlinked config
   directory is the same files.
2. Run Thread 3 yourself. Produce a ranked candidate list (deletes, merges, cuts, permission edits)
   ranked by (simplicity impact) × (ease/safety).
3. Gate via Question tool (accept / defer / reject). Do not action before this step.
4. Dispatch `@build` to action accepted changes. It leaves the tree dirty; do NOT commit.
5. Commit: draft the full message, gate on user approval, then delegate to `@committer` with the
   approved text as `COMMIT MESSAGE (verbatim)`, the exact changed paths as `EXPECTED FILES`, the
   matching `STAGING MODE` (`strict` only when they are every dirty path, else `exact`), and
   `CO_AUTHOR` for the agents that actually produced the content (you for the approach, the forked
   `@build` for the edits; identity format in `AGENTS.md`; ask rather than invent). One commit per
   coherent change. Never push.
6. Put the rationale (what changed, why, alternatives weighed) in the commit bodies; add deferred or
   rejected-but-revisitable candidates to `IDEAS.md`. No separate changelog.
