---
description: "[jf] Retrograde epistemic audit of Lean changes — axiom provenance, vacuity, hypothesis necessity, definitional leaks — confidence beyond compilation success. Lean-repo only."
---

If the current project is not a Lean project (no `lakefile.lean`/`lakefile.toml`), say so and
stop.

Audit target: $ARGUMENTS (commit SHA, range, file, or declaration names; default HEAD).

Phase 0 — scope. Resolve the target to (a) new/changed theorems, (b) new/changed definitions,
instances, notation, and attributes (the leak surface). Treat (b) as higher-risk than (a).

Phase 1 — provenance. For each theorem, run `#print axioms <decl>` in a scratch file via
`lake env lean`. Report the closure; flag `sorryAx`, `Lean.ofReduceBool`/`native_decide`, and
any non-standard axiom (standard: propext, Classical.choice, Quot.sound).

Phase 2 — statement fidelity. Unfold each statement (`#check`, selectively `pp.all`) and
restate it informally. Verify name ↔ content correspondence and that implicit/instance
arguments resolve to the intended structures, not degenerate ones.

Phase 3 — vacuity probes. For each theorem: construct a concrete nontrivial `example`
witnessing the hypotheses; scan degenerate corners (zero dimension, trivial codomain, n = 0);
attempt the conclusion without hypotheses via `rfl`/`simp`/`fun_prop` (success = trivially
true, flag).

Phase 4 — hypothesis necessity. Re-elaborate each proof with each explicit hypothesis deleted;
a surviving proof means the statement is weaker than advertised (flag, don't auto-fix).

Phase 5 — environment leaks. For every instance, simp attribute, notation, or `variable` line
in the diff, ask: does this change the meaning of any *pre-existing* statement? Check for
autobound implicits and shadowing in new statements.

Phase 6 — report. Table: declaration × {axiom closure, witness, trivially-true?, unnecessary
hypotheses, leak flags}; prose verdict with findings labeled confirmed / inferred /
speculation. The audit raises confidence; it does not certify fidelity — say so in the report.
