---
description: "[jf] Inspect uncommitted changes, draft a conventional commit message, and ask before committing. Supports optional $ARGUMENTS as a ticket id, scope hint, or --no-coauthor flag."
---

Interactive draft/approve loop for direct user-driven commits. Delegates mechanical git work to a
forked `@committer` on approval. For orchestrator-dispatched commits, dispatch `@committer` directly
(see `agent/committer.md`). Scope hint: $ARGUMENTS

1. **Inspect in parallel:** `git status`, `git diff`, `git diff --cached`, `git log --oneline -n 20`.

2. **Draft the commit message** per `AGENTS.md` git conventions:
   - Title: `ticket-XXXX Concise description`. Ticket from $ARGUMENTS, then branch name
     (`git rev-parse --abbrev-ref HEAD`), then ask if neither yields one.
   - Body: 1–4 sentences on the *why*; wrap at 72 chars.
   - Co-author trailer (default ON): `Co-authored-by: Claude Sonnet 5 <noreply+claude-sonnet@anthropic.com>`.
     Suppress only if $ARGUMENTS contains `--no-coauthor` or user asks.
   - If the diff is obviously multi-concern, propose a split in one sentence; stop for confirmation.
   - If any file looks like a secret / credential / `.env`, ABORT and warn.

3. **Show** the proposed message + `git diff --stat`. Use the Question tool: "OK to commit?
   (yes / edit message / split / abort)"

4. **On approval**, fork `@committer`:
   ```
   Working directory: <current working directory>

   SESSION CONTRACT
   <one sentence naming what this commit lands>

   EXPECTED FILES
   <specific paths to include>

   COMMIT MESSAGE (verbatim)
   <approved title on line 1, body on following lines>

   STAGING MODE
   exact
   ```
   Relay `COMMITTED: <hash> <title>` or `REFUSED: …`. On refusal, surface the reason and stop.
