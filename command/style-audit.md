---
description: "[jf] Run /style-audit-code, /style-audit-doc, and /style-audit-test in parallel against a target and merge the findings. Args: [target]."
---

Orchestrate the three style-audit commands against a single target, fanning out to parallel
`@explore` subagents and merging their findings into one report.

User input: $ARGUMENTS

## Argument parsing

1. Treat $ARGUMENTS as the audit target — a file, directory, package, or module path.
2. If $ARGUMENTS is empty, ask me for the target before forking.
3. Resolve the target to an absolute path. If the path doesn't exist, stop and ask.

## What this command does

Each child audit covers a different rule surface:

- `/style-audit-code` — `STYLE-CODE.md` (Python source: mechanical rules + structuring principles).
- `/style-audit-doc` — `STYLE-DOC.md` (inline docstrings, human docs, agent docs, rolling-context
  lifecycle).
- `/style-audit-test` — `STYLE-TEST.md` (test-specific mechanical rules, layered on top of
  `STYLE-CODE.md`).

`/style-audit` runs all three in parallel against the same target and merges their reports. It does
**not** classify files first and route only the matching audit — scopes overlap (docstrings inside
`.py` files trigger both code and doc rules), and a misclassification is worse than letting an
audit return "nothing applicable here" cleanly.

## Status of children

All three child audits are currently STUBs. Until they grow real audit logic, this command's yield
is bounded by what the stubs return — typically a short "STUB: not yet implemented" reply per
child. The orchestration layer (this command) is real, so once the children gain content, this
command produces real output without a rewrite.

## Pre-fork planning (required)

Before invoking the Task tool:

1. Decide the working directory for the subagents — usually the session's CWD, but override if the
   target is rooted elsewhere.
2. Confirm the target is well-formed (exists, readable). If it's a directory, decide whether to
   audit recursively or only the top level — default recursive; ask if ambiguous.
3. If the target obviously has no surface for one of the audits (e.g. a pure markdown doc has no
   Python code or tests), still fan out to all three — the child returns "nothing applicable" and
   the merged report records that.

## Fan-out: three parallel `@explore` forks

Issue three Task-tool calls in a single assistant turn (parallel execution). Each fork uses the
canonical subagent prompt template from AGENTS.md, with the goal scoped to its respective audit.

### Fork 1 — code audit

```
Working directory: <cwd-or-override>
Thoroughness: medium
Read-only: YES. DO NOT EDIT ANY FILES.

GOAL
Audit the target against ~/.config/opencode/STYLE-CODE.md. Emit findings (mechanical rules) and
observations (structuring principles). If the target has no Python source, return "no Python
source in scope" and stop.

INVESTIGATION TASKS
1. Load STYLE-CODE.md as the audit reference.
2. Inspect the target. Skip non-Python files.
3. For each rule in §"Mechanical rules", emit findings with file:line citations.
4. For each section under §"*-structuring principles", surface observations (not findings).

OUTPUT FORMAT
report. Sections: "Findings (mechanical)", "Observations (structural)", "Files audited".
Target: <absolute path>
```

### Fork 2 — doc audit

```
Working directory: <cwd-or-override>
Thoroughness: medium
Read-only: YES. DO NOT EDIT ANY FILES.

GOAL
Audit the target against ~/.config/opencode/STYLE-DOC.md. Cover inline docstrings (rST conformance,
line length, en-UK), human docs, and rolling-context files (PLAN/NOTES lifecycle vs code). If the
target has no doc surface, return "no doc surface in scope" and stop.

INVESTIGATION TASKS
1. Load STYLE-DOC.md as the audit reference.
2. Inspect the target. Cover .py docstrings, .md/.rst files, and rolling-context files if present.
3. Emit proposals only — this audit does not auto-fix.

OUTPUT FORMAT
report. Sections: "Inline doc findings", "Human doc findings", "Rolling-context findings",
"Files audited".
Target: <absolute path>
```

### Fork 3 — test audit

```
Working directory: <cwd-or-override>
Thoroughness: medium
Read-only: YES. DO NOT EDIT ANY FILES.

GOAL
Audit the target against ~/.config/opencode/STYLE-TEST.md (and STYLE-CODE.md as the inherited
base). If the target has no test code, return "no test code in scope" and stop.

INVESTIGATION TASKS
1. Load STYLE-TEST.md and STYLE-CODE.md as audit references.
2. Inspect the target. Limit scope to test files (paths under tests/, files matching test_*.py or
   *_test.py).
3. For each rule in STYLE-TEST.md §"Mechanical rules", emit findings.
4. For each section under §"Test philosophy" and §"Structuring principles", surface observations.
   These sections are TODO — note that explicitly when no concrete rules exist yet.

OUTPUT FORMAT
report. Sections: "Findings (mechanical)", "Observations (structural)", "Files audited".
Target: <absolute path>
```

## Post-fork handling: merge

When all three subagents return:

1. **Summarize each audit in 1–2 sentences** before pasting findings — the user sees the shape
   first, then the detail.
2. **Group findings by file**, not by audit. A `.py` file with a docstring problem and a code
   problem should appear once with both findings nested. This is the dedup the meta-command exists
   for.
3. **Mark cross-audit overlaps explicitly.** When the same line triggers rules in multiple audits,
   tag the finding with all triggering audit names so the user can decide which rule is
   load-bearing.
4. **Distinguish findings from observations.** Findings are mechanical (rule violation, line
   citation); observations are judgment-layer (might be violating a structuring principle, needs
   human review).
5. **Flag any `CAPTURE-CANDIDATE:` tags** that surfaced in any of the three subagent outputs.
6. **End with the user prompt:** "Act on these findings, drill into a specific file, or stop?"
