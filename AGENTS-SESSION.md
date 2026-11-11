# Session Discipline and Rolling Context

Load trigger: at session start; when splitting a session; when writing or managing rolling-context
docs (PLAN.md, NOTES.md).

## Session discipline

- **Split early.** If a session exceeds ~200 messages OR has compacted more than twice, stop and
  recommend the user start a fresh session scoped to the remaining work. Compactions are lossy and
  expensive. The message count is a coarse fallback warning, not a universal optimal horizon — it
  fires when nothing better is available, not as a claim that ~200 is the right size for every
  project or model. Where a measured cost/capacity signal exists (see
  `plugins/session-economics.js`), prefer it; treat either signal as a prompt to reassess, not a
  command to abandon uncommitted work or force a compaction. Zero compactions is not itself evidence
  of context integrity — integrity is a qualitative judgment about whether reasoning still tracks
  verified current facts, not a count.
- **Write a phase handoff.** Before splitting, append a short state-of-play summary to
  `docs/PLAN.md` (or project-appropriate equivalent) so the next session starts with verbatim fresh
  context, not a compacted summary.
- **Don't paste review-bot output verbatim** as the first message — summarize the action items. The
  bot output carries HTML/emoji/embedded code blocks that inflate context 3–5×.
- **Use @<agent> invocations explicitly** when starting long work.

## Rolling context files (project-level)

Current-phase context, decisions, and surprises live in separate append-mostly files in the
project's docs tree. All are rolling context, not shipped documentation — their content has two
intended exits: effect a change in the code, or land in `AGENTS.md` / `README.md`. At session start,
skim the ones that exist.

- `docs/PLAN.md` — current phase (or current sub-track): what we're working on, what's decided,
  what's open, what's next. Rewritten at phase boundaries. Keep it concise, sized to the work's
  scope and the capacity of the context that will hold it; never drop a required contract or
  recovery record to shorten it. Retain prior content until its reconciliation and any outstanding
  handoff obligations are satisfied; delete once the plan is executed and reconciled.
- `docs/ROADMAP.md` — long-arc projects only: the project-lifetime view of sub-tracks, reconciled at
  sub-track boundaries. It outlives any one PLAN but is rolling context, not shipped documentation;
  keep what reconciliation and unresolved handoffs still need.
- `docs/NOTES.md` — decisions, framings, mental models, and learnings (If X, Y happens because Z.)
  captured mid-project. Append-mostly. Absorb durable decisions/framings/models/learnings into
  `AGENTS.md` or the user-level `~/.config/opencode/AGENTS-HINTS.md` at merge time, then delete.
