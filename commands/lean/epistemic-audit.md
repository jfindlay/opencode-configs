---
description: "[jf] Retrograde epistemic audit of Lean changes: axiom provenance, statement fidelity, vacuity, hypothesis necessity, definitional leaks. Lean projects only. Args: commit SHA, range, file, or declaration names (default HEAD)."
---

# /lean/epistemic-audit

If the current project is not a Lean project (no `lakefile.lean`/`lakefile.toml`), say so and stop.

Audit target (commit SHA, range, file, or declaration names; empty means `HEAD`):

$ARGUMENTS

Load the `lean` skill, then read `references/epistemic-audit.md` from its base directory
(`~/.config/opencode/skills/lean/`) and follow it with the target above. Do not load the exposition
reference. This is an audit only: probes stay in scratch files, and nothing is fixed or committed.
