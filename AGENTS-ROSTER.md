# Agent and Command Roster

Load trigger: when selecting an agent or command to dispatch; when pinning a subagent's `model:`
field; when in an autonomous chain and orchestrating a committer dispatch.

## Model tier hierarchy (full detail)

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

## Agent roster

**Primary agents** (invoked by `@name` or set as startup agent):
- `@plan-deep` — T0/Opus 4.7. Deep exploration, architectural tradeoffs, cross-cutting audits.
  Rolling-context writes allowed; all other writes require user approval. References
  `AGENTS-REASONING.md` in full including the T0-only section.
- `@build` — T1/Sonnet 4.6. Default implementation: coding, refactors, test fixes, review-address
  cycles. References `AGENTS-REASONING.md` up to the T0-only marker.
- `@plan-admin` — T1/Sonnet 4.6. Autonomous-chain driver for `/run-plan`. Runs the mechanical
  loop (select, dispatch, gate, commit, ledger); pages a forked `@plan-juncture` only at the three
  junctures (inflection design, discovery adjudication, sub-track boundary). Never implements;
  never adjudicates discoveries itself.
- `@git-editor` — T1/Sonnet 4.6. General git work: rebases, commits, cherry-picks, amends,
  branch/tag cleanup. Elevated git permissions; rewrites local history only and never pushes. For
  narrative-arc rebase work, paired with `/rebase-plan` which carries both the planning steps and
  the execution playbook.

**Subagents** (forked via the Task tool):
- `@plan-juncture` — T0/Opus 4.5. Juncture adjudicator for `/run-plan` chains. Default tier; paged
  by `@plan-admin` at inflection-point interface design, discovery adjudication (does this finding
  invalidate a frozen downstream contract?), and sub-track boundary coordinate-transform. One-shot
  return; does not implement; writes only to PLAN's `## Cross-session contracts` on inflection
  design. Declare `juncture-tier: sonnet` in the PLAN header to opt down to `@plan-juncture-sonnet`
  when the five commit-size levers permit (strong test suite + lower correctness-criticality).
- `@plan-juncture-sonnet` — T1/Sonnet 4.6. Cost-economised opt-down from `@plan-juncture`. Same
  contract; cheaper model. Activated via `juncture-tier: sonnet` in the PLAN header.
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
- `@committer` — T2/Haiku 4.5. Narrow session-close commit subagent for autonomous chains.
  Reads a session-contract summary + expected-files list from the orchestrator, stages exactly
  those files, drafts a commit message in repo convention, commits. Refuses on scope drift,
  empty diff, secret-shaped files, or hook failures — never improvises. Distinct from
  `@git-editor` (which carries elevated history-rewriting permissions and is for interactive,
  multi-step git work) and from `/commit` (which gates each step on user confirmation).

**Built-in agents** (no definition file; available in any session):
- `@review` — post-implementation code review on a diff/commit/branch.

**Multisession subsystem** — agents whose names share the `plan-*` prefix convention:
`@plan-deep`, `@plan-admin`, `@plan-juncture`, `@plan-juncture-sonnet`, and `@committer`. Reference
doc: `multisession/multi-session-planning.md`.

## Command roster

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
- `/update-config` — edit OpenCode config files in the `opencode-config/` repo (symlinked to
  `~/.config/opencode/`; edits are live immediately).
- `/q` — force a terse one-turn answer; suspends reasoning-register rules for that turn only.
- `/rebase-plan` — plan (not execute) a narrative-arc rebase; outputs a rebase script for review.
  Also carries the execution playbook that `@git-editor` follows when the user pastes an approved
  plan into a fresh session.
- `/run-plan` — autonomously execute a session-sharded `docs/PLAN.md` as a 1:1 session:commit
  chain. `@plan-admin` orchestrates the mechanical loop; dispatches `@build`/`@general`/`@explore`
  per session entry, `@committer` for commits, and pages `@plan-juncture` (Opus default) or
  `@plan-juncture-sonnet` (opt-down via `juncture-tier: sonnet` in the PLAN header) only at
  inflection points, contract-invalidating discoveries, and sub-track boundaries. State lives in the
  PLAN.md ledger. Args: `[plan-path] [may-reshard|halt-at-boundaries|fully-autonomous]`.
- `/session-end` — end-of-session retrospective via `@session-scan`; proposes captures for approval.
- `/test-loop` — run tests, fix failures iteratively, stop when green or loop stalls.
- `/tier-retrospective` — gather tier-appropriate feedback on the AGENTS/REASONING layout from each
  agent.

## Autonomous-chain carve-out (committer dispatch pattern)

The "ask before committing" rule in `AGENTS.md` is written for interactive sessions. In autonomous
chains — where a primary agent dispatches implementation subagents whose work must compose into
commit-shaped deliverables — the commit step is dispatched, not asked.

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
