---
description: "[jf] Route OpenCode config edits to the salt-managed source of truth at opencode-config/, then stage a commit. Runtime ~/.config/opencode/ is a derived copy and will be overwritten by the next `sudo salt-call --local state.apply opencode`."
---

# No fork: every step is short and steerable — file selection, edit approval, commit message
# approval. Steering=YES throughout.

Edit target / scope hint (optional): $ARGUMENTS

## Background — why this command exists

OpenCode configs are git-revisioned and managed by salt. The authoritative source is in the
`opencode-config/` repo.

The runtime location ~/.config/opencode/ is **derived** and overwritten on every `sudo salt-call
--local state.apply opencode`. Editing the runtime copy directly is a footgun: changes survive only
until the next state apply, then vanish silently.

This command enforces the rule: edits land in the opencode-config repo, get committed, and propagate
to runtime via salt-call (which the user runs manually outside the agent).

## Path conventions

Two short names used below:

- **REPO** = `opencode-config/`
- **RUNTIME** = `~/.config/opencode`

The salt state has `clean: false`, so files in RUNTIME that don't exist in OPENCODE are preserved
(e.g.  `bun.lock`, `node_modules/`, `package.json`, `plugins/`, `.gitignore`). These are runtime
artifacts and must NOT be added to OPENCODE.

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

2. **Drift check.** Before editing, diff the target file between OPENCODE and RUNTIME:
   ```
   diff -u OPENCODE/<path> RUNTIME/<path>
   ```
   - **Identical**: proceed.
   - **Differs**: STOP. Show the diff and ask the user which side is authoritative. Possible causes:
     a runtime edit was made directly (must be promoted into OPENCODE), or a OPENCODE edit was made
     but salt-call hasn't run yet. Resolve before editing.
   - **Missing in OPENCODE** (file exists in RUNTIME only): this is either a runtime artifact
     (allowed — see Path conventions) or an unpromoted edit. Confirm with user.
   - **Missing in RUNTIME** (file exists in OPENCODE only): unusual; salt-call hasn't run since last
     edit. Note and proceed.

3. **Make the edit in OPENCODE.** Use `Edit` or `Write` against the OPENCODE path, never RUNTIME. If
   the edit is non-trivial (new file, structural change, multiple sections), show the proposed
   change as a fenced block first and ask "Apply this? (yes / edit / abort)" via the Question tool.

5. **Remind the user to commit and apply.** Do NOT attempt to run salt-call from the agent — it
   requires sudo and the user prefers to manage that step manually.

## Constraints

- NEVER edit RUNTIME directly as the primary write. Mirroring after a OPENCODE write is permitted
  (step 3) and useful for in-session visibility, but the OPENCODE write is canonical.
- NEVER add runtime artifacts to OPENCODE: `node_modules/`, `bun.lock`, `package.json`,
  `package-lock.json`, `plugins/`, `.gitignore`, anything under `.opencode/` or similar.  These are
  managed by OpenCode itself, not by salt.
- NEVER push to remote. Commits stay local until the user pushes.
- NEVER skip git hooks or use `--amend` unless the user explicitly requests it.
- NEVER run `sudo salt-call`. Always remind the user to run it manually.
- If a drift is detected in step 2 and the user can't resolve which side is authoritative, STOP and
  surface the diff. Do not guess.

## Exit report

- Files edited (under OPENCODE).
- Commit hash and title, or "no commit (changes pending)".
- Reminder line about `salt-call`.
