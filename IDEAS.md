# Ideas — opencode-config

Append-mostly catch-all for opencode-config-relevant exploration items not yet promoted to
active work. Entries here are deliberately fuzzy; the bar for adding is low, the bar for
removing is "this is now real work tracked elsewhere."

Promotion path: when an entry has 3+ concrete sub-tasks and starts feeling like a real arc,
split it into its own `ROADMAP.md`-style document (mirroring the rGNFS pattern of
`docs/ROADMAP.md` for the project-lifetime view and `docs/PLAN.md` for the current sub-track).

Demotion path: when an entry has been quiet for 6+ months and the framing no longer matches
reality, delete it.

---

## Theme: Agent hierarchy (TBN — needs a name)

The umbrella for thinking about how primary agents, subagents, orchestrators, and autonomous
chains compose. Currently a loose collection of patterns spread across `AGENTS.md`,
`multi-session-planning.md`, and the individual agent definitions. Worth eventually consolidating
into something with more shape — possibly a `HIERARCHY.md` or a dedicated roadmap doc — once a
critical mass of concrete patterns has accumulated.

Open shape questions (do not need to be answered now):

- Does "hierarchy" stay the right framing, or is "ecology" / "topology" / "composition" closer
  to what's emerging?
- What's the relationship between this theme and `multi-session-planning.md`? The latter is
  about how sessions compose; this is about how agents compose within and across sessions.
  Probably orthogonal axes, but the overlap deserves articulation.
- When does a pattern in this theme get promoted into `AGENTS.md` (operational rule) vs.
  `multi-session-planning.md` (durable reference) vs. stay here (exploration)?

### Idea: formalize the runtime-enforced contract between orchestrators and subagents

**Status**: noted; no concrete work scheduled.

**Lineage**. `multi-session-planning.md` names three flavours of cross-session contract:
compiler-enforced (traits, type signatures), test-enforced (KATs), and prose-enforced
(invariants stated in docs). Each catches a different class of cross-session drift. The
`@committer` subagent introduced a new pattern that doesn't fit any of the three cleanly: the
orchestrator passes a `SESSION CONTRACT` blob and an `EXPECTED FILES` list to the committer,
and the committer enforces them at commit time (refusing on scope drift, empty diff, etc.).

This is a **fourth flavour**: *runtime-enforced contracts between agent invocations*. The
contract isn't checked by a compiler, isn't checked by a test suite, isn't a prose invariant —
it's enforced by the receiving agent reading the input and refusing if it doesn't meet shape
expectations. The committer is the first concrete instance, but the pattern generalizes.

**Where the pattern already shows up implicitly**:

- `@verify` takes a list of review-finding claims; refuses or stalls if the list isn't parseable.
- `@explore` takes a `GOAL` + `INVESTIGATION TASKS` + `OUTPUT FORMAT` template per the subagent
  prompt template in `AGENTS.md`. The receiving agent currently parses these as natural-language
  prose; nothing structural enforces the shape.
- `@session-scan` takes session-history inputs and emits classified items; the input/output
  shapes are defined by command-side prose conventions, not by a schema.
- `/rebase-plan` produces a plan that `@git-editor` later consumes in a fresh session; the
  plan's shape is documented in prose but not validated at handoff.

In every case, the contract is real — the receiving agent breaks or improvises if the input is
malformed — but its enforcement lives in natural-language prompt instructions, which is the
weakest possible enforcement mechanism.

**Sketch of repo-level work** (not committing to any of this; just naming the space):

1. **A `schema/` directory** holding YAML or JSON-Schema definitions for each runtime-enforced
   contract. Initial entries:
   - `schema/committer-handoff.yaml` — `SESSION CONTRACT`, `EXPECTED FILES`, optional `TICKET ID`,
     optional `COMMIT TITLE HINT`.
   - `schema/verify-handoff.yaml` — claim list with per-claim `description`, `evidence-hint`,
     `priority`.
   - `schema/explore-handoff.yaml` — `GOAL`, `INVESTIGATION TASKS`, `OUTPUT FORMAT`,
     `THOROUGHNESS`, `READ_ONLY` flag.
2. **Agent prompts reference their schema.** Each subagent's prompt would start with a
   "Expected input shape: see `schema/<name>.yaml`" line, and the prompt body would teach the
   subagent to refuse cleanly on schema violations rather than improvising.
3. **A validator** (maybe a small bash or python script) that orchestrators can run before
   dispatching a subagent. Catches malformed handoffs before they cost a subagent's context.
4. **Code-structure consolidation**. The subagent prompt templates currently scattered across
   `AGENTS.md` (subagent prompt template), individual agent files, and command files could be
   reorganized so the schema is the single source of truth and the prompt templates are
   generated from it. This is the "code structure changes if possible" piece — feasible at the
   repo level via a small template/generation step.

**Open questions** (not blocking; just naming them so they're visible):

- Does formalizing this hurt more than it helps? Natural-language handoffs are flexible; a
  schema is rigid. The committer case argued for rigidity because mis-parsed input there means
  a bad commit lands in history. The same calculus may not apply to `@explore` or `@verify`,
  where mis-parsed input means a wasted subagent fork — costly but not corrupting.
- What's the right grain? Per-subagent schemas (current sketch) vs. one general "handoff"
  schema with optional fields. The former is more honest; the latter is easier to maintain.
- How do schema changes propagate? If `schema/committer-handoff.yaml` changes, do existing
  orchestrators break? Versioning the schemas vs. growing them monotonically is a real choice.
- Does this want to be a salt-managed schema in `opencode-config/schema/`, or an upstream
  opencode feature (a built-in `Handoff` primitive in the runtime)? **Decision for now**:
  repo-level only. Upstream-feature speculation is out of scope for this entry. If a clean
  abstraction emerges from repo-level work it can be proposed upstream later as a separate
  conversation.

**Concrete next steps** (none scheduled — listed so the path is visible):

1. Run `@committer` in a real autonomous chain a few times. Collect the mis-parses, drift
   refusals, ambiguities that show up in practice. Without that data, formalization is
   speculative.
2. If problems accumulate, draft `schema/committer-handoff.yaml` as a first artifact.
3. If that lands cleanly, expand to `@verify` and `@explore`.
4. Re-evaluate whether the pattern wants its own document or can stay in this entry.

---

## (No other themes yet)
