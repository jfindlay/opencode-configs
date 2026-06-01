# PLAN: Restructure `/run-plan` orchestration to Topology A (cheap driver + paged Opus)

## Purpose (design intent)

`/run-plan` currently runs its entire loop *from* `@plan-deep` (T0/Opus). Per-iteration, the Opus
context personally runs the mechanical loop body — select next row, run pytest/typecheck, grep for
the KAT, diff `git status`, write and commit the ledger row — and only occasionally exercises genuine
T0 judgment (inflection-point design, discovery adjudication, sub-track-boundary coordinate
transform). The result is two coupled costs:

1. **Token burn:** the expensive tier runs ~70 mechanical iterations to reach ~10 moments of real
   T0 judgment.
2. **User-attention churn:** because mechanical halts (KAT undefined, scope drift, committer refusal)
   and judgment halts (coordinate-transform) live in the same context, they all surface to the user.

**The fix (Topology A):** a new cheap **T1 driver** runs the mechanical loop and absorbs mechanical
halts silently; it **pages in a forked `@plan-deep` (T0) only at the three genuine junctures**
(inflection design, downstream-contract-invalidating discovery, sub-track boundary). Opus is paged,
not resident — invoked ~10× across a 70-session run instead of ~70×.

**Core design principle being preserved:** the multi-session typology exists so a T0 agent can
pathfind a multistep arc and then have it *run* with judgment reserved for the junctures. Topology A
keeps T0 judgment *at the junctures* while removing it from the loop body.

## The register split (the spine of the whole change)

The current `/run-plan` step 4 ("the orchestrator verifies") fuses three registers that belong at
different tiers. The restructure separates them:

| Register | Steps | Tier | Who does it post-change |
|---|---|---|---|
| Mechanical gating | select row, dispatch, 4a–4d verify, commit, ledger write/commit | T1 | the driver (inline) |
| Discovery adjudication | 4e (does discovery invalidate a *frozen downstream* contract?) | T0 | paged `@plan-deep` fork |
| Inflection / boundary design | step 2 inflection design, step 7 boundary coordinate-transform | T0 | paged `@plan-deep` fork |

Mechanical verification (4a–4d) must stay *inside the iteration* (it gates the commit) — it is
delegated **down-tier to the driver**, NOT deferred to a later session. A "later session verifies the
previous one" design is explicitly rejected: it breaks the 1:1 session:commit invariant and lets bad
commits land.

## Two sharp edges this plan must design around (Topology A's known costs)

1. **Cold-start adjudication.** A freshly-forked `@plan-deep` sees only the static frame (ledger +
   plan), not the action-frame texture the resident Opus used to carry. **Mitigation:** the driver
   maintains a durable `## Action-frame digest` in PLAN, appended each iteration, and feeds it into
   every juncture fork prompt. This extends run-plan's existing "state lives on disk" invariant from
   "what's done" to "what was learned." Without this section, Topology A adjudication is *strictly
   worse* than today's resident-Opus design — so it is mandatory, not optional.

2. **Forks can't hold an interactive loop.** A subagent returns once and loses the steering loop
   (AGENTS.md subagent rule). Therefore an inflection point that needs human sign-off is structured
   as: driver pages Opus fork → fork returns the substrate-interface *design only, in one shot* →
   **driver** halts and surfaces to the user → user approves → **driver** dispatches `@build` to
   implement. The Opus fork never waits for user input; the human loop lives in the driver.

---

## Enabling changes (do these first)

### E1. New T1 primary agent: `@run-plan-driver`  ◆

**File:** `agent/run-plan-driver.md` (new).

- `mode: primary`, `model: anthropic/claude-sonnet-4-6`, low temperature (0.2–0.3).
- Description tagged `[jf]`, in the style of the other agent files.
- Body responsibilities:
  - Runs the `/run-plan` mechanical loop (the post-change loop below).
  - References `AGENTS.md` in full and `AGENTS-REASONING.md` *through* the `--- T0 ONLY BELOW ---`
    marker and stop (it is T1; it must NOT attempt the T0 modes-of-inference register).
  - Knows it is a *dispatcher*: it forks `@build`/`@general`/`@explore` for sessions, `@committer`
    for commits, and `@plan-deep` (as subagent) for the three junctures. It does not implement,
    verify-by-reasoning, or adjudicate discoveries itself — on any juncture flag it pages Opus.
  - Carries the "two sharp edges" discipline above: maintains the action-frame digest; structures
    inflection sign-off as fork-returns-design-then-driver-halts.
- Add to the **roster in both `AGENTS.md` files** (user-level `~/.config/opencode/AGENTS.md` and the
  repo copy — they are the same symlinked file, so one edit) under **Primary agents**, between
  `@build` and `@git-editor`.

> **Decision needed at build time, surface to user:** new dedicated agent file vs. extending
> `@build` with a run-plan-driver mode. This plan assumes a *dedicated file* because the driver's
> posture (dispatcher that never implements, maintains a ledger digest, pages Opus) is distinct
> enough from `@build`'s (hands-on implementer) that fusing them muddies both. If the user prefers
> minimal roster growth, the fallback is a `/run-plan`-only behavioural contract executed from
> `@build` — but `@build`'s own doc says "deep planning → switch to `@plan-deep`," which would need
> a carve-out. Recommend the dedicated file.

### E2. Make `@plan-deep` forkable as a subagent

**File:** `agent/plan-deep.md`.

- Current frontmatter is `mode: primary`. To be forkable via the Task tool it needs `mode: all`
  (primary + subagent) — **verify the exact OpenCode mode keyword at build time** (`all` vs.
  listing; check another agent or OpenCode docs). Do not guess; confirm before editing.
- Add a short subsection to the body — `## When forked as a juncture adjudicator (subagent mode)` —
  stating:
  - It may be paged by `@run-plan-driver` at inflection / discovery / boundary junctures.
  - In subagent mode it receives an **action-frame digest** plus the specific juncture question; it
    must produce a **one-shot** answer (design artifact, adjudication verdict, or boundary
    reconciliation) and return — it cannot hold an interactive loop, so it must not ask the user
    questions; anything needing human sign-off is returned to the driver as a flagged
    recommendation.
  - Its rolling-context write permission still applies: when forked for inflection design it writes
    the resolved interface into PLAN's `## Cross-session contracts` and returns.
- Add `@plan-deep` to the **Subagents** roster list in `AGENTS.md` (it now appears in both the
  Primary and Subagent rosters — note the dual role explicitly).

### E3. Update `AGENTS.md` `/run-plan` command-roster entry

The current entry says "`@plan-deep` orchestrates." Change to: "`@run-plan-driver` (T1) orchestrates
the mechanical loop; dispatches `@build`/`@general`/`@explore` per session, `@committer` for commits,
and pages a forked `@plan-deep` (T0) only at inflection points, contract-invalidating discoveries,
and sub-track boundaries." Keep the args line.

---

## Core changes to `command/run-plan.md`

### C1. Frontmatter + preamble

- `agent: plan-deep` → `agent: run-plan-driver`.
- Rewrite the description and the "This command runs from `@plan-deep` (T0)" paragraph: the loop runs
  from `@run-plan-driver` (T1); orchestration *judgment* at junctures is paged to a forked
  `@plan-deep`. Update precondition 1 and the Constraints "Runs from `@plan-deep` only" line
  accordingly (now "Runs from `@run-plan-driver` only").

### C2. New ledger section: `## Action-frame digest` (the warm-context substitute)

- Add to the Ledger spec a required `## Action-frame digest` section in PLAN.
- The driver appends one short block per iteration (or only on non-trivial iterations): deferred
  discoveries, contracts that flexed but did not break, and one line of texture ("what the next
  juncture adjudicator would want to know that the `done` rows don't show").
- This section is fed verbatim into every `@plan-deep` juncture fork prompt.
- It is committed as part of the step-6b ledger commit (it lives in PLAN).

### C3. Step 2 (inflection point) — page Opus instead of doing it inline

Current: "this session's *design* is done by the orchestrator itself." Change to:

- Driver forks `@plan-deep` (subagent) with: the inflection session entry, the contracts it
  consumes/produces, and the **action-frame digest**. Prompt instructs: produce the substrate
  interface design one-shot, write it into PLAN's `## Cross-session contracts`, return a summary; do
  NOT implement; do NOT ask the user anything.
- On fork return, the **driver HALTS for human sign-off** (surfaces the returned design), then on
  approval dispatches `@build` to implement per the normal step-3 path.
- Preserve the rationale note (substrate reworks are the expensive failure mode).

### C4. Step 4 — split mechanical gate from discovery adjudication

- **4a–4d (mechanical):** unchanged in substance, now executed by the **driver** directly (run
  VERIFY_TEST/VERIFY_TYPES, grep KAT, diff expected files, scope-drift check). These never page Opus.
  Their halts (`BLOCKED: KAT contract undefined`, `BLOCKED: scope drift`) are surfaced by the driver
  to the user as today.
- **4e (discovery adjudication):** restructure so the driver only *detects* "the subagent reported a
  discovery touching a downstream contract," then **pages a forked `@plan-deep`** with the discovery,
  the affected contract(s), the affected downstream sessions, and the action-frame digest. The Opus
  fork returns one of: `internal — continue` / `additive re-shard — <spec>` (only honoured if run
  config is `may-reshard`) / `destructive — HALT`. The driver enacts the verdict; destructive always
  halts regardless of fork opinion (unchanged invariant). Record the adjudication in `## Discoveries`.
  - This is the key cost lever: the cheap driver runs every iteration; Opus is paged only when a
    discovery is actually flagged.
- **4f (fix-loop):** unchanged, executed by the driver (dispatches `@build` fix subagent, cap 2).

### C5. Step 7 (sub-track boundary ◆) — page Opus for the coordinate transform

- The boundary re-read of `## Purpose (design intent)` and contract reconciliation is genuine T0
  coordinate-transform work. Driver pages `@plan-deep` (subagent) with the digest + frozen-contract
  list + design intent; fork returns: still-on-intent (yes/drift-noted) + reconciliation notes +
  any recommended re-scope. Driver records to ledger and, per Boundary policy, self-continues by
  default or halts if the fork flagged drift needing sign-off.
- **Tradeoff to note in the command:** this pages Opus at every ◆ (a handful of times), slightly
  more than a fully-mechanical boundary check would. Accepted because the boundary transform is the
  documented place the two frames meet — cheaping it out defeats the anti-defocus/anti-rigidity
  purpose.

### C6. Steps 1, 3, 5, 6, 6b — retier only

- These are mechanical; reassign their actor from "the orchestrator (Opus)" to "the driver (T1)".
  No behavioural change. Step 3 dispatch, step 5 `@committer` dispatch, step 6 ledger write, step 6b
  ledger commit all stay as-is in substance.

### C7. Constraints + Boundary policy + Exit report

- Constraints: update the "Runs from `@plan-deep` only" and "orchestrator verifies" lines to reflect
  the driver/fork split. Add: "Opus (`@plan-deep`) is paged as a subagent only at the three
  junctures; it is never resident for the loop."
- Boundary policy: the halt classes are unchanged; clarify that mechanical halts are surfaced by the
  driver, juncture outcomes are produced by paged Opus then enacted/surfaced by the driver.
- Exit report: add "juncture fork count" (how many times `@plan-deep` was paged) so a run's actual
  Opus cost is visible.

---

## Changes to `multi-session-planning.md`

This file is *descriptive*, not normative, so changes are light — but two framings now need a home
because they are durable design rules the restructure surfaced:

### M1. Add a short subsection under "The two reference frames" — "Who holds the frame"

State the register split as a *structural* observation (it is durable, not tooling-contingent):
mechanical gating is frame-free (any tier); the coordinate-transform at junctures is the only place
that needs the action frame held in a judgment-bearing context; and because a paged adjudicator
starts cold, the action-frame texture must be **externalized to disk** (the digest) to survive the
hand-off. This is the conceptual justification for C2.

### M2. One sentence in "Mid-project Opus reviews are inflection points" (§coordinate transform pt 3)

Note that the inflection review can be *paged* (forked) rather than *resident*, provided the
action-frame digest is fed in — and that the design output is one-shot because a fork cannot hold the
human sign-off loop (that lives in the driver). Keep it brief; this is the descriptive companion to
C3.

> Do NOT convert `multi-session-planning.md` into a `/run-plan` spec. It stays a field manual; the
> normative mechanics live in `command/run-plan.md`.

---

## Build order (suggested session shards)

1. **E1 + E2 + E3** (enabling: new driver agent, plan-deep forkable, roster/AGENTS updates). One
   commit. Verify the OpenCode `mode` keyword for forkable-primary before editing E2.
2. **C1 + C6 + C7** (retier the command: frontmatter, mechanical-step actors, constraints/exit).
   One commit.
3. **C2 + C4** (action-frame digest + discovery-adjudication paging — the cost lever and its warm
   -context mitigation, which are coupled). One commit.
4. **C3 + C5** (inflection + boundary paging). One commit.
5. **M1 + M2** (field-manual framings). One commit.

Each commit follows the repo's `/update-config` convention.

## Verification (no test suite in this repo)

This is a config/docs repo; "green" means: the edited markdown is internally consistent and
cross-references resolve. After each shard, check:
- Every `@agent` / `/command` name referenced exists in the roster.
- `command/run-plan.md` no longer says "runs from `@plan-deep`" anywhere; `@run-plan-driver` is the
  consistent actor for mechanical steps and `@plan-deep` only for junctures.
- The action-frame digest is referenced consistently in C2, C3, C4, C5, and M1.
- The OpenCode `mode` keyword in E2 is the real one (confirmed, not guessed).

## Open questions for the user (resolve before/at build)

1. **Dedicated `@run-plan-driver` file vs. `@build` carve-out** (see E1 decision note). Plan assumes
   dedicated file.
2. **Agent name:** `@run-plan-driver` is descriptive but long. Alternatives: `@orchestrator`,
   `@plan-admin`, `@runner`. Pick one before E1.
3. **Digest granularity:** append every iteration, or only on iterations with a discovery/flex? Plan
   leaves this to the driver's judgment; could be tightened to "only non-trivial iterations" to keep
   PLAN small.
