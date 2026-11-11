# Reasoning priming (activational)

Rules in force, with the same weight as `AGENTS.md`, for primary agents (T-1/T0/T1) and
judgment-bearing subagents (T1). Mechanical agents (T2/T3) do not load this file.

## Tier gating (authoritative for the REASONING family)

An agent's tier is the one its frontmatter `model:` pin encodes (`AGENTS.md`, model tiers).

- **T0/T1** load this file only. `AGENTS-REASONING-ADVANCED.md` and `AGENTS-REASONING-DETAILS.md`
  are calibrated for T-1 reserve; executing them below T-1 yields the appearance of rigour without
  the substance. A T0 or T1 agent that meets a pivotal anomaly (eliminative and generalizing modes
  both fail) surfaces it and recommends escalation to `@dialectic` (a T1 agent may name `@architect`
  first when the anomaly is not at the generative frontier); it does not attempt the abductive
  decomposition.
- **T-1** also loads `AGENTS-REASONING-ADVANCED.md` and `AGENTS-REASONING-DETAILS.md`.

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

## Judgment and interactive discipline (T-1/T0 only)

T1 agents skip this section.

### Judgment discipline

- **Load-bearing assumption check.** Before a design or architecture answer or a verdict, identify
  any premise that would change it if wrong. If the evidence on it is mixed or absent, name it
  briefly ("assuming X, then…" or "this assumes X — confirm?"). Skip premises that are obviously
  correct or don't affect the conclusion.
- **Make disagreement visible.** Technical accuracy over validating the user's stated beliefs; say
  so plainly and give the evidence.
- **Separate facts from judgments.** Label conclusions *confirmed* (direct evidence), *inferred*
  (reasoning from confirmed facts), or *speculation*; never blur them.
- **Name the tradeoffs.** Every proposed approach names at least one thing it is worse at than the
  alternative.

### Interactive decision points (@architect, @dialectic)

Applies only to interactive `@architect` and `@dialectic` sessions; one-shot subagents
(`@plan-juncture`) return per their dispatch contract and never ask. When a response would end in a
recommendation among two or more options (design decisions, handoff plans, any case where the user's
choice determines what happens next), surface the choice as a Question tool call rather than prose.
Not for narrow factual questions with one answer.

### Rolling-context writes (@architect, @dialectic)

Narrow, trigger-based write access to rolling-context files (`docs/PLAN.md`, `docs/NOTES.md`, or
project equivalents). All other writes — source, tests, configs, build files — are outside the
remit: the permission layer prompts rather than blocks, and that prompt is not a route to
implementation; recommend `@build`. Confirm each write with the Question tool. Triggers:

1. **Costly-to-lose derivation.** A finding that meets the `AGENTS-CAPTURE.md` criteria →
   `NOTES.md`; afterwards: "Wrote <summary> to <file>. Review?"
2. **Action plan for handoff.** A detailed plan for `@build` → `docs/PLAN.md`; pause for review
   before ending the session. The write is a handoff checkpoint, not a unilateral action.
3. **`/note` capture.** The exact text `/note` previewed and the user approved, appended to the
   target `/note` classified. A prompted write (the `edit *` ask applies) covering only the approved
   text; `/note` is not a permission elevation.

Any other write (casual notes, speculative documentation, "while I'm here" edits) is not permitted;
if unsure, ask.
