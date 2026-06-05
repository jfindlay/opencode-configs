# PLAN: Multisession frugality + namespacing

Phase plan produced by an `@plan-deep` analysis session. Goal: reduce autonomous-chain token cost
without weakening the self-correction (adjudicator) machinery, and tidy the multisession subsystem's
file organisation. The conceptual rubric work (Thread 2 — windowing/commit-size tuning) is **already
done** this session, drafted directly into `multisession/multi-session-planning.md`; it is not in this PLAN.

## Why (the analysis behind this plan)

Measured from the session store (`~/.local/share/opencode/opencode.db`, `session` table carries
`agent`, `model`, `cost`, and a full token breakdown incl. `tokens_cache_read`):

- **Cache-read dominates autonomous cost at 150-300:1 vs output.** `general` forks (78% of
  autonomous-chain spend) run ~300:1. The driver is *context weight re-read every turn*, not model
  tier. The cost is `(quadratic cache-read accumulation over turns) / (linear output)`.
- **`AGENTS.md` is auto-injected ~22KB (~5,500 tokens) every session** because `opencode.json` sets
  no `instructions` field, so OpenCode falls back to its built-in auto-discovery convention. Most of
  that content (roster, command catalog, capture pipeline, subagent-strategy derivation, tier ladder)
  is never *acted on* by a worker executing a frozen shard. Prose "skip these sections" cannot reduce
  this — only changing injected bytes can.
- **The adjudicator forks are NOT waste** — they emit 8-13K tokens of real contract-design output at
  15-200:1 cache-read (better than the workers). They are the cheapest judgment in the system relative
  to output. Leave them fully intact, full `@plan-deep`/Opus context. This PLAN does not touch them.
- **Empirical: agents reliably load `AGENTS-REASONING.md` on demand.** So full-AGENTS.md
  auto-injection is redundant; the file should become a thin always-injected index of universal rules
  + load-triggers, with situational content behind triggers.

Single biggest frugality lever = Thread 1. It benefits *every* agent and is reversible (doc
restructure in a git repo).

---

## Thread 0 — Namespace the multisession doc layer (cheap, do first)

**Constraint (verified via the `customize-opencode` skill):** OpenCode discovers agents/commands by
*name*, flat, subdirectory-ignored — there is no `@multisession/plan-admin` syntax. Doc/reference
files resolve by *path* and can live anywhere. So: namespace docs by directory; namespace agents by
`plan-*` prefix convention only. Do NOT create an `agent/` subdir (it buys nothing and fakes
modularity).

**Session 0.1 — move multisession docs into a subdir.**
- Create `multisession/` in the config repo root (or `docs/multisession/` if that fits the repo's
  convention better — check existing layout first).
- Move `multi-session-planning.md` into it.
- Grep the repo for every reference to `multi-session-planning.md` (AGENTS.md loading table,
  agent prompts, command files) and update the paths.
- In `AGENTS.md`, add a short "multisession subsystem" note listing the member agents
  (`plan-admin`, `plan-deep`, `plan-juncture`, `committer`) and the `plan-*` prefix convention.
  Do NOT rename `committer` (ripples through too many files for cosmetic gain; explicitly out of
  scope this round).
- Verify nothing else references the old path. Commit.
- Contract: every existing reference to the doc resolves; no agent/command invocation changes.

---

## Thread 1 — `AGENTS.md` → thin always-injected index + triggered modules

The core frugality work. Restructure `AGENTS.md` so the always-injected payload is small, moving
situational content behind explicit load-triggers. **Aggressive split** (per design decision):
inline only what every agent uses every turn; everything situational becomes a triggered module.

**Keep INLINE in `AGENTS.md`** (universal, every-turn):
- Tool discipline (never bash for file ops; `Read`/`Grep`/`Glob`/`Edit`/`Write`; never `cd X &&`,
  use `workdir`; never `echo` to communicate; parallelize independent calls; JSON in tool calls).
- Git basics that fire constantly (ask before commit + the autonomous-chain carve-out pointer;
  never push; never commit secrets).
- The **document-loading table** itself (the index/router — this is the whole point).
- OpenCode-config-files note (symlink/live-edit fact).

**EXTRACT to triggered modules** (situational; loaded on trigger via the table):
- Agent roster + command roster → e.g. `AGENTS-ROSTER.md` (load trigger: "when selecting an agent or
  command to dispatch / when you need the roster").
- Capture-candidate tagging pipeline → its own module (trigger: "when you produce a
  CAPTURE-CANDIDATE-shaped finding").
- Subagent-strategy three-axis derivation + the fork template → module (trigger: "when deciding
  whether to fork a subagent").
- Model-tier ladder detail → module (trigger: "when pinning a subagent's `model:` field"). Keep a
  one-line tier summary inline.
- Session-discipline + rolling-context-file lifecycle → module (trigger: "at session start / when
  splitting a session / when writing rolling-context docs").

**Risk + mitigation:** an index too terse drops a rule an agent needed and didn't know to load. The
line to hold: *universal-every-turn rules stay inline; only situational content moves behind a
trigger.* Each extracted module's table row must carry a clear, obvious, low-conditionality trigger
(lower-tier workers must be able to follow it; they also need less of this content, so they trigger
fewer loads). When in doubt about a section, keep it inline — the cost of an over-inclusive index is
small; the cost of a missed load is a broken convention.

**Session 1.1 — propose the keep/extract split.**
- Produce a concrete section-by-section keep-inline-vs-extract table for the current `AGENTS.md`.
- STOP and surface to the user for approval of the line before any file is restructured. (This is
  the highest-blast-radius change in the plan — the file every agent reads.)

**Session 1.2 — execute the split.** (after 1.1 approved)
- Create the extracted modules with the content lifted verbatim where possible (preserve wording;
  this is a move, not a rewrite).
- Rewrite `AGENTS.md` as index + inline universals + the loading table with triggers pointing at the
  new modules.
- Mirror the change in the workspace `AGENTS.md` if the repo carries both a user-level and a
  project-level copy (this repo has both — keep them consistent).
- Verify every load-trigger in the table points at a real file.
- Commit.

**Session 1.3 — wire `instructions` explicitly + measure.**
- Set `instructions` in `opencode.json` explicitly to the slim index (stop relying on the implicit
  auto-discovery fallback, so the injected set is intentional and visible).
- Restart OpenCode (config is load-once, not hot-reloaded — see `customize-opencode`).
- Re-run a representative autonomous shard (or the cost query below) and confirm the per-session
  cache-read dropped. Record before/after in the commit body.
- **Measurement query** (roll cost by agent + token class):
  ```
  sqlite3 -readonly ~/.local/share/opencode/opencode.db \
    "SELECT agent, COUNT(*) n, ROUND(SUM(cost),2) cost,
            SUM(tokens_cache_read)/1000000 cr_M, SUM(tokens_output)/1000.0 out_K,
            ROUND(1.0*SUM(tokens_cache_read)/NULLIF(SUM(tokens_output),0),0) cr_per_out
     FROM session WHERE cost>0 GROUP BY agent ORDER BY cost DESC;"
  ```
  Target: `general`/`build` `cr_per_out` falls materially from ~155-300.

Contract for Thread 1: no behavioural rule is *lost* (only relocated behind a trigger); the
always-injected byte count drops ~60-70%; the measurement confirms a real cache-read reduction.

---

## Thread 3 — `@plan-admin` resume-vs-fresh logic  [DEFERRED — conditional]

**Gate:** do NOT start until small-commit discipline (now in `multisession/multi-session-planning.md`) has been
tried on real `~/Source/meta-workspace/` chains and shown *insufficient* — i.e., a conceptual unit
genuinely overflowed a healthy window despite small-commit tuning. For garden codebases this may
never fire.

When it does fire: spec `@plan-admin` to, at each worker pause, decide **commit-and-close vs.
resume-with-more** using a measured context-fill signal (Thread 4) plus the two stopping conditions
from `multisession/multi-session-planning.md` ("conceptual unit complete" OR "context-fill over threshold").
Resumption is **warm** (continue the same subagent via its task id), never a cold fork inheriting an
uncommitted tree. Commit boundary stays sharp: only commit green, conceptual-unit-complete states.

Depends on: Thread 2 rubric (done) + Thread 4 instrument (below).

---

## Thread 4 — context-fill plugin hook  [DEFERRED — verify first]

**Value:** a model cannot reliably measure its own context fill; it confabulates. OpenCode *does*
know the exact token count (it computes it to decide auto-compaction). A plugin hook exposing
per-subagent context-fill ("at 47% / 81% / 94% of window") converts a judgment `@plan-admin` does
badly (estimating its own fill) into a measurement code does perfectly — the same
push-mechanical-measurement-to-the-cheapest-layer principle as the rest of the system. It earns its
keep exactly when Thread 3 does (intricate/non-garden work) and not before.

**Session 4.1 — VERIFY the API capability (fork `@explore`, read-only).**
- UNVERIFIED ASSUMPTION: that OpenCode's plugin hook surface exposes a readable per-session /
  per-subagent context token count mid-session. The `customize-opencode` skill lists hooks
  (`tool.execute.before/after`, session events, `experimental.session.compacting`,
  `experimental.compaction.autocontinue`) but does not confirm a readable live token-fill figure.
- Fork `@explore` against the OpenCode source / plugin SDK (`@opencode-ai/plugin`) and the published
  config schema to answer: *can a plugin read the current context token count for a given (sub)session
  mid-run, and surface it to the orchestrating agent?*
- If YES → spec the hook in a follow-on session. If NO → `@plan-admin` must estimate fill from turn
  count / cumulative tool-output volume (coarser; note this fallback in Thread 3's spec).
- This session writes NO code; it returns a capability finding.

---

## Thread 5 — per-chain juncture adjudicator tier (Opus vs Sonnet)

**Why now (not deferred):** `@plan-juncture` is currently hardcoded to Sonnet in frontmatter
(`model: anthropic/claude-sonnet-4-6`). The Opus-juncture cost seen in the historical session data is
**residue, not a live leak** — those forks were dispatched as `@plan-deep`, not `@plan-juncture`, by
an older `/run-plan` prescription; the current config already routes junctures to the Sonnet-pinned
`@plan-juncture`. So nothing is broken. This thread *adds* a tuning capability surfaced by the
`multisession/multi-session-planning.md` sixth-lever section (already written this session): juncture tier should
be selectable per chain, because juncture work is the highest-judgment, lowest-frequency,
thinnest-context (cold-fork digest) work in the chain — the best-justified place to spend Opus when
the levers call for it, at a single-digit-dollar per-project differential.

**Design (from the rubric):** default Sonnet; escalate to Opus per chain when the five levers call
for it — most sharply when low test-suite quality (weak inner loop) coincides with high
correctness-criticality. Levers 1-4 push tier up as they push commit size down; lever 5 (test
quality) is the asymmetry that pushes tier *down*.

**Session 5.1 — make juncture tier per-chain selectable.**
- Remove the hardcoded `model:` from `@plan-juncture`'s frontmatter dependency on a single tier, OR
  introduce a tier-selection mechanism so `@plan-admin` forks the juncture at the chain-specified
  tier. Check how OpenCode resolves a subagent's model when the Task fork wants to override
  frontmatter — if frontmatter `model:` cannot be overridden per-fork, the alternative is two
  juncture agent files (`plan-juncture` = Sonnet default, `plan-juncture-opus` = escalated) and let
  `@plan-admin` dispatch the one named in the chain config.
- Add a juncture-tier field to the `/run-plan` invocation args and/or the PLAN header (e.g.
  `juncture-tier: sonnet|opus`, default `sonnet`).
- Update `@plan-admin`'s juncture-fork logic + the juncture-fork prompt template to dispatch the
  selected tier.
- Update `/run-plan` command doc + AGENTS.md roster note to mention the tunable.
- Contract: default behaviour unchanged (Sonnet); a chain can opt into Opus junctures via one
  declared field; no change to worker/committer tiers.

**Dependency:** none blocking — but verify the per-fork model-override mechanism (the bullet above)
before committing to the one-file-vs-two-files approach. Cheap to do; do it alongside or after
Thread 1.

---

## Sequencing summary

1. **Thread 0** (doc namespacing) — cheap, do first, unblocks nothing but tidies.
2. **Thread 1** (AGENTS.md index) — the frugality win; 1.1 gates on user approval of the split line.
3. **Thread 2** (windowing rubric + sixth-lever adjudicator-tier rubric) — DONE this session in
   `multisession/multi-session-planning.md`.
4. **Thread 5** (per-chain juncture tier) — do alongside/after Thread 1; verify per-fork model
   override first. Not deferred.
5. **Threads 3 + 4** — DEFERRED behind the "small-commit discipline proved insufficient" gate;
   4.1 (API verification) is the only safe-to-do-early step and is read-only.

## Out of scope (explicitly, this round)
- Changing the adjudicator's *judgment role or firing rate* — confirmed well-placed (event-driven,
  not periodic; rate set by where contracts need re-checking, never by token budget). Thread 5
  makes its *tier* tunable but does not touch what it does or how often it fires.
- Renaming `committer` → `plan-committer` — cosmetic, ripples too far.
- Plugin-encapsulating the whole multisession subsystem — revisit only if the easy path succeeds and
  shipping the subsystem becomes a goal.
- Any `@build`/`@explore`/`@general` model-tier change — the tiers are correct; cost is context
  weight, not tier.
