# Classical exposition of Lean declarations

Translate Lean declarations (physlib/Mathlib style) into classical textbook exposition delivered as
compilable raw LaTeX. Input: the declarations the caller identifies, namely a commit SHA, a file
path, or one or more declaration names. Shared guard and scratch-only safety rules are in
`SKILL.md`; this procedure only reads source and writes the document in the reply.

## Resolving the input

For a commit, `git show` it and expound the new or changed public declarations. For a file or
names, read the source. If it is ambiguous, ask which declarations before writing.

## Output contract

Produce a single, complete, compilable LaTeX document (`article` class; `amsmath`, `amssymb`,
`amsthm`) in a fenced code block, following these register and content rules:

1. **Landau–Lifshitz register.** Prose-first, "we" voice, economical and confident. The argument is
   carried by flowing sentences with numbered display equations; sections with short declarative
   titles; `lemma`/`corollary`/`remark` environments used sparingly; asides and formal-text
   cross-references live in footnotes.
2. **Unfold all Lean shorthand into classical mathematics.** `fderiv ℝ f x` becomes the Fréchet
   derivative with its defining first-order expansion; `ContDiff ℝ n f` becomes the class `C^n`
   (explain the extended scale `ℕ ∪ {∞, ω}` only if the statement quantifies over it); index types
   like `Fin 1 ⊕ Fin d` become classical index sets, explained in a footnote. Present definitions
   before the lemmas that use them.
3. **State in the source's generality** (arbitrary normed spaces, etc.) but in classical notation.
   Make every regularity hypothesis explicit.
4. **Prove classically, not by transliteration.** Give the derivation a careful textbook would print
   (e.g., the double-MVT argument for Schwarz), not a paraphrase of the Mathlib proof term. Where
   the formal proof is sharper or structurally different, say so in a remark rather than
   complicating the main text.
5. **Remarks on sharpness.** Where a hypothesis is stronger than necessary (convenience vs.
   minimal), or a classical counterexample illuminates why a hypothesis is needed, add a short
   remark. Note conventions silently managed by the formal text (argument slot order, index
   placement without metric contraction).
6. **Close with a dictionary remark** mapping each load-bearing Lean token (`@[fun_prop]`, cited
   Mathlib lemmas, tactic steps) to its place in the exposition.
7. Wrap the LaTeX source lines per the `AGENTS.md` line width. After the document, remind the reader
   to compile with two `pdflatex` passes or `latexmk -pdf` so cross-references resolve.
