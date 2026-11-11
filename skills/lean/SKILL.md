---
name: lean
description: Audit the fidelity of Lean statements and proofs (axiom provenance, vacuity, hypothesis necessity, definitional leaks), or translate Lean declarations into classical textbook exposition as LaTeX. Lean projects only. Load for /lean/epistemic-audit, /lean/expound, or a direct request for either.
---

# Lean

Two read-only procedures for Lean projects: a retrograde fidelity audit and a classical exposition.
This skill does not teach general Lean implementation. Loading it does not switch agents or grant
permissions; the session's own edit and shell permissions still apply. A missing or denied required
resource is a blocker: report it, do not improvise the procedure from memory.

Resource paths below resolve from this skill's base directory (the directory holding this file;
`~/.config/opencode/skills/lean/`), never from the target project's working directory. Read them
with the Read tool. A command expands its input in its own body and passes it explicitly; resources
consume that input and are not command templates, so they never interpolate placeholders.

## Scope and guard

Lean projects only: the working directory must be a Lean project (`lakefile.lean` or
`lakefile.toml`). If it is not, say so and stop. Neither procedure is an implementation workflow:
findings are reported, never silently fixed, and neither one commits.

## Shared safety

- Probes, `#print axioms`, deleted-hypothesis re-elaboration, and similar experiments run only in
  scratch artifacts: a throwaway file under `/tmp/opencode/` run with `lake env lean`, never an edit
  to a source declaration, and never a source file temporarily changed then restored.
- Do not modify project source, build outputs, or the lake manifest. If a probe cannot be expressed
  in a scratch file, report that limit instead of touching the source.
- Never present a clean result as certification: these procedures raise confidence only.

## Selecting a reference

Load only the one that matches the request; never both.

| Resource (`references/`) | Owns | Load when |
|---|---|---|
| `epistemic-audit.md` | provenance, fidelity, vacuity, hypothesis, and leak checks of Lean changes; report format | auditing new or changed theorems, definitions, instances, or notation |
| `expound.md` | register, generality, classical derivation, dictionary, and LaTeX output contract | translating Lean declarations into textbook exposition |

Input comes from the invoking command's expanded argument, or from the user's own request when the
skill is loaded without a command. Resolve it as the loaded reference directs; if it is ambiguous,
ask before proceeding.
