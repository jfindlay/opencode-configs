---
description: "[jf] Audit a target for code, doc, and test style violations. Args: [target]."
---

Audit a target (file, dir, or package) for code, doc, and test style violations. Forks one
read-only `@explore` per applicable surface; merges findings by file; emits proposals only.

User input: $ARGUMENTS

## Steps

1. **Resolve target.** If $ARGUMENTS is empty, ask. Resolve to an absolute path; stop if it
   doesn't exist. Detect language(s) from project markers (`pyproject.toml` → Python,
   `Cargo.toml` → Rust, `go.mod` → Go; absent markers → ask).

2. **Determine applicable surfaces.** Three possible surfaces:
   - **code** — source files in the detected language.
   - **doc** — inline docstrings, `.md`/`.rst` files, rolling-context files (`PLAN.md`, `NOTES.md`).
   - **test** — test files (paths under `tests/`, `*_test.go`, `test_*.py`, `tests/*.rs`, etc.).

   Skip a surface only when the target has zero footprint for it ("no test files in scope" is a
   valid audit result, not a skip reason).

3. **Fork one `@explore` per applicable surface in parallel.**

   Each fork uses the template from `AGENTS-SUBAGENT-STRATEGY.md`:

   ```
   Working directory: <cwd>
   Thoroughness: medium
   Read-only: YES. DO NOT EDIT ANY FILES.

   GOAL
   Audit <target> against the <surface> styleguide. <Surface-specific instruction below.>

   INVESTIGATION TASKS
   1. Load the reference: <see per-surface below>.
   2. Inspect the target. Scope to <surface files>.
   3. For each rule in §"Mechanical rules", emit findings with file:line.
   4. For structuring/philosophy sections, emit observations (not findings).
   5. For the doc surface only: run the rolling-context lifecycle check per STYLE-DOC.md
      §"Audit checklist".

   OUTPUT FORMAT
   Sections: "Findings (mechanical)", "Observations (structural)", "Files audited".
   Cap at 80 rows. Report total count if more violations exist.
   Target: <absolute path>
   ```

   Per-surface reference:
   - **code**: `STYLE-CODE-<LANG>.md` via `STYLE-CODE.md` index.
   - **doc**: `STYLE-DOC.md` (including `## Audit checklist`).
   - **test**: `STYLE-TEST-<LANG>.md` + `STYLE-CODE-<LANG>.md` as inherited base.

4. **Merge findings by file** (not by surface). When the same line triggers multiple surfaces,
   tag all triggering surface names. Distinguish mechanical findings from structural observations.

5. If Pass A (inline) or rolling-context findings exceed 200 rows total, tooling drift is likely.
   Recommend `/format-loop` first and stop.

6. End: "Act on these findings, drill into a specific file, or stop?"
