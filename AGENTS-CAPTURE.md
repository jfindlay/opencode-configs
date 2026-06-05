# Capture-Candidate Tagging

Load trigger: when you produce or encounter a CAPTURE-CANDIDATE-shaped finding.

Capture candidates are not a laundry list. The content that survives in the user's global
`AGENTS-HINTS.md` or project-local agent files should be important, durable, and pointed — almost
always true yet unusual, specific enough to bite on real decisions yet not so local it decays with
today's code. Tagging is a two-stage pipeline: the shape-criteria decide whether a moment is worth
running the test on; the three-axis test decides whether that moment becomes a tag.

**Stage 1 — shape-criteria (pre-filter).** Run the stage-2 test when you produce or encounter one
of these. Don't run it on every thought.

- Spontaneously good framing that cracked a stuck problem.
- Serendipitous finding that turned out to matter.
- Expensive-to-learn result (long investigation → short finding).

**Stage 2 — three-axis test (the gate).** Tag only if the content passes all three:

- **Durable / almost-always-true.** Still correct after the session's context is gone. Not tied to
  today's code, today's file layout, today's decision. If the framing reads as an implementation
  snapshot, it fails this axis.
- **Unusual.** Counterintuitive enough to select against the reader's prior. "Here are seven facts"
  fails; "the obvious move is X, but actually Y because Z" passes.
- **Not universal-enough-to-be-bland.** Specific enough to guide a real decision. "Think carefully"
  fails; "route by cost-of-wrong, not task size" passes.

Failing any one axis means it's not a capture candidate — it's good session work that belongs in
the session only. The AND-gate is load-bearing: pairwise combinations admit the wrong material
(durable-and-unusual without non-bland admits clever aphorisms; unusual-and-not-bland without
durability admits hot takes; durable-and-not-bland without unusualness admits local tips).

Surface survivors with a brief tag: `CAPTURE-CANDIDATE: <one-line summary>`. Do NOT auto-write to
any file. The tag just makes the insight visible so the user can decide whether to preserve it (via
`/note`, `/session-end`, or manual edit).
