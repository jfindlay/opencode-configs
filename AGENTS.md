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

## Model tiers

T-1 = Fable (interactive dialectic at the generative extremity — genesis, abduction, pivotal
anomalies). T0 = Opus 4.8 (deep planning, architectural tradeoffs, cross-cutting audits). T1 =
Sonnet (default — implementation, refactors, reviews). T2 = Haiku (mechanical subagents). Default
to T1. Encode tier in each subagent's `model:` frontmatter field — never rely on prose guidance
alone. Full tier detail and agent roster: `AGENTS-ROSTER.md`.

## Document loading rules

This file (AGENTS.md) is auto-loaded by every agent. Other files in the user-level agent
infrastructure are on-demand. **Load liberally** — when a trigger is ambiguous, load the file. The
cost of loading when not needed is small; the cost of failing to load when needed is large.

The "Tier" column gates loading by agent tier: T2/T3 mechanical agents skip files they don't have
the judgment register for. T0/T1 agents follow the trigger directly.

| Document                               | Load when…                                                | Tier  |
|----------------------------------------|-----------------------------------------------------------|-------|
| AGENTS.md                              | Always (auto-loaded; this file)                           | All   |
| AGENTS-REASONING.md                    | Always at session start                                   | T0/T1 |
| AGENTS-REASONING-HINTS.md             | At any impasse; before delicate uncertainty resolution;   | T0    |
|                                        | when an anomaly resists the canonical option set          |       |
| AGENTS-HINTS.md                        | When reaching for a referential framing; when a captured  | T0/T1 |
|                                        | hint might apply; when AGENTS.md or REASONING points to   |       |
|                                        | a specific section in HINTS                               |       |
| AGENTS-ROSTER.md                       | When selecting an agent or command to dispatch; when      | T0/T1 |
|                                        | pinning a subagent's `model:` field; when in an           |       |
|                                        | autonomous chain (committer dispatch pattern)             |       |
| AGENTS-SUBAGENT-STRATEGY.md            | When deciding whether to fork a subagent; when writing    | T0/T1 |
|                                        | a subagent fork prompt                                    |       |
| AGENTS-CAPTURE.md                      | When producing or encountering a CAPTURE-CANDIDATE-shaped | T0/T1 |
|                                        | finding                                                   |       |
| AGENTS-SESSION.md                      | At session start; when splitting a session; when writing  | T0/T1 |
|                                        | or managing rolling-context docs (PLAN.md, NOTES.md)     |       |
| STYLE-CODE.md                          | Before writing or modifying any code; before reviewing    | T0/T1 |
|                                        | code; when planning a refactor. Routes to the matching    |       |
|                                        | per-language sibling (STYLE-CODE-PYTHON/RUST/GO.md).      |       |
| STYLE-DOC.md                           | Before writing, editing, auditing, or restructuring any   | T0/T1 |
|                                        | documentation (inline docstrings, human docs, agent docs) |       |
| STYLE-TEST.md                          | Before writing or modifying any test code; before         | T0/T1 |
|                                        | reviewing tests; when planning a test refactor. Routes to |       |
|                                        | the matching per-language sibling                         |       |
|                                        | (STYLE-TEST-PYTHON/RUST/GO.md).                           |       |
| AGENTS-LENSES.md                       | When reaching for a code-reasoning lens at the prompt     | T0/T1 |
|                                        | level; for design rules and per-lens reference, see       |       |
|                                        | composable-code-lenses/docs/                              |       |
| `python-lenses` skill                  | When doing a Python code-analysis investigation; when the | T0/T1 |
|                                        | user names a lens explicitly; when choosing among AST,    |       |
|                                        | import-graph, call-graph, coverage, or test analysis      |       |
| AGENTS-LOG.md                          | During meta-restructuring sessions only (config audits,   | T0    |
|                                        | doc reorganisations)                                      |       |
| multisession/multi-session-planning.md | When planning or executing long-arc multi-session work    | T0    |
|                                        | (the two-frame model, commit-shaped session, contract     |       |
|                                        | taxonomy); before/during a /run-plan chain                |       |

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

## Code conventions

- Code convention hierarchy: Local repo > GitLab/GitHub project repos > language conventions >
  general conventions.
- Add a short code comment explaining *why* when a code construct breaks convention.
- May override local conventions if they are particularly bad, documented as known bad, already
  conflicting, or the impact is small enough to be entirely removed.
- Docstrings and code comments are mechanical and thin: a title sentence, a brief description, then
  the parameter/return/raise/yield/ivar/cvar block. Exposition appears only when the code is
  intricate, fragile, load-bearing, or has non-obvious consequences. Narrative-scale and
  design-scale content lives in human docs, not inline. See `STYLE-DOC.md` for the full register
  guidance.

When writing or modifying code, load the matching per-language guide via the `STYLE-CODE.md` index
(Python → `STYLE-CODE-PYTHON.md`; Rust → `STYLE-CODE-RUST.md`; Go → `STYLE-CODE-GO.md`).

### Python

When writing or modifying Python code, **load STYLE-CODE-PYTHON.md** before edits. It carries the
mechanical rules (PEP 8 with 100-char wrap, mypy strict, rST docstrings, dataclass carve-out) and
the structuring principles (when to split functions, classes, modules; decorator/dataclass/Pydantic
guidance; test philosophy).

## Formatting conventions

- Flow lines upto 100 characters and then wrap, including comments and docstrings and non-code
  files. Do not prematurely wrap lines less than 100 characters.
- Always use the project's dev/CI environments rather than local formatters.

## Git conventions

- Ask before creating or editing commits. (Carve-out for autonomous chains: see `AGENTS-ROSTER.md`.)
- Branch naming: `<user>/<project>-XXXX/descriptive-slug`. If no ticket, eliminate
  `<project>-XXXX/`.
- Commit title: `<project>-XXXX Concise description`.
- Commit body: one to a few sentences or points. Keep strictly focused on the *why* only — the
  purpose of the commit. Keep details out of the commit message. They should be evident from the
  commit body.
- Keep commits separated by focus; squash fixup commits before finishing.
- NEVER push branches to a remote; NEVER commit `.env` / credential files.
