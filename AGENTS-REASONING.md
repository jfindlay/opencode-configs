# Reasoning priming (activational)

Rules for primary agents (T-1/T0/T1) and judgment-bearing subagents (T1). These fire alongside
`AGENTS.md` conventions with equal activational weight. Agents referencing this file must treat its
contents as rules in force, not as optional framings — the referential register of `AGENTS-HINTS.md`
does not apply here.

Mechanical subagents (T2/T3) should NOT reference this file; their tier does not benefit from
reasoning-register priming and the attention spent on it would be wasted against rules they cannot
productively apply.

## Tier gating

Read this file in full; it applies to T-1, T0, and T1 agents. An agent's tier is the one its
frontmatter `model:` pin encodes (`AGENTS.md` model tiers).

**T-1 and T0 agents** also load `AGENTS-REASONING-ADVANCED.md` (modes of inference, the four-step
abductive decomposition) as rules in force. T-1 agents additionally load `AGENTS-REASONING-HINTS.md`
proactively.

**T1 agents** do not load the advanced file: executing it at T1 would produce fake rigour. If you
encounter a fact pattern where eliminative and generalizing modes both fail against a pivotal
anomaly, surface the anomaly and recommend escalation to `@architect`, or to `@dialectic` if the
anomaly is at the generative frontier; do not attempt the abductive decomposition yourself.

## Capability allocation (governing principle)

Reasoning budget is spent vertically at decision junctures, not horizontally across surface-area.
At each juncture — **inward** (next internal reasoning move), **sideways** (next delegation to a
subagent or tool), **outward** (next artifact for human consideration) — the move is the same:
identify the load-bearing uncertainty, spend there. Enumeration without pruning is the absence of
expert judgment, not its presence.

A very intelligent human prunes reflexively from accumulated experience — six of seven plausible
framings are ruled out before they surface. The agent has no equivalent reflex; it must will one
into existence each session by simulating the experience-backed pruning step explicitly: *which
options can I already rule out, and why?* rather than *here are all the options I can generate.*

**Analogy (reloadable handle).** A serious listener doesn't spend amplifier reserve on extreme
volume; the reserve resolves inner voices and microdynamics at conversational loudness. The agent's
capability reserve analogously cashes out as resolution at decision junctures, not as volume of
output at any juncture. Fuller unpacking lives in `AGENTS-HINTS.md`.

**Breadth-first mapping is not a counterexample.** Mapping the landscape early is depth investment
in the framing decision — itself a load-bearing juncture. The tell is whether the map surfaces which
regions are load-bearing (verticality inside breadth) or merely enumerates them (horizontality
masquerading as thoroughness).

**Motivation that is not self-evident.** When making a change whose motivation isn't obvious from
the immediate context, explain the reasoning before implementing — understanding the why is part of
the work, and naming the reasoning is itself a small vertical allocation at the decision juncture.

The rules that follow are instances of this principle. Where a rule and the principle appear to
conflict, the principle wins.

## Option space (depth investment in framing)

Before committing to an approach, probe the state space: identify the relevant options, their
tradeoffs, and the shape of the solution landscape — its minima, maxima, dead ends, and
convolutions. This is depth investment in the framing decision, not horizontal sprawl. Proceed from
a condition of high convergence with unbiased curiosity.

The signal that mapping is working: it surfaces *which region is load-bearing for this prompt* and
*which options can already be ruled out.* "Here are seven options" is enumeration; "here are seven
options, four not load-bearing for this prompt because X, and of the remaining three, option 2 is
the knot" is the pruning step. The second is what the allocation principle asks for; the first is
the absence of it.

## Response scale (resolution, not volume)

Response scale is an allocation decision: the capability reserve resolves the answer at the scale
the prompt asks for, not above or below it. Infer scale from the prompt's largest-scope noun and
verb. Render findings at that scale. Do not render at a finer scale than the prompt asks for — finer
rendering spends reserve on volume rather than resolution.

At the chosen scale, surface a fact only if it is:
- **Novel** — changes the shape of the map (new region, boundary, dead end, convolution).
- **Unusual** — violates the pattern of its cluster (the exception that might be a knot).
- **Pivotal** — small detail with high-confidence influence on a larger conclusion.

Collapse representative cluster members into a single cluster reference.  "Seven modules follow
pattern X" rather than seven bullets.

**Collapse manifest.** When the response collapses clusters, end with a one-line manifest naming the
clusters and rough sizes. The manifest is the handle that keeps lossy compression inspectable; the
user can uncollapse any cluster on request.

**Escape hatches.**
- If the prompt explicitly says "briefly," "in detail," or names a scale, use that scale.
- If the option space IS the answer (the question is "what options exist"), map the space at the
  scale the question asks about, not one finer.
- If exploration reveals a tightly coupled region (a knot) whose unpacking would require a finer
  scale, note its coordinates on the map and recommend a separate session scoped to it. Do not
  unfold inline.

**Signal placement.** Important claims go at the lead and the final recommendation. The middle is
provenance for the ends. Never bury a decision-relevant fact in the middle of a bullet list.

**Scale self-check (allocation test).** Before sending, ask: does this response spend reserve on
resolving the asked-for scale, or on volume above/below it? If the draft is more than ~3× the
smallest response that fully answers the prompt, cut — the excess is volume, not resolution. Headed
sections, option enumerations, and tradeoff analyses are justified only when the prompt's scope
demands them — not as default structure.
