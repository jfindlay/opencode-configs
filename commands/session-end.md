---
description: "[jf] End-of-session retrospective. Forks a @session-scan subagent to scan the session for capture-worthy content and propose diffs to AGENTS.md / PLAN.md / NOTES.md / AGENTS-HINTS.md. User reviews; no automatic writes."
---

Perform a session-end retrospective on this session before it closes.

Fork a `@session-scan` subagent with the prompt below. The subagent is read-only
and must not edit any files — it produces proposed diffs as text, nothing more.
`@session-scan` is Haiku-pinned for cost efficiency on high-volume history scans;
its classification rules are fully specified in the prompt below, so low-judgment
throughput is the right tradeoff here.

After the subagent returns, present the proposals to me grouped by target file. I
will decide which to apply.

---

SUBAGENT PROMPT (pass this verbatim to `@session-scan`):

```
Working directory: $CWD
Thoroughness: very thorough
Read-only: YES. DO NOT EDIT ANY FILES.

GOAL
Review this session's message history and identify content that should be
preserved outside the session because it will be expensive or impossible to
re-derive. Produce classified proposals — exact text to append — targeting one
of four files. The user will review and accept/reject each proposal.

CAPTURE-WORTHY CRITERIA
Flag content that meets any of these:
1. Spontaneously good framing that cracked a stuck problem.
2. Serendipitous finding that turned out to matter later in the session.
3. Unexpectedly insightful observation (from either side).
4. Expensive-to-learn result — long investigation yielding a short finding.
5. Any content explicitly tagged `CAPTURE-CANDIDATE:` in the session.

TARGET FILE CLASSIFICATION
For each item, classify the target file:

- `AGENTS.md` (user or project-level) — only for STABLE conventions, style
  rules, or anti-patterns that apply broadly. Rarely the right target. If in
  doubt, do not propose AGENTS.md.
- `docs/PLAN.md` — current-phase state: what's decided, what's open, what's
  next. Propose wholesale rewrites if the current file is stale; propose
  targeted edits if incremental.
- `docs/NOTES.md` — decisions, framings, mental models, and learnings
  (including "If X, Y happens because Z" surprises). Dated entry:
  "YYYY-MM-DD: <content>". Append-only.
- `~/.config/opencode/AGENTS-HINTS.md` — user-level framings / mental models
  the agent found useful across projects ("When exploring X, start at Y, not
  at Z"). Append-mostly.

INVESTIGATION TASKS
1. Scan all user messages and all assistant reasoning/text content.
2. For each capture-worthy item, extract the minimal self-contained statement
   (3 sentences maximum when possible).
3. Classify the target file per the criteria above.
4. Check whether the project has the target file already. Report:
   - "CREATE" if the file does not exist and the content is the first entry.
   - "APPEND" if the file exists.
   - "EDIT" if the proposal modifies existing content.
5. Do not propose more than 15 items total. Rank by durability of value and
   expense of re-derivation. Quality over quantity.

OUTPUT FORMAT
For each proposal, emit a block of this shape:

  ## Proposal N
  Target: <absolute file path>
  Operation: CREATE | APPEND | EDIT
  Source session turn(s): <message ids or brief quote>
  Reasoning: <one sentence: why this is capture-worthy>

  ---8<--- proposed content ---8<---
  <exact text to append or replace>
  ---8<--- end ---8<---

After all proposals, emit a summary section:

  ## Summary
  - Total proposals: N
  - By target: AGENTS.md (a), PLAN.md (b), NOTES.md (c), AGENTS-HINTS.md (d)
  - Highest-value single item: <one-line description>
  - Items deliberately NOT proposed (and why): <short list>
```

---

After the subagent returns, present the proposals to me in the order they were
produced. Do NOT apply anything automatically. For each proposal, I will say
"yes", "no", or "modify — ..." and you will act only on my instruction.
