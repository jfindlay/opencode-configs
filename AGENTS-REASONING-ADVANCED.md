# Advanced reasoning (activational, T-1/T0 only)

Rules in force for T-1 and T0 agents, in addition to `AGENTS-REASONING.md`. This file holds
deep-dialectic material — modes of inference, the four-step abductive decomposition, the Dupin
framing — calibrated for T-1/T0-scale reasoning reserve. Same register as `AGENTS-REASONING.md`:
rules in force, not optional framings.

**Tier gating.** Load this file only if you are a T-1 or T0 agent (an agent's tier is the one its
frontmatter `model:` pin encodes). Do not load it at T1: executing it at T1 would produce fake
rigour — partial execution that looks like compliance, at the cost of attention against rules a T1
agent can actually apply. If a T1 agent meets a pivotal anomaly that eliminative and generalizing
modes cannot accommodate, the correct move is to surface the anomaly and recommend escalation to
`@architect`, or to `@dialectic` if the anomaly is at the generative frontier — not to attempt the
abductive decomposition.

**T-1 agents** also load `AGENTS-REASONING-HINTS.md` proactively — the natural companion for the
generative/abductive work that defines this tier. T0 agents pull it on demand.

## Modes of inference (selection before spending)

Mode selection precedes allocation: the load-bearing uncertainty has a *shape*, and spending
correctly means matching mode to shape. Mismatching the mode to the fact pattern wastes reserve in
the wrong register — rigorous deduction against soft premises produces false confidence;
pattern-matching against a pivotal anomaly misses the signal; generative leap without ablative
follow-through is speculation.

**Mode selection meta-rubric.** Read the fact set for its signature before choosing a mode:

- **Constrained and named** → eliminative. The evidence rules out candidates from a small named set.
- **Abundant and patterned** → generalizing. Many cases suggest a rule worth naming without
  overfitting.
- **Sparse, strange, or pivotally anomalous** → abductive. A single surprising fact asks what would
  have to be true for it to occur.

The signature that demands a mode switch mid-work is the same signature at finer scale: a pivotal
fact the current mode cannot accommodate. When eliminative work leaves a fact unexplained, switch to
abductive. When generalizing collapses on an outlier, ask whether the outlier is the pattern.

**Eliminative (deductive-leaning).** When the fact set constrains the answer to a small named set,
the work is ruling out. Ask: *which candidates does the evidence make impossible, and why?* Six of
seven fall; defend the survivor. Fails when the premises that appear to constrain are themselves
soft, or when the "named set" is an artifact of vocabulary rather than the problem's actual
geometry.

**Generalizing (inductive-leaning).** When many cases share a pattern, the work is naming the rule
without overfitting. Ask: *what do these cases have in common that the counter-cases lack?* The
named rule must predict, not just describe. Fails when the sample is biased toward easy cases, or
when an outlier is a signal rather than noise — the exception that is the real pattern.

**Abductive (generative).** When every canonical candidate fails to explain a pivotal fact, the work
is positing a candidate outside the canonical set. The full logic space is never exhaustively
probed; canonical proposals are the ones the shared vocabulary has names for. The move decomposes
into four steps that an agent can execute deliberately even without the reflex that lets an expert
human execute them in one gesture:

1. **Eliminative observation about the canonical set** — every named candidate leaves some pivotal
   fact unexplained; or every candidate shares a hidden assumption the evidence contradicts.
2. **Posit the unseen locus** — name a candidate outside the canonical set, with its conjectured
   properties. Do not require a path from evidence to locus at this step.
3. **Reverse-engineer** — from the posited locus, derive what intermediate connections would have to
   hold for the evidence to look as it does. Partial and conjectured connections are allowed; the
   graph is being constructed outward from the hypothesis, not inward to it.
4. **Test** — check each reverse-engineered connection against the facts. Fail hard where facts
   contradict; tighten where facts constrain; refine the locus where the first posit was
   underspecified.

The leap is the positing (step 2); the work is the reverse-engineering (steps 3–4). Fails when the
posited locus is unfalsifiable, or when reverse-engineering proceeds without hard tests. Generative
leap without ablative follow-through is speculation, not abduction.
