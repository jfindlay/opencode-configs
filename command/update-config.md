---
description: "[jf] Route OpenCode config edits to the git-revisioned source of truth at opencode-config/, then stage a commit. Runtime ~/.config/opencode/ is symlinked from the git repo."
---

# Steering=YES through file selection, edit approval, and message approval — all interactive. The
# final commit step forks a single @committer subagent to perform the mechanical git work, so that
# "commit" stays one composable primitive rather than re-implemented inline here.

Edit target / scope hint (optional): $ARGUMENTS

## Background — why this command exists

OpenCode configs are git-revisioned. The authoritative source is in the `opencode-config/` repo. The
runtime location ~/.config/opencode/ is **symlinked** to the git repo.

## Path conventions

Two short names used below:

- **OPENCODE** = `opencode-config/`
- **RUNTIME** = `~/.config/opencode`

The repo has a `.gitignore` (which is actually provided by OpenCode itself), so files in RUNTIME
that don't exist in OPENCODE are preserved (e.g.  `bun.lock`, `node_modules/`, `package.json`,
`plugins/`). These are runtime artifacts and must NOT be added to OPENCODE.

## Steps

1. **Identify the edit target.**
   - If $ARGUMENTS names a file (e.g. `AGENTS.md`, `command/note.md`, `agent/build.md`), resolve it
     to a path under OPENCODE.
   - If $ARGUMENTS describes intent (e.g. "add a new command for X", "tweak the build agent"), state
     the file you intend to edit and confirm with the Question tool before proceeding.
   - If $ARGUMENTS is empty, ask which file to edit, listing the standard candidates:
     - `AGENTS.md`, `AGENTS-REASONING.md`, `AGENTS-HINTS.md`, `AGENTS-REASONING-HINTS.md`,
       `AGENTS-LOG.md`
     - `opencode.json`
       - `agent/<name>.md` (build, architect, dialectic, explore, git-editor, verify, session-scan, general)
     - `command/<name>.md` (existing or new)

2. **Make the edit in OPENCODE.** Use `Edit` or `Write` against the OPENCODE path, never RUNTIME. If
   the edit is non-trivial (new file, structural change, multiple sections), show the proposed
   change as a fenced block first and ask "Apply this? (yes / edit / abort)" via the Question tool.

3. **Commit via a forked `@committer`.** Do not stage or commit inline — delegate the mechanical
   git work to a single `@committer` subagent. This keeps "commit" one composable primitive shared
   with `/commit` and the autonomous chains.

   a. Draft a commit message (title + body) for the edited files, following the repo's plain
      no-ticket convention (check `git log --oneline -5` for recent style).
   b. The commit content and message are settled by this point, so message approval is optional:
      offer the drafted message and ask whether to commit as-is or revise (Question tool). Skip the
      gate if the user already approved a message this turn.
   c. Fork `@committer` with this input:
      ```
      Working directory: <absolute path to opencode-config>

      SESSION CONTRACT
      <one sentence naming the config change that landed>

      EXPECTED FILES
      <the exact paths edited under OPENCODE, comma- or bullet-separated>

      COMMIT MESSAGE (verbatim)
      <the approved title on line 1, body on the following lines>

      STAGING MODE
      exact
      ```
      `STAGING MODE: exact` is deliberate: config edits often coexist with unrelated dirty files in
      the worktree (a transient `PLAN.md`, an editor `.swp`), and this command should commit only
      what it touched rather than refuse on drift.
   d. Relay the subagent's `COMMITTED:` or `REFUSED:` line. On refusal, surface the reason and
      stop — never fall back to an inline commit.

## Constraints

- NEVER add runtime artifacts to OPENCODE: `node_modules/`, `bun.lock`, `package.json`,
  `package-lock.json`, `plugins/`, anything under `.opencode/` or similar.  These are managed by
  OpenCode itself.
- NEVER push to remote. Commits stay local until the user pushes.
- NEVER skip git hooks or use `--amend` unless the user explicitly requests it.

## Exit report

- Files edited (under OPENCODE).
- The `@committer` result: `COMMITTED: <hash> <title>`, the `REFUSED: …` reason, or "no commit
  (changes pending)".
