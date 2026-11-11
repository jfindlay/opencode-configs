# Plan format

Shapes and shared vocabulary for ROADMAP and PLAN. Authoring procedures: `planning.md`. Execution
procedures: `execution.md`.

## ROADMAP (`docs/ROADMAP.md`)

The project-lifetime static-frame document: it persists for the life of the project and is
reconciled at sub-track boundaries, but it is rolling context, not permanent shipped documentation.
`/roadmap-construct` creates it; `/plan-shard` reconciles it before each next shard. Execution never
writes it. A standalone PLAN does not require one. Retain it until its reconciliation and any
unresolved handoff are satisfied. Suggested shape (adapt to the project):

- `## Design intent` — prose anchor, re-read at every boundary.
- `## Sub-track DAG` — sub-tracks as nodes, dependencies as edges, one-line charge and category mix
  each; the substrate sub-track marked; no session enumeration.
- `## Cross-track contracts (coarse)` — tagged compiler- / test- / prose-enforced where evident.
- `## Sequencing & scope` — proposed order and the cost-of-wrong texture.
- `## Discoveries & open questions` — inbox seeded at construction; reconciliation appends.
- `## Status` — per sub-track: not-started / in-progress / done (a partial sub-track is marked
  partial and names its stopping row).

## PLAN (`docs/PLAN.md` unless named otherwise)

Starred sections are required by execution; their absence is a refusal or initialization path
(`execution.md` preflight). Retain a PLAN until it is executed and reconciled and no pending row,
unconsumed handoff, deferred check, or unfolded discovery remains.

- `## Purpose (design intent)` — re-read at every ◆ boundary. May also record non-goals and the
  proposed delegation envelope and per-deliverable acceptance evidence (`planning.md`); these are
  prose, not a machine-interpreted policy.
- `## Verify gate` — bound VERIFY_TEST / VERIFY_TYPES (discovered, never assumed) and, only if the
  project declares one, a reference to its verification cadence. Absent a declaration: state none.
- **`## Session list`** ★ — table columns `#` | `Session` | `Cat` | `Tier` | `Consumes` |
  `Expected files`. `Session` is a commit-title-shaped sentence. `Cat`: A substrate / B algorithm /
  C optimization / I integrative. `Tier` states the *design judgment* the row requires, not the
  implementation model: T0 only where cost-of-wrong demands it. A T0 row carries the explicit
  `@architect` inflection marker; its design is made by a T0 `@plan-juncture` and then implemented
  at T1.
- `## Session detail` — per row: deliverable, ≥1 KAT (a row whose deliverable cannot be a KAT has an
  undefined contract: flag it), subtleties, deferrals. Rows after the substrate may be
  lower-fidelity sketches. The integrative row's deliverable includes the register anneal
  (`artifact-hygiene.md`). An `(F/C)` row also carries a Completion appendix (`paired-units.md`).
- **`## Cross-session contracts`** ★ — one subsection per contract, tagged compiler- / test- /
  prose-enforced, with Defined-in and Consumed-by. Not-yet-frozen contracts say *"to be frozen at
  <session>"*. The inflection fork writes the resolved interface here.
- **`## Progress ledger`** ★ — table `#` | `Session` | `Status` | `Commit` | `Froze`, plus a header
  recording bindings (see below). Statuses: `pending`, `done`, `skipped`; every row is `pending` at
  shard time. Only a row tagged `(skippable)` may be `skipped`.
- **`## Action-frame digest`** ★ — `*(none yet)*` at shard time; execution appends.
- `## Completion handoffs` — present (may be `*(none yet)*`) only when some row is marked `(F/C)`;
  entry shape in `paired-units.md`.
- `## Discoveries & risks` — carried down from the ROADMAP, phrased for discovery adjudication
  (`internal-continue` / `additive-reshard` / `destructive-HALT`); execution appends adjudicated
  findings. The reverse flow, into the ROADMAP, happens in `/plan-shard` reconciliation.
- `## Notes for executors` — tier routing, register notes, invariants to preserve, the suggested
  first `/plan-run` invocation (`halt-at-boundaries` for an unproven shard pattern), and the anneal
  denylist (seeded from `artifact-hygiene.md`, tunable here).

### Row markers

| Marker | Where | Meaning |
|---|---|---|
| `◆` | row | last row of a sub-track; triggers the boundary procedure |
| `@architect` inflection point | row | substrate interface to be designed by a juncture fork before dispatch |
| `(F/C)` | trailing on `Session` | paired feature/completion unit; absent means single-stage |
| `(skippable)` | trailing on the default `Anneal cleanup` row | the driver may waive the row |

Every session list ends with a default `Anneal cleanup (skippable)` row: Cat I, no tier override,
Consumes none, expected files the durable files the arc touched (never rolling docs or the project's
`AGENTS.md`). Its deliverable is standalone annealing over the whole project plus the line-length
pass that absorbs overruns earlier sessions deferred. It is omitted only when the user declines it
at the shard confirm gate or the PLAN has a single session.

### Ledger header and notes

The header records: PLAN path; VERIFY_TEST / VERIFY_TYPES (and that a combined command satisfies
both); the bound cadence or `none declared`; and, when a stash snapshot was lost, that drift before
that point is unchecked. Rows record the commit short-hash and the contracts the row `Froze`, any
allowed scope extras, and logged discoveries. A paired unit notes both stage identifiers (`<N>F`,
`<N>C`). A boundary note records anneal triage hits, checks, the planning-reference review result
and any scope limit, and unresolved items.

**Gate-evidence block (cadence only).** One line per check per unit: check; outcome (`passed` /
`reused` / `deferred`); command and working directory; exit status; completion time; log reference;
input identity; environment; for `deferred`, the next mandatory checkpoint. A one-line "pending
checks" summary stays current. A historical row without a record is `unrecorded`. Semantics:
`verification.md`.

### Action-frame digest entry

```
### <session-id> — <date>
Discovery/flex: <one sentence>
Affected: <contract name or "none">
Deferred: <yes/no — if yes, what the next juncture adjudicator should re-examine>
Texture: <one sentence, or omit>
```

Appended only for non-trivial iterations (a discovery was flagged, a contract flexed, or meaningful
texture); clean iterations add nothing.

## Juncture vocabulary

| Juncture type | Verdicts (one-shot return) |
|---|---|
| `inflection-design` | `design-confident <summary>` · `design-uncertain-HALT <what cannot be reconciled>` |
| `discovery-adjudication` | `internal-continue` · `additive-reshard <spec>` · `destructive-HALT` |
| `boundary-transform` | `still-on-intent <notes>` · `drift-HALT <what changed and why>` |

Verdict handling belongs to `execution.md`; the fork prompt belongs to the juncture template there.
