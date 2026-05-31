---
description: "[jf] Route OpenCode config edits to the git-revisioned source of truth at opencode-config/, then stage a commit. Runtime ~/.config/opencode/ is symlinked from the git repo."
---

# No fork: every step is short and steerable — file selection, edit approval, commit message
# approval. Steering=YES throughout.

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
     - `agent/<name>.md` (build, plan-deep, explore, rebase, verify, session-scan, general)
     - `command/<name>.md` (existing or new)

2. **Make the edit in OPENCODE.** Use `Edit` or `Write` against the OPENCODE path, never RUNTIME. If
   the edit is non-trivial (new file, structural change, multiple sections), show the proposed
   change as a fenced block first and ask "Apply this? (yes / edit / abort)" via the Question tool.

3. **Commit.** Stage the changed files, formulate a commit message, and commit.

## Constraints

- NEVER add runtime artifacts to OPENCODE: `node_modules/`, `bun.lock`, `package.json`,
  `package-lock.json`, `plugins/`, anything under `.opencode/` or similar.  These are managed by
  OpenCode itself.
- NEVER push to remote. Commits stay local until the user pushes.
- NEVER skip git hooks or use `--amend` unless the user explicitly requests it.

## Exit report

- Files edited (under OPENCODE).
- Commit hash and title, or "no commit (changes pending)".
