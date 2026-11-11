# Capture-Candidate Tagging

Capture candidates are not a laundry list. What survives in `AGENTS-HINTS.md` or project-local
agent files is important, durable, and pointed: almost always true yet unusual, specific enough to
bite on real decisions yet not so local it decays with today's code. Tagging is two stages: shape
criteria decide whether a moment merits the test; the three-axis test decides whether it becomes a
tag.

**Stage 1 — shape criteria (pre-filter).** The situations that load this file (`AGENTS.md`, loading
rules) are the only ones worth stage 2; do not run it on every thought.

**Stage 2 — three-axis test.** Tag only if all three hold:

- **Durable.** Still correct after the session's context is gone; not tied to today's code, file
  layout, or decision. An implementation snapshot fails.
- **Unusual.** Selects against the reader's prior. "Here are seven facts" fails; "the obvious move
  is X, but actually Y because Z" passes.
- **Not bland.** Specific enough to guide a real decision. "Think carefully" fails; "route by
  cost-of-wrong, not task size" passes.

Failing any axis leaves it as session work only. The AND-gate is load-bearing: any pair admits the
wrong material (durable-and-unusual admits clever aphorisms; unusual-and-not-bland admits hot takes;
durable-and-not-bland admits local tips).

Surface survivors as `CAPTURE-CANDIDATE: <one-line summary>`. Never auto-write to any file; the user
decides whether to preserve it (`/note` or a manual edit).
