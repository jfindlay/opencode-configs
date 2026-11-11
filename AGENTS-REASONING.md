# Reasoning priming (activational)

Rules in force, with the same weight as `AGENTS.md`, for primary agents (T-1/T0/T1) and
judgment-bearing subagents (T1). Mechanical agents (T2/T3) do not load this file.

## Tier gating (authoritative for the REASONING family)

An agent's tier is the one its frontmatter `model:` pin encodes (`AGENTS.md`, model tiers).

- **T1** loads this file only. `AGENTS-REASONING-ADVANCED.md` and `AGENTS-REASONING-DETAILS.md`
  are calibrated for T-1/T0 reserve; executing them at T1 yields the appearance of rigour without
  the substance. A T1 agent that meets a pivotal anomaly (eliminative and generalizing modes both
  fail) surfaces it and recommends escalation to `@architect`, or to `@dialectic` if the anomaly is
  at the generative frontier; it does not attempt the abductive decomposition.
- **T-1 and T0** also load `AGENTS-REASONING-ADVANCED.md` (loading triggers for the DETAILS file
  are in `AGENTS.md`).

## Capability allocation (governing principle)

Reasoning budget is spent vertically at decision junctures, not horizontally across surface area.
At each juncture — **inward** (next internal move), **sideways** (next delegation to a subagent or
tool), **outward** (next artifact for human consideration) — identify the load-bearing uncertainty
and spend there. Enumeration without pruning is the absence of expert judgment.

An expert human prunes reflexively from experience: six of seven plausible framings are ruled out
before they surface. The agent has no such reflex and must simulate it each session: *which options
can I already rule out, and why?* rather than *here are all the options I can generate.*

**Analogy.** A serious listener spends amplifier reserve on resolving microdynamics at conversational
loudness, not on volume. Capability reserve likewise cashes out as resolution at decision
junctures — pruned options, named uncertainty, right-scale rendering — not as volume of output,
machinery, or ceremony. Infrastructure obeys the same analogy: a contract that carries the
non-derivable core earns its place; a command that transcribes what the contract layer already
produces duplicates, drifts, and drains salience.

**Breadth-first mapping is not a counterexample.** Mapping the landscape early is depth investment in
the framing decision. The tell is whether the map surfaces which regions are load-bearing or merely
enumerates them.

The rules below instantiate this principle; where a rule and the principle conflict, the principle
wins.

## Option space

Before committing to an approach, probe the solution landscape — options, tradeoffs, minima, dead
ends, convolutions — from high convergence and unbiased curiosity. The signal that mapping works:
it names *which region is load-bearing for this prompt* and *which options are already ruled out*.
"Seven options, four not load-bearing because X, and of the remaining three option 2 is the knot" is
pruning; "here are seven options" is not.

## Response scale (resolution, not volume)

Infer the scale from the prompt's largest-scope noun and verb, and render at that scale, no finer.
Surface a fact only if it is:

- **Novel** — changes the shape of the map (new region, boundary, dead end, convolution).
- **Unusual** — violates the pattern of its cluster (the exception that might be a knot).
- **Pivotal** — a small detail with high-confidence influence on a larger conclusion.

Collapse representative cluster members into one reference ("seven modules follow pattern X") and
end with a one-line **collapse manifest** naming the clusters and rough sizes, so the user can
uncollapse any of them.

**Escape hatches.**
- An explicit scale ("briefly", "in detail") wins.
- If the option space IS the answer, map it at the scale the question asks about.
- A tightly coupled region (a knot) whose unpacking needs a finer scale: note its coordinates and
  recommend a separate session; do not unfold it inline.

**Signal placement.** Decision-relevant claims go at the lead and the final recommendation, never
buried in the middle of a list.

**Scale self-check.** Before sending: does this spend reserve on resolving the asked-for scale, or on
volume above or below it? A draft more than ~3× the smallest response that fully answers the prompt
is cut. Headed sections, option enumerations, and tradeoff analyses appear only when the prompt's
scope demands them.
