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

---

## 2026-06-10 — @plan renamed @architect; built-in plan disabled

**Context.** The reserved OpenCode agent name `plan` carries a built-in, injected read-only system
reminder that is independent of `mode:` frontmatter and of the `permission` JSON in `opencode.json`.
The reminder asserts precedence over all agent prose, including per-agent permission overrides. As a
result, the `agent.plan.permission` block introduced in the 2026-06-09 session — intended to grant
`@plan` write access to rolling-context docs (`docs/PLAN.md`, `docs/NOTES.md`, `docs/ROADMAP.md`)
— was silently defeated. `@plan` refused edits in any repo. No amount of permission JSON or prose
softening can remove OpenCode's injected reminder; the only fix is to vacate the reserved name.

Confirmed: OpenCode 1.17.0. The reminder is not in any config file (Grep clean); it is runtime-injected
for any agent occupying the `plan` slot. The same applies to `build`.

**Changes:**

1. **`agent/plan.md` → `agent/architect.md`.** No changes to file content; the filename is the only
   thing triggering the reserved-name injection.

2. **`opencode.json` `agent` block:**
   - `"plan"` key renamed `"architect"`.
   - Permission ordering fixed: the `~/.config/opencode/**` deny is now listed **before** the
     `docs/*.md` allows. OpenCode uses last-match-wins; the old ordering let the deny shadow the
     allows (Defect 1 from the diagnosis). Now docs/*.md wins everywhere, including inside the
     config repo accessed via the symlink.
   - `"plan": { "disable": true }` added to suppress the built-in vanilla plan agent, which would
     otherwise reappear in the Tab-cycle and `@` roster once our override vacates the name.

3. **Prose updated** throughout: `AGENTS-ROSTER.md`, `AGENTS-REASONING.md`, `AGENTS-REASONING-HINTS.md`,
   `AGENTS-HINTS.md`, `agent/build.md`, `agent/dialectic.md`, `agent/git-editor.md`, `agent/general.md`,
   `agent/explore.md`, `agent/committer.md`, `command/shard-plan.md` (incl. `agent:` frontmatter),
   `command/run-plan.md`, `command/config-retrospective.md`, `command/tier-retrospective.md`,
   `command/update-config.md`, `multisession/multi-session-planning.md`.
   AGENTS-LOG.md history entries left unchanged (historical record).

4. **`AGENTS-ROSTER.md` multisession-subsystem note** rephrased: removed stale "share the `plan-*`
   prefix convention" language (no longer accurate with `@architect` in the group).

**Capture:** reserved OpenCode agent names (`plan`, `build`) carry injected read-only/full-access
behavior that the permission system and prose cannot override. An agent that needs non-default
permissions must use a non-reserved name.

---

## 2026-08-04 — Contract-vs-transcript audit; command-layer retrenchment

`@architect` audit of all command files against a single admission test: does this command carry
knowledge the agent cannot rederive from the standing contracts? A command that merely transcribes
what the contract layer already produces is negative-value — it duplicates, drifts, and drains
salience.

**What changed (5 commits).**

1. **Deleted 4 commands.** `update-config` — symlink-routing and runtime-artifact rules already in
   `AGENTS.md`. `tier-retrospective` — questionnaire never exercised; `AGENTS-LOG.md` preserves the
   idea. `style-audit-code` and `style-audit-test` — STUBs whose intended shape is rederivable.
   Repointed `AGENTS.md`, `AGENTS-ROSTER.md`, and the `STYLE-CODE/STYLE-TEST` Audit-invocation
   sections to the collapsed `/style-audit` entry.

2. **Compressed `/commit` from 98 to 39 lines.** The non-derivable core is the interactive
   draft/approve loop itself; everything else (split-proposal protocol, scripted ticket stop-and-ask,
   constraints block restating `@committer` refusal rules) was derivable from `AGENTS.md` and
   `agent/committer.md`.

3. **Style-audit articulation re-homed into `STYLE-DOC.md` `## Audit checklist`.** `style-audit-doc.md`
   restated STYLE-DOC rules as 13 inline categories, violating its own do-not-restate constraint.
   Additive categories (legacy code, phase markers, rolling-context lifecycle verdicts, proposal
   taxonomy) now live in the contract so any agent can audit from it. `/style-audit` rewritten as a
   lean single entry point (61 lines); `style-audit-doc.md` deleted.

4. **Compressed `/config-retrospective` from 205 to 80 lines.** Schema crib (SQLite layout,
   `millisecond-epoch`, permission-decisions-NOT-logged trap) kept verbatim as the non-derivable
   core. Threads reduced to three one-line questions; Steps compressed to 7 lines; `/update-config`
   references replaced with direct-edit + `@committer` phrasing.

5. **Pointer-rot sweep.** `AGENTS-HINTS.md`: restored `## The hi-fi analogy` (~15 lines, the
   fuller unpacking of the capability-reserve handle in `AGENTS-REASONING.md`); fixed
   §"Subagent prompt anatomy" pointer (`AGENTS.md` → `AGENTS-SUBAGENT-STRATEGY.md`); fixed
   §"Capture-candidate collaboration shape" pointer (`AGENTS.md` → `AGENTS-CAPTURE.md`).
   `agent/build.md` closing line repointed to the actual homes (ROSTER, SUBAGENT-STRATEGY, SESSION,
   CAPTURE). `command/explore.md` intro repointed to `AGENTS-SUBAGENT-STRATEGY.md`.
   `command/note.md` step-2 taxonomy replaced with references to `AGENTS-CAPTURE.md` +
   `AGENTS-SESSION.md`.

**The captured framing (admission test).** A command earns its existence only by carrying knowledge
the agent cannot derive from the standing contracts — a schema crib, a hazard playbook, a
loop-termination policy, a register specification. The retrenchment enriches contracts and thins
invocations.

**Alternatives weighed.** Delete `/commit` outright — rejected: it is the interactive entry to the
single-commit-primitive (`@committer`) shared with autonomous chains; the refusal taxonomy runs on
every commit path from one definition; the Haiku tail is a small context-cleanliness win. Keep
`/style-audit` as a fan-out to three child audits — rejected: articulation re-homed to the contract
(`STYLE-DOC.md`), making the fan-out unnecessary; one entry point, zero stub-bounces.

## 2026-09-14 — Model pins bumped: Sonnet 4.6 → 5, Opus 4.8 → 5, Fable 5 → 5.1

**Context.** Anthropic shipped Claude Sonnet 5, Opus 5, and Fable 5.1 (confirmed available via
`opencode models`); Haiku 4.5 remains current at T2, so it is untouched.

**Change.** Every `model:` frontmatter pin and the `opencode.json` default bumped to the new
release at the same tier: `agent/build.md`, `agent/explore.md`, `agent/general.md`,
`agent/verify.md`, `agent/git-editor.md`, `agent/plan-admin.md` (Sonnet 4.6 → 5);
`agent/architect.md`, `agent/plan-juncture.md` (Opus 4.8 → 5); `agent/dialectic.md`
(Fable 5 → 5.1). Prose version mentions updated in step (`AGENTS.md`, `AGENTS-REASONING.md`,
`AGENTS-HINTS.md`, `AGENTS-ROSTER.md`, `agent/architect.md`, `agent/dialectic.md`,
`command/commit.md`, `command/config-retrospective.md`, `command/plan-shard.md`,
`command/roadmap-construct.md`, `opencode.json` comment) including the co-author identity-string
examples (`AGENTS-ROSTER.md`, `agent/committer.md`, `command/commit.md`) — those are illustrative
defaults, not load-bearing history, so they track the current pin.

**Left alone.** `AGENTS-LOG.md`'s own prior entries keep their historical version numbers
(4.5, 4.7, 4.8, "Fable 5") — this file is append-only and a past entry's job is to record what was
true at the time, not to track the current pin.

## 2026-10-29 — Model pins bumped to 5.5; T-1 moves from Fable 5.1 to GPT-6 Astra

**Context.** Anthropic shipped Claude Sonnet 5.5, Opus 5.5, and Haiku 5.5 (confirmed via
`opencode models`). Separately, the user chose to move T-1 (`@dialectic`) off Claude Fable 5.1 to
OpenAI's GPT-6 Astra — the first cross-family pin in the tier ladder.

**Change.** Every `model:` pin and the `opencode.json` default bumped within tier: Sonnet 5 → 5.5
(`build`, `explore`, `general`, `verify`, `git-editor`, `plan-admin`), Opus 5 → 5.5 (`architect`,
`plan-juncture`), Haiku 4.5 → 5.5 (`committer`, `session-scan`); `dialectic` →
`openai/gpt-6-astra` (base variant, not Pro/Fast). Prose version mentions and co-author examples
updated in step, as in the 2026-09-14 entry. Model-family-generic phrasing ("Fable-scale reserve",
"Fable/Opus-scale") rewritten tier-relative ("T-1-scale", "T-1/T0-scale") so the next T-1 swap
doesn't need a prose sweep. Cost ratios recomputed from listed prices: Astra matches Fable's
$10/$50 but Opus 5.5 dropped to $4/$20, giving ~2.5× Opus / ~5× Sonnet (the prior "~14× Sonnet"
figure was already stale against Sonnet 5's $2/$10).

**Left alone.** Prior log entries; `PLAN-V2-PERMISSIONS.md` (in-flight plan doc, its Haiku 4.5
probe-agent references belong to that plan's own execution).

## 2026-11-03 — V2 migration closed out: permission study, patch, guidance reconciled

**Context.** The V2 conversion (commit 00cea9b) left one open question: on 2.0.32 forked
`committer`/`session-scan` performed effects their own `deny` rules forbid. A separate harness
(`~/Source/opencode-permtest`) measured permission resolution on 2.0.32 and, after the runtime
moved, re-measured on 2.2.5. Its findings, evidence classes and patch are authoritative there.

**Migration record (previously `PLAN-V2-MIGRATION.md`, now retired).** Renames `agent/`→`agents/`,
`command/`→`commands/`, `subtask`→`subagent`, `disable`→`disabled`; `opencode.json` and the
`committer`/`git-editor` frontmatter flattened to native `permissions` lists (V1 already resolved
last-match-wins, so no precedence change; actions `bash`→`shell`, `task`→`subagent`, `edit`+`write`
merged); the V1 `tools: {write,edit: false}` maps to no V2 field, so `explore`/`verify`/
`session-scan` got an `edit` deny instead. `lsp`/`list`/`todoread`/`todowrite` allow rules were
carried over; the 2.2.5 load check named none of them, so they stay.

**Outcome (version-scoped; see `NOTES.md` for labels and limits).** 2.0.32 only: `temperature`
beside `permissions:` disabled that agent's rules (4 of 4), the leading but unproven explanation of
the incident. 2.2.5: `temperature` is ignored with a warning and the tested agent permissions are
enforced; a forked subagent evaluates its own rules and never its parent's. The `a2f02d3` patch
removed nine `temperature` fields and the three `~/.config/opencode/**` edit denies (an owner
decision; `build` can now edit the live config without a prompt). Several own-deny cells hold by
loaded-config verification, not refused calls. Saved-allow versus deny is unmeasured.

**Also changed.** `commands/config-retrospective.md` carried a V1 store layout; rewritten to a
demonstrated 2.2.5 recipe (read API first; `session_v2`/`session_message` for bulk queries) after
API-versus-store agreement checks. `PLAN.md` handoff reconciled: plugins ported and loaded, real V2
delivery pending. Staging plan `PLAN-V2-PERMISSIONS.md` deleted (superseded by the harness repo's
plan; its dropped symlink-matching and upstream-report rows are open items in `NOTES.md`).

**Left alone.** Earlier entries (including "runtime mirror" wording: `~/.config/opencode` is a
symlink to this repository), `AGENTS-HINTS.md` (proposed corrections are in `NOTES.md` awaiting
per-item approval), and the owner's intent to narrow `build`'s write access to the config directory.

## 2026-11-05 — Session-economics and editor plugins: bounded live acceptance on 2.2.5

**Context.** The plugins had deterministic tests and a fresh-server loading check, but no observed
delivery on a real model run. The owner authorized a bounded run: $2.00 total, `claude-haiku-5-5`
for every call, a private server with an isolated HOME/XDG tree and sandbox, stop at $1.50 of
independently measured spend.

**Outcome (details and labels in `PLAN.md` → "Live acceptance").** Version tuple CLI 2.2.5, shared
service 2.2.5 (untouched), private server 2.2.5, managed plugin package 2.0.32, unchanged at the end.
Both plugin IDs were active; observe and advisory initialization logged; the editor hook set
`EDITOR`/`VISUAL`/`GIT_EDITOR`/`GIT_SEQUENCE_EDITOR` to `true` and `PAGER` to `cat`; a plugin reload
left no duplicate work. A foreground `subagent` produced a `task-boundary` report with the verified
child ID and non-null cost/steps; a background launch produced none. The report counted all but the
child's final step (that event arrived milliseconds after the hook), as its label discloses. With
lowered disposable thresholds, persisted notices appended once each, an image attachment survived,
and the parent got one task report. Independently read spend: $0.0042 over 16 steps, Haiku only.

**Findings that change earlier records.** `session.step.ended` carried an envelope `location` on the
public event stream, contradicting the host-source inference that it carried none; the adapter
accepts both shapes, so no code changed. V2 reads provider credentials through its credential API,
not `auth.json`, so a private server needs a connected credential.

**Not covered.** Foreground-moved-to-background, production-threshold crossings, other-location
isolation, symlink-reload behavior, any savings or comprehensive permission claim. The disposable
tree and its credential were deleted; no plugin, library, test, config or package file changed.

## 2026-11-05 — Rolling plans retired; permission harness frozen

**Context.** The V2 closeout chain finished and the session-economics plan had met its acceptance
criteria (guidance, monitor, V2 port, bounded live acceptance). Both files were rolling context with
no remaining executable work, and keeping them risked treating their history as current guidance.

**What changed.** `PLAN.md` and `PLAN-V2-CLOSEOUT.md` were deleted; the last commit containing both
is `2f95079` (`git show 2f95079:PLAN.md`, `git show 2f95079:PLAN-V2-CLOSEOUT.md`). Live content moved
to `NOTES.md` (2.2.5 plugin host contract, live-acceptance summary, open items) and `IDEAS.md` (the
approved-but-unbuilt metadata-only economics report with its ALIGN acceptance baseline, plus the cache
TTL and leading-`cd` research items). Two stale location comments in the economics monitor were
corrected. `~/Source/opencode-permtest` is frozen, not deleted: its history exists nowhere else
(its bare remote holds no refs) and it is the natural harness for the still-unmeasured symlink-deny
and saved-allow questions.

**Left alone.** Earlier entries, including the two that cite `PLAN.md` sections: their pointer is
resolved by this entry. Owner-owned items remain in `NOTES.md` "Open items".

## 2026-11-05 — Config-directory edit policy and permission hardening

**Context.** `NOTES.md` carried two owner items: narrow `build`'s write access to the config
directory (after measuring symlink-deny matching) and an optional hardening list.

**Measured (2.2.5; `opencode-permtest/docs/FINDINGS.md`, new section).** A path rule matches only the
spelling it names; tools pass project-relative paths inside the project and absolute paths outside it,
and resolve no symlink. Project-layer rules did not reach `build`. A saved `edit *` allow turns `ask`
into allow; a config `deny` held. A shell allow matches its redirected form (`git diff > f`). About
$0.05 of the $1.00 authorized went to Haiku probes; the rest was model-free rule evaluation.

**Changed.** `opencode.json`: `build` asks on both spellings of the config directory; environment-file
read defaults restored; four no-op actions removed. Agents: read-only shell allowlists for `explore`,
`verify`, `session-scan`; `general` states its `edit ask` and asks on redirects; `committer` loses a
no-op rule. Not committed; verified by rule evaluation, not by live tool calls.

**Left alone.** In-project editing of this repository by `build`, redirects for `build`/`architect`/
`committer`/`git-editor`, the global `git branch *`/`git reflog *` allows, the `request.body` wire
question: all listed in `NOTES.md` "Open items".

## 2026-11-07 — Permission friction: one implementation worker, output filters, scoped exceptions

**Context.** A driver run (rDLP) showed task/permission contradictions, not intermittent
enforcement: four shell denials for forbidden `cat`/`grep`, `Agent build cannot run as a subagent`
(so every implementation child ran as `general`), committers attempting forbidden diff/grep scans,
and `@plan-admin` PLAN writes depending on prompts. The denials were correct under the rules; the
rules and the tasks disagreed.

**Changed.** `build` is `mode: all` with one bounded mandate (implement, own the test/fix loop,
report to the caller; no planning, chain orchestration, history rewriting, or self-commit), and
`general` is demoted to miscellaneous work, not a fallback coder; roster, `/plan-run`, `plan-admin`,
`config-retrospective` and the planning manual route implementation to `build` only. Global shell:
`grep`, `head`, `tail` allowed, the stale `* | head*`/`* | tail*` denies removed; the tool-discipline
rule is now "native tools for files, filters for command output" with the no-other-interpreter
clause. `committer` gains `grep *` and a recipe with separate tracked (`git diff HEAD -G`) and
untracked (`grep -lE`) scans and explicit exit-status handling. `explore` gains exactly
`opencode api session.list *` and `session.message.list *`; the retrospective crib drops the
redirect advice, fixes the `parentID` linkage sentence and the pagination contract, and keeps SQLite
as the orchestrator's backed-up fallback. `plan-admin`/`plan-juncture` get `edit docs/PLAN.md`.

**Accepted tradeoffs.** Command-name rules cannot confine `grep`/`head`/`tail` to stdin, so
occasional file reads through them are tolerated; none of this is a filesystem sandbox. The
explorer can read sensitive session history; it cannot mutate. The PLAN allow is file-level:
section limits stay procedural.

**Verified (2.2.5).** Private-server rule evaluation (no model call): 86 cases across the six
roles matched expectations, except one case that tested the evaluator rather than the config
(a whole `ls | head` string; it takes resources as given and does not split pipes) (negative cases for other API operations, redirects, forbidden edits and
Git operations included). Shared service reloaded once (`location.reload`, user-approved): loaded
`build` is `all`/pinned, new rules present. Fixture scans: dirty/clean/missing/bad-regex/bad-rev
statuses behaved as the recipe states. In the live shell, a quoted `|` was not split and a real pipe
into `cat` was denied. **Not verified:** a live `committer`/`explore` call (needs a paid run), and
the evaluation API does not run the shell scanner, so the exact recipe under `committer`'s rules is
inferred from the scanner behavior above. A saved-allow against a configured deny stays unmeasured.
Existing saved approvals (rDLP: `edit *`, `grep *`, `head *`, `tail *`, `python3 *`, `cat *`,
`echo *`) were reported, not revoked.

## 2026-11-07 — Follow-up: stale-claim sweep, edit-error diagnosis, directory guidance

**Stale claims at boundaries.** In an rDLP run a claim about a norm map survived in unchanged prose
after a claims-correction sub-track, though the new tests refuted it; the anneal denylist cannot see
obsolete assertions in ordinary domain language. The planning manual gains "Claim verification is
not annealing". `/plan-run` step 7 has the driver gather the sub-track's superseded claims (digest
and ledger) and `file:line` search candidates before the existing boundary fork; the fork classifies
each as contradiction, historical quotation, or keyword match; contradictions get one `@build`
correction under the existing Fix-loop budget, an unresolved one halts as non-convergence, and one
that would breach a contract or intent is the existing `drift-HALT`. No new verdict, phase, or loop;
`plan-admin` and `plan-juncture` reconciled. Cost accepted: semantic review of affected claims only.

**Edit-error diagnosis (no mitigation).** Two failed edits in a build session recorded the keys
`path`, `oldString`, `new String`; the retries used `newString`. The validation error did not show
the unrecognized key, so the failure looked like a missing argument. It was a misspelled field, not
a permission rejection. Provider-side schema constraints and argument generation were not
inspected: no provider or runtime bug is claimed, and no reminder, alias, auto-repair or config
change was added. A clearer unknown-key diagnostic is a possible upstream report, not filed.

**Directory guidance.** The shared rule claimed a `cd`'d subprocess "has no memory"; `cd dir &&
cmd` does work inside its call, and neither it nor `workdir` relocates a session. `AGENTS.md` now
states the V2 behavior (checked against the tools and commands pages): `workdir` is per call, file
tools take explicit paths, `session_move` relocates, a prompt's "Working directory:" is an
instruction, and slash-command `!` blocks run outside agent permissions. Six agent files drop their
duplicated BAD/GOOD `cd` examples for a one-line pointer; `format-loop`/`plan-anneal` soften
"never". The stale `filePath` Read example in `build` is now `path` (real drift, unrelated to the
edit failures). `AGENTS-HINTS.md` and earlier log entries still carry the old wording; not edited.

**Checked.** Wording against the V2 tools/commands pages and the loaded schemas; repository search
for surviving "never `cd`", "subprocess cd", and `filePath`: only `AGENTS-HINTS.md`, this log, and
`PLAN.md` remain. Documentation only: no live-agent run, no permission change.

## 2026-11-08 — Shell permissions simplified: default-allow, a few consent gates

**Context.** Denials kept hitting compound and complex shell expressions that had nothing to do with
file access. Cause: V2 checks every extracted subcommand, so a global `shell * ask` with a short
allowlist, hard denies on `cat`/`sed`/`awk`/`find`/`rg`, and `shell * deny` allowlists in `explore`,
`verify`, `session-scan` and `committer` made any pipeline with one unlisted part fail (a deny, not a
prompt, in the restricted roles). Each fix since 2026-05-02 widened an allowlist for one more
symptom. `AGENTS-HINTS.md` also still taught the V1 "whole string" model and advised splitting
commands into separate calls.

**Changed.** `opencode.json`: `shell * allow`, with `git push *` deny and `git commit *`,
`git reset --hard *`, `git clean *`, `sudo *` ask; the read-only allowlist, output-filter allows,
tool-preference denies and mypy/py_compile allows are gone. `explore`/`verify`/`session-scan` keep
only `edit * deny` and state "read-only" as a prompt contract; `general` drops its redirect asks;
`committer` and `git-editor` allow `git commit *` and keep their history-shaping denies (`git-editor`
also keeps `git push` deny and its `edit`/`subagent`/`webfetch` rules). `AGENTS.md`, `build.md`,
`general.md`: native-tool preference is guidance, not a restriction; a denial or scanner rejection
is reported, not rephrased. `AGENTS-HINTS.md` permission section rewritten (tripwires, per-subcommand
checking, scanner errors as a separate class).

**Why.** The harness is not a security boundary: rules match command text, not effects, so every
allowlist was both incomplete (redirects, interpreters, `env`) and a source of friction. Denials
should mark authorization boundaries, not preferred spellings of an authorized task. Isolation
belongs in a sandbox, credentials and network policy.

**Accepted tradeoffs.** Read-only roles can now write through shell if they disobey their prompt;
`architect` and `dialectic` can write through shell despite `edit` asks; tool-preference violations
are no longer intercepted (the 2026-05-02 count of chronic `grep`/`cat` use was the reason for those
denies and may recur as prompt-layer drift).

**Verified.** `opencode debug config --standalone` parsed the new `opencode.json`. Not verified: rule
evaluation per agent, live behavior, or the scanner's handling of `$(...)`, subshells, heredocs.
The running service reads the symlinked config directory without a watcher; reload it for the change
to take effect.

## 2026-11-08 — Multisession consistency pass: seeded AGENTS.md rule, anneal scope, drift

**Context.** `/plan-shard` seeded the project's `AGENTS.md` with a pointer into PLAN's
`## Notes for executors`: a durable file pointing at a rolling doc that is archived after the arc,
the dangling-pointer shape the anneal mechanism exists to remove. The anneal scope lists also
disagreed (`/plan-anneal` excluded `NOTES.md`; `/plan-run` step 7 did not) and neither mentioned
`AGENTS.md`.

**Changed.** The seed is now a verbatim, self-contained `## Register in durable files` block with a
heading-based idempotency check, no PLAN/ROADMAP pointer, no denylist copy. `AGENTS.md` is excluded
from anneal scope in `/plan-anneal` and `/plan-run` step 7 (as is `NOTES.md` in step 7), and from
the default cleanup row's expected files. `architect.md` gains a fourth write trigger for the seed
and states that non-docs writes are prompted (`edit * ask`), not disabled. The planning manual
records the seed under register discipline. Drift fixes: "Roadmap appendix" (a section the sharded
PLAN no longer has) removed from the `/plan-run` dispatch templates; `fully-autonomous` dropped from
the roster's `/plan-run` args (never defined); `/plan-run` header "T1 judgment" corrected to
Opus-tier.

**Left alone.** Projects already seeded with the old pointer keep it until edited by hand.

**Checked.** Documentation only; grep for the removed phrases and for lines over 100 characters in
the touched files. No live-agent run.
