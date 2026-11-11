# Agent hints

Advisory reference, not rules in force: `AGENTS.md` and `AGENTS-REASONING.md` stay authoritative,
and an entry here imposes no obligation unless a rule elsewhere says so. Loaded by the section
heading that matches the work (`AGENTS.md`, loading rules); not read front to back.

## Shell permission rules are tripwires, not containment

OpenCode (V2, measured on 2.2.5) checks each subcommand of a compound line (`&&`, `;`, pipes)
against the rules; one `deny` denies the line, otherwise one `ask` asks. Redirect targets and flags
stay part of the matched text. Syntax the scanner cannot analyze is rejected before any rule runs.

1. **A rule sees command text, not effects.** `git push *` does not match `git -C d push`,
   `env VAR=1 git push`, or a push inside a script; an allow for `git diff *` also matches
   `git diff > f`. Rules are consent gates for recognizable forms; isolation belongs in a sandbox,
   credentials, and network policy.
2. **A restrictive allowlist makes every unlisted part a deny or ask**, breaking ordinary pipelines,
   `2>&1`, and `cd dir && cmd`. The config therefore allows shell by default with a few gates (push,
   commit, destructive git) and states role limits such as "read-only" in the agent's prompt.
3. **Scanner errors are a separate class** from configured denials; widening rules does not fix
   them. Report the failing expression rather than rephrasing it.

## Commands cannot scope permissions; agents can

Slash commands are prompt templates (`template`, `description`, `agent`, `subtask`, `model`) with no
`permission:` key; they run under the active agent's permissions. Workflow-specific elevated
authority therefore means an agent with a scoped `permissions:` block plus a command whose `agent:`
routes into it. A momentary one-shot elevation needs no agent: global `ask` plus per-invocation
approval.

A command's `agent:` means "run AS". If OpenCode treats that agent as `mode: subagent`, it appends
an auto-dispatch directive ("call the task tool with subagent: <X>") to the rendered prompt; name a
primary agent such as `architect` in the frontmatter to preempt it.

## Structural fixes beat prompt reminders for high-cost failures

`AGENTS.md` rules fire reliably for an agent with an explicit prompt body and unreliably for one
without (a bare permission override). So: if an antipattern recurs despite being in `AGENTS.md`,
first check whether the agent has a prompt body that restates it (`agents/build.md` does for `workdir` and
the native file tools). For failures that are costly (kill the session, dirty the tree, lose
context) and need the model to remember at every call site, use a structural layer instead: a plugin
hook (`plugins/no-interactive-editor.js` for editor hangs), a denylist, or a permission rule.

## Nested subagent dispatches can hang on permission prompts

A permission prompt raised by a nested subagent for a tool outside its allowlist may not route back
to the user: the inner agent waits for approval, the outer waits for the inner. Root cause is
unconfirmed. In the inner prompt, include: *"IMPORTANT: if you encounter ANY permission prompt that
would block execution, stop immediately and return what you have so far with a clear note describing
the blocked tool call."* To verify an agent's behaviour, prefer a direct fork from a clean primary
session over nested forking; if nesting is needed, make the allowlist cover every call and keep the
clause.

## Autosquash conflicts resolved wholesale cross-contaminate commits

Resolving `git rebase --autosquash` conflicts with `--ours`/`--theirs` wholesale pulls content from
the wrong side into the base commit: content disappears from one commit and duplicates in later
ones. Never do this; inspect each conflict file by file and ask when the resolution is not obvious.
Once contamination starts, abandon the autosquash, reset to the pre-rebase tip, and rebuild the base
commits by staging correct content in logical groups. Include this constraint in any `@build` prompt
for fixup-heavy work.

## Auditing prior sessions: the file storage tree is lossy

`~/.local/share/opencode/storage/` ages out, prunes on upgrades, and omits some tool-call shapes
(a hung, killed command may not match a `"command":"<pattern>"` grep); project-scoped dirs omit
sessions started elsewhere. It can confirm a pattern's **presence**, never its **absence**: if the
user reports a behaviour and the grep finds nothing, believe the user. The SQLite store
(`~/.local/share/opencode/opencode.db`) retains every session; `commands/config-retrospective.md`
holds the access recipe.

## Refactor ordering: docs, code, tests

In a cleanup that covers both docs and code structure, do the doc pass first, application code next,
and test code last. Refactoring first means rewriting docstrings twice; tests are downstream of both
and are restructured once at the end.
