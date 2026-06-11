---
description: "[jf] Inspect uncommitted changes, draft a conventional commit message, and ask before committing. Supports optional $ARGUMENTS as a ticket id or scope hint."
---

# No fork: commit flow is short and every step needs user confirmation # (split decision, message
approval, secret check). Steering=YES throughout.

## When to use which

`/commit` is the **interactive** commit flow — the user is present, every step gates on
confirmation, the session is short and steerable. This is the default for direct user-driven
commit work.

For **autonomous-chain commits** (orchestrating agents like `@architect` or a long-running
`@build` dispatching implementation subagents in sequence), use the `@committer` subagent
instead. It takes a session-contract summary + expected-files list and either commits cleanly or
refuses — no user-confirmation step, but stricter scope-drift refusal as compensation. See
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

4. Show me the proposed commit message + a `git diff --stat` of what will be included. Use the
   Question tool to ask: "OK to commit? (yes / edit message / split / abort)"

5. On approval:
   - `git add` the appropriate files (use `-u` if all modifications, specific paths otherwise —
     never bare `git add .`).
   - `git commit -m "<title>" -m "<body>"`.
   - Show `git log -1` and `git status` to confirm.

## Constraints

- NEVER skip hooks (`--no-verify`, `--no-gpg-sign`).
- NEVER use `git commit --amend` unless I explicitly request it AND the HEAD commit was authored in
  this session AND has not been pushed.
- NEVER push to remote. Stop after commit.
- If pre-commit hook fails, read its output, fix the issue, create a NEW commit — do not amend.
- If the commit-title ticket id is unclear, STOP and ask. Do not guess.
