# Documentation Style

Loaded on demand by T0/T1 agents before writing, editing, auditing, or restructuring documentation
of any kind — inline docstrings, human docs, agent docs.

Project/repo docs live in three tiers. Each has a distinct register and a strict referential
direction.

## 1. Inline docs (docstrings, comments)

Relentlessly minimal. At each comment point, cover only what is required for the reference-doc
contract. Admit extra exposition only when at least one of:

- the code is intricate;
- the code is fragile;
- the code is load-bearing;
- the consequence of the code is not obvious from a read of the code itself.

Inline docs **may never refer to agent docs** (`AGENTS.md`, `PLAN.md`, etc.). Inline docs **may
refer to human docs only when** the exposition the rule above admits is too long or complex to
live inline; the reference exists to point at the elided explanation, not to duplicate inline
content.

## 2. Human docs (`docs/` or `doc/` tree, excluding rolling-context files)

Ergonomic for both humans and agents. This is where exposition lives — design rationale, algorithm
walkthroughs, worked examples, ADRs, migration notes, narrative chapters. Human docs should still
be kept focused and non-duplicative.

Human docs are organised into three categories:

- **Design docs.** Completely cover the design with diagrams. Motivate the design — why this shape,
  possibly what alternatives were considered, what constraints forced the choice.
- **Development docs.** The exposition companion to inline docs and comments. Refer **frequently to
  inline code docs**; the inverse is rare and gated by the rule in §1. Development docs carry the
  depth that inline docs deliberately elide.
- **User docs.** Always include: (i) setup instructions if any setup is needed, (ii) at least one
  simple-usecase example, (iii) a "why" explanation in intuitive concepts and language, not in
  implementation terms.

Human docs do not refer to agent docs.

## 3. Agent docs (`AGENTS.md`, `README.md` in its agent-facing role, transient rolling-context)

Relentlessly transactional. Agents read them to get oriented to the project or codebase.

- **Durable agent docs are only `AGENTS.md` and `README.md`.** `README.md` is dual-purpose (human
  and agent).
- **User-level agent infrastructure** lives at `~/.config/opencode/`. Loading rules for each file
  are documented in AGENTS.md `## Document loading rules`.
- **All other agent-facing markdown is transient rolling context** (`PLAN.md`, `NOTES.md`).
  Rolling-context content has exactly two intended exits: (i) effect a change in the code, or (ii)
  land in `AGENTS.md` / `README.md`. Content that does neither is dead weight and should be removed
  at merge time.
- **Agent docs refer liberally to inline and human docs.** Keep structural description in the code
  and all other exposition in the human docs.
- **Inline and human docs never refer to agent docs.** This direction is one-way.
- **No unstable or noisy data in agent docs.** Never write "159 tests pass" or "commit 70a6f35" —
  the count drifts and the hash changes as the code is edited. Write "100% tests pass" or "tests
  pass" or describe the *shape* of the test surface (feature names, what each covers). Same rule
  for file counts, line counts, dependency counts, computed hashes, anything that is a moving
  target.
- **Agent-markdown sizing.** Budget roughly 1 line of `AGENTS.md` per ~128 lines of source it
  covers. Exceed only when the source is intricate, fragile, load-bearing, or convoluted.

## Reference-direction summary

| From → To       | Inline | Human  | Agent  |
|-----------------|--------|--------|--------|
| Inline →        | n/a    | gated¹ | never  |
| Human →         | OK     | OK     | never  |
| Agent →         | OK²    | OK²    | n/a    |

¹ Only when inline-rule §1 admits exposition AND that exposition is too long/complex to live
inline.
² Should — pointing agents at the inline-doc contract and human-doc exposition is the job of agent
docs.

## Per-language divergences

Two divergences introduced by the sibling styleguides; noted here so doc-audits do not
false-positive:

- **Go source has no 100-char wrap** — `gofmt` owns layout and Go has no line-length setting. The
  "premature wrap" / ">100 col" inline rules apply to Go *comments and Markdown* but not Go *code*.
- **Rust uses `//!` / `///` rather than rST docstrings** — `//!` for module/crate headers, `///`
  for items. The "missing docstring" and field-list rules map to rustdoc `# Errors` / `# Panics`
  sections, not to rST `:param:` / `:returns:` field lists.

## Future sections (TODO)

- **rST conformance details.** Field-list ordering, common pitfalls, Sphinx-vs-other-tooling
  divergences.
- **English conventions.** en-UK spelling for project-internal docs unless a project pins en-US;
  punctuation; em-dash usage; sentence-case headings.
- **Register-by-doc-type.** When narrative prose is appropriate (design docs) vs. when bullet-list
  density is preferred (reference docs).
- **Audit invocation.** The `/style-audit-doc` command audits inline docs (rST conformance, line
  length, en-UK) and rolling-context lifecycle (PLAN/NOTES accuracy vs. code) against the
  principles in this document.
