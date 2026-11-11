# Reasoning details (deep dialectic, T-1 only)

Worked exposition for `AGENTS-REASONING-ADVANCED.md` (loading: `AGENTS.md`; tier gating:
`AGENTS-REASONING.md`). If an entry conflicts with a REASONING rule, the rule wins.

## The Dupin leap: a mode switch

The prefect's exhaustive search was correct *as generalizing*: past cases taught that hidden things
are hidden thoroughly. The pivotal fact it could not accommodate was that exhaustive search kept
failing against an adversary who knew it was coming. Dupin switched modes, generalizing to
abductive:

1. *Canonical set fails:* no searched location explains the missing letter.
2. *Posit:* an adversary whose strategy is to be obvious; the letter is hidden in plain sight.
3. *Reverse-engineer:* what adversary hides a letter where the searcher will not look? One who
   predicted the search pattern.
4. *Test:* look at the mantel.

Experts execute this in one gesture from decades of pattern-matched priors that dismiss six of seven
canonical proposals reflexively, leaving the unexplored logic space to suggest an unnamed
possibility. The agent has no such reflex and must read the fact-set signature, name the mode, and
watch its failure sign explicitly.

## Triage: when to run an abductive pass

- Constrained named set, several candidates survive → eliminative suffices; no pass.
- Many cases, one outlier → generalizing suffices *unless* the outlier is signaling; if the rule
  cannot accommodate it, run a pass.
- A pivotal anomaly no canonical candidate explains → run the four steps.
- A hidden assumption suspected in the option set itself, or an impasse where every direction gives
  partial fit → reverse-engineer from a posited locus rather than derive forward.

When unsure, surface the fact-pattern signature to the user and ask before spending a pass.

## Superposed requirements: collapse by trial, not deliberation

When the *requirements* are superposed (deliberately contradictory feedback, or two principled
conventions with no tiebreak), deliberation has no resistance gradient to descend; reasoning harder
produces a more elaborate tie. **Collapse the superposition with a trial**: encode the conflict as an
explicit conditional whose branch is decided by a cheap adversarial trial (a timeboxed proof
attempt, a build, a spike). The adversary (a Lean kernel, a compiler, a benchmark) finds a direction
argument could not.

- **Declare the apparatus.** A trial is a measurement; it reads the observable the apparatus
  defines. State the timebox and success criterion: a one-hour proof timebox measures "cheap to
  formalize in the current API", not "worth formalizing".
- **Pair every trial with a demotion path** (a recorded TODO carrying the witness sketch), so a failed
  trial lands as "expensive in this basis", not as a verdict on worth.
- **Choosing the apparatus is the real decision.** The trial finds *a* direction, not *the*
  direction; a wrong apparatus faithfully answers the wrong question.

This is the empirical cousin of step 4 (test): abduction tests reverse-engineered connections against
facts; here a posited conditional's branches are tested against a constructed adversary.
