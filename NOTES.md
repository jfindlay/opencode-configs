# NOTES — opencode-config

Rolling-context findings and framings for this repository. Durable cross-project hints graduate to
`AGENTS-HINTS.md` only via `/note` or `/session-end` with per-item approval.

## V2 permission investigation closed; patch integrated (2026-11-03)

Authoritative sources: `~/Source/opencode-permtest/docs/FINDINGS.md` (evidence classes, patch
description) and the closing ledger in that repository's `docs/PLAN.md`. That repository is frozen
(chain complete) but kept as the harness for the unmeasured items below; its history exists only
there. Every claim below carries its engine version and label.

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
  a large response truncated it; small pages piped fine, and a full response the shell tool retained
  itself parsed — the 2026-11-07 recipe in the command avoids redirects), compared with `sqlite3
  -readonly` queries on the live store. No
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

## Plugin host contract and live acceptance on 2.2.5 (2026-11-03/05)

Tuple: CLI, shared service and private server 2.2.5; managed `@opencode/plugin` 2.0.32, so its
types lag the host and behavior below comes from the 2.2.5 binary's embedded source or private-server
observation. Full record: `git show 2f95079:PLAN.md` ("Verified plugin adapter contract", "Live
acceptance"); that file and the closeout plan were retired after this commit.

- **Design invariants (session economics).** Advisory only: no abort, prompt injection, context
  rewrite or budget enforcement. Default `observe`; capacity unavailable until the V2 usable-context
  formula is verified; thresholds ($5 / 100 steps) are provisional and untuned.
- **Tool hook (host source).** `tool.execute.after` gets `{tool, sessionID, agent, messageID, id,
  input, status, result | error}` with `result = {output?, content, metadata?}`; an assigned
  `event.result` is what the host persists. `content` is model-visible; `output` (structured) is the
  fallback text only while `content` is empty. Adapters read IDs from `output`, write to `content`.
- **`subagent` result.** `output = {sessionID, status: "completed" | "running", output}`, `metadata =
  {sessionID, status}`; `output.sessionID` is primary, `metadata.sessionID` a consistent fallback.
  A background launch and a foreground call moved to the background both return `running`; neither
  is a completion. Other key spellings in `extractChildSessionID` are unevidenced but harmless.
- **Event envelopes (observed).** `{id, created, type, durable: {aggregateID, seq, version},
  location?, data}`. `session.created` carries location; `session.deleted` (`data = {sessionID}`),
  `session.agent.selected`, `session.execution.*` and `session.usage.updated` do not.
  `session.step.ended` carried an envelope location on the public `/api/event` stream, contradicting
  the host-source inference; the in-process envelope was not captured. The adapter verifies location
  at enrolment (`session.created` or `session.get`) and accepts either shape afterwards.
- **Reload.** A plugin file edit in a watched directory replaced the generation (second
  `initialized`, no duplicated work). A symlinked config directory is not watched: the server logs
  `inotify_add_watch ... Not a directory` for it (measured 2026-11-05 on an isolated mimic of the
  layout). After plugin or config edits confirm `plugin.list` shows `active` and the new behavior;
  reload or restart the service if it does not.
- **Live acceptance (one bounded run; $0.0042 of a $2.00 authorization; Haiku only).** Observed:
  both plugins active; observe/advisory initialization; editor hook environment; a foreground worker
  report with verified child ID and non-null cost/steps; no report for the background control;
  notices persisted once each with an image attachment preserved. Reconciliation matched finalized
  API records within the disclosed in-flight coverage. The run used a config narrower than
  production (`instructions` emptied, non-Anthropic providers denied, titles off) and disposable low
  thresholds. Compatibility only: no savings or permission claim. Further paid runs need fresh
  authorization.

## Shell policy simplified (2026-11-08)

Rationale and change list: `AGENTS-LOG.md` (2026-11-08). Open follow-ups, none measured:

- Reload the shared service (`location.reload`, or restart) so the symlinked `opencode.json` and
  agent files take effect; until then the old rules (including `cat`/`sed` denies) still apply.
- Check per-agent rule evaluation (`permission.create`, no model call) for `explore`, `committer`,
  `git-editor`: expected `git push` deny everywhere, `git commit` allowed only in `committer` and
  `git-editor`, ask elsewhere.
- Scanner behavior for `$(...)`, backticks, subshells, heredocs is unmeasured; scanner errors are
  not fixable by rules.
- External-directory checks (`external_directory * ask`) still apply to shell paths outside the
  project, e.g. `/tmp`; not changed here.
- If prompt-layer drift (`cat`/`grep` for file reads) returns, measure it before restoring any deny.

## Open items (owner / gate)

- **`build` edit policy for the config directory: applied as `ask`, three limits open (owner:
  user).** Applied 2026-11-05 in `opencode.json` (`agents.build`): `edit ask` on
  `~/.config/opencode/**` and `~/Source/opencode-config/**` after `edit * allow`. Measured on 2.2.5
  (`opencode-permtest/docs/FINDINGS.md`, "Path matching, saved approvals and shell redirects"):
  a path rule matches only the spelling it names (no symlink resolution), so both spellings are
  listed. Limits:
  - Editing this repository while it is the project is not covered: in-project files are matched as
    project-relative paths, and project-layer rules did not reach `build`.
  - `ask` is undone by a saved `edit *` allow in a project; a config `deny` is not. Switching the two
    rules to `deny` makes the restriction durable but blocks `build` there outright.
  - The running service reads the symlinked config directory through no file watcher (the server
    logs an inotify failure); reload or restart it for the edit to take effect.
- **Plugin delivery: smoke-tested once (2026-11-05), residual risks open (owner: `@build`; gate:
  fresh user authorization and spend bound for any further paid run).** Record in "Plugin host
  contract and live acceptance" above. Residual risks:
  - The task-boundary report omits the child's final step (its `step.ended` arrives milliseconds
    after the hook) in both observed runs; the label discloses it, but any consumer comparing the
    report to a finalized total will see a deficit of about the last step.
  - After a config-only reload the plugins logged `loading plugin` but no new `initialized` line;
    whether the economics hooks were re-registered in that generation is unestablished (a file
    reload did re-initialize).
  - Notices print sub-cent costs as `$0.00`; low-cost workers will not show meaningful cost in the
    text.
  - Edits through the symlinked config directory reloading plugins stayed unmeasured (the probe
    edited a real disposable directory); the shared service was not restarted.
  - Not exercised: foreground-moved-to-background, production-threshold crossings, other-location
    isolation, worker roles other than `general`, long or nested workloads, savings.
  - A V2 private server needs a credential connected through its API; an `auth.json` copy alone
    gave `provider.no-route`.
- **Upstream report for the 2.0.32 `temperature` behavior (owner: user).** Dropped at the study's
  re-scope; file through the `report` skill only if wanted. Not a migration prerequisite.
- **Optional hardening: applied 2026-11-05, verified by rule evaluation only (owner: user).**
  Verified per agent with `permission.create` evaluation (no model call), not by live tool calls:
  - Environment files: `read *.env`, `*.env.*` ask and `*.env.example` allow restored after the
    global `read * allow` that had overridden the engine defaults.
  - `explore`, `verify`, `session-scan`, `general`: shell allowlists and redirect rules applied
    here were removed 2026-11-08 (see "Shell policy simplified" below); `general` keeps its explicit
    `edit * ask`.
  - Removed no-op rules: global `list`, `lsp`, `todoread`, `todowrite`, and `committer`'s
    `todowrite` deny.
  - Sampling: `top_p` and `temperature` in an agent file are ignored with a warning; the V2 agent
    schema has no sampling key. Left unset. `request.body` is accepted; that it reaches the provider
    is unmeasured.
  Still open: the `grep`/`glob` tools were not given an env-file rule. (The redirect and
  `git branch`/`git reflog` items are moot after the 2026-11-08 simplification: those allows no
  longer exist and shell is not treated as containment.)

## Large-write requests correlate with long tool spans (corrected 2026-09-28)

Confirmed in the combined rDLP ALIGN execution/status-check cohort: 71 of 902 completed requests
had cache writes ≥30,000 tokens and cache reads <5,000. Those requests accounted for $19.72 of
$44.67 recorded cost; 66 followed an assistant turn containing a tool span of at least five minutes.
Cohort root IDs and baseline totals are in `IDEAS.md` (economics report entry); the grouping method
and per-role totals are in `git show 2f95079:PLAN.md` → "Pilot results".

Inference: cache expiry plausibly makes large-context sessions sensitive to waits. Neither historical
TTL settings nor provider eviction decisions were verified. Recorded tool spans mix possible approval
latency, execution, and other blocking. Whole-request cost is not cache-write cost alone, avoidable
waste, or a savings estimate. The previous universal claim about every five-minute wait was too strong.

Design implication: measure context size and cache behavior alongside request count; retain required
checks and human approval participation. Compare equivalent workloads before prescribing shorter
driver sessions or longer cache TTL. The pilot did not measure improvements in reasoning quality.
