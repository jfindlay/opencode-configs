---
description: "[jf] Inspect uncommitted changes, draft a conventional commit message, and ask before committing. Supports optional $ARGUMENTS as a ticket id, scope hint, or --no-coauthor flag."
---

# Steering=YES through the interactive part — split decision, message approval, secret check. The
# final commit mechanics are delegated to a forked @committer subagent so that "commit" stays one
# composable primitive. Steering ends once the user approves the message.

## When to use which

`/commit` owns the **interactive draft/approve loop** — the user is present, the split decision and
message approval gate on confirmation, the session is short and steerable. Once the message is
approved, `/commit` delegates the mechanical `git add`/`git commit` to a forked `@committer`
(passing the approved message verbatim, `STAGING MODE: exact`). This is the default for direct
user-driven commit work.

For **autonomous-chain commits** (orchestrating agents like `@architect` or a long-running
`@build` dispatching implementation subagents in sequence), dispatch `@committer` directly with a
session-contract summary + expected-files list; it drafts its own message and either commits
cleanly or refuses (default `strict` mode — drift is a refusal). The difference is only *who owns
the message and the approval gate*: `/commit` keeps that loop with the user; an orchestrator hands
`@committer` a contract and trusts its draft. Both bottom out in the same commit primitive. See
`agent/committer.md`.

## What this command does

Draft and create a commit for the current uncommitted changes, following user commit conventions.

Scope hint from user (optional): $ARGUMENTS

## Steps

1. Run these in parallel:
   - `git status` in the current working directory.
   - `git diff` (unstaged).
   - `git diff --cached` (staged).
   - `git log --oneline -n 20` to see recent commit style in this repo.

2. Analyze the changes:
   - What is the nature of the change? (feat / fix / refactor / test / docs / chore — do NOT use
     these as prefixes; use natural language.)
   - Is it a single coherent change or should it be split into multiple commits? If split is better,
     propose the split and stop for confirmation.
   - Does any file look like a secret / credential / `.env` / key? If so, ABORT and warn me.

3. Draft the commit message:
   - **Title format**: `ticket-XXXX Concise description` (GitHub or GitLab ticket ID, sentence case,
     no trailing period). If $ARGUMENTS provides a ticket id, use it. Otherwise, check the branch
     name (`git rev-parse --abbrev-ref HEAD`) for a ticket id pattern like `user/project-1234/slug`.
     If neither source yields one, ask me for the ticket id before proceeding.
   - **Body**: 1–4 sentences explaining the *why*, not the *what*. Optional bullet points for
     distinct change aspects. Wrap lines at 72 characters for the body.
   - **Co-author trailer (default ON).** Append a `Co-authored-by:` line after a blank line at the
     end of the body, crediting the agent that produced the diff. The agent did the intellectual
     work; omitting attribution is credit-laundering. Use the current session's model:
     `Co-authored-by: Claude Sonnet 4.6 <claude-sonnet@anthropic.com>`. Suppress only if
     $ARGUMENTS contains `--no-coauthor` or I explicitly ask to omit it.

4. Show me the proposed commit message + a `git diff --stat` of what will be included. Use the
   Question tool to ask: "OK to commit? (yes / edit message / split / abort)"

5. On approval, delegate the commit to a forked `@committer` (do not `git add`/`git commit` inline):
   ```
   Working directory: <current working directory>

   SESSION CONTRACT
   <one sentence naming what this commit lands, from the analysis in step 2>

   EXPECTED FILES
   <the specific paths to include — the same set you would have git-added>

   COMMIT MESSAGE (verbatim)
   <the approved title on line 1, body on the following lines>

   STAGING MODE
   exact
   ```
   - `STAGING MODE: exact` because the user has chosen a specific fileset and unrelated worktree
     changes should be left alone, not treated as drift.
   - If the user chose to commit *all* modifications (no selective split), still pass the full
     modified set as `EXPECTED FILES` — `@committer` never runs a bare `git add .`.
   - Relay the subagent's `COMMITTED: <hash> <title>` or `REFUSED: …` line. On refusal (e.g. a
     secret-shaped file or hook failure), surface the reason and stop; do not commit inline as a
     fallback.

## Constraints

- NEVER skip hooks (`--no-verify`, `--no-gpg-sign`).
- `@committer` creates new commits only; it cannot amend (the flag is denied). If I explicitly ask
  to amend the HEAD commit, this is a `@git-editor` job, not a `@committer` delegation — route there
  instead.
- NEVER push to remote. Stop after commit.
- `@committer` REFUSES on a pre-commit hook failure and relays the hook output. When that happens,
  read the output, fix the issue, and re-run this flow to create a NEW commit — do not amend, do not
  bypass the hook.
- If the commit-title ticket id is unclear, STOP and ask before drafting. Do not guess. (Ticket
  resolution happens here, during drafting — the verbatim message handed to `@committer` is already
  final.)
