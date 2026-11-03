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

### Live verification after service restart — FOUND A REGRESSION (not in our config; in the engine)

Ran smoke tests against a restarted OpenCode 2.0.32 instance: direct self-test of the
`~/.config/opencode/**` edit-deny (global rule, primary session), plus forked-subagent probes on
`@general`, `@explore`, `@verify`, `@session-scan`, `@committer` that actually executed tool calls
(shell commands, Write, webfetch, question) rather than reasoning about them.

Results:

| Layer | Context | Result |
|---|---|---|
| Global top-level deny (`shell: grep *`) | forked subagent (`@general`) | enforced correctly |
| Global top-level allow (`question: *`) | forked subagent (`@general`) | enforced correctly |
| Agent-level override, `opencode.json` `agents.build` | primary session (self-test) | enforced correctly |
| Agent-level override, markdown frontmatter `permissions:` | forked subagent (`@session-scan`, `@committer`) | **NOT enforced** — Write/git push/webfetch all succeeded despite explicit `deny` rules |
| Agent-level override, moved the same rule into `opencode.json` `agents.committer.permissions` | forked subagent (`@committer`) | **NOT enforced** — rules out frontmatter YAML parsing as the cause |

**What is established**: the forked `committer` and `session-scan` subagents performed operations
their own `deny` rules forbid. That is solid, because the files they wrote existed on disk
afterwards. So their deny rules were not enforced in those runs.

**What is NOT established** (corrected after review): *why*. The earlier reading — "subagents use
global rules only" — has confounds. The subagent cannot see approval prompts, so "no prompt" is
uninformative. A configured deny and a user Reject both return `permission.rejected`. And
"global only" and "inherits the parent session's agent rules" predict identical outcomes for every
probe run (the parent session allows edits). Full analysis and the discriminating test design:
`PLAN-V2-PERMISSIONS.md`.

**Practical impact — treat these subagents' deny rules as unenforced until measured**:

- `@committer`: all three of its explicit denies (`git push`, `webfetch`, `edit`) were bypassed in
  the live test. It currently has no engine-enforced restriction when forked.
- `@session-scan`: its `edit *: deny` was bypassed (Write succeeded).
- `@verify`: not directly confirmed — it refused the probe on its own judgment (correctly treating
  the test framing as a possible prompt-injection attempt) before any tool call was attempted, so
  no tool-level result was observed. Given it shares the identical shape (non-built-in ID, `mode:
  subagent`, frontmatter-only `permissions:`) with the two confirmed-broken agents, assume it has
  the same gap until proven otherwise.
- `@explore` is incidentally fine: it overrides the *built-in* `explore` agent ID, which carries a
  separate hardcoded restrictive default policy (per the V2 permissions doc's "Defaults" table)
  that doesn't depend on our config merging correctly. This is a coincidence of naming, not a
  property of our fix.
- `@git-editor` is `mode: primary`, so based on the one confirmed-working primary-agent-override
  test (`build`'s `~/.config/opencode/**` deny), its own frontmatter denies (git push, webfetch)
  are expected to still work. Not directly tested (primary-mode agents can't be forked from this
  session to probe) — recommend a direct manual check by switching to `@git-editor` and attempting
  `git push`.

No test artifacts were left behind: the temporary `opencode.json` control override was reverted,
and all `/tmp/opencode/*-permission-test.txt` scratch files were removed. `git status` is clean.

## Progress

- [x] Mechanical renames and deprecated-field renames.
- [x] `tools:` regression fixed on the three affected subagents *in config*.
- [x] Global and per-agent permission blocks converted to native V2 arrays.
- [x] Directory layout renamed and live cross-references updated.
- [x] Live verification after a service restart: forked subagents' own deny rules were not
  enforced (see above); the cause is unresolved.
- [ ] Run the permission test harness in `PLAN-V2-PERMISSIONS.md`: S0 bootstrap by hand (it
  creates `~/Source/opencode-permtest`), then `/plan-run docs/PLAN.md halt-at-boundaries` from
  `@plan-admin` there. It also covers the `@git-editor` primary check (via `opencode run --agent`),
  `@verify` (with a neutral-prompt override, so a refusal can't mask the result), and whether the
  `~/.config/opencode/**` edit deny matches through the symlink at all.
- [x] Harness S0–S5 done (2026-10-31). Confirmed: a `temperature:` field in agent frontmatter
  disables that agent's `permissions` list (primary agent, 4/4 conditions), which is the leading
  explanation for the unenforced `committer`/`session-scan` denies. The chain was re-scoped to
  configuration verification: S6 (subagent resolution), S10 (patched-copy verification of the real
  agents), S11 (findings + final patch). Decided patch content: delete `temperature` from every
  agent; remove the `~/.config/opencode/**` edit deny and its stale workstation-salt comments.
- [ ] Delete the staging copy `PLAN-V2-PERMISSIONS.md` (superseded by
  `~/Source/opencode-permtest/docs/PLAN.md` since S0).
- [ ] Apply the harness's proposed `opencode-config` patch (separate, reviewed session). Until
  then, treat `@committer`/`@verify`/`@session-scan` as **not sandboxed**: their restrictions rest
  on the model's own judgment, not on the engine.
- [ ] Retire this file once the patch is applied and the diff has been reviewed/committed.
