---
description: "[jf] Accept a CAPTURE-CANDIDATE in-session: classify it into a target docs file and append on approval. Survives compaction unlike /session-end. Args: optional capture text; defaults to the most recent CAPTURE-CANDIDATE tag in the session."
---

# No fork: this command is short and interactive — every step needs user confirmation.

Capture text (optional): $ARGUMENTS

## Steps

1. **Identify the capture text.**
   - If $ARGUMENTS is non-empty, use it verbatim as the capture.
   - Otherwise, scan the current session for the most recent message containing
     a `CAPTURE-CANDIDATE:` tag and extract its one-line summary plus any
     immediately following context (up to the next blank line). Show me what
     you found and ask: "Use this? (yes / paste different text)"

2. **Classify the target file.** See `AGENTS-CAPTURE.md` for the two-stage criteria and
   `AGENTS-SESSION.md` §Rolling context for the target-file taxonomy. The four options are:
   `~/.config/opencode/AGENTS.md` (stable universal conventions), `docs/PLAN.md` (current-phase
   state), `docs/NOTES.md` (decisions, framings, surprises), `~/.config/opencode/AGENTS-HINTS.md`
   (global framings).

   State your classification choice and one-sentence reason. Ask: "Target correct? (yes / pick
   different)"

3. **Draft the exact text to append.** Apply the format for the target file:
   - `AGENTS.md`: concise rule or convention, no date prefix.
   - `PLAN.md`: integrate into the appropriate section or append a new one.
   - `NOTES.md`: `YYYY-MM-DD: <content>` (today's date). For surprises use
     `YYYY-MM-DD: If you try X, Y happens because Z.`
   - `AGENTS-HINTS.md`: dated entry with heading, 2–4 sentences max.

   Show the proposed text as a fenced block. Ask: "Append this? (yes / edit /
   abort)"

4. **On approval**, append to the target file. If the file does not exist,
   create it with a minimal header comment before the entry. Show the final
   appended content.

## Constraints

- Never write without explicit approval at step 3.
- Never modify existing content — append only (except PLAN.md which may
  warrant targeted edits; confirm before any edit).
- If the capture references a file path or symbol, include it in the appended
  text so it remains navigable out of context.
- Keep the appended text self-contained: a future reader with no session
  context must be able to understand it.
