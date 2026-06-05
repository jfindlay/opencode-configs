# Session Discipline and Rolling Context

Load trigger: at session start; when splitting a session; when writing or managing rolling-context
docs (PLAN.md, NOTES.md).

## Session discipline

- **Split early.** If a session exceeds ~200 messages OR has compacted more than twice, stop and
  recommend the user start a fresh session scoped to the remaining work. Compactions are lossy and
  expensive.
- **Write a phase handoff.** Before splitting, append a short state-of-play summary to
  `docs/PLAN.md` (or project-appropriate equivalent) so the next session starts with verbatim fresh
  context, not a compacted summary.
- **Don't paste review-bot output verbatim** as the first message — summarize the action items. The
  bot output carries HTML/emoji/embedded code blocks that inflate context 3–5×.
- **Use @<agent> invocations explicitly** when starting long work.

## Rolling context files (project-level)

Current-phase context, decisions, and surprises live in separate append-mostly files in the
project's docs tree. All are transient — their content has two intended exits: effect a change in
the code, or land in `AGENTS.md` / `README.md`. At session start, skim the ones that exist.

- `docs/PLAN.md` — current phase: what we're working on, what's decided, what's open, what's next.
  Rewritten at phase boundaries. Concise (1–2 pages). Delete when the plan is executed.
- `docs/NOTES.md` — decisions, framings, mental models, and learnings (If X, Y happens because Z.)
  captured mid-project. Append-mostly. Absorb durable decisions/framings/models/learnings into
  `AGENTS.md` or the user-level `~/.config/opencode/AGENTS-HINTS.md` at merge time, then delete.
