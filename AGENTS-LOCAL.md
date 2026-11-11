# opencode-config local rules

Rules for editing this repository's instruction surfaces (`AGENTS*.md`, `skills/`, `plugins/`,
`commands/`, `agents/`, `opencode.json`, `IDEAS.md`). Loaded when working in `opencode-config`
(`AGENTS.md`, loading rules).

## Minimalism

Every instruction surface is relentlessly minimal:

- **State each rule once**, in its authoritative file; elsewhere give a succinct reference, not a
  restatement. The one exception is text a dispatched worker must carry because it loads nothing
  else.
- **Current state only**, plus what that state definitely needs. Decisions, change rationale,
  history, dates, measurements, and superseded alternatives belong in the git log
  (`git show <commit>:<path>` recovers them), never in the tree.
- **A file earns its place** by carrying what the reader cannot cheaply re-derive.
- **Prune on contact.** When editing a file, remove the duplication and history found in it.
- **Tier notation.** Outside the `model:` fields and `opencode.json`, refer to models by tier
  (`AGENTS.md`, model tiers), never by name or version.

## Config files

The authoritative source is the `opencode-config/` git repo. `~/.config/opencode/` is a
**symlink** to that repo, so an edit lands in the live files with no apply step. The running service
does not reliably watch the symlinked directory, so confirm a change took effect (or reload) before
relying on it. Edit files directly in the `opencode-config/` repo; commit per the `AGENTS.md` git
conventions. Runtime artifacts (`bun.lock`, `package.json`, `node_modules/`, etc.) are managed by
OpenCode itself and must NOT be committed; `.gitignore` covers them.
