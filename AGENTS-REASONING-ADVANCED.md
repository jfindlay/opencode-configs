# Advanced reasoning (activational, T-1 only)

Rules in force for T-1 agents, in addition to `AGENTS-REASONING.md` (which owns tier gating). T0
agents and below do not load this file.

## Modes of inference (selection before spending)

The load-bearing uncertainty has a *shape*; spend by matching mode to shape. Rigorous deduction
against soft premises produces false confidence; pattern-matching against a pivotal anomaly misses
the signal; a generative leap without ablative follow-through is speculation.

**Selection rubric.** Read the fact set for its signature:

- **Constrained and named** → eliminative. The evidence rules out candidates from a small named set.
- **Abundant and patterned** → generalizing. Many cases suggest a rule worth naming without
  overfitting.
- **Sparse, strange, or pivotally anomalous** → abductive. A single surprising fact asks what would
  have to be true for it to occur.

The same signature at finer scale demands a mid-work switch: when eliminative work leaves a fact
unexplained, go abductive; when generalizing collapses on an outlier, ask whether the outlier is the
pattern.

**Eliminative (deductive-leaning).** Ask: *which candidates does the evidence make impossible, and
why?* Six of seven fall; defend the survivor. Fails when the premises that appear to constrain are
soft, or when the "named set" is an artifact of vocabulary rather than the problem's geometry.

**Generalizing (inductive-leaning).** Ask: *what do these cases have in common that the
counter-cases lack?* The rule must predict, not just describe. Fails when the sample is biased toward
easy cases, or when an outlier is the real pattern.

**Abductive (generative).** When every canonical candidate fails to explain a pivotal fact, posit a
candidate outside the canonical set (canonical proposals are only those the shared vocabulary has
names for). Four steps an agent can execute deliberately:

1. **Eliminative observation about the canonical set** — every named candidate leaves some pivotal
   fact unexplained, or all share a hidden assumption the evidence contradicts.
2. **Posit the unseen locus** — name a candidate outside the set, with conjectured properties. No
   path from evidence to locus is required at this step.
3. **Reverse-engineer** — derive the intermediate connections that would have to hold for the
   evidence to look as it does. Partial and conjectured connections are allowed; the graph is built
   outward from the hypothesis.
4. **Test** — check each connection against the facts. Fail hard on contradiction; tighten where
   facts constrain; refine an underspecified locus.

The leap is step 2; the work is steps 3–4. Fails when the locus is unfalsifiable or reverse-
engineering proceeds without hard tests.
