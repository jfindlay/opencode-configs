# User-level agent hints

Framings and mental models consulted during normal work. Not rules in force — those are in
`AGENTS.md` and `AGENTS-REASONING.md`. Not changelog — that's in `AGENTS-LOG.md`. Not deep companion
to `AGENTS-REASONING.md` — that's in `AGENTS-REASONING-HINTS.md`. Treat entries here as "consult if
useful" navigational hints: they reduce friction and explain the derivation behind rules that are
stated elsewhere, but they do not themselves impose obligations. Load the section that is relevant
to the work at hand; you do not need to read this file front-to-back.

## Model routing by cost-of-wrong

Routing model reframes "what's the best model" as "what's the cost of this being wrong". The rule:

- **Generative frontier, interactive dialectic → T-1 (Fable 5).** Genesis of framings that don't
  yet exist, abduction, pivotal anomalies that resist all canonical options. The bar is not
  "intellectually interesting" — it is "the Fable-scale reserve changes the answer." ~3× Opus 4.8,
  ~14× Sonnet. Session count per week: very small.
- **Cost-of-wrong high, analytical → T0 (Opus 4.8).** Architectural tradeoffs, boundary design,
  cross-cutting audits, phase planning, commit-shape decisions. Session count per week: small.
- **Cost-of-wrong moderate → T1 (Sonnet 4.6).** Implementation, refactors, test writing,
  review-address cycles. ~95% of sessions.
- **Cost-of-wrong low, judgment required → T2 (Haiku or equivalent).** Classify these files, group
  these patterns, summarize this output.
- **Cost-of-wrong low, judgment mechanical → T3 (Kimi K2.5).** Count these items, extract this
  section, regex-and-report.

Upgrade or downgrade is not about task size. Large mechanical tasks stay at T3. Small architectural
decisions stay at T0. The signal is "if this is wrong, how much work is downstream?"

Cross-check T0 conclusions at phase boundaries with T0-alt (GPT-5 / Gemini 2.5 Pro): ask the alt
to steelman objections to the T0 plan. Different families catch different failure modes.

## Subagent prompt anatomy

The canonical template is in `AGENTS.md` §`### Subagent prompt template`. One anti-pattern to avoid:
forking a subagent whose prompt body starts with "Read file X and return…" — that's pure overhead;
the parent can Read directly. Rule: if the subagent does a single file read or a narrow grep, don't
fork.

## Capture-candidate collaboration shape

Why the tag-and-review shape rather than auto-preservation or silence:

1. Auto-writing would silently change files the user hasn't consented to, and would push the agent
   toward tag-inflation to appear productive — neither is aligned with the working relationship we
   want.
2. Silence (no flags) means insights die with the session. The tag is the minimal intervention that
   preserves optionality.
3. Keeping the preservation step deliberate means both parties contribute their distinct strengths:
   the agent notices patterns across large context; the user knows which patterns will matter
   downstream and in what wording they should survive.

See `AGENTS.md` §`## Capture-candidate tagging` for the operative two-stage criteria (shape-criteria
pre-filter + durable-AND-unusual-AND-not-bland three-axis gate).

## Fork-vs-stay: derivation table

`AGENTS.md` states the three-axis rule. The derivation that justifies it over the retired ≥20-calls
heuristic is preserved here for future restructuring decisions:

| Case | ≥20 calls said | Three-axis rule says | Correct |
|---|---|---|---|
| Long interactive test loop (50+ bash calls) | fork | stay (steering=YES) | stay |
| Single 3000-line config parse → 2-line finding | stay (<20 calls) | fork (pollution=YES) | fork |
| Architecture conversation spanning many turns | fork | stay (steering=YES) | stay |
| 20 independent finding cross-checks | fork | fork (parallel=YES) | fork |

The call-count rule correlated with pollution but lost on cases where steering should dominate. The
three-axis rule produces correct answers on all four cases above without losing accuracy on the
cases where they agreed.

**Tier is not chosen at fork time.** Subagents inherit the caller's model unless their own
frontmatter `model:` field overrides it. Forking an `@explore` subagent from an Opus primary runs
the subagent on Opus unless `explore.md` pins Sonnet. This makes prose tier guidance ("T1-subagent
for explores") unenforceable unless encoded in each subagent's definition.

## Commands can't scope permissions — only agents can

OpenCode slash commands are prompt templates with frontmatter for `template`, `description`,
`agent`, `subtask`, `model`. There is no `permission:` key on commands. Permission scopes live on
the global `opencode.json` or on agent definitions — nowhere else.

The instinct to create `/rebase` (or `/amend`, `/cherry-pick`, `/branch-cleanup`, etc.) "to attach
elevated git permissions to it" is the wrong shape. The command file will execute under whatever
agent is active, inheriting that agent's permissions. It cannot locally elevate.

**Correct pattern for workflow-specific elevated authority**:

1. Define a workflow-specific agent (`~/.config/opencode/agent/<workflow>.md`) with a scoped
   `permission:` block in frontmatter.
2. Define a command that sets `agent: <workflow>` to route into that agent.
3. The permission scope belongs to the agent; the command is just the entry point.

**Why this framing keeps recurring**: commands feel like the natural unit of workflow (they're what
the user invokes), so the instinct is to attach workflow properties to them. But permissions are a
safety boundary, and OpenCode designed that boundary at the agent layer so an agent's posture is
consistent across every way it's invoked — direct chat, command, subagent task. Attaching
permissions to commands would create invocation-path-dependent security, which is harder to reason
about.

**Related capture**: when designing any "elevated authority for one flow" pattern (rebase execution,
amend-heavy refactor, force-push-with-lease, `rm` authority for cleanup flows), start from the
agent, not the command. The command comes last, as the ergonomic entry point.

Counter-case worth noting: if the elevation is truly momentary (one bash invocation, approved
interactively), you don't need an agent — `"ask"` on the global config plus per-invocation approval
is fine. Agents are for repeated elevated work within one posture, not one-shot escapes.

### Addendum: agent-driven rebase execution strategy

Concrete strategy for `@git-editor` when executing a `/rebase-plan`-approved rebase. Load-bearing
for the rebase flow to work at all — without this, `git rebase -i` stalls on editor invocation.

**Default editor safety**: the `no-interactive-editor.js` plugin sets `EDITOR`, `GIT_EDITOR`,
`GIT_SEQUENCE_EDITOR`, `VISUAL`, and `PAGER` to `true`/`cat` for all bash invocations by default.
This covers the general case — bare `git commit`, `git merge`, pager hangs, etc. — across every
agent without any per-call setup.

The scripted-rebase `cp`-as-editor pattern below is the canonical **opt-in override** of that
default. When `@git-editor` sets `GIT_SEQUENCE_EDITOR="cp <tempfile>"` explicitly in a bash call,
the plugin's `??`-fallback respects the caller override. One mechanism, two modes: plugin handles
the 99% default case; `cp` override handles the scripted-rebase case.

**The hazard**: `git rebase -i` invokes `$GIT_SEQUENCE_EDITOR` for the todo list, and `$GIT_EDITOR`
for every `reword` and `squash` message. An agent driving rebase autonomously has no editor to
    offer, so any directive that triggers `$GIT_EDITOR` stalls the flow.

**The strategy — "edit-everywhere + --amend -m"**:

1. The plan command (`/rebase-plan`) emits only `pick` and `edit` directives. Never `reword`,
   `squash`, or `fixup`. Every directive that would open `$GIT_EDITOR` is replaced by `edit`.
2. The agent writes the approved todo list to a tempfile, then invokes: `GIT_SEQUENCE_EDITOR="cp
   <tempfile>" git rebase -i <base>`. The `cp` command acts as the "editor" — it overwrites git's
   template todo with our approved list in one shot. This overrides the plugin's default
   `GIT_SEQUENCE_EDITOR=true`.
3. Each `edit` stop pauses rebase in one of two structurally different states. **Clean stop**:
   commit applied, index clean, `HEAD` *is* the commit on the current `edit` line. **Conflict
   stop**: commit not applied, index has unmerged paths, `HEAD` is the *predecessor* of the current
   line. The agent must run `git status` to classify before dispatching — the combine procedure
   differs by one commit between the two states, and getting it wrong silently drops a commit.
4. On a clean stop, the agent applies the approved message explicitly via `git commit --amend -m
   "<title>" -m "<body>"`, then `git rebase --continue`. For squash-equivalents (combine into
   predecessor), the plan emits `edit` on the *second* commit; at that clean stop the agent runs
   `git reset --soft HEAD~1` to move `HEAD` back to the predecessor with the second commit's changes
   staged, then `git commit --amend -m "<combined message>"`, then `--continue`.
5. On a conflict stop, the agent stops and surfaces for user guidance — conflict resolution is not
   autonomous. After the user resolves, the procedure is `git add <files>` then either `git rebase
   --continue` (preserves the conflicting commit's identity) or `git commit --amend -m "<combined
   message>"` followed by `git rebase --skip` (combines the conflicting commit into `HEAD =
   predecessor`). **Never run `reset --soft HEAD~1` on the conflict path** — `HEAD` is already the
   predecessor; resetting further would drop a commit.
6. `$GIT_EDITOR` is never set and never needed. Any editor invocation during execution is a bug to
   surface, not to work around.

**Why this over alternatives**:

- `GIT_SEQUENCE_EDITOR=true` (the plugin default) exits 0 immediately and tells git "proceed with
  the auto-generated todo unchanged." For a plain rebase that's fine. For a scripted rebase that's
  wrong — the approved plan never gets installed. That's why the `cp` override is necessary.
- `GIT_EDITOR="cp <message-file>"` per step works but requires per-step env plumbing and pre-writing
  every message. Brittle coordination.
- Cherry-pick sequence (no `rebase -i` at all) is the viable fallback if `cp`-as-editor turns out to
  have a snag. Every commit via explicit cherry-pick plus `--amend -m`. More commands,
  better-localised failure modes.

The `cp`-as-editor pattern has been verified in practice; cherry-pick sequence is the fallback if
it snags.

## Rebase autosquash `--ours` conflict resolution cross-contaminates commits

When `git rebase --autosquash` hits conflicts and the agent resolves them with `--ours` (or
`--theirs`) wholesale rather than file-by-file, the conflict resolution pulls content from the wrong
side of the merge into the base commit. Symptom: content disappears from one commit and duplicates
accumulate across subsequent commits. Three successive rebase attempts can fail the same way before
the pattern is recognised.

Recovery pattern: abandon autosquash, reset to the pre-rebase correct tip, and rebuild the basis
commits from scratch by staging correct content in logical groups. Faster and more reliable than
iterating on conflict resolution once cross-contamination has started.

Preventive rule: never use `--ours`/`--theirs` blindly during an autosquash. Inspect each conflict;
if the correct resolution isn't obvious, stop and ask. The `@build` prompt for fixup-heavy work
should include this constraint explicitly.

## OpenCode permission patterns match the entire command string

OpenCode's `bash` permission patterns are matched against the **full command string** the model
emits, not against the leading executable or any sub-command. Two consequences worth internalising:

1. **Env-var-prefixed commands need their own pattern.** A call like `GIT_SEQUENCE_EDITOR="cp
   /tmp/x" git rebase -i <base>` does NOT match an allow rule of `"git rebase -i *"` — the string
   doesn't start with `git`. It needs an explicit `"GIT_SEQUENCE_EDITOR=* git rebase -i *"` rule.
   Same applies to any command that prefixes an env assignment, and to `env VAR=val cmd` forms.

2. **Compound commands match as one string.** `git log --oneline && echo "---" && git branch
   --show-current` does NOT match `"git log *"` — the pattern engine sees the whole chained string.
   This behaves like a feature, not a bug: it prevents an allow rule from being tunneled through an
   `&&`. But it means the model must emit each command as its own bash call. AGENTS.md's
   "Parallelize independent calls" rule already covers the preferred fix — issue separate tool calls
   — but diagnostically it's useful to know that compound-string mismatches are the mechanism behind
   what looks like "my allow rule isn't working."

**How the session surfaced this**: user reported that "rebase agent still prompts for permissions
granted in frontmatter." Bisect on a throwaway repo showed: simple agent-unique allowlisted commands
ran cleanly without prompting (so the merge semantics were fine); the prompts were triggered by (a)
a chained `git log ... && echo ... && git branch ...` call that no allow pattern covered, and (b)
the env-var-prefix form of `git rebase -i`. Both are pattern-match gaps, not permission-engine bugs.

## Agent prompt body as activation-time rule enforcement

AGENTS.md rules fire reliably for agents that have an explicit prompt body and do not fire reliably
for agents that lack one. Evidence: @rebase (has body) showed zero `cd X && cmd` violations across
the full session corpus; the default build agent (no body, only a permission override) showed
249/249 violations of the same rules. Same ruleset, different compliance — the body is the mechanism
that makes rules fire at activation time.

Diagnostic use: if a new antipattern recurs despite being in AGENTS.md, the first question to ask is
"does the relevant agent have an explicit prompt body?" If not, add one that restates the rule. This
is cheaper and more targeted than editing AGENTS.md (which already has the rule).

## The detective archetype: pointer to AGENTS-REASONING-HINTS.md

Three modes of inference (eliminative, generalizing, abductive) match different fact-pattern
signatures. The abductive mode — positing a candidate outside the canonical set — is the one agents
execute worst by default and the one that demands deliberate decomposition rather than reflex. Full
treatment lives in `AGENTS-REASONING-HINTS.md` including the Dupin/Purloined-Letter walkthrough and
the four-step decomposition. Pull it when: every canonical candidate fails to explain a pivotal
fact, or you suspect the option set itself is a vocabulary artifact rather than the problem's
geometry.

## Structural fixes beat prompt-level reminders for high-cost failure modes

Two failure modes from the salt-project sessions:

1. `cd X && cmd` antipattern — 249/249 bash calls; `workdir` never used.
2. Interactive editor hangs — multiple occurrences in `@build` and `@general` over ~150h; zero
   evidence in the stored session corpus (corpus is lossy; user observation wins).

**The pattern**: AGENTS.md rules fired reliably for `@rebase` (which has an explicit prompt body)
and did NOT fire reliably for the default build agent (which had no prompt body — only a permission
override in `opencode.json`). Same rules, different compliance, because the rules were only
activated at the agent level for one of the two.

**The interventions and their layer**:

| Failure mode | Layer | Intervention |
|---|---|---|
| `cd X && cmd` | Agent prompt | `agent/build.md` restates the `workdir` rule at activation time |
| `sed -i` for edits | Agent prompt | `agent/build.md` restates the `Edit` tool rule |
| Interactive editor hangs | Plugin hook | `no-interactive-editor.js` sets env defaults structurally |

**The principle**: for a failure mode where (a) the cost of occurrence is high (kills the session,
dirties the tree, loses context) AND (b) the LLM must remember something at every relevant call site
to prevent it, use a structural fix — a plugin hook, a denylist, a permission rule — not a prompt
reminder. Low-cost failures can live with prompt-level reminders; high-cost ones need a layer that
doesn't rely on LLM memory.

## Auditing prior sessions: storage is lossy, use SQLite

When auditing user instructions or agent behaviour across prior sessions, the file-based storage
tree is insufficient. `~/.local/share/opencode/storage/part/` ages out, prunes on version upgrades,
and doesn't capture all tool-call shapes — a bash command that hung and was killed may have a
different JSON shape from one that returned normally, causing `"command":"<pattern>"` greps to miss
it. Project-scoped session dirs only cover work done in that project root; sessions started
elsewhere live under `global/` with different retention.

The TUI's SQLite DB at `~/.local/share/opencode/opencode.db` retains all sessions accessible via the
TUI. Pattern for auditing user instructions: join `part` + `message` + `session`, filter
`json_extract(m.data,'$.role')='user'` and `json_extract(p.data,'$.type')='text'`, and select
`json_extract(p.data,'$.text')` for the message content.

The storage tree is sufficient for confirming **presence** of patterns; it is NOT sufficient for
confirming **absence**. If the user reports a behaviour and the grep finds nothing, believe the
user.

## Nested subagent dispatches can hang on permission prompts

When a subagent (forked via the Task tool) raises a permission prompt for a tool call not covered by
its frontmatter allowlist, the approval dialog may not route cleanly up through the nesting back to
the user. The inner agent waits for approval; the outer agent waits for the inner agent; the user
sees neither. Hypothesis unconfirmed — root cause may be nesting-specific or a broader permission
routing issue.

**Workaround**: in the inner subagent's prompt, explicitly instruct it to stop-and-report on any
blocking approval rather than wait. Canonical clause: *"IMPORTANT: if you encounter ANY permission
prompt that would block execution, stop immediately and return what you have so far with a clear
note describing the blocked tool call."* This converts the hang into a visible partial-success with
diagnostic.

**Practical implication**: if you need to verify an agent's behaviour, prefer a direct fork from a
clean primary session over nested forking. If nested forking is load-bearing, ensure the inner
agent's allowlist covers every tool call it will make AND include the stop-and-report clause as a
safety net.

Fact pattern is thin — two hangs in one day. Revise if the same failure appears in non-nested
dispatches (rules out nesting as the cause) or a confirmed root cause lands in the opencode tracker.

## Discoveries log: the operational mechanism for two-frame relativity

In long-arc projects, the discoveries log (a section in the roadmap for action-frame findings that
affect the static frame) is the operational mechanism that prevents both defocus and rigidity.
Discoveries internal to a sub-track (e.g., "we need a different algorithm variant") can wait until
the sub-track boundary for evaluation. Discoveries that affect cross-track contracts (e.g., "the
substrate session got the interface wrong") deserve immediate static-frame review via a small Opus
session. The discipline: the project's narrative document (PEDAGOGY.md or equivalent) is where the
two frames meet — re-reading it at sub-track boundaries is the practice that catches both defocus
and rigidity. "The plan was wrong about X" is a successful outcome of a session, not a failure.

Full treatment of the two-frame relativity (static roadmap-view vs. action riding-the-wave-view)
lives in `multisession/multi-session-planning.md` in the opencode-config repo; this hint is the
operational handle.

## Refactor ordering: doc, code, tests

When a multi-phase cleanup includes both deduplicating/improving docs and splitting long functions
or refactoring code structure, do the doc pass first, the app code next, and finally the test code.
Carrying duplicated or bloated docstrings into a refactor doubles the cleanup cost — the docs pass
establishes the quality bar that the refactor maintains. Reverse order (refactor first, docs second)
means re-writing docstrings twice: once to match the old structure, then again to match the new one.
Finally, test code is downstream of both and can be refactored and rescoped once after the others
are done.

## Command `agent:` frontmatter means "run AS", not "dispatch TO"

2026-06-01: If OpenCode decides (via an unknown mechanism), a command's `agent:` is a `mode:
subagent`, OpenCode appends an auto-dispatch directive ("call the task tool with subagent: <X>") to
the rendered prompt.  This must be preempted by defensively specifying the `agent: `, for example,
`plan` in the frontmatter.

## Engineering as the quantification of error; the fiduciary-latitude contract

2026-06-06: User acceptance of a sharded PLAN — expressed mechanically by invoking `/run-plan
docs/PLAN.md` — is acceptance of the entire implementation path-space the enrolled agents judge best,
not a line-item contract to be executed literally. Each agent is empowered to make the best possible
choice among a heterogeneous set of constraints (business demands, technical constraints, resource
budget); this is the foundational work of engineering itself — to wright legibility, durability, and
stability out of natural resources: a Chesterton fence here, a gauge on noise there, a map of the
approximately-linear region within a fantastically contradictory reality. Engineering is
epistemologically the quantification of error. The operational consequence for `/run-plan`: agents
hold fiduciary latitude under fidelity to the PLAN, so deviation (even medium deviation, with
commensurate evidence) rides through and is reported at the step-3 review; halts are reserved for the
irreconcilable — something incredibly wrong that the agent cannot reconcile against the PLAN's
provisions, anticipations, or quantifications. This is the premise that motivates the whole
discovery-and-adjustment apparatus and the juncture adjudication. See
`multisession/multi-session-planning.md` and `command/run-plan.md` for the mechanics.
