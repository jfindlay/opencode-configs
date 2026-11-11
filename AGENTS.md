# Personal Working Style

This file holds universal, transactional conventions — mechanical rules that apply to every agent
regardless of tier. Tool discipline, model tiering, formatting, and git conventions all live here.

**Reasoning-register rules live elsewhere.** Capability allocation, option space, and response scale
are rules for primary agents (T-1/T0/T1) and judgment-bearing subagents (T1); modes of inference and
the four-step abductive decomposition live in a separate file for T-1/T0 only.

**Motivation that is not self-evident.** When making a change whose motivation isn't obvious from
the immediate context, explain the reasoning before implementing — understanding the why is part of
the work.

## OpenCode config files

The authoritative source is the `opencode-config/` git repo. `~/.config/opencode/` is a
**symlink** to that repo, so an edit lands in the live files with no apply step. The running service
does not reliably watch the symlinked directory, so confirm a change took effect (or reload) before
relying on it. Edit files directly in the `opencode-config/` repo; commit per the standard git
conventions below. Runtime artifacts (`bun.lock`, `package.json`, `node_modules/`, etc.) are managed
by OpenCode itself and must NOT be committed to the repo — they exist only at the symlink target and
are covered by `.gitignore`.

## Model tiers

Tiers route work by cost-of-wrong, not task size:

- **T-1** — interactive dialectic at the generative extremity (genesis, abduction, pivotal
  anomalies). Rare.
- **T0** — deep planning, architectural tradeoffs, cross-cutting audits. Use when being wrong is
  expensive and the work is analytical. A different model family can cross-check T0 conclusions at
  phase boundaries.
- **T1** — the default: implementation, refactors, tests, docs, reviews, exploration, verification.
- **T2** — mechanical subagents with low judgment load (classify, scan, group, commit).
- **T3** — pure mechanical extraction or counting; created on demand, none pre-built.

Escalate or downgrade by cost-of-wrong. Encode the tier in each subagent's `model:` frontmatter
field: a subagent without a pin inherits its caller's model, so the pin is what keeps T0/T-1 forks
from silently running at the caller's tier.

**Tier notation only.** The `model:` frontmatter fields and `opencode.json` carry the concrete model
assignments. Everywhere else, refer to models by tier (T-1, T0, T1, T2) — never by model name or
version, which churn.

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
| AGENTS-REASONING-ADVANCED.md           | Always at session start, in addition to AGENTS-REASONING  | T-1/T0|
|                                        | (modes of inference, abductive decomposition)             |       |
| AGENTS-REASONING-HINTS.md              | At any impasse; before delicate uncertainty resolution;   | T0    |
|                                        | when an anomaly resists the canonical option set          |       |
| AGENTS-HINTS.md                        | When reaching for a referential framing; when a captured  | T0/T1 |
|                                        | hint might apply; when AGENTS.md or REASONING points to   |       |
|                                        | a specific section in HINTS                               |       |
| AGENTS-CAPTURE.md                      | When producing or encountering a CAPTURE-CANDIDATE-shaped | T0/T1 |
|                                        | finding                                                   |       |
| `style` skill                          | Before writing or modifying any code or test code; before | T0/T1 |
|                                        | reviewing code or tests; when planning a refactor or test |       |
|                                        | refactor; before writing, editing, auditing, or           |       |
|                                        | restructuring any documentation (inline docstrings, human |       |
|                                        | docs, agent docs); for /style/audit. Its SKILL.md routes  |       |
|                                        | to the per-language and per-surface guides                |       |
| AGENTS-LENSES.md                       | When reaching for a code-reasoning lens at the prompt     | T0/T1 |
|                                        | level; for design rules and per-lens reference, see       |       |
|                                        | composable-code-lenses/docs/                              |       |
| `python-lenses` skill                  | When doing a Python code-analysis investigation; when the | T0/T1 |
|                                        | user names a lens explicitly; when choosing among AST,    |       |
|                                        | import-graph, call-graph, coverage, or test analysis      |       |
| `lean` skill                           | When auditing the fidelity of Lean statements or proofs,  | T0/T1 |
|                                        | or translating Lean declarations into classical           |       |
|                                        | exposition; Lean projects only                            |       |
| `multisession` skill                   | When constructing a ROADMAP, sharding a PLAN, running or  | T0/T1 |
|                                        | annealing a /plan/run chain, or acting as @plan-admin.    |       |
|                                        | Its commands and agents load the resources they need; a   |       |
|                                        | dispatched worker gets its scope in the prompt and does   |       |
|                                        | not load the skill; load its rationale reference only to  |       |
|                                        | explain the workflow                                      |       |

## Tool discipline

These rules exist because violating them costs turns and clutters sessions.

- **Native tools for files, shell for everything else.** Inspect and change files with `Read`,
  `Grep`, `Glob`, `Edit`, `Write` — not cat/sed/awk/find/rg, `cat <<EOF`, or `echo >`. This is
  guidance, not a shell restriction: use ordinary shell composition (pipes, `&&`, redirects of
  command output, `2>&1`) when the task is about commands, and don't split a command or hunt for an
  alternative spelling to satisfy the permission matcher. Shell permissions are a few deliberate
  consent gates (push, commit, destructive git), not a sandbox. If a call is denied or the scanner
  rejects it, report the block: a denial never authorizes reaching the same effect through another
  interpreter or tool (`python3`, `node`), and a rejected expression is not a puzzle to rephrase.
- **Directory context.** For agent-issued shell calls, set `workdir` rather than prefixing the
  command with `cd`. This selects only that call's directory; it does not relocate the session or
  subsequent file tools. Use explicit paths for file tools and `session_move` for a genuine session
  relocation. (`cd dir && cmd` does work within its own call; the preference is for structured
  input, clearer permission checks, and less quoting. It does not cover directory changes inside
  project scripts.) A subagent prompt's "Working directory:" is an instruction to its recipient, not
  a parameter that sets a location. Consult each tool's advertised schema; MCP tools have their own
  contracts. A slash command's `!` shell interpolation runs outside agent tool permissions; never
  use it to evade a denial.
- **Never `echo` to communicate.** Output directly in chat.
- **Parallelize independent calls.** If three Reads or three Greps don't depend on each other, call
  them in one assistant turn.
- **Prefer the `subagent` tool over direct search** when the question is open-ended or likely to
  require multiple search rounds. Reserve direct Grep/Glob for needle queries ("find the definition
  of X").
- **Ask structured questions**: When input from the user is needed, leverage the Question tool to
  structure complex decisions.
- **Reserve the shell for what only a shell can do**: running pytest, docker, git, make, mypy,
  sqlite3, etc.
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
  design-scale content lives in human docs, not inline. See the `style` skill's `doc.md` for the
  full register guidance.

When writing or modifying code, load the `style` skill; it routes to the matching per-language guide
(Python, Rust, Go).

### Python

When writing or modifying Python code, **load the `style` skill's `code-python.md`** before edits.
It carries the mechanical rules (PEP 8 with the standard line width, mypy strict, rST docstrings,
dataclass carve-out) and the structuring principles (when to split functions, classes, modules;
decorator/dataclass/Pydantic guidance; test philosophy).

## Formatting conventions

- **Line width (single authority).** Flow free-flowing text — prose, comments, docstrings, Markdown,
  non-code files — as full as possible without exceeding 100 characters; do not wrap prematurely.
  Every other file defers here instead of restating the number. Exceptions: Go source (`gofmt` owns
  layout; see the `style` skill's `code-go.md`) and commit messages (see Git conventions).
- Always use the project's dev/CI environments rather than local formatters.

## Git conventions

- Ask before creating or editing commits. A direct user request to commit ("commit") is the
  approval: inspect the changes, commit the intended paths in one turn with a message per these
  conventions, and report the result; ask only when the fileset or attribution is unclear. An
  approved autonomous chain (`/plan/run`) authorizes its driver to dispatch commits after the
  contract gate; implementation workers never commit themselves and leave the tree dirty.
- In a chain, the driver owns tests, scope, readiness, and recovery decisions. `@committer` stages
  the agreed fileset and returns success or a refusal; it does not repair, retry past a hook
  failure, or rewrite history.
- Branch naming: `<user>/<project>-XXXX/descriptive-slug`. If no ticket, eliminate
  `<project>-XXXX/`.
- Commit title: `<project>-XXXX Concise description`.
- Commit body: one to a few sentences or points. Keep strictly focused on the *why* only — the
  purpose of the commit. Keep details out of the commit message. They should be evident from the
  commit body.
- Commit message width (single authority): title aims for ≤72 characters, no trailing period; body
  wraps at 72 characters. `@committer` defers here. Pass a hard-wrapped message to git
  with `-F` (stdin heredoc); a body given through `-m` has come back unwrapped.
- **Agent attribution**: commits where an agent produced the diff carry one `Co-authored-by:`
  trailer per content agent, crediting the agent that did the intellectual work of the diff (design,
  strategy, code). Attribution is default ON.
  - Credit the actual content agents only. Mechanical agents (`@committer`) and orchestration
    (`@plan-admin`) are not authors, like the CI system that ran `git commit`. Same-model stages
    dedupe to one trailer.
  - Identity format: `Co-authored-by: <model name and version> <noreply+<model-family>@<vendor
    domain>>` — the human-readable name of the model that actually ran, with a role-only email
    that survives version bumps. Never invent an identity: when the author is unknown, ask.
  - Suppress only when the human wrote the diff and the agent merely committed it, or the repo's
    contribution policy prohibits agent trailers. Suppression is explicit (the user says so, or
    `CO_AUTHOR: none` to `@committer`), never inferred.
- Keep commits separated by focus; squash fixup commits before finishing.
- NEVER push branches to a remote; NEVER commit `.env` / credential files.
