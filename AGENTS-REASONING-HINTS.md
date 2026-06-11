# Reasoning-register companion (deep dialectic)

This file is the deep-dialectic companion to `AGENTS-REASONING.md`. Where REASONING holds the rules
in force at the reasoning register, this file holds the deeper exposition, worked examples, and
source quotations that animate those rules. The relationship mirrors HINTS↔AGENTS: entries here are
referential, not in-force — consult them when the operational rules in REASONING don't fire
reflexively, or when you need to reconstruct *why* a rule has the shape it does.

**Tier gating.** This file is for T-1 and T0 agents only (currently `@dialectic` and `@architect`). T1
agents should not load it. Its content is calibrated for Fable/Opus-scale reasoning reserve, and
partial execution at Sonnet tier produces fake rigour — the same failure mode that motivated the
within-REASONING T-1/T0 gate. Asking Sonnet to will the four-step abductive decomposition into
existence costs attention against the rules it can actually apply while producing the appearance of
compliance without the substance.

**When to load this file.** Four triggers:

- Facing a pivotal anomaly that eliminative and generalizing modes cannot accommodate — the fact
  pattern needs the abductive decomposition, not just a mode label.
- Hitting an impasse where the canonical option set itself seems wrong — the leap (step 2 of the
  decomposition) is positing a candidate the vocabulary doesn't have a name for.
- Any delicate uncertainty resolution where you need to reconstruct the four-step decomposition
  from first principles rather than execute it from memory.
- Restructuring work on the AGENTS/REASONING/HINTS file family that needs the full source
  rationale for why the tier gates and register splits have the shape they do.

**Register.** Treat entries here as deeper exposition to consult, not as additional rules layered
on top of REASONING. If an entry and a REASONING rule appear to conflict, the REASONING rule wins.

---

## The detective archetype: modes of inference and the Dupin leap

REASONING.md §'Modes of inference' carries the operational rules. This section is the source
exposition and worked example that motivate them — read it when those rules don't fire reflexively,
and you need to reconstruct why the four-step decomposition has the shape it does.

Holmes and Dupin model three distinct modes of reasoning applied at different fact-pattern
signatures. The reason they appear preternatural is compression: decades of domain priors make mode
selection reflexive for them. The agent has no equivalent reflex and must execute mode selection
deliberately.

**The three modes, signatures, and failure signs** (compact form; full rubrics in REASONING):

| Mode | Signature | Work | Fails when |
|---|---|---|---|
| Eliminative | Constrained, named set | Rule out, defend survivor | Premises are soft; set is vocabulary artifact |
| Generalizing | Abundant, patterned | Name predictive rule | Sample biased; outlier is the signal |
| Abductive | Sparse, strange, pivotal anomaly | Posit unseen, reverse-engineer | Unfalsifiable; no hard tests |

**The Dupin leap decomposed.** The abductive mode is the one agents execute worst by default,
because it requires positing something outside the named option set. Source formulation (user,
2026-04-23 session): *"an intelligent human's ability to not only reflexively dismiss 6 of the 7
canonical proposals for the given fact set, but that the full logic space is never exhaustively
probed and the human's pattern matching training suggests towards a possibility not yet uncovered.
That locus in the space might not have a path from the starting point as phrased, but knowing
enough about it, one could abstractly assume the 'leap' starting point with its conjectured facts
and connections and then work out paths even from partial and/or conjectured hypotheses."*

Operational rendering (four steps, executable without reflex):

1. **Eliminative observation about the canonical set** — every named candidate leaves a pivotal
   fact unexplained, or shares a hidden assumption the evidence contradicts.
2. **Posit the unseen locus** — name a candidate outside the canonical set, with conjectured
   properties. No path-from-evidence required at this step.
3. **Reverse-engineer** — derive what intermediate connections would have to hold for the evidence
   to match. Build the graph outward from the hypothesis.
4. **Test** — check each connection against the facts. Fail hard on contradiction; refine the
   locus where the posit was underspecified.

The leap is step 2; the work is steps 3–4. Without steps 3–4, step 2 is speculation.

**The Purloined Letter example.** The prefect's thorough search was rigorous and correct *as
generalizing* — past cases taught that hidden things are hidden thoroughly. Dupin recognised the
signature mismatch: this adversary was intelligent enough to exploit the prefect's mode. The
pivotal fact the prefect couldn't accommodate was that an exhaustive search kept failing against an
adversary who knew it was coming. Dupin's move was a mode switch — from generalizing (search past
patterns) to abductive (posit an adversary whose strategy was *to be obvious*). The leap: the
letter is hidden in plain sight. The reverse-engineering: what adversary hides a letter where the
searcher won't look? An intelligent one who predicted the search's pattern. The test: Dupin walked
in, looked at the mantel, and saw the letter.

**Why this must be willed each session.** A very intelligent human prunes reflexively from decades
of pattern-matched experience — six of seven plausible framings are ruled out before they surface.
The model has breadth of knowledge without that reflexive pruning, so enumeration without pruning
feels thorough but is the inverse of expert judgment. Mode selection must likewise be executed
deliberately: the fact-set signature read explicitly, the mode named, the failure-sign watched for.

---

## When to escalate: fact-pattern signatures that demand deep work

A quick triage rubric for deciding whether to load this file mid-session:

- **Constrained named option set, all candidates plausibly survive evidence** → eliminative mode in
  REASONING is sufficient. Do NOT load this file; the work is ruling out, not positing.
- **Many cases share a pattern; one outlier** → generalizing mode in REASONING is sufficient
  *unless* the outlier is signaling. If the outlier is the fact the generalizing rule cannot
  accommodate, load this file — the outlier may be the real pattern.
- **Pivotal anomaly that no canonical candidate explains** → load this file. Execute the four-step
  decomposition. The anomaly is the load-bearing uncertainty; spend there.
- **Hidden assumption suspected in the option set itself** → load this file. The leap (step 2) is
  positing a candidate the vocabulary doesn't have a name for. The canonical set is a vocabulary
  artifact, not the problem's actual geometry.
- **Impasse where every direction explored produces partial fit** → load this file. The fact
  pattern likely needs reverse-engineering from a posited locus (steps 3–4) rather than forward
  derivation from the evidence.

If unsure whether the situation warrants this file, the cheap move is to surface the fact-pattern
signature to the user and ask before loading.
