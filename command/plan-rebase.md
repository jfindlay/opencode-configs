---
description: "[jf] Plan (do not execute) a narrative-arc rebase of the current branch. Groups commits into logical stages, proposes an ordering, and flags risks. Output is a rebase script for human review; the execution playbook below is what @git-editor follows when the user pastes the approved plan into a fresh session."
---

Base reference for the rebase: $ARGUMENTS (e.g., `master`, `jfindlay/main`). If empty, resolve it
via step 0 below.

This command does PLANNING. The "Execution playbook" section near the end carries the procedure
`@git-editor` follows when the user pastes an approved plan into a fresh session. Keep both halves
together so a planner can see what the executor will actually do.

**Never assume `origin`.** This user does not use `origin` as a remote name. Always run `git remote`
to discover the actual remote name(s); never hardcode `origin/...` in any command, prompt, or
example.

**Never fall back to local `main`/`master`.** The user does not mirror primary branches locally —
only topic branches are kept local. Primary branches live exclusively as remote-tracking refs
(`<remote>/main`, `<remote>/master`). Resolving to a bare local `main` will fail or, worse, silently
use a stale ref.

## Steps

0. **Resolve the base reference** (only if `$ARGUMENTS` is empty):

   a. Run `git remote` to list remotes.
   b. If exactly one remote exists, try in order until one resolves via `git rev-parse --verify`:
      - `<remote>/HEAD` (the remote's default branch symbolic ref)
      - `<remote>/main`
      - `<remote>/master`
      Use the first one that resolves as the base. Tell the user which one was selected.
   c. If multiple remotes exist OR none of the candidates resolve, show what was found (`git remote
      -v` output and any resolved candidates) and ask the user which base to use.
   d. If `<remote>/HEAD` is unset (common — `git rev-parse <remote>/HEAD` fails), suggest the user
      run `git remote set-head <remote> --auto` once to fix it, then proceed with whichever explicit
      branch resolved.

   Do not run `git fetch` — `fetch` is the user's responsibility and is idempotent on their side.
   Just use whatever the local refs already show.

1. Run in parallel:
   - `git rev-parse --abbrev-ref HEAD` — current branch.
   - `git log --oneline <base>..HEAD` — commits to reorder.
   - `git diff --stat <base>..HEAD` — scope.
   - `git log <base>..HEAD --format='%h %s%n%b%n---'` — full commit bodies.
   - Read any `docs/PLAN.md` in the repo for phase context.

2. Count the commits: `git rev-list --count <base>..HEAD`.

   - **If ≥20 commits**: fork a `@explore` subagent for the stage-analysis below. The commit-body
     reads are large and the grouping output is a compact table — pollution=YES, steering=NO, so
     fork applies. Pass the full `git log` output and the working directory. Ask the subagent to
     group commits into narrative stages, identify fixup/revert sequences, and flag
     boundary-crossing commits. Return to primary for steps 3–6.
   - **If <20 commits**: analyse inline without forking.

   Stage-analysis tasks (whether done inline or by subagent):
   - Group commits by topic / narrative stage. Each stage should tell one coherent story ("add the
     model layer", "wire the new model into the dispatcher", "remove the old dispatcher").
   - Identify fixup commits that belong squashed into earlier commits.
   - Identify revert/re-do sequences that should collapse.
   - Identify commits that cross stage boundaries (one commit that touches both "model" and
     "dispatcher" concerns) — flag these for splitting.

3. Propose a rebase plan as a table:

   | Stage | Proposed commit title | Source commits | Notes |
   |---|---|---|---|
   | 1 | ... | abc123, def456 | combine (edit directive) |
   | 2 | ... | ... | split required (edit directive) |

4. Emit the plan as an interactive-rebase script compatible with the `@git-editor` agent's execution
   strategy (see "Execution playbook" below; background and rationale in AGENTS-HINTS.md §`Addendum:
   agent-driven rebase execution strategy`).

   **Directive rules** — use only `pick` and `edit`; never `squash`, `fixup`, or `reword`. Those
   directives open `$GIT_EDITOR`, which the agent cannot drive. All message changes are handled at
   `edit` stops via `--amend -m`.

   - **`pick`**: commit passes through unchanged (title, body, content).
   - **`edit` — message change**: commit content unchanged but title or body needs updating. Agent
     will `--amend -m` at the stop.
   - **`edit` — combine**: this commit merges into the previous one. Mark clearly in the Notes
     column of the table (step 3) so the agent knows which `edit` stops are combines. The combine
     *intent* is what the planner specifies; the agent picks the procedure at execution time based
     on stop-state (clean stop → `reset --soft HEAD~1` + `--amend -m`; conflict stop → `git add` +
     `--amend -m` + `--skip`, no `reset --soft`). Do not bake a procedure choice into the plan.
   - **`edit` — split**: commit needs to be broken into two or more commits.  Mark clearly in Notes;
     the agent will surface the split instructions and pause for user guidance.

   Example output:

   ```
   pick   abc123 Concise title
   edit   def456 Fix typo in X        # combine into abc123
   edit   789abc Stage 2 start        # split required: see stage 2 notes
   pick   fedcba Another clean commit
   edit   1a2b3c Old title            # reword: approved title in stage table
   ```

5. Flag risks:
   - Stages where tests might fail between commits (non-bisectable history).
   - Commits that touch generated files (docker-compose.yaml, lockfiles).
   - Commits with ticket-id mismatches vs. the branch name.

6. STOP here. Present the plan and script. Do NOT run `git rebase`. Ask: "Execute this plan? (yes /
   modify / abort)". If yes, the user will paste the approved plan + script into a fresh
   `@git-editor` session, which follows the execution playbook below. Never execute from this
   command's session.

## Execution playbook

This section is for `@git-editor` when the user pastes an approved plan into a fresh session. The
plan is the authority — do not improvise grouping or ordering. If something during execution
suggests the plan is wrong (e.g. a merge conflict that reveals a missed dependency), STOP and
surface it for re-planning.

### Pre-flight

Before touching history, verify:

1. Working tree is clean (`git status --porcelain` returns empty).
2. The branch you're on matches the one the plan targets (confirm with user if ambiguous).
3. A backup ref exists. If not, create one: `git branch <current-branch>-prerebase-<timestamp>`.
   Tell the user the backup name so they can recover if needed.
4. The base ref in the plan is reachable (`git rev-parse --verify <base>`).
5. **Sanity-check the base shape.** This user does not keep primary branches (`main`, `master`)
   locally — only topic branches. Primary branches live exclusively as remote-tracking refs
   (`<remote>/main`, `<remote>/master`). Also: never assume the remote is named `origin`; this user
   does not use that name.
   - If the base is a bare name with no `/` (e.g. `main`, `master`, `develop`), STOP. Almost
     certainly the plan should have used `<remote>/<branch>`. Run `git remote` to show the actual
     remote name(s) and ask the user to confirm or correct the base before proceeding.
   - If the base is `origin/<anything>` and `git remote` does not list `origin`, STOP and surface
     the mismatch — the plan was generated against a wrong assumption.

If any pre-flight check fails, STOP and report. Do not proceed until the user explicitly clears the
failure.

### Execution

1. Announce the stage you're about to execute. Show the relevant slice of the approved plan.

2. **Install the approved todo list and start the rebase.**

   The approved plan uses only `pick` and `edit` directives — never `squash`, `fixup`, or `reword`
   (those would open `$GIT_EDITOR`; all message changes are handled via explicit `--amend -m` at
   `edit` stops instead).

   Write the approved todo list to a tempfile using the `Write` tool (NOT `printf > file` or `echo >
   file` — those violate AGENTS.md tool discipline and complicate permission matching).  Pick a
   stable tempfile path like `/tmp/rebase-todo-<branch>.txt`. Then invoke rebase using `cp` as the
   sequence editor so our list overwrites git's auto-generated template:

   ```
   # Step 1: use the Write tool to create /tmp/rebase-todo-<branch>.txt
   #         with one line per commit (pick or edit only).
   # Step 2: run exactly this single bash call:
   GIT_SEQUENCE_EDITOR="cp /tmp/rebase-todo-<branch>.txt" git rebase -i <base>
   ```

   Git invokes `$GIT_SEQUENCE_EDITOR <todo-path>`, so `cp <tempfile>` copies our file over git's
   template. No editor opens.

   The `GIT_SEQUENCE_EDITOR=... git rebase -i *` form has a dedicated allow rule in `@git-editor`'s
   frontmatter. Do NOT split the env-var assignment from the git invocation into separate bash calls
   — the env var wouldn't persist across subprocesses, and the combined form is what the permission
   rule matches.

   If `$GIT_EDITOR` or `$VISUAL` is invoked at any point during execution, that is a bug — STOP and
   report it rather than trying to work around it.

3. **Handle each rebase stop — first determine the stop-state, then dispatch by directive.**

   `git rebase -i` can pause in two structurally different states. The procedure for combining
   commits differs by one commit between them, and getting this wrong silently drops a commit.  At
   every stop, run `git status` first and classify:

   - **Clean stop** — `git status` reports "interactive rebase in progress" with a clean index and
     no unmerged paths. The commit named on the current `edit` line was applied successfully; `HEAD`
     *is* that commit.
   - **Conflict stop** — `git status` reports "interactive rebase in progress" plus "Unmerged
     paths". The commit named on the current line was *not* applied; `HEAD` is its predecessor.
     Conflicts are recorded in the index against `HEAD = predecessor`.

   This distinction is load-bearing for the combine procedure (3b below). For the message-only and
   pass-through cases, the clean-stop path is the only one that occurs (a conflict-stop on those
   commits exits per step 4 below before reaching the dispatch).

   At a **clean stop**, dispatch by the directive in the approved plan:

   a. **Message-only change** (reword equivalent): apply the approved title and body directly.  The
      `edit`-stop has already applied the commit, so `--amend` rewrites the just-applied commit in
      place:
      ```
      git commit --amend -m "<approved title>" -m "<approved body>"
      git rebase --continue
      ```

   b. **Combine with previous commit** (squash equivalent): the just-applied commit needs to fold
      into its predecessor. `reset --soft HEAD~1` moves `HEAD` back to the predecessor while keeping
      the just-applied changes staged; `--amend` then rolls them in:
      ```
      git reset --soft HEAD~1
      git commit --amend -m "<combined title>" -m "<combined body>"
      git rebase --continue
      ```

   c. **Pass through unchanged**: if the plan marks this commit `edit` only because it needs a split
      (noted in the plan table), stop and surface the split instructions to the user before
      continuing.

   d. **No change needed** (`pick` commits): rebase handles these automatically and does not stop;
      no action required unless a conflict arises.

   At a **conflict stop**, do NOT proceed autonomously — see step 4. The combine procedure differs:
   because `HEAD` is already the predecessor, `reset --soft HEAD~1` would be one commit too far back
   and silently drop a commit. The correct procedure (after the user-guided resolution of step 4) is
   `git add <resolved files>` followed by either `git rebase --continue` (which creates the
   conflicting commit on top of `HEAD`, preserving its identity) or, when the plan calls for
   combining the conflicting commit into `HEAD = predecessor`, `git commit --amend -m "<combined
   title>" -m "<combined body>"` followed by `git rebase --skip` to drop the now-absorbed entry from
   the todo and proceed.

   Always show `git log --oneline <base>..HEAD` after `--continue` (or `--skip`) resolves, before
   the next stop, so the user can verify state.

4. If a conflict arises at any step, STOP. Show `git status`, the conflicting files, and the
   relevant plan context. Ask the user how to resolve. Do not resolve conflicts autonomously.  After
   the user provides resolution guidance, follow the conflict-stop branch in step 3 — never the
   clean-stop combine procedure (`reset --soft HEAD~1` is wrong on the conflict path).

5. Preserve trailer lines (Co-authored-by, Signed-off-by) across combines. When using `reset --soft`
   + `--amend -m` (clean-stop combine) or plain `--amend -m` (conflict-stop combine) for
   squash-equivalents, re-append trailers from the absorbed commit if the approved plan includes
   them.

### Finalization

When all stages are complete:

1. Run `git log --oneline <base>..HEAD` for the final state.
2. Run `git diff <base>..HEAD --stat` to confirm the net diff scope is consistent with the
   pre-rebase state (excluding commits that were intentionally split/merged).
3. Emit the suggested push command as plain text — do NOT execute it: `git push --force-with-lease
   <remote> <branch>` (substitute the actual remote name; this user does not use `origin`).
4. Remind the user: backup branch is `<name>`; reflog entry is available for recovery for 90 days.

## Constraints

- This command is PLANNING ONLY. Never run `git rebase`, `git commit --amend`, or any
  history-rewriting command from this flow.
- Never force-push. Even if I later ask you to execute, confirm before pushing.
- Preserve trailer lines (Co-authored-by, Signed-off-by) across squashes.
- If the rebase base resolves to a trunk branch (`<remote>/main`, `<remote>/master`), double-check —
  usually the base should be a feature-branch ancestor, not the trunk.
- A bare base name without a remote prefix (e.g. `main`, `master`) is almost always wrong here; the
  user does not keep local copies of primary branches.  Surface and confirm before proceeding.
