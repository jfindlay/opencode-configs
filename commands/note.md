---
description: "[jf] Capture a CAPTURE-CANDIDATE in-session: classify it into a target docs file and append on per-item approval. Args: optional capture text; defaults to the most recent CAPTURE-CANDIDATE tag."
---

No fork and no agent switch: this command is short and interactive, every step needs user
confirmation, and it runs as the current agent.

Capture text (optional; empty means the most recent tagged candidate):

$ARGUMENTS

## Steps

1. **Identify the capture text.**
   - If the supplied capture text is non-empty, use it verbatim.
   - Otherwise, scan the current session for the most recent message containing a
     `CAPTURE-CANDIDATE:` tag and extract its one-line summary plus any immediately following
     context (up to the next blank line). Show me what you found and ask: "Use this? (yes / paste
     different text)"

2. **Classify the target file.** `AGENTS-CAPTURE.md` holds the two-stage criteria for what deserves
   capturing. The targets:
   - **Project `AGENTS.md`** — a stable convention or anti-pattern for this project, broadly
     applicable and not tied to today's code.
   - **User-level `~/.config/opencode/AGENTS.md`** — a stable universal convention for every
     project. Rarely the right target; when in doubt, choose another.
   - **`docs/PLAN.md`** — current-phase state: what is decided, open, and next.
   - **`docs/NOTES.md`** — a decision, framing, mental model, or learning ("If X, Y happens because
     Z"). Rolling context: it exits into code or `AGENTS.md`.
   - **User-level `~/.config/opencode/AGENTS-HINTS.md`** — a framing or fact useful across
     projects.

   State your classification choice and one-sentence reason. Ask: "Target correct? (yes / pick
   different)"

3. **Draft the exact text to append.** Apply the format for the target file:
   - `AGENTS.md` (either level): concise rule or convention, no date prefix.
   - `PLAN.md`: integrate into the appropriate section or append a new one.
   - `NOTES.md`: `YYYY-MM-DD: <content>` (today's date); surprises as `If you try X, Y happens
     because Z.`
   - `AGENTS-HINTS.md`: a headed section of 2–4 sentences, no date.

   Show the proposed text as a fenced block. Ask: "Append this? (yes / edit / abort)"

4. **On approval**, append to the target file. If the file does not exist, create it with a minimal
   header comment before the entry. Show the final appended content.

## Constraints

- Never write without explicit approval at step 3. There are no automatic captures.
- This command is not a permission elevation. For `@architect` and `@dialectic`, an approved capture
  is their `/note` write trigger (`AGENTS-REASONING.md`); the edit permission prompt still
  applies.
- Never modify existing content — append only (except `PLAN.md`, which may warrant targeted edits;
  confirm before any edit).
- If the capture references a file path or symbol, include it in the appended text so it remains
  navigable out of context.
- Keep the appended text self-contained: a future reader with no session context must be able to
  understand it.
