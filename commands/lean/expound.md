---
description: "[jf] Translate Lean declarations (physlib/Mathlib) into classical textbook exposition in Landau–Lifshitz register, delivered as compilable LaTeX. Lean projects only. Args: commit SHA, file path, or declaration names."
---

# /lean/expound

If the current project is not a Lean project (no `lakefile.lean`/`lakefile.toml`), say so and stop.

Declarations to expound (commit SHA, file path, or one or more declaration names):

$ARGUMENTS

Load the `lean` skill, then read `references/expound.md` from its base directory
(`~/.config/opencode/skills/lean/`) and follow it with the input above. Do not load the audit
reference. If a required resource cannot be read, stop and report the blocker; do not work from
memory. The command only reads source and answers with the LaTeX document; it edits nothing.
