# Personal Working Style

Universal, transactional conventions: mechanical rules that apply to every agent regardless of tier.
Reasoning-register rules (capability allocation, option space, response scale, modes of inference)
live in `AGENTS-REASONING*.md`.

## Motivation that is not self-evident

When making a change whose motivation isn't obvious from the immediate context, explain the reasoning
before implementing — understanding the why is part of the work.

## Model tiers

Tiers route work by cost-of-wrong, not task size (large mechanical tasks stay low; small
architectural decisions stay high):

- **T-1** — interactive dialectic at the generative extremity (genesis, abduction, pivotal
  anomalies). Rare.
- **T0** — deep planning, architectural tradeoffs, cross-cutting audits. Use when being wrong is
  expensive and the work is analytical. A different model family can cross-check T0 conclusions at
  phase boundaries.
- **T1** — the default: implementation, refactors, tests, docs, reviews, exploration, verification.
- **T2** — mechanical subagents with low judgment load (classify, scan, group, commit).
- **T3** — pure mechanical extraction or counting; created on demand, none pre-built.

A subagent without a `model:` pin inherits its caller's model, so each subagent's frontmatter pin is
what fixes its tier; a tier is never chosen at fork time.

## Document loading rules

`opencode.json` auto-loads only this file; everything else loads by the triggers below. **Load
liberally:** when a trigger is ambiguous, load the file. T2/T3 agents skip files they lack the
judgment register for; tier gating in the table binds.

| Document                               | Load when…                                                | Tier  |
|----------------------------------------|-----------------------------------------------------------|-------|
| AGENTS.md                              | Always (auto-loaded)                                      | All   |
| AGENTS-REASONING.md                    | Session start                                             |T-1/T0/T1|
| AGENTS-REASONING-DETAILS.md            | Session start                                             | T-1   |
| AGENTS-REASONING-ADVANCED.md           | Session start                                             | T-1   |
| AGENTS-HINTS.md                        | The work touches a topic in the file's section headings   | T0/T1 |
|                                        | (advisory, not rules in force)                            |       |
| AGENTS-LOCAL.md                        | Investigating, reviewing, planning, editing, or           | All   |
|                                        | committing in the `opencode-config` repo, including via   |       |
|                                        | `~/.config/opencode/` from another project's session      |       |
| AGENTS-CAPTURE.md                      | A breakthrough framing that cracked a stuck problem, an   | T0/T1 |
|                                        | unexpected discovery that turned out to matter, or an     |       |
|                                        | expensive-to-learn result                                 |       |
| `style` skill                          | Before writing, modifying, or reviewing code or tests;    | T0/T1 |
|                                        | planning a refactor or test refactor; before writing,     |       |
|                                        | editing, auditing, or restructuring any documentation;    |       |
|                                        | `/style/audit`                                            |       |
| `code-lenses` skill                    | Code-analysis investigation; choosing among AST,          | T0/T1 |
|                                        | import-graph, call-graph, coverage, or test analysis; the |       |
|                                        | user names a lens                                         |       |
| `lean` skill                           | Auditing Lean statement/proof fidelity or translating     | T0/T1 |
|                                        | Lean declarations to exposition; Lean projects only       |       |
| `multisession` skill                   | Constructing a ROADMAP, sharding a PLAN, running or       | T0/T1 |
|                                        | annealing a `/plan/run` chain, or acting as @plan-admin;  |       |
|                                        | a dispatched worker gets its scope in the prompt and does |       |
|                                        | not load the skill                                        |       |

**Skills.** Loading a skill switches no agent and grants no permission. A missing or denied required
resource is a blocker: report it, never work from memory. Resource paths resolve from the skill's
base directory (not the project's), are read with `Read`, and never interpolate command
placeholders; a command expands its input in its own body and passes it explicitly.

## Tool discipline

- **Native tools for files, shell for everything else.** Inspect and change files with `Read`,
  `Grep`, `Glob`, `Edit`, `Write` — not cat/sed/awk/find/rg, `cat <<EOF`, or `echo >`. This is
  guidance, not a shell restriction: use ordinary shell composition (pipes, `&&`, redirects of
  command output, `2>&1`) when the task is about commands, and don't split a command or hunt for an
  alternative spelling to satisfy the permission matcher. Shell permissions are a few deliberate
  consent gates (push, commit, destructive git), not a sandbox. If a call is denied or the scanner
  rejects it, report the block: a denial never authorizes reaching the same effect through another
  interpreter or tool (`python3`, `node`), and a rejected expression is not a puzzle to rephrase.
- **Directory context.** For agent-issued shell calls, set `workdir` rather than prefixing the
  command with `cd`. It selects only that call's directory; file tools take explicit paths and
  `session_move` relocates the session. A subagent prompt's "Working directory:" is an instruction
  to its recipient, not a parameter that sets a location. Consult each tool's advertised schema; MCP
  tools have their own contracts. A slash command's `!` shell interpolation runs outside agent tool
  permissions; never use it to evade a denial.
- **Never `echo` to communicate.** Output directly in chat.
- **Parallelize independent calls** in one assistant turn. Dependent edit chains that need
  verification between steps stay sequential.
- **Forking subagents.** Fork when context pollution or parallelizability is high and steering is
  not needed (open-ended or multi-round search, many independent checks, large output reduced to a
  short finding). Never fork a single file read or narrow grep (use `Grep`/`Glob`), or a test or
  format loop, which needs turn-by-turn steering.
- **Ask structured questions.** When input from the user is needed, use the Question tool to
  structure complex decisions; not for narrow factual questions with one answer.
- **Reserve the shell for what only a shell can do**: pytest, docker, git, make, mypy, sqlite3, etc.
- **JSON in tool calls**: structure array or object parameters as JSON when the tool schema requires
  it.

## Code conventions

- Hierarchy: local repo > GitLab/GitHub project repos > language conventions > general conventions.
  A local convention may be overridden if it is particularly bad, documented as known bad, already
  conflicting, or small enough to be removed entirely.
- Add a short code comment explaining *why* when a construct breaks convention.
- Docstrings and comments are mechanical and thin; exposition only when the code is intricate,
  fragile, load-bearing, or has non-obvious consequences (`style` skill, `doc.md`).
- Before writing or modifying code, load the `style` skill; it routes to the per-language guide.

## Formatting conventions

- **Line width (single authority).** Flow free-flowing text — prose, comments, docstrings, Markdown,
  non-code files — as full as possible without exceeding 100 characters; do not wrap prematurely.
  Every other file defers here instead of restating the number. Exceptions: Go source (`gofmt` owns
  layout) and commit messages (see Git conventions).
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
- Commit body: one to a few sentences or points, strictly the *why* — the purpose of the commit, not
  the details the diff shows.
- Commit message width (single authority): title aims for ≤72 characters, no trailing period; body
  wraps at 72 characters. Pass a hard-wrapped message to git with `-F` (stdin heredoc), never `-m`.
- **Agent attribution**: commits where an agent produced the diff carry one `Co-authored-by:`
  trailer per content agent, crediting the agent that did the intellectual work of the diff (design,
  strategy, code). Default ON.
  - Credit content agents only. Mechanical agents (`@committer`) and orchestration (`@plan-admin`)
    are not authors. Same-model stages dedupe to one trailer.
  - Format: `Co-authored-by: <model name and version> <noreply+<model-family>@<vendor domain>>` —
    the human-readable name of the model that actually ran, with a role-only email that survives
    version bumps. Never invent an identity: when the author is unknown, ask.
  - Suppress only when the human wrote the diff and the agent merely committed it, or the repo's
    contribution policy prohibits agent trailers. Suppression is explicit (the user says so, or
    `CO_AUTHOR: none` to `@committer`), never inferred.
- Keep commits separated by focus; squash fixup commits before finishing.
- NEVER push branches to a remote; NEVER commit `.env` / credential files.
