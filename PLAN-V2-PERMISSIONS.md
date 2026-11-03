# PLAN — OpenCode V2 permission-resolution test harness

Staged in `opencode-config` because the target repo does not exist yet. Section **S0 — Bootstrap**
creates `~/Source/opencode-permtest`, copies this file to `docs/PLAN.md` there, and makes the first
commit. From then on the copy in the permtest repo is authoritative; this staging copy should be
deleted once S0 lands (see `PLAN-V2-MIGRATION.md` progress list).

Execute after S0 with, from `@plan-admin` in `~/Source/opencode-permtest`:

```
/plan-run docs/PLAN.md halt-at-boundaries
```

## Purpose (design intent)

Determine — by side-effect evidence, never by model self-report — how OpenCode 2.0.32 resolves
permission rules across its layers (built-in defaults, global config, project config, the running
agent's own rules, and the parent session's agent) for **primary agents** and for **forked
subagents**; then verify the real `opencode-config` agents against that model; then produce a
mitigation proposal for `opencode-config` and, if the engine contradicts its documentation, a
minimal upstream reproduction.

The question that started this: in the V2 migration's live check, two custom subagents
(`committer`, `session-scan`) performed writes, a `git push`, and a webfetch their own `deny` rules
forbid. That observation is real (the written files existed on disk), but the conclusion drawn
from it — "subagents run with global rules only" — is **not** established, because of the
confounds listed under *Prior evidence*. This harness exists to replace that conclusion with a
discriminating measurement.

Out of scope: changing `opencode-config` from inside the chain. The chain produces a proposed patch
and findings; applying them is a separate, human-gated step in `opencode-config`.

## Prior evidence and why it is not conclusive

Observed in the migration session (parent session = the default implementation agent, which allows
edits; real global config loaded):

| Probe | Agent (forked) | Observed |
|---|---|---|
| Write `/tmp/opencode/…` | `session-scan` (own rule `edit *: deny`) | file created |
| Write, `git push`, webfetch | `committer` (own rules deny all three) | all executed |
| `git push` with deny duplicated into `opencode.json` `agents.committer` | `committer` | executed |
| `grep …` (global `shell grep *: deny`) | `general` | `permission.rejected` |
| question (global `question: allow`) | `general` | answered |
| Write | `explore`, `verify` | model refused; no tool call made |

Confounds:

1. **Prompts are invisible to the child.** An `ask` is shown in the user's client, not in the
   subagent's context. Global `shell *` is `ask`, so if `committer` merely fell back to global
   rules, its `git push` should have prompted the user. The subagent's "no prompt" report carries
   no information.
2. **`deny` and user-rejection look identical.** Both return `permission.rejected`. Every "denied"
   observation is ambiguous between a configured deny and a human clicking Reject.
3. **Hypotheses not separated.** "Child uses global rules only" and "child inherits the parent
   agent's rules" predict the same outcome for every probe above.
4. **Model compliance mistaken for policy.** `explore`/`verify` refusing is prompt behavior, not
   engine behavior; and a refusal looks like a deny if only the side effect is checked.
5. **Symlinked config path.** `~/.config/opencode` is a symlink to `opencode-config`. The global
   `edit ~/.config/opencode/**: deny` may match only the symlink spelling, not the canonical path
   tools resolve to. Its comment (runtime mirror populated by salt) is also stale.

## Hypotheses under test (subagent resolution)

Rules resolve by last match. Each hypothesis is the ordered rule list a child session evaluates:

| Hypothesis | Child's effective order |
|---|---|
| H-doc (documented) | defaults, global, project, **child** |
| H-global | defaults, global, project |
| H-parent | defaults, global, project, **parent** |
| H-own-then-parent | defaults, global, project, child, parent |
| H-parent-then-own | defaults, global, project, parent, child |

Four probe resources, each with a different layer assignment (A = allow, K = ask, D = deny,
— = no rule):

| Probe | Baseline (global/project) | Parent agent | Child agent |
|---|---|---|---|
| X | A | K | D |
| Y | K | D | A |
| Z | A | — | D |
| W | A | D | — |

Predicted outcome signatures (X, Y, Z, W):

| Hypothesis | X | Y | Z | W |
|---|---|---|---|---|
| H-doc | D | A | D | A |
| H-global | A | K | A | A |
| H-parent | K | D | A | D |
| H-own-then-parent | K | D | D | D |
| H-parent-then-own | D | A | D | D |

All five signatures differ, so one run of the four probes identifies the surviving hypothesis (or
shows that none fits, which is itself a finding).

## Measurement method

- **Three-way effect from two runs.** Each probe scenario runs twice: plain `opencode run` and
  `opencode run --auto` (auto-approves anything not explicitly denied). Side effect in the plain
  run → ALLOW. Side effect only under `--auto` → ASK. No side effect in either, with the tool call
  attempted in both → DENY. Tool call not attempted → INVALID (retry; never counted as DENY).
- **Oracles are side effects:** a file exists under the scenario sandbox; a ref exists in the
  local bare remote; a tag exists; a request line appears in the local HTTP sink's log. The event
  stream (`--format json`) is used only to prove the tool call was *attempted*.
- **Isolation.** Engine-semantics scenarios run with `XDG_CONFIG_HOME=<repo>/.xdg` and
  `--standalone`, so the private server loads only the harness's minimal global config — no real
  rules, no real plugins. A canary proves it before any result counts.
- **Layering by directory.** Project-layer config lives in `scenarios/<name>/.opencode/`, and each
  probe runs with the scenario directory as its working directory. The repo root and its ancestors
  must carry no `opencode.json` or `.opencode/`, so project rules come only from the scenario.
- **Neutral probe agents.** Test agents get a short system prompt: execute exactly the requested
  tool call, once, then report the raw result. Model: `anthropic/claude-haiku-4-5`.
- **Nonces.** Every run uses a fresh nonce in every resource name (`sandbox/X-<nonce>.txt`,
  `refs/heads/probe-<nonce>`), and the sandbox is reset first, so leftovers cannot pass as results.

## Verify gate

Bind **both** VERIFY_TEST and VERIFY_TYPES to the single combined gate:

```
make check  →  python3 -m unittest discover -s tests -t .
               mypy --strict permtest tests
               shellcheck over every tracked-or-untracked *.sh
```

Do **not** bind `make test` and `make typecheck` separately. `/plan-run`'s preflight rule 1 matches
on `test`/`typecheck` targets and would never bind `lint`, silently dropping shellcheck from the
gate for the entire chain — and the only two shell scripts in this plan (`scripts/env.sh`,
`repro/minimal.sh`) are created by rows that would then never lint them. One green `make check`
satisfies verify steps 4a and 4b together, per `/plan-run`'s combined-gate affordance.

Live probes are **not** part of the gate: they cost tokens and are not deterministic. They run
through a generic `make probe-<scenario>` target, and their generated reports under `results/` are
committed as deliverables. The gate covers the harness: classification logic, oracles, spec
parsing, and safety guards, tested against recorded event-stream fixtures.

## S0 — Bootstrap (manual, before `/plan-run`)

Run by hand or from `@build`. It is not a `/plan-run` row, because `/plan-run` needs the repo,
the gate, and a clean committed tree before it can start.

```bash
set -euo pipefail
REPO="$HOME/Source/opencode-permtest"
REMOTE="$HOME/Source/opencode-permtest-remote.git"
STAGED="$HOME/Source/opencode-config/PLAN-V2-PERMISSIONS.md"

# Guards use explicit exits: set -e does not fire on a failing non-final command of an && list.
# Refuse to clobber anything.
for p in "$REPO" "$REMOTE"; do
  if [ -e "$p" ]; then echo "refusing: $p already exists" >&2; exit 1; fi
done
# No ancestor may carry project config (it would leak into every scenario).
for d in "$HOME/Source" "$HOME"; do
  for f in opencode.json opencode.jsonc .opencode; do
    if [ -e "$d/$f" ]; then echo "refusing: ancestor project config $d/$f" >&2; exit 1; fi
  done
done

git init --bare -b main "$REMOTE"
git init -b main "$REPO"
git -C "$REPO" remote add permtest "$REMOTE"

mkdir -p "$REPO"/{docs,permtest,scripts,tests/fixtures/events,scenarios,results,.xdg/opencode/agents}
cp "$STAGED" "$REPO/docs/PLAN.md"

cat > "$REPO/.gitignore" <<'EOF'
__pycache__/
.mypy_cache/
artifacts/
scenarios/*/sandbox/
EOF

cat > "$REPO/Makefile" <<'EOF'
PY ?= python3
.PHONY: test typecheck lint check
test:
	$(PY) -m unittest discover -s tests -t .
typecheck:
	mypy --strict permtest tests
# Tracked AND untracked-not-ignored scripts: the verify gate runs against a dirty, unstaged tree,
# so a --cached-only listing would skip the very script the current session just created.
# -r keeps the target green before any script exists.
lint:
	git ls-files -z --cached --others --exclude-standard '*.sh' | xargs -0 -r shellcheck
check: test typecheck lint
EOF

cat > "$REPO/permtest/__init__.py" <<'EOF'
"""Side-effect-oracle harness for OpenCode permission resolution."""
EOF

cat > "$REPO/tests/__init__.py" <<'EOF'
EOF

cat > "$REPO/tests/test_safety.py" <<'EOF'
"""Safety invariants that must hold before any probe may push or write."""

import pathlib
import subprocess
import unittest

REPO = pathlib.Path(__file__).resolve().parent.parent
REMOTE = REPO.parent / "opencode-permtest-remote.git"


class TestSafety(unittest.TestCase):
    """Guard the repository's push target and config isolation."""

    def test_only_remote_is_local_bare_repo(self) -> None:
        """The sole remote must be the local bare repo, so push probes cannot leave the machine."""
        out = subprocess.run(
            ["git", "-C", str(REPO), "remote", "-v"], capture_output=True, text=True, check=True
        ).stdout.split()
        urls = {pathlib.Path(u).resolve() for u in out[1::3]}
        self.assertEqual(set(out[0::3]), {"permtest"})
        self.assertEqual(urls, {REMOTE.resolve()})

    def test_repo_root_has_no_project_config(self) -> None:
        """Project config must come only from scenario directories."""
        for name in ("opencode.json", "opencode.jsonc", ".opencode"):
            self.assertFalse((REPO / name).exists(), name)
EOF

cat > "$REPO/AGENTS.md" <<'EOF'
# opencode-permtest

Harness that measures OpenCode permission resolution using side-effect oracles.

## Register rule

State the property, reason, or invariant directly. Never cite plan coordinates (session ids,
sub-track names, boundary markers, PLAN/ROADMAP references) in code, tests, or durable docs. Plan
vocabulary lives only in docs/PLAN.md, the ledger, and commit messages. The anneal denylist is in
docs/PLAN.md under "Notes for executors".

## Safety invariants

- The only git remote is the local bare repo `permtest`; never add another.
- Probe side effects land only in `scenarios/*/sandbox/`, the local bare remote, or the local HTTP
  sink on 127.0.0.1. Never point a probe at ~/.config/opencode or any real repository.
- A probe outcome is classified from side effects plus proof that the tool call was attempted,
  never from the model's description of what happened.
EOF

make -C "$REPO" check
git -C "$REPO" add -A
git -C "$REPO" commit -m "Bootstrap OpenCode permission test harness" \
  -m "Creates the repo skeleton, the local bare remote, the verify gate, and the safety tests that every later probe relies on."
```

After S0: delete the staging copy from `opencode-config` (it is superseded by `docs/PLAN.md`), and
mark S0 `done` in the permtest ledger with the bootstrap commit hash.

## Session list

| # | Session | Cat | Tier | Consumes | Expected files |
|---|---|---|---|---|---|
| S0 | Bootstrap OpenCode permission test harness | A | manual | — | Makefile, AGENTS.md, .gitignore, docs/PLAN.md, permtest/\_\_init\_\_.py, tests/\_\_init\_\_.py, tests/test_safety.py |
| S1 | Establish isolated config and prove the isolation canary | A | Sonnet | INV-safety | .xdg/opencode/opencode.json, .xdg/opencode/agents/pt-calib.md, scripts/env.sh, tests/test_isolation.py, tests/fixtures/canary/\*, docs/CALIBRATION.md |
| S2 | Record run event-stream fixtures and freeze the event contract `@architect` | A | Sonnet | C-env, INV-safety | tests/fixtures/events/\*.jsonl, tests/test_events.py, docs/CALIBRATION.md |
| S3 | Add probe spec types and plain/auto effect classifier | A | Sonnet | C-events | permtest/spec.py, permtest/classify.py, tests/test_classify.py |
| S4 | Add probe runner and side-effect oracles ◆ | A | Sonnet | C-probe, C-events, INV-safety | permtest/runner.py, permtest/oracle.py, tests/test_oracle.py |
| S5 | Measure layer precedence for primary agents | B | Sonnet | C-probe, C-runner | scenarios/primary/\*\*, .xdg/opencode/agents/pt-primary.md, permtest/scenarios.py, results/primary.md, Makefile |
| S6 | Discriminate subagent resolution hypotheses | B | Sonnet | C-probe, C-runner | scenarios/subagent/\*\*, .xdg/opencode/agents/pt-parent.md, .xdg/opencode/agents/pt-child.md, permtest/scenarios.py, tests/test_hypotheses.py, results/subagent.md |
| S7 | Measure edit-rule matching across symlinked and home-relative paths | B | Sonnet | C-probe, C-runner | scenarios/paths/\*\*, permtest/scenarios.py, results/paths.md |
| S8 | Write engine-semantics findings | I | Sonnet | C-hypotheses, all measured results | docs/FINDINGS-ENGINE.md |
| S9 | Draft upstream reproduction for the engine permission defect ◆ | I | Sonnet | engine findings | docs/UPSTREAM-ISSUE.md, repro/minimal.sh |
| S10 | Verify real opencode-config agents under the real config | B | Sonnet | C-probe, C-runner, engine findings | scenarios/real/\*\*, permtest/scenarios.py, results/real.md |
| S11 | Propose config mitigation ◆ | I | Sonnet | engine + real findings | docs/FINDINGS-REAL.md, patches/opencode-config.diff |

Sub-tracks: **harness** (S0–S4 ◆), **engine semantics** (S5–S9 ◆), **real config** (S10–S11 ◆).
S5, S6, and S7 are mutually orthogonal once S4 lands; S6 is the critical measurement.

### Commit-size tuning

Ambient codebase complexity is low (new repo) and pushes *larger*; the inner loop is strong (fast
deterministic unit tests over recorded fixtures) and pushes *smaller*; cost of a design error
(input 3) and correctness-criticality (input 4) are concentrated in S1–S4 and push hard toward
smaller. The resolution: the four harness rows are kept small and dense, and the measurement rows
are left large.

Three rows were split out of an earlier nine-row shard:

- **S1/S2** were one calibration row. Six independent empirical questions in one row is an
  execution-footprint outlier, and the split is contract-sharp: S1 freezes the *environment*
  (C-env) that S2 consumes. The payoff is that R1 — the only risk that changes the plan's shape —
  gets a cheap gate before any fixture-capture budget is spent, and the inflection fork gets one
  focused question instead of six entangled ones.
- **S3/S4** were one row of six files and an estimated 700–900 LOC, two to three times the band
  ceiling. Split at the type boundary: S3 is pure logic with a sub-second fixture-driven inner loop
  and carries the correctness-criticality; S4 is the subprocess/IO layer carrying the push-safety
  guard. S3 freezes the type surface (C-probe) that S4 consumes.
- **S9/S11** were one closing row bundling three deliverables across two audiences. The upstream
  reproduction consumes only the engine findings, never the real-config results, so bundling it
  with the mitigation patch carried a false dependency. Separating them also keeps local
  configuration results out of an upstream bug report structurally rather than by editorial
  discipline.

The measurement rows (S5, S6, S7, S10) are each one experiment — one scenario family, one generated
report — and are *not* split despite their size. The floor is raised by a constraint specific to
measurement work: results from different engine versions are not comparable (see R7), so any set of
observations that must be compared to one another has to be produced in a single session.
Splitting S6's four variants across sessions would admit exactly the version skew the risk register
already names as a halt condition.

## Session detail

### S1 — Establish isolated config and prove the isolation canary

Build the isolated environment and prove it is actually isolated, before spending anything on
event capture.

- `.xdg/opencode/opencode.json`: minimal global config. Permissive baseline plus one **canary
  rule** chosen so the isolated and real configs disagree: isolated allows `shell: grep *`, the
  real global denies it.
- `.xdg/opencode/agents/pt-calib.md`: neutral probe agent (`anthropic/claude-haiku-4-5`) — execute
  exactly the requested tool call, once, then report the raw result.
- `scripts/env.sh`: exports `XDG_CONFIG_HOME=<repo>/.xdg`, the `timeout` wrapper, and the
  `--standalone` invocation shape. Sourced by the runner and usable by hand.

Record in `docs/CALIBRATION.md`, each with raw evidence:

1. **Isolation canary.** Run `grep` via `pt-calib` under the isolated config, redirecting output to
   a sandbox file. The oracle is the file, not the event stream — which is what makes this row
   independent of the event-shape work that follows. Run the same probe against the real config as
   the contrasting arm.
2. **Provider auth still resolves** (auth lives in the data dir, which is unchanged).
3. **No real plugins load** — check the `--print-logs` output (server logs require `--standalone`).
4. The exact invocation that achieves isolation, and `opencode --version`.

KAT: `tests/test_isolation.py` asserts the canary **discriminator** holds, against the recorded run
artifacts committed under `tests/fixtures/canary/` — the isolated arm produced the output file, the
real-config arm did not. It also asserts `scripts/env.sh` points `XDG_CONFIG_HOME` at the repo's
`.xdg` and that the isolated config carries the canary rule.

Freezes **C-env**. If isolation does not hold, that is R1 — surface it as a discovery for
adjudication rather than working around it.

### S2 — Record run event-stream fixtures and freeze the event contract (inflection)

Capture `--format json` streams as fixtures under `tests/fixtures/events/`: `allow.jsonl`,
`ask-plain.jsonl`, `ask-auto.jsonl`, `deny.jsonl`, `refuse.jsonl` (model makes no tool call), and
`subagent.jsonl`. Record in `docs/CALIBRATION.md`:

1. **Plain run on `ask`.** What `opencode run` does with no client to answer: rejects at once,
   hangs (always wrap runs in `timeout`), or exits non-zero. Record the exit code and events.
2. **`--auto` semantics.** Confirm that `ask` becomes allow and `deny` stays deny. (The CLI help
   states "Auto-approve permissions that are not explicitly denied"; this confirms it empirically.)
3. **Attempt proof.** Which fields prove a tool call was attempted, and which carry its result or
   rejection.
4. **Deny vs. rejected-ask.** Whether a configured deny is distinguishable from a rejected ask in
   the events. If it is, later rows gain a direct oracle alongside the side-effect oracle.
5. **Child visibility.** Whether the child session's tool events appear in the parent's stream. If
   they don't, find them through `opencode api` or a read-only query against a **copy** of the
   database (`sqlite3 -readonly`; never the live file). Also record whether `--auto` on the parent
   run applies to the child's asks.
6. **Webfetch to localhost.** Whether webfetch will fetch `http://127.0.0.1:<port>/`. If yes, a
   `python3 -m http.server` sink with a request log is the webfetch oracle. If no, record that and
   drop webfetch probes.

KAT: `tests/test_events.py` parses every recorded fixture and asserts the field paths the
classifier will rely on — including that `refuse.jsonl` is distinguishable from `deny.jsonl`, which
is the distinction the whole INVALID class rests on.

Freezes **C-events**. Juncture: the inflection fork reviews `docs/CALIBRATION.md` and writes the
resolved field paths into the *Cross-session contracts* subsection.

### S3 — Add probe spec types and plain/auto effect classifier

- `spec.py`: typed `ProbeSpec` (scenario dir, agent id, prompt template, resources, isolated or
  real), `RunMode` (PLAIN, AUTO), `Effect` (ALLOW, ASK, DENY, INVALID), `ProbeResult` (spec, mode,
  attempted, oracle hits, raw artifact path, engine version, free-text notes).
- `classify.py`: the plain-plus-auto truth table to an `Effect`, with INVALID whenever either run
  lacks an attempted tool call. Retries INVALID up to a fixed limit, then reports it — never
  coerces it to DENY (INV-safety).

Over-specify per substrate discipline: carry the `external_directory` and `webfetch` resource kinds
now, even though only S7 and S10 need them, and carry the `notes` field on `ProbeResult`. Adding to
this surface after four downstream rows consume it is more expensive than carrying it unused.

KAT: `tests/test_classify.py` drives every cell of the truth table from the recorded event
fixtures, including all four INVALID paths and the retry-exhaustion path.

Freezes **C-probe**.

### S4 — Add probe runner and side-effect oracles ◆

- `runner.py`: builds the `opencode run` invocation (`--standalone`, `--format json`, `--agent`,
  `timeout`, env from `scripts/env.sh`), resets the sandbox, injects the nonce, captures events to
  `artifacts/<run-id>/`, and records `opencode --version` with every result. It refuses to run a
  push probe unless the safety check passes (only remote is the local bare repo).
- `oracle.py`: file-exists, bare-remote-ref-exists, tag-exists, http-sink-hit, tool-attempted
  (from events, per C-events).

KATs: oracle tests against temp dirs, a temp bare repo, and a temp HTTP sink; plus a test that the
runner's push-safety guard refuses when a second remote is present.

Freezes **C-runner**. Sub-track boundary: anneal over `permtest/`, `tests/`, `scripts/`, and
`docs/CALIBRATION.md`, then the boundary fork asks whether this harness will actually answer the
question — the cheapest possible place to find out, before any probe-token spend.

### S5 — Measure layer precedence for primary agents

Control condition. Run probes on a primary `pt-primary` agent in the isolated config, covering:
the defaults alone; global overriding defaults; project overriding global; agent rules overriding
project; the order of two conflicting rules inside one layer; the ` *` suffix matching a bare
command; `edit` covering write, edit, and patch. Test both `edit` resources (files) and `shell`
resources (`touch sandbox/<probe>-<nonce>`) to rule out action-specific behavior.

Adds the generic `probe-%` target to the Makefile — the one place a live-probe entry point is
defined; later measurement rows reuse it rather than adding their own.

Generate `results/primary.md`: an expected-vs-observed table with run ids and version. If
primary-agent precedence does not match the docs, S6's predictions must be recomputed from the
observed model before S6 runs (discovery: additive-reshard).

### S6 — Discriminate subagent resolution hypotheses (critical measurement)

Run the X/Y/Z/W layer assignment from *Hypotheses under test*. Parent: primary `pt-parent`, told
to launch `pt-child` through the subagent tool with a fixed probe prompt. Use both `edit` and
`shell` forms of each probe. Variants:

- **Custom child ID** (`pt-child`): the main measurement.
- **Child defined in `opencode.json` `agents` instead of markdown**: rules out a
  frontmatter-loading cause.
- **Built-in ID override** (child is an `explore` override): tests whether a built-in ID's
  hard-coded defaults mask the result. Use only `shell` probes here, since built-in `explore`
  already denies edits.
- **Parent run directly** (no child) as the control.

All four variants land in this one session deliberately: their signatures are only meaningful
relative to one another, and a session boundary between them would admit the engine-version skew
R7 names as a halt condition.

`tests/test_hypotheses.py` encodes the predictions table and a matcher that maps an observed
signature to the surviving hypotheses (or none). That table is **C-hypotheses**. The report
`results/subagent.md` gives observed signatures per variant and the matched hypothesis.

### S7 — Measure edit-rule matching across symlinked and home-relative paths

Create a symlink outside the repo (under `/tmp/opencode/permtest-link-<nonce>`) that points into a
scenario sandbox. Configure `edit` rules on the symlink spelling only, then on the canonical
spelling only, and probe edits via each spelling. Also test `~/` and `$HOME/` expansion in `edit`
and `external_directory` resources. Purpose: decide whether `opencode-config`'s
`edit ~/.config/opencode/**: deny` protects anything, given that the path is a symlink to a
project the agent can reach canonically. Report: `results/paths.md`.

### S8 — Write engine-semantics findings

`docs/FINDINGS-ENGINE.md`: the resolution model the evidence supports, for primary agents and
subagents, with each claim linked to the result rows that support it. State plainly where the
engine contradicts the V2 permissions/agents docs. This row is scoped to engine semantics under
isolated config only — nothing about the author's real configuration belongs here.

### S9 — Draft upstream reproduction for the engine permission defect ◆

`repro/minimal.sh`: self-contained — creates a temp XDG config dir, one parent agent, one child
agent, one probe, and prints observed versus documented behavior. It must run on a machine with no
checkout of this harness and no permtest repo, and it must be shellcheck-clean (the gate now
actually enforces this on untracked scripts).

`docs/UPSTREAM-ISSUE.md`: the observed versus documented behavior, the version, and the repro
invocation. Filing goes through the `report` skill, done by the human. The chain never files.

This row is the falsification test for the preceding one: a resolution model that cannot be
reproduced in a standalone script is a model that is not yet understood. A failure to reproduce is
a discovery against the engine findings, not a failure of this row.

If the engine turns out to agree with its documentation, the deliverables are the same pair
recording agreement — the script becomes a conformance witness and the document records "no delta,
here is the evidence." Given that the migration session already observed subagent denies being
bypassed, this is the unlikely branch.

Sub-track boundary: anneal over `permtest/`, `tests/`, `docs/` (except the plan), `results/`, and
`repro/`; then the boundary fork re-reads design intent against the engine findings and decides
whether S10's design still holds given the observed model.

### S10 — Verify real opencode-config agents under the real config

Non-isolated runs: real `XDG_CONFIG_HOME`, real global config and plugins, scenario directory
`scenarios/real/`. For each subagent under test (`committer`, `verify`, `session-scan`,
`explore`), the scenario's `.opencode/agents/<id>.md` overrides **only** the system prompt (neutral
probe prompt) and sets `mode: all`, leaving the real permission rules to merge in from the global
definition.

- **Merge sentinel first.** Run each override as a *primary* agent and probe a rule unique to that
  agent where the agent and global effects differ. For `committer`: `git tag probe-<nonce>` (agent
  deny, global ask). Only if the sentinel shows the real rules survived the override does the
  subagent probe count. If the override replaces instead of merging, copy the real rules verbatim
  into the override and note the fidelity loss (risk R4).
- Subagent probes, forked from a neutral `pt-parent`: `committer` push to the bare remote (oracle:
  ref exists), edit, webfetch (if the event calibration allows); `verify`/`session-scan` edit.
- Primary probes via `--agent`: `git-editor` `git push` (agent deny, global ask), `git rebase -i`
  allow-path sanity; `build` edit under the `~/.config/opencode` spelling of a **scratch** file
  path inside the symlink setup from the path-matching measurement, never a real config file.
- Load check: scan the server log for config warnings about the carried-over actions `lsp`,
  `list`, `todoread`, `todowrite`.

Report: `results/real.md`, one row per real rule probed, expected vs observed.

### S11 — Propose config mitigation ◆

- `docs/FINDINGS-REAL.md`: which real-agent guarantees hold and which do not, in plain terms.
- `patches/opencode-config.diff`: proposed changes against `opencode-config`. Candidates, kept only
  where the evidence supports them: top-level `policies` hard-denies for operations no agent should
  ever do (e.g. `tool.use` `shell:git push *`), which apply regardless of agent resolution; fix or
  remove the `~/.config/opencode/**` edit deny and its stale comment; drop actions the engine does
  not recognize; record in `PLAN-V2-MIGRATION.md` which subagent restrictions are real.

The chain never applies the patch. Final sub-track boundary: anneal, then the boundary fork.

## Cross-session contracts

### INV-safety (prose-enforced; partly test-enforced by `tests/test_safety.py`)

Defined in: S0. Consumed by: every row. The only remote is the local bare repo; probe side effects
stay in the scenario sandboxes, the bare remote, or the 127.0.0.1 HTTP sink; classification never
uses model prose; INVALID is never coerced to DENY; isolated-mode results count only after the
isolation canary passes in the same harness version.

### C-env (test-enforced)

Defined in: S1. Consumed by: S2 onward. *To be frozen at S1*: the exact invocation that achieves
config isolation (`XDG_CONFIG_HOME` + `--standalone` + env from `scripts/env.sh`), the canary rule
and its file oracle, and the evidence that no real plugins load and provider auth still resolves.
A measurement produced without this invocation is not an isolated measurement.

### C-events (test-enforced)

Defined in: S2. Consumed by: S3 onward. *To be frozen at S2* by the inflection juncture: the
`--format json` fields proving a tool call was attempted, its result or rejection, how a child
session's events are located, whether a configured deny is distinguishable from a rejected ask, and
plain-run behavior on `ask`.

### C-probe (compiler-enforced via mypy --strict, plus tests)

Defined in: S3. Consumed by: S4–S7, S10. *To be frozen at S3*: `ProbeSpec`, `RunMode`, `Effect`,
`ProbeResult`, and the plain/auto classification semantics including the INVALID rule.

### C-runner (compiler-enforced via mypy --strict, plus tests)

Defined in: S4. Consumed by: S5–S7, S10. *To be frozen at S4*: the runner entry point, the
`artifacts/<run-id>/` layout, the version-recording obligation, the push-safety precondition, and
the oracle signatures.

### C-hypotheses (test-enforced)

Defined in: S6. Consumed by: S8, S9, S11. The hypothesis/prediction table above, as executable
data. If S5 shows primary precedence differs from the docs, it is recomputed before S6 runs.

## Progress ledger

| # | Session | Status | Commit | Froze |
|---|---|---|---|---|
| S0 | Bootstrap OpenCode permission test harness | pending | | INV-safety |
| S1 | Establish isolated config and prove the isolation canary | pending | | C-env |
| S2 | Record run event-stream fixtures and freeze the event contract | pending | | C-events |
| S3 | Add probe spec types and plain/auto effect classifier | pending | | C-probe |
| S4 | Add probe runner and side-effect oracles | pending | | C-runner |
| S5 | Measure layer precedence for primary agents | pending | | |
| S6 | Discriminate subagent resolution hypotheses | pending | | C-hypotheses |
| S7 | Measure edit-rule matching across symlinked and home-relative paths | pending | | |
| S8 | Write engine-semantics findings | pending | | |
| S9 | Draft upstream reproduction for the engine permission defect | pending | | |
| S10 | Verify real opencode-config agents under the real config | pending | | |
| S11 | Propose config mitigation | pending | | |

## Action-frame digest

*(none yet)*

## Discoveries & risks

- **R1 — `XDG_CONFIG_HOME` not honored by the standalone server** (S1). Fall back to running
  scenarios over the real global config, with the canary measuring which real rules leak in, and
  recompute the predictions with the real global as the baseline layer. *additive-reshard.*
- **R2 — Plain run hangs on `ask`** (S2). Every run is wrapped in `timeout`; a timeout with no side
  effect is ASK-or-DENY, resolved by the `--auto` twin run. *internal-continue.*
- **R3 — Child events absent from the parent stream** (S2). Locate them through the API or a
  read-only copy of the database. *internal-continue.*
- **R4 — Project agent override replaces rather than merges** (S10). Copy the real rules verbatim
  into the override; note that this tests the rules, not the merge. *internal-continue.*
- **R5 — High model non-compliance** (many INVALIDs). Raise the probe model to Sonnet for the
  affected rows. *internal-continue.*
- **R6 — Webfetch refuses localhost** (S2). Drop webfetch probes; report as untested.
  *internal-continue.*
- **R7 — OpenCode version changes mid-chain.** Results from different versions are not comparable.
  *destructive-HALT*; the human decides whether to re-run earlier rows. This risk is also the
  reason the measurement rows are not split further: comparability is a session-boundary
  constraint, not only a chain-duration one.
- **R8 — No hypothesis matches the S6 signature.** That is a finding, not a failure. Record the
  observed signature; the engine-semantics boundary juncture decides whether an added probe can
  separate the remaining explanations. *additive-reshard.*
- **R9 — The upstream repro does not reproduce the finding** (S9). The engine findings are then
  under-specified or wrong. Surface as a discovery against C-hypotheses and the findings document
  rather than weakening the repro to make it pass. *additive-reshard.*

## Notes for executors

- **Tier.** All rows are Sonnet. Probe agents run Haiku (`anthropic/claude-haiku-4-5`). The S2
  inflection and all three ◆ boundaries page `@plan-juncture` (Opus) per `/plan-run`. The
  high-judgment work in this chain is contract design and signature adjudication, both of which the
  juncture forks hold; the workers implement against a designed contract.
- **Cost.** About 60–80 Haiku probe runs in total, plus retries. Each live row should state its run
  count in its ledger note.
- **Never** edit `~/.config/opencode` or `~/Source/opencode-config` from inside this chain. S11
  writes a patch *file*; applying it is a separate session in `opencode-config`.
- **Process hygiene.** Kill any HTTP sink and standalone server a row started before it ends, and
  remove `/tmp/opencode/permtest-link-*` symlinks.
- **Anneal denylist** (grepped over `permtest/`, `tests/`, `scripts/`, `docs/` except
  `docs/PLAN.md`, `results/`, `repro/`, `patches/`, `AGENTS.md` at each ◆):
  `\bS[0-9]+\b`, `\bR[0-9]+\b`, `◆`, `sub-track`, `PLAN\.md`, `frozen contract`, `inflection`,
  `juncture`, `action-frame`, `\bCat [ABCI]\b`, `C-env`, `C-events`, `C-probe`, `C-runner`,
  `C-hypotheses`, `INV-safety`. Hypothesis names (`H-doc`, `H-global`, …) and probe letters
  (X/Y/Z/W) are domain vocabulary of the findings and are allowed.
- **First invocation:** `/plan-run docs/PLAN.md halt-at-boundaries` (unproven shard pattern).
