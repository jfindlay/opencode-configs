# Agent infrastructure changelog

This file is the dated retrospective and changelog for the user-level agent infrastructure living
at `~/.config/opencode/`: `AGENTS.md`, `AGENTS-REASONING.md`, `AGENTS-HINTS.md`,
`AGENTS-REASONING-HINTS.md`, and this file. It is **not loaded by any agent during normal work** —
only consulted during meta-restructuring sessions such as config audits or doc reorganisations.

Distinct from project-level rolling-context (`PLAN.md`, `NOTES.md`, `GOTCHAS.md`): those files are
scaffolding meant to die at merge time, with content that either effects a code change or absorbs
into source/human docs/`AGENTS.md`. This file is deliberately durable — its job is preserving the
rationale chain across multiple restructurings so future audits can trace why the current shape is
the way it is.

Entries are append-only, dated, and shaped as "what changed, why, what the alternative was."

---

## 2026-04-23 — Tier split: reasoning-register rules moved out of AGENTS.md

The reasoning-register sections (capability allocation, option space, response scale, modes of
inference) were moved out of `AGENTS.md` into a new `AGENTS-REASONING.md` file with an explicitly
activational preamble. Motivation: T2/T3 mechanical subagents (`@session-scan`) do not benefit from
reasoning-register priming, and mixing aspirational-operational content with strict transactional
content in one file risked register pollution — the model tuning to the opening register and
reading mechanical rules through that lens.

**Structure post-split:**

- `AGENTS.md` — universal, transactional. Read by every agent.
- `AGENTS-REASONING.md` — activational, reasoning-register. Read by primary agents (T0/T1) and
  judgment-bearing T1 subagents via explicit reference in their prompt body.
- `AGENTS-HINTS.md` — referential, framings and expositions. Treated as "consult if useful," not as
  rules in force.

**Agents referencing REASONING** at the time of the split: `plan-strict.md`, `build.md`,
`rebase.md`, `explore.md`, `research-findings.md`. `session-scan.md` deliberately does not
reference it.

Use `/tier-retrospective` to gather fresh evidence if the split is ever restructured.

---

## 2026-04-24 — Within-REASONING T0/T1 gate: avoiding fake rigour at Sonnet tier

The 2026-04-23 file-level split (AGENTS → REASONING) addressed T2/T3 register pollution. A
follow-up observation motivated a second, within-file split: the full modes-of-inference treatise
(eliminative/generalizing/abductive + Dupin decomposition) is calibrated for Opus-scale reasoning
reserve, and asking Sonnet to execute the four-step abductive decomposition costs attention against
the rules it can actually apply while producing fake rigour rather than real abductive work.

**The distinction that matters.** File-level split (23rd) was about avoiding *wasted priming* at
tiers that can't use the content. Within-file gate (24th) is about avoiding *fake rigour* at a tier
that can partially but not fully execute the content — the worse failure mode, because partial
execution looks like compliance.

**Structure post-gate.** `AGENTS-REASONING.md` now has two zones divided by a `--- T0 ONLY BELOW
---` marker:

- Above the marker (T0 and T1): capability allocation, option space, response scale. These rules
  apply at both tiers; Sonnet can will them into existence as effectively as Opus for most work.
- Below the marker (T0 only): modes of inference + abductive decomposition. T1 agents are
  instructed at the top of the file to stop reading at the marker. If they encounter a fact pattern
  where eliminative and generalizing modes fail against a pivotal anomaly, the rule is to surface
  the anomaly and recommend escalation to `@plan-strict`, not to attempt the decomposition
  themselves.

**Why this framing is worth preserving.** The general principle — "partial execution of a rule
calibrated for a higher tier is a worse failure than skipping the rule outright" — generalises
beyond this specific split. It applies whenever guidance is tier-sensitive: code-review depth,
architectural tradeoff analysis, design-doc critique, narrative-arc rebase planning. The structural
move is always the same: partition the guidance by tier, mark the boundary explicitly, give lower
tiers a cheap escalation recommendation rather than a best-effort imitation.

**Related capture-candidate policy tension.** The same session flagged that capture-candidate
sensitivity was too high (tag inflation), but the tightening of the criteria was deferred. The two
issues share a root cause — self-grading looseness on "is this worth surfacing" — which suggests
the capture-candidate fix and any future tier-gating fixes should both be evaluated against the
same test: *does the criterion admit partial or confused compliance?* If yes, tighten the
criterion, not the reminder frequency.

---

## 2026-04-26 — Rolling-context lifecycle rule (absorbed into AGENTS.md)

Rolling-context files (`PLAN.md`, `NOTES.md`, `GOTCHAS.md` at the project level) are scaffolding
meant to die at merge time. Their content has exactly two intended exits: effect a code change, or
land in `AGENTS.md`/`README.md`. Content that does neither is dead weight and should be removed at
merge time. This reframes the default treatment of these files from "permanent reference" to
"transient by design."

Now lives in `AGENTS.md` §'Rolling context files (project-level)' and `AGENTS.md`
§'Documentation layers > Agent docs'.

---

## 2026-04-27 — Five-file restructuring

**What changed.** `AGENTS-HINTS.md` was compressed from 382 to ~196 lines. `docs/GOTCHAS.md` (5
entries) was merged into `AGENTS-HINTS.md` and deleted. The `docs/` directory at the user-config
level was removed — it was a category mistake: `docs/` is for project rolling-context, not
user-level agent infrastructure. Two new files were created: `AGENTS-LOG.md` (this file) and
`AGENTS-REASONING-HINTS.md` (deep companion to `AGENTS-REASONING.md`).

**Why.** `AGENTS-HINTS.md` was doing three jobs simultaneously: (1) referential framings consulted
during normal work, (2) dated changelog of infrastructure decisions, (3) deep dialectic material
(Dupin decomposition, hi-fi analogy, abductive four-step). Three jobs pull the file in three
register-directions at once. Splitting along register boundaries respects the same principle that
motivated the 2026-04-23 and 2026-04-24 splits: mixed-register files cause attention pollution; the
cost of more files is small explicit Reads.

**Five-file architecture:**

- `AGENTS.md` — auto-loaded everywhere; transactional rules.
- `AGENTS-REASONING.md` — loaded by judgment-bearing agents; reasoning-register rules in force.
- `AGENTS-HINTS.md` — referential framings consulted during normal work.
- `AGENTS-REASONING-HINTS.md` — deep companion to `AGENTS-REASONING.md`; loaded for impasse, very
  deep thought, or delicate uncertainty.
- `AGENTS-LOG.md` (this file) — dated changelog; loaded only during meta-restructuring.

**Captured framing.** "Register matters more than file count — splitting agent docs along register
boundaries (transactional / reasoning-register-in-force / referential-during-work / changelog /
deep-companion) is principled even when it means more files, because the cost of mixed-register
files is attention pollution while the cost of more files is small explicit Reads."

**Tradeoff acknowledged.** Capture-time decisions now have five buckets instead of three, but the
bucket purposes are crisply distinguishable so the navigation cost is small.

---

## 2026-05-02 — OpenCode infrastructure audit: renames, @general pin, permission tightening

Three-thread audit of `~/.config/opencode/` against 14 days of session-store data (499 sessions,
40,917 messages). Threads 1+2 ran on Sonnet against the SQLite store; Thread 3 (this entry) ran on
Opus and executed the agreed actions.

**What changed.**

1. **`@plan-strict` → `@plan-deep`.** The `deep` register matches the T0 reasoning posture (deep
   exploration, deep dialectic via REASONING-HINTS) better than `strict`, which read as
   permission-strict rather than reasoning-strict. File renamed; references updated across
   `AGENTS.md`, `AGENTS-REASONING.md`, `AGENTS-REASONING-HINTS.md`, `agent/build.md`,
   `agent/explore.md`, `agent/rebase.md`, `command/doc-style-audit.md`,
   `command/opencode-config.md`, `command/tier-retrospective.md`. Historical references in this
   changelog are preserved verbatim (see 2026-04-23 and 2026-04-24 entries).

2. **`@research-findings` → `@verify`.** Outcome-neutral name with single-syllable parity against
   `@build`/`@explore`/`@rebase`. The typed-fork-name contract is load-bearing — a verifier
   subagent's name should signal its job before the prompt is read. Considered and rejected:
   `@affirm` (too positive), `@check` (too generic), `@audit` (heavier formal-review register and
   collides with this audit's filename), `@review` (collides with OpenCode's built-in code-review
   slot). File renamed; references updated in `AGENTS.md`, `AGENTS-REASONING.md`,
   `command/address-review.md`, `command/tier-retrospective.md`. Considered and rejected: merging
   `@verify` into `@explore`. Distinct purposes — `@explore` is open-ended survey, `@verify` is
   claim-against-code adjudication. Merging would lose the typed-fork-name signal.

3. **`@general` instantiated as a Sonnet-pinned override.** The built-in `@general` inherits the
   caller's model. Audit data showed 26 sessions in 14 days where `@general` ran on Opus by silent
   inheritance from a `@plan-deep` (then `@plan-strict`) primary — paying T0 cost for routine
   multi-step work. Created `agent/general.md` with `model: anthropic/claude-sonnet-4-6` and
   `mode: subagent`. The pin makes the inherited-Opus failure mode impossible by config, not by
   reminder. Considered and rejected: an Opus-pinned `@general-deep` variant. The audit data
   showed no legitimate Opus-tier `@general` usage — only accidental inheritance. Opus-tier
   multi-tool work belongs in the primary `@plan-deep` session, not in a fork.

4. **Permission tightening.** `opencode.json` gained read-only allows for
   `git branch *`, `git remote -v`, `git worktree list *`, `git reflog *`, `pwd`,
   `gh auth status *`, and hard-denies for `grep *`, `rg *`, `find *`, `cat *`, `sed *`,
   `awk *`, `* | head*`, `* | tail*`. The deny set is the load-bearing change: 6,142 grep,
   1,915 tail-pipe, 1,590 head-pipe, 716 sed, 338 cat, 232 find invocations all-time despite
   AGENTS.md forbidding them — the "ask" gate did not differentiate the anti-pattern from
   legitimate bash use, so the prompt drained the rule's salience instead of enforcing it.
   Hard-deny moves enforcement out of the prompt and into config.

**Why this framing is worth preserving.** Three independent subitems with the same shape: the
existing mechanism (description, prompt rule, inheritance default) failed to enforce the intent,
because enforcement lived in the wrong layer (in the agent's reading of the prompt, not in the
config). The fix in each case was to move enforcement into config — typed names, model pins,
hard-denies. *If a rule is being violated chronically and there is a config layer that could
encode it, the prompt-layer reminder is not the fix.* This generalises beyond OpenCode to any
LLM-orchestration system with a tiered prompt/config split.

**Tradeoffs acknowledged.** The hard-deny patterns are conservative: OpenCode's matcher is
prefix-anchored, so the pipe-tail patterns (`* | head*`) may not catch every variant. The
load-bearing denies are the leading-token ones (`grep *`, `cat *`, etc.) which are
unambiguously matched. The `@general` pin removes the (rare, accidental) case where Opus on a
multi-tool fork might genuinely have helped — that work now stays in the primary session, which
is where the audit data says it should live anyway.

**Out of scope for this audit, deferred.** Long-session split discipline (user behaviour, not
config). `@review` underuse (no action). Lenses-as-skill (re-evaluate when OpenCode skill
infrastructure is exercised more broadly).

---

## 2026-05-04 — Style-audit command rename; STYLE-TEST.md added

Style-audit commands renamed to a common `style-audit-*` prefix so they sort lexicographically
together as the command list grows: `/code-style-audit` → `/style-audit-code`, `/doc-style-audit` →
`/style-audit-doc`. New `/style-audit-test` (STUB) added as the test-code equivalent. Flat command
tree retained — the prefix gives the namespace clustering without paying the subdir mental tax.

New `STYLE-TEST.md` carries test-specific mechanical rules (pytest, pyfakefs, pytest-mock, the
`tests/unit/` vs `tests/integration/` split, fixture/parametrize/`conftest.py` discipline). All
`STYLE-CODE.md` conventions still apply to test code; `STYLE-TEST.md` adds, never relaxes.
Philosophy and structuring sections left as TODO stubs — same growth pattern as `STYLE-CODE.md`.
The `STYLE-CODE.md` `## Test philosophy` stub now redirects to `STYLE-TEST.md`. AGENTS.md document
loading rules table gained a `STYLE-TEST.md` row; command roster updated with the three new names.
Historical `Renamed from /docs-cleanup` breadcrumb dropped from the roster — two renames deep, the
note is more confusing than useful, and this changelog carries the audit trail.

---

## 2026-05-31 — /config-retrospective collapsed to a single-session, simplicity-led audit

The command was a three-thread machine: Threads 1+2 (permission-flow + usage-pattern) ran from a
Sonnet primary via an `@explore` fork, Thread 3 (configuration cohesion) was a *manual hand-off* to
a fresh `@plan-deep` session, and a workspace-transient `~/PLAN-opencode-audit.md` file bridged the
session boundary. Reworked into one `@plan-deep` session that forks `@explore` for the data-mining,
runs the cohesion review in-context, gates changes through the Question tool, and dispatches
`@build`/`@general` to action approved edits — committed via the existing `/update-config`
convention.

**Why.** Three coupled problems. (1) The home-dir carrier file existed *only* to bridge the
primary-session transition, which can't be forked. Collapsing to one session deletes the file and
its lifecycle ceremony outright. (2) Thread 3 — the judgment about whether the file family stays
coherent and minimal — was the genuinely valuable thread, yet it was deferred and under-specified.
Promoting it to the spine, with Threads 1+2 demoted to evidence feeding it, puts the Opus reasoning
where the cost-of-wrong actually lives. (3) The command should model what it audits; it dropped from
194 to ~130 lines by cutting the cross-session bridge and duplicated constraint blocks.

**The relentless-simplicity lens is now explicit:** fewest files, minimal content, coherent
disposition. Telemetry is kept (not dropped) because usage/config *divergence* — a command never
invoked, a permission rule that never fires, an agent doing the wrong tier's work — is the signal
that tells you a file has stopped earning its keep. The verdict is simplicity; the data is evidence
for it, not an end in itself.

**Alternatives weighed.** Dropping telemetry entirely (rejected — loses the divergence signal);
keeping the two-session split (rejected — the carrier file and hand-off ceremony were the main
cost); full autonomous-chain `@committer` commits (rejected — reuses the human-gated `/update-config`
path rather than inventing a parallel autonomous-commit chain for config files).

---

## 2026-05-31 — Config audit (theme: autonomous multi-sessions)

A `/config-retrospective` run themed on "how are the autonomous multi-sessions going?" Two read-only
`@explore` forks mined the session store; the cohesion review stayed in the Opus primary.

**Headline finding (kept, not changed):** the autonomous-chain machinery works and was exercised
under real load. Two `/run-plan` invocations (both 2026-05-30, `image-annotator`); the larger drove
a 12-session / 10-commit chain (S0–S11) to completion in ~7.5h with zero unplanned halts, 259 tests
green, mypy strict clean. All 14 `@committer` sessions committed, zero refusals, zero scope drift.
`run-plan.md`, `committer.md`, and the autonomous-chain carve-out are earning their keep — not
aspirational dead weight. Opus orchestration was 43% of chain cost ($14.22 of $32.91), defensible
given the verify-between-dispatches work but the number to watch if chains lengthen.

**Changes made:**

1. **opencode.json — closed the `write` deny gap for `~/.config/opencode/**`.** The `edit` block
   denied the runtime mirror but `write` had no rule and fell through to the global `ask`; the store
   showed a build agent had actually *written* `run-plan.md` into the mirror. Added a `write` deny
   mirroring `edit`, globally and in the build override. Alternative weighed: rely on the `ask`
   prompt (rejected — a silent gap that already fired once).

2. **AGENTS.md — registered `multisession/multi-session-planning.md` in the load-rules table.** The 340-line
   field manual underpinning `/run-plan` was orphaned from dispatch (read only twice, both
   plan-deep, not in the table). Registered rather than absorbed or deleted: the content is durable
   and the two-frame model has no better home. Alternative weighed: fold into `run-plan.md`
   (rejected — loses the field-manual register).

3. **command/config-retrospective.md — rewrote the stale schema crib.** The crib omitted
   `session.agent/model/parent_id/cost` (the columns that made this very audit's theme analysis
   possible) and *wrongly implied permission events are stored*. They are not: the standalone
   `permission` table is empty and no permission `part` rows exist — only rule-denied / user-rejected
   residue survives in tool-part `status`. Corrected the crib so the next audit doesn't re-pay the
   re-derivation tax or chase phantom permission logs.

4. **Deleted command/format-check.md.** A redundancy fork found it a strict subset of
   `/format-loop` (same detect→fix→rerun loop and convergence guard; it escalates to the full
   `format` target anyway, making "check" cosmetic). Removed its roster row and extended
   `/format-loop`'s entry to note check-only via arguments. Alternative weighed: keep for the
   check-only entry point (rejected — the affordance survives as a `/format-loop` argument).

**Deliberately NOT changed:** the over-broad `grep`/`rg` bash denies (a documented, intentional
conservative tradeoff — the matcher is glob-prefix-anchored and the comment already says so); the
two `style-audit-*` STUBs (incomplete, not redundant — they have a defined future role under
`/style-audit`); the dozen rare-occasion commands with zero invocations (frequency is the wrong
metric — they earn their keep by existing when the occasion arrives). A one-off `session-scan` read
of a T0/T1 doc and duplicate session-level deny rules were fork-prompt/runtime artifacts, not
file-family defects, so no config change.

---

## Absorption records — content moved into canonical homes

- **Scale-adaptive rendering with collapse manifest** (2026-04-23 to 2026-04-26 in HINTS) →
  absorbed into `AGENTS-REASONING.md` §'Response scale' on 2026-04-27. The collapse-manifest
  mechanism survives there verbatim.
- **Capability allocation hi-fi analogy** (2026-04-25 in HINTS) → absorbed into
  `AGENTS-REASONING.md` §'Capability allocation > Analogy (reloadable handle)' on 2026-04-27.
- **Rolling-context lifecycle rule** (2026-04-26 in HINTS) → absorbed into `AGENTS.md` on
  2026-04-27.

---

## 2026-06-09 — Fable tier (T-1) added; @plan-deep retired; Opus normalised to 4.8

**Context.** Anthropic's Claude Fable 5 is ~3× Opus 4.8 (~$0.01/$0.05 per 1k in/out vs
~$0.0035/$0.0175). The user's stated value proposition for the premium is narrow: interactive
dialectic at the generative extremity — genesis of framings that don't yet exist, pivotal anomalies
that resist all canonical options, abductive leaps. Everything else — audits, phase planning,
cross-cutting reviews — stays on Opus 4.8.

**Changes:**

1. **New `agent/dialectic.md` (T-1/Fable 5, temperature 0.6).** Primary agent for the extremity
   charter. Loads `AGENTS-REASONING-HINTS.md` proactively (vs on-demand at T0). Charter explicitly
   scoped to interactive dialectic; NOT-for list explicitly names `@plan` for analytical T0 work.
   Write permissions identical to old `@plan-deep` (rolling-context docs only).

2. **New `agent/plan.md` (T0/Opus 4.8) — overrides built-in plan agent.** Full body override
   carrying the T0 reasoning register. Replaces `@plan-deep` for all analytical T0 work: audits,
   phase planning, rebase plans, shard-plan. Charter retains the six plan-deep operating
   principles; NOT-for list distinguishes `@dialectic` (generative frontier) from `@build`
   (implementation). The decision to promote the built-in plan override rather than just renaming
   plan-deep: the user wanted Opus 4.8 at the `@plan` slot specifically to make it the natural
   first escalation from `@build`, consistent with the built-in mode name.

3. **Deleted `agent/plan-deep.md`.** Fully superseded by `agent/plan.md` (T0 analytical) and
   `agent/dialectic.md` (T-1 generative). Historical mentions in AGENTS-LOG.md untouched.

4. **`agent/plan-juncture.md` model bumped from 4.5 → 4.8.** Normalised to current Opus. The 4.5
   pin was a drift artefact — the juncture adjudicator is the most consequential single judgment in
   `/run-plan`, and there was no reason to leave it on a prior-generation model.

5. **`AGENTS-REASONING.md` T0-only marker → T-1/T0-only.** Both Fable and Opus read the
   below-marker material (modes of inference, four-step abductive decomposition). T1 agents stop
   at the marker unchanged. Escalation pointers updated from `@plan-deep` to `@plan` /
   `@dialectic` by failure mode.

6. **`AGENTS-REASONING-HINTS.md` tier gating updated.** `@plan-deep` → `@dialectic` and `@plan`.

7. **`AGENTS-ROSTER.md` and `AGENTS-HINTS.md`** updated throughout: T-1 tier entry with
   cost rationale, all `@plan-deep` references replaced, Opus version drift corrected (4.7 → 4.8).

8. **Commands updated:** `shard-plan` (`agent:` frontmatter + prose), `run-plan`, `commit`,
   `config-retrospective`, `update-config`, `style-audit-doc`, `tier-retrospective` (added T-1
   row; fixed stale `@rebase` → `@git-editor`).

9. **`multisession/multi-session-planning.md`** — single `@plan-deep` reference replaced.

**Alternative weighed:** promoting `@plan-deep` to Fable rather than creating a new agent and
keeping Opus at `@plan`. Rejected because: (a) most `@plan-deep` work is analytical, not
generative — paying 3× Fable premium for audits and phase plans has no quality return; (b) the
user's stated bar for Fable is the "extremity of cognition" + "adduction" (interactive dialectic
shape), which is categorically narrower than the old `@plan-deep` charter; (c) having a named
`@plan` at Opus keeps the natural `@build` → `@plan` escalation gradient at a cost step the user
finds justified (~1.2× Sonnet), while Fable is explicitly an opt-in for rare sessions.
