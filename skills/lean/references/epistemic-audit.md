# Epistemic audit of Lean changes

Retrograde audit that builds confidence in Lean changes beyond "it compiles". Input: the audit
target the caller supplies, namely a commit SHA, a range, a file, or declaration names; empty means
`HEAD`. Shared guard and scratch-only safety rules are in `SKILL.md`. This is an audit, not an
implementation workflow: report problems, never fix them.

## Phase 0 — scope

Resolve the target to (a) new or changed theorems and (b) new or changed definitions, instances,
notation, and attributes (the leak surface). Treat (b) as higher-risk than (a).

## Phase 1 — provenance

For each theorem, run `#print axioms <decl>` in a scratch file via `lake env lean`. Report the
closure. Flag `sorryAx`, `Lean.ofReduceBool`/`native_decide`, and any non-standard axiom (standard:
`propext`, `Classical.choice`, `Quot.sound`).

## Phase 2 — statement fidelity

Unfold each statement (`#check`, selectively `pp.all`) and restate it informally. Verify that name
and content correspond and that implicit and instance arguments resolve to the intended structures,
not degenerate ones.

## Phase 3 — vacuity probes

For each theorem, in a scratch file:

- construct a concrete nontrivial `example` witnessing the hypotheses;
- scan degenerate corners (zero dimension, trivial codomain, `n = 0`);
- attempt the conclusion without its hypotheses via `rfl`/`simp`/`fun_prop`. Success means the
  statement is trivially true: flag it.

## Phase 4 — hypothesis necessity

Re-elaborate each proof with each explicit hypothesis deleted, in a scratch copy of the statement
and proof; never delete a hypothesis in the source declaration. A surviving proof means the
statement is weaker than advertised: flag it, do not fix it. When a declaration cannot be copied
(private or `variable`-dependent), report that scope limit rather than editing the source.

## Phase 5 — environment leaks

For every instance, simp attribute, notation, or `variable` line in the diff, ask whether it changes
the meaning of any pre-existing statement. Check for autobound implicits and shadowing in new
statements.

## Phase 6 — report

A table: declaration × {axiom closure, witness, trivially true?, unnecessary hypotheses, leak
flags}. Then a prose verdict with every finding labelled confirmed (direct evidence), inferred
(reasoning from confirmed facts), or speculation. State that the audit raises confidence and does
not certify fidelity. Name any check skipped or limited and why.
