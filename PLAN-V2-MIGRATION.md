# PLAN — OpenCode V2 config migration

Status: core migration done this session (converted + verified where verification tooling exists).
Kept separate from `PLAN.md` (the session-economics plan), which is a distinct, still-unfinished
track with its own pending checklist and spend-authorization history.

## Why

The installed runtime is OpenCode 2.0.32 (confirmed in `PLAN.md`'s V2 migration-verification
section). `plugins/` was already ported to the V2 plugin API. The rest of the config —
`opencode.json`, agent/command frontmatter — was still written in V1 syntax. V1 syntax is
documented as remaining supported, but two concrete problems turned up on inspection, not just
style drift:

1. **A real correctness regression.** Agent-frontmatter `tools: {write: false, edit: false}` has no
   V2 equivalent — the native `Config.AgentEncoded` schema (confirmed via
   `https://opencode.ai/config.json`) has no `tools` property, and the migration guide's frontmatter
   auto-translation list covers only `prompt`/`disable`/`permission`/`model+variant`, not `tools`.
   Three read-only-intended subagents (`explore`, `verify`, `session-scan`) were silently running
   without their write/edit deny enforced.
2. **An inert-but-harmless gap.** Agent `temperature`/`top_p` currently do nothing on V2: the
   session runner accepts but does not yet send `request.body` settings to the model (V2 agents
   docs, explicit callout). Confirmed as an open upstream defect, not a documented roadmap item:
   `anomalyco/opencode#25755` and `#5037`. No config change fixes this; noted for awareness only.

Source anchors used: `https://opencode.ai/v2/docs/migrate-v1`, `/v2/docs/agents`,
`/v2/docs/commands`, `/v2/docs/permissions`, `/docs/permissions` (V1, to confirm precedence
semantics), and the published schema at `https://opencode.ai/config.json`.

## Completed this session

- [x] `command/q.md` → `commands/qu.md` (unrelated rename requested first; folded into the same pass).
- [x] `subtask: false` → `subagent: false` in `commands/plan-shard.md`, `commands/roadmap-construct.md`,
  `commands/plan-run.md`. Pure rename; `subtask` is a deprecated alias with identical behavior.
- [x] `disable: true` → `disabled: true` for the `plan` agent in `opencode.json`.
- [x] Fixed the `tools:` regression: `agents/explore.md`, `agents/verify.md`, `agents/session-scan.md`
  now use `permissions: [{action: edit, resource: "*", effect: deny}]`. The V2 action table confirms
  `edit` covers edit/write/patch together, matching the original intent of the two-key `tools` map.
- [x] Converted `opencode.json`'s global `permission`/`agent` blocks to native `permissions`/`agents`.
  Confirmed via the V1 permissions doc that V1 already uses last-matching-rule-wins semantics within
  each per-action map — same mechanism as V2 — so this was a structural flatten
  (`action: {resource: effect}` → ordered `{action, resource, effect}` list), not a precedence
  rewrite. Action renames applied: `bash`→`shell`, `task`→`subagent`, `edit`+`write` merged into
  `edit` (the two V1 maps were identical, so the merge is lossless). Verified by parsing the
  resulting JSONC (49 top-level rules) and spot-checking the architect/build agent overrides.
- [x] Converted `agents/committer.md` and `agents/git-editor.md` frontmatter the same way (intra-action
  order preserved exactly; parsed with `js-yaml` to confirm 34 and 40 rules respectively).
- [x] Renamed `agent/` → `agents/`, `command/` → `commands/` (the current V2-preferred discovery
  paths; legacy singular dirs remain discovered indefinitely, so this was optional but requested).
  Updated the live cross-references: `AGENTS-HINTS.md` (2 spots), `commands/commit.md` (1 spot),
  `PLAN.md` (the session-economics plan; 3 spots, since it's still active). Deliberately did **not**
  touch path references inside `AGENTS-LOG.md` — it's a historical log of past states, and rewriting
  old entries to current paths would falsify the record of what was true when each entry was written.

## Explicitly deferred / not done

- **Agent `temperature`/`top_p` fields** (≈10 files: `committer`, `git-editor`, `dialectic`,
  `plan-admin`, `general`, `verify`, `plan-juncture`, `explore`, `session-scan`, `architect`) are
  left as-is. They're inert on V2 today (see "Why" above) but harmless, and there's no working
  replacement to migrate to yet. Re-review if/when the upstream `request.body` wiring ships.
- **`lsp`, `list`, `todoread`, `todowrite` permission actions** carried over literally into the new
  `permissions` array. The V2 permissions doc explicitly states `lsp` and `doom_loop` are "not
  current V2 Core permission actions"; `list`/`todoread`/`todowrite` validity wasn't confirmed
  either way. All four were already `"allow"` (permissive, non-restrictive) before, so whether they
  resolve to a real check or are silently inert, there is no behavioral difference from the prior
  config. Not worth resolving further unless OpenCode starts warning about them at load time.
- **A pre-existing stale cross-reference**, unrelated to this migration: `AGENTS-HINTS.md` pointed at
  `command/run-plan.md`, which doesn't exist (the actual file is `plan-run.md`). Fixed the directory
  prefix (`command/` → `commands/`) to match the rename but left the `run-plan` vs. `plan-run`
  naming drift alone — that's a separate, pre-existing documentation bug, not a V2 migration item.

## Verification performed

- `opencode.json`: stripped comments/trailing commas and parsed with `node -e "...JSON.parse..."` —
  valid, 49 top-level permission rules, `agents` keys `[architect, plan, build]`.
- `agents/committer.md`, `agents/git-editor.md`, `agents/explore.md`, `agents/verify.md`,
  `agents/session-scan.md`: frontmatter extracted and parsed with `js-yaml` — all valid, rule counts
  match the source files' rule counts exactly.
- `git status`/`git diff --stat` confirm every rename was tracked as a move (not delete+add), so
  history is preserved.
- **Not yet done**: no running OpenCode instance was restarted against this config in this session.
  The schema/doc-level verification above is strong but is not the same as confirming the service
  actually loads this file and resolves a representative sample of rules (e.g., a `git push` attempt
  from `@git-editor` still denies, `@explore` still can't write) the way it did before. Recommend an
  `opencode service restart` plus one smoke check per agent file touched (`@committer`,
  `@git-editor`, `@explore`, `@verify`, `@session-scan`) before treating this as fully closed.

## Progress

- [x] Mechanical renames and deprecated-field renames.
- [x] `tools:` regression fixed on the three affected subagents.
- [x] Global and per-agent permission blocks converted to native V2 arrays.
- [x] Directory layout renamed and live cross-references updated.
- [ ] Live verification after a service restart (see "Verification performed" above).
- [ ] Retire this file once live verification passes and the diff has been reviewed/committed.
