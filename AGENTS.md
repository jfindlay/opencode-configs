# Personal Working Style

This file holds universal, transactional conventions — mechanical rules that apply to every agent
regardless of tier. Tool discipline, subagent mechanics, model tiering, session discipline,
formatting, and git conventions all live here.

**Reasoning-register rules live elsewhere.** Capability allocation, option space, and response scale
are rules for primary agents (T0/T1) and judgment-bearing subagents (T1); modes of inference and the
four-step abductive decomposition are targetd to T0-only.

**Motivation that is not self-evident.** When making a change whose motivation isn't obvious from
the immediate context, explain the reasoning before implementing — understanding the why is part of
the work.

## OpenCode config files

The authoritative source is the `opencode-config/` git repo. `~/.config/opencode/` is a
**symlink** to that repo, so edits are live immediately — no apply step. Use `/update-config`
for routed edits (it handles the correct repo path and commits). Runtime artifacts (`bun.lock`,
`package.json`, `node_modules/`, etc.) are managed by OpenCode itself and must NOT be committed
to the repo — they exist only at the symlink target and are covered by `.gitignore`.

## Model tier hierarchy

- **T0 — Claude Opus 4.7**: deep exploration, architectural tradeoff analysis, boundary design,
  cross-cutting audits. Use when the cost of being wrong is high.
- **T0-alt — GPT-5.5 / Gemini 3.1 Pro** (as available): cross-check T0 conclusions at phase
  boundaries. Different families catch different failure modes.
- **T1 — Claude Sonnet 4.6**: default for implementation, refactors, tests, docstring work,
  review-address cycles. ~95% of sessions.
- **T1-subagent — Sonnet 4.6**: default for exploration and verification forks (`@explore`,
  `@verify`). Tier is baked into each subagent's frontmatter `model:` field — subagents
  inherit the caller's model otherwise, so pinning is mandatory to honour the tier ladder.
- **T2 — Haiku 4.5**: subagents with low judgment load (classify, scan, group by shape).
  `@session-scan` is pinned here.
- **T3 — Kimi K2.5 or equivalent**: pure mechanical extraction/counting. Create subagents on demand;
  none pre-built.

Default to T1. Escalate to T0 only when cost-of-wrong is high; downgrade to T2/T3 for mechanical
subagents. Never rely on prose guidance alone — encode tier in each subagent's `model:` frontmatter
field.

## Document loading rules

This file (AGENTS.md) is auto-loaded by every agent. Other files in the user-level agent
infrastructure are on-demand. **Load liberally** — when a trigger is ambiguous, load the file. The
cost of loading when not needed is small; the cost of failing to load when needed is large.

The "Tier" column gates loading by agent tier: T2/T3 mechanical agents skip files they don't have
the judgment register for. T0/T1 agents follow the trigger directly.

| Document                  | Load when…                                                | Tier  |
|---------------------------|-----------------------------------------------------------|-------|
| AGENTS.md                 | Always (auto-loaded; this file)                           | All   |
| AGENTS-REASONING.md       | Always at session start                                   | T0/T1 |
| AGENTS-REASONING-HINTS.md | At any impasse; before delicate uncertainty resolution;   | T0    |
|                           | when an anomaly resists the canonical option set          |       |
| AGENTS-HINTS.md           | When reaching for a referential framing; when a captured  | T0/T1 |
|                           | hint might apply; when AGENTS.md or REASONING points to   |       |
|                           | a specific section in HINTS                               |       |
| STYLE-CODE.md             | Before writing or modifying any code; before reviewing    | T0/T1 |
|                           | code; when planning a refactor                            |       |
| STYLE-DOC.md              | Before writing, editing, auditing, or restructuring any   | T0/T1 |
|                           | documentation (inline docstrings, human docs, agent docs) |       |
| STYLE-TEST.md             | Before writing or modifying any test code; before         | T0/T1 |
|                           | reviewing tests; when planning a test refactor            |       |
| AGENTS-LENSES.md          | When reaching for a code-reasoning lens at the prompt     | T0/T1 |
|                           | level; for design rules and per-lens reference, see       |       |
|                           | composable-code-lenses/docs/                              |       |
| `python-lenses` skill     | When doing a Python code-analysis investigation; when the | T0/T1 |
|                           | user names a lens explicitly; when choosing among AST,    |       |
|                           | import-graph, call-graph, coverage, or test analysis      |       |
| AGENTS-LOG.md             | During meta-restructuring sessions only (config audits,   | T0    |
|                           | doc reorganisations)                                      |       |
| multi-session-planning.md | When planning or executing long-arc multi-session work    | T0    |
|                           | (the two-frame model, commit-shaped session, contract     |       |
|                           | taxonomy); before/during a /run-plan chain                |       |

## Subagent strategy (sideways allocation)

Forking a subagent is sideways capability allocation: spending a fresh context's budget on a
specific load-bearing question while preserving the caller's context for the decision the question
serves. The three-axis test below is the tactical implementation of that allocation. Violating it
wastes budget (forking when steering is needed) or pollutes context (not forking when pollution
would drown the caller).

Fork a subagent when **context pollution OR parallelizability is YES, AND steering is NO**:

- **Context pollution**: will the intermediate tool output (reads, greps, bash output) be large AND
  irrelevant to subsequent work in the caller's context?
- **Parallelizability**: is the work embarrassingly decomposable into independent chunks?
- **Steering**: does the work require turn-by-turn judgment from the caller or user mid-task? If
  yes, never fork — subagents return once and lose the steering loop.

Do NOT fork for:
- A single file read or targeted Grep.
- Any loop that reacts to intermediate results (test loops, format loops, interactive debugging) —
  these require turn-by-turn steering.
- Work that will continue with edits immediately after — context is lost anyway.

See `AGENTS-HINTS.md` for the derivation of the three-axis rule.

### Agent roster

**Primary agents** (invoked by `@name` or set as startup agent):
- `@plan-deep` — T0/Opus 4.7. Deep exploration, architectural tradeoffs, cross-cutting audits.
  Rolling-context writes allowed; all other writes require user approval. References
  `AGENTS-REASONING.md` in full including the T0-only section. Also forkable as a subagent —
  see Subagents below.
- `@build` — T1/Sonnet 4.6. Default implementation: coding, refactors, test fixes, review-address
  cycles. References `AGENTS-REASONING.md` up to the T0-only marker.
- `@plan-admin` — T1/Sonnet 4.6. Autonomous-chain driver for `/run-plan`. Runs the mechanical
  loop (select, dispatch, gate, commit, ledger); pages a forked `@plan-deep` only at the three T0
  junctures (inflection design, discovery adjudication, sub-track boundary). Never implements;
  never adjudicates discoveries itself.
- `@git-editor` — T1/Sonnet 4.6. General git work: rebases, commits, cherry-picks, amends,
  branch/tag cleanup. Elevated git permissions; rewrites local history only and never pushes. For
  narrative-arc rebase work, paired with `/rebase-plan` which carries both the planning steps and
  the execution playbook.

**Subagents** (forked via the Task tool):
- `@plan-deep` — T0/Opus 4.7. Also listed under Primary agents. When forked by `@plan-admin`,
  acts as a juncture adjudicator: inflection-point interface design, discovery adjudication (does
  this finding invalidate a frozen downstream contract?), and sub-track boundary coordinate-transform.
  One-shot return; does not implement; writes only to PLAN's `## Cross-session contracts` on
  inflection design. See `agent/plan-deep.md` §"When forked as a juncture adjudicator".
- `@explore` — T1/Sonnet 4.6. Code-structure surveys, needle-finding in large trees, open-ended
  codebase questions. Default fork choice for read-only exploration. Overrides built-in `@explore`
  to prevent silent Opus inheritance when forked from `@plan-deep`.
- `@verify` — T1/Sonnet 4.6. Verifies a list of claims (typically review findings) against the
  actual code. Returns accurate/inaccurate/needs-discussion labels per claim. Used by
  `/address-review` when ≥5 findings require code verification.
- `@general` — T1/Sonnet 4.6. Multi-step autonomous work with heterogeneous tools where no
  specialised subagent (`@explore`, `@verify`, `@git-editor`) fits. May edit/write. Overrides built-in
  `@general` to pin the tier — without the pin, forks from a T0 primary would silently run on Opus.
- `@session-scan` — T2/Haiku 4.5. High-volume session-history scan for retrospectives. Used by
  `/session-end`. Does NOT reference `AGENTS-REASONING.md`.
- `@committer` — T1/Sonnet 4.6. Narrow session-close commit subagent for autonomous chains.
  Reads a session-contract summary + expected-files list from the orchestrator, stages exactly
  those files, drafts a commit message in repo convention, commits. Refuses on scope drift,
  empty diff, secret-shaped files, or hook failures — never improvises. Distinct from
  `@git-editor` (which carries elevated history-rewriting permissions and is for interactive,
  multi-step git work) and from `/commit` (which gates each step on user confirmation).

**Built-in agents** (no definition file; available in any session):
- `@review` — post-implementation code review on a diff/commit/branch.

### Command roster

- `/address-review` — process pasted review output; classify findings, plan fixes, apply with
  checkpoints. Forks `@verify` when ≥5 findings require code verification.
- `/style-audit` — meta-command: runs `/style-audit-code`, `/style-audit-doc`, and
  `/style-audit-test` in parallel against a target and merges their findings into a single per-file
  report. Real orchestration; child audits are STUBs until they grow content.
- `/style-audit-code` — audit Python source against `STYLE-CODE.md` (mechanical rules and
  structuring principles); emits findings and observations; STUB.
- `/style-audit-doc` — audit inline docs (rST conformance, line length, en-UK) and rolling-context
  lifecycle (PLAN/NOTES/GOTCHAS accuracy vs code) against `STYLE-DOC.md`; forks `@explore`; emits
  proposals only.
- `/style-audit-test` — audit Python test code against `STYLE-TEST.md`; emits findings and
  observations; STUB.
- `/commit` — inspect uncommitted changes, draft a user-conventional commit message, and gate on
  user approval before committing.
- `/config-retrospective` — single-session `@plan-deep` audit of the OpenCode user-level
  infrastructure against the session store, scored against a relentless-simplicity lens. Forks
  `@explore` for permission-flow + usage-pattern data; the cohesion review is the orchestrator's own
  spine; approved changes are actioned by forked `@build`/`@general` and committed via the
  `/update-config` convention. On-demand only.
- `/explore` — fork a parameterized `@explore` subagent with a structured investigation prompt.
- `/format-loop` — iterative format + fix loop until clean or convergence fails; pass a scope in
  `$ARGUMENTS` to narrow it, or ask for check-only when you don't want fixes applied.
- `/note` — capture a CAPTURE-CANDIDATE into a target docs file with per-item approval.
- `/update-config` — edit OpenCode config files in the `opencode-config/` repo (symlinked to `~/.config/opencode/`; edits are live immediately).
- `/q` — force a terse one-turn answer; suspends reasoning-register rules for that turn only.
- `/rebase-plan` — plan (not execute) a narrative-arc rebase; outputs a rebase script for review.
  Also carries the execution playbook that `@git-editor` follows when the user pastes an approved
  plan into a fresh session.
- `/run-plan` — autonomously execute a session-sharded `docs/PLAN.md` as a 1:1 session:commit
  chain. `@plan-admin` (T1) orchestrates the mechanical loop; dispatches `@build`/`@general`/
  `@explore` per session entry, `@committer` for commits, and pages a forked `@plan-deep` (T0)
  only at inflection points, contract-invalidating discoveries, and sub-track boundaries. State
  lives in the PLAN.md ledger. Args: `[plan-path] [may-reshard|halt-at-boundaries|fully-autonomous]`.
- `/session-end` — end-of-session retrospective via `@session-scan`; proposes captures for approval.
- `/test-loop` — run tests, fix failures iteratively, stop when green or loop stalls.
- `/tier-retrospective` — gather tier-appropriate feedback on the AGENTS/REASONING layout from each
  agent.

### Subagent prompt template

Every subagent prompt should include:

```
Working directory: <absolute path>
Thoroughness: <quick | medium | very thorough>
Read-only: YES ("DO NOT EDIT ANY FILES.")

GOAL
<one-paragraph statement of why this investigation exists>

INVESTIGATION TASKS
<numbered, actionable>

OUTPUT FORMAT
<bulleted or section-headed template>
```

Subagents do NOT inherit this file. Re-state relevant rules in the fork prompt.

## Capture-candidate tagging

Capture candidates are not a laundry list. The content that survives in the user's global
`AGENTS-HINTS.md` or project-local agent files should be important, durable, and pointed — almost
always true yet unusual, specific enough to bite on real decisions yet not so local it decays with
today's code. Tagging is a two-stage pipeline: the shape-criteria decide whether a moment is worth
running the test on; the three-axis test decides whether that moment becomes a tag.

**Stage 1 — shape-criteria (pre-filter).** Run the stage-2 test when you produce or encounter one of
these. Don't run it on every thought.

- Spontaneously good framing that cracked a stuck problem.
- Serendipitous finding that turned out to matter.
- Expensive-to-learn result (long investigation → short finding).

**Stage 2 — three-axis test (the gate).** Tag only if the content passes all three:

- **Durable / almost-always-true.** Still correct after the session's context is gone. Not tied to
  today's code, today's file layout, today's decision. If the framing reads as an implementation
  snapshot, it fails this axis.
- **Unusual.** Counterintuitive enough to select against the reader's prior. "Here are seven facts"
  fails; "the obvious move is X, but actually Y because Z" passes.
- **Not universal-enough-to-be-bland.** Specific enough to guide a real decision. "Think carefully"
  fails; "route by cost-of-wrong, not task size" passes.

Failing any one axis means it's not a capture candidate — it's good session work that belongs in the
session only. The AND-gate is load-bearing: pairwise combinations admit the wrong material
(durable-and-unusual without non-bland admits clever aphorisms; unusual-and-not-bland without
durability admits hot takes; durable-and-not-bland without unusualness admits local tips).

Surface survivors with a brief tag: `CAPTURE-CANDIDATE: <one-line summary>`. Do NOT auto-write to
any file. The tag just makes the insight visible so the user can decide whether to preserve it (via
`/note`, `/session-end`, or manual edit).

## Rolling context files (project-level)

Current-phase context, decisions, and surprises live in separate append-mostly files in the
project's docs tree. All are transient — their content has two intended exits: effect a change in
the code, or land in `AGENTS.md` / `README.md`. At session start, skim the ones that exist.

- `docs/PLAN.md` — current phase: what we're working on, what's decided, what's open, what's next.
  Rewritten at phase boundaries. Concise (1–2 pages). Delete when the plan is executed.
- `docs/NOTES.md` — decisions, framings, mental models, and learnings (If X, Y happens because Z.)
  captured mid-project. Append-mostly.  Absorb durable decisions/framings/models/learnings into
  `AGENTS.md` or the user-level `~/.config/opencode/AGENTS-HINTS.md` at merge time, then delete.

## Tool discipline

These rules exist because violating them costs turns and clutters sessions.

- **Never use bash for file operations.** Use `Read` (not cat/head/tail/less), `Grep` (not grep/rg),
  `Glob` (not find/ls-for-patterns), `Edit` (not sed/awk), `Write` (not `cat <<EOF` or `echo >`).
  `ls` is fine for quick directory inspection only.
- **Never `cd X && cmd`.** Use the tool's `workdir` parameter. Cding into a subprocess shell means
  the next command has no memory of it.
- **Never `echo` to communicate.** Output directly in chat.
- **Parallelize independent calls.** If three Reads or three Greps don't depend on each other, call
  them in one assistant turn.
- **Prefer the `Task` subagent tool over direct search** when the question is open-ended or likely
  to require multiple search rounds. Reserve direct Grep/Glob for needle queries ("find the
  definition of X").
- **Ask structured questions**: When input from the user is needed, leverage the Question tool to
  structure complex decisions.
- **Reserve bash for what only bash can do**: running pytest, docker, git, make, mypy, sqlite3, etc.
- **JSON in tool calls**: when making function calls using tools that accept array or object
  parameters, structure those as JSON when the tool schema requires it. For example:
  ```
  <tool>
  <parameter name="items">[{"color": "orange", "options": {"key": true}}]</parameter>
  </tool>
  ```

## Session discipline

- **Split early.** If a session exceeds ~200 messages OR has compacted more than twice, stop and
  recommend the user start a fresh session scoped to the remaining work. Compactions are lossy and
  expensive.
- **Write a phase handoff.** Before splitting, append a short state-of-play summary to
  `docs/PLAN.md` (or project-appropriate equivalent) so the next session starts with verbatim fresh
  context, not a compacted summary.
- **Don't paste review-bot output verbatim** as the first message — summarize the action items. The
  bot output carries HTML/emoji/embedded code blocks that inflate context 3–5×.
- **Use @<agent> invocations explicitly** when starting long work.

## Code conventions

- Code convention hierarchy: Local repo > GitLab/GitHub project repos > language conventions >
  general conventions.
- Add a short code comment explaining *why* when a code construct breaks convention.
- May override local conventions if they are particularly bad, documented as known bad, already
  conflicting, or the impact is small enough to be entirely removed.
- Docstrings and code comments are mechanical and thin: a title sentence, a brief description, then
  the parameter/return/raise/yield/ivar/cvar block.  Exposition appears only when the code is
  intricate, fragile, load-bearing, or has non-obvious consequences. Narrative-scale and
  design-scale content lives in human docs, not inline. See `STYLE-DOC.md` for the full register
  guidance.

### Python

When writing or modifying Python code, **load STYLE-CODE.md** before edits. It carries the
mechanical rules (PEP 8 with 100-char wrap, mypy strict, rST docstrings, dataclass carve-out) and
the structuring principles (when to split functions, classes, modules; decorator/dataclass/Pydantic
guidance; test philosophy).

## Formatting conventions

- Flow lines upto 100 characters and then wrap, including comments and docstrings and non-code
  files.  Do not prematurely wrap lines less than 100 characters.
- Always use the project's dev/CI environments rather than local formatters.

## Git conventions

- Ask before creating or editing commits. (Carve-out for autonomous chains: see below.)
- Branch naming: `<user>/<project>-XXXX/descriptive-slug`.  If no ticket, eliminate
  `<project>-XXXX/`.
- Commit title: `<project>-XXXX Concise description`.
- Commit body: one to a few sentences or points.  Keep strictly focused on the *why* only — the
  purpose of the commit.  Keep details out of the commit message.  They should be evident from the
  commit body.
- Keep commits separated by focus; squash fixup commits before finishing.
- NEVER branches to a remote; NEVER commit `.env` / credential files.

### Autonomous-chain carve-out

The "ask before committing" rule above is written for interactive sessions where the user is the
orchestrator. In autonomous chains — where a primary agent (e.g., `@plan-deep`, an orchestrating
`@build`) dispatches implementation subagents whose work must compose into commit-shaped
deliverables — the commit step is dispatched, not asked.

The pattern:

1. **Implementation subagents do not commit themselves.** They leave the working tree dirty with
   green tests. Committing inside the implementation subagent pollutes the implementation
   context with commit-discipline rules and risks improvised commit messages.
2. **The orchestrator decides when the session contract is fulfilled.** This is the gate: tests
   green, expected files modified, no scope drift.
3. **The orchestrator dispatches `@committer`** with a session-contract summary and an
   expected-files list. The committer stages exactly those files, drafts a message in the repo's
   convention, commits — or refuses on drift / empty diff / secrets / hook failure. The
   committer never improvises; refusal bounces the decision back to the orchestrator.
4. **The orchestrator may then dispatch the next implementation subagent** in the chain.

This carve-out applies only to subagent chains. Direct user invocation of `@build` continues to
follow the "ask before committing" rule (or the user runs `/commit` explicitly). `@git-editor`
retains its existing behaviour for interactive history-shaping work.
