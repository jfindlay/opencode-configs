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
`multisession/multi-session-planning.md`, and the individual agent definitions. Worth eventually consolidating
into something with more shape — possibly a `HIERARCHY.md` or a dedicated roadmap doc — once a
critical mass of concrete patterns has accumulated.

Open shape questions (do not need to be answered now):

- Does "hierarchy" stay the right framing, or is "ecology" / "topology" / "composition" closer
  to what's emerging?
- What's the relationship between this theme and `multisession/multi-session-planning.md`? The latter is
  about how sessions compose; this is about how agents compose within and across sessions.
  Probably orthogonal axes, but the overlap deserves articulation.
- When does a pattern in this theme get promoted into `AGENTS.md` (operational rule) vs.
  `multisession/multi-session-planning.md` (durable reference) vs. stay here (exploration)?

### Idea: the multiplan lifecycle has unowned phases — and the deeper ceiling is OpenCode itself

**Status**: gap analysis captured; no concrete work scheduled. Reframed mid-analysis from "fix the
ROADMAP gaps" to "OpenCode is the wrong substrate for where this is heading."

**The surface gaps.** The multiplan workflow approximates a three-phase lifecycle — *construct
ROADMAP → iterate (ROADMAP→PLAN shards) → apply PLAN* — but only the middle and end are owned by
named commands/agents. Mapping the lifecycle against the roster surfaced three gaps:

- **Gap A — ROADMAP construction (Phase 0) is unstructured.** There is no `/construct-roadmap`
  analogue to `/shard-plan`; roadmap birth is free-form `@architect` prose under the "long-arc
  roadmap" write trigger. Every *other* transition has a named entry point with preconditions and an
  exit report; roadmap birth does not. (May be correct — construction is the least mechanizable
  phase — but it is an asymmetry worth naming.)
- **Gap B — sub-track completion has no upward-propagation trigger (Phase 3).** `/run-plan` and
  `@plan-juncture` write only `PLAN.md`; the boundary-transform fork (`run-plan.md` step 7) is the
  exact coordinate-transform moment the field manual says updates the static frame, yet the fork is
  contractually barred from writing ROADMAP (`plan-juncture.md`: "Write to PLAN only"). The one
  agent positioned to do the transform cannot complete it. `/shard-plan`'s new boundary-reconcile
  step (2026-06-17) closes this only *retroactively at the next shard* — a sub-track that completes
  and is never followed by another shard never propagates upward.
- **Gap C — the outer "iterate" loop is described nowhere as a whole.** `/shard-plan` shards one
  sub-track; `/run-plan` applies one PLAN; nothing names the cycle `construct → {shard → apply →
  reconcile}* → archive`. It lives only in the user's head and in `multi-session-planning.md` prose.
  Suspicion (inferred): Gaps A and B *feel* like missing commands but may really be a symptom of
  Gap C — the workflow is distributed across five files and mapped as a unified lifecycle nowhere.

The permission substrate already exists (`opencode.json` grants `@architect` ROADMAP write); only
the *workflow wiring* is missing. The three obvious fixes — symmetric `/construct-roadmap`; let the
boundary fork write ROADMAP; a `HIERARCHY.md` loop-map — were weighed but **deliberately not built**,
because the root cause is one level down.

**The real ceiling: OpenCode is not a programmatic orchestration substrate.** The multiplan
subsystem is a hand-rolled approximation of something that wants to be a *durable agent-orchestration
graph*. The next evolution wants:

1. Arbitrary-depth nested agent tasks (sub-sub-…-agents).
2. Indefinite session forking.
3. Control flow — conditionals and loops over the work arc, so the graph *is* the prototype of the
   total arc.
4. **Permission/question propagation from arbitrarily-deep subagents up to the human** — OpenCode's
   hard limitation: sub-subagent permission prompts and questions are not surfaced to the user.
5. Declarative config (YAML), with **phase-change / coordinate-transform judgment reserved to
   administrative agents inside the workflow** (the action→static transform as an admin node, not
   hand-driven).

**Substrate scouting (training-knowledge, NOT verified against current docs — verify before
committing):**

- **LangGraph** — closest match to (1)(2)(3). Graph-of-nodes with conditional edges and cycles as
  first-class primitives; subgraphs nest to arbitrary depth; `interrupt()` + checkpointer is the
  mature implementation of (4) — pause at arbitrary depth, surface a payload to the human, resume
  via `Command(resume=...)`, indefinitely. **Cost:** imperative Python, not declarative YAML — you
  get (5)'s intent (graph-as-spec) but build its declarative form yourself. Carries LangChain
  ecosystem churn (the "ages fast" failure mode from the 2026-06-03 scouting session).
- **Temporal** — the durable-workflow spine if you strip to (1)(2)(3)(4): child workflows = depth,
  `signal`/`query` = human-in-the-loop at any depth, control flow is code, execution survives
  process death. Model-agnostic — knows nothing about agents/LLMs; you build the agent layer.
  Heavier infra.
- **Declarative-YAML cluster** (matches (5)'s *form*, weaker on (1)–(4)): CrewAI (agents.yaml /
  tasks.yaml + flows; weaker durable-interrupt-at-depth), AutoGen/Semantic Kernel (conversational,
  weak durable depth), OpenAI Agents SDK/Swarm (deliberately minimal handoff model), Google ADK /
  Bedrock Agents / Pydantic-AI graph (each has a sub-agent/graph notion; none nails all five; cloud
  ones lock to a vendor).

**Verdict (inferred, high-confidence):** no single tool gives all five today. The field bifurcates
into *agent-native-but-imperative* (LangGraph) and *declarative-but-agent-shallow* (CrewAI-style).
Requirement (4) — human-in-the-loop from arbitrary depth — is the discriminator, and LangGraph's
interrupt/checkpoint is the only mature agent-aware implementation. The system being described —
**declarative YAML over a durable graph engine, with admin-agents owning phase transitions** — does
not exist as a product; it would be a thin declarative layer over LangGraph (or over Temporal, with
a self-built agent layer).

**Connection to positioning (`~/Documents/work/explore/sessions/2026-06-03-llm-ecosystem-scouting.md`):**
a declarative orchestration schema whose *semantics* are the two-frame model — static-frame roadmap
as the graph, action-frame execution as the durable run, coordinate-transform reserved to admin
nodes — is a *theory-of-the-practice* artifact (that session's framings #2/#6: the invariant layer
robust to tooling churn), not another broadcast-product. The substrate underneath is a
buy-not-build decision; LangGraph is the current best buy. gastown (Yegge) is the maximalist
broadcast-product point of comparison; the durable-graph-with-admin-judgment design is the deeper,
slower-aging bet.

**Open questions:**

- Is the durable-graph layer worth building *now*, or does it wait behind the code-lenses execution
  bet (the witnessable-artifact-first conclusion of the 2026-06-03 scout)?
- If built: thin declarative layer over LangGraph, or over Temporal? The (4) discriminator favours
  LangGraph; model-agnostic durability favours Temporal.
- Does the two-frame model survive being made a *graph schema*, or does forcing it into nodes/edges
  flatten the coordinate-transform subtlety the prose captures? (The transform is non-trivial *by
  design* — a declarative form must not pretend it is a mere edge.)
- Where does this leave the OpenCode multiplan subsystem — frozen as the "good-enough for garden
  codebases" tier, or migrated once the durable-graph layer exists?

**The deeper substrate direction: namespace-allocated permissions (agentic OS).** The requirement-4
ceiling (human-in-the-loop from arbitrary depth) has two opposite resolutions, and the more
interesting one *dissolves* the problem rather than propagating it:

- **Propagate-up (OpenCode's broken model):** a deep subagent hits a permission wall mid-run; the
  prompt must bubble up through every intermediate fork to the human. OpenCode does not do this for
  sub-subagents — the ceiling.
- **Allocate-at-fork (the agentic-OS model):** the human grants a *capability namespace* at session
  creation; thereafter ungranted capabilities are **invisible** to the agent (the OpenBSD
  `pledge`/`unveil` lineage), not denied-with-a-prompt. There is deliberately no mid-session
  "ask the user" path — escalation isn't a concept, so there is nothing to propagate. Permissions
  are mechanized *and* safely opened because read/write domains are allocated by system namespacing
  (proc, memory, storage, network) per fork.

This is the intuition behind the user's interest in **CementOS**
(https://gist.github.com/brianv0/51c189a5d896855d2d416a69867889e4) and **Project Solara** (without
the custom-hardware optimization). CementOS is explicit that it is a *substrate, not a framework*:
a minimal kernel (four primitives — session, context, capability, journal), a `pledge`/`unveil`
capability model where ungranted caps are invisible, a single durable append-only journal as the
source of truth for audit/replay/recovery, and a driver model where **LangGraph / OpenCode / Claude
Code / Gastown remain the unconstrained userspace surface**. It even ships a `langgraph-driver` with
two surfaces — observation (`astream_events`) and *state* (LangGraph's `BaseCheckpointSaver` with the
journal as LangGraph's persistence backend). So the ecosystem already treats "LangGraph topology over
a durable, capability-enforced substrate" as the composition being reached for.

How this reframes the whole entry:
- The **declarative config / graph schema** (the thing the user is *unsure should exist*, prior turn)
  is a *userspace* concern in this layering — it sits above the substrate, not inside the kernel.
- **Dynamic administrative judgment that alters the future of the graph** (uncertainty 3) maps onto
  userspace admin-agents emitting `user_emit` records (e.g. a `plan` subtype) that other userspace
  agents consume — the substrate journals and audits the mutation without owning its policy.
- **Permissions** stop being prompt-propagation and become **manifest allocation** at fork time — the
  exact mechanization the user named.

This is the *theory-of-the-practice / invariant-layer* bet from the 2026-06-03 scouting session, not
a broadcast-product: bounded context, capability-as-namespace, durable journal, coordinate-transform
reserved to admin nodes are invariants robust to how agents evolve. gastown is the maximalist
broadcast-product comparison; CementOS/Solara is the substrate comparison. The user is "thinking of
agents that run in a container system where permissions are mechanized and opened because read/write
domains are allocated by system namespacing."

**Posture (explicit):** the immediate, low-regret move taken was the minimal `/construct-roadmap`
priming command (Phase 0 of the multiplan lifecycle, captured 2026-06-17) — it names the
construct → {shard → apply → reconcile}* loop and the juncture coordinate-transform *as orientation*
without mechanizing the control flow, honouring the prior-turn conclusion that the construction act
is abductive and the declarative form is not yet ready to crystallize. The substrate work
(LangGraph/Temporal evaluation; CementOS-style namespace-allocated permissions) is a separate,
larger bet, gated behind: (a) running more real arcs to reveal the constraint surface, and (b) the
witnessable-artifact-first sequencing question from the scouting session (does this precede or follow
the code-lenses execution bet?).

**Concrete next steps (none scheduled):**

1. Verify the LangGraph interrupt/checkpoint-at-depth claim and the CrewAI YAML-flow-control claim
   against current docs before any build decision.
2. Read the full CementOS spec (it is long — the gist was truncated at fetch; sections 6–13 cover
   the driver interface, end-to-end test spec, and substrate use-cases) and assess whether its
   capability/journal model is a buy-vs-build substrate or a design reference to rederive selectively.
3. Re-run the 3→2→1 discovery ordering (dynamic-judgment → reusable-patterns → declarative-config)
   after arc #2, when n>1 makes pattern-extraction non-speculative.

### Idea: formalize the runtime-enforced contract between orchestrators and subagents

**Status**: noted; no concrete work scheduled.

**Lineage**. `multisession/multi-session-planning.md` names three flavours of cross-session contract:
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

## Idea: context-fill plugin hook for @plan-admin

**Status**: deferred — gate not yet fired.

**Gate**: do NOT start until small-commit discipline (see
`multisession/multi-session-planning.md`) has been tried on real chains and shown insufficient —
i.e., a conceptual unit genuinely overflowed a healthy window despite small-commit tuning. For
garden codebases this may never fire. (This is the same gate as the Thread 3 warm-resumption work;
Thread 4 only earns its keep if Thread 3 is needed.)

**Value**: a model cannot reliably measure its own context fill; it confabulates. OpenCode *does*
know the exact token count (it computes it to decide auto-compaction). A plugin hook exposing
per-subagent context-fill ("at 47% / 81% / 94% of window") converts a judgment `@plan-admin` does
badly into a measurement code does perfectly — the same push-mechanical-measurement-to-the-cheapest-layer
principle as the rest of the system.

**Unverified assumption**: that OpenCode's plugin hook surface exposes a readable per-session /
per-subagent context token count mid-session. The `customize-opencode` skill lists hooks
(`tool.execute.before/after`, session events, `experimental.session.compacting`,
`experimental.compaction.autocontinue`) but does not confirm a readable live token-fill figure.

**Safe-to-do-early step (when the gate fires)**: fork `@explore` read-only against the OpenCode
source / plugin SDK (`@opencode-ai/plugin`) and the published config schema to answer: *can a
plugin read the current context token count for a given (sub)session mid-run, and surface it to
the orchestrating agent?*
- If YES → spec the hook.
- If NO → `@plan-admin` must estimate fill from turn count / cumulative tool-output volume
  (coarser); note this fallback in the Thread 3 spec when writing it.
