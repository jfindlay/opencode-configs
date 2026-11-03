# NOTES — opencode-config

Rolling-context findings and framings for this repository. Durable cross-project hints graduate to
`AGENTS-HINTS.md` only via `/note` or `/session-end` with per-item approval.

## V2 permission investigation closed; patch integrated (2026-11-03)

Authoritative sources: `~/Source/opencode-permtest/docs/FINDINGS.md` (evidence classes, patch
description), the closing ledger in that repository's `docs/PLAN.md`, and this repository's
`PLAN.md` V2 verification section. Every claim below carries its engine version and label.

- **Integrated.** Commit `a2f02d3` removed the nine agent `temperature` fields and the three
  `~/.config/opencode/**` edit denies (global, `architect`, `build`). Those denies no longer exist:
  `build` allows `edit *` and can edit the live config directory without a prompt; `architect` and a
  subagent forked from `build` fall to ask. Removal was an owner decision; no probe measured it.
- **Confirmed on 2.2.5 by attempted call.** Rule order is defaults, global, project, agent (last
  match wins within a layer). A forked subagent evaluates defaults, global, project, then its own
  rules; its parent's rules are not consulted (markdown parent/child, signature D,A,D,A in shell and
  edit forms). A subagent with no edit rule of its own got the global `edit * ask` even when forked
  from `build` (`edit * allow`). `committer` `git push` is denied. Obsolete `temperature` is ignored
  with a warning and the agent's `permissions` are enforced (4 of 4 cells).
- **Verified from loaded config only (not a refused call).** `committer` edit/webfetch,
  `session-scan`, `verify`, `explore` edit denies: the engine's merged rule list ends in the deny and
  no forbidden call was made in 36 runs (one call, answered "no tool named write"). Parent agent
  rules are not child rules; this does not generalize to every session-scoped API override.
- **2.0.32 only, not reproduced on 2.2.5.** `temperature` beside `permissions:` disabled the list
  (4 of 4); a saved approval upgraded a configured `ask` to allow.
- **Unmeasured on any version.** A configured `deny` versus a saved allow (no new claim either
  way); shell writes past an `edit` deny (inferred only); `top_p`, `tools`, `permission`, `name`.
- **Original incident (inferred, not proven).** `committer`/`session-scan` performed effects their
  denies forbade on 2.0.32; the leading explanation is `temperature` disabling their rules plus a
  granted ask (human or saved approval). The reported duplicate `agents.committer` deny, no longer
  inspectable, would not be explained by `temperature`. Nothing measured settles this.
- **Config reads.** Plain `opencode debug config|agents` reads the background service's cached
  config; `--standalone` gives a fresh parse (reported by the patch session; not re-measured here).

## Retrospective data access on 2.2.5 (verified 2026-11-03)

Question: do `commands/config-retrospective.md`'s store assumptions hold? The V1 crib did not: the
current tables are `session_v2`/`session_message`, and its permission and override claims were stale.
The command now carries the V2 recipe; this is the evidence and its limits.

- **Method.** `opencode api session.list|session.message.list` (stdout redirected to a file; piping
  a large response truncated it), compared with `sqlite3 -readonly` queries on the live store. No
  backup was made: the store is about 19 GB, `/tmp` is a 7.7 GB tmpfs and the root disk is 92% full.
  Only bounded, read-only queries ran; nothing was written, repaired or copied. SQLite `.backup`
  was not exercised. Scratch output (transcript content) was deleted afterwards.
- **Agreement.** For the 100 newest sessions (51 forked children, 49 top-level): agent, parent,
  model id, cost, created/updated times, assistant-message cost sums, and per-(status, error type)
  tool-call counts matched between API and store with zero mismatches. `session.list parentID=<id>`
  matched the store's child count and summed cost for 12 roots.
- **Linkage.** Of 62 `subagent` calls in those sessions, 60 carried `state.metadata.sessionID`
  (the others: one still running, one errored without metadata); all 54 whose child was in the
  window had `parentID` equal to the calling session.
- **Outcomes (150 newest sessions, 919 tool calls).** 885 completed, 32 error, 2 running (live).
  Errors: 27 `permission.rejected` (24 "Permission denied: shell", 3 non-interactive reject) and 5
  `tool.execution`. The two `permission.rejected` texts match the 2.2.5 harness calibration
  (configured deny versus an ask nobody could answer); a human Reject's text was not observed.
- **Cost.** Forked children: assistant-message sum equals `session.cost` (74 of 74). Top-level
  sessions: `session.cost` exceeds that sum by $0.00002–$0.00192 (76 of 76); cause unverified.
- **Permission-event visibility.** No decision history: `permission` holds 230 project-scoped saved
  approvals (shell 189, external_directory 32, edit 6, websearch 3), `event` has 0 rows, the
  durable session log returned only a sync marker, pending-request lists were empty, and
  `session_v2.permission` is NULL in all 3,746 sessions. Legacy `session.permission` is set on 2,682
  sessions created before 2026-10-17.
- **Coverage limits.** `session_v2` also holds all 3,166 sessions created before 2026-10-16, each
  with V2 and legacy messages. Not checked: V1 `aborted` outcomes in V2, archived sessions (none
  exist), whether V2 reproduces historical pilot figures, ordering for `order=asc`.

## Open migration items (owner / gate)

- **Narrower edit policy for `build` (owner: user).** Intent recorded 2026-11-03: general `@build`
  agents should not have uncontrolled write access to `~/.config/opencode` or
  `~/Source/opencode-config/`. The applied patch does the opposite. Gate: a separate owner-approved
  change. Measure first whether an `edit ~/.config/opencode/**` deny matches the canonical repo path
  through the symlink (never measured; the row was dropped when the patch decision removed the deny)
  and how a saved allow interacts with a deny (unmeasured).
- **Real V2 plugin delivery (owner: `@build`; gate: fresh user authorization and spend bound).**
  Tracked in `PLAN.md`; also whether edits through the symlinked config directory reload plugins
  automatically (documented for watched directories, unmeasured through a symlink).
- **Upstream report for the 2.0.32 `temperature` behavior (owner: user).** Dropped at the study's
  re-scope; file through the `report` skill only if wanted. Not a migration prerequisite.
- **Optional hardening, deferred (owner: user; no gate until requested).** Shell restrictions for
  read-only agents (edit deny does not cover shell writes), `general`'s edit policy, environment-file
  read policy, obsolete no-op rules (`lsp`, `list`, `todoread`, `todowrite` produced no load warning
  on 2.2.5; left in place), and sampling settings (`top_p` untested; V2 docs said request sampling
  settings were not sent to the model; not rechecked on 2.2.5).
- **`AGENTS-HINTS.md` corrections (owner: user; gate: per-item `/note` or `/session-end`
  approval; this file was not edited).** Conflicting active guidance, so it stays a closeout
  exception until approved:
  1. "Auditing prior sessions" (the `part`+`message`+`session` join filtered on `$.role`) describes
     the V1 layout. Proposed: for sessions after 2026-10-16 read user prompts with
     `select json_extract(data,'$.text') from session_message where type='user' and session_id=?`
     (verified: user rows carry `$.text`, no `$.role`); keep the old join labelled V1-only; point to
     `commands/config-retrospective.md` for the verified recipe.
  2. Lines 348, 355 and 361 name `/run-plan` and `commands/run-plan.md`; the command is
     `plan-run` (pre-existing naming drift found during the V2 migration).

## Large-write requests correlate with long tool spans (corrected 2026-09-28)

Confirmed in the combined rDLP ALIGN execution/status-check cohort: 71 of 902 completed requests
had cache writes ≥30,000 tokens and cache reads <5,000. Those requests accounted for $19.72 of
$44.67 recorded cost; 66 followed an assistant turn containing a tool span of at least five minutes.
The exact cohort, grouping method, and corrected role totals are in `PLAN.md` → Pilot results.

Inference: cache expiry plausibly makes large-context sessions sensitive to waits. Neither historical
TTL settings nor provider eviction decisions were verified. Recorded tool spans mix possible approval
latency, execution, and other blocking. Whole-request cost is not cache-write cost alone, avoidable
waste, or a savings estimate. The previous universal claim about every five-minute wait was too strong.

Design implication: measure context size and cache behavior alongside request count; retain required
checks and human approval participation. Compare equivalent workloads before prescribing shorter
driver sessions or longer cache TTL. The pilot did not measure improvements in reasoning quality.
